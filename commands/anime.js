const fs = require("fs");
const path = require("path");

const categorias = {
    accion: { nombre: "Acción", genero: 1, emoji: "⚔️" },
    aventura: { nombre: "Aventura", genero: 2, emoji: "🗺️" },
    comedia: { nombre: "Comedia", genero: 4, emoji: "😂" },
    drama: { nombre: "Drama", genero: 8, emoji: "🎭" },
    fantasia: { nombre: "Fantasía", genero: 10, emoji: "✨" },
    terror: { nombre: "Terror", genero: 14, emoji: "👻" },
    misterio: { nombre: "Misterio", genero: 7, emoji: "🔎" },
    romance: { nombre: "Romance", genero: 22, emoji: "💗" },
    cienciaficcion: { nombre: "Ciencia ficción", genero: 24, emoji: "🚀" },
    deportes: { nombre: "Deportes", genero: 30, emoji: "🏆" },
    shounen: { nombre: "Shōnen", genero: 27, emoji: "🔥" },
    boys_love: { nombre: "Boys Love", genero: 28, emoji: "💙" },
    gastronomia: { nombre: "Gastronomía", genero: 47, emoji: "🍜" },
    sobrenatural: { nombre: "Sobrenatural", genero: 37, emoji: "👁️" },
    suspenso: { nombre: "Suspenso", genero: 41, emoji: "⏳" },
    antropomorfico: { nombre: "Antropomórfico", genero: 51, emoji: "🐾" },
    cgdct: { nombre: "Chicas haciendo cosas lindas", genero: 52, emoji: "🌸" },
    delincuentes: { nombre: "Delincuentes", genero: 55, emoji: "🧥" },
    detective: { nombre: "Detective", genero: 39, emoji: "🕵️" },
    gore: { nombre: "Gore", genero: 58, emoji: "🩸" },
    idolsfemeninas: { nombre: "Idols femeninas", genero: 60, emoji: "🎤" },
    idolsmasculinos: { nombre: "Idols masculinos", genero: 61, emoji: "🎙️" },
    isekai: { nombre: "Isekai", genero: 62, emoji: "🚪" },
    iyashikei: { nombre: "Iyashikei", genero: 63, emoji: "🌿" },
    poligonoamor: { nombre: "Polígono amoroso", genero: 64, emoji: "💘" },
    chicasmagicas: { nombre: "Chicas mágicas", genero: 66, emoji: "🪄" },
    medico: { nombre: "Médico", genero: 67, emoji: "⚕️" },
    musica: { nombre: "Música", genero: 19, emoji: "🎵" },
    culturaotaku: { nombre: "Cultura otaku", genero: 69, emoji: "🎌" },
    artesescenicas: { nombre: "Artes escénicas", genero: 70, emoji: "🎪" },
    mascotas: { nombre: "Mascotas", genero: 71, emoji: "🐶" },
    carreras: { nombre: "Carreras", genero: 3, emoji: "🏎️" },
    reencarnacion: { nombre: "Reencarnación", genero: 72, emoji: "♻️" },
    supervivencia: { nombre: "Supervivencia", genero: 76, emoji: "🏕️" },
    artesvisuales: { nombre: "Artes visuales", genero: 80, emoji: "🎨" },
    trabajo: { nombre: "Trabajo", genero: 48, emoji: "💼" },
    fantasiaurbana: { nombre: "Fantasía urbana", genero: 82, emoji: "🌃" },
    villana: { nombre: "Villana", genero: 83, emoji: "👑" },
    josei: { nombre: "Josei", genero: 43, emoji: "🌹" },
    infantil: { nombre: "Infantil", genero: 15, emoji: "🧒" },
    seinen: { nombre: "Seinen", genero: 42, emoji: "🌑" },
    shoujo: { nombre: "Shōjo", genero: 25, emoji: "🎀" }
};

const generosAniList = {
    accion: "Action", aventura: "Adventure", comedia: "Comedy", drama: "Drama",
    fantasia: "Fantasy", terror: "Horror", misterio: "Mystery", romance: "Romance",
    cienciaficcion: "Sci-Fi", deportes: "Sports", sobrenatural: "Supernatural",
    suspenso: "Thriller", psicologico: "Psychological", historico: "Historical",
    artesmarciales: "Martial Arts", mecha: "Mecha", militar: "Military",
    musica: "Music", mitologia: "Mythology", parodia: "Parody", samurai: "Samurai",
    escuela: "School", espacio: "Space", superpoderes: "Super Power", vampiros: "Vampire"
};

const etiquetasAniList = {
    isekai: "Isekai", shounen: "Shounen", shoujo: "Shoujo", seinen: "Seinen",
    josei: "Josei", mecha: "Mecha", harem: "Harem", hareminverso: "Reverse Harem",
    reencarnacion: "Reincarnation", viajetemporal: "Time Travel", videojuegos: "Video Game",
    videojuego: "Video Game", fantasiaurbana: "Urban Fantasy", villana: "Villainess",
    psicologico: "Psychological", supervivencia: "Survival", deportescombate: "Combat Sports",
    deportes_equipo: "Team Sports", detectives: "Detective", detective: "Detective",
    vanguardista: "Avant Garde", premiados: "Award Winning", boys_love: "Boys' Love",
    girls_love: "Girls' Love", gastronomia: "Food", vidacotidiana: "Slice of Life",
    adultos: "Adult Cast", antropomorfico: "Anthropomorphism", cgdct: "Cute Girls Doing Cute Things",
    cuidadoinfantil: "Childcare", delincuentes: "Delinquents", humorabsurdo: "Gag Humor",
    gore: "Gore", idolsfemeninas: "Female Protagonist", idolsmasculinos: "Male Protagonist",
    iyashikei: "Iyashikei", poligonoamor: "Love Triangle", chicasmagicas: "Magic",
    medico: "Medicine", crimenorganizado: "Organized Crime", culturaotaku: "Otaku Culture",
    artesescenicas: "Acting", mascotas: "Animals", carreras: "Cars",
    juegoestrategia: "Strategy Game", artesvisuales: "Drawing", trabajo: "Work",
    infantil: "Kids"
};

const busquedasAniList = {
    vanguardista: "Avant Garde", premiados: "Award Winning", boys_love: "Boys Love", girls_love: "Girls Love",
    gastronomia: "Food", vidacotidiana: "Slice of Life", adultos: "Adult Cast", antropomorfico: "Anthropomorphic",
    cgdct: "Cute Girls Doing Cute Things", cuidadoinfantil: "Childcare", deportescombate: "Combat Sports",
    delincuentes: "Delinquents", humorabsurdo: "Gag Humor", idolsfemeninas: "Idol", idolsmasculinos: "Idol",
    iyashikei: "Iyashikei", poligonoamor: "Love Triangle", chicasmagicas: "Magical Girl", medico: "Medical",
    crimenorganizado: "Organized Crime", culturaotaku: "Otaku", artesescenicas: "Performing Arts",
    mascotas: "Pets", carreras: "Racing", deportes_equipo: "Team Sports", juegoestrategia: "Strategy Game",
    artesvisuales: "Visual Arts", fantasiaurbana: "Urban Fantasy", infantil: "Kids"
};

const categoriasKitsu = {
    accion: "action", aventura: "adventure", comedia: "comedy", drama: "drama",
    fantasia: "fantasy", terror: "horror", misterio: "mystery", romance: "romance",
    cienciaficcion: "science-fiction", deportes: "sports", shounen: "shounen",
    sobrenatural: "supernatural", suspenso: "thriller", psicologico: "psychological",
    historico: "historical", artesmarciales: "martial-arts", mecha: "mecha",
    militar: "military", musica: "music", mitologia: "mythology", parodia: "parody",
    samurai: "samurai", escuela: "school", espacio: "space", superpoderes: "super-power",
    vampiros: "vampire", isekai: "isekai", seinen: "seinen", shoujo: "shoujo", josei: "josei"
};

function limpiarSinopsis(texto) {
    const entidades = {
        "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": "\"",
        "&#039;": "'", "&apos;": "'", "&nbsp;": " "
    };
    const limpio = String(texto || "Sin sinopsis disponible.")
        // AniList devuelve algunas descripciones en HTML. Los saltos se
        // conservan como espacios para que el mensaje de WhatsApp no muestre
        // etiquetas como <i>, </i> o <br>.
        .replace(/<\s*br\s*\/?\s*>/gi, " ")
        .replace(/<\/?p\s*>/gi, " ")
        .replace(/<[^>]*>/g, "")
        .replace(/&(amp|lt|gt|quot|apos|nbsp);|&#039;/gi, entidad => entidades[entidad.toLowerCase()] || entidad)
        .replace(/&#(\d+);/g, (_, codigo) => String.fromCodePoint(Number(codigo)))
        .replace(/&#x([\da-f]+);/gi, (_, codigo) => String.fromCodePoint(parseInt(codigo, 16)))
        .replace(/\s+/g, " ")
        .trim();
    return limpio.length > 850 ? `${limpio.slice(0, 847)}...` : limpio;
}

function leerTraducciones(ruta) {
    try {
        return fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, "utf8")) : {};
    } catch (error) {
        console.log("⚠️ No se pudo leer la caché de traducciones:", error.message);
        return {};
    }
}

async function traducirSinopsis(anime) {
    const original = limpiarSinopsis(anime.synopsis);
    if (original === "Sin sinopsis disponible.") return original;
    const carpeta = path.join(__dirname, "../assets/anime-cache");
    const archivo = path.join(carpeta, "sinopsis-es.json");
    const id = String(anime.mal_id || anime.title || "");
    const traducciones = leerTraducciones(archivo);
    // También se limpia la caché creada por versiones anteriores, que podía
    // conservar etiquetas HTML de la fuente o del traductor.
    if (traducciones[id]) return limpiarSinopsis(traducciones[id]);

    try {
        // El servicio público de traducción acepta textos cortos; se conserva
        // una sinopsis resumida para evitar errores por límite de longitud.
        const textoParaTraducir = original.length > 480 ? `${original.slice(0, 477)}...` : original;
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textoParaTraducir)}&langpair=en|es`;
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error(`Traductor respondió ${respuesta.status}`);
        const cuerpo = await respuesta.json();
        const traducida = limpiarSinopsis(cuerpo.responseData?.translatedText);
        if (!traducida) throw new Error("El traductor no devolvió texto");
        fs.mkdirSync(carpeta, { recursive: true });
        traducciones[id] = traducida;
        fs.writeFileSync(archivo, JSON.stringify(traducciones, null, 2), "utf8");
        return traducida;
    } catch (error) {
        console.log("⚠️ No se pudo traducir sinopsis:", error.message);
        return original;
    }
}

async function obtenerAnimes(categoria, cantidad) {
    // Jikan muestra 25 títulos por página. Se selecciona entre las primeras
    // 20 páginas disponibles (hasta 500 títulos por categoría).
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), 30000);
    try {
        const consultar = async (pagina) => {
            const url = `https://api.jikan.moe/v4/anime?genres=${categoria.genero}&order_by=score&sort=desc&sfw=true&limit=25&page=${pagina}`;
            let ultimoError;
            for (let intento = 1; intento <= 3; intento++) {
                try {
                    const respuesta = await fetch(url, { signal: controlador.signal, headers: { "User-Agent": "Alexis-Rhodes-WhatsApp-Bot" } });
                    if (respuesta.ok) return respuesta.json();
                    ultimoError = new Error(`Jikan respondió ${respuesta.status}`);
                    if (respuesta.status !== 429 && respuesta.status < 500) throw ultimoError;
                } catch (error) {
                    ultimoError = error;
                    if (controlador.signal.aborted) throw error;
                }
                if (intento < 3) await new Promise(resolve => setTimeout(resolve, intento * 1200));
            }
            throw ultimoError;
        };
        let cuerpo = await consultar(1);
        const ultimaPagina = Math.max(1, Math.min(20, Number(cuerpo.pagination?.last_visible_page) || 1));
        const pagina = Math.floor(Math.random() * ultimaPagina) + 1;
        if (pagina > 1) cuerpo = await consultar(pagina);
        const lista = Array.isArray(cuerpo.data) ? cuerpo.data.filter(anime => anime?.title) : [];
        if (!lista.length) throw new Error("La categoría no devolvió resultados");
        const mezclados = lista.sort(() => Math.random() - 0.5);
        return mezclados.slice(0, cantidad);
    } finally {
        clearTimeout(temporizador);
    }
}

async function obtenerAnimesAniList(ids, cantidad) {
    const generos = ids.map(id => generosAniList[id]).filter(Boolean);
    const etiquetas = ids.map(id => etiquetasAniList[id]).filter(Boolean);
    const busqueda = !generos.length && !etiquetas.length
        ? (busquedasAniList[ids[0]] || categorias[ids[0]]?.nombre || null)
        : null;
    const consulta = `query ($page: Int, $genres: [String], $tags: [String], $search: String) {
        Page(page: $page, perPage: 50) {
            pageInfo { lastPage }
            media(type: ANIME, genre_in: $genres, tag_in: $tags, search: $search, sort: SCORE_DESC, isAdult: false) {
                id title { romaji english } description(asHtml: false) episodes averageScore season seasonYear coverImage { extraLarge large }
            }
        }
    }`;
    const pedir = async (pagina) => {
        const respuesta = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({
                query: consulta,
                variables: {
                    page: pagina,
                    genres: generos.length ? generos : null,
                    tags: etiquetas.length ? etiquetas : null,
                    search: busqueda
                }
            })
        });
        if (!respuesta.ok) throw new Error(`AniList respondió ${respuesta.status}`);
        const cuerpo = await respuesta.json();
        if (cuerpo.errors?.length) throw new Error(`AniList: ${cuerpo.errors[0].message}`);
        return cuerpo.data.Page;
    };
    let pagina = await pedir(1);
    const ultima = Math.max(1, Math.min(10, Number(pagina.pageInfo?.lastPage) || 1));
    if (ultima > 1) pagina = await pedir(Math.floor(Math.random() * ultima) + 1);
    let lista = (pagina.media || []).filter(anime => anime?.title?.romaji);
    // Algunas etiquetas de AniList pueden variar con el tiempo. En ese caso
    // se devuelve una recomendación segura en vez de fallar el comando.
    if (!lista.length) {
        const respuesta = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ query: consulta, variables: { page: 1, genres: null, tags: null, search: busquedasAniList[ids[0]] || null } })
        });
        if (!respuesta.ok) throw new Error(`AniList respondió ${respuesta.status}`);
        const cuerpo = await respuesta.json();
        lista = cuerpo.data?.Page?.media || [];
    }
    lista = lista.filter(anime => anime?.title?.romaji).sort(() => Math.random() - 0.5).slice(0, cantidad);
    if (!lista.length) throw new Error("AniList no devolvió resultados");
    return lista.map(anime => ({
        mal_id: anime.id,
        title: anime.title.romaji,
        title_english: anime.title.english,
        synopsis: anime.description,
        episodes: anime.episodes,
        score: anime.averageScore ? anime.averageScore / 10 : null,
        season: anime.season ? anime.season.toLowerCase() : null,
        year: anime.seasonYear,
        images: { jpg: { large_image_url: anime.coverImage?.extraLarge || anime.coverImage?.large } }
    }));
}

async function obtenerAnimesKitsu(ids, cantidad) {
    const filtros = ids.map(id => categoriasKitsu[id]).filter(Boolean);
    if (!filtros.length) throw new Error("Kitsu no tiene un equivalente para esta categoría");
    const pagina = Math.floor(Math.random() * 10) * 20;
    const parametros = new URLSearchParams({
        "filter[categories]": filtros.join(","),
        "page[limit]": "20",
        "page[offset]": String(pagina),
        sort: "-averageRating"
    });
    const respuesta = await fetch(`https://kitsu.io/api/edge/anime?${parametros}`);
    if (!respuesta.ok) throw new Error(`Kitsu respondió ${respuesta.status}`);
    const cuerpo = await respuesta.json();
    const lista = (cuerpo.data || []).map(item => item.attributes).filter(item => item?.canonicalTitle);
    if (!lista.length) throw new Error("Kitsu no devolvió resultados");
    return lista.sort(() => Math.random() - 0.5).slice(0, cantidad).map(anime => ({
        mal_id: anime.slug || anime.canonicalTitle,
        title: anime.canonicalTitle,
        title_english: anime.titles?.en || anime.abbreviatedTitles?.[0],
        synopsis: anime.synopsis || anime.description,
        episodes: anime.episodeCount,
        score: anime.averageRating ? Number(anime.averageRating) / 10 : null,
        season: null,
        year: anime.startDate?.slice(0, 4),
        images: { jpg: { large_image_url: anime.posterImage?.original || anime.posterImage?.large } }
    }));
}

function guardarEnCatalogo(categoria, animes) {
    const carpeta = path.join(__dirname, "../assets/anime-cache");
    const archivo = path.join(carpeta, "catalogo.json");
    const catalogo = leerTraducciones(archivo);
    const clave = categoria.genero;
    const existentes = Array.isArray(catalogo[clave]) ? catalogo[clave] : [];
    const combinados = [...existentes, ...animes]
        .filter((anime, indice, lista) => lista.findIndex(item => item.mal_id === anime.mal_id) === indice)
        .slice(-500);
    fs.mkdirSync(carpeta, { recursive: true });
    fs.writeFileSync(archivo, JSON.stringify({ ...catalogo, [clave]: combinados }, null, 2), "utf8");
}

function obtenerDelCatalogo(categoria, cantidad) {
    const archivo = path.join(__dirname, "../assets/anime-cache/catalogo.json");
    const catalogo = leerTraducciones(archivo);
    const lista = Array.isArray(catalogo[categoria.genero]) ? catalogo[categoria.genero] : [];
    return lista.sort(() => Math.random() - 0.5).slice(0, cantidad);
}

async function obtenerPortada(anime) {
    const url = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
    const id = String(anime.mal_id || "").replace(/[^a-zA-Z0-9_-]/g, "_");
    if (!url || !id) return null;

    const carpeta = path.join(__dirname, "../assets/anime-cache");
    const archivo = path.join(carpeta, `${id}.jpg`);
    if (fs.existsSync(archivo)) return fs.readFileSync(archivo);

    fs.mkdirSync(carpeta, { recursive: true });
    const respuesta = await fetch(url, { headers: { "User-Agent": "Alexis-Rhodes-WhatsApp-Bot" } });
    if (!respuesta.ok) throw new Error(`No se pudo descargar portada: ${respuesta.status}`);
    const tipo = String(respuesta.headers.get("content-type") || "");
    if (!tipo.startsWith("image/")) throw new Error("La portada no es una imagen válida");
    const imagen = Buffer.from(await respuesta.arrayBuffer());
    if (!imagen.length || imagen.length > 10 * 1024 * 1024) throw new Error("Tamaño de portada no permitido");
    fs.writeFileSync(archivo, imagen);
    return imagen;
}

async function anime(sock, msg, args) {
    const chat = msg.key.remoteJid;
    const opcion = String(args[0] || "categorias").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (opcion === "categorias" || opcion === "categoria" || opcion === "help") {
        const opciones = Object.entries(categorias).map(([id, categoria]) => `${categoria.emoji} *${id}*`);
        const filas = Array.from({ length: Math.ceil(opciones.length / 3) }, (_, indice) =>
            `│ ${opciones.slice(indice * 3, indice * 3 + 3).join("  ·  ")}`
        ).join("\n");
        return sock.sendMessage(chat, { text: `╭──❄️ *𝑨𝑹𝑪𝑯𝑰𝑽𝑶 𝑨𝑵𝑰𝑴𝑬* · 🍥 𝑶𝑩𝑬𝑳𝑰𝑺𝑲 𝑩𝑳𝑼𝑬 ──╮
│ _"Todo duelo merece una gran historia."_
╰──────────────────────────────────╯

╭─ ✨ *𝑪𝑨𝑻𝑬𝑮𝑶𝑹Í𝑨𝑺 𝑫𝑰𝑺𝑷𝑶𝑵𝑰𝑩𝑳𝑬𝑺* ─────
${filas}
╰──────────────────────────────────

🎴 *¿Cómo elegir?*
│ 🌸 Una historia: *#anime romance*
│ ⚔️ Combina estilos: *#anime romance accion*
│ 🎲 Dos recomendaciones: *#anime random 2*
╰─ ❄️ _— Alexis Rhodes · Elige tu próxima carta._` });
    }

    const categoriaPrincipal = opcion === "random"
        ? Object.values(categorias)[Math.floor(Math.random() * Object.keys(categorias).length)]
        : categorias[opcion];
    if (!categoriaPrincipal) return sock.sendMessage(chat, { text: "❄️ Esa categoría no está en mi archivo de recomendaciones.\n🎴 Usa *#anime categorias* y elige otra, duelista." });

    const segundoTexto = String(args[1] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const segundaCategoria = segundoTexto && !/^\d+$/.test(segundoTexto) ? categorias[segundoTexto] : null;
    if (segundoTexto && !/^\d+$/.test(segundoTexto) && !segundaCategoria) {
        return sock.sendMessage(chat, { text: "❄️ No reconozco la segunda categoría.\n🎴 Consulta *#anime categorias* para combinar estilos disponibles." });
    }
    const seleccionadas = segundaCategoria ? [categoriaPrincipal, segundaCategoria] : [categoriaPrincipal];
    const categoria = {
        nombre: seleccionadas.map(item => item.nombre).join(" + "),
        genero: seleccionadas.map(item => item.genero).join(","),
        emoji: seleccionadas.map(item => item.emoji).join("")
    };
    const cantidad = Number(args[segundaCategoria ? 2 : 1] || 1);
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 2) {
        return sock.sendMessage(chat, { text: "❄️ Puedes pedir una o dos recomendaciones.\n🌹 Ejemplo: *#anime accion 2*. Elige con estrategia." });
    }

    try {
        let recomendados;
        try {
            recomendados = await obtenerAnimes(categoria, cantidad);
        } catch (errorJikan) {
            try {
                recomendados = await obtenerAnimesAniList(seleccionadas.map(item => Object.keys(categorias).find(id => categorias[id] === item)), cantidad);
            } catch (errorAniList) {
                try {
                    recomendados = await obtenerAnimesKitsu(seleccionadas.map(item => Object.keys(categorias).find(id => categorias[id] === item)), cantidad);
                } catch (errorKitsu) {
                    recomendados = obtenerDelCatalogo(categoria, cantidad);
                    if (!recomendados.length) throw errorKitsu;
                }
            }
        }
        guardarEnCatalogo(categoria, recomendados);
        for (const [indice, recomendado] of recomendados.entries()) {
            const titulo = recomendado.title || recomendado.title_english || "Anime sin título";
            const tituloIngles = recomendado.title_english && recomendado.title_english !== titulo ? `\n🌐 *Título en inglés:* ${recomendado.title_english}` : "";
            const encabezado = cantidad > 1 ? ` · ${indice + 1}/${cantidad}` : "";
            const temporada = recomendado.season
                ? `${recomendado.season.charAt(0).toUpperCase()}${recomendado.season.slice(1)} ${recomendado.year || ""}`.trim()
                : (recomendado.year ? String(recomendado.year) : "Sin dato");
            const sinopsis = await traducirSinopsis(recomendado);
            const datos = `🍥 *RECOMENDACIÓN ${categoria.nombre.toUpperCase()}${encabezado}* ${categoria.emoji}\n\n🎬 *${titulo}*${tituloIngles}\n⭐ *Puntuación:* ${recomendado.score ?? "Sin puntuación"}\n📺 *Episodios:* ${recomendado.episodes ?? "En emisión / sin dato"}\n🗓️ *Temporada / año:* ${temporada}\n\n📝 *Sinopsis:*\n${sinopsis}`;
            const portada = await obtenerPortada(recomendado);
            if (portada) await sock.sendMessage(chat, { image: portada, caption: datos });
            else await sock.sendMessage(chat, { text: datos });
        }
    } catch (error) {
        console.log("❌ Error en recomendador de anime:", error.message);
        const sinConexion = /fetch failed|EACCES|ENOTFOUND|ECONNREFUSED/i.test(String(error.message || error));
        await sock.sendMessage(chat, {
            text: sinConexion
                ? "❄️ No puedo consultar el archivo externo ahora mismo. El bot necesita acceso HTTPS para obtener portada, sinopsis y datos del anime."
                : "❄️ El catálogo está reorganizando sus cartas. Intenta de nuevo en unos segundos, duelista."
        });
    }
}

module.exports = anime;
module.exports.categorias = categorias;
module.exports.generosAniList = generosAniList;
module.exports.etiquetasAniList = etiquetasAniList;
module.exports.busquedasAniList = busquedasAniList;
module.exports.categoriasKitsu = categoriasKitsu;
