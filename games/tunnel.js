const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const config = require("../config");
const { establecerUrlPublica, esLocal } = require("./public-url");

let proceso = null;
let reintentoProgramado = false;
function reintentar() {
    if (reintentoProgramado) return;
    reintentoProgramado = true;
    const temporizador = setTimeout(() => { reintentoProgramado = false; iniciarTunel(); }, 30000);
    temporizador.unref();
}
function iniciarTunel() {
    if (!config.games.autoTunnel || !esLocal(config.games.publicUrl)) return null;
    const binario = path.resolve(config.games.tunnelBinary);
    if (!fs.existsSync(binario)) { console.warn(`⚠️ Cloudflare Tunnel no encontrado todavía: ${binario}`); reintentar(); return null; }
    try {
        proceso = spawn(binario, ["tunnel", "--url", `http://127.0.0.1:${config.games.port}`, "--no-autoupdate"], { windowsHide: true });
        const leer = datos => {
            const texto = String(datos);
            const url = texto.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i)?.[0];
            if (url) console.log(`🌐 Enlace público de juegos: ${establecerUrlPublica(url)}`);
            else if (/error|failed/i.test(texto)) console.warn(`⚠️ Cloudflare Tunnel: ${texto.trim()}`);
        };
        proceso.stdout.on("data", leer); proceso.stderr.on("data", leer);
        proceso.on("error", error => { console.warn(`⚠️ No se pudo iniciar Cloudflare Tunnel: ${error.message}`); proceso = null; reintentar(); });
        proceso.on("exit", codigo => { if (codigo && codigo !== 0) { console.warn(`⚠️ Cloudflare Tunnel terminó (código ${codigo}).`); reintentar(); } proceso = null; });
        process.once("exit", () => proceso?.kill());
        return proceso;
    } catch (error) { console.warn(`⚠️ No se pudo preparar Cloudflare Tunnel: ${error.message}`); return null; }
}
module.exports = { iniciarTunel };
