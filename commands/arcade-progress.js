const { getProfile, getRanking, getHistory, hallOfFame, getMissions, definitions, formatValue } = require("../systems/arcadeProgression");
const { obtenerUsuario } = require("../database/economy");
const { obtenerJuego } = require("../games/catalog");
const { esAdminGrupo } = require("../systems/permissions");
const { obtener, guardar } = require("../systems/groupSettings");

function id(msg) { return msg.key.participant || msg.key.participantPn || msg.key.remoteJid; }
function target(msg) { return msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || id(msg); }
function tag(jid) { return `@${String(jid || "").split("@")[0].replace(/:\d+$/, "")}`; }
function gameName(gameId) { return obtenerJuego(gameId)?.name || gameId; }
function time(ms) { return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`; }

async function logros(sock, msg, args = []) {
    const userId = target(msg); const p = getProfile(userId);
    const requested = String(args[0] || "").toLowerCase() === "juego" ? String(args[1] || "").toLowerCase() : String(args[0] || "").toLowerCase();
    if (requested) {
        const game = obtenerJuego(requested);
        if (!game) return sock.sendMessage(msg.key.remoteJid, { text: "🎮 Usa *#logros juego ID*; consulta los ID con #juegos." });
        const entries = definitions.filter(def => def.gameId === game.id);
        const unlocked = p.unlocked || {};
        const lines = entries.map((def, index) => {
            const earned = unlocked[def.id];
            if (def.secret && !earned) return `${String(index + 1).padStart(2, "0")}. 🔒 *Logro oculto*\n   Este requisito permanece oculto.`;
            const icon = earned ? "✅" : "▫️";
            return `${String(index + 1).padStart(2, "0")}. ${icon} *${def.name}* · ${def.rarity}\n   ${def.description}`;
        }).join("\n");
        const count = entries.filter(def => unlocked[def.id]).length;
        return sock.sendMessage(msg.key.remoteJid, { text: `🏅 *LOGROS · ${game.name}*\n\nProgreso: *${count}/${entries.length}*\n\n${lines}`, mentions: [userId] });
    }
    const allGameDefinitions = definitions.filter(def => def.gameId);
    const unlockedCount = Object.keys(p.unlocked || {}).length;
    const secretsLeft = allGameDefinitions.filter(def => def.secret && !p.unlocked[def.id]).length;
    const recent = Object.values(p.unlocked || {}).sort((a, b) => b.unlockedAt - a.unlockedAt).slice(0, 8);
    const lines = recent.length ? recent.map(a => `${a.rarity === "supremo" ? "👑" : "🏆"} *${a.name}* · ${a.rarity}`).join("\n") : "Aún no se han desbloqueado logros.";
    await sock.sendMessage(msg.key.remoteJid, { text: `🏅 *LOGROS DE ${tag(userId)}*\n\n🏆 Desbloqueados: *${unlockedCount}/${definitions.length}*\n🎮 Juegos: *${gameThemesCount()}* · 20 logros por juego\n🔒 Logros ocultos por descubrir: *${secretsLeft}*\n\n*Últimos desbloqueados*\n${lines}\n\n▶️ Usa *#logros juego ID* para ver los 20 logros de un juego.`, mentions: [userId] });
}
function gameThemesCount() { return new Set(definitions.filter(def => def.gameId).map(def => def.gameId)).size; }
async function records(sock, msg) {
    const userId = target(msg); const p = getProfile(userId); const s = p.stats; const games = Object.entries(s.games || {});
    const rows = games.length ? games.map(([gameId, g]) => `🎮 *${gameName(gameId)}*\n   Partidas: ${g.played || 0} · Victorias: ${g.wins || 0}\n   ${g.bestScore ? `🥇 Puntos: ${Number(g.bestScore).toLocaleString()}` : ""}${g.bestTimeMs ? `${g.bestScore ? " · " : ""}⏱️ ${time(g.bestTimeMs)}` : ""}`).join("\n\n") : "Aún no hay estadísticas arcade.";
    const economy = obtenerUsuario(userId); const supreme = Object.values(p.unlocked).filter(a => a.rarity === "supremo").length;
    await sock.sendMessage(msg.key.remoteJid, { text: `🏆 *RÉCORDS DE ${tag(userId)}*\n\n⭐ Nivel ${economy.nivel || 1} · ${economy.xp || 0} XP · 💰 ${Number(economy.dinero || 0).toLocaleString()} monedas\n🏅 Logros: ${Object.keys(p.unlocked).length} · 👑 Supremos: ${supreme}\n🎮 Partidas: ${s.gamesPlayed || 0} · 🔥 Mejor racha: ${s.bestStreak || 0}\n\n${rows}`, mentions: [userId] });
}
async function ranking(sock, msg, args) {
    const gameId = String(args[0] || "").toLowerCase(); const type = String(args[1] || "score").toLowerCase() === "tiempo" ? "timeMs" : "score";
    if (!obtenerJuego(gameId) && gameId !== "duelo-academy") return sock.sendMessage(msg.key.remoteJid, { text: "🎮 Usa *#rankingjuego ID*; consulta IDs con #juegos." });
    const rows = getRanking(gameId, type).slice(0, 10); const label = type === "timeMs" ? "MEJORES TIEMPOS" : "MEJORES PUNTUACIONES";
    await sock.sendMessage(msg.key.remoteJid, { text: `🏆 *${label} · ${gameName(gameId)}*\n\n${rows.length ? rows.map((r, i) => `${["🥇", "🥈", "🥉"][i] || `🏅 ${i + 1}.`} ${tag(r.userId)} — *${formatValue(r)}*`).join("\n") : "Aún no hay récords verificables."}`, mentions: rows.map(r => r.userId) });
}
async function history(sock, msg, args) {
    const gameId = String(args[0] || "").toLowerCase(); if (!gameId) return sock.sendMessage(msg.key.remoteJid, { text: "🏛️ Usa *#historialrecords ID*." });
    const rows = getHistory(gameId);
    await sock.sendMessage(msg.key.remoteJid, { text: `🏛️ *HISTORIAL · ${gameName(gameId)}*\n\n${rows.length ? rows.map((r, i) => `${i + 1}. ${tag(r.current.userId)} — *${formatValue(r.current)}* · ${new Date(r.at).toLocaleDateString("es-NI")}`).join("\n") : "Aún no hay historia competitiva para este juego."}`, mentions: rows.map(r => r.current.userId) });
}
async function fame(sock, msg) {
    const rows = hallOfFame(); await sock.sendMessage(msg.key.remoteJid, { text: `👑 *LEYENDAS DE ALEXIS*\n\n${rows.length ? rows.map((r, i) => `${["🥇", "🥈", "🥉"][i] || "🏅"} ${tag(r.id)} · 🏆 ${r.records} récords · 👑 ${r.supreme} supremos · 🏅 ${r.achievements} logros`).join("\n") : "El salón espera a su primera leyenda."}`, mentions: rows.map(r => r.id) });
}
async function missions(sock, msg) {
    const mission = getMissions(id(msg));
    await sock.sendMessage(msg.key.remoteJid, { text: `📜 *MISIONES DE HOY*\n\n🎮 Juega 3 partidas: *${Math.min(3, mission.games)}/3*\n⚔️ Consigue 2 victorias: *${Math.min(2, mission.wins)}/2*\n🏆 Consigue 1 récord global: *${Math.min(1, mission.records)}/1*\n\nRecompensa final: ⭐ *+500 XP* · 💰 *+800 monedas*${mission.rewarded ? "\n\n✅ Recompensa ya obtenida hoy." : ""}` });
}
async function avisosRecords(sock, msg, args) {
    const group = msg.key.remoteJid; if (!String(group).endsWith("@g.us")) return sock.sendMessage(group, { text: "📢 Este ajuste se usa dentro de un grupo." });
    if (!(await esAdminGrupo(sock, msg))) return sock.sendMessage(group, { text: "❄️ Solo administradores pueden cambiar los avisos." });
    const option = String(args[0] || "").toLowerCase(); if (!['on', 'off'].includes(option)) { const current = obtener(group).recordAnnouncements ? "ACTIVADOS" : "DESACTIVADOS"; return sock.sendMessage(group, { text: `📢 Anuncios de récords: *${current}*. Usa *#avisosrecords on* o *#avisosrecords off*.` }); }
    guardar(group, { recordAnnouncements: option === "on", challengeAnnouncements: option === "on" });
    return sock.sendMessage(group, { text: `✅ Anuncios de récords y desafíos *${option === "on" ? "ACTIVADOS" : "DESACTIVADOS"}*.` });
}
module.exports = { logros, records, ranking, history, fame, missions, avisosRecords };
