const config = require("../config");

function obtenerAutor(msg) {
    const key = msg.key || {};
    return key.participantPn || key.senderPn || key.participant || key.remoteJid || "desconocido";
}

async function enviarAlOwner(sock, msg, args, tipo) {
    const chat = msg.key.remoteJid;
    const detalle = args.join(" ").trim();
    const etiqueta = tipo === "reporte" ? "REPORTE" : "SUGERENCIA";
    if (detalle.length < 8) {
        return sock.sendMessage(chat, {
            text: `❄️ Cuéntame un poco más para enviar tu ${tipo}.\n🎴 Ejemplo: *#${tipo} el comando #anime no responde*`
        });
    }
    if (detalle.length > 700) {
        return sock.sendMessage(chat, { text: "❄️ Tu mensaje es muy largo. Resúmelo en menos de 700 caracteres, duelista." });
    }

    const destino = `${String(config.ownerNumber).replace(/\D/g, "")}@s.whatsapp.net`;
    const autor = obtenerAutor(msg);
    const origen = String(chat).endsWith("@g.us") ? `Grupo: ${chat}` : "Chat privado";
    try {
        await sock.sendMessage(destino, {
            text: `╭─📨 *${etiqueta} PARA ${config.ownerName}*\n│ 👤 De: ${autor}\n│ 📍 ${origen}\n├────────────────\n│ ${detalle}\n╰─ ❄️ Enviado desde Alexis Rhodes Bot`
        });
        await sock.sendMessage(chat, {
            text: `✅ Tu ${tipo} llegó al creador.\n🌹 Gracias, duelista; una buena observación fortalece la Academia.`
        });
    } catch (error) {
        console.log(`❌ No se pudo enviar ${tipo} al owner:`, error.message);
        await sock.sendMessage(chat, { text: "❄️ No pude entregar el mensaje al creador ahora mismo. Inténtalo más tarde." });
    }
}

module.exports = {
    reporte: (sock, msg, args) => enviarAlOwner(sock, msg, args, "reporte"),
    sugerencia: (sock, msg, args) => enviarAlOwner(sock, msg, args, "sugerencia")
};
