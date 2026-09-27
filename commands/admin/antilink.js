const { esAdminGrupo } = require("../../systems/permissions");
const { obtener, guardar } = require("../../systems/groupSettings");

module.exports = async function antilink(sock, msg, args) {
    const grupo = msg.key.remoteJid;
    if (!String(grupo).endsWith("@g.us")) return sock.sendMessage(grupo, { text: "❄️ Esta función pertenece a la sala de duelo: úsala dentro de un grupo." });
    if (!(await esAdminGrupo(sock, msg))) return sock.sendMessage(grupo, { text: "❄️ Solo los administradores pueden ajustar la defensa anti-enlaces." });
    const opcion = String(args[0] || "").toLowerCase();
    if (!["on", "off"].includes(opcion)) {
        const estado = obtener(grupo).antilink ? "activado" : "desactivado";
        return sock.sendMessage(grupo, { text: `🛡️ Defensa anti-enlaces: *${estado}*.\n🎴 Usa *#antilink on* o *#antilink off* para decidir la estrategia.` });
    }
    guardar(grupo, { antilink: opcion === "on" });
    await sock.sendMessage(grupo, { text: `✅ Defensa anti-enlaces *${opcion === "on" ? "activada" : "desactivada"}*. Los administradores están protegidos.` });
};
