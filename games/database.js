const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
const usersDir = path.join(dataDir, "users");
const dbPath = path.join(dataDir, "games-db.json");
const secretPath = path.join(dataDir, "instance-secret.txt");

function asegurarDirectorio() { fs.mkdirSync(dataDir, { recursive: true }); fs.mkdirSync(usersDir, { recursive: true }); }
function parteSegura(valor, respaldo = "usuario") { return String(valor || respaldo).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || respaldo; }
function carpetaUsuario(whatsappId, displayName) {
    const numero = String(whatsappId || "").split("@")[0].replace(/\D/g, "").slice(0, 20) || "sin-numero";
    return `${numero}-${parteSegura(displayName, "duelista")}`;
}
function rutaDeEstado(user, gameId, slotId) {
    const carpeta = path.resolve(usersDir, parteSegura(user.storageFolder), "saves", parteSegura(gameId, "juego"));
    if (!carpeta.startsWith(`${usersDir}${path.sep}`)) throw new Error("Ruta de guardado inválida.");
    return path.join(carpeta, `${parteSegura(slotId, "principal")}.json`);
}
function escribirEstado(user, gameId, slotId, state) {
    const archivo = rutaDeEstado(user, gameId, slotId); fs.mkdirSync(path.dirname(archivo), { recursive: true });
    const temporal = `${archivo}.tmp`; fs.writeFileSync(temporal, JSON.stringify(state), "utf8"); fs.renameSync(temporal, archivo);
    return path.relative(dataDir, archivo).replace(/\\/g, "/");
}
function leerEstado(save) {
    if (!save?.stateFile) return save?.state;
    const archivo = path.resolve(dataDir, save.stateFile);
    if (!archivo.startsWith(`${usersDir}${path.sep}`) || !fs.existsSync(archivo)) throw new Error("Archivo de partida no encontrado.");
    return JSON.parse(fs.readFileSync(archivo, "utf8"));
}
function borrarArchivoDeEstado(save) {
    if (!save?.stateFile) return;
    const archivo = path.resolve(dataDir, save.stateFile);
    if (archivo.startsWith(`${usersDir}${path.sep}`) && fs.existsSync(archivo)) fs.unlinkSync(archivo);
}
function logJuego(evento, user, gameId, extra = "") { console.log(`🎮 [${evento}] ${user?.displayName || "Duelista"} · ${gameId}${extra ? ` · ${extra}` : ""}`); }
function leerJson() {
    asegurarDirectorio();
    if (!fs.existsSync(dbPath)) return { users: {}, saves: {}, webSessions: {}, playSessions: {} };
    try {
        const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
        return { users: {}, saves: {}, webSessions: {}, playSessions: {}, ...data };
    } catch (error) { throw new Error(`No se pudo leer la base de juegos: ${error.message}`); }
}
function guardarJson(data) {
    asegurarDirectorio();
    const temporal = `${dbPath}.tmp`;
    fs.writeFileSync(temporal, JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o600 });
    fs.renameSync(temporal, dbPath);
}
function secreto() {
    asegurarDirectorio();
    if (!fs.existsSync(secretPath)) fs.writeFileSync(secretPath, crypto.randomBytes(32).toString("base64url"), { encoding: "utf8", mode: 0o600 });
    return fs.readFileSync(secretPath, "utf8").trim();
}
function hmac(value) { return crypto.createHmac("sha256", secreto()).update(String(value)).digest("base64url"); }
function tokenHash(token) { return crypto.createHash("sha256").update(token).digest("base64url"); }
function nuevoId(prefijo) { return `${prefijo}_${crypto.randomBytes(18).toString("base64url")}`; }
function borrarExpiradas(db) {
    const ahora = Date.now();
    let cambio = false;
    for (const [id, sesion] of Object.entries(db.webSessions)) if (sesion.expiresAt <= ahora) { delete db.webSessions[id]; cambio = true; }
    for (const [id, sesion] of Object.entries(db.playSessions)) if (sesion.expiresAt <= ahora) { delete db.playSessions[id]; cambio = true; }
    return cambio;
}

function registrarUsuarioWhatsApp(whatsappId, displayName) {
    const db = leerJson();
    const identity = hmac(whatsappId);
    let user = Object.values(db.users).find(item => item.whatsappIdentityHash === identity);
    const ahora = Date.now();
    if (!user) {
        user = { id: nuevoId("usr"), whatsappIdentityHash: identity, whatsappId, storageFolder: carpetaUsuario(whatsappId, displayName), displayName: displayName || "Duelista", createdAt: ahora, updatedAt: ahora, totalPlayMs: 0, lastSessionAt: null };
        db.users[user.id] = user;
    } else {
        user.storageFolder ||= carpetaUsuario(whatsappId, displayName);
        user.whatsappId ||= whatsappId;
        user.displayName = displayName || user.displayName;
        user.updatedAt = ahora;
    }
    fs.mkdirSync(path.join(usersDir, user.storageFolder), { recursive: true });
    guardarJson(db);
    return user;
}

function crearSesionWeb(whatsappId, displayName) {
    const user = registrarUsuarioWhatsApp(whatsappId, displayName);
    const db = leerJson();
    borrarExpiradas(db);
    const token = crypto.randomBytes(32).toString("base64url");
    const id = nuevoId("web");
    db.webSessions[id] = { id, userId: user.id, tokenHash: tokenHash(token), createdAt: Date.now(), expiresAt: Date.now() + 12 * 60 * 60 * 1000 };
    guardarJson(db);
    return { token, expiresAt: db.webSessions[id].expiresAt, user };
}

function autenticarToken(token) {
    if (!token || typeof token !== "string") return null;
    const db = leerJson();
    const expiradas = borrarExpiradas(db);
    const hash = tokenHash(token);
    const sesion = Object.values(db.webSessions).find(item => item.tokenHash === hash);
    if (expiradas) guardarJson(db);
    if (!sesion) return null;
    return { session: sesion, user: db.users[sesion.userId] || null };
}

function listarPartidas(userId, gameId) {
    const db = leerJson();
    return Object.values(db.saves).filter(item => item.userId === userId && (!gameId || item.gameId === gameId)).map(({ state, stateFile, ...meta }) => meta).sort((a, b) => b.updatedAt - a.updatedAt);
}
function obtenerPartida(userId, saveId) {
    const db = leerJson(); const save = db.saves[saveId];
    if (!save || save.userId !== userId) return null;
    const user = db.users[userId]; const completo = { ...save, state: leerEstado(save) };
    logJuego("CARGÓ", user, save.gameId, save.label); return completo;
}
function guardarPartida(userId, gameId, slotId, label, state, metadata = {}) {
    const db = leerJson();
    const iguales = Object.values(db.saves).filter(item => item.userId === userId && item.gameId === gameId && item.slotId === slotId).sort((a, b) => b.updatedAt - a.updatedAt);
    const existente = iguales.shift();
    // Un slot siempre representa la última partida; elimina duplicados viejos.
    for (const anterior of iguales) { borrarArchivoDeEstado(anterior); delete db.saves[anterior.id]; }
    const user = db.users[userId]; if (!user) throw new Error("Usuario de guardado no encontrado.");
    const ahora = Date.now();
    const save = existente || { id: nuevoId("save"), userId, gameId, slotId, createdAt: ahora };
    const stateFile = escribirEstado(user, gameId, slotId, state);
    Object.assign(save, { label: String(label || `Partida ${slotId}`).slice(0, 80), stateFile, metadata, updatedAt: ahora }); delete save.state;
    db.saves[save.id] = save;
    guardarJson(db); logJuego(existente ? "SAV ACTUALIZADO" : "SAV CREADO", user, gameId, `${save.label} · ${stateFile}`);
    return save;
}
function eliminarPartida(userId, saveId) {
    const db = leerJson();
    if (!db.saves[saveId] || db.saves[saveId].userId !== userId) return false;
    borrarArchivoDeEstado(db.saves[saveId]); delete db.saves[saveId]; guardarJson(db); return true;
}
function iniciarSesionJuego(userId, gameId) {
    const db = leerJson(); const id = nuevoId("play"); const ahora = Date.now();
    db.playSessions[id] = { id, userId, gameId, startedAt: ahora, lastHeartbeatAt: ahora, countedMs: 0, expiresAt: ahora + 2 * 60 * 60 * 1000 };
    guardarJson(db); logJuego("JUGANDO", db.users[userId], gameId, `sesión ${id.slice(-6)}`); return db.playSessions[id];
}
function heartbeatJuego(userId, playSessionId) {
    const db = leerJson(); const sesion = db.playSessions[playSessionId]; const ahora = Date.now();
    if (!sesion || sesion.userId !== userId || sesion.expiresAt <= ahora) return null;
    const transcurrido = ahora - sesion.lastHeartbeatAt;
    // Solo suma actividad demostrable: latidos entre 10 y 75 segundos.
    if (transcurrido >= 10000 && transcurrido <= 75000) sesion.countedMs += transcurrido;
    sesion.lastHeartbeatAt = ahora;
    // El registro de actividad se mantiene mientras la persona sigue jugando.
    sesion.expiresAt = ahora + 2 * 60 * 60 * 1000;
    const user = db.users[userId]; if (user) { user.totalPlayMs = Number(user.totalPlayMs || 0) + (transcurrido >= 10000 && transcurrido <= 75000 ? transcurrido : 0); user.lastSessionAt = ahora; user.updatedAt = ahora; }
    guardarJson(db); return sesion;
}
function resumenUsuario(userId) { const db = leerJson(); const user = db.users[userId]; return user ? { user, saves: listarPartidas(userId) } : null; }
function estadoUsuario(userId) {
    const db = leerJson(); const user = db.users[userId]; if (!user) return null;
    const now = Date.now();
    const activeSessions = Object.values(db.playSessions).filter(item => item.userId === userId && item.expiresAt > now)
        .map(({ id, gameId, startedAt, countedMs, lastHeartbeatAt, expiresAt }) => ({ id, gameId, startedAt, countedMs, lastHeartbeatAt, expiresAt }));
    return { user, saveCount: Object.values(db.saves).filter(item => item.userId === userId).length, activeSessions };
}

module.exports = { registrarUsuarioWhatsApp, crearSesionWeb, autenticarToken, listarPartidas, obtenerPartida, guardarPartida, eliminarPartida, iniciarSesionJuego, heartbeatJuego, resumenUsuario, estadoUsuario };
