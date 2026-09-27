const { esAdminGrupo } = require("../../systems/permissions");
const { obtener, guardar } = require("../../systems/groupSettings");
module.exports = async function antispam(sock, msg, args) {
    const grupo = msg.key.remoteJid;
    if (!String(grupo).endsWith("@g.us")) return sock.sendMessage(grupo, { text: "❄️ Esta función pertenece a la sala de duelo: úsala dentro de un grupo." });
    if (!(await esAdminGrupo(sock, msg))) return sock.sendMessage(grupo, { text: "❄️ Solo los administradores pueden ajustar el escudo antispam." });
    const opcion = String(args[0] || "").toLowerCase();
    if (opcion !== "on" && opcion !== "off") { const activo = obtener(grupo).antispam ? "activado" : "desactivado"; return sock.sendMessage(grupo, { text: `🛡️ Escudo antispam: *${activo}*. Usa *#antispam on* o *#antispam off*.` }); }
    guardar(grupo, { antispam: opcion === "on" });
    await sock.sendMessage(grupo, { text: `✅ Escudo antispam de stickers *${opcion === "on" ? "activado" : "desactivado"}*. Más de 7 stickers por minuto genera una advertencia; 3 advertencias expulsan al usuario.` });
};
