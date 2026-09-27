module.exports = async function owner(sock, msg) {
    await sock.sendMessage(msg.key.remoteJid, {
        text: `👑 *CREADOR DE ALEXIS RHODES*

🎴 Nombre: Alexis Rhodes
👑 Creador: +505 8126 1007

❄️ Gracias por utilizar Alexis Rhodes Bot.`
    });
};
