const {
    obtenerUsuario,
    actualizarUsuario,
    agregarXP,
    agregarDinero
} = require("../database/economy");


// ==========================================
// ACTUALIZAR PROGRESO DEL DESAFÍO
// ==========================================

async function actualizarDesafio(
    sock,
    msg,
    tipo,
    cantidad = 1
) {

    try {

        const userId =
            msg.key.participant ||
            msg.key.remoteJid;

        const chatId =
            msg.key.remoteJid;


        if (!userId) {
            return;
        }


        const usuario =
            obtenerUsuario(userId);


        // ======================================
        // NO HAY DESAFÍO
        // ======================================

        if (!usuario || !usuario.desafio) {
            return;
        }


        const desafio =
            usuario.desafio;


        // ======================================
        // COMPROBAR TIPO
        // ======================================

        if (
            desafio.tipo !== tipo
        ) {

            return;
        }


        // ======================================
        // DATOS NUMÉRICOS
        // ======================================

        const progresoActual =
            Number(
                desafio.progreso || 0
            );

        const cantidadNumerica =
            Number(cantidad || 0);

        const objetivo =
            Number(
                desafio.objetivo || 0
            );


        if (
            objetivo <= 0
        ) {

            return;
        }


        // ======================================
        // AUMENTAR PROGRESO
        // ======================================

        desafio.progreso =
            progresoActual +
            Math.max(
                0,
                cantidadNumerica
            );


        // ======================================
        // NO SUPERAR OBJETIVO
        // ======================================

        if (
            desafio.progreso >
            objetivo
        ) {

            desafio.progreso =
                objetivo;
        }


        // ======================================
        // TODAVÍA NO SE COMPLETA
        // ======================================

        if (
            desafio.progreso <
            objetivo
        ) {

            actualizarUsuario(
                userId,
                {
                    desafio
                }
            );

            return;
        }


        // ======================================
        // DESAFÍO COMPLETADO
        // ======================================

        const recompensaXP =
            Number(
                desafio.xp || 0
            );

        const recompensaDinero =
            Number(
                desafio.dinero || 0
            );


        // ======================================
        // GUARDAR PROGRESO COMPLETADO
        // ======================================

        actualizarUsuario(
            userId,
            {
                desafio
            }
        );


        // ======================================
        // ENTREGAR XP
        // ======================================

        if (
            recompensaXP > 0
        ) {

            agregarXP(
                userId,
                recompensaXP
            );
        }


        // ======================================
        // ENTREGAR DINERO
        // ======================================

        if (
            recompensaDinero > 0
        ) {

            agregarDinero(
                userId,
                recompensaDinero
            );
        }


        // ======================================
        // ELIMINAR DESAFÍO
        // ======================================

        actualizarUsuario(
            userId,
            {
                desafio: null
            }
        );


        // ======================================
        // NÚMERO PARA MENCIÓN
        // ======================================

        let numero =
            String(userId)
                .replace(
                    "@s.whatsapp.net",
                    ""
                )
                .replace(
                    "@c.us",
                    ""
                )
                .replace(
                    "@lid",
                    ""
                )
                .replace(
                    /\D/g,
                    ""
                );


        // ======================================
        // MENSAJE DE COMPLETADO
        // ======================================

        await sock.sendMessage(
            chatId,
            {
                text:
`❄️ *ALEXIS RHODES* ❄️

🎉 *¡DESAFÍO COMPLETADO!*

🪽 Duelista: @${numero}

🎴 *Misión:*
${desafio.texto}

━━━━━━━━━━━━━━━━

📊 Progreso:
*${objetivo}/${objetivo}*

⭐ XP obtenida:
*+${recompensaXP} XP*

💰 Dinero obtenido:
*+$${recompensaDinero.toLocaleString()}*

🏆 *¡Excelente trabajo, duelista!*

💎 Has demostrado que mereces avanzar en la Academia de Duelos.

❄️ *— Alexis Rhodes*`,
                mentions: [
                    userId
                ]
            }
        );


    } catch (error) {

        console.log("");
        console.log(
            "❌ ERROR ACTUALIZANDO DESAFÍO"
        );

        console.log(error);

        console.log("");
    }
}


// ==========================================
// EXPORTAR
// ==========================================

module.exports = {
    actualizarDesafio
};