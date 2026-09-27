const {
    obtenerUsuario,
    actualizarUsuario
} = require("../../database/economy");

function participante(msg) {
    return msg.key.participant || msg.key.participantPn || msg.key.remoteJid;
}

function numero(userId) {
    return String(userId || "")
        .replace(/@.*$/, "")
        .replace(/:.*$/, "")
        .replace(/\D/g, "");
}

function mencionar(userId) {
    const telefono = numero(userId);
    return telefono ? `@${telefono}` : "Duelista";
}

function destinatario(msg, emisor) {
    const contexto = msg.message?.extendedTextMessage?.contextInfo;
    const citado = contexto?.participant;
    const mencionado = contexto?.mentionedJid?.find(id => id !== emisor);
    return citado || mencionado || null;
}

async function enviar(sock, chatId, text, mentions = []) {
    await sock.sendMessage(chatId, { text, mentions: [...new Set(mentions.filter(Boolean))] });
}

async function genero(sock, msg, argumentos) {
    const chatId = msg.key.remoteJid;
    const userId = participante(msg);
    const valor = argumentos.join(" ").trim().toLowerCase();
    const opciones = {
        hombre: "Hombre",
        mujer: "Mujer",
        "no binario": "No binario",
        otro: "Otro",
        "prefiero no decir": "Prefiero no decir"
    };

    if (!opciones[valor]) {
        return enviar(sock, chatId,
`❄️ *ALEXIS RHODES* ❄️

🪪 Elige cómo quieres mostrarte en tu perfil:

*#genero hombre*
*#genero mujer*
*#genero no binario*
*#genero otro*
*#genero prefiero no decir*`);
    }

    actualizarUsuario(userId, { genero: opciones[valor] });
    return enviar(sock, chatId,
`💎 Perfil actualizado, ${mencionar(userId)}.

🪪 Género: *${opciones[valor]}*
🎴 Usa *#perfil* para verlo.`, [userId]);
}

async function casarse(sock, msg) {
    const chatId = msg.key.remoteJid;
    const emisor = participante(msg);
    const receptor = destinatario(msg, emisor);
    const usuario = obtenerUsuario(emisor);

    if (!receptor) {
        return enviar(sock, chatId, "💍 Menciona o responde a la persona que quieres pedir matrimonio.\n\nEjemplo: *#casarse @usuario*");
    }
    if (receptor === emisor) return enviar(sock, chatId, "💙 No puedes pedirte matrimonio a ti mismo/a, duelista.");
    if (usuario.casado) return enviar(sock, chatId, `💍 Ya estás casado/a con ${mencionar(usuario.pareja)}.`, [emisor, usuario.pareja]);

    const pareja = obtenerUsuario(receptor);
    if (pareja.casado) return enviar(sock, chatId, `💍 ${mencionar(receptor)} ya está casado/a.`, [receptor]);

    actualizarUsuario(receptor, { propuestaMatrimonio: emisor });
    return enviar(sock, chatId,
`💍 *PROPUESTA DE MATRIMONIO*

${mencionar(emisor)} le ha pedido matrimonio a ${mencionar(receptor)}. 🌹

${mencionar(receptor)}, responde con *#aceptar* para decir sí o *#rechazar* para declinar.`, [emisor, receptor]);
}

async function responderPropuesta(sock, msg, aceptar) {
    const chatId = msg.key.remoteJid;
    const receptor = participante(msg);
    const usuario = obtenerUsuario(receptor);
    const proponente = usuario.propuestaMatrimonio;

    if (!proponente) return enviar(sock, chatId, "💌 No tienes ninguna propuesta de matrimonio pendiente.");

    const solicitante = obtenerUsuario(proponente);
    if (!aceptar) {
        actualizarUsuario(receptor, { propuestaMatrimonio: null });
        return enviar(sock, chatId,
`💔 ${mencionar(receptor)} ha rechazado la propuesta de ${mencionar(proponente)}.`, [receptor, proponente]);
    }

    if (usuario.casado || solicitante.casado) {
        actualizarUsuario(receptor, { propuestaMatrimonio: null });
        return enviar(sock, chatId, "💔 La propuesta ya no es válida porque uno de los dos ya está casado/a.", [receptor, proponente]);
    }

    actualizarUsuario(proponente, { casado: true, pareja: receptor, propuestaMatrimonio: null });
    actualizarUsuario(receptor, { casado: true, pareja: proponente, propuestaMatrimonio: null });
    return enviar(sock, chatId,
`💍 *¡BODAS EN DUEL ACADEMY!*

${mencionar(proponente)} y ${mencionar(receptor)} ahora están casados/as. 💙

✨ Que su vínculo sea tan fuerte como sus mejores cartas.`, [proponente, receptor]);
}

async function divorcio(sock, msg) {
    const chatId = msg.key.remoteJid;
    const userId = participante(msg);
    const usuario = obtenerUsuario(userId);
    if (!usuario.casado || !usuario.pareja) return enviar(sock, chatId, "💙 No tienes un matrimonio registrado en tu perfil.");

    const parejaId = usuario.pareja;
    actualizarUsuario(userId, { casado: false, pareja: null });
    const pareja = obtenerUsuario(parejaId);
    if (pareja.pareja === userId) actualizarUsuario(parejaId, { casado: false, pareja: null });

    return enviar(sock, chatId,
`💔 ${mencionar(userId)} y ${mencionar(parejaId)} han terminado su matrimonio.

🌙 Alexis espera que ambos encuentren tranquilidad.`, [userId, parejaId]);
}

function accion(nombre, emoji, verbo) {
    return async (sock, msg) => {
        const chatId = msg.key.remoteJid;
        const emisor = participante(msg);
        const receptor = destinatario(msg, emisor);
        if (!receptor) return enviar(sock, chatId, `${emoji} Menciona o responde a un duelista para ${nombre}.`);
        if (receptor === emisor) return enviar(sock, chatId, `${emoji} Eso sería un poco difícil, ${mencionar(emisor)}.`, [emisor]);
        return enviar(sock, chatId, `${emoji} ${mencionar(emisor)} ${verbo} a ${mencionar(receptor)}.`, [emisor, receptor]);
    };
}

module.exports = {
    genero,
    casarse,
    aceptar: (sock, msg) => responderPropuesta(sock, msg, true),
    rechazar: (sock, msg) => responderPropuesta(sock, msg, false),
    divorcio,
    abrazo: accion("dar un abrazo", "🤗", "le da un abrazo"),
    beso: accion("dar un beso", "💋", "le da un beso")
};
