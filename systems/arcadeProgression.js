/* Progreso competitivo del arcade.
 * Integración: reportarEvento({ userId, name, gameId, type, metrics, eventId }).
 * Todo evento debe tener eventId estable; el motor lo procesa una sola vez. */
const fs = require("fs");
const path = require("path");
const config = require("../config");
const { obtenerUsuario, agregarXP, agregarDinero } = require("../database/economy");
const { obtener: ajustesGrupo } = require("./groupSettings");

const file = path.join(__dirname, "..", "database", "arcade-progress.json");
let notifier = null;
const baseDefinitions = [
    { id: "first_arcade", name: "Primera carta", description: "Inicia tu primera partida en el arcade.", rarity: "comun", when: s => s.gamesPlayed >= 1 },
    { id: "five_arcade", name: "Cadete de Obelisk", description: "Juega 5 partidas del arcade.", rarity: "dificil", when: s => s.gamesPlayed >= 5 },
    { id: "saves_three", name: "Guardiana de memorias", description: "Crea o actualiza 3 guardados.", rarity: "dificil", when: s => s.saves >= 3 },
    { id: "saves_ten", name: "Archivo de la Academia", description: "Protege 10 guardados de juego.", rarity: "epico", when: s => s.saves >= 10 },
    { id: "victories_three", name: "Rosa victoriosa", description: "Consigue 3 victorias verificadas.", rarity: "epico", when: s => s.wins >= 3 },
    { id: "streak_five", name: "Duelo impecable", description: "Alcanza una racha de 5 victorias.", rarity: "legendario", when: s => s.bestStreak >= 5 },
    { id: "polyvalent", name: "Polivalente", description: "Algo está despertando…", rarity: "supremo", secret: true, when: s => Object.keys(s.games || {}).filter(id => s.games[id].played > 0).length >= 3 },
    { id: "arcade_legend", name: "Leyenda del arcade", description: "Disputa 50 partidas verificadas.", rarity: "supremo", when: s => s.gamesPlayed >= 50 }
];

// Logros ligados a juegos concretos. Se basan exclusivamente en actividad que
// el servidor puede verificar (inicio y guardado), no en supuestas victorias
// que un emulador de ROM no puede comprobar de forma fiable.
const gameThemes = [
    ["contra", "Operación Contra", "Entra en la selva de acero.", "Arsenal a salvo", "Deja tu operación lista para continuar."],
    ["dr-mario", "Diagnóstico azul", "Abre tu consulta contra los virus.", "Receta archivada", "Conserva la partida del doctor."],
    ["zelda-nes", "Primera trifuerza", "Da tu primer paso por Hyrule.", "Mapa del héroe", "Resguarda tu aventura de leyenda."],
    ["spy", "Agente doble", "Comienza una misión de espionaje.", "Informe cifrado", "Guarda el expediente de la misión."],
    ["mario", "Reino champiñón", "Salta a tu primera aventura de Mario.", "Bandera protegida", "Guarda tu recorrido por el reino."],
    ["mario2", "Sueño de Subcon", "Entra al mundo onírico de Mario 2.", "Sueño preservado", "Protege tu avance en Subcon."],
    ["mario3", "Hoja de Tanooki", "Inicia tu viaje por los ocho mundos.", "Inventario real", "Guarda tu mapa del Reino Champiñón."],
    ["zelda-snes", "Héroe del pasado", "Cruza el umbral de A Link to the Past.", "Ecos de Hyrule", "Guarda una aventura entre dos mundos."],
    ["kart", "Semáforo verde", "Toma la salida en Super Mario Kart.", "Copa en garaje", "Conserva tu progreso de competición."],
    ["mario-rpg", "Estrella de Geno", "Comienza tu aventura de rol estelar.", "Deseo guardado", "Protege tu partida de Super Mario RPG."],
    ["yoshi", "Niñera jurásica", "Parte con Yoshi a rescatar a Baby Mario.", "Nido seguro", "Guarda el viaje por Isla Yoshi."],
    ["mario-world", "Isla Dinosaurio", "Explora por primera vez Dinosaur Land.", "Ruta secreta", "Conserva tu exploración de Super Mario World."],
    ["zelda", "Tamaño Minish", "Comienza la aventura microscópica de Link.", "Espada Picori", "Protege tu viaje de Minish Cap."],
    ["esmeralda", "Hoenn esmeralda", "Da tu primer paso por Hoenn.", "Pokédex resguardada", "Guarda tu aventura esmeralda."],
    ["rojo", "Llama de Kanto", "Inicia tu viaje por Kanto.", "Liga en memoria", "Resguarda tu progreso de Rojo Fuego."],
    ["ygo-2005", "Día del duelista", "Entra al torneo World Championship 2005.", "Mazo sellado", "Guarda tu preparación de duelo."],
    ["ygo-destiny", "Tablero del destino", "Comienza tu partida de Destiny Board Traveler.", "Destino asegurado", "Conserva tu tablero y tus cartas."],
    ["ygo-reshef", "Desafío de Reshef", "Inicia la lucha contra el Destructor.", "Cartas sagradas", "Guarda tu avance frente a Reshef."],
    ["ygo-2004", "Campeonato 2004", "Entra al World Championship Tournament 2004.", "Registro de torneo", "Conserva tu avance competitivo."],
    ["ygo-world", "Escalera al duelo", "Sube el primer peldaño hacia el duelo destinado.", "Mazo mundial", "Guarda tu progreso de Worldwide Edition."],
    ["ygo-2006", "Maestra suprema", "Comienza Ultimate Masters 2006.", "Corona del mazo", "Resguarda tu camino de maestra duelista."]
];
const newGameThemes = [
    ["city-connection", "Ruta de City", "Enciende el motor en City Connection.", "Garaje sellado", "Guarda tu recorrido urbano."],
    ["f1-race", "Pole position", "Toma la salida en F-1 Race.", "Bitácora de boxes", "Conserva tu progreso de carrera."],
    ["ice-climber", "Cumbre helada", "Comienza la escalada de Ice Climber.", "Campamento seguro", "Guarda tu avance por la montaña."],
    ["kirby-adventure", "Estrella rosada", "Inicia el viaje de Kirby por Dream Land.", "Poder copiado", "Protege la aventura de Kirby."],
    ["ninja-gaiden", "Sombra del dragón", "Entra a la misión de Ryu Hayabusa.", "Pergamino ninja", "Guarda la senda del ninja."],
    ["ninja-gaiden2", "Espada del caos", "Comienza el desafío de Ninja Gaiden II.", "Sombra preservada", "Resguarda tu combate contra el caos."],
    ["slalom", "Nieve veloz", "Desciende tu primera pista de Slalom.", "Tabla preparada", "Guarda tu ruta nevada."],
    ["tmnt3", "Héroes en Manhattan", "Salva Manhattan con las Tortugas Ninja.", "Guarida protegida", "Conserva la misión de las tortugas."],
    ["tiny-toon", "Aventura Acme", "Entra al mundo de Tiny Toon Adventures.", "Guion guardado", "Protege tu episodio de Acme."],
    ["urban-champion", "Campeona urbana", "Entra al ring de Urban Champion.", "Combate registrado", "Conserva tu pelea callejera."],
    ["yie-ar-kungfu", "Puño del maestro", "Inicia tu combate de Yie Ar Kung-Fu.", "Dojo resguardado", "Guarda la enseñanza del maestro."],
    ["dk-country3", "Dixie y Kiddy", "Comienza la búsqueda de Donkey y Diddy.", "Isla Kong segura", "Guarda el viaje de Dixie y Kiddy."],
    ["spider-man-xmen", "Alianza arácnida", "Une a Spider-Man y los X-Men.", "Archivo mutante", "Conserva la misión de los héroes."],
    ["street-fighter2-turbo", "Turbo fighter", "Entra a Street Fighter II Turbo.", "Cinturón guardado", "Protege tu camino de luchadora."],
    ["bomberman4", "Bombardera azul", "Comienza Super Bomberman 4.", "Mecha segura", "Guarda tu campaña explosiva."],
    ["f1-world-gp2", "Gran premio mundial", "Toma la salida en F-1 World Grand Prix II.", "Escudería segura", "Conserva tu campeonato de N64."],
    ["zelda-majoras-mask", "Tres días de Termina", "Entra al ciclo de Majora's Mask.", "Tiempo preservado", "Guarda tu viaje antes de la luna."],
    ["mario64", "Estrella del castillo", "Explora el castillo de Super Mario 64.", "Galería real", "Protege tu aventura de 64 bits."],
    ["zelda-ocarina", "Canción del tiempo", "Comienza Ocarina of Time.", "Ocarina guardada", "Conserva tu aventura de Hyrule."],
    ["castlevania-harmony", "Armonía nocturna", "Entra al castillo de Dissonance.", "Látigo resguardado", "Guarda tu cacería de vampiros."],
    ["dk-country2", "Kong en acción", "Comienza Donkey Kong Country 2.", "Barril seguro", "Conserva la misión de los Kongs."],
    ["dbz-buus-fury", "Furia de Buu", "Comienza la batalla final de Dragon Ball Z.", "Ki preservado", "Guarda el poder de los guerreros Z."],
    ["ff4-advance", "Cristal azul", "Inicia Final Fantasy IV Advance.", "Cristal resguardado", "Protege tu viaje de Cecil."],
    ["fire-emblem", "Táctica de Elibe", "Empuña la estrategia de Fire Emblem.", "Crónica de guerra", "Guarda la campaña de Elibe."],
    ["kirby-mirror", "Espejo asombroso", "Cruza al Amazing Mirror.", "Reflejo guardado", "Conserva tu aventura de Kirby."],
    ["megaman-zero", "Despertar de Zero", "Inicia la misión de Mega Man Zero.", "Sable protegido", "Guarda el progreso de Zero."],
    ["naruto-nc2", "Ninja de Konoha", "Comienza Ninja Council 2.", "Pergamino de Konoha", "Resguarda tu misión ninja."],
    ["pokemon-mystery", "Rescate misterioso", "Entra al mundo de Pokémon Misterioso.", "Equipo de rescate", "Guarda la expedición Pokémon."],
    ["one-piece-shonen", "Tripulación Shonen", "Comienza la aventura de One Piece.", "Bitácora pirata", "Conserva tu viaje por el Grand Line."],
    ["sonic-advance2", "Velocidad Sonic", "Corre por primera vez en Sonic Advance 2.", "Anillo guardado", "Protege tu avance a toda velocidad."],
    ["top-gear-rally", "Rally de élite", "Toma el volante en Top Gear Rally.", "Coche resguardado", "Guarda tu carrera de rally." ]
];
gameThemes.push(...newGameThemes);
const gameStats = (stats, gameId) => stats.games?.[gameId] || { played: 0, saves: 0 };
// Veinte metas por juego: diez de sesiones verificadas y diez de guardados
// reales. Las dos últimas son secretas y no revelan su requisito hasta lograrlo.
const playMilestones = [
    [1, "Llegada", "comun"], [3, "Exploradora", "comun"], [5, "Habitual", "dificil"], [10, "Veterana", "dificil"], [20, "Especialista", "epico"],
    [35, "Incansable", "epico"], [50, "Maestría", "legendario"], [75, "Leyenda", "legendario"], [100, "Misterio I", "supremo", true], [150, "Misterio II", "supremo", true]
];
const saveMilestones = [
    [1, "Archivo inicial", "dificil"], [2, "Respaldo doble", "dificil"], [3, "Cronista", "dificil"], [5, "Guardiana", "epico"], [10, "Biblioteca", "epico"],
    [15, "Archivista", "epico"], [25, "Memoria perfecta", "legendario"], [40, "Cámara real", "legendario"], [60, "Secreto de archivo", "supremo", true], [100, "Archivo infinito", "supremo", true]
];
function milestonesForGame(gameId, firstName, firstDescription, saveName, saveDescription) {
    const plays = playMilestones.map(([count, label, rarity, secret], index) => ({
        // Conserva el ID histórico del primer logro para no invalidar perfiles
        // que ya lo habían desbloqueado antes de ampliar el sistema a 20 metas.
        id: index === 0 ? `${gameId}_arrival` : `${gameId}_play_${count}`, name: index === 0 ? firstName : `${firstName} · ${label}`,
        description: index === 0 ? firstDescription : `Juega ${count} partidas verificadas de este juego.`, rarity, secret: Boolean(secret), gameId,
        when: (s, event) => event.gameId === gameId && gameStats(s, gameId).played >= count
    }));
    const saves = saveMilestones.map(([count, label, rarity, secret], index) => ({
        id: index === 0 ? `${gameId}_archive` : `${gameId}_save_${count}`, name: index === 0 ? saveName : `${saveName} · ${label}`,
        description: index === 0 ? saveDescription : `Crea o actualiza ${count} guardados verificables de este juego.`, rarity, secret: Boolean(secret), gameId,
        when: (s, event) => event.gameId === gameId && gameStats(s, gameId).saves >= count
    }));
    return [...plays, ...saves];
}
const gameDefinitions = gameThemes.flatMap(([gameId, firstName, firstDescription, saveName, saveDescription]) => milestonesForGame(gameId, firstName, firstDescription, saveName, saveDescription));
const definitions = [...baseDefinitions, ...gameDefinitions];
function definitionsForGame(gameId) { return gameDefinitions.filter(definition => definition.gameId === gameId); }
function completionDefinition(gameId) {
    return { id: `${gameId}_completion`, name: "Dominio total", description: "Completa los 20 logros de este juego.", rarity: "supremo", gameId, completion: true };
}
function gameIsComplete(user, gameId) {
    const gameAchievements = definitionsForGame(gameId);
    return gameAchievements.length > 0 && gameAchievements.every(definition => user.unlocked[definition.id]);
}

function empty() { return { version: 1, processedEvents: {}, users: {}, records: {}, groupRecords: {}, recordHistory: [], seasons: {}, missions: {} }; }
function read() { try { return fs.existsSync(file) ? { ...empty(), ...JSON.parse(fs.readFileSync(file, "utf8")) } : empty(); } catch { return empty(); } }
function write(data) { fs.mkdirSync(path.dirname(file), { recursive: true }); const temp = `${file}.tmp`; fs.writeFileSync(temp, JSON.stringify(data, null, 2), "utf8"); fs.renameSync(temp, file); }
function idNumber(id) { return String(id || "").split("@")[0].replace(/\D/g, ""); }
function profile(data, userId, name) {
    if (!data.users[userId]) data.users[userId] = { name: name || "Duelista", unlocked: {}, stats: { gamesPlayed: 0, saves: 0, wins: 0, losses: 0, streak: 0, bestStreak: 0, games: {} }, createdAt: Date.now() };
    const user = data.users[userId]; user.name = name || user.name; user.stats.games ||= {}; return user;
}
function reward(rarity) { return config.arcade.rewards[rarity] || config.arcade.rewards.comun; }
function unlock(data, userId, user, definition, now) {
    if (user.unlocked[definition.id]) return null;
    const prize = reward(definition.rarity); user.unlocked[definition.id] = { id: definition.id, name: definition.name, description: definition.description, rarity: definition.rarity, secret: definition.secret === true, xp: prize.xp, dinero: prize.dinero, unlockedAt: now };
    agregarXP(userId, prize.xp); agregarDinero(userId, prize.dinero);
    return user.unlocked[definition.id];
}
function metricRecord(data, scope, key, candidate, lowerIsBetter) {
    const old = scope[key];
    const improved = !old || (lowerIsBetter ? candidate.value < old.value : candidate.value > old.value);
    if (!improved) return null;
    scope[key] = candidate;
    data.recordHistory.push({ id: `record_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, key, previous: old || null, current: candidate, at: candidate.at });
    if (data.recordHistory.length > 1000) data.recordHistory.splice(0, data.recordHistory.length - 1000);
    return { previous: old || null, current: candidate, type: candidate.type };
}
function processRecords(data, event, user) {
    const metric = event.metrics || {}; const records = [];
    for (const [type, value, lower] of [["score", Number(metric.score), false], ["timeMs", Number(metric.timeMs), true]]) {
        if (!Number.isFinite(value) || value <= 0) continue;
        const candidate = { userId: event.userId, name: user.name, gameId: event.gameId, type, value, at: Date.now() };
        const global = metricRecord(data, data.records, `${event.gameId}:${type}`, candidate, lower);
        if (global) records.push({ scope: "global", ...global });
        const economy = obtenerUsuario(event.userId);
        for (const groupId of economy.grupos || []) {
            const group = metricRecord(data, data.groupRecords, `${groupId}:${event.gameId}:${type}`, candidate, lower);
            if (group) records.push({ scope: "group", groupId, ...group });
        }
    }
    return records;
}
function missionDay() { return new Date().toISOString().slice(0, 10); }
function updateMission(data, event, hasRecord) {
    const day = missionDay(); data.missions[day] ||= {}; const mission = data.missions[day][event.userId] ||= { games: 0, wins: 0, records: 0, rewarded: false };
    if (event.type === "game_start") mission.games++;
    if (event.type === "victory") mission.wins++;
    if (hasRecord) mission.records++;
    if (!mission.rewarded && mission.games >= 3 && mission.wins >= 2 && mission.records >= 1) {
        mission.rewarded = true; mission.rewardedAt = Date.now(); agregarXP(event.userId, 500); agregarDinero(event.userId, 800); return mission;
    }
    return null;
}
function reportarEvento(event) {
    if (!event?.userId || !event?.gameId || !event?.type) return { ignored: true };
    const data = read(); const now = Date.now(); const eventId = String(event.eventId || `${event.userId}:${event.gameId}:${event.type}:${now}`);
    if (data.processedEvents[eventId]) return { duplicate: true, achievements: [], records: [] };
    data.processedEvents[eventId] = now;
    const keys = Object.keys(data.processedEvents); if (keys.length > 5000) keys.sort((a, b) => data.processedEvents[a] - data.processedEvents[b]).slice(0, keys.length - 5000).forEach(key => delete data.processedEvents[key]);
    const user = profile(data, event.userId, event.name); const s = user.stats; const game = s.games[event.gameId] ||= { played: 0, saves: 0, wins: 0, losses: 0, bestScore: 0, bestTimeMs: null, updatedAt: now };
    if (event.type === "game_start") { s.gamesPlayed++; game.played++; }
    if (event.type === "save") { s.saves++; game.saves++; }
    if (event.type === "victory") { s.wins++; s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak); game.wins++; }
    if (event.type === "defeat") { s.losses++; s.streak = 0; game.losses++; }
    if (Number.isFinite(Number(event.metrics?.score))) game.bestScore = Math.max(game.bestScore || 0, Number(event.metrics.score));
    if (Number.isFinite(Number(event.metrics?.timeMs)) && Number(event.metrics.timeMs) > 0) game.bestTimeMs = game.bestTimeMs === null ? Number(event.metrics.timeMs) : Math.min(game.bestTimeMs, Number(event.metrics.timeMs));
    game.updatedAt = now;
    const achievements = definitions.map(def => def.when(s, event) ? unlock(data, event.userId, user, def, now) : null).filter(Boolean);
    // La insignia de 100% se concede sólo al completar los 20 retos del juego.
    // No forma parte del contador para conservar el objetivo claro de 20/20.
    if (gameIsComplete(user, event.gameId)) {
        const completion = unlock(data, event.userId, user, completionDefinition(event.gameId), now);
        if (completion) achievements.push(completion);
    }
    const records = processRecords(data, event, user);
    const mission = updateMission(data, event, records.some(item => item.scope === "global"));
    for (const record of records.filter(item => item.scope === "global")) { agregarXP(event.userId, config.arcade.recordRewards.xp); agregarDinero(event.userId, config.arcade.recordRewards.dinero); }
    write(data);
    const result = { achievements, records, mission, stats: s };
    notifier?.({ event, user, result });
    return result;
}
function getProfile(userId) { const data = read(); return data.users[userId] || profile(data, userId, "Duelista"); }
function getGameProgress(userId, gameId) {
    const user = getProfile(userId);
    const achievements = definitionsForGame(gameId);
    const unlocked = user.unlocked || {};
    const unlockedCount = achievements.filter(definition => unlocked[definition.id]).length;
    const total = achievements.length;
    const achievementList = achievements.map(definition => {
        const achieved = unlocked[definition.id];
        const hidden = definition.secret && !achieved;
        return {
            id: definition.id,
            name: hidden ? "Logro oculto" : definition.name,
            description: hidden ? "Sigue jugando para descubrir este reto." : definition.description,
            rarity: definition.rarity,
            secret: definition.secret === true,
            unlocked: Boolean(achieved),
            unlockedAt: achieved?.unlockedAt || null,
            xp: achieved?.xp || reward(definition.rarity).xp,
            dinero: achieved?.dinero || reward(definition.rarity).dinero
        };
    });
    return {
        gameId,
        total,
        unlocked: unlockedCount,
        percent: total ? Math.round((unlockedCount / total) * 100) : 0,
        completed: total > 0 && unlockedCount === total,
        completion: unlocked[`${gameId}_completion`] || null,
        next: achievementList.find(item => !item.unlocked && !item.secret) || null,
        stats: user.stats?.games?.[gameId] || { played: 0, saves: 0, wins: 0, losses: 0, bestScore: 0, bestTimeMs: null },
        achievements: achievementList
    };
}
function getRanking(gameId, type = "score", groupId = null) {
    const data = read();
    // El historial conserva a quienes tuvieron el récord antes; al agrupar por
    // jugador obtenemos un ranking real, no sólo al campeón actual.
    const candidates = data.recordHistory.filter(item => item.current.gameId === gameId && item.current.type === type).map(item => item.current);
    const scope = groupId ? data.groupRecords : data.records;
    for (const [key, record] of Object.entries(scope)) if (key.endsWith(`:${gameId}:${type}`) || key === `${gameId}:${type}`) candidates.push(record);
    const best = new Map();
    for (const item of candidates) {
        const old = best.get(item.userId);
        if (!old || (type === "timeMs" ? item.value < old.value : item.value > old.value)) best.set(item.userId, item);
    }
    return [...best.values()].sort((a, b) => type === "timeMs" ? a.value - b.value : b.value - a.value);
}
function getHistory(gameId) { return read().recordHistory.filter(item => item.current.gameId === gameId).slice(-20).reverse(); }
function hallOfFame() { const data = read(); return Object.entries(data.users).map(([id, u]) => ({ id, name: u.name, supreme: Object.values(u.unlocked).filter(a => a.rarity === "supremo").length, achievements: Object.keys(u.unlocked).length, records: Object.values(data.records).filter(r => r.userId === id).length })).sort((a, b) => b.supreme - a.supreme || b.records - a.records || b.achievements - a.achievements).slice(0, 10); }
function getMissions(userId) { const data = read(); return { day: missionDay(), ...(data.missions[missionDay()]?.[userId] || { games: 0, wins: 0, records: 0, rewarded: false }) }; }
function setNotifier(fn) { notifier = fn; }
function formatAchievement(item, gameName) { const icon = reward(item.rarity).icon; return `╔══════════════════╗\n🏆 ¡LOGRO DESBLOQUEADO!\n╚══════════════════╝\n\n${icon} *${item.name.toUpperCase()}*\n🎮 ${gameName}\n📜 ${item.description}\n\n💰 +${item.dinero.toLocaleString()} monedas\n⭐ +${item.xp.toLocaleString()} XP`; }
function formatValue(record) { return record.type === "timeMs" ? `${Math.floor(record.value / 60000)}:${String(Math.floor(record.value / 1000) % 60).padStart(2, "0")}.${String(record.value % 1000).padStart(3, "0")}` : Number(record.value).toLocaleString(); }
module.exports = { reportarEvento, getProfile, getGameProgress, getRanking, getHistory, hallOfFame, getMissions, setNotifier, formatAchievement, formatValue, definitions };
