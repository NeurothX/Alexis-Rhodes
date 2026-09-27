const { esAdminGrupo } = require("../../systems/permissions");

module.exports = async function tagall(sock, msg, args) {
    const chat = msg.key.remoteJid;
    if (!String(chat).endsWith("@g.us")) return sock.sendMessage(chat, { text: "❄️ *#tagall* solo puede reunir duelistas dentro de un grupo." });
    if (!(await esAdminGrupo(sock, msg))) return sock.sendMessage(chat, { text: "❄️ Solo los administradores pueden llamar a toda la Academia." });
    try {
        const metadata = await sock.groupMetadata(chat);
        const miembros = metadata.participants.map(participante => participante.id).filter(Boolean);
        const anuncio = args.join(" ").trim() || "Reunión de duelistas. ¡Atención, por favor!";
        await sock.sendMessage(chat, {
            text: `╭─📣 *𝑳𝑳𝑨𝑴𝑨𝑫𝑶 𝑫𝑬 𝑳𝑨 𝑨𝑪𝑨𝑫𝑬𝑴𝑰𝑨*\n│ ${anuncio.slice(0, 600)}\n╰─ ❄️ _Alexis Rhodes solicita su atención._`,
            mentions: miembros
        });
    } catch (error) {
        console.log("❌ Error en #tagall:", error.message);
        await sock.sendMessage(chat, { text: "❄️ No pude reunir a los participantes. Verifica que siga siendo administradora." });
    }
};
