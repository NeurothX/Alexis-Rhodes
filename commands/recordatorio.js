const { crearRecordatorio } = require("../systems/reminderSystem");

function parsearTiempo(valor) {
    const match = String(valor || "").toLowerCase().match(/^(\d+)(m|h|d)$/);
    if (!match) return null;
    const cantidad = Number(match[1]);
    const factor = { m: 60000, h: 3600000, d: 86400000 }[match[2]];
    const ms = cantidad * factor;
    return ms >= 60000 && ms <= 7 * 86400000 ? ms : null;
}
module.exports = async function recordatorio(sock, msg, args) {
    const chat = msg.key.remoteJid;
    const demora = parsearTiempo(args[0]);
    const texto = args.slice(1).join(" ").trim();
    if (!demora || !texto) return sock.sendMessage(chat, { text: "⏰ Usa *#recordatorio 10m mensaje*, *#recordatorio 2h mensaje* o *#recordatorio 1d mensaje*.\n❄️ El límite es de 7 días." });
    if (texto.length > 500) return sock.sendMessage(chat, { text: "❄️ El recordatorio debe tener menos de 500 caracteres." });
    const usuario = msg.key.participant || msg.key.participantPn || msg.key.remoteJid;
    crearRecordatorio(sock, chat, usuario, Date.now() + demora, texto);
    await sock.sendMessage(chat, { text: `✅ Recordatorio preparado para dentro de *${args[0]}*.\n🌹 No dejaré que se te escape esa jugada.` });
};
