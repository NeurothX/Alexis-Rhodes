const { articulos, comprar, inventarioDe } = require("../../systems/shopSystem");

function usuario(msg) { return msg.key.participant || msg.key.remoteJid; }

async function tienda(sock, msg) {
    const texto = articulos.map(a => `${a.emoji} *${a.id}* — ${a.nombre}\n   $${a.precio.toLocaleString()} · ${a.descripcion}`).join("\n\n");
    await sock.sendMessage(msg.key.remoteJid, { text: `╭─💎 *𝑻𝑰𝑬𝑵𝑫𝑨 𝑫𝑬 𝑳𝑨 𝑨𝑪𝑨𝑫𝑬𝑴𝑰𝑨*\n│ _Elige con cuidado: cada objeto habla de ti._\n╰────────────────\n\n${texto}\n\n🎴 Compra: *#comprar ID* · Ejemplo: *#comprar cyber_angel*\n🎒 Revisa tus objetos: *#inventario*` });
}

async function comprarCmd(sock, msg, args) {
    const resultado = comprar(usuario(msg), args[0]);
    const chat = msg.key.remoteJid;
    if (resultado.motivo === "no_existe") return sock.sendMessage(chat, { text: "❄️ No encuentro ese artículo en el inventario de la Academia. Usa *#tienda* para ver los IDs." });
    if (resultado.motivo === "ya_tiene") return sock.sendMessage(chat, { text: `🌹 Ya tienes *${resultado.articulo.nombre}*. Un duelista elegante no necesita duplicados.` });
    if (resultado.motivo === "sin_dinero") return sock.sendMessage(chat, { text: `❄️ Aún te faltan monedas para *${resultado.articulo.nombre}*. Entrena, trabaja y vuelve cuando estés listo.` });
    await sock.sendMessage(chat, { text: `🎉 *Compra completada:* ${resultado.articulo.nombre}\n💎 Precio: *$${resultado.articulo.precio.toLocaleString()}*\n🌹 Úsalo con orgullo, duelista.` });
}

async function inventario(sock, msg) {
    const objetos = inventarioDe(usuario(msg));
    const texto = objetos.length ? objetos.map(a => `${a.emoji} ${a.nombre}`).join("\n") : "Aún no tienes objetos. Visita *#tienda*.";
    await sock.sendMessage(msg.key.remoteJid, { text: `🎒 *INVENTARIO DEL DUELISTA*\n\n${texto}` });
}

module.exports = { tienda, comprarCmd, inventario };
