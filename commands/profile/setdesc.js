const {
    obtenerUsuario,
    actualizarUsuario
} = require("../../database/economy");

// ==========================================
// COMANDO #SETDESC
// ==========================================

module.exports = async function setdesc(
    sock,
    msg,
    argumentos
) {

    const chatId =
        msg.key.remoteJid;

    const userId =
        msg.key.participant ||
        msg.key.remoteJid;

    const numero =
        userId.split("@")[0];

    const mencion =
        "@" + numero;

    // ======================================
    // COMPROBAR DESCRIPCIÓN
    // ======================================

    const descripcion =
        argumentos.join(" ").trim();

    if (!descripcion) {

        await sock.sendMessage(
            chatId,
            {
                text:
`❄️ *ALEXIS RHODES* ❄️

🪽 *Duelista:* ${mencion}

📝 Debes escribir una descripción.

🎴 Ejemplo:

*#setdesc Maestro de los Cyber Angel 💎*`,
                mentions: [
                    userId
                ]
            }
        );

        return;
    }

    // ======================================
    // LÍMITE DE CARACTERES
    // ======================================

    if (
        descripcion.length > 150
    ) {

        await sock.sendMessage(
            chatId,
            {
                text:
`❄️ *ALEXIS RHODES* ❄️

📝 Tu descripción es demasiado larga.

💎 El límite es de *150 caracteres*.

🎴 Inténtalo nuevamente, duelista.`,
                mentions: [
                    userId
                ]
            }
        );

        return;
    }

    // ======================================
    // GUARDAR DESCRIPCIÓN
    // ======================================

    actualizarUsuario(
        userId,
        {
            descripcion
        }
    );

    // ======================================
    // CONFIRMACIÓN
    // ======================================

    await sock.sendMessage(
        chatId,
        {
            text:
`❄️ *ALEXIS RHODES* ❄️

🪽 *Duelista:* ${mencion}

💎 *DESCRIPCIÓN ACTUALIZADA*

📝 Ahora tu perfil dice:

> ${descripcion}

🎴 Usa *#perfil* para verla.

❄️ *— Alexis Rhodes*`,
            mentions: [
                userId
            ]
        }
    );
};