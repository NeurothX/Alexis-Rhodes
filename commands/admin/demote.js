module.exports = async function demote(sock, msg) {

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
            text: "❌ Solo los administradores pueden usar #demote."
        });
    }

    const mencionado =
        msg.message?.extendedTextMessage
            ?.contextInfo
            ?.mentionedJid?.[0];

    if (!mencionado) {
        return sock.sendMessage(grupo, {
            text: "⬇️ Mencioná al administrador que querés degradar.\n\nEjemplo:\n#demote @usuario"
        });
    }

    try {

        await sock.groupParticipantsUpdate(
            grupo,
            [mencionado],
            "demote"
        );

        await sock.sendMessage(grupo, {
            text: `⬇️ @${mencionado.split("@")[0]} ya no es administrador.\n🎴 Alexis: cada cambio en el campo exige una nueva estrategia.`,
            mentions: [mencionado]
        });

    } catch (error) {

        console.log("Error en #demote:", error);

        await sock.sendMessage(grupo, {
            text: "❌ No pude quitarle el administrador."
        });
    }
};
