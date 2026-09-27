const {
    obtenerUsuario,
    actualizarUsuario,
    quitarDinero
} = require("../database/economy");

const articulos = [
    { id: "cyber_angel", nombre: "Insignia Cyber Angel", precio: 1500, emoji: "💎", descripcion: "Una insignia exclusiva para tu inventario." },
    { id: "obelisk", nombre: "Emblema Obelisk Blue", precio: 2500, emoji: "🔷", descripcion: "Representa a la élite de la Academia." },
    { id: "mazo_ritual", nombre: "Mazo Ritual", precio: 5000, emoji: "🎴", descripcion: "Una pieza de colección de Alexis Rhodes." },
    { id: "amuleto", nombre: "Amuleto de la Suerte", precio: 3500, emoji: "🍀", descripcion: "Un talismán para duelistas persistentes." },
    { id: "corona", nombre: "Corona del Rey de los Duelos", precio: 12000, emoji: "👑", descripcion: "El premio de los verdaderos campeones." },
    { id: "nucleo", nombre: "Núcleo Cyber Angel", precio: 8000, emoji: "❄️", descripcion: "Reliquia especial de la Academia." }
];

function buscarArticulo(id) {
    return articulos.find(a => a.id === String(id || "").toLowerCase());
}

function comprar(userId, id) {
    const articulo = buscarArticulo(id);
    if (!articulo) return { ok: false, motivo: "no_existe" };
    const usuario = obtenerUsuario(userId);
    const inventario = Array.isArray(usuario.inventario) ? usuario.inventario : [];
    if (inventario.includes(articulo.id)) return { ok: false, motivo: "ya_tiene", articulo };
    const pago = quitarDinero(userId, articulo.precio);
    if (!pago.success) return { ok: false, motivo: "sin_dinero", articulo };
    actualizarUsuario(userId, { inventario: [...inventario, articulo.id] });
    return { ok: true, articulo };
}

function inventarioDe(userId) {
    const usuario = obtenerUsuario(userId);
    const ids = Array.isArray(usuario.inventario) ? usuario.inventario : [];
    return articulos.filter(a => ids.includes(a.id));
}

module.exports = { articulos, comprar, inventarioDe };
