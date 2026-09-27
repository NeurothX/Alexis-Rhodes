const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const config = require("../../config");

function tieneImagen(message) {
    return Boolean(
        message?.imageMessage ||
        message?.ephemeralMessage?.message?.imageMessage
    );
}

module.exports = async function sticker(sock, msg) {
    const chatId = msg.key.remoteJid;

    if (!tieneImagen(msg.message)) {
        await sock.sendMessage(chatId, {
            text: "💎 Envía una imagen con el texto *#sticker* o *#s* en la descripción."
        });
        return;
    }

    try {
        await sock.sendMessage(chatId, { text: "❄️ Preparando tu sticker, duelista..." });
        const imagen = await downloadMediaMessage(msg, "buffer", {});
        const resultado = await new Sticker(imagen, {
            pack: config.botName,
            author: config.ownerName,
            type: StickerTypes.FULL,
            quality: 80
        }).toMessage();

        await sock.sendMessage(chatId, resultado);
    } catch (error) {
        console.log("Error creando sticker:", error);
        await sock.sendMessage(chatId, {
            text: "❄️ No pude convertir esa imagen en sticker. Prueba con una imagen más pequeña o vuelve a enviarla."
        });
    }
};
