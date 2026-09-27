const { iniciar, responder } = require("../../systems/quizSystem");

function nivel(valor) { const n = Number(valor || 1); return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null; }

async function trivia(sock, msg, args) {
    const tipo = String(args[0] || "").toLowerCase(), dificultad = nivel(args[1]);
    if (!["anime", "videojuegos", "yugioh", "gx", "5ds"].includes(tipo) || !dificultad) return sock.sendMessage(msg.key.remoteJid, { text: "❄️ *Elige tu campo de entrenamiento, duelista.*\n🎮 Usa *#trivia anime|videojuegos|yugioh|gx|5ds 1-5*." });
    await iniciar(sock, msg, tipo, dificultad);
}
function juego(tipo) { return async (sock, msg, args) => { const dificultad = nivel(args[0]); if (!dificultad) return sock.sendMessage(msg.key.remoteJid, { text: `❄️ *Escoge un nivel del 1 al 5, duelista.*\n🎴 Ejemplo: *#${tipo} 3*.` }); await iniciar(sock, msg, tipo, dificultad); }; }
module.exports = {
    matematicas: juego("matematicas"),
    anime: juego("anime"),
    videojuegos: juego("videojuegos"),
    yugioh: juego("yugioh"),
    gx: juego("gx"),
    "5ds": juego("5ds"),
    adivinanza: juego("adivinanza"),
    trivia,
    responder
};
