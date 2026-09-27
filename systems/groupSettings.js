const fs = require("fs");
const path = require("path");
const ruta = path.join(__dirname, "../database/group-settings.json");
function leerTodo() { try { return fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, "utf8")) : {}; } catch (error) { console.log("Error leyendo ajustes de grupos:", error); return {}; } }
function obtener(grupo) { return { antispam: false, antilink: false, advertencias: {}, ...leerTodo()[grupo] }; }
function guardar(grupo, cambios) { const datos = leerTodo(); datos[grupo] = { ...obtener(grupo), ...cambios }; fs.writeFileSync(ruta, JSON.stringify(datos, null, 2), "utf8"); return datos[grupo]; }
module.exports = { obtener, guardar };
