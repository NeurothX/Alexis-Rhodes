const { esOwner } = require("../../systems/permissions");
const { guardar } = require("../../systems/botState");
module.exports = async function botpower(sock, msg, args) {
    const chatId = msg.key.remoteJid;
    if (!esOwner(msg)) return sock.sendMessage(chatId, { text: "❄️ Solo mi Maestro de las Cartas puede usar este comando." });
    const encendido = String(args[0] || "").toLowerCase() === "prender";
    guardar({ encendido });
    await sock.sendMessage(chatId, { text: encendido ? "💎 He vuelto a la Academia, Maestro de las Cartas." : "❄️ Entendido, Maestro de las Cartas. Quedaré en silencio hasta que uses *#prender*." });
};
