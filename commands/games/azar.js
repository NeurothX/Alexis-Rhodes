const { agregarDinero, agregarXP } = require("../../database/economy");
function usuario(msg) { return msg.key.participant || msg.key.remoteJid; }
module.exports = async function azar(sock, msg, args, tipo) {
    const id = usuario(msg), chat = msg.key.remoteJid;
    if (tipo === "dado") { const n = Math.floor(Math.random() * 6) + 1, premio = n === 6 ? 250 : 25; agregarDinero(id, premio); agregarXP(id, 5); return sock.sendMessage(chat, { text: `🎲 *Resultado: ${n}*\n${n === 6 ? "💎 ¡Una jugada impecable, duelista!" : "🌹 La fortuna favorece a quien sigue intentándolo."}\nGanaste *$${premio}* y *5 XP*.` }); }
    const cara = Math.random() < 0.5 ? "cara" : "cruz", elegido = String(args[0] || "").toLowerCase();
    if (!["cara", "cruz"].includes(elegido)) return sock.sendMessage(chat, { text: "❄️ *Debes elegir tu carta, duelista:* *cara* o *cruz*.\n🪙 Ejemplo: *#moneda cara*" });
    const premio = elegido === cara ? 150 : 10; agregarDinero(id, premio); agregarXP(id, 5);
    await sock.sendMessage(chat, { text: `🪙 *Salió ${cara}.*\n${elegido === cara ? "💎 ¡Buena lectura del destino!" : "🌹 No esta vez; conserva la calma y vuelve a intentarlo."}\nGanaste *$${premio}* y *5 XP*.` });
};
