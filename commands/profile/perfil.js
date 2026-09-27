const fs = require("fs");
const path = require("path");

const {
    obtenerUsuario
} = require("../../database/economy");
const { getProfile: obtenerProgresoArcade } = require("../../systems/arcadeProgression");

const config =
    require("../../config");


// ==========================================
// LIMPIAR NÚMERO
// ==========================================

function limpiarNumero(jid) {

    if (!jid) return "";

    return String(jid)
        .replace("@s.whatsapp.net", "")
        .replace("@c.us", "")
        .replace("@lid", "")
        .replace(/:.*$/, "")
        .replace(/\D/g, "");
}


// ==========================================
// COMANDO #PERFIL
// ==========================================

module.exports = async function perfil(
    sock,
    msg
) {

    try {

        const chatId =
            msg.key.remoteJid;


        // ======================================
        // IDENTIFICAR DUELISTA
        // ======================================

        const userId =
            msg.key.participant ||
            msg.key.remoteJid;


        if (!userId) {
            return;
        }


        const numero =
            limpiarNumero(userId);


        const mencion =
            numero
                ? "@" + numero
                : "Duelista";


        // ======================================
        // OBTENER DATOS ACTUALIZADOS
        // ======================================

        const usuario =
            obtenerUsuario(userId);


        // ======================================
        // FOTO DE PERFIL
        // ======================================

        let fotoPerfil = null;


        try {

            fotoPerfil =
                await sock.profilePictureUrl(
                    userId,
                    "image"
                );

        } catch (error) {

            console.log(
                "⚠️ No se pudo obtener la foto de " +
                numero
            );
        }


        // ======================================
        // FOTO DE RESPALDO
        // ======================================

        const fotoRespaldo =
            path.resolve(
                config.assets.menu
            );


        // ======================================
        // ESTADO MATRIMONIAL
        // ======================================

        let estadoMatrimonial =
            "💙 Soltero/a";


        if (
            usuario.casado &&
            usuario.pareja
        ) {

            const parejaNumero =
                limpiarNumero(
                    usuario.pareja
                );


            estadoMatrimonial =
                parejaNumero
                    ? `💍 Casado/a con @${parejaNumero}`
                    : "💍 Casado/a";
        }


        // ======================================
        // DESCRIPCIÓN
        // ======================================

        const descripcion =
            usuario.descripcion ||
            "Sin descripción.";


        // ======================================
        // DATOS NUMÉRICOS
        // ======================================

        const nivel =
            Number(
                usuario.nivel || 1
            );


        const xp =
            Number(
                usuario.xp || 0
            );


        const dinero =
            Number(
                usuario.dinero || 0
            );


        const banco =
            Number(
                usuario.banco || 0
            );


        const rango =
            usuario.rango ||
            "Duelista Novato";
        const arcade = obtenerProgresoArcade(userId);
        const arcadeStats = arcade.stats || {};
        const supremos = Object.values(arcade.unlocked || {}).filter(logro => logro.rarity === "supremo").length;
        const logrosRecientes = Object.values(arcade.unlocked || {})
            .sort((a, b) => Number(b.unlockedAt || 0) - Number(a.unlockedAt || 0))
            .slice(0, 3)
            .map(logro => `${logro.rarity === "supremo" ? "👑" : "🏆"} ${logro.name}`)
            .join(" · ") || "Aún no hay logros desbloqueados";


        // ======================================
        // TEXTO DEL PERFIL
        // ======================================

        const texto =
`❄️ *ALEXIS RHODES* ❄️

💎 *「 PERFIL DEL DUELISTA 」* 💎

🪽 *Duelista:* ${mencion}

╭───〔 🎴 INFORMACIÓN 〕
│
│ 🏆 Rango: *${rango}*
│ ⭐ Nivel: *${nivel}*
│ ✨ XP: *${xp.toLocaleString()}*
│
╰────────────────

╭───〔 💰 ECONOMÍA 〕
│
│ 💵 Dinero: *$${dinero.toLocaleString()}*
│ 🏦 Banco: *$${banco.toLocaleString()}*
│
╰────────────────

╭───〔 🕹️ ARCADE 〕
│
│ 🎮 Partidas: *${Number(arcadeStats.gamesPlayed || 0).toLocaleString()}*
│ ⚔️ Victorias: *${Number(arcadeStats.wins || 0).toLocaleString()}*
│ 🔥 Mejor racha: *${Number(arcadeStats.bestStreak || 0).toLocaleString()}*
│ 🏅 Logros: *${Object.keys(arcade.unlocked || {}).length}* · 👑 *${supremos}*
│ ✨ Últimos: ${logrosRecientes}
│
╰────────────────

╭───〔 💙 VIDA DEL DUELISTA 〕
│
│ ${estadoMatrimonial}
│ 🪪 Género: *${usuario.genero || "No especificado"}*
│ 📝 ${descripcion}
│
╰────────────────

❄️ *— Alexis Rhodes*`;


        // ======================================
        // MENCIONES
        // ======================================

        const menciones = [];


        if (userId) {

            menciones.push(
                userId
            );
        }


        if (
            usuario.casado &&
            usuario.pareja
        ) {

            menciones.push(
                usuario.pareja
            );
        }


        // ======================================
        // ENVIAR FOTO REAL
        // ======================================

        if (fotoPerfil) {

            await sock.sendMessage(
                chatId,
                {
                    image: {
                        url: fotoPerfil
                    },

                    caption: texto,

                    mentions:
                        menciones
                }
            );

            return;
        }


        // ======================================
        // FOTO DE RESPALDO
        // ======================================

        if (
            fs.existsSync(
                fotoRespaldo
            )
        ) {

            await sock.sendMessage(
                chatId,
                {
                    image:
                        fs.readFileSync(
                            fotoRespaldo
                        ),

                    caption: texto,

                    mentions:
                        menciones
                }
            );

            return;
        }


        // ======================================
        // SIN FOTO
        // ======================================

        await sock.sendMessage(
            chatId,
            {
                text: texto,

                mentions:
                    menciones
            }
        );


    } catch (error) {

        console.log("");
        console.log(
            "❌ ERROR EN #PERFIL"
        );

        console.log(error);
        console.log("");


        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
`❄️ *ALEXIS RHODES* ❄️

❌ No pude cargar tu perfil.`
            }
        );
    }
};
