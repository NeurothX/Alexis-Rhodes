const fs = require("fs");
const path = require("path");
const config = require("../config");

module.exports = async function menu(sock, msg) {
    const p = config.prefix || "#";
    const texto = `╔══════════════════════════════════╗
║ ❄️  *𝑨𝑳𝑬𝑿𝑰𝑺 𝑹𝑯𝑶𝑫𝑬𝑺*  ·  🎴 𝑶𝑩𝑬𝑳𝑰𝑺𝑲 𝑩𝑳𝑼𝑬 ║
╚══════════════════════════════════╝
✨ _Duel Academy · Tu tablero de comandos_

🌹 *¡Hola, duelista!* No subestimes una buena estrategia…
_cada comando puede ser la carta que cambie tu día._

💎 *${p}ping*              — comprueba si Alexis está lista
📖 *${p}ayuda* / *${p}comandos* — abre este tablero cuando lo necesites
📨 *${p}reporte <detalle>*  — informa un error directamente al creador
💡 *${p}sugerencia <idea>*  — envía una idea para mejorar la Academia

┏━━ 🍥 *𝑨𝑵𝑰𝑴𝑬 & 𝑹𝑬𝑪𝑶𝑴𝑬𝑵𝑫𝑨𝑪𝑰𝑶𝑵𝑬𝑺* ━━
┃ 🔎 *${p}anime categorias*  — mira los géneros disponibles
┃ 🎲 *${p}anime random 2*    — recibe dos sorpresas
┃ 💞 *${p}anime romance accion 2* — mezcla géneros
┃ ✨ Portada, sinopsis, episodios y temporada
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━ 💰 *𝑬𝑪𝑶𝑵𝑶𝑴Í𝑨 𝑫𝑬 𝑳𝑨 𝑨𝑪𝑨𝑫𝑬𝑴𝑰𝑨* ━━
┃ 💳 *${p}balance*           — consulta tus monedas
┃ 🎁 *${p}daily*             — reclama tu recompensa
┃ 💼 *${p}work*              — trabaja y gana monedas
┃ 🤝 *${p}give*              — comparte con otro duelista
┃ 🛒 *${p}tienda*            — visita la tienda
┃ 💎 *${p}comprar ID*        — adquiere un artículo de la tienda
┃ 🎒 *${p}inventario*        — revisa tus objetos
┃ 🏆 *${p}top global/grupo*  — mira a los mejores
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━ 🎮 *𝑺𝑨𝑳𝑨 𝑫𝑬 𝑬𝑵𝑻𝑹𝑬𝑵𝑨𝑴𝑰𝑬𝑵𝑻𝑶* ━━
┃ 📚 *${p}matematicas 3*     — pon a prueba tu mente
┃ 🍥 *${p}triviaanime 3*     — demuestra que eres fan
┃ 🎮 *${p}videojuegos 3*     — reto gamer
┃ 🎴 *${p}yugioh 3*          — conocimiento de duelista
┃ ⚡ *${p}gx 3*              — especial Yu-Gi-Oh! GX
┃ 🏍️ *${p}5ds 3*             — especial Yu-Gi-Oh! 5D's
┃ 🧩 *${p}adivinanza 3*      — resuelve el misterio
┃ 💬 *${p}respuesta <texto>* — responde el reto activo
┃ 🎲 *${p}dado*              — tira los dados
┃ 🪙 *${p}moneda cara/cruz*  — deja que decida el destino
┃ ✊ *${p}ppt @usuario*      — piedra, papel o tijera
┃ ⚔️ *${p}duelo @usuario*    — duelo rápido con recompensa
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━ 🕹️ *𝑱𝑼𝑬𝑮𝑶𝑺 𝑾𝑬𝑩* ━━━━━━━━━━━━━━━━━━━
┃ 🎮 *${p}juegos*            — catálogo disponible
┃ 🕹️ *${p}catalogo*          — abre el arcade privado
┃ ▶️ *${p}jugar ID*           — abre una partida nueva
┃ 📂 *${p}continuar ID*       — retoma tu última partida
┃ 💾 *${p}mispartidas*        — consulta tus guardados
┃ 📊 *${p}progreso*           — tiempo y actividad de juego
┃ 🔎 *${p}buscarjuego nombre* — encuentra un juego rápido
┃ 🟢 *${p}sesion*             — mira tu sesión activa del arcade
┃ 🏅 *${p}logros juego ID*    — revisa los logros de un juego
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━ ✨ *𝑯𝑬𝑹𝑹𝑨𝑴𝑰𝑬𝑵𝑻𝑨𝑺* ━━━━━━━━━━━━━━
┃ 🖼️ *${p}sticker* o *${p}s* — responde a una imagen para crear un sticker
┃ 🌙 *${p}afk [motivo]*      — avisa que estás ausente
┃ ⏰ *${p}recordatorio 10m texto* — no olvides una tarea
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━ 👤 *𝑻𝑼 𝑬𝑿𝑷𝑬𝑫𝑰𝑬𝑵𝑻𝑬* ━━━━━━━━━━
┃ 🪪 *${p}perfil*            — muestra tu progreso
┃ 🏆 *${p}ranking global/grupo* — consulta el ranking
┃ ✍️ *${p}setdesc*           — escribe tu descripción
┃ ⚔️ *${p}desafio*           — reta a otro duelista
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━ 💙 *𝑺𝑶𝑪𝑰𝑨𝑳* ━━━━━━━━━━━━━━━━━━━━━
┃ 🪪 *${p}genero <opción>*   — actualiza tu perfil
┃ 💍 *${p}casarse @usuario*  — pide matrimonio
┃ 💌 *${p}aceptar/rechazar*  — responde una propuesta
┃ 💔 *${p}divorcio*          — finaliza el matrimonio
┃ 🤗 *${p}abrazo @usuario*   — da un abrazo
┃ 💋 *${p}beso @usuario*     — da un beso
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━ 🛡️ *𝑨𝑫𝑴𝑰𝑵𝑰𝑺𝑻𝑹𝑨𝑪𝑰Ó𝑵* ━━━━━━━━━
┃ 🚪 *${p}cerrar*            — restringe el grupo
┃ 🚪 *${p}abrir*             — vuelve a abrir el grupo
┃ 🔗 *${p}antilink on/off*    — protege los enlaces
┃ 🚫 *${p}antispam on/off*    — evita el spam
┃ 👢 *${p}kick*              — retira a un miembro
┃ ➕ *${p}add*               — añade a un miembro
┃ ⬆️ *${p}promote*           — asciende a administrador
┃ ⬇️ *${p}demote*            — retira el rango de administrador
┃ 📜 *${p}reglas*             — muestra las reglas del grupo
┃ ✍️ *${p}reglas poner texto* — establece las reglas
┃ 📣 *${p}tagall [mensaje]*   — menciona a todos los participantes
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👑 *${p}owner*  — conoce al creador
❄️ _— Alexis Rhodes · Juega con elegancia, gana con determinación._`;

    const candidatos = [config.assets?.menu, "./assets/menu.png", "./assets/menu.jpg"];
    const ruta = candidatos
        .filter(Boolean)
        .map(archivo => path.resolve(archivo))
        .find(archivo => fs.existsSync(archivo));
    if (ruta) return sock.sendMessage(msg.key.remoteJid, { image: fs.readFileSync(ruta), caption: texto });
    await sock.sendMessage(msg.key.remoteJid, { text: texto });
};
