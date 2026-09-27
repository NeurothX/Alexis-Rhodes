const {
    guardarMensaje,
    obtenerMensaje
} = require("../systems/messageStore");

const {
    procesarComando
} = require("./commandHandler");

const {
    actualizarDesafio
} = require("../systems/challengeSystem");

const {
    procesarEleccionPPT
} = require("../systems/rpsSystem");

const {
    revisarAntiSpam
} = require("../systems/antiSpamSystem");

const {
    revisarAntiLink
} = require("../systems/antiLinkSystem");

const {
    obtenerUsuario,
    actualizarUsuario,
    otorgarXPChat,
    registrarActividadGrupo
} = require("../database/economy");

const config =
    require("../config");
const { estaEncendido } = require("../systems/botState");
const { revisarAFK, alternarAFK } = require("../systems/afkSystem");

// WhatsApp puede entregar paquetes pendientes justo al reconectar. Alexis sólo
// ejecuta mensajes recibidos durante esta sesión, y cada ID se procesa una vez.
const inicioHandler = Date.now();
const mensajesProcesados = new Map();
function claveProcesada(msg) { return msg?.key?.remoteJid && msg?.key?.id ? `${msg.key.remoteJid}:${msg.key.id}` : null; }
function timestampMs(msg) {
    const raw = msg?.messageTimestamp;
    const value = Number(typeof raw?.toString === "function" ? raw.toString() : raw);
    return Number.isFinite(value) && value > 0 ? value * (value < 1e11 ? 1000 : 1) : null;
}
function esMensajeActual(msg) {
    const timestamp = timestampMs(msg);
    // Se permite un margen pequeño para diferencias de reloj, pero no mensajes
    // acumulados antes de arrancar/reconectar el bot.
    return !timestamp || timestamp >= inicioHandler - 15_000;
}
function marcarProcesado(msg) {
    const clave = claveProcesada(msg);
    if (!clave || mensajesProcesados.has(clave)) return false;
    mensajesProcesados.set(clave, Date.now());
    if (mensajesProcesados.size > 2_000) mensajesProcesados.delete(mensajesProcesados.keys().next().value);
    return true;
}


// ==========================================
// MANEJAR MENSAJES
// ==========================================

async function manejarMensajes(
    sock,
    messages,
    type
) {

    // ======================================
    // IGNORAR HISTORIAL
    // ======================================

    if (
        type !== "notify"
    ) {

        console.log(
            "📚 Historial ignorado."
        );

        return;
    }


    console.log(
        "📩 Mensaje nuevo recibido."
    );


    // ======================================
    // PROCESAR MENSAJES NUEVOS
    // ======================================

    for (
        const msg of messages
    ) {

        if (!msg) continue;

        if (!msg.message) continue;

        // Evita comandos repetidos y mensajes viejos restaurados por WhatsApp
        // cuando el bot se vuelve a conectar.
        if (!esMensajeActual(msg) || !marcarProcesado(msg)) continue;

        guardarMensaje(msg);


        // ----------------------------------
        // IGNORAR MENSAJES DEL BOT
        // ----------------------------------

        if (
            msg.key.fromMe
        ) {

            continue;
        }

        try {
            const fueSpam = await revisarAntiSpam(sock, msg);
            if (fueSpam) continue;
        } catch (error) {
            console.log("❌ Error revisando antispam:", error);
        }


        // ----------------------------------
        // OBTENER TEXTO
        // ----------------------------------

        const texto =
            obtenerTexto(msg);


        if (!texto) {

            continue;
        }

        try {
            await revisarAFK(sock, msg, texto);
        } catch (error) {
            console.log("❌ Error revisando estado AFK:", error);
        }

        try {
            const fueEnlace = await revisarAntiLink(sock, msg, texto);
            if (fueEnlace) continue;
        } catch (error) {
            console.log("❌ Error revisando anti-enlaces:", error);
        }

        if (
            !estaEncendido() &&
            texto.trim().toLowerCase() !==
                `${config.prefix}prender`
        ) {
            continue;
        }

        const userId = msg.key.participant || msg.key.remoteJid;
        registrarActividadGrupo(userId, msg.key.remoteJid);
        const usuarioXP = obtenerUsuario(userId);
        const ahora = Date.now();
        if (ahora - Number(usuarioXP.ultimoXPChat || 0) >= 45 * 1000) {
            actualizarUsuario(userId, { ultimoXPChat: ahora });
            const resultadoXP = otorgarXPChat(userId, 5);
            if (resultadoXP.otorgada > 0) {
                await actualizarDesafio(sock, msg, "xp", resultadoXP.otorgada);
            }
            if (resultadoXP.debeAvisar) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `💎 Has alcanzado el límite diario de *${resultadoXP.limite} XP* por actividad. Vuelve mañana para seguir entrenando, duelista.`
                });
            }
        }


        console.log(
            "💬 Mensaje: " +
            texto
        );


        // ==================================
        // RESPUESTAS PRIVADAS DEL JUEGO PPT
        // ==================================

        try {

            const fueEleccionPPT =
                await procesarEleccionPPT(
                    sock,
                    msg,
                    texto
                );

            if (fueEleccionPPT) {
                continue;
            }

        } catch (error) {

            console.log("❌ Error en piedra, papel o tijera:");
            console.log(error);
        }


        // ==================================
        // DESAFÍOS DE MENSAJES
        // ==================================

        try {

            await actualizarDesafio(
                sock,
                msg,
                "mensajes",
                1
            );

        } catch (error) {

            console.log(
                "❌ Error actualizando desafío:"
            );

            console.log(error);
        }


        // ==================================
        // DETECTAR COMANDOS
        // ==================================

        if (
            texto.trim().startsWith(
                config.prefix
            )
        ) {

            // ------------------------------
            // DESAFÍO DE COMANDOS
            // ------------------------------

            try {

                await actualizarDesafio(
                    sock,
                    msg,
                    "comandos",
                    1
                );

            } catch (error) {

                console.log(
                    "❌ Error desafío comando:"
                );

                console.log(error);
            }


            // ------------------------------
            // DESAFÍO DE WORK
            // ------------------------------

            if (
                texto
                    .trim()
                    .toLowerCase()
                    .startsWith(
                        config.prefix +
                        "work"
                    )
            ) {

                try {

                    await actualizarDesafio(
                        sock,
                        msg,
                        "work",
                        1
                    );

                } catch (error) {

                    console.log(
                        "❌ Error desafío work:"
                    );

                    console.log(error);
                }
            }
        }


        // ==================================
        // PROCESAR COMANDO
        // ==================================

        try {

            if (texto.trim().toLowerCase().startsWith(`${config.prefix}afk`)) {
                const argsAFK = texto.trim().slice(config.prefix.length).trim().split(/\s+/).slice(1);
                await alternarAFK(sock, msg, argsAFK);
                continue;
            }

            await procesarComando(
                sock,
                msg,
                texto
            );

        } catch (error) {

            console.log("");

            console.log(
                "❌ Error procesando comando:"
            );

            console.log(error);

            console.log("");
        }
    }
}


// ==========================================
// OBTENER TEXTO
// ==========================================

function obtenerTexto(msg) {

    const message =
        msg.message;

    if (!message) {

        return "";
    }


    // ======================================
    // MENSAJE NORMAL
    // ======================================

    if (
        message.conversation
    ) {

        return message.conversation;
    }


    // ======================================
    // TEXTO EXTENDIDO
    // ======================================

    if (
        message.extendedTextMessage?.text
    ) {

        return message
            .extendedTextMessage
            .text;
    }

    // ======================================
    // DESCRIPCIÓN DE IMAGEN (p. ej. #sticker)
    // ======================================

    if (
        message.imageMessage?.caption
    ) {

        return message
            .imageMessage
            .caption;
    }


    // ======================================
    // MENSAJE EFÍMERO
    // ======================================

    if (
        message.ephemeralMessage?.message
    ) {

        const interno =
            message
                .ephemeralMessage
                .message;


        if (
            interno.conversation
        ) {

            return interno.conversation;
        }


        if (
            interno.extendedTextMessage?.text
        ) {

            return interno
                .extendedTextMessage
                .text;
        }

        if (
            interno.imageMessage?.caption
        ) {

            return interno
                .imageMessage
                .caption;
        }
    }


    // ======================================
    // VIEW ONCE
    // ======================================

    if (
        message.viewOnceMessage?.message
    ) {

        const interno =
            message
                .viewOnceMessage
                .message;


        if (
            interno.conversation
        ) {

            return interno.conversation;
        }


        if (
            interno.extendedTextMessage?.text
        ) {

            return interno
                .extendedTextMessage
                .text;
        }
    }


    return "";
}


// ==========================================
// EXPORTAR
// ==========================================

module.exports = {
    manejarMensajes
};
