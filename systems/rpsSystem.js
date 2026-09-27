const partidas = new Map();
const TIEMPO_LIMITE = 5 * 60 * 1000;

function esGrupo(chatId) {
    return String(chatId || "").endsWith("@g.us");
}

function nombreMencion(jid) {
    return "@" + String(jid).split("@")[0].replace(/\D/g, "");
}

function limpiarPartidasVencidas() {
    const ahora = Date.now();
    for (const [id, partida] of partidas) {
        if (ahora - partida.creadaEn > TIEMPO_LIMITE) partidas.delete(id);
    }
}

function usuarioEnPartida(userId) {
    return [...partidas.values()].some(partida => partida.jugadores.includes(userId));
}

function decidirGanador(a, b) {
    if (a === b) return "empate";
    return (a === "piedra" && b === "tijera") ||
        (a === "papel" && b === "piedra") ||
        (a === "tijera" && b === "papel") ? "a" : "b";
}

async function iniciarPiedraPapelTijera(sock, msg) {
    limpiarPartidasVencidas();
    const chatId = msg.key.remoteJid;
    const creador = msg.key.participant || chatId;
    const oponente = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

    if (!esGrupo(chatId)) {
        await sock.sendMessage(chatId, { text: "❄️ Este juego se inicia en un grupo: usa *#ppt @usuario*." });
        return;
    }
    if (!oponente) {
        await sock.sendMessage(chatId, { text: "❄️ Menciona a tu rival. Ejemplo: *#ppt @usuario*" });
        return;
    }
    if (oponente === creador) {
        await sock.sendMessage(chatId, { text: "❄️ Debes mencionar a otro duelista para jugar." });
        return;
    }
    if (usuarioEnPartida(creador) || usuarioEnPartida(oponente)) {
        await sock.sendMessage(chatId, { text: "❄️ Uno de los duelistas ya tiene una partida pendiente." });
        return;
    }

    const id = `${chatId}:${creador}:${oponente}:${Date.now()}`;
    const partida = { chatId, jugadores: [creador, oponente], elecciones: {}, creadaEn: Date.now() };
    partidas.set(id, partida);
    const instruccion = `❄️ *PIEDRA, PAPEL O TIJERA*\n\nResponde a este chat privado con una sola opción:\n\n*piedra* · *papel* · *tijera*\n\nTu elección será secreta hasta que ambos duelistas respondan.`;

    try {
        await Promise.all(partida.jugadores.map(jugador => sock.sendMessage(jugador, { text: instruccion })));
    } catch (error) {
        partidas.delete(id);
        await sock.sendMessage(chatId, { text: "❄️ No pude enviar el mensaje privado a ambos jugadores. Los dos deben tener un chat disponible con el bot." });
        return;
    }

    await sock.sendMessage(chatId, {
        text: `❄️ *PARTIDA INICIADA*\n\n${nombreMencion(creador)} vs ${nombreMencion(oponente)}\n\n📩 Les envié un mensaje privado para que elijan. El resultado aparecerá aquí cuando ambos respondan.`,
        mentions: partida.jugadores
    });
}

async function procesarEleccionPPT(sock, msg, texto) {
    const chatId = msg.key.remoteJid;
    const jugador = msg.key.participant || chatId;
    if (esGrupo(chatId)) return false;

    limpiarPartidasVencidas();
    const eleccion = String(texto || "").trim().toLowerCase().replace(/^#/, "");
    if (!["piedra", "papel", "tijera"].includes(eleccion)) return false;

    let partidaId;
    let partida;
    for (const [id, pendiente] of partidas) {
        if (pendiente.jugadores.includes(jugador)) {
            partidaId = id;
            partida = pendiente;
            break;
        }
    }
    if (!partida) return false;
    if (partida.elecciones[jugador]) {
        await sock.sendMessage(chatId, { text: "❄️ Ya registré tu elección. Esperando al otro duelista." });
        return true;
    }

    partida.elecciones[jugador] = eleccion;
    await sock.sendMessage(chatId, { text: "✅ Elección guardada en secreto. Esperando al otro duelista." });
    const [a, b] = partida.jugadores;
    if (!partida.elecciones[a] || !partida.elecciones[b]) return true;

    const eleccionA = partida.elecciones[a];
    const eleccionB = partida.elecciones[b];
    const resultado = decidirGanador(eleccionA, eleccionB);
    const cierre = resultado === "empate"
        ? "🤝 *¡EMPATE!* Ningún duelista se impone esta vez."
        : `🏆 *¡GANA ${nombreMencion(resultado === "a" ? a : b)}!*`;

    await sock.sendMessage(partida.chatId, {
        text: `❄️ *RESULTADO: PIEDRA, PAPEL O TIJERA*\n\n${nombreMencion(a)} eligió: *${eleccionA}*\n${nombreMencion(b)} eligió: *${eleccionB}*\n\n${cierre}`,
        mentions: partida.jugadores
    });
    partidas.delete(partidaId);
    return true;
}

module.exports = { iniciarPiedraPapelTijera, procesarEleccionPPT };
