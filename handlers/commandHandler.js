const config = require("../config");
const { estaEncendido } = require("../systems/botState");
const { esOwner } = require("../systems/permissions");

const menuCmd = require("../commands/menu");
const ownerCmd = require("../commands/owner");

const kickCmd = require("../commands/admin/kick");
const addCmd = require("../commands/admin/add");
const promoteCmd = require("../commands/admin/promote");
const demoteCmd = require("../commands/admin/demote");
const groupCmd = require("../commands/admin/group");

const balanceCmd =
    require("../commands/economy/balance");
const dailyCmd =
    require("../commands/economy/daily");
const workCmd =
    require("../commands/economy/work");
const giveCmd =
    require("../commands/economy/give");
const topCmd =
    require("../commands/economy/top");

const perfilCmd =
    require("../commands/profile/perfil");
const setdescCmd =
    require("../commands/profile/setdesc");
const desafioCmd =
    require("../commands/games/desafio");
const pptCmd =
    require("../commands/games/ppt");
const addmoneyCmd =
    require("../commands/owner/addmoney");
const botpowerCmd =
    require("../commands/owner/botpower");
const antispamCmd =
    require("../commands/admin/antispam");
const antilinkCmd =
    require("../commands/admin/antilink");
const azarCmd =
    require("../commands/games/azar");
const {
    tienda,
    comprarCmd,
    inventario
} = require("../commands/economy/shop");
const quizCmd =
    require("../commands/games/quiz");
const stickerCmd =
    require("../commands/media/sticker");
const animeCmd =
    require("../commands/anime");
const pingCmd =
    require("../commands/ping");
const rulesCmd = require("../commands/rules");
const dueloCmd = require("../commands/duelo");
const recordatorioCmd = require("../commands/recordatorio");
const { reporte: reporteCmd, sugerencia: sugerenciaCmd } = require("../commands/report");
const tagallCmd = require("../commands/admin/tagall");
const socialCmd = require("../commands/social/social");
const juegosCmd = require("../commands/juegos");
const arcadeProgressCmd = require("../commands/arcade-progress");

// ==========================================
// COMANDOS
// ==========================================

const comandos = {

    menu: menuCmd,
    ayuda: menuCmd,
    comandos: menuCmd,
    ping: pingCmd,
    reglas: rulesCmd,
    duelo: dueloCmd,
    recordatorio: recordatorioCmd,
    reporte: reporteCmd,
    sugerencia: sugerenciaCmd,
    tagall: tagallCmd,
    todos: tagallCmd,
    owner: ownerCmd,

    kick: kickCmd,
    add: addCmd,
    promote: promoteCmd,
    demote: demoteCmd,
    cerrar: (sock, msg) => groupCmd(sock, msg, "cerrar"),
    abrir: (sock, msg) => groupCmd(sock, msg, "abrir"),

    balance: balanceCmd,
    daily: dailyCmd,
    work: workCmd,
    give: giveCmd,
    top: topCmd,
    ranking: topCmd,
    perfil: perfilCmd,
    setdesc: setdescCmd,
    genero: socialCmd.genero,
    casarse: socialCmd.casarse,
    matrimonio: socialCmd.casarse,
    aceptar: socialCmd.aceptar,
    rechazar: socialCmd.rechazar,
    divorcio: socialCmd.divorcio,
    abrazo: socialCmd.abrazo,
    beso: socialCmd.beso,
    juegos: juegosCmd.juegos,
    catalogo: juegosCmd.catalogo,
    arcade: juegosCmd.catalogo,
    jugar: juegosCmd.jugar,
    continuar: juegosCmd.continuar,
    mispartidas: juegosCmd.misPartidas,
    progreso: juegosCmd.progreso,
    buscarjuego: juegosCmd.buscarJuego,
    buscajuego: juegosCmd.buscarJuego,
    sesion: juegosCmd.sesionArcade,
    sesionarcade: juegosCmd.sesionArcade,
    logros: arcadeProgressCmd.logros,
    mislogros: arcadeProgressCmd.logros,
    records: arcadeProgressCmd.records,
    record: arcadeProgressCmd.records,
    misrecords: arcadeProgressCmd.records,
    rankingjuego: arcadeProgressCmd.ranking,
    mejorestiempos: (sock, msg, args) => arcadeProgressCmd.ranking(sock, msg, [args[0], "tiempo"]),
    historialrecords: arcadeProgressCmd.history,
    museo: arcadeProgressCmd.history,
    salon: arcadeProgressCmd.fame,
    salonfama: arcadeProgressCmd.fame,
    misiones: arcadeProgressCmd.missions,
    avisosrecords: arcadeProgressCmd.avisosRecords,
    desafio: desafioCmd,
    ppt: pptCmd,
    ptt: pptCmd,
    piedrapapeltijera: pptCmd,
    pvp: pptCmd,
    addmoney: addmoneyCmd,
    antispam: antispamCmd,
    antilink: antilinkCmd,
    apagar: (sock, msg) => botpowerCmd(sock, msg, ["apagar"]),
    prender: (sock, msg) => botpowerCmd(sock, msg, ["prender"]),
    dado: (sock, msg, args) => azarCmd(sock, msg, args, "dado"),
    moneda: (sock, msg, args) => azarCmd(sock, msg, args, "moneda"),
    tienda,
    comprar: comprarCmd,
    inventario,
    matematicas: quizCmd.matematicas,
    anime: animeCmd,
    triviaanime: quizCmd.anime,
    videojuegos: quizCmd.videojuegos,
    yugioh: quizCmd.yugioh,
    gx: quizCmd.gx,
    "5ds": quizCmd["5ds"],
    trivia: quizCmd.trivia,
    adivinanza: quizCmd.adivinanza,
    respuesta: quizCmd.responder,
    sticker: stickerCmd,
    s: stickerCmd,
};


// ==========================================
// PROCESAR COMANDO
// ==========================================

async function procesarComando(sock, msg, texto) {

    const prefix =
        config.prefix || "#";

    const mensaje =
        texto.trim();

    if (!mensaje.startsWith(prefix)) {
        return;
    }

    const contenido =
        mensaje
            .slice(prefix.length)
            .trim();

    if (!contenido) {
        return;
    }

    const partes =
        contenido.split(/\s+/);

    const comando =
        partes[0].toLowerCase();

    const argumentos =
        partes.slice(1);

    if (!estaEncendido() && !(comando === "prender" && esOwner(msg))) {
        return;
    }


    console.log("");

    console.log(
        "================================"
    );

    console.log(
        "🔥 COMANDO DETECTADO"
    );

    console.log(
        "Prefijo: " + prefix
    );

    console.log(
        "Comando: " + comando
    );

    console.log(
        "Argumentos: " +
        argumentos.join(" ")
    );

    console.log(
        "================================"
    );


    const ejecutar =
        comandos[comando];


    // ==========================================
    // COMANDO EXISTE
    // ==========================================

    if (ejecutar) {

        await ejecutar(
            sock,
            msg,
            argumentos
        );

        return;
    }


    // ==========================================
    // COMANDO DESCONOCIDO
    // ==========================================

    await sock.sendMessage(
        msg.key.remoteJid,
        {
            text:
`╭─❄️ *𝑨𝑳𝑬𝑿𝑰𝑺 𝑹𝑯𝑶𝑫𝑬𝑺*
│ Ese comando no está en mi mazo, duelista.
│ 🔎 No reconozco *${prefix}${comando}*.
╰─ 🎴 Usa *${prefix}menu* para elegir tu próxima jugada.`
        }
    );
}


module.exports = {
    procesarComando
};
