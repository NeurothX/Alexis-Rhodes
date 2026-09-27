const fs = require("fs");
const path = require("path");
const archivo = path.join(__dirname, "../database/reminders.json");
const temporizadores = new Map();

function cargar() { try { return fs.existsSync(archivo) ? JSON.parse(fs.readFileSync(archivo, "utf8") || "[]") : []; } catch { return []; } }
function guardar(lista) { fs.writeFileSync(archivo, JSON.stringify(lista, null, 2), "utf8"); }
function programar(sock, recordatorio) {
    const demora = recordatorio.fecha - Date.now();
    if (demora <= 0) return entregar(sock, recordatorio.id);
    temporizadores.set(recordatorio.id, setTimeout(() => entregar(sock, recordatorio.id), Math.min(demora, 2 ** 31 - 1)));
}
async function entregar(sock, id) {
    const lista = cargar(); const recordatorio = lista.find(item => item.id === id);
    if (!recordatorio) return;
    if (recordatorio.fecha > Date.now()) return programar(sock, recordatorio);
    guardar(lista.filter(item => item.id !== id)); temporizadores.delete(id);
    await sock.sendMessage(recordatorio.chat, { text: `⏰ *𝑹𝑬𝑪𝑶𝑹𝑫𝑨𝑻𝑶𝑹𝑰𝑶*\n🌹 ${recordatorio.texto}\n❄️ _Alexis: la puntualidad también es parte de la estrategia._`, mentions: recordatorio.usuario ? [recordatorio.usuario] : [] });
}
function iniciarRecordatorios(sock) {
    for (const temporizador of temporizadores.values()) clearTimeout(temporizador);
    temporizadores.clear();
    for (const item of cargar()) programar(sock, item);
}
function crearRecordatorio(sock, chat, usuario, fecha, texto) {
    const item = { id: `${fecha}-${Math.random().toString(36).slice(2, 8)}`, chat, usuario, fecha, texto };
    const lista = cargar(); lista.push(item); guardar(lista); programar(sock, item); return item;
}
module.exports = { iniciarRecordatorios, crearRecordatorio };
