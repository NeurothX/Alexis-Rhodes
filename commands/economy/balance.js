const fs = require("fs");
const path = require("path");

const {
    obtenerUsuario
} = require("../../database/economy");

const config = require("../../config");

// ==========================================
// COMANDO #BALANCE
// ==========================================

module.exports = async function balance(
    sock,
    msg
) {

    const userId =
        msg.key.participant ||
        msg.key.remoteJid;

    const usuario =
        obtenerUsuario(userId);

    // ======================================
    // NÚMERO DEL DUELISTA
    // ======================================

    const numero =
        userId.split("@")[0];

    const mencion =
        "@" + numero;

    // ======================================
    // FOTO DEL DUELISTA
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
    // TEXTO
    // ======================================

    const texto =
`❄️ *ALEXIS RHODES* ❄️

🪽 *DUELISTA:* ${mencion}

💎 *PERFIL DEL DUELISTA*

╭───〔 💰 ECONOMÍA 〕
│
│ 💵 Dinero: *$${usuario.dinero.toLocaleString()}*
│ 🏦 Banco: *$${usuario.banco.toLocaleString()}*
│
╰────────────────

╭───〔 ⭐ PROGRESO 〕
│
│ 🎴 Nivel: *${usuario.nivel}*
│ ✨ XP: *${usuario.xp}*
│ 🏆 Rango: *${usuario.rango}*
│
╰────────────────

🪽 *Sigue participando para conseguir*
*dinero, experiencia y nuevos rangos.*

❄️ *— Alexis Rhodes* ❄️`;

    // ======================================
    // ENVIAR FOTO DE PERFIL
    // ======================================

    if (fotoPerfil) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                image: {
                    url: fotoPerfil
                },
                caption: texto,
                mentions: [
                    userId
                ]
            }
        );

        return;
    }

    // ======================================
    // SI NO TIENE FOTO → FOTO DEL BOT
    // ======================================

    if (
        fs.existsSync(fotoRespaldo)
    ) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                image:
                    fs.readFileSync(
                        fotoRespaldo
                    ),
                caption: texto,
                mentions: [
                    userId
                ]
            }
        );

        return;
    }

    // ======================================
    // SIN NINGUNA FOTO
    // ======================================

    await sock.sendMessage(
        msg.key.remoteJid,
        {
            text: texto,
            mentions: [
                userId
            ]
        }
    );
};