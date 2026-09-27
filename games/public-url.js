const config = require("../config");

let actual = String(config.games.publicUrl || "").replace(/\/$/, "");
let resolver = null;
const lista = new Promise(resolve => { resolver = resolve; });

function esLocal(url) {
    try { return /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(new URL(url).hostname); }
    catch { return true; }
}
function obtenerUrlPublica() { return actual; }
function establecerUrlPublica(url) {
    actual = String(url || "").replace(/\/$/, "");
    resolver?.(actual); resolver = null;
    return actual;
}
async function esperarUrlPublica(timeoutMs = 20000) {
    if (!esLocal(actual) || !config.games.autoTunnel) return actual;
    return Promise.race([lista, new Promise((_, reject) => setTimeout(() => reject(new Error("El túnel público todavía no está disponible.")), timeoutMs))]);
}

module.exports = { obtenerUrlPublica, establecerUrlPublica, esperarUrlPublica, esLocal };
