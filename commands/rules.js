const fs = require("fs");
const path = require("path");
const { esAdminGrupo } = require("../systems/permissions");

const archivo = path.join(__dirname, "../database/groups.json");
function cargar() { try { return fs.existsSync(archivo) ? JSON.parse(fs.readFileSync(archivo, "utf8") || "{}") : {}; } catch { return {}; } }
function guardar(datos) { fs.mkdirSync(path.dirname(archivo), { recursive: true }); fs.writeFileSync(archivo, JSON.stringify(datos, null, 2), "utf8"); }

module.exports = async function reglas(sock, msg, args) {
    const chat = msg.key.remoteJid;
    if (!String(chat).endsWith("@g.us")) return sock.sendMessage(chat, { text: "❄️ Las reglas protegen una sala de duelo; este comando es solo para grupos." });
    const accion = String(args[0] || "ver").toLowerCase();
    const datos = cargar();
    const actuales = datos[chat]?.reglas;
    if (accion === "poner" || accion === "set" || accion === "establecer") {
        if (!(await esAdminGrupo(sock, msg))) return sock.sendMessage(chat, { text: "❄️ Solo un administrador puede establecer las reglas de la Academia." });
        const texto = args.slice(1).join(" ").trim();
        if (texto.length < 5) return sock.sendMessage(chat, { text: "🎴 Ejemplo: *#reglas poner Respeto, sin spam y sin enlaces.*" });
        if (texto.length > 1200) return sock.sendMessage(chat, { text: "❄️ Las reglas deben tener menos de 1200 caracteres." });
        datos[chat] = { ...(datos[chat] || {}), reglas: texto };
        guardar(datos);
        return sock.sendMessage(chat, { text: "✅ Reglas actualizadas. Una Academia fuerte se construye con respeto." });
    }
    if (accion === "borrar" || accion === "eliminar") {
        if (!(await esAdminGrupo(sock, msg))) return sock.sendMessage(chat, { text: "❄️ Solo un administrador puede retirar las reglas." });
        if (datos[chat]) delete datos[chat].reglas;
        guardar(datos);
        return sock.sendMessage(chat, { text: "✅ Las reglas guardadas fueron retiradas." });
    }
    try {
        const metadata = await sock.groupMetadata(chat);
        const descripcion = String(metadata?.desc || "").trim();
        if (descripcion) return sock.sendMessage(chat, { text: `╭─📜 *𝑫𝑬𝑺𝑪𝑹𝑰𝑷𝑪𝑰𝑶́𝑵 𝑫𝑬𝑳 𝑮𝑹𝑼𝑷𝑶*\n│ ${descripcion}\n╰─ 🌹 _Respeto, estrategia y un buen duelo._` });
    } catch { /* Si WhatsApp no entrega los metadatos, se usa el respaldo local. */ }
    return sock.sendMessage(chat, { text: actuales ? `╭─📜 *𝑹𝑬𝑮𝑳𝑨𝑺 𝑫𝑬 𝑳𝑨 𝑨𝑪𝑨𝑫𝑬𝑴𝑰𝑨*\n│ ${actuales}\n╰─ 🌹 _Respeto, estrategia y un buen duelo._` : "📜 Este grupo no tiene descripción todavía.\n🎴 Un administrador puede añadirla desde la información del grupo." });
};
