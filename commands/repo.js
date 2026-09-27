const REPOSITORIO = "https://github.com/NeurothX/Alexis-Rhodes";

async function enviarRepositorio(sock, chatId) {
    // Fuerza una vista previa nativa de WhatsApp: la tarjeta completa se puede
    // tocar para abrir GitHub aunque el cliente no pinte las URLs de azul.
    await sock.sendMessage(chatId, {
        text: `📚 Repositorio oficial de Alexis Rhodes Bot\n${REPOSITORIO}`,
        linkPreview: {
            "matched-text": REPOSITORIO,
            "canonical-url": REPOSITORIO,
            title: "NeurothX · Alexis Rhodes Bot",
            description: "Toca esta tarjeta para abrir el repositorio oficial."
        }
    });
}

async function repo(sock, msg) { await enviarRepositorio(sock, msg.key.remoteJid); }

module.exports = repo;
module.exports.url = REPOSITORIO;
module.exports.enviar = enviarRepositorio;
