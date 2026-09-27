const { agregarDinero, agregarXP } = require("../database/economy");
const { reportarEvento } = require("../systems/arcadeProgression");
const ultimosDuelos = new Map();

function participante(msg) { const key = msg.key || {}; return key.participant || key.participantPn || key.remoteJid; }
module.exports = async function duelo(sock, msg) {
    const chat = msg.key.remoteJid;
    if (!String(chat).endsWith("@g.us")) return sock.sendMessage(chat, { text: "❄️ Los duelos se celebran en grupo. Menciona allí a tu rival." });
    const creador = participante(msg);
    const rival = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.find(id => id !== creador);
    if (!rival) return sock.sendMessage(chat, { text: "🎴 Menciona a tu rival. Ejemplo: *#duelo @usuario*" });
    const clave = [creador, rival].sort().join(":");
    const ahora = Date.now();
    if (ahora - Number(ultimosDuelos.get(clave) || 0) < 10 * 60 * 1000) return sock.sendMessage(chat, { text: "⌛ Este duelo necesita una pausa de 10 minutos antes de repetirse." });
    ultimosDuelos.set(clave, ahora);
    const ganador = Math.random() < 0.5 ? creador : rival;
    agregarDinero(ganador, 150); agregarXP(ganador, 25);
    const perdedor = ganador === creador ? rival : creador;
    reportarEvento({ userId: ganador, name: String(ganador).split("@")[0], gameId: "duelo-academy", type: "victory", eventId: `duelo:${clave}:${ahora}:win` });
    reportarEvento({ userId: perdedor, name: String(perdedor).split("@")[0], gameId: "duelo-academy", type: "defeat", eventId: `duelo:${clave}:${ahora}:loss` });
    await sock.sendMessage(chat, { text: `╭─⚔️ *𝑫𝑼𝑬𝑳𝑶 𝑨𝑪𝑨𝑫𝑬𝑴𝒀*\n│ @${String(creador).split("@")[0]}  ⚔️  @${String(rival).split("@")[0]}\n├────────────────\n│ 🏆 Victoria para @${String(ganador).split("@")[0]}\n│ 💎 Premio: *$150* y *25 XP*\n╰─ 🌹 _Alexis: una victoria elegante nace de la estrategia._`, mentions: [creador, rival, ganador] });
};
