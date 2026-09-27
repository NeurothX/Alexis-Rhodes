const repo = require("./repo");

module.exports = async function owner(sock, msg) {
    await sock.sendMessage(msg.key.remoteJid, {
        text: `👑 *CREADOR DE ALEXIS RHODES*

🎴 Nombre: Alexis Rhodes
👑 Creador: *NeurothX*
📱 Contacto: +505 8126 1007

📚 *Repositorio oficial*
https://github.com/NeurothX/Alexis-Rhodes

❄️ Gracias por utilizar Alexis Rhodes Bot.`
    });
    await repo.enviar(sock, msg.key.remoteJid);
};
