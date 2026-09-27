const { obtener } = require("./groupSettings");

function contieneEnlaceWhatsApp(texto) {
    return /(?:https?:\/\/)?(?:chat\.whatsapp\.com\/|whatsapp\.com\/channel\/)/i.test(String(texto || ""));
}

async function revisarAntiLink(sock, msg, texto) {
    const grupo = msg.key.remoteJid;
    const usuario = msg.key.participant;
    if (!String(grupo).endsWith("@g.us") || !usuario || !obtener(grupo).antilink || !contieneEnlaceWhatsApp(texto)) return false;

    try {
        const metadata = await sock.groupMetadata(grupo);
        const participante = (metadata.participants || []).find(persona => persona.id === usuario);
        if (participante?.admin) return false;
        await sock.groupParticipantsUpdate(grupo, [usuario], "remove");
        await sock.sendMessage(grupo, { text: `🛡️ @${usuario.split("@")[0]} fue retirado por compartir un enlace de WhatsApp. La Academia protege esta sala.`, mentions: [usuario] });
        return true;
    } catch (error) {
        await sock.sendMessage(grupo, { text: "❄️ Detecté un enlace de WhatsApp, pero necesito rango de administrador para proteger el grupo." });
        return true;
    }
}

module.exports = { revisarAntiLink, contieneEnlaceWhatsApp };
