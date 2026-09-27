const fs = require("fs");
const path = require("path");
const archivo = path.join(__dirname, "../database/afk.json");

function cargar() { try { return fs.existsSync(archivo) ? JSON.parse(fs.readFileSync(archivo, "utf8") || "{}") : {}; } catch { return {}; } }
function guardar(datos) { fs.writeFileSync(archivo, JSON.stringify(datos, null, 2), "utf8"); }
function autor(msg) { const key = msg.key || {}; return key.participant || key.participantPn || key.remoteJid; }
function minutos(fecha) { return Math.max(1, Math.floor((Date.now() - fecha) / 60000)); }

async function alternarAFK(sock, msg, args) {
    const chat = msg.key.remoteJid;
    const id = autor(msg);
    const datos = cargar();
    if (datos[id]) {
        delete datos[id]; guardar(datos);
        return sock.sendMessage(chat, { text: "✅ Has vuelto a la Academia. Me alegra verte de nuevo, duelista." });
    }
    const motivo = args.join(" ").trim() || "Sin motivo indicado";
    datos[id] = { motivo: motivo.slice(0, 180), desde: Date.now() };
    guardar(datos);
    return sock.sendMessage(chat, { text: `🌙 *Modo AFK activado.*\n📜 Motivo: ${datos[id].motivo}\n❄️ Avisaré a quien te mencione hasta que regreses.` });
}

async function revisarAFK(sock, msg, texto) {
    const id = autor(msg);
    const datos = cargar();
    let cambio = false;
    if (datos[id] && !String(texto).trim().startsWith("#afk")) {
        delete datos[id]; cambio = true;
        await sock.sendMessage(msg.key.remoteJid, { text: "🌹 Bienvenido de vuelta, duelista. He retirado tu estado AFK." });
    }
    const mencionados = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const avisos = mencionados.filter(usuario => datos[usuario] && usuario !== id).map(usuario => {
        const estado = datos[usuario];
        return `🌙 @${String(usuario).split("@")[0]} está AFK desde hace ${minutos(estado.desde)} min.\n📜 Motivo: ${estado.motivo}`;
    });
    if (cambio) guardar(datos);
    if (avisos.length) await sock.sendMessage(msg.key.remoteJid, { text: `${avisos.join("\n\n")}\n❄️ _Alexis: ten paciencia; todo duelista vuelve a su campo._`, mentions: mencionados });
}

module.exports = { alternarAFK, revisarAFK };
