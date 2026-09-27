const fs = require("fs");
const http = require("http");
const path = require("path");
const config = require("../config");
const { obtenerCatalogo, obtenerJuego } = require("./catalog");
const db = require("./database");
const progreso = require("../systems/arcadeProgression");

const publicDir = path.join(__dirname, "web", "public");
const coverDir = path.join(publicDir, "covers");
let servidor = null;
const titulosPortada = {
    mario: "Super Mario Bros.", mario2: "Super Mario Bros. 2", mario3: "Super Mario Bros. 3",
    "dr-mario": "Dr. Mario", contra: "Contra (video game)", spy: "Spy vs. Spy (1984 video game)",
    "zelda-nes": "The Legend of Zelda (video game)", "zelda-snes": "The Legend of Zelda: A Link to the Past",
    "mario-rpg": "Super Mario RPG", "mario-world": "Super Mario World", yoshi: "Yoshi's Island", kart: "Super Mario Kart",
    zelda: "The Legend of Zelda: The Minish Cap", esmeralda: "Pokémon Emerald", rojo: "Pokémon FireRed and LeafGreen",
    "ygo-destiny": "Yu-Gi-Oh! Destiny Board Traveler", "ygo-reshef": "Yu-Gi-Oh! Reshef of Destruction",
    "ygo-2004": "Yu-Gi-Oh! World Championship Tournament 2004", "ygo-world": "Yu-Gi-Oh! Worldwide Edition: Stairway to the Destined Duel",
    "ygo-2005": "Yu-Gi-Oh! 7 Trials to Glory: World Championship Tournament 2005", "ygo-2006": "Yu-Gi-Oh! Ultimate Masters: World Championship Tournament 2006"
};
const portadasEnMemoria = new Map();

function portadaLocal(juego) {
    for (const extension of [".png", ".jpg", ".webp"]) {
        const archivo = path.join(coverDir, "installed", `${juego.id}${extension}`);
        if (fs.existsSync(archivo)) return `/covers/installed/${juego.id}${extension}`;
    }
    return null;
}

function responder(res, status, body, headers = {}) {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp", ...headers });
    res.end(JSON.stringify(body));
}
function leerCuerpo(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        // Los estados de emulador pueden ser grandes; se permiten hasta 300 MiB por guardado.
        const maxBytes = 300 * 1024 * 1024;
        if (Number(req.headers["content-length"] || 0) > maxBytes) return reject(new Error("Solicitud demasiado grande (máximo 300 MB)"));
        req.on("data", chunk => { body += chunk; if (Buffer.byteLength(body) > maxBytes) reject(new Error("Solicitud demasiado grande (máximo 300 MB)")); });
        req.on("end", () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error("JSON inválido")); } });
        req.on("error", reject);
    });
}
function token(req) {
    const header = String(req.headers.authorization || "");
    if (header.startsWith("Bearer ")) return header.slice(7);
    // EmulatorJS descarga la ROM por sí mismo y no permite configurar cabeceras.
    return new URL(req.url, "http://localhost").searchParams.get("token");
}
function sesion(req, res) {
    const result = db.autenticarToken(token(req));
    if (!result?.user) { responder(res, 401, { error: "Sesión inválida o expirada." }); return null; }
    return result;
}
function juegoSeguro(juego) {
    const { id, name, platform, description, image, credits, rightsHolder, emulator, runner, core } = juego;
    return { id, name, platform, description, image, credits, rightsHolder, emulator, runner, core };
}
async function obtenerPortada(juego) {
    if (!juego) return null;
    if (juego.image) return juego.image;
    const instalada = portadaLocal(juego);
    if (instalada) return instalada;
    if (portadasEnMemoria.has(juego.id)) return portadasEnMemoria.get(juego.id);
    // No se usa una búsqueda web aproximada: así nunca se muestra la portada
    // de otro juego. Ejecuta `npm run covers:install` para añadir las exactas.
    portadasEnMemoria.set(juego.id, null);
    return null;
}
async function precargarPortadas() {
    const juegos = obtenerCatalogo().filter(juego => !juego.image);
    const portadas = await Promise.all(juegos.map(obtenerPortada));
    const descargadas = portadas.filter(Boolean).length;
    console.log(`🖼️ Portadas listas: ${descargadas}/${juegos.length}`);
}
function servirArchivo(res, archivo) {
    const ruta = path.join(publicDir, archivo === "/" || archivo === "/juego" ? "index.html" : archivo.replace(/^\//, ""));
    if (!ruta.startsWith(publicDir) || !fs.existsSync(ruta) || fs.statSync(ruta).isDirectory()) return responder(res, 404, { error: "No encontrado" });
    const tipos = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
    const cacheControl = ["/sw.js", "/app.js", "/styles.css", "/game-overrides.css"].includes(archivo) ? "no-cache" : "public, max-age=3600";
    res.writeHead(200, { "Content-Type": tipos[path.extname(ruta)] || "application/octet-stream", "X-Content-Type-Options": "nosniff", "Cache-Control": cacheControl, "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" });
    fs.createReadStream(ruta).pipe(res);
}

function servirDependencia(res, archivo, contentType) {
    if (!fs.existsSync(archivo)) return responder(res, 404, { error: "Dependencia no instalada." });
    res.writeHead(200, { "Content-Type": contentType, "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=31536000, immutable", "Cross-Origin-Resource-Policy": "same-origin", "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" });
    fs.createReadStream(archivo).pipe(res);
}

function servirRom(req, res, pathname) {
    const auth = sesion(req, res); if (!auth) return;
    const juego = obtenerJuego(pathname.split("/")[3]);
    if (!juego?.romPath || !fs.existsSync(juego.romPath)) return responder(res, 404, { error: "ROM no disponible." });
    // El nombre estable evita que los parámetros temporales del enlace cambien
    // el nombre de la partida .sav. Las cabeceras HTTP solo admiten ASCII.
    const nombreRom = path.basename(juego.romPath).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
    res.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Length": fs.statSync(juego.romPath).size, "Content-Disposition": `attachment; filename="${nombreRom}"`, "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff", "Cross-Origin-Resource-Policy": "same-origin", "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" });
    fs.createReadStream(juego.romPath).pipe(res);
}

async function manejarApi(req, res, pathname) {
    if (pathname === "/api/health") return responder(res, 200, { ok: true });
    if (req.method === "GET" && pathname.startsWith("/api/roms/")) return servirRom(req, res, pathname);
    const auth = sesion(req, res); if (!auth) return;
    if (req.method === "GET" && pathname === "/api/session") return responder(res, 200, { user: { id: auth.user.id, displayName: auth.user.displayName }, expiresAt: auth.session.expiresAt });
    if (req.method === "GET" && pathname === "/api/arcade-status") {
        const status = db.estadoUsuario(auth.user.id);
        return responder(res, 200, { totalPlayMs: status?.user?.totalPlayMs || 0, saveCount: status?.saveCount || 0, lastSessionAt: status?.user?.lastSessionAt || null, activeSessions: status?.activeSessions || [] });
    }
    if (req.method === "GET" && pathname === "/api/games") return responder(res, 200, { games: obtenerCatalogo().map(juegoSeguro) });
    if (req.method === "GET" && pathname.startsWith("/api/games/") && pathname.endsWith("/progress")) {
        const gameId = pathname.split("/")[3];
        if (!obtenerJuego(gameId)) return responder(res, 404, { error: "Juego no encontrado." });
        // El perfil arcade se identifica con el WhatsApp del dueño del enlace;
        // nunca se entrega progreso de otro jugador.
        return responder(res, 200, progreso.getGameProgress(auth.user.whatsappId || auth.user.id, gameId));
    }
    if (req.method === "GET" && pathname.startsWith("/api/covers/")) {
        const juego = obtenerJuego(pathname.split("/")[3]);
        return responder(res, 200, { url: await obtenerPortada(juego) });
    }
    if (req.method === "GET" && pathname === "/api/saves") {
        const gameId = new URL(req.url, "http://localhost").searchParams.get("gameId");
        return responder(res, 200, { saves: db.listarPartidas(auth.user.id, gameId) });
    }
    // SRAM/.sav nativo de EmulatorJS. Se guarda separado del estado manual de
    // NES y queda ligado al usuario autenticado y al ID corto del juego.
    if (pathname.startsWith("/api/emulator-saves/")) {
        const gameId = pathname.split("/")[3];
        const game = obtenerJuego(gameId);
        if (!game || game.runner !== "emulatorjs") return responder(res, 404, { error: "Juego no disponible." });
        if (req.method === "GET") {
            const meta = db.listarPartidas(auth.user.id, game.id).find(save => save.slotId === "native-sav");
            if (!meta) return responder(res, 404, { error: "Aún no hay una partida interna para este juego." });
            const save = db.obtenerPartida(auth.user.id, meta.id);
            return responder(res, 200, { save: save.state });
        }
        if (req.method === "POST") {
            const body = await leerCuerpo(req);
            if (typeof body.data !== "string" || !/^[A-Za-z0-9_-]+$/.test(body.data)) return responder(res, 400, { error: "Archivo .sav inválido." });
            const save = db.guardarPartida(auth.user.id, game.id, "native-sav", "Guardado interno (.sav)", { format: "emulator-sav-v1", data: body.data }, { runner: "emulatorjs", bytes: body.bytes || 0 });
            const progress = auth.user.whatsappId ? progreso.reportarEvento({ userId: auth.user.whatsappId, name: auth.user.displayName, gameId: game.id, type: "save", eventId: `save:${save.id}:${save.updatedAt}` }) : null;
            return responder(res, 201, { save, progress });
        }
        return responder(res, 405, { error: "Método no permitido." });
    }
    if (req.method === "POST" && pathname === "/api/play-sessions") {
        const body = await leerCuerpo(req); const game = obtenerJuego(body.gameId);
        if (!game) return responder(res, 404, { error: "Juego no disponible." });
        const playSession = db.iniciarSesionJuego(auth.user.id, game.id);
        const progress = auth.user.whatsappId ? progreso.reportarEvento({ userId: auth.user.whatsappId, name: auth.user.displayName, gameId: game.id, type: "game_start", eventId: `play:${playSession.id}` }) : null;
        return responder(res, 201, { playSession, progress });
    }
    if (req.method === "POST" && pathname.startsWith("/api/play-sessions/") && pathname.endsWith("/heartbeat")) {
        const id = pathname.split("/")[3]; const playSession = db.heartbeatJuego(auth.user.id, id);
        return playSession ? responder(res, 200, { playSession }) : responder(res, 404, { error: "Sesión de juego no encontrada." });
    }
    if (req.method === "POST" && pathname === "/api/saves") {
        const body = await leerCuerpo(req); const game = obtenerJuego(body.gameId);
        if (!game || !String(body.slotId || "").match(/^[a-zA-Z0-9_-]{1,40}$/)) return responder(res, 400, { error: "Datos de guardado inválidos." });
        if (typeof body.state !== "object" || body.state === null) return responder(res, 400, { error: "El estado debe ser un objeto." });
        const save = db.guardarPartida(auth.user.id, game.id, body.slotId, body.label, body.state, body.metadata);
        const progress = auth.user.whatsappId ? progreso.reportarEvento({ userId: auth.user.whatsappId, name: auth.user.displayName, gameId: game.id, type: "save", eventId: `save:${save.id}:${save.updatedAt}` }) : null;
        return responder(res, 201, { save, progress });
    }
    if (pathname.startsWith("/api/saves/")) {
        const saveId = pathname.split("/")[3];
        if (req.method === "GET") { const save = db.obtenerPartida(auth.user.id, saveId); return save ? responder(res, 200, { save }) : responder(res, 404, { error: "Partida no encontrada." }); }
        if (req.method === "DELETE") return db.eliminarPartida(auth.user.id, saveId) ? responder(res, 204, {}) : responder(res, 404, { error: "Partida no encontrada." });
    }
    responder(res, 404, { error: "API no encontrada." });
}

function iniciarServidorJuegos() {
    if (servidor) return servidor;
    precargarPortadas().catch(error => console.warn("⚠️ No se pudieron precargar las portadas:", error.message));
    servidor = http.createServer(async (req, res) => {
        try {
            const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
            if (pathname.startsWith("/api/")) return await manejarApi(req, res, pathname);
            if (pathname === "/vendor/jsnes/jsnes.min.js") return servirDependencia(res, path.join(__dirname, "..", "node_modules", "jsnes", "dist", "jsnes.min.js"), "text/javascript; charset=utf-8");
            if (pathname.startsWith("/vendor/emulatorjs/data/")) {
                const relative = pathname.slice("/vendor/emulatorjs/data/".length);
                const dataDir = path.join(__dirname, "vendor", "emulatorjs", "data");
                const coreMatch = relative.match(/^cores\/(mgba|gambatte|snes9x|mupen64plus_next|genesis_plus_gx|ppsspp)\/(.+)$/);
                const coreDataMatch = relative.match(/^cores\/(mgba|gambatte|snes9x|mupen64plus_next|genesis_plus_gx|ppsspp)(?:-thread)?(?:-legacy)?-wasm\.data$/);
                const coreReportMatch = relative.match(/^cores\/reports\/(mgba|gambatte|snes9x|mupen64plus_next|genesis_plus_gx|ppsspp)\.json$/);
                let dependency = coreMatch
                    ? path.resolve(dataDir, "cores", "node_modules", "@emulatorjs", `core-${coreMatch[1]}`, coreMatch[2])
                    : coreDataMatch
                        ? path.resolve(dataDir, "cores", "node_modules", "@emulatorjs", `core-${coreDataMatch[1]}`, path.basename(relative))
                        : coreReportMatch
                            ? path.resolve(dataDir, "cores", "node_modules", "@emulatorjs", `core-${coreReportMatch[1]}`, "reports", path.basename(relative))
                        : path.resolve(dataDir, relative);
                if (!fs.existsSync(dependency) && !coreMatch && !coreDataMatch && !coreReportMatch) dependency = path.resolve(dataDir, "cores", "node_modules", "@emulatorjs", "emulatorjs", "data", relative);
                if (!dependency.startsWith(`${dataDir}${path.sep}`)) return responder(res, 404, { error: "No encontrado" });
                const extension = path.extname(dependency);
                const contentType = extension === ".js" ? "text/javascript; charset=utf-8" : extension === ".css" ? "text/css; charset=utf-8" : extension === ".wasm" ? "application/wasm" : "application/octet-stream";
                return servirDependencia(res, dependency, contentType);
            }
            if (req.method !== "GET" && req.method !== "HEAD") return responder(res, 405, { error: "Método no permitido." });
            servirArchivo(res, pathname);
        } catch (error) { console.error("❌ Servidor de juegos:", error.message); if (!res.headersSent) responder(res, 400, { error: "Solicitud inválida." }); else res.end(); }
    });
    servidor.listen(config.games.port, "0.0.0.0", () => console.log(`🎮 Juegos web: ${config.games.publicUrl}`));
    servidor.on("error", error => console.error("❌ No se pudo iniciar el servidor de juegos:", error.message));
    return servidor;
}

module.exports = { iniciarServidorJuegos };
