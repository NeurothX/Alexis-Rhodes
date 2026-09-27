const { obtener, guardar } = require("./groupSettings");
const ventanas = new Map();
const MINUTO = 60 * 1000;
const SEMANA = 7 * 24 * 60 * 60 * 1000;
function esSticker(msg) { const m = msg.message || {}; return Boolean(m.stickerMessage || m.ephemeralMessage?.message?.stickerMessage); }
async function revisarAntiSpam(sock, msg) {
    const grupo = msg.key.remoteJid, usuario = msg.key.participant;
    if (!String(grupo).endsWith("@g.us") || !usuario || !esSticker(msg) || !obtener(grupo).antispam) return false;
    const clave = `${grupo}:${usuario}`, ahora = Date.now();
    const recientes = (ventanas.get(clave) || []).filter(t => ahora - t < MINUTO);
    recientes.push(ahora); ventanas.set(clave, recientes);
    if (recientes.length <= 7) return false;
    const ajustes = obtener(grupo), advertencias = { ...(ajustes.advertencias || {}) };
    const actual = advertencias[usuario] || { cantidad: 0, reiniciaEn: ahora + SEMANA };
    if (ahora >= actual.reiniciaEn) { actual.cantidad = 0; actual.reiniciaEn = ahora + SEMANA; }
    actual.cantidad += 1; advertencias[usuario] = actual; guardar(grupo, { advertencias }); ventanas.set(clave, []);
    if (actual.cantidad >= 3) {
        try { await sock.groupParticipantsUpdate(grupo, [usuario], "remove"); delete advertencias[usuario]; guardar(grupo, { advertencias }); await sock.sendMessage(grupo, { text: `🛡️ @${usuario.split("@")[0]} fue retirado tras acumular 3 advertencias de stickers. La Academia mantiene el orden.`, mentions: [usuario] }); }
        catch (error) { await sock.sendMessage(grupo, { text: `❄️ @${usuario.split("@")[0]} llegó a 3 advertencias. Necesito ser administrador para aplicar la medida.`, mentions: [usuario] }); }
        return true;
    }
    await sock.sendMessage(grupo, { text: `⚠️ @${usuario.split("@")[0]}, has enviado más de 7 stickers en un minuto. Advertencia *${actual.cantidad}/3*. Juguemos con elegancia; el contador se reinicia semanalmente.`, mentions: [usuario] });
    return true;
}
module.exports = { revisarAntiSpam };
