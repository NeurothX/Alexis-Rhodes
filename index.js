const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers
} = require("@whiskeysockets/baileys");

const P = require("pino");
const readline = require("readline");
const config = require("./config");
const { iniciarRecordatorios } = require("./systems/reminderSystem");
const { iniciarServidorJuegos } = require("./games/server");
const { iniciarTunel } = require("./games/tunnel");
const { setNotifier, formatAchievement, formatValue } = require("./systems/arcadeProgression");
const { obtener: obtenerAjustesGrupo } = require("./systems/groupSettings");
const { obtenerJuego } = require("./games/catalog");
const { obtenerUsuario } = require("./database/economy");

const color = {
    reset: "\x1b[0m",
    cyan: "\x1b[96m",
    azul: "\x1b[94m",
    morado: "\x1b[95m",
    rosa: "\x1b[38;5;213m",
    amarillo: "\x1b[93m",
    verde: "\x1b[92m",
    gris: "\x1b[90m",
    negrita: "\x1b[1m"
};

function pintar(texto, tono) {
    return `${tono}${texto}${color.reset}`;
}


// ==========================================
// HANDLERS
// ==========================================

const {
    procesarComando
} = require("./handlers/commandHandler");

const {
    manejarMensajes
} = require("./handlers/messageHandler");


// ==========================================
// SISTEMA DE MENSAJES
// ==========================================

const {
    obtenerMensaje
} = require("./systems/messageStore");


// ==========================================
// EVENTOS
// ==========================================

const {
    bienvenida
} = require("./events/welcome");

const {
    despedida
} = require("./events/goodbye");


// ==========================================
// VARIABLES
// ==========================================

let reconectando = false;
let arcadeIniciado = false;

// El arcade queda disponible incluso mientras WhatsApp termina de conectar.
function iniciarArcade() {
    if (arcadeIniciado) return;
    arcadeIniciado = true;
    iniciarServidorJuegos();
    iniciarTunel();
}


// ==========================================
// INICIAR BOT
// ==========================================

async function iniciarBot() {

    try {

        iniciarArcade();

        // ======================================
        // AUTENTICACIÓN
        // ======================================

        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(
            "./session"
        );


        // ======================================
        // VERSIÓN DE BAILEYS
        // ======================================

        const {
            version
        } = await fetchLatestBaileysVersion();


        // ======================================
        // CREAR SOCKET
        // ======================================

        const sock =
            makeWASocket({

                version,

                auth: state,

                logger: P({
                    level: "silent"
                }),

                printQRInTerminal: false,

                browser:
                    Browsers.windows(
                        "Chrome"
                    ),

                defaultQueryTimeoutMs:
                    undefined,

                keepAliveIntervalMs:
                    30000,


                // ==================================
                // RECUPERAR MENSAJES
                // ==================================

                getMessage:
                    async (key) => {

                        return obtenerMensaje(
                            key
                        );
                    }
            });

        // Puente entre el servidor web de juegos y WhatsApp. Las recompensas
        // se calculan localmente; el sonido sólo se envía al desbloquear algo.
        setNotifier(async ({ event, user, result }) => {
            const gameName = obtenerJuego(event.gameId)?.name || event.gameId;
            for (const achievement of result.achievements || []) {
                // Los básicos se celebran en la web, pero no generan mensajes
                // del bot. Sólo los secretos o de recompensa alta son anuncio.
                const notable = achievement.secret || ["epico", "legendario", "supremo"].includes(achievement.rarity);
                if (!notable) continue;
                const text = formatAchievement(achievement, gameName);
                try { await sock.sendMessage(event.userId, { text }); } catch (error) { console.log("⚠️ No se pudo avisar logro:", error.message); }
                try { if (require("fs").existsSync(config.arcade.achievementSound)) await sock.sendMessage(event.userId, { audio: require("fs").readFileSync(config.arcade.achievementSound), mimetype: "audio/wav", ptt: true }); } catch (error) { console.log("⚠️ No se pudo enviar sonido:", error.message); }
                // Sólo se anuncian en grupos donde el jugador ya habló con Alexis.
                const groups = obtenerUsuario(event.userId).grupos || [];
                const icon = config.arcade.rewards[achievement.rarity]?.icon || "🏆";
                const groupText = ["🏆 *¡LOGRO DESBLOQUEADO!*", "", `👤 @${String(event.userId).split("@")[0]} consiguió ${icon} *${achievement.name}*`, `🎮 ${gameName}`, `📜 ${achievement.description}`, "", "⚔️ ¡Que alguien intente igualarlo!"].join("\n");
                for (const groupId of groups) {
                    try { await sock.sendMessage(groupId, { text: groupText, mentions: [event.userId] }); }
                    catch (error) { console.log("⚠️ No se pudo anunciar logro en grupo:", error.message); }
                }
            }
            if (result.mission) {
                try { await sock.sendMessage(event.userId, { text: `📜 *¡MISIONES COMPLETADAS!*\n\nHas cumplido el entrenamiento diario de Duel Academy.\n⭐ +500 XP\n💰 +800 monedas` }); } catch (error) { console.log("⚠️ No se pudo avisar misión:", error.message); }
            }
            for (const record of (result.records || []).filter(item => item.scope === "group")) {
                if (!obtenerAjustesGrupo(record.groupId).recordAnnouncements) continue;
                const old = record.previous ? formatValue(record.previous) : "Sin campeón anterior";
                const text = `🏆🔥 *¡NUEVO RÉCORD DE GRUPO!*\n\n👤 @${String(event.userId).split("@")[0]}\n🎮 ${gameName}\n🥇 Nuevo: *${formatValue(record.current)}*\n📉 Anterior: ${old}\n\n⚔️ ¿Quién podrá superar el trono?`;
                try { await sock.sendMessage(record.groupId, { text, mentions: [event.userId] }); } catch (error) { console.log("⚠️ No se pudo anunciar récord:", error.message); }
            }
        });


        // ======================================
        // GUARDAR CREDENCIALES
        // ======================================

        sock.ev.on(
            "creds.update",
            saveCreds
        );


        // ======================================
        // CONTROL DEL PAIRING
        // ======================================

        let pairingRequested =
            false;


        // ======================================
        // CONEXIÓN
        // ======================================

        sock.ev.on(
            "connection.update",
            async (update) => {

                const {
                    connection,
                    lastDisconnect
                } = update;


                // ==================================
                // CONECTANDO
                // ==================================

                if (
                    connection === "connecting"
                ) {

                    console.log(
                        "🔄 Conectando Alexis Rhodes..."
                    );


                    // ==================================
                    // CÓDIGO DE VINCULACIÓN
                    // ==================================

                    if (
                        !sock.authState.creds.registered &&
                        !pairingRequested
                    ) {

                        pairingRequested =
                            true;

                        try {

                            const numero =
                                String(
                                    config.botNumber
                                ).replace(
                                    /[^0-9]/g,
                                    ""
                                );


                            console.log("");

                            console.log(
                                "📱 Solicitando código para " +
                                numero +
                                "..."
                            );

                            console.log("");


                            await new Promise(
                                resolve =>
                                    setTimeout(
                                        resolve,
                                        2000
                                    )
                            );


                            const codigo =
                                await sock.requestPairingCode(
                                    numero
                                );


                            console.log("");

                            console.log(
                                "=============================="
                            );

                            console.log(
                                "      ❄️ ALEXIS RHODES"
                            );

                            console.log(
                                "=============================="
                            );

                            console.log(
                                "🔐 CÓDIGO: " +
                                codigo
                            );

                            console.log(
                                "=============================="
                            );

                            console.log("");

                            console.log(
                                "👉 Introduce este código en WhatsApp."
                            );

                            console.log("");

                        } catch (error) {

                            console.log("");

                            console.log(
                                "❌ Error solicitando código:"
                            );

                            console.log("");

                            console.log(
                                error.message ||
                                error
                            );

                            console.log("");

                            pairingRequested =
                                false;
                        }
                    }
                }


                // ==================================
                // CONECTADO
                // ==================================

                if (
                    connection === "open"
                ) {

                    iniciarRecordatorios(sock);

                    console.log("");

                    console.log(
                        "================================"
                    );

                    console.log(
                        "     ❄️ ALEXIS RHODES ❄️"
                    );

                    console.log(
                        "================================"
                    );

                    console.log(
                        "     🪽 Bot conectado"
                    );

                    console.log(
                        "     💎 Bot funcionando"
                    );

                    console.log(
                        "================================"
                    );

                    console.log("");

                    reconectando =
                        false;
                }


                // ==================================
                // CONEXIÓN CERRADA
                // ==================================

                if (
                    connection === "close"
                ) {

                    const statusCode =
                        lastDisconnect
                            ?.error
                            ?.output
                            ?.statusCode;


                    console.log("");

                    console.log(
                        "⚠️ Conexión cerrada."
                    );

                    console.log(
                        "Código: " +
                        (
                            statusCode ||
                            "desconocido"
                        )
                    );

                    console.log("");


                    const shouldReconnect =
                        statusCode !==
                        DisconnectReason.loggedOut;


                    if (
                        shouldReconnect &&
                        !reconectando
                    ) {

                        reconectando =
                            true;


                        console.log(
                            "🔄 Reconectando Alexis..."
                        );


                        setTimeout(
                            () => {

                                reconectando =
                                    false;

                                iniciarBot();

                            },
                            3000
                        );

                    } else {

                        console.log(
                            "🔴 La sesión fue cerrada."
                        );
                    }
                }
            }
        );


        // ==========================================
        // MENSAJES
        // ==========================================

        sock.ev.on(
            "messages.upsert",
            async ({
                messages,
                type
            }) => {

                await manejarMensajes(
                    sock,
                    messages,
                    type
                );
            }
        );


        // ==========================================
        // EVENTOS DE GRUPO
        // ==========================================

        sock.ev.on(
            "group-participants.update",
            async (update) => {

                try {

                    // ==================================
                    // NUEVO MIEMBRO
                    // ==================================

                    if (
                        update.action === "add"
                    ) {

                        await bienvenida(
                            sock,
                            update
                        );
                    }


                    // ==================================
                    // MIEMBRO SALE
                    // ==================================

                    if (
                        update.action === "remove"
                    ) {

                        await despedida(
                            sock,
                            update
                        );
                    }

                } catch (error) {

                    console.log("");

                    console.log(
                        "❌ Error en evento de grupo:"
                    );

                    console.log(
                        error
                    );

                    console.log("");
                }
            }
        );

    } catch (error) {

        console.log("");

        console.log(
            "❌ Error iniciando Alexis Rhodes:"
        );

        console.log(
            error
        );

        console.log("");


        // ======================================
        // RECONEXIÓN GENERAL
        // ======================================

        if (
            !reconectando
        ) {

            reconectando =
                true;


            setTimeout(
                () => {

                    reconectando =
                        false;

                    iniciarBot();

                },
                5000
            );
        }
    }
}


// ==========================================
// INICIAR ALEXIS
// ==========================================

iniciarArcade();
console.log("");
console.log(pintar("╔══════════════════════════════════════╗", color.cyan));
console.log(pintar("║          ❄️  ALEXIS RHODES  ❄️         ║", color.morado + color.negrita));
console.log(pintar("║          ✦ DUEL ACADEMY BOT ✦         ║", color.rosa));
console.log(pintar("╚══════════════════════════════════════╝", color.cyan));
console.log("");
console.log(pintar(`👑 Creador: ${config.ownerName}`, color.amarillo + color.negrita));
console.log(pintar(`📱 Owner: +${config.ownerNumber}`, color.azul));
console.log(pintar("────────────────────────────────────────", color.gris));
console.log(pintar("✦ Escribe  Alexis  y presiona Enter para iniciar.", color.verde + color.negrita));
console.log(pintar("────────────────────────────────────────", color.gris));
console.log("");

const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

terminal.on("line", (entrada) => {
    const comando = String(entrada || "").trim().toLowerCase();
    if (comando !== "alexis") {
        console.log(pintar("⚠️ Comando no reconocido. Escribe: Alexis", color.amarillo));
        return;
    }

    terminal.close();
    console.log("");
    console.log(pintar("╔══════════════════════════════════════╗", color.verde));
    console.log(pintar("║  ✅ INICIANDO ALEXIS RHODES           ║", color.verde + color.negrita));
    console.log(pintar(`║  👑 Creador: ${config.ownerName.padEnd(24).slice(0, 24)}║`, color.amarillo));
    console.log(pintar("╚══════════════════════════════════════╝", color.verde));
    console.log("");
    iniciarBot();
});
