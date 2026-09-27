const {
    obtenerUsuario,
    transferirDinero
} = require("../../database/economy");

// ==========================================
// COMANDO #GIVE
// ==========================================

module.exports = async function give(
    sock,
    msg,
    argumentos
) {

    const senderId =
        msg.key.participant ||
        msg.key.remoteJid;

    const chatId =
        msg.key.remoteJid;

    // ======================================
    // BUSCAR DESTINATARIO
    // ======================================

    let destinatario = null;
    let cantidadTexto = null;

    // --------------------------------------
    // SI RESPONDIÓ A UN MENSAJE
    // --------------------------------------

    if (
        msg.message?.extendedTextMessage
            ?.contextInfo
            ?.participant
    ) {

        destinatario =
            msg.message
                .extendedTextMessage
                .contextInfo
                .participant;

        cantidadTexto =
            argumentos[0];

    }

    // --------------------------------------
    // SI USÓ @MENCION
    // --------------------------------------

    else if (
        msg.message?.extendedTextMessage
            ?.contextInfo
            ?.mentionedJid?.length
    ) {

        destinatario =
            msg.message
                .extendedTextMessage
                .contextInfo
                .mentionedJid[0];

        cantidadTexto =
            argumentos.find(
                argumento =>
                    /^\d+$/.test(argumento)
            );

    }

    // ======================================
    // COMPROBAR DESTINATARIO
    // ======================================

    if (!destinatario) {

        await sock.sendMessage(
            chatId,
            {
                text:
`❄️ *ALEXIS RHODES* ❄️

💰 *TRANSFERENCIA DE DINERO*

Usa:

🎴 *#give @usuario cantidad*

Ejemplo:

💎 *#give @duelista 500*

También puedes responder al mensaje de un duelista:

🎴 *#give 500*`
            }
        );

        return;
    }

    // ======================================
    // COMPROBAR CANTIDAD
    // ======================================

    const cantidad =
        Number(cantidadTexto);

    if (
        !Number.isFinite(cantidad) ||
        cantidad <= 0
    ) {

        await sock.sendMessage(
            chatId,
            {
                text:
`❄️ *ALEXIS RHODES* ❄️

💰 La cantidad indicada no es válida.

🎴 Ejemplo:

*#give @duelista 500*`
            }
        );

        return;
    }

    // ======================================
    // NO ENVIARSE A UNO MISMO
    // ======================================

    if (
        destinatario === senderId
    ) {

        await sock.sendMessage(
            chatId,
            {
                text:
`🪽 *Duelista,* no puedes transferirte dinero a ti mismo. 😂

💎 Busca a otro duelista para realizar la transferencia.`
            }
        );

        return;
    }

    // ======================================
    // COMPROBAR SALDO
    // ======================================

    const resultado =
        transferirDinero(
            senderId,
            destinatario,
            cantidad
        );

    if (
        !resultado.success
    ) {

        if (
            resultado.motivo ===
            "dinero_insuficiente"
        ) {

            const usuario =
                obtenerUsuario(senderId);

            await sock.sendMessage(
                chatId,
                {
                    text:
`❄️ *ALEXIS RHODES* ❄️

🪽 *Duelista:* @${senderId.split("@")[0]}

💰 No tienes suficiente dinero.

💎 Tu saldo actual:
*$${usuario.dinero.toLocaleString()}*

🎴 Cantidad solicitada:
*$${cantidad.toLocaleString()}*`,
                    mentions: [
                        senderId
                    ]
                }
            );

            return;
        }

        await sock.sendMessage(
            chatId,
            {
                text:
`❄️ *ALEXIS RHODES* ❄️

❌ No pude realizar la transferencia.

🎴 Revisa la cantidad e inténtalo nuevamente.`
            }
        );

        return;
    }

    // ======================================
    // TRANSFERENCIA COMPLETADA
    // ======================================

    await sock.sendMessage(
        chatId,
        {
            text:
`❄️ *ALEXIS RHODES* ❄️

💎 *TRANSFERENCIA COMPLETADA*

🪽 @${senderId.split("@")[0]}
⬇️
💰 *$${cantidad.toLocaleString()}*
⬇️
🎴 @${destinatario.split("@")[0]}

✨ El dinero ha sido transferido correctamente.

💎 ¡Usen sus fondos sabiamente, duelistas!`,
            mentions: [
                senderId,
                destinatario
            ]
        }
    );
};