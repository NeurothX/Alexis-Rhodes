module.exports = async function ping(sock, msg) {
    const inicio = Date.now();
    await sock.sendMessage(msg.key.remoteJid, {
        text: `╭─❄️ *𝑺𝑰𝑺𝑻𝑬𝑴𝑨 𝑶𝑩𝑬𝑳𝑰𝑺𝑲 𝑩𝑳𝑼𝑬*
│ 💎 Estoy aquí, duelista.
│ ⚡ Respuesta: *${Date.now() - inicio} ms*
╰─ 🎴 _Alexis Rhodes lista para el próximo duelo._`
    });
};
