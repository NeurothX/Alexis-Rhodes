const {
    obtenerUsuario,
    actualizarUsuario
} = require("../../database/economy");

// ==========================================
// COMANDO #DAILY
// ==========================================

module.exports = async function daily(
    sock,
    msg
) {

    const userId =
        msg.key.participant ||
        msg.key.remoteJid;

    const usuario =
        obtenerUsuario(userId);

    const numero =
        userId.split("@")[0];

    const mencion =
        "@" + numero;

    const ahora =
        Date.now();

    const unDia =
        24 * 60 * 60 * 1000;

    const tiempoPasado =
        ahora - (usuario.ultimoDaily || 0);

    // ======================================
    // COMPROBAR TIEMPO DE ESPERA
    // ======================================

    if (tiempoPasado < unDia) {

        const restante =
            unDia - tiempoPasado;

        const horas =
            Math.floor(
                restante / (60 * 60 * 1000)
            );

        const minutos =
            Math.floor(
                (restante % (60 * 60 * 1000)) /
                (60 * 1000)
            );

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
`❄️ *ALEXIS RHODES* ❄️

🪽 *Duelista:* ${mencion}

💎 Ya reclamaste tu recompensa diaria.

⏳ Podrás volver a reclamar en:

🎴 *${horas} horas y ${minutos} minutos*

🪽 ¡Vuelve cuando termine el tiempo de espera, duelista!`,
                mentions: [
                    userId
                ]
            }
        );

        return;
    }

    // ======================================
    // RECOMPENSA DIARIA
    // ======================================

    const recompensa =
        1000;

    actualizarUsuario(
        userId,
        {
            dinero:
                usuario.dinero + recompensa,

            ultimoDaily:
                ahora
        }
    );

    await sock.sendMessage(
        msg.key.remoteJid,
        {
            text:
`❄️ *ALEXIS RHODES* ❄️

🎉 *¡RECOMPENSA DIARIA OBTENIDA!*

🪽 *Duelista:* ${mencion}

💰 Has recibido:
*+$${recompensa.toLocaleString()}*

💎 Tu nuevo saldo es:
*$${(usuario.dinero + recompensa).toLocaleString()}*

🎴 ¡Regresa mañana por otra recompensa!`,
            mentions: [
                userId
            ]
        }
    );
};