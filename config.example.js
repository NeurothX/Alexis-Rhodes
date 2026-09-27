const path = require("path");

// Copia este archivo como config.js. Otra persona sólo necesita cambiar
// botNumber por SU número de WhatsApp; no hace falta cambiar al creador.
const config = {
    botName: "Alexis Rhodes",
    prefix: "#",
    // Número que se vinculará como bot (sin +, espacios ni guiones).
    botNumber: "50500000000",
    // Créditos originales de Alexis Rhodes Bot.
    ownerNumber: "50581261007",
    ownerName: "NeurothX",
    assets: {
        alexis: "./assets/alexis.jpg",
        menu: "./assets/menu.jpg",
        welcome: "./assets/welcome.jpg",
        goodbye: "./assets/goodbye.jpg"
    },
    games: {
        port: Number(process.env.GAMES_PORT) || 3100,
        publicUrl: process.env.GAMES_PUBLIC_URL || "http://127.0.0.1:3100",
        autoTunnel: process.env.GAMES_AUTO_TUNNEL !== "false",
        tunnelBinary: process.env.CLOUDFLARED_PATH || path.join(__dirname, "tools", "cloudflared-full.exe")
    },
    arcade: {
        achievementSound: path.join(__dirname, "assets", "achievement-unlock.wav"),
        rewards: {
            comun: { xp: 40, dinero: 80, icon: "🥉" },
            dificil: { xp: 120, dinero: 240, icon: "🥈" },
            epico: { xp: 300, dinero: 650, icon: "🥇" },
            legendario: { xp: 750, dinero: 1500, icon: "💎" },
            supremo: { xp: 2500, dinero: 5000, icon: "👑" }
        },
        recordRewards: { xp: 100, dinero: 250 },
        groupAnnouncementsDefault: false
    }
};

module.exports = config;
