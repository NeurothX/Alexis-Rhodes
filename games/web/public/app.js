(() => {
    const token = location.hash.startsWith("#token=") ? location.hash.slice(7) : null;
    const title = document.querySelector("#title"), subtitle = document.querySelector("#subtitle"), catalog = document.querySelector("#catalog"), gameBox = document.querySelector("#game");
    const requestedGameId = new URLSearchParams(location.search).get("game");
    const requestedLoad = new URLSearchParams(location.search).get("load") === "1";
    let games = [], active = null, playSession = null, heartbeat = null, currentUserId = null, arcadeStatus = null, selectedPlatform = "Todas", gameQuery = "";
    const api = async (url, options = {}) => {
        const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, ...(options.headers || {}) } });
        if (response.status === 204) return null;
        const body = await response.json(); if (!response.ok) throw new Error(body.error || "Error de servidor"); return body;
    };
    const achievementBox = document.querySelector("#achievement-notices");
    const trophies = { comun: "🥉", dificil: "🥈", epico: "🥇", legendario: "💎", supremo: "👑" };
    let achievementQueue = Promise.resolve(), achievementAudio = null;
    function prepararSonidoLogro() {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        achievementAudio ||= new Audio();
        if (achievementAudio.state === "suspended") achievementAudio.resume().catch(() => {});
    }
    function sonidoLogro(rarity) {
        prepararSonidoLogro();
        if (!achievementAudio || achievementAudio.state !== "running") return;
        const now = achievementAudio.currentTime;
        const notes = rarity === "supremo" ? [523.25, 659.25, 783.99, 1046.5] : rarity === "legendario" ? [440, 554.37, 659.25] : [523.25, 659.25];
        notes.forEach((frequency, index) => {
            const oscillator = achievementAudio.createOscillator(), gain = achievementAudio.createGain();
            oscillator.type = index === notes.length - 1 ? "triangle" : "sine";
            oscillator.frequency.setValueAtTime(frequency, now + index * .09);
            gain.gain.setValueAtTime(.0001, now + index * .09);
            gain.gain.exponentialRampToValueAtTime(.11, now + index * .09 + .018);
            gain.gain.exponentialRampToValueAtTime(.0001, now + index * .09 + .25);
            oscillator.connect(gain).connect(achievementAudio.destination);
            oscillator.start(now + index * .09); oscillator.stop(now + index * .09 + .28);
        });
    }
    function mostrarLogro(logro) {
        achievementQueue = achievementQueue.then(() => new Promise(resolve => {
            const stage = gameBox.querySelector(".emulator-stage, .nes-stage, .board");
            if (stage) {
                stage.append(achievementBox);
                achievementBox.classList.add("in-game");
            } else {
                document.body.prepend(achievementBox);
                achievementBox.classList.remove("in-game");
            }
            const card = document.createElement("article");
            card.className = `achievement-toast rarity-${logro.rarity || "comun"}`;
            card.innerHTML = `<span class="achievement-trophy">${trophies[logro.rarity] || "🏆"}</span><span class="achievement-copy"><small>¡LOGRO DESBLOQUEADO!</small><b></b><em></em></span>`;
            card.querySelector("b").textContent = logro.name || "Logro";
            card.querySelector("em").textContent = logro.description || "";
            achievementBox.append(card); sonidoLogro(logro.rarity);
            requestAnimationFrame(() => card.classList.add("visible"));
            setTimeout(() => { card.classList.remove("visible"); setTimeout(() => { card.remove(); resolve(); }, 380); }, 5000);
        }));
    }
    function mostrarProgreso(progress) {
        (progress?.achievements || []).forEach(mostrarLogro);
        api("/api/arcade-status").then(status => { arcadeStatus = status; }).catch(() => {});
    }
    async function crearSesion(gameId) {
        const session = await api("/api/play-sessions", { method: "POST", body: JSON.stringify({ gameId }) });
        playSession = session.playSession; mostrarProgreso(session.progress);
        if (heartbeat) clearInterval(heartbeat);
        heartbeat = setInterval(() => { if (!document.hidden) api(`/api/play-sessions/${playSession.id}/heartbeat`, { method: "POST", body: "{}" }).catch(() => clearInterval(heartbeat)); }, 30000);
    }
    function error(message) { catalog.innerHTML = `<p>⚠️ ${message}</p>`; }
    function format(ms) { const min = Math.floor((ms || 0) / 60000); return `${Math.floor(min / 60)}h ${min % 60}m`; }
    function escapeHtml(value) { return String(value || "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }
    function formatRemaining(ms) { const seconds = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
    function programarAvisoEnlace(expiresAt) {
        const faltan = expiresAt - Date.now();
        const avisar = () => {
            const mensaje = "Tu enlace vence en 5 minutos. Puedes seguir jugando, pero guarda la partida y abre un enlace nuevo para mantener la sincronización.";
            subtitle.textContent = `⚠️ ${mensaje}`;
            if (window.Notification?.permission === "granted") new Notification("Alexis GX Arcade", { body: mensaje });
        };
        if (window.Notification?.permission === "default") Notification.requestPermission().catch(() => {});
        if (faltan <= 5 * 60 * 1000) avisar();
        else setTimeout(avisar, faltan - 5 * 60 * 1000);
    }
    function showCatalog() {
        active = null; gameBox.classList.add("hidden"); catalog.classList.remove("hidden"); title.textContent = "Juegos disponibles";
        const platforms = ["Todas", ...new Set(games.map(game => game.platform))];
        const query = gameQuery.trim().toLowerCase();
        const visible = games.filter(game => (selectedPlatform === "Todas" || game.platform === selectedPlatform) && (!query || `${game.name} ${game.id} ${game.platform}`.toLowerCase().includes(query)));
        const stats = arcadeStatus || { totalPlayMs: 0, saveCount: 0, activeSessions: [] };
        const statusCard = `<section class="arcade-dashboard"><div><small>TIEMPO DE JUEGO</small><b>⏱️ ${format(stats.totalPlayMs)}</b></div><div><small>GUARDADOS</small><b>💾 ${stats.saveCount}</b></div><div><small>SESIÓN</small><b>${stats.activeSessions.length ? "🟢 Activa" : "⚪ Lista"}</b></div></section>`;
        const filters = `<div class="catalog-tools"><label><span>🔎</span><input id="game-search" type="search" value="${escapeHtml(gameQuery)}" placeholder="Buscar juego o ID"></label><div class="platform-filters">${platforms.map(platform => `<button class="filter-chip ${platform === selectedPlatform ? "selected" : ""}" data-platform="${escapeHtml(platform)}">${escapeHtml(platform)}</button>`).join("")}</div><p class="notice">${visible.length} de ${games.length} juegos disponibles</p></div>`;
        const cards = visible.length ? visible.map(g => `<article class="game-card"><div class="cover"><span>🎮</span><img data-cover="${g.id}" ${g.image ? `src="${g.image}"` : "hidden"} alt="Portada de ${escapeHtml(g.name)}"></div><div class="game-info"><strong>${escapeHtml(g.name)}</strong><p>${escapeHtml(g.description)}</p><p class="notice">${escapeHtml(g.platform)} · ID: <code>${escapeHtml(g.id)}</code></p><button data-game="${g.id}">▶ Jugar ahora</button><button data-progress="${g.id}" class="secondary">🏆 Progreso y logros</button></div></article>`).join("") : "<p class=\"notice empty-catalog\">No encontré juegos con ese filtro.</p>";
        catalog.innerHTML = `${statusCard}${filters}<div class="game-list">${cards}</div>`;
        catalog.querySelectorAll("[data-game]").forEach(button => button.onclick = () => iniciarJuego(button.dataset.game));
        catalog.querySelectorAll("[data-progress]").forEach(button => button.onclick = () => mostrarFichaJuego(button.dataset.progress));
        catalog.querySelectorAll("[data-platform]").forEach(button => button.onclick = () => { selectedPlatform = button.dataset.platform; showCatalog(); });
        catalog.querySelector("#game-search").oninput = event => {
            gameQuery = event.target.value; const caret = event.target.selectionStart;
            showCatalog(); const next = catalog.querySelector("#game-search"); next.focus(); next.setSelectionRange(caret, caret);
        };
        cargarPortadas();
    }
    function iconoLogro(rarity) { return trophies[rarity] || "🏆"; }
    function formatDate(value) { return value ? new Date(value).toLocaleDateString("es-NI", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }
    async function mostrarFichaJuego(gameId) {
        const game = games.find(item => item.id === gameId); if (!game) return;
        active = null; gameBox.classList.add("hidden"); catalog.classList.remove("hidden"); title.textContent = "Progreso del juego";
        catalog.innerHTML = "<p class=\"notice loading-progress\">🏆 Cargando tus logros y estadísticas…</p>";
        try {
            const progress = await api(`/api/games/${encodeURIComponent(gameId)}/progress`);
            const complete = progress.completed;
            const achievementCards = progress.achievements.map(item => `<article class="achievement-entry ${item.unlocked ? "unlocked" : "locked"} ${item.secret && !item.unlocked ? "secret" : ""}"><span>${item.unlocked ? iconoLogro(item.rarity) : "🔒"}</span><div><b>${escapeHtml(item.name)}</b><p>${escapeHtml(item.description)}</p><small>${item.unlocked ? `✓ Desbloqueado · ${formatDate(item.unlockedAt)}` : `${item.secret ? "Oculto" : `Recompensa: +${item.xp} XP · +${item.dinero} monedas`}`}</small></div></article>`).join("");
            const nextGoal = progress.next ? `<section class="next-goal"><span>${iconoLogro(progress.next.rarity)}</span><div><small>SIGUIENTE META</small><b>${escapeHtml(progress.next.name)}</b><p>${escapeHtml(progress.next.description)}</p><em>+${progress.next.xp} XP · +${progress.next.dinero} monedas</em></div></section>` : "";
            catalog.innerHTML = `<section class="game-profile"><button id="progress-back" class="secondary">← Catálogo</button><div class="game-profile-head"><div class="cover"><span>🎮</span><img data-cover="${game.id}" ${game.image ? `src="${game.image}"` : "hidden"} alt="Portada de ${escapeHtml(game.name)}"></div><div><small>${escapeHtml(game.platform)}</small><h2>${escapeHtml(game.name)}</h2><p>${escapeHtml(game.description)}</p><button id="progress-play">▶ Jugar ahora</button></div></div><section class="completion-card ${complete ? "complete" : ""}"><div><small>PROGRESO DEL JUEGO</small><b>${progress.unlocked}/${progress.total} · ${progress.percent}%</b></div><div class="completion-track" aria-label="${progress.percent}% completado"><i style="width:${progress.percent}%"></i></div><p>${complete ? "👑 ¡Dominio total desbloqueado! Recibiste la recompensa suprema de 100%." : `Completa los ${progress.total} logros para conseguir la insignia Dominio total.`}</p></section>${nextGoal}<section class="game-stat-grid"><div><small>PARTIDAS</small><b>🎮 ${progress.stats.played || 0}</b></div><div><small>GUARDADOS</small><b>💾 ${progress.stats.saves || 0}</b></div><div><small>VICTORIAS</small><b>⚔️ ${progress.stats.wins || 0}</b></div><div><small>MEJOR PUNTAJE</small><b>🏅 ${Number(progress.stats.bestScore || 0).toLocaleString()}</b></div></section><h3 class="achievement-title">🏆 Logros del juego <span>${progress.unlocked}/${progress.total}</span></h3><div class="achievement-list">${achievementCards}</div></section>`;
            catalog.querySelector("#progress-back").onclick = showCatalog;
            catalog.querySelector("#progress-play").onclick = () => iniciarJuego(gameId);
            cargarPortadas();
        } catch (error) { catalog.innerHTML = `<p>⚠️ ${escapeHtml(error.message)}</p><button id="progress-back" class="secondary">← Catálogo</button>`; catalog.querySelector("#progress-back").onclick = showCatalog; }
    }
    async function cargarPortadas() {
        // Todas salen de la lista exacta del servidor; se piden en paralelo para
        // que una portada sin conexión no retrase el resto del catálogo.
        await Promise.all([...catalog.querySelectorAll("img[data-cover][hidden]")].map(async image => {
            try { const { url } = await api(`/api/covers/${encodeURIComponent(image.dataset.cover)}`); if (url) { image.src = url; image.hidden = false; } } catch { /* La tarjeta conserva su portada GX de respaldo. */ }
        }));
    }
    async function iniciarJuego(gameId) {
        prepararSonidoLogro();
        active = games.find(g => g.id === gameId); if (!active) return;
        catalog.classList.add("hidden"); gameBox.classList.remove("hidden"); title.textContent = active.name;
        if (active.runner === "jsnes") return renderNes();
        if (active.runner === "emulatorjs") return renderEmulatorJs();
        if (active.runner !== "memory") { gameBox.innerHTML = "<p>Este recurso requiere un runner compatible configurado por el administrador.</p>"; return; }
        renderMemory(); await cargarGuardados();
        if (requestedLoad) await cargarUltimoGuardadoMemory();
        await crearSesion(gameId);
    }
    let state;
    function nuevoEstado() { const symbols = ["🎴","❄️","🌹","💎","🪽","⚔️","🎀","✨"]; const cards = [...symbols, ...symbols].sort(() => Math.random() - .5).map((symbol, id) => ({ id, symbol, solved: false })); return { cards, open: [], moves: 0, startedAt: Date.now() }; }
    function renderMemory() {
        state ||= nuevoEstado();
        gameBox.innerHTML = `<div class="stats"><span>Movimientos: <b>${state.moves}</b></span><span id="timer">Tiempo: 0m</span></div><div class="board">${state.cards.map(card => `<button class="card ${card.solved || state.open.includes(card.id) ? "open" : ""}" data-card="${card.id}">${card.solved || state.open.includes(card.id) ? card.symbol : "?"}</button>`).join("")}</div><button id="new" class="secondary">Nueva partida</button><button id="save">💾 Guardar</button><button id="back" class="secondary">Catálogo</button><div id="saves"><p class="notice">Cargando partidas…</p></div>`;
        gameBox.querySelectorAll("[data-card]").forEach(button => button.onclick = () => voltear(Number(button.dataset.card)));
        document.querySelector("#new").onclick = () => { state = nuevoEstado(); renderMemory(); };
        document.querySelector("#save").onclick = () => guardar(); document.querySelector("#back").onclick = showCatalog;
    }
    function voltear(id) {
        if (state.open.length >= 2 || state.open.includes(id) || state.cards[id].solved) return;
        state.open.push(id); renderMemory();
        if (state.open.length === 2) { state.moves++; const [a,b] = state.open; setTimeout(() => { if (state.cards[a].symbol === state.cards[b].symbol) state.cards[a].solved = state.cards[b].solved = true; state.open = []; renderMemory(); }, 650); }
    }
    async function guardar() { const result = await api("/api/saves", { method: "POST", body: JSON.stringify({ gameId: active.id, slotId: "principal", label: "Partida principal", state, metadata: { moves: state.moves, solved: state.cards.filter(c => c.solved).length, durationMs: Date.now() - state.startedAt } }) }); mostrarProgreso(result.progress); await cargarGuardados(); }
    async function cargarGuardados() {
        const { saves } = await api(`/api/saves?gameId=${encodeURIComponent(active.id)}`); const box = document.querySelector("#saves"); if (!box) return;
        box.innerHTML = saves.length ? saves.map(save => `<div class="save-row"><span><b>${save.label}</b><br><small>${new Date(save.updatedAt).toLocaleString()}</small></span><span><button data-load="${save.id}" class="secondary">Cargar</button><button data-delete="${save.id}" class="danger">×</button></span></div>`).join("") : "<p class=\"notice\">Aún no hay partidas guardadas.</p>";
        box.querySelectorAll("[data-load]").forEach(button => button.onclick = async () => { state = (await api(`/api/saves/${button.dataset.load}`)).save.state; state.open = []; renderMemory(); });
        box.querySelectorAll("[data-delete]").forEach(button => button.onclick = async () => { await api(`/api/saves/${button.dataset.delete}`, { method: "DELETE" }); cargarGuardados(); });
    }
    async function cargarUltimoGuardadoMemory() {
        const { saves } = await api(`/api/saves?gameId=${encodeURIComponent(active.id)}`);
        if (!saves[0]) return;
        state = (await api(`/api/saves/${saves[0].id}`)).save.state;
        state.open = []; renderMemory(); await cargarGuardados();
    }
    async function renderEmulatorJs() {
        const esN64 = active.platform === "Nintendo 64";
        const esPsp = active.platform === "PSP";
        // No se ata a un modelo de teléfono: se adapta a las capacidades que
        // el navegador expone, con valores seguros cuando no las informa.
        const memoryGB = Number(navigator.deviceMemory) || 4;
        const cpuThreads = Number(navigator.hardwareConcurrency) || 4;
        const perfilDispositivo = memoryGB >= 8 && cpuThreads >= 8 ? "alto" : memoryGB >= 4 && cpuThreads >= 6 ? "medio" : "ahorro";
        gameBox.innerHTML = `<div class="game-topbar"><span class="playing">Jugando · ${active.name}</span><span><button id="gba-fullscreen" class="secondary">⛶ Pantalla completa</button><button id="back" class="secondary">← Catálogo</button></span></div><p class="notice">${esN64 ? "Perfil N64 de máxima fluidez aplicado para todos: usa el procesador y GPU del teléfono con el núcleo compatible." : "La primera carga descarga el juego una vez; después queda disponible en este navegador."} El .sav interno se guarda por usuario y juego.</p><div class="emulator-stage ${esN64 ? "n64-stage" : ""} ${esPsp ? "psp-stage" : ""}"><div id="emulator" class="nes-screen" aria-label="Pantalla del juego"></div><div id="game-loading" class="game-loading" role="status" aria-live="polite"><span class="loading-icon">🎮</span><b>Preparando ${active.platform}</b><small id="loading-detail">Comprobando caché local…</small><div class="loading-track"><i id="loading-bar"></i></div><strong id="loading-percent">0%</strong></div><button class="fullscreen-close" aria-label="Salir de pantalla completa">×</button></div>`;
        await crearSesion(active.id);
        const loading = document.querySelector("#game-loading"), detail = document.querySelector("#loading-detail"), bar = document.querySelector("#loading-bar"), percent = document.querySelector("#loading-percent");
        const actualizarCarga = (texto, ratio = null) => {
            detail.textContent = texto;
            if (ratio !== null) { const value = Math.max(0, Math.min(100, Math.round(ratio * 100))); bar.style.width = `${value}%`; percent.textContent = `${value}%`; }
        };
        const ocultarCarga = () => { loading.classList.add("done"); setTimeout(() => loading.remove(), 360); };
        let romObjectUrl = null;
        const romEndpoint = `/api/roms/${encodeURIComponent(active.id)}?token=${encodeURIComponent(token)}`;
        const descargarRom = async () => {
            actualizarCarga("Descargando juego…", 0);
            const response = await fetch(romEndpoint, { headers: { Authorization: `Bearer ${token}` } });
            if (!response.ok) throw new Error("No se pudo descargar la ROM.");
            const total = Number(response.headers.get("content-length")) || 0;
            // Las ISO de PSP pueden superar cientos de MB: dejarlas al gestor
            // de caché del emulador evita duplicarlas completas en memoria.
            if (total > 256 * 1024 * 1024) { actualizarCarga("Juego grande: preparando descarga optimizada…", .08); return romEndpoint; }
            if (!response.body || !total) { actualizarCarga("Preparando juego…", .85); return URL.createObjectURL(await response.blob()); }
            const reader = response.body.getReader(), chunks = []; let received = 0;
            while (true) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); received += value.length; actualizarCarga(`Descargando juego… ${Math.round(received / 1024 / 1024)} MB`, received / total); }
            actualizarCarga("Verificando archivo…", 1);
            return URL.createObjectURL(new Blob(chunks, { type: "application/octet-stream" }));
        };
        try { romObjectUrl = await descargarRom(); }
        catch (error) { gameBox.innerHTML = `<p>⚠️ ${error.message}</p><button id="back" class="secondary">← Catálogo</button>`; document.querySelector("#back").onclick = showCatalog; return; }
        window.EJS_player = "#emulator";
        window.EJS_core = active.core || (active.platform.includes("Advance") ? "mgba" : "gambatte");
        window.EJS_gameName = active.name;
        window.EJS_gameID = active.id;
        window.EJS_gameUrl = romObjectUrl;
        window.EJS_pathtodata = "/vendor/emulatorjs/data/";
        window.EJS_startOnLoaded = true;
        window.EJS_browserMode = "mobile";
        // Usamos los archivos fuente que sí están incluidos localmente. Sin esto
        // el loader intenta primero una versión minificada inexistente y, en redes
        // lentas, el reintento podía terminar mostrando un error de carga.
        window.EJS_DEBUG_XX = true;
        window.EJS_cacheConfig = { enabled: true, cacheMaxSizeMB: perfilDispositivo === "alto" ? 1024 : perfilDispositivo === "medio" ? 512 : 256, cacheMaxAgeMins: 43200 };
        // PPSSPP usa su núcleo con hilos. Para N64 se usa el núcleo WASM normal:
        // emplea CPU/GPU reales del móvil sin depender de SharedArrayBuffer,
        // que algunos navegadores móviles bloquean y dejaba pantalla negra.
        window.EJS_threads = esPsp;
        // Perfil universal N64 probado: dinámico + GLideN64 y sin filtros
        // costosos. No se fuerzan opciones avanzadas que algunas ROMs no
        // soportan en WebAssembly. Se ignoran los ajustes N64 antiguos para
        // que este perfil sea igual para todos.
        const n64Fluido = {
            "mupen64plus-EnableNativeResFactor": "1",
            "mupen64plus-cpucore": "dynamic_recompiler",
            "mupen64plus-rdp-plugin": "gliden64",
            "mupen64plus-MultiSampling": "0",
            "mupen64plus-FXAA": "0",
            "mupen64plus-EnableLODEmulation": "False",
            "mupen64plus-EnableFBEmulation": "False",
            "mupen64plus-EnableCopyColorToRDRAM": "Off",
            "mupen64plus-EnableShadersStorage": "True",
            "mupen64plus-EnableLegacyBlending": "True"
        };
        window.EJS_defaultOptions = esN64 ? n64Fluido : {};
        window.EJS_disableLocalStorage = esN64;
        // En GBA, SNES, GB y GBC sincroniza el .sav interno al navegador cada minuto.
        window.EJS_fixedSaveInterval = 60000;
        let savRestaurado = false;
        const aBase64Url = bytes => {
            let texto = "";
            for (let i = 0; i < bytes.length; i += 0x8000) texto += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
            return btoa(texto).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
        };
        const desdeBase64Url = texto => {
            const base64 = texto.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - texto.length % 4) % 4);
            return Uint8Array.from(atob(base64), char => char.charCodeAt(0));
        };
        const sincronizarSav = async () => {
            const manager = window.EJS_emulator?.gameManager;
            if (!manager) return;
            manager.saveSaveFiles();
            const sav = manager.getSaveFile(false);
            if (!sav?.length) return;
            const result = await api(`/api/emulator-saves/${encodeURIComponent(active.id)}`, { method: "POST", body: JSON.stringify({ data: aBase64Url(sav), bytes: sav.length }) });
            mostrarProgreso(result.progress);
        };
        // El guardado propio del juego se detecta cada minuto; además se fuerza
        // justo antes de cerrar para no perder una partida recién guardada.
        window.EJS_onSaveUpdate = () => { sincronizarSav().catch(() => {}); };
        window.EJS_onGameStart = async () => {
            ocultarCarga();
            if (savRestaurado) return;
            savRestaurado = true;
            try {
                const { save } = await api(`/api/emulator-saves/${encodeURIComponent(active.id)}`);
                if (save?.format !== "emulator-sav-v1" || !save.data) return;
                const manager = window.EJS_emulator?.gameManager;
                if (!manager) return;
                manager.writeFile(manager.getSaveFilePath(), desdeBase64Url(save.data));
                await new Promise(resolve => manager.FS.syncfs(false, resolve));
                manager.loadSaveFiles();
            } catch { /* Sin un .sav previo el juego inicia normalmente. */ }
        };
        window.EJS_ready = () => actualizarCarga("Iniciando el emulador…", 1);
        try {
            actualizarCarga("Cargando motor de emulación…", 1);
            await new Promise((resolve, reject) => { const script = document.createElement("script"); script.type = "module"; script.src = "/vendor/emulatorjs/data/loader.js"; script.onload = resolve; script.onerror = () => reject(new Error("No se pudo cargar el emulador de Game Boy.")); document.head.appendChild(script); });
        } catch (error) { if (romObjectUrl?.startsWith("blob:")) URL.revokeObjectURL(romObjectUrl); gameBox.innerHTML = `<p>⚠️ ${error.message}</p><button id="back" class="secondary">← Catálogo</button>`; document.querySelector("#back").onclick = showCatalog; return; }
        document.querySelector("#back").onclick = () => salirEmulador(sincronizarSav, romObjectUrl);
        document.querySelector("#gba-fullscreen").onclick = () => alternarPantallaCompletaGba();
        document.querySelector(".fullscreen-close").onclick = salirPantallaCompleta;
    }
    async function alternarPantallaCompletaGba() {
        try {
            if (document.fullscreenElement || gameBox.classList.contains("fullscreen-fallback")) {
                await salirPantallaCompleta();
            } else {
                gameBox.classList.add("fullscreen-fallback", "landscape-mode");
                try { await gameBox.requestFullscreen({ navigationUI: "hide" }); } catch { /* El modo de respaldo ocupa toda la ventana. */ }
            }
        } catch { /* El modo de respaldo sigue disponible aunque falle la API del navegador. */ }
    }
    async function salirPantallaCompleta() {
        if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
        gameBox.classList.remove("fullscreen-fallback", "landscape-mode");
        window.dispatchEvent(new Event("resize"));
    }
    async function salirEmulador(sincronizarSav, romObjectUrl = null) {
        const emulador = window.EJS_emulator;
        try {
            const manager = emulador?.gameManager;
            // Fuerza el guardado interno (.sav) y espera a que IndexedDB termine
            // antes de desmontar EmulatorJS o mostrar el catálogo.
            manager?.saveSaveFiles?.();
            await sincronizarSav?.();
            await new Promise(resolve => manager?.FS?.syncfs ? manager.FS.syncfs(false, resolve) : resolve());
            manager?.toggleMainLoop?.(0);
            emulador?.callEvent?.("exit");
            const audio = emulador?.Module?.AL?.currentCtx?.audioCtx;
            if (audio?.state !== "closed") await audio?.close?.();
        } catch { /* Aun si el emulador ya se detuvo, se puede volver al catálogo. */ }
        document.querySelector("#emulator")?.replaceChildren();
        window.EJS_emulator = null;
        if (romObjectUrl?.startsWith("blob:")) URL.revokeObjectURL(romObjectUrl);
        if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
        gameBox.classList.remove("fullscreen-fallback", "landscape-mode");
        showCatalog();
    }
    async function renderNes() {
        gameBox.innerHTML = `<div class="game-topbar"><span class="playing">Jugando · ${active.name}</span><button id="fullscreen" class="secondary" aria-label="Pantalla completa horizontal">⛶ Pantalla completa</button></div><div class="play-stage nes-stage"><div id="nes" class="nes-screen" aria-label="Pantalla del juego"></div><div class="touch-controls nes-controls" aria-label="Controles táctiles"><div class="d-pad"><button data-key="ArrowUp" class="up" aria-label="Arriba">▲</button><button data-key="ArrowLeft" class="left" aria-label="Izquierda">◀</button><button data-key="ArrowDown" class="down" aria-label="Abajo">▼</button><button data-key="ArrowRight" class="right" aria-label="Derecha">▶</button></div><div class="action-buttons"><button data-key="z" class="button-b" aria-label="Botón B">B</button><button data-key="x" class="button-a" aria-label="Botón A">A</button><div class="system-buttons"><button data-key="Shift" aria-label="Select">SELECT</button><button data-key="Enter" aria-label="Start">START</button></div></div></div><button class="fullscreen-close" aria-label="Salir de pantalla completa">×</button></div><div class="game-actions"><button id="sound" class="secondary">🔊 Activar sonido</button><button id="save-nes">💾 Guardar</button><button id="load-nes" class="secondary" disabled>Cargar guardado</button><button id="exit-fullscreen" class="secondary">↙ Salir pantalla completa</button><button id="back" class="secondary">← Catálogo</button></div><p id="nes-save-status" class="notice">Teclado: flechas, Z/B, X/A, Shift/Select y Enter/Start.</p>`;
        if (!window.jsnes) await new Promise((ok, bad) => { const s = document.createElement("script"); s.src = "/vendor/jsnes/jsnes.min.js"; s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
        const rom = await fetch(`/api/roms/${encodeURIComponent(active.id)}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error("No se pudo leer la ROM.")));
        const browser = new window.jsnes.Browser({ container: document.querySelector("#nes") });
        browser.loadROM(rom);
        configurarControlesTactiles(browser);
        const ajustarPantalla = () => {
            const ampliada = document.fullscreenElement === gameBox || gameBox.classList.contains("fullscreen-fallback");
            const pantalla = document.querySelector("#nes");
            pantalla.style.height = ampliada ? `${Math.max(240, window.innerHeight - 310)}px` : "";
            requestAnimationFrame(() => browser.fitInParent());
        };
        document.addEventListener("fullscreenchange", ajustarPantalla);
        window.addEventListener("resize", ajustarPantalla);
        const activarSonido = async () => { try { await browser._speakers.audioCtx?.resume(); document.querySelector("#sound").textContent = "🔊 Sonido activo"; } catch { document.querySelector("#nes-save-status").textContent = "No se pudo activar el sonido en este navegador."; } };
        document.querySelector("#sound").onclick = activarSonido;
        document.querySelector("#fullscreen").onclick = async () => {
            try {
                if (document.fullscreenElement || gameBox.classList.contains("fullscreen-fallback")) {
                    if (document.fullscreenElement) await document.exitFullscreen();
                    gameBox.classList.remove("fullscreen-fallback", "landscape-mode"); ajustarPantalla();
                } else {
                    gameBox.classList.add("fullscreen-fallback", "landscape-mode");
                    try { await gameBox.requestFullscreen({ navigationUI: "hide" }); }
                    catch { document.querySelector("#nes-save-status").textContent = "Vista ampliada activada. Tu navegador mantiene su propia barra superior."; }
                    ajustarPantalla();
                }
            } catch { document.querySelector("#nes-save-status").textContent = "No se pudo activar la vista ampliada."; }
        };
        document.querySelector("#exit-fullscreen").onclick = async () => { await salirPantallaCompleta(); ajustarPantalla(); };
        document.querySelector(".fullscreen-close").onclick = async () => { await salirPantallaCompleta(); ajustarPantalla(); };
        await crearSesion(active.id);
        const status = document.querySelector("#nes-save-status"), load = document.querySelector("#load-nes");
        const cargarGuardado = async () => {
            try {
                const { saves } = await api(`/api/saves?gameId=${encodeURIComponent(active.id)}`);
                const ultimo = saves.find(save => save.slotId === "principal"); if (!ultimo) { status.textContent = "No hay un guardado para este juego."; return; }
                const data = await api(`/api/saves/${ultimo.id}`);
                browser.stop();
                browser.nes.fromJSON(data.save.state);
                browser.start();
                status.textContent = "Partida cargada.";
            } catch (error) { status.textContent = `No se pudo cargar: ${error.message}`; }
        };
        let guardado = null;
        try {
            const { saves } = await api(`/api/saves?gameId=${encodeURIComponent(active.id)}`);
            guardado = saves.find(save => save.slotId === "principal") || null;
            if (guardado) { load.disabled = false; status.textContent = "Hay un guardado disponible para este juego."; }
        } catch { status.textContent = "No se pudo consultar el guardado todavía."; }
        document.querySelector("#save-nes").onclick = async () => {
            try {
                const result = await api("/api/saves", { method: "POST", body: JSON.stringify({ gameId: active.id, slotId: "principal", label: "Guardado NES", state: browser.nes.toJSON(), metadata: { runner: "jsnes" } }) });
                mostrarProgreso(result.progress);
                load.disabled = false; status.textContent = "Partida guardada. El guardado anterior fue reemplazado.";
            } catch (error) { status.textContent = `No se pudo guardar: ${error.message}`; }
        };
        load.onclick = cargarGuardado;
        if (requestedLoad && guardado) await cargarGuardado();
        // NES sólo escribe una partida cuando la persona toca «Guardar».
        document.querySelector("#back").onclick = () => {
            document.removeEventListener("fullscreenchange", ajustarPantalla); window.removeEventListener("resize", ajustarPantalla); browser.destroy(); showCatalog();
        };
    }
    function configurarControlesTactiles(browser) {
        const botones = { ArrowUp: "BUTTON_UP", ArrowDown: "BUTTON_DOWN", ArrowLeft: "BUTTON_LEFT", ArrowRight: "BUTTON_RIGHT", z: "BUTTON_B", x: "BUTTON_A", Shift: "BUTTON_SELECT", Enter: "BUTTON_START" };
        gameBox.querySelectorAll("[data-key]").forEach(button => {
            const id = window.jsnes.Controller[botones[button.dataset.key]];
            const soltar = event => { event.preventDefault(); browser.nes.buttonUp(1, id); button.classList.remove("pressed"); };
            button.addEventListener("pointerdown", event => { event.preventDefault(); button.setPointerCapture?.(event.pointerId); browser._speakers.audioCtx?.resume(); browser.nes.buttonDown(1, id); button.classList.add("pressed"); });
            button.addEventListener("pointerup", soltar);
            button.addEventListener("pointercancel", soltar);
            button.addEventListener("lostpointercapture", soltar);
        });
    }
    (async () => { if (!token) return error("Abre el enlace seguro enviado por Alexis."); try { const [session, data, status] = await Promise.all([api("/api/session"), api("/api/games"), api("/api/arcade-status")]); currentUserId = session.user.id; arcadeStatus = status; subtitle.textContent = `Hola, ${session.user.displayName}. Tus partidas se sincronizan de forma privada.`; programarAvisoEnlace(session.expiresAt); games = data.games; if (requestedGameId && games.some(game => game.id === requestedGameId)) iniciarJuego(requestedGameId); else showCatalog(); } catch (e) { error(e.message); } })();
})();
