const {
    agregarXP
} = require("../database/economy");

// ==========================================
// XP POR ACTIVIDAD
// ==========================================

const XP_POR_MENSAJE = 5;


// ==========================================
// CONTROL DE XP
// ==========================================

const ultimoXP = new Map();


// ==========================================
// DAR XP POR ACTIVIDAD
// ==========================================

function darXPActividad(
    sock,
    msg
) {

    const userId =
        msg.key.participant ||
        msg.key.remoteJid;

    const ahora =
        Date.now();

    const ultimo =
        ultimoXP.get(userId) || 0;

    // Solo gana XP una vez por minuto
    if (
        ahora - ultimo < 60000
    ) {
        return;
    }

    ultimoXP.set(
        userId,
        ahora
    );

    const resultado =
        agregarXP(
            userId,
            XP_POR_MENSAJE
        );

    // ======================================
    // AVISAR SUBIDA DE NIVEL
    // ======================================

    if (
        resultado.subioNivel
    ) {

        const nivel =
            resultado.usuario.nivel;

        const rango =
            resultado.usuario.rango;

        const numero =
            userId.split("@")[0];

        sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
`❄️ *ALEXIS RHODES* ❄️

🎉 *¡SUBIDA DE NIVEL!*

🪽 Duelista: @${numero}

⭐ Nuevo nivel:
*${nivel}*

🏆 Nuevo rango:
*${rango}*

💎 ¡Tu progreso en la Academia de Duelos continúa!

🎴 Sigue participando para desbloquear nuevas recompensas.

❄️ *— Alexis Rhodes*`,
                mentions: [
                    userId
                ]
            }
        );
    }
}


// ==========================================
// EXPORTAR
// ==========================================

module.exports = {
    darXPActividad
};