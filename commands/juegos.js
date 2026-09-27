const config = require("../config");
const { obtenerCatalogo, obtenerJuego } = require("../games/catalog");
const { crearSesionWeb, registrarUsuarioWhatsApp, resumenUsuario, listarPartidas, estadoUsuario } = require("../games/database");
const { obtenerUrlPublica, esperarUrlPublica } = require("../games/public-url");

const avisosDeEnlace = new Map();
const DURACION_ENLACE_MS = 12 * 60 * 60 * 1000;

function usuario(msg) { return msg.key.participant || msg.key.participantPn || msg.key.remoteJid; }
function esGrupo(msg) { return String(msg.key.remoteJid || "").endsWith("@g.us"); }
function nombre(msg) { return String(msg.pushName || msg.verifiedBizName || "Duelista").trim().slice(0, 80) || "Duelista"; }
function tiempo(ms) { const minutos = Math.floor(Number(ms || 0) / 60000); return `${Math.floor(minutos / 60)}h ${minutos % 60}m`; }
function fecha(timestamp) { return timestamp ? new Date(timestamp).toLocaleString("es-NI", { dateStyle: "medium", timeStyle: "short" }) : "Sin sesiones"; }
function basePublica() { return obtenerUrlPublica(); }
function advertenciaLocal() { return /127\.0\.0\.1|localhost/i.test(basePublica()) ? "\n\n⚠️ Configura *GAMES_PUBLIC_URL* con la IP LAN o dominio público del servidor antes de abrirlo desde el teléfono." : ""; }
function programarAvisoDeEnlace(sock, chat) {
    const anterior = avisosDeEnlace.get(chat); if (anterior) clearTimeout(anterior);
    const aviso = setTimeout(() => {
        avisosDeEnlace.delete(chat);
        sock.sendMessage(chat, { text: "⏳ Tu enlace del arcade vence en 5 minutos. La partida puede seguir abierta, pero guarda tu progreso y solicita un enlace nuevo con *#jugar ID* para mantener la sincronización." }).catch(() => {});
    }, DURACION_ENLACE_MS - 5 * 60 * 1000);
    avisosDeEnlace.set(chat, aviso);
}

function crearUrlDeJuego(token, gameId, base = basePublica()) {
    let url;
    try { url = new URL(base); }
    catch { return null; }
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname) return null;
    url.pathname = `${url.pathname.replace(/\/$/, "")}/juego`;
    url.search = gameId ? `game=${encodeURIComponent(gameId)}` : "";
    url.hash = `token=${token}`;
    return url.toString();
}

async function juegos(sock, msg) {
    const catalogo = obtenerCatalogo();
    const lista = catalogo.length ? catalogo.map(juego => `🎮 *${juego.name}*\n   ID: \`${juego.id}\` · ${juego.platform}\n   ${juego.description}`).join("\n\n") : "No hay juegos habilitados todavía.";
    await sock.sendMessage(msg.key.remoteJid, { text: `❄️ *JUEGOS WEB DE ALEXIS* ❄️\n\n${lista}\n\n▶️ Usa *#jugar ID* por chat privado para recibir un enlace seguro.` });
}

async function catalogo(sock, msg) {
    const chat = msg.key.remoteJid;
    if (esGrupo(msg)) return sock.sendMessage(chat, { text: "🔐 Pide tu acceso al arcade por chat privado con Alexis." });
    const session = crearSesionWeb(usuario(msg), nombre(msg));
    let url;
    try { url = crearUrlDeJuego(session.token, null, await esperarUrlPublica()); }
    catch { return sock.sendMessage(chat, { text: "⏳ El arcade se está preparando. Intenta de nuevo en unos segundos." }); }
    if (!url) return sock.sendMessage(chat, { text: "⚠️ El enlace de juegos no está configurado." });
    await sock.sendMessage(chat, { text: `🕹️ *ALEXIS GX ARCADE*\n\nHola ${session.user.displayName} 👋\nAquí está tu acceso personal al catálogo:\n\n${url}\n\n🔐 Este enlace vence en 12 horas. Te avisaré 5 minutos antes. No lo compartas.${advertenciaLocal()}` });
    programarAvisoDeEnlace(sock, chat);
}

async function enlaceDeJuego(sock, msg, argumentos, continuar) {
    const chat = msg.key.remoteJid;
    if (esGrupo(msg)) return sock.sendMessage(chat, { text: "🔐 Para proteger tus partidas, pide tu enlace en el chat privado con Alexis." });
    const gameId = argumentos[0]; const juego = obtenerJuego(gameId);
    if (!juego) return sock.sendMessage(chat, { text: "🎮 No encontré ese juego. Usa *#juegos* para ver los ID disponibles." });
    const identity = usuario(msg); const session = crearSesionWeb(identity, nombre(msg));
    if (continuar && juego.runner !== "emulatorjs" && !listarPartidas(session.user.id, juego.id).length) return sock.sendMessage(chat, { text: `💾 No tienes una partida guardada de *${juego.name}*. Usa *#jugar ${juego.id}* para empezar.` });
    let url;
    try { url = crearUrlDeJuego(session.token, juego.id, await esperarUrlPublica()); }
    catch { return sock.sendMessage(chat, { text: "⏳ El enlace público se está preparando. Espera unos segundos y vuelve a usar *#jugar ID*." }); }
    if (!url) return sock.sendMessage(chat, { text: "⚠️ El enlace de juegos no está configurado. El administrador debe definir *GAMES_PUBLIC_URL* como una URL completa, por ejemplo: https://juegos.ejemplo.com" });
    if (continuar) { const destino = new URL(url); destino.searchParams.set("load", "1"); url = destino.toString(); }
    const accion = continuar ? "continúa tu partida o carga uno de tus guardados" : "inicia una partida nueva o carga una guardada";
    await sock.sendMessage(chat, {
        text: `🎮 *${juego.name}*\n\nHola ${session.user.displayName} 👋\nAbre este enlace para jugar. Allí puedes ${accion}.\n\n${url}\n\n🔐 El enlace es personal y vence en 12 horas. Te avisaré 5 minutos antes. No lo compartas.${advertenciaLocal()}`,
        // Fuerza el tratamiento como URL de WhatsApp incluso si el servidor no
        // expone metadatos Open Graph para generar una vista previa.
        linkPreview: {
            "canonical-url": url,
            "matched-text": url,
            title: `🎮 Jugar: ${juego.name}`,
            description: "Acceso personal de Alexis Rhodes (vence en 12 horas)."
        }
    });
    programarAvisoDeEnlace(sock, chat);
}

async function misPartidas(sock, msg) {
    const chat = msg.key.remoteJid;
    if (esGrupo(msg)) return sock.sendMessage(chat, { text: "🔐 Consulta tus partidas desde el chat privado con Alexis." });
    const user = registrarUsuarioWhatsApp(usuario(msg), nombre(msg)); const resumen = resumenUsuario(user.id);
    const texto = resumen.saves.length ? resumen.saves.map(save => `🎮 *${save.gameId}* · ${save.label}\n⏱️ Actualizada: ${fecha(save.updatedAt)}`).join("\n\n") : "Aún no tienes partidas guardadas.";
    await sock.sendMessage(chat, { text: `📂 *MIS PARTIDAS*\n\n${texto}\n\n▶️ Usa *#continuar ID* para abrir tu acceso seguro.` });
}

async function progreso(sock, msg) {
    const chat = msg.key.remoteJid;
    if (esGrupo(msg)) return sock.sendMessage(chat, { text: "🔐 Consulta tu progreso desde el chat privado con Alexis." });
    const user = registrarUsuarioWhatsApp(usuario(msg), nombre(msg)); const resumen = resumenUsuario(user.id);
    await sock.sendMessage(chat, { text: `📊 *PROGRESO DE JUEGO*\n\n🪽 Duelista: *${resumen.user.displayName}*\n⏱️ Tiempo total: *${tiempo(resumen.user.totalPlayMs)}*\n💾 Partidas guardadas: *${resumen.saves.length}*\n📅 Última sesión: *${fecha(resumen.user.lastSessionAt)}*\n🗓️ Cuenta creada: *${fecha(resumen.user.createdAt)}*` });
}

async function buscarJuego(sock, msg, argumentos) {
    const query = argumentos.join(" ").trim().toLowerCase();
    if (!query) return sock.sendMessage(msg.key.remoteJid, { text: "🔎 Usa *#buscarjuego nombre*. Ejemplo: *#buscarjuego zelda*." });
    const matches = obtenerCatalogo().filter(game => `${game.name} ${game.id} ${game.platform}`.toLowerCase().includes(query)).slice(0, 12);
    const text = matches.length ? matches.map(game => `🎮 *${game.name}*\n   \`${game.id}\` · ${game.platform}`).join("\n\n") : "No encontré un juego con ese nombre o ID.";
    await sock.sendMessage(msg.key.remoteJid, { text: `🔎 *RESULTADOS PARA: ${query.toUpperCase()}*\n\n${text}${matches.length === 12 ? "\n\n_Muestra limitada a 12 resultados._" : ""}` });
}

async function sesionArcade(sock, msg) {
    const chat = msg.key.remoteJid;
    if (esGrupo(msg)) return sock.sendMessage(chat, { text: "🔐 Consulta tu sesión del arcade desde el chat privado con Alexis." });
    const user = registrarUsuarioWhatsApp(usuario(msg), nombre(msg)); const status = estadoUsuario(user.id);
    const active = status?.activeSessions || [];
    const text = active.length ? active.map(item => `🟢 *${obtenerJuego(item.gameId)?.name || item.gameId}*\n   ⏱️ ${tiempo(item.countedMs)} de actividad registrada`).join("\n\n") : "⚪ No tienes una partida activa ahora.";
    await sock.sendMessage(chat, { text: `🕹️ *SESIÓN DE ARCADE*\n\n${text}\n\n💾 Guardados: *${status?.saveCount || 0}*\n⏱️ Tiempo total: *${tiempo(status?.user?.totalPlayMs)}*\n\nUsa *#catalogo* para volver al arcade.` });
}

module.exports = { juegos, catalogo, jugar: (sock, msg, args) => enlaceDeJuego(sock, msg, args, false), continuar: (sock, msg, args) => enlaceDeJuego(sock, msg, args, true), misPartidas, progreso, buscarJuego, sesionArcade, crearUrlDeJuego };
