module.exports = async function add(sock, msg, args) {

    const grupo = msg.key.remoteJid;

    if (!grupo || !grupo.endsWith("@g.us")) {
        return sock.sendMessage(grupo, {
            text: "❌ Este comando solo funciona en grupos."
        });
    }

    try {

        // ==============================
        // INFORMACIÓN DEL GRUPO
        // ==============================

        const metadata = await sock.groupMetadata(grupo);
        const participantes = metadata.participants;

        // ==============================
        // COMPROBAR ADMIN
        // ==============================

        const sender = msg.key.participant || msg.key.remoteJid;

        const admin = participantes.find(
            p => p.id === sender
        );

        if (!admin?.admin) {
            return sock.sendMessage(grupo, {
                text: "❌ Solo los administradores pueden usar #add."
            });
        }

        // ==============================
        // OBTENER NÚMERO
        // ==============================

        let numero = args?.[0];

        if (!numero) {
            return sock.sendMessage(grupo, {
                text:
                    "❌ Escribí el número que querés añadir.\n\n" +
                    "Ejemplo:\n" +
                    "#add 50588888888"
            });
        }

        // Quitar +, espacios, guiones, etc.
        numero = String(numero).replace(/[^0-9]/g, "");

        if (numero.length < 10) {
            return sock.sendMessage(grupo, {
                text: "❌ El número parece incorrecto."
            });
        }

        const jid = numero + "@s.whatsapp.net";

        console.log("📱 Intentando añadir:", jid);

        // ==============================
        // COMPROBAR SI YA ESTÁ
        // ==============================

        const yaEsta = participantes.find(
            p => p.id === jid
        );

        if (yaEsta) {
            return sock.sendMessage(grupo, {
                text: "⚠️ Ese número ya está en el grupo."
            });
        }

        // ==============================
        // INTENTAR AÑADIR
        // ==============================

        try {

            const resultado = await sock.groupParticipantsUpdate(
                grupo,
                [jid],
                "add"
            );

            console.log(
                "📋 Resultado de #add:",
                JSON.stringify(resultado, null, 2)
            );

            const respuesta = resultado?.[0];

            // Añadido correctamente
            if (
                respuesta?.status === "200" ||
                respuesta?.status === 200
            ) {

                return sock.sendMessage(grupo, {
                    text: `✅ @${numero} fue añadido correctamente.`,
                    mentions: [jid]
                });

            }

            // ==============================
            // SI WHATSAPP DEVUELVE 403
            // ==============================

            if (
                respuesta?.status === "403" ||
                respuesta?.status === 403
            ) {

                console.log(
                    "⚠️ WhatsApp rechazó el añadido. Generando enlace..."
                );

                const enlace = await sock.groupInviteCode(grupo);

                const link =
                    "https://chat.whatsapp.com/" + enlace;

                return sock.sendMessage(grupo, {
                    text:
                        `⚠️ WhatsApp no permitió añadir directamente a @${numero}.\n\n` +
                        `🔗 *Enlace de invitación del grupo:*\n\n` +
                        `${link}\n\n` +
                        `📌 Mandale este enlace para que pueda entrar al grupo.`,
                    mentions: [jid]
                });

            }

            // Otro resultado
            return sock.sendMessage(grupo, {
                text:
                    `⚠️ WhatsApp no confirmó que @${numero} haya sido añadido.\n\n` +
                    `Código: ${respuesta?.status || "desconocido"}`,
                mentions: [jid]
            });

        } catch (error) {

            console.log("❌ Error intentando añadir:", error);

            // ==============================
            // FALLBACK A ENLACE
            // ==============================

            try {

                const enlace = await sock.groupInviteCode(grupo);

                const link =
                    "https://chat.whatsapp.com/" + enlace;

                return sock.sendMessage(grupo, {
                    text:
                        `⚠️ No pude añadir directamente a @${numero}.\n\n` +
                        `🔗 *Enlace de invitación:*\n\n` +
                        `${link}\n\n` +
                        `📌 Mandale el enlace para que pueda entrar.`,
                    mentions: [jid]
                });

            } catch (linkError) {

                console.log(
                    "❌ No pude obtener el enlace:",
                    linkError
                );

                return sock.sendMessage(grupo, {
                    text:
                        "❌ No pude añadir al usuario ni obtener el enlace de invitación."
                });

            }

        }

    } catch (error) {

        console.log("❌ Error general en #add:");
        console.log(error);

        await sock.sendMessage(grupo, {
            text: "❌ Ocurrió un error al ejecutar #add."
        });

    }

};