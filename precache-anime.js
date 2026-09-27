const fs = require("fs");
const path = require("path");
const {
    categorias,
    generosAniList,
    etiquetasAniList,
    busquedasAniList,
    categoriasKitsu
} = require("./commands/anime");

const carpeta = path.join(__dirname, "assets", "anime-cache");
const archivoCatalogo = path.join(carpeta, "catalogo.json");
const LIMITE_POR_CATEGORIA = 500;
const ESPERA_MS = 1300;

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function leerCatalogo() {
    try {
        return fs.existsSync(archivoCatalogo) ? JSON.parse(fs.readFileSync(archivoCatalogo, "utf8")) : {};
    } catch (error) {
        console.log("⚠️ No pude leer el catálogo previo; se creará uno nuevo.");
        return {};
    }
}

function guardarCatalogo(catalogo) {
    fs.mkdirSync(carpeta, { recursive: true });
    fs.writeFileSync(archivoCatalogo, JSON.stringify(catalogo, null, 2), "utf8");
}

async function pedirJikan(url) {
    for (let intento = 1; intento <= 4; intento++) {
        try {
            const respuesta = await fetch(url);
            if (respuesta.ok) return respuesta.json();
            if (respuesta.status !== 429 && respuesta.status < 500) throw new Error(`Jikan respondió ${respuesta.status}`);
        } catch (error) {
            if (intento === 4) throw error;
        }
        await esperar(ESPERA_MS * intento);
    }
    throw new Error("Jikan no respondió");
}

async function pedirAniList(id, pagina) {
    const genero = generosAniList[id] || null;
    const etiqueta = etiquetasAniList[id] || null;
    const busqueda = !genero && !etiqueta ? (busquedasAniList[id] || categorias[id].nombre) : null;
    const consulta = `query ($page: Int, $genre: String, $tag: String, $search: String) {
        Page(page: $page, perPage: 50) {
            media(type: ANIME, genre: $genre, tag: $tag, search: $search, sort: SCORE_DESC, isAdult: false) {
                id title { romaji english } description(asHtml: false) episodes averageScore season seasonYear coverImage { extraLarge large }
            }
        }
    }`;
    const respuesta = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ query: consulta, variables: { page: pagina, genre: genero, tag: etiqueta, search: busqueda } })
    });
    if (!respuesta.ok) throw new Error(`AniList respondió ${respuesta.status}`);
    const cuerpo = await respuesta.json();
    if (cuerpo.errors?.length) throw new Error(`AniList: ${cuerpo.errors[0].message}`);
    return (cuerpo.data?.Page?.media || []).map(anime => ({
        mal_id: `anilist_${anime.id}`,
        title: anime.title.romaji,
        title_english: anime.title.english,
        synopsis: anime.description,
        episodes: anime.episodes,
        score: anime.averageScore ? anime.averageScore / 10 : null,
        season: anime.season?.toLowerCase(),
        year: anime.seasonYear,
        images: { jpg: { large_image_url: anime.coverImage?.extraLarge || anime.coverImage?.large } }
    })).filter(anime => anime.title);
}

async function pedirKitsu(id, pagina) {
    const categoria = categoriasKitsu[id];
    if (!categoria) throw new Error("Kitsu no tiene un equivalente");
    const parametros = new URLSearchParams({
        "filter[categories]": categoria,
        "page[limit]": "20",
        "page[offset]": String((pagina - 1) * 20),
        sort: "-averageRating"
    });
    const respuesta = await fetch(`https://kitsu.io/api/edge/anime?${parametros}`);
    if (!respuesta.ok) throw new Error(`Kitsu respondió ${respuesta.status}`);
    const cuerpo = await respuesta.json();
    return (cuerpo.data || []).map(item => item.attributes).filter(anime => anime?.canonicalTitle).map(anime => ({
        mal_id: `kitsu_${anime.slug || anime.canonicalTitle}`,
        title: anime.canonicalTitle,
        title_english: anime.titles?.en,
        synopsis: anime.synopsis || anime.description,
        episodes: anime.episodeCount,
        score: anime.averageRating ? Number(anime.averageRating) / 10 : null,
        year: anime.startDate?.slice(0, 4),
        images: { jpg: { large_image_url: anime.posterImage?.original || anime.posterImage?.large } }
    }));
}

async function obtenerPagina(id, categoria, pagina) {
    try {
        const cuerpo = await pedirJikan(`https://api.jikan.moe/v4/anime?genres=${categoria.genero}&order_by=score&sort=desc&sfw=true&limit=25&page=${pagina}`);
        return { fuente: "Jikan", animes: cuerpo.data || [] };
    } catch (errorJikan) {
        try {
            return { fuente: "AniList", animes: await pedirAniList(id, pagina) };
        } catch (errorAniList) {
            return { fuente: "Kitsu", animes: await pedirKitsu(id, pagina) };
        }
    }
}

async function guardarPortada(anime) {
    const id = String(anime.mal_id || "").replace(/[^a-zA-Z0-9_-]/g, "_");
    const destino = path.join(carpeta, `${id}.jpg`);
    if (!id || fs.existsSync(destino)) return;
    const url = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
    if (!url) return;
    try {
        const respuesta = await fetch(url);
        if (!respuesta.ok) return;
        const imagen = Buffer.from(await respuesta.arrayBuffer());
        if (imagen.length && imagen.length <= 10 * 1024 * 1024) fs.writeFileSync(destino, imagen);
    } catch (error) {
        // Una portada fallida no detiene la preparación del catálogo.
    }
}

async function prepararCategoria(id, categoria, catalogo) {
    const clave = String(categoria.genero);
    const actuales = Array.isArray(catalogo[clave]) ? catalogo[clave] : [];
    const vistos = new Set(actuales.map(anime => anime.mal_id));
    if (vistos.size >= LIMITE_POR_CATEGORIA) {
        console.log(`✓ ${id}: ya tiene ${vistos.size} animes.`);
        return;
    }
    console.log(`\n🍥 ${id}: ${vistos.size}/${LIMITE_POR_CATEGORIA}`);
    for (let pagina = 1; pagina <= 20 && vistos.size < LIMITE_POR_CATEGORIA; pagina++) {
        let resultado;
        try {
            resultado = await obtenerPagina(id, categoria, pagina);
        } catch (error) {
            console.log(`⚠️ ${id}, página ${pagina}: las tres fuentes no respondieron. Se retomará en la próxima ejecución.`);
            break;
        }
        const nuevos = resultado.animes.filter(anime => anime?.mal_id && !vistos.has(anime.mal_id));
        for (const anime of nuevos) {
            vistos.add(anime.mal_id);
            actuales.push(anime);
            await guardarPortada(anime);
        }
        catalogo[clave] = actuales.slice(0, LIMITE_POR_CATEGORIA);
        guardarCatalogo(catalogo);
        console.log(`  ${resultado.fuente}, página ${pagina}: ${vistos.size}/${LIMITE_POR_CATEGORIA}`);
        await esperar(ESPERA_MS);
    }
}

async function main() {
    fs.mkdirSync(carpeta, { recursive: true });
    const catalogo = leerCatalogo();
    const seleccion = process.argv.slice(2).map(valor => valor.toLowerCase());
    const entradas = seleccion.length
        ? Object.entries(categorias).filter(([id]) => seleccion.includes(id))
        : Object.entries(categorias);
    if (!entradas.length) throw new Error("No encontré esa categoría. Usa los IDs de #anime categorias.");
    console.log(`Preparando hasta ${LIMITE_POR_CATEGORIA} animes por categoría. Puedes detenerlo con Ctrl+C y reanudarlo después.`);
    for (const [id, categoria] of entradas) await prepararCategoria(id, categoria, catalogo);
    console.log("\n✅ Preparación terminada.");
}

main().catch(error => { console.error("❌ Error preparando catálogo:", error.message); process.exitCode = 1; });
