module.exports = async function kick(sock, msg, args) {

    const grupo = msg.key.remoteJid;

    if (!grupo.endsWith("@g.us")) {

        return sock.sendMessage(grupo, {
            text: "❌ Este comando solo funciona en grupos."
        });

    }

    try {

        // Obtener información del grupo
        const metadata = await sock.groupMetadata(grupo);
        const participantes = metadata.participants;

        // Identificar al usuario que ejecutó el comando
        const sender = msg.key.participant || msg.key.remoteJid;

        // Comprobar si es administrador
        const admin = participantes.find(
            p => p.id === sender
        );

        if (!admin?.admin) {

            return sock.sendMessage(grupo, {
                text: "❌ Solo los administradores pueden usar #kick."
            });

        }

        // Obtener usuario mencionado
        const mencionado =
            msg.message?.extendedTextMessage
                ?.contextInfo
                ?.mentionedJid?.[0];

        if (!mencionado) {

            return sock.sendMessage(grupo, {
                text:
                    "❌ Mencioná al usuario que querés expulsar.\n\n" +
                    "Ejemplo:\n" +
                    "#kick @usuario"
            });

        }

        // Comprobar que el usuario mencionado exista en el grupo
        const usuario = participantes.find(
            p => p.id === mencionado
        );

        if (!usuario) {

            return sock.sendMessage(grupo, {
                text: "❌ Ese usuario no está en el grupo."
            });

        }

        // No permitir expulsar administradores
        if (usuario.admin) {

            return sock.sendMessage(grupo, {
                text: "❌ No puedo expulsar a un administrador."
            });

        }

        // Expulsar usuario
        await sock.groupParticipantsUpdate(
            grupo,
            [mencionado],
            "remove"
        );

        // Confirmación
        await sock.sendMessage(grupo, {
            text: "👢 Usuario expulsado correctamente."
        });

    } catch (error) {

        console.log("❌ Error en #kick:", error);

        await sock.sendMessage(grupo, {
            text: "❌ No pude expulsar a ese usuario."
        });

    }

};