const { agregarDinero, agregarXP } = require("../database/economy");
const partidas = new Map();
const DURACION = 2 * 60 * 1000;
const dificultades = {
    1: { nombre: "Principiante", dinero: 100, xp: 10 },
    2: { nombre: "Fácil", dinero: 200, xp: 20 },
    3: { nombre: "Media", dinero: 350, xp: 35 },
    4: { nombre: "Difícil", dinero: 550, xp: 55 },
    5: { nombre: "Experta", dinero: 800, xp: 80 }
};

const semillas = {
    anime: [
        ["¿Quién es el protagonista de Naruto?", "naruto"], ["¿Cómo se llama la aldea de Naruto?", "konoha"], ["¿Quién es el capitán de los Sombrero de Paja?", "luffy"], ["¿Quién usa el Death Note como Kira?", "light yagami"], ["¿Quién hereda One For All?", "izuku midoriya"],
        ["¿Qué criatura acompaña a Ash Ketchum?", "pikachu"], ["¿Quién protagoniza Dragon Ball?", "goku"], ["¿Quién es el protagonista de Demon Slayer?", "tanjiro"], ["¿Qué personaje pilota el EVA-01?", "shinji ikari"], ["¿Cómo se llama la protagonista de Sailor Moon?", "usagi"]
    ],
    videojuegos: [
        ["¿Qué compañía creó a Mario?", "nintendo"], ["¿Cómo se llama el héroe de Zelda?", "link"], ["¿Qué compañía creó a Sonic?", "sega"], ["¿Quién protagoniza God of War?", "kratos"], ["¿En qué juego construyes con bloques?", "minecraft"],
        ["¿Quién protagoniza Tomb Raider?", "lara croft"], ["¿Cómo se llama el protagonista de Halo?", "master chief"], ["¿Qué personaje amarillo come puntos en laberintos?", "pacman"], ["¿Cómo se llama el reino de Zelda?", "hyrule"], ["¿Qué personaje es la mascota de PlayStation?", "crash bandicoot"]
    ],
    yugioh: [
        ["¿Quién es el protagonista original de Yu-Gi-Oh!?", "yugi muto"], ["¿Qué dragón usa Seto Kaiba?", "dragon blanco de ojos azules"], ["¿Cuál es el monstruo característico de Yugi?", "mago oscuro"], ["¿Cómo se llama el rompecabezas de Yugi?", "rompecabezas del milenio"], ["¿Qué carta divina usa Kaiba?", "obelisco el atormentador"],
        ["¿Quién es el espíritu del Rompecabezas del Milenio?", "atem"], ["¿Cómo se llama el torneo de la isla de Pegasus?", "reino de los duelistas"], ["¿Qué dios egipcio usa Yugi?", "slifer el dragon del cielo"], ["¿Quién creó Duelo de Monstruos?", "maximillion pegasus"], ["¿Qué monstruo es la fusión de Yugi y Joey en el manga?", "dragon negro de ojos rojos"]
    ],
    gx: [
        ["¿Quién protagoniza Yu-Gi-Oh! GX?", "jaden yuki"], ["¿Qué arquetipo usa Jaden?", "heroe elemental"], ["¿Qué duelista usa Cyber Angel?", "alexis rhodes"], ["¿A qué dormitorio pertenece Alexis?", "obelisk blue"], ["¿Cómo se llama la academia de GX?", "duel academy"],
        ["¿Qué arquetipo usa Zane Truesdale?", "cyber dragon"], ["¿Quién es el hermano mayor de Syrus?", "zane truesdale"], ["¿Cómo se llama el rival de Jaden que usa Ojamas?", "chazz princeton"], ["¿Qué dormitorio representa a los alumnos nuevos?", "slifer red"], ["¿Qué color de dormitorio representa a los mejores alumnos?", "obelisk blue"]
    ],
    "5ds": [
        ["¿Quién protagoniza Yu-Gi-Oh! 5D's?", "yusei fudo"], ["¿Cómo se llama el dragón de Yusei?", "stardust dragon"], ["¿Quién usa el Dragón Rojo Archidemonio?", "jack atlas"], ["¿Cómo se llaman los duelos en motocicleta?", "turbo duelo"], ["¿En qué ciudad ocurre 5D's?", "new domino city"],
        ["¿Qué monstruo as de Akiza es un dragón negro?", "black rose dragon"], ["¿Cómo se llama el amigo mecánico de Yusei?", "crow hogan"], ["¿Qué marca tienen los Signers?", "marca del dragon"], ["¿Cómo se llama la motocicleta de Yusei?", "duel runner"], ["¿Qué arquetipo usa Yusei?", "synchron"]
    ],
    adivinanza: [
        ["No se puede ver ni tocar, pero todo lo cambia. ¿Qué es?", "tiempo"], ["Repite lo que dices, pero nunca inicia una conversación. ¿Qué es?", "eco"], ["Cuanto más le quitas, más grande se vuelve. ¿Qué es?", "agujero"], ["Tiene teclas, pero no abre cerraduras. ¿Qué es?", "piano"], ["Te acompaña con luz y desaparece en oscuridad. ¿Qué es?", "sombra"],
        ["Tiene manos, pero no puede aplaudir. ¿Qué es?", "reloj"], ["Tiene ciudades y caminos, pero no personas. ¿Qué es?", "mapa"], ["Cae del cielo, pero no se lastima. ¿Qué es?", "lluvia"], ["No tiene boca, pero puede silbar. ¿Qué es?", "viento"], ["Tiene muchas páginas, pero no es un árbol. ¿Qué es?", "libro"],
        ["Tiene dientes, pero no puede morder. ¿Qué es?", "peine"], ["Mientras más seco está, más moja. ¿Qué es?", "toalla"], ["Tiene cuello, pero no cabeza. ¿Qué es?", "botella"], ["Viaja por todo el mundo sin moverse de una esquina. ¿Qué es?", "sello"], ["Tiene un ojo, pero no puede ver. ¿Qué es?", "aguja"],
        ["¿Qué sube, pero nunca baja?", "edad"], ["Si me nombras, desaparezco. ¿Qué soy?", "silencio"], ["Tiene ramas, pero no hojas ni frutos. ¿Qué es?", "banco"], ["¿Qué se rompe antes de usarse?", "huevo"], ["No tiene vida, pero puede morir. ¿Qué es?", "bateria"],
        ["Siempre está delante de ti, pero no puedes verlo. ¿Qué es?", "futuro"], ["Tiene una cama, pero no duerme; tiene boca, pero no habla. ¿Qué es?", "rio"], ["¿Qué puedes atrapar, pero no lanzar?", "resfriado"], ["¿Qué tiene cabeza y cola, pero no cuerpo?", "moneda"], ["¿Qué se vuelve más grande cuanto más se comparte?", "conocimiento"],
        ["Tiene anillos, pero no dedos. ¿Qué es?", "arbol"], ["¿Qué llena una habitación sin ocupar espacio?", "luz"], ["¿Qué tiene llaves, pero no abre puertas?", "teclado"], ["¿Qué puede correr, pero no caminar?", "agua"], ["¿Qué está lleno de agujeros, pero aún retiene agua?", "esponja"]
    ]
};

const prefijos = ["Ronda inicial", "Prueba de duelista", "Desafío táctico", "Reto avanzado", "Examen experto"];
function crearBanco(datos) {
    return datos.flatMap(([pregunta, respuesta]) => prefijos.map((prefijo, indice) => ({
        pregunta: `${prefijo} — ${pregunta}`,
        respuesta,
        dificultad: indice + 1
    })));
}
const bancos = Object.fromEntries(Object.entries(semillas).map(([tipo, datos]) => [tipo, crearBanco(datos)]));

function normalizar(valor) { return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
function preguntaMatematicas(d) {
    const limite = [10, 25, 60, 120, 250][d - 1];
    const a = Math.floor(Math.random() * limite) + 1, b = Math.floor(Math.random() * limite) + 1;
    if (d <= 2) return { pregunta: `Resuelve: *${a} + ${b}*`, respuesta: String(a + b) };
    if (d === 3) return { pregunta: `Resuelve: *${a} × ${b}*`, respuesta: String(a * b) };
    const divisor = Math.floor(Math.random() * 12) + 2, resultado = Math.floor(Math.random() * limite) + 10;
    return { pregunta: `Resuelve: *(${resultado * divisor} ÷ ${divisor}) + ${a}*`, respuesta: String(resultado + a) };
}
function elegir(tipo, dificultad) {
    if (tipo === "matematicas") return preguntaMatematicas(dificultad);
    const opciones = bancos[tipo].filter(pregunta => pregunta.dificultad === dificultad);
    return opciones[Math.floor(Math.random() * opciones.length)];
}
async function iniciar(sock, msg, tipo, dificultad) {
    const chat = msg.key.remoteJid;
    if (partidas.has(chat)) return sock.sendMessage(chat, { text: "❄️ Ya hay un desafío activo. Concéntrate en él y responde con *#respuesta* antes de iniciar otro." });
    const ronda = elegir(tipo, dificultad), premio = dificultades[dificultad];
    partidas.set(chat, { ...ronda, tipo, dificultad, vence: Date.now() + DURACION });
    await sock.sendMessage(chat, { text: `╭─🎴 *${tipo.toUpperCase()} · NIVEL ${dificultad}*\n│ 🏅 Rango: *${premio.nombre}*\n╰────────────────\n\n${ronda.pregunta}\n\n💎 Premio: *$${premio.dinero}* y *${premio.xp} XP*\n⏳ Tienes 2 minutos. Responde: *#respuesta tu respuesta*\n🌹 _Alexis: piensa antes de jugar tu carta._` });
}
async function responder(sock, msg, args) {
    const chat = msg.key.remoteJid, user = msg.key.participant || chat, partida = partidas.get(chat);
    if (!partida) return sock.sendMessage(chat, { text: "❄️ No hay una pregunta activa. Inicia una cuando estés listo para el desafío." });
    if (Date.now() > partida.vence) { partidas.delete(chat); return sock.sendMessage(chat, { text: "⌛ El tiempo terminó. No pierdas la calma: inicia otra ronda y vuelve a intentarlo." }); }
    if (normalizar(args.join(" ")) !== normalizar(partida.respuesta)) return sock.sendMessage(chat, { text: "❄️ Esa no es la respuesta. Analiza las pistas y vuelve a intentarlo, duelista." });
    partidas.delete(chat); const premio = dificultades[partida.dificultad]; agregarDinero(user, premio.dinero);
    const resultadoXP = agregarXP(user, premio.xp);
    await sock.sendMessage(chat, { text: `🏆 *¡Correcto!* Esa fue una jugada brillante.\n💎 Ganaste *$${premio.dinero}* y *${premio.xp} XP*.${resultadoXP.subioNivel ? `\n🎉 ¡Subiste al nivel ${resultadoXP.usuario.nivel}!` : ""}` });
}
module.exports = { iniciar, responder, dificultades, bancos };
