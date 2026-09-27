const fs = require("fs");
const path = require("path");
const config = require("../config");

// ==========================================
// OBTENER FOTO DE PERFIL
// ==========================================

async function obtenerFoto(sock, jid) {

    try {

        const url =
            await sock.profilePictureUrl(
                jid,
                "image"
            );

        if (url) {

            const respuesta =
                await fetch(url);

            if (respuesta.ok) {

                const datos =
                    await respuesta.arrayBuffer();

                return Buffer.from(datos);
            }
        }

    } catch (error) {

        console.log(
            `⚠️ No se pudo obtener la foto de ${jid}`
        );
    }

    // ==========================================
    // SI NO TIENE FOTO → WELCOME.JPG
    // ==========================================

    try {

        const welcomePath =
            path.resolve(
                config.assets.welcome
            );

        if (fs.existsSync(welcomePath)) {

            return fs.readFileSync(
                welcomePath
            );
        }

        console.log(
            "⚠️ No se encontró assets/welcome.jpg"
        );

    } catch (error) {

        console.log(
            "⚠️ No se pudo cargar welcome.jpg"
        );
    }

    return null;
}


// ==========================================
// OBTENER JID DEL PARTICIPANTE
// ==========================================

function obtenerJid(participante) {

    // Baileys normalmente puede entregar:
    // "50581261007@s.whatsapp.net"

    if (typeof participante === "string") {

        return participante;
    }

    // Algunas versiones pueden entregar un objeto

    if (
        participante &&
        typeof participante === "object"
    ) {

        if (
            typeof participante.id === "string"
        ) {

            return participante.id;
        }

        if (
            typeof participante.jid === "string"
        ) {

            return participante.jid;
        }

        if (
            typeof participante.phoneNumber === "string"
        ) {

            return participante.phoneNumber;
        }

        if (
            typeof participante.phone === "string"
        ) {

            return participante.phone;
        }

        if (
            typeof participante.user === "string"
        ) {

            return (
                participante.user +
                "@s.whatsapp.net"
            );
        }
    }

    return null;
}


// ==========================================
// BIENVENIDA
// ==========================================

async function bienvenida(sock, update) {

    const grupo = update.id;

    if (!update.participants) {

        console.log(
            "⚠️ No se encontraron participantes."
        );

        return;
    }


    for (
        const participanteRaw
        of update.participants
    ) {

        const participante =
            obtenerJid(participanteRaw);


        if (!participante) {

            console.log(
                "⚠️ No se pudo obtener el JID del nuevo participante."
            );

            console.log(
                participanteRaw
            );

            continue;
        }


        const numero =
            participante.split("@")[0];


        const foto =
            await obtenerFoto(
                sock,
                participante
            );


        const texto =
`💎 *BIENVENIDO A LA ACADEMIA DE DUELOS* 💎

🪽 @${numero}, soy *Alexis Rhodes*. Me alegra que hayas llegado.

En esta Academia, cada duelo enseña algo: mantén la cabeza fría, respeta a tus compañeros y confía en tu estrategia.

🎴 Usa *#menu* para conocer los sistemas de la Academia.

❄️ *— Alexis Rhodes, Obelisk Blue*`;


        try {

            if (foto) {

                await sock.sendMessage(
                    grupo,
                    {
                        image: foto,
                        caption: texto,
                        mentions: [
                            participante
                        ]
                    }
                );

            } else {

                // Solo llegará aquí si tampoco
                // se pudo cargar welcome.jpg

                await sock.sendMessage(
                    grupo,
                    {
                        text: texto,
                        mentions: [
                            participante
                        ]
                    }
                );
            }

        } catch (error) {

            console.log(
                "❌ Error enviando mensaje de bienvenida:",
                error
            );
        }
    }
}


// ==========================================
// EXPORTAR
// ==========================================

module.exports = {
    bienvenida
};
