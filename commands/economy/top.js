const { obtenerTopGlobal, obtenerTopGrupo } = require("../../database/economy");

function etiqueta(usuario) {
    const numero = String(usuario.id || "").split("@")[0].replace(/:\d+$/, "");
    return numero ? `@${numero}` : "Duelista";
}

module.exports = async function top(sock, msg, args) {
    const chat = msg.key.remoteJid;
    const opcion = String(args[0] || "global").toLowerCase();
    if (!["global", "grupo"].includes(opcion)) return sock.sendMessage(chat, { text: "❄️ Usa *#top global* o *#top grupo*." });
    if (opcion === "grupo" && !String(chat).endsWith("@g.us")) return sock.sendMessage(chat, { text: "❄️ *#top grupo* solo se puede ver dentro de un grupo." });

    let base = obtenerTopGlobal();
    if (opcion === "grupo") {
        try {
            const metadata = await sock.groupMetadata(chat);
            const miembros = new Set((metadata.participants || []).map(participante => participante.id));
            base = base.filter(usuario => miembros.has(usuario.id) || (Array.isArray(usuario.grupos) && usuario.grupos.includes(chat)));
        } catch (error) {
            base = obtenerTopGrupo(chat);
        }
    }
    const usuarios = base
        .sort((a, b) => Number(b.dinero || 0) - Number(a.dinero || 0)).slice(0, 10);
    const medallas = ["🥇", "🥈", "🥉"];
    const filas = usuarios.length ? usuarios.map((usuario, indice) =>
        `${medallas[indice] || `🏅 ${indice + 1}.`} ${etiqueta(usuario)} — *$${Number(usuario.dinero || 0).toLocaleString()}* · Nivel ${usuario.nivel || 1}`
    ).join("\n") : "Aún no hay duelistas registrados en este ranking.";
    await sock.sendMessage(chat, { text: `🏆 *TOP ${opcion.toUpperCase()}*\n\n${filas}\n\nUsa *#top global* o *#top grupo*.`, mentions: usuarios.map(u => u.id).filter(Boolean) });
};
