const {
    obtenerUsuario,
    actualizarUsuario,
    agregarXP,
    agregarDinero
} = require("../../database/economy");

// ==========================================
// DESAFÍOS DE DUEL ACADEMY
// ==========================================

const desafios = [

    {
        texto: "Envía 5 mensajes en la Academia.",
        objetivo: 5,
        tipo: "mensajes",
        xp: 50,
        dinero: 500
    },

    {
        texto: "Usa cualquier comando del bot 3 veces.",
        objetivo: 3,
        tipo: "comandos",
        xp: 75,
        dinero: 750
    },

    {
        texto: "Consigue 10 mensajes en la Academia.",
        objetivo: 10,
        tipo: "mensajes",
        xp: 100,
        dinero: 1000
    },

    {
        texto: "Trabaja 2 veces usando #work.",
        objetivo: 2,
        tipo: "work",
        xp: 125,
        dinero: 1200
    },

    {
        texto: "Consigue 500 XP mediante actividades.",
        objetivo: 500,
        tipo: "xp",
        xp: 150,
        dinero: 1500
    },

    {
        texto: "Envía 15 mensajes en la Academia.",
        objetivo: 15,
        tipo: "mensajes",
        xp: 140,
        dinero: 1400
    },

    {
        texto: "Usa 6 comandos del bot.",
        objetivo: 6,
        tipo: "comandos",
        xp: 160,
        dinero: 1600
    },

    {
        texto: "Trabaja 3 veces usando #work.",
        objetivo: 3,
        tipo: "work",
        xp: 200,
        dinero: 2000
    },

    {
        texto: "Consigue 100 XP mediante actividades.",
        objetivo: 100,
        tipo: "xp",
        xp: 120,
        dinero: 1100
    },

    {
        texto: "Envía 25 mensajes en la Academia.",
        objetivo: 25,
        tipo: "mensajes",
        xp: 220,
        dinero: 2200
    },

    {
        texto: "Usa 10 comandos del bot.",
        objetivo: 10,
        tipo: "comandos",
        xp: 250,
        dinero: 2500
    },

    {
        texto: "Consigue 250 XP mediante actividades.",
        objetivo: 250,
        tipo: "xp",
        xp: 280,
        dinero: 2800
    }

];


// ==========================================
// COMANDO #DESAFIO
// ==========================================

module.exports = async function desafio(
    sock,
    msg
) {

    const chatId =
        msg.key.remoteJid;

    const userId =
        msg.key.participant ||
        msg.key.remoteJid;

    const numero =
        userId.split("@")[0];

    const mencion =
        "@" + numero;

    const usuario =
        obtenerUsuario(userId);


    // ======================================
    // COMPROBAR DESAFÍO ACTIVO
    // ======================================

    if (
        usuario.desafio
    ) {

        const desafioActual =
            usuario.desafio;

        await sock.sendMessage(
            chatId,
            {
                text:
`❄️ *ALEXIS RHODES* ❄️

🪽 *Duelista:* ${mencion}

🎴 Ya tienes un desafío activo.

💎 *DESAFÍO ACTUAL*

📜 ${desafioActual.texto}

📊 Progreso:
*${desafioActual.progreso || 0}/${desafioActual.objetivo}*

⭐ Recompensa XP:
*+${desafioActual.xp} XP*

💰 Recompensa:
*$${desafioActual.dinero.toLocaleString()}*

🎴 ¡Completa tu desafío antes de aceptar otro!`,
                mentions: [
                    userId
                ]
            }
        );

        return;
    }


    // ======================================
    // ELEGIR DESAFÍO
    // ======================================

    const desafio =
        desafios[
            Math.floor(
                Math.random() *
                desafios.length
            )
        ];


    // ======================================
    // GUARDAR DESAFÍO
    // ======================================

    actualizarUsuario(
        userId,
        {
            desafio: {
                texto: desafio.texto,
                objetivo: desafio.objetivo,
                tipo: desafio.tipo,
                progreso: 0,
                xp: desafio.xp,
                dinero: desafio.dinero
            }
        }
    );


    // ======================================
    // RESPUESTA
    // ======================================

    await sock.sendMessage(
        chatId,
        {
            text:
`❄️ *ALEXIS RHODES* ❄️

🎴 *「 NUEVO DESAFÍO 」* 🎴

🪽 *Duelista:* ${mencion}

📜 *Misión:*

${desafio.texto}

📊 Progreso:
*0/${desafio.objetivo}*

⭐ Recompensa XP:
*+${desafio.xp} XP*

💰 Recompensa:
*$${desafio.dinero.toLocaleString()}*

💎 ¡Demuestra lo que puedes hacer, duelista!

🎴 Cuando completes el desafío recibirás las recompensas.`,
            mentions: [
                userId
            ]
        }
    );
};
