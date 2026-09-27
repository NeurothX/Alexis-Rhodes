/* Descarga portadas locales desde la colección de carátulas de Libretro.
 * Sólo instala una imagen cuando el nombre coincide con la ficha exacta
 * indicada abajo; si no la encuentra, la deja pendiente en vez de adivinar. */
const fs = require("fs");
const path = require("path");
const { obtenerCatalogo } = require("../games/catalog");

const root = path.join(__dirname, "..");
const destination = path.join(root, "games", "web", "public", "covers", "installed");
const sources = {
    NES: "Nintendo_-_Nintendo_Entertainment_System",
    SNES: "Nintendo_-_Super_Nintendo_Entertainment_System",
    "Nintendo 64": "Nintendo_-_Nintendo_64",
    "Game Boy": "Nintendo_-_Game_Boy",
    "Game Boy Color": "Nintendo_-_Game_Boy_Color",
    "Game Boy Advance": "Nintendo_-_Game_Boy_Advance"
};
const exactTitles = {
    mario: ["Super Mario Bros."], mario2: ["Super Mario Bros. 2"], mario3: ["Super Mario Bros. 3"],
    "dr-mario": ["Dr. Mario"], contra: ["Contra"], spy: ["Spy vs Spy"], "zelda-nes": ["Legend of Zelda, The"],
    "zelda-snes": ["Legend of Zelda, The - A Link to the Past"], kart: ["Super Mario Kart"],
    "mario-rpg": ["Super Mario RPG - Legend of the Seven Stars"], "mario-world": ["Super Mario World"],
    yoshi: ["Super Mario World 2 - Yoshi's Island", "Yoshi's Island"], zelda: ["Legend of Zelda, The - The Minish Cap"],
    esmeralda: ["Pokemon - Emerald Version"], rojo: ["Pokemon - FireRed Version"],
    "ygo-2004": ["Yu-Gi-Oh! World Championship Tournament 2004"], "ygo-2005": ["Yu-Gi-Oh! 7 Trials to Glory - World Championship Tournament 2005", "Yu-Gi-Oh! Day of the Duelist - World Championship Tournament 2005"],
    "ygo-destiny": ["Yu-Gi-Oh! Destiny Board Traveler"], "ygo-reshef": ["Yu-Gi-Oh! Reshef of Destruction"],
    "ygo-world": ["Yu-Gi-Oh! Worldwide Edition - Stairway to the Destined Duel"], "ygo-2006": ["Yu-Gi-Oh! Ultimate Masters Edition - World Championship Tournament 2006", "Yu-Gi-Oh! Ultimate Masters - World Championship Tournament 2006"],
    "city-connection": ["City Connection"], "f1-race": ["F-1 Race"], "ice-climber": ["Ice Climber"], "kirby-adventure": ["Kirby's Adventure"],
    "ninja-gaiden": ["Ninja Gaiden"], "ninja-gaiden2": ["Ninja Gaiden II - The Dark Sword of Chaos"], "slalom": ["Slalom"],
    tmnt3: ["Teenage Mutant Ninja Turtles III - The Manhattan Project"], "tiny-toon": ["Tiny Toon Adventures"],
    "urban-champion": ["Urban Champion"], "yie-ar-kungfu": ["Yie Ar Kung-Fu"], "dk-country3": ["Donkey Kong Country 3 - Dixie Kong's Double Trouble!"],
    "spider-man-xmen": ["Spider-Man - X-Men - Arcade's Revenge"], "street-fighter2-turbo": ["Street Fighter II Turbo"], "bomberman4": ["Super Bomberman 4"],
    "f1-world-gp2": ["F-1 World Grand Prix II"], "zelda-majoras-mask": ["Legend of Zelda, The - Majora's Mask"], mario64: ["Super Mario 64"], "zelda-ocarina": ["Legend of Zelda, The - Ocarina of Time"],
    "castlevania-harmony": ["Castlevania - Harmony of Dissonance"], "dk-country2": ["Donkey Kong Country 2"], "dbz-buus-fury": ["Dragon Ball Z - Buu's Fury"],
    "ff4-advance": ["Final Fantasy IV Advance"], "fire-emblem": ["Fire Emblem"], "kirby-mirror": ["Kirby _ The Amazing Mirror"], "megaman-zero": ["Mega Man Zero"],
    "naruto-nc2": ["Naruto - Ninja Council 2"], "pokemon-mystery": ["Pokemon Mystery Dungeon - Red Rescue Team"], "one-piece-shonen": ["One Piece"],
    "sonic-advance2": ["Sonic Advance 2"], "top-gear-rally": ["Top Gear Rally"]
};
function normal(value) { return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
async function filesFor(system) {
    // `contents` sólo devuelve las primeras 1.000 imágenes; las series como
    // Pokémon/Yu-Gi-Oh quedan fuera. El árbol contiene el catálogo completo.
    const url = `https://api.github.com/repos/libretro-thumbnails/${sources[system]}/git/trees/master?recursive=1`;
    const response = await fetch(url, { headers: { "User-Agent": "AlexisRhodes-CoverInstaller" } });
    if (!response.ok) throw new Error(`${system}: GitHub respondió ${response.status}`);
    const tree = await response.json();
    if (tree.truncated) throw new Error(`${system}: catálogo de portadas incompleto en GitHub`);
    return tree.tree
        .filter(file => file.type === "blob" && file.path.startsWith("Named_Boxarts/") && file.path.endsWith(".png"))
        .map(file => ({ name: path.basename(file.path), download_url: `https://raw.githubusercontent.com/libretro-thumbnails/${sources[system]}/master/${file.path.split("/").map(encodeURIComponent).join("/")}` }));
}
function exactFile(files, aliases) {
    const forbidden = /PlayChoice|\[(?:h|p|b|a|u)|FDS|Alternate/i;
    for (const title of aliases) {
        const candidates = files.filter(file => file.name.startsWith(`${title} (`) && !forbidden.test(file.name));
        if (candidates.length) return candidates.sort((a, b) => a.name.length - b.name.length)[0];
    }
    return null;
}
async function main() {
    fs.mkdirSync(destination, { recursive: true });
    const catalog = obtenerCatalogo(); const indexes = new Map();
    for (const system of [...new Set(catalog.map(game => game.platform))]) indexes.set(system, await filesFor(system));
    let installed = 0, pending = 0;
    for (const game of catalog) {
        const aliases = exactTitles[game.id];
        if (!aliases) { console.log(`⚠️ Sin ficha exacta: ${game.id}`); pending++; continue; }
        const asset = exactFile(indexes.get(game.platform), aliases);
        if (!asset?.download_url) { console.log(`⚠️ Portada exacta no encontrada: ${game.id}`); pending++; continue; }
        const image = await fetch(asset.download_url, { headers: { "User-Agent": "AlexisRhodes-CoverInstaller" } });
        const bytes = Buffer.from(await image.arrayBuffer());
        if (!image.ok || bytes.length < 1000 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
            console.log(`⚠️ Archivo inválido: ${game.id}`); pending++; continue;
        }
        fs.writeFileSync(path.join(destination, `${game.id}.png`), bytes);
        console.log(`✅ ${game.id} ← ${asset.name}`); installed++;
    }
    console.log(`\nPortadas instaladas: ${installed}. Pendientes: ${pending}.`);
}
main().catch(error => { console.error(`❌ No se instalaron las portadas: ${error.message}`); process.exitCode = 1; });
