const config = require("../config");

function numero(jid) {
    return String(jid || "")
        .replace(/@.*$/, "")
        .replace(/\D/g, "");
}

function esOwner(msg) {
    const key = msg?.key || {};
    const owner = numero(config.ownerNumber);

    // En chats recientes WhatsApp puede identificar al remitente con un @lid.
    // Baileys conserva el número telefónico real en alguno de estos campos
    // alternos; se comparan todos para que el owner funcione en privado y grupos.
    const identidades = [
        key.participant,
        key.participantAlt,
        key.participantPn,
        key.senderPn,
        key.remoteJid,
        key.remoteJidAlt
    ];

    return identidades.some((jid) => numero(jid) === owner);
}
async function esAdminGrupo(sock, msg) {
    const grupo = msg.key.remoteJid;
    if (!String(grupo).endsWith("@g.us")) return false;
    const sender = msg.key.participant || grupo;
    const metadata = await sock.groupMetadata(grupo);
    return metadata.participants.some(p => p.id === sender && p.admin);
}
module.exports = { esOwner, esAdminGrupo };
