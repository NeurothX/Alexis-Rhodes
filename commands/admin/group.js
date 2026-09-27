const { esAdminGrupo } = require("../../systems/permissions");

module.exports = async function configurarGrupo(sock, msg, modo) {
    const grupo = msg.key.remoteJid;

    if (!String(grupo).endsWith("@g.us")) {
        return sock.sendMessage(grupo, { text: "❄️ Este comando solo funciona en grupos." });
    }

    if (!(await esAdminGrupo(sock, msg))) {
        return sock.sendMessage(grupo, { text: "❄️ Solo los administradores del grupo pueden usar este comando." });
    }

    const cerrar = modo === "cerrar";

    try {
        await sock.groupSettingUpdate(grupo, cerrar ? "announcement" : "not_announcement");
        await sock.sendMessage(grupo, {
            text: cerrar
                ? "🔒 *Grupo cerrado.* Solo los administradores pueden enviar mensajes."
                : "🔓 *Grupo abierto.* Todos los participantes pueden enviar mensajes."
        });
    } catch (error) {
        await sock.sendMessage(grupo, {
            text: "❄️ No pude cambiar el ajuste. Asegúrate de que el bot sea administrador del grupo."
        });
    }
};
