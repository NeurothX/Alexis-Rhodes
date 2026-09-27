module.exports = async function promote(sock, msg) {

    const grupo = msg.key.remoteJid;

    if (!grupo.endsWith("@g.us")) {
        return sock.sendMessage(grupo, {
            text: "❌ Este comando solo funciona en grupos."
        });
    }

    const metadata = await sock.groupMetadata(grupo);

    const participantes = metadata.participants;

    const sender = msg.key.participant || msg.key.remoteJid;

    const admin = participantes.find(
        p => p.id === sender
    );

    if (!admin?.admin) {
        return sock.sendMessage(grupo, {
            text: "❌ Solo los administradores pueden usar #promote."
        });
    }

    const mencionado =
        msg.message?.extendedTextMessage
            ?.contextInfo
            ?.mentionedJid?.[0];

    if (!mencionado) {
        return sock.sendMessage(grupo, {
            text: "⬆️ Mencioná al usuario que querés hacer administrador.\n\nEjemplo:\n#promote @usuario"
        });
    }

    try {

        await sock.groupParticipantsUpdate(
            grupo,
            [mencionado],
            "promote"
        );

        await sock.sendMessage(grupo, {
            text: `👑 @${mencionado.split("@")[0]} fue promovido a administrador.\n🌹 Alexis: usa ese rango con elegancia y responsabilidad.`,
            mentions: [mencionado]
        });

    } catch (error) {

        console.log("Error en #promote:", error);

        await sock.sendMessage(grupo, {
            text: "❌ No pude promover a ese usuario."
        });
    }
};
