const {
    obtenerUsuario,
    actualizarUsuario,
    agregarXP
} = require("../../database/economy");

const {
    actualizarDesafio
} = require("../../systems/challengeSystem");


// ==========================================
// TRABAJOS DISPONIBLES
// ==========================================

const trabajos = [
    {
        nombre: "ayudaste a limpiar la Academia de Duelos",
        minimo: 250,
        maximo: 500
    },
    {
        nombre: "entrenaste a un duelista novato",
        minimo: 300,
        maximo: 600
    },
    {
        nombre: "participaste en un torneo de la Academia",
        minimo: 400,
        maximo: 800
    },
    {
        nombre: "vendiste algunas cartas que ya no necesitabas",
        minimo: 350,
        maximo: 700
    },
    {
        nombre: "ayudaste a preparar un examen de duelos",
        minimo: 300,
        maximo: 650
    },
    {
        nombre: "ganaste un pequeño duelo por apuestas",
        minimo: 500,
        maximo: 1000
    },
    {
        nombre: "ayudaste a Alexis a organizar cartas rituales",
        minimo: 450,
        maximo: 850
    },
    {
        nombre: "entrenaste invocaciones con los Cyber Angel",
        minimo: 550,
        maximo: 950
    },
    {
        nombre: "fuiste árbitro de un duelo de la Academia",
        minimo: 400,
        maximo: 750
    },
    {
        nombre: "recuperaste cartas perdidas en la isla de duelos",
        minimo: 600,
        maximo: 1100
    },
    {
        nombre: "programaste el sistema de puntuación de un torneo",
        minimo: 650,
        maximo: 1200
    },
    {
        nombre: "restauraste cartas antiguas en el archivo de la Academia",
        minimo: 700,
        maximo: 1300
    },
    {
        nombre: "diseñaste una estrategia para un duelo de campeonato",
        minimo: 750,
        maximo: 1400
    },
    {
        nombre: "cubrirte como comentarista de un Turbo Duelo",
        minimo: 800,
        maximo: 1500
    },
    {
        nombre: "encontraste un patrocinador para el club de duelos",
        minimo: 900,
        maximo: 1700
    },
    {
        nombre: "enseñaste tácticas avanzadas de invocación ritual",
        minimo: 850,
        maximo: 1600
    }
];


// ==========================================
// GENERAR NÚMERO ALEATORIO
// ==========================================

function aleatorio(minimo, maximo) {
    return Math.floor(
        Math.random() * (
            maximo - minimo + 1
        )
    ) + minimo;
}


// ==========================================
// COMANDO #WORK
// ==========================================

module.exports = async function work(sock, msg) {

    try {

        const userId =
            msg.key.participant ||
            msg.key.remoteJid;

        const chatId =
            msg.key.remoteJid;


        if (!userId) {
            return;
        }


        const usuario =
            obtenerUsuario(userId);


        const numero =
            userId.split("@")[0];


        const mencion =
            "@" + numero;


        const ahora =
            Date.now();


        const espera =
            30 * 60 * 1000;


        const tiempoPasado =
            ahora -
            (
                usuario.ultimoTrabajo ||
                0
            );


        // ======================================
        // COMPROBAR TIEMPO DE ESPERA
        // ======================================

        if (tiempoPasado < espera) {

            const restante =
                espera - tiempoPasado;


            const minutos =
                Math.floor(
                    restante /
                    (60 * 1000)
                );


            const segundos =
                Math.floor(
                    (
                        restante %
                        (60 * 1000)
                    ) /
                    1000
                );


            await sock.sendMessage(
                chatId,
                {
                    text:
`❄️ *ALEXIS RHODES* ❄️

🪽 *Duelista:* ${mencion}

💼 Ya tienes un trabajo en curso.

⏳ Debes esperar:

💎 *${minutos} minutos y ${segundos} segundos*

🎴 ¡Vuelve después, duelista!`,
                    mentions: [
                        userId
                    ]
                }
            );

            return;
        }


        // ======================================
        // ELEGIR TRABAJO
        // ======================================

        const trabajo =
            trabajos[
                Math.floor(
                    Math.random() *
                    trabajos.length
                )
            ];


        // ======================================
        // CALCULAR DINERO
        // ======================================

        const recompensa =
            aleatorio(
                trabajo.minimo,
                trabajo.maximo
            );


        // ======================================
        // CALCULAR XP
        // ======================================

        const xpGanada =
            aleatorio(
                25,
                50
            );


        // ======================================
        // OBTENER DINERO ACTUAL
        // ======================================

        const dineroActual =
            Number(
                usuario.dinero || 0
            );


        const nuevoDinero =
            dineroActual +
            recompensa;


        // ======================================
        // GUARDAR DINERO + TIEMPO
        // ======================================

        actualizarUsuario(
            userId,
            {
                dinero: nuevoDinero,

                ultimoTrabajo: ahora
            }
        );


        // ======================================
        // GUARDAR XP
        // ======================================

        const resultadoXP =
            agregarXP(
                userId,
                xpGanada
            );


        // ======================================
        // ACTUALIZAR DESAFÍO DE XP
        // ======================================

        try {

            await actualizarDesafio(
                sock,
                msg,
                "xp",
                xpGanada
            );

        } catch (error) {

            console.log(
                "❌ Error actualizando desafío de XP:"
            );

            console.log(error);
        }


        // ======================================
        // DATOS ACTUALIZADOS
        // ======================================

        const usuarioActualizado =
            obtenerUsuario(userId);


        const nivel =
            usuarioActualizado.nivel || 1;


        const xpActual =
            usuarioActualizado.xp || 0;


        // ======================================
        // MENSAJE
        // ======================================

        let texto =
`❄️ *ALEXIS RHODES* ❄️

🪽 *Duelista:* ${mencion}

💼 *TRABAJO COMPLETADO*

🎴 ${mencion} ${trabajo.nombre}.

━━━━━━━━━━━━━━━━

💰 Recompensa:
*+$${recompensa.toLocaleString()}*

⭐ XP obtenida:
*+${xpGanada} XP*

🎴 Nivel:
*${nivel}*

⭐ XP actual:
*${xpActual} XP*

💎 Saldo actual:
*$${Number(
    usuarioActualizado.dinero || 0
).toLocaleString()}*
`;


        // ======================================
        // SUBIDA DE NIVEL
        // ======================================

        if (resultadoXP.subioNivel) {

            texto +=
`
━━━━━━━━━━━━━━━━

🎉 *¡SUBISTE DE NIVEL!*

🎴 Nuevo nivel:
*${usuarioActualizado.nivel}*

🏆 Nuevo rango:
*${usuarioActualizado.rango}*
`;
        }


        texto +=
`
━━━━━━━━━━━━━━━━

✨ ¡Buen trabajo, duelista!`;


        // ======================================
        // ENVIAR MENSAJE
        // ======================================

        await sock.sendMessage(
            chatId,
            {
                text: texto,
                mentions: [
                    userId
                ]
            }
        );


    } catch (error) {

        console.log("");
        console.log(
            "❌ ERROR EN #WORK"
        );

        console.log(error);
        console.log("");


        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
`❄️ *ALEXIS RHODES* ❄️

❌ Ocurrió un error al realizar el trabajo.`
            }
        );
    }
};
