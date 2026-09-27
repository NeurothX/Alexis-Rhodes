const fs = require("fs");
const path = require("path");

const carpeta = path.join(__dirname, "catalog");
const roms = path.join(__dirname, "roms");
const campos = ["id", "name", "platform", "description", "credits", "rightsHolder", "resource", "runner"];

const plataformas = {
    nes: { platform: "NES", extensiones: [".nes"], runner: "jsnes", emulator: "JSNES · Apache-2.0" },
    snes: { platform: "SNES", extensiones: [".sfc", ".smc"], runner: "emulatorjs", core: "snes9x", emulator: "EmulatorJS/Snes9x · GPL-3.0" },
    n64: { platform: "Nintendo 64", extensiones: [".z64", ".n64", ".v64"], runner: "emulatorjs", core: "mupen64plus_next", emulator: "EmulatorJS/Mupen64Plus-Next · GPL-2.0" },
    genesis: { platform: "Mega Drive", extensiones: [".md", ".gen", ".bin"], runner: "emulatorjs", core: "genesis_plus_gx", emulator: "EmulatorJS/Genesis Plus GX · GPL-3.0" },
    psp: { platform: "PSP", extensiones: [".iso", ".cso"], runner: "emulatorjs", core: "ppsspp", emulator: "EmulatorJS/PPSSPP · GPL-2.0+" },
    gb: { platform: "Game Boy", extensiones: [".gb"], runner: "emulatorjs", core: "gambatte", emulator: "EmulatorJS/Gambatte · GPL-2.0" },
    gbc: { platform: "Game Boy Color", extensiones: [".gbc"], runner: "emulatorjs", core: "gambatte", emulator: "EmulatorJS/Gambatte · GPL-2.0" },
    gba: { platform: "Game Boy Advance", extensiones: [".gba"], runner: "emulatorjs", core: "mgba", emulator: "EmulatorJS/mGBA · GPL-3.0/MPL-2.0" }
};

function slug(valor) { return String(valor).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function idCorto(sistema, nombre) {
    const texto = String(nombre).toLowerCase();
    if (/super mario bros\. 3/.test(texto)) return "mario3";
    if (/super mario bros\. 2/.test(texto)) return "mario2";
    if (/super mario bros/.test(texto)) return "mario";
    if (/dr\. mario/.test(texto)) return "dr-mario";
    if (/spy vs spy/.test(texto)) return "spy";
    if (/\bcontra\b/.test(texto)) return "contra";
    if (/a link to the past/.test(texto)) return "zelda-snes";
    if (/super mario rpg/.test(texto)) return "mario-rpg";
    if (/yoshi.s island/.test(texto)) return "yoshi";
    if (/super mario world/.test(texto)) return "mario-world";
    if (/mario kart/.test(texto)) return "kart";
    if (/day of the duelist.*2005/.test(texto)) return "ygo-2005";
    if (/destiny board/.test(texto)) return "ygo-destiny";
    if (/reshef/.test(texto)) return "ygo-reshef";
    if (/world championship tournament 2004/.test(texto)) return "ygo-2004";
    if (/worldwide edition/.test(texto)) return "ygo-world";
    if (/ultimate masters 2006/.test(texto)) return "ygo-2006";
    if (/pokemon.*esmeralda/.test(texto)) return "esmeralda";
    if (/pokemon.*rojo fuego/.test(texto)) return "rojo";
    if (/minish cap/.test(texto)) return "zelda";
    if (/majora.s mask/.test(texto)) return "zelda-majoras-mask";
    if (/ocarina of time/.test(texto)) return "zelda-ocarina";
    if (/legend of zelda/.test(texto)) return "zelda-nes";
    if (/harmony of dissonance/.test(texto)) return "castlevania-harmony";
    if (/donkey kong country 2/.test(texto)) return "dk-country2";
    if (/donkey kong country 3/.test(texto)) return "dk-country3";
    if (/buu.s fury/.test(texto)) return "dbz-buus-fury";
    if (/final fantasy iv/.test(texto)) return "ff4-advance";
    if (/fire emblem/.test(texto)) return "fire-emblem";
    if (/amazing mirror/.test(texto)) return "kirby-mirror";
    if (/kirby.s adventure/.test(texto)) return "kirby-adventure";
    if (/mega ?man zero/.test(texto)) return "megaman-zero";
    if (/ninja council 2/.test(texto)) return "naruto-nc2";
    if (/mundo misterioso/.test(texto)) return "pokemon-mystery";
    if (/one piece/.test(texto)) return "one-piece-shonen";
    if (/sonic advance 2/.test(texto)) return "sonic-advance2";
    if (/top gear rally/.test(texto)) return "top-gear-rally";
    if (/city connection/.test(texto)) return "city-connection";
    if (/ice climber/.test(texto)) return "ice-climber";
    if (/ninja gaiden ii/.test(texto)) return "ninja-gaiden2";
    if (/ninja gaiden/.test(texto)) return "ninja-gaiden";
    if (/slalom/.test(texto)) return "slalom";
    if (/manhattan project/.test(texto)) return "tmnt3";
    if (/tiny toon adventures 6/.test(texto)) return "tiny-toon6";
    if (/tiny toon adventures/.test(texto)) return "tiny-toon";
    if (/urban champion/.test(texto)) return "urban-champion";
    if (/yie ar kung.?fu/.test(texto)) return "yie-ar-kungfu";
    if (/f-1 world grand prix ii/.test(texto)) return "f1-world-gp2";
    if (/f-1 race/.test(texto)) return "f1-race";
    if (/super mario 64/.test(texto)) return "mario64";
    if (/street fighter ii turbo/.test(texto)) return "street-fighter2-turbo";
    if (/bomber man 4/.test(texto)) return "bomberman4";
    if (/spider-man.*x-men.*arcade.s revenge/.test(texto)) return "spider-man-xmen";
    return `${sistema}-${slug(nombre).split("-").slice(0, 2).join("-")}`;
}
function catalogoRoms() {
    if (!fs.existsSync(roms)) return [];
    return Object.entries(plataformas).flatMap(([sistema, datos]) => {
        const directorio = path.join(roms, sistema);
        if (!fs.existsSync(directorio)) return [];
        return fs.readdirSync(directorio, { withFileTypes: true }).filter(item => item.isFile() && datos.extensiones.includes(path.extname(item.name).toLowerCase())).map(item => {
            const archivo = path.join(directorio, item.name);
            const metaPath = `${archivo}.json`;
            let meta = {};
            try {
                if (fs.existsSync(metaPath)) meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
                const nombre = path.basename(item.name, path.extname(item.name));
                return { id: meta.id || idCorto(sistema, nombre), name: meta.name || nombre, platform: datos.platform, description: meta.description || "ROM local.", image: meta.image || null, credits: meta.credits || "", rightsHolder: meta.rightsHolder || "", resource: `local:roms/${sistema}/${item.name}`, emulator: datos.emulator, runner: datos.runner, core: datos.core, enabled: meta.enabled !== false, romPath: archivo };
            } catch (error) { console.warn(`⚠️ Manifiesto ROM inválido: ${metaPath}`, error.message); return null; }
        }).filter(Boolean);
    });
}

function obtenerCatalogo() {
    if (!fs.existsSync(carpeta)) return [];
    const fijos = fs.readdirSync(carpeta)
        .filter(archivo => archivo.endsWith(".json"))
        .map(archivo => {
            try { return JSON.parse(fs.readFileSync(path.join(carpeta, archivo), "utf8")); }
            catch (error) { console.log(`⚠️ Catálogo inválido: ${archivo}`, error.message); return null; }
        })
        .filter(juego => juego && juego.enabled !== false && campos.every(campo => typeof juego[campo] === "string" && juego[campo].trim()));
    return [...fijos, ...catalogoRoms()];
}

function obtenerJuego(id) {
    const limpio = String(id || "").trim().toLowerCase();
    return obtenerCatalogo().find(juego => juego.id.toLowerCase() === limpio) || null;
}

module.exports = { obtenerCatalogo, obtenerJuego };
