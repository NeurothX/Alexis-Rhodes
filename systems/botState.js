const fs = require("fs");
const path = require("path");
const ruta = path.join(__dirname, "../database/bot-state.json");
function leer() { try { return fs.existsSync(ruta) ? { encendido: true, ...JSON.parse(fs.readFileSync(ruta, "utf8")) } : { encendido: true }; } catch (error) { console.log("Error leyendo estado del bot:", error); return { encendido: true }; } }
function guardar(cambios) { const estado = { ...leer(), ...cambios }; fs.writeFileSync(ruta, JSON.stringify(estado, null, 2), "utf8"); return estado; }
function estaEncendido() { return leer().encendido !== false; }
module.exports = { guardar, estaEncendido };
