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
    // SI NO TIENE FOTO → GOODBYE.JPG
    // ==========================================

    try {

        const goodbyePath =
            path.resolve(
                config.assets.goodbye
            );

        if (fs.existsSync(goodbyePath)) {

            return fs.readFileSync(
                goodbyePath
            );
        }

        console.log(
            "⚠️ No se encontró assets/goodbye.jpg"
        );

    } catch (error) {

        console.log(
            "⚠️ No se pudo cargar goodbye.jpg"
        );
    }

    return null;
}


// ==========================================
// OBTENER JID DEL PARTICIPANTE
// ==========================================

function obtenerJid(participante) {

    if (typeof participante === "string") {

        return participante;
    }


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
// DESPEDIDA
// ==========================================

async function despedida(sock, update) {

    const grupo =
        update.id;


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
            obtenerJid(
                participanteRaw
            );


        if (!participante) {

            console.log(
                "⚠️ No se pudo obtener el JID del participante que salió."
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
`💎 *UN DUELISTA PARTE DE LA ACADEMIA* 💎

🪽 @${numero} ha seguido su propio camino.

Espero que las lecciones de cada duelo le acompañen. Las puertas de la Academia estarán abiertas si decide volver.

❄️ *— Alexis Rhodes*`;


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
                "❌ Error enviando mensaje de despedida:"
            );

            console.log(error);
        }
    }
}


// ==========================================
// EXPORTAR
// ==========================================

module.exports = {
    despedida
};
