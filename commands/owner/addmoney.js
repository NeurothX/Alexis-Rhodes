const config = require("../../config");

const {
    obtenerUsuario,
    agregarDinero
} = require("../../database/economy");


// ========================================
// LIMPIAR NÚMERO
// ========================================

function limpiarNumero(numero) {
    if (!numero) return "";

    return String(numero)
        .replace("@s.whatsapp.net", "")
        .replace("@lid", "")
        .replace(/\D/g, "");
}


// ========================================
// OBTENER IDENTIDAD REAL DEL REMITENTE
// ========================================

function obtenerRemitente(msg) {
    return (
        msg.key.participant ||
        msg.key.senderPn ||
        msg.key.remoteJid
    );
}


// ========================================
// OBTENER NÚMERO TELEFÓNICO SI EXISTE
// ========================================

function obtenerNumeroVisible(msg) {

    const posibles = [
        msg.key.participantAlt,
        msg.key.participantPn,
        msg.key.senderPn,
        msg.key.remoteJidAlt
    ];

    for (const jid of posibles) {

        if (
            jid &&
            jid.includes("@s.whatsapp.net")
        ) {
            return limpiarNumero(jid);
        }
    }

    return null;
}


// ========================================
// ADDMONEY
// ========================================

module.exports = async function addmoney(
    sock,
    msg,
    argumentos
) {

    // ========================================
    // 👑 VERIFICAR OWNER
    // ========================================

    const numeroOwner =
        limpiarNumero(
            config.ownerNumber
        );

    const remitente =
        obtenerRemitente(msg);

    const numeroRemitente =
        obtenerNumeroVisible(msg);

    const numeroDirecto =
        limpiarNumero(remitente);

    const esOwner =
        numeroRemitente === numeroOwner ||
        numeroDirecto === numeroOwner;


    console.log("");
    console.log("================================");
    console.log("👑 VERIFICACIÓN OWNER");
    console.log("Owner:", numeroOwner);
    console.log("Remitente:", remitente);
    console.log(
        "Número visible:",
        numeroRemitente
    );
    console.log(
        "¿ES OWNER?:",
        esOwner
    );
    console.log("================================");
    console.log("");


    if (!esOwner) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
`❄️ *ALEXIS RHODES* ❄️

⛔ *ACCESO DENEGADO*

Este comando es exclusivo del creador del bot. 👑`
            }
        );

        return;
    }


    // ========================================
    // 👤 BUSCAR MENCIÓN
    // ========================================

    let usuarioObjetivo = null;

    const contexto =
        msg.message
            ?.extendedTextMessage
            ?.contextInfo;


    if (
        contexto?.mentionedJid &&
        contexto.mentionedJid.length > 0
    ) {
        usuarioObjetivo =
            contexto.mentionedJid[0];
    }


    // ========================================
    // 💰 BUSCAR CANTIDAD
    // ========================================

    let cantidad = null;

    for (const argumento of argumentos) {

        if (
            /^\d+$/.test(argumento)
        ) {

            cantidad =
                Number(argumento);

            break;
        }
    }


    // ========================================
    // ❌ CANTIDAD INVÁLIDA
    // ========================================

    if (
        !cantidad ||
        cantidad <= 0
    ) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
`❄️ *ALEXIS RHODES* ❄️

❌ *Cantidad inválida.*

💰 *Para agregarte dinero:*
#addmoney 50000

👤 *Para agregarle a otro usuario:*
#addmoney @usuario 50000`
            }
        );

        return;
    }


    // ========================================
    // 👑 SIN MENCIÓN = DINERO PARA EL OWNER
    // ========================================

    let esParaOwner = false;

    if (!usuarioObjetivo) {

        usuarioObjetivo =
            remitente;

        esParaOwner = true;
    }


    // ========================================
    // 💾 SALDO ANTES
    // ========================================

    const usuarioAntes =
        obtenerUsuario(
            usuarioObjetivo
        );

    const dineroAntes =
        Number(
            usuarioAntes.dinero || 0
        );


    // ========================================
    // 💰 AGREGAR DINERO
    // ========================================

    agregarDinero(
        usuarioObjetivo,
        cantidad
    );


    // ========================================
    // 💾 SALDO DESPUÉS
    // ========================================

    const usuarioDespues =
        obtenerUsuario(
            usuarioObjetivo
        );

    const nuevoSaldo =
        Number(
            usuarioDespues.dinero || 0
        );


    // ========================================
    // 👑 RESPUESTA PARA EL OWNER
    // ========================================

    if (esParaOwner) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text:
`❄️ *ALEXIS RHODES* ❄️

👑 *CONTROL DEL CREADOR*

💰 Dinero agregado:
*+$${cantidad.toLocaleString()}*

👑 *Creador del bot*

💎 Saldo anterior:
*$${dineroAntes.toLocaleString()}*

💎 Nuevo saldo:
*$${nuevoSaldo.toLocaleString()}*

🎴 *Fondos actualizados correctamente.*

❄️ *— Alexis Rhodes*`
            }
        );

        return;
    }


    // ========================================
    // 👤 RESPUESTA PARA OTRO USUARIO
    // ========================================

    let numeroVisibleUsuario =
        null;

    // Intentar obtener PN de la mención
    if (
        usuarioObjetivo &&
        usuarioObjetivo.includes("@lid")
    ) {

        try {

            if (
                sock.signalRepository?.lidMapping
            ) {

                const pn =
                    await sock
                        .signalRepository
                        .lidMapping
                        .getPNForLID(
                            usuarioObjetivo
                        );

                if (pn) {
                    numeroVisibleUsuario =
                        limpiarNumero(pn);
                }
            }

        } catch (error) {

            console.log(
                "⚠️ No se pudo resolver LID:"
            );

            console.log(error);
        }
    }


    if (!numeroVisibleUsuario) {

        numeroVisibleUsuario =
            limpiarNumero(
                usuarioObjetivo
            );
    }


    // ========================================
    // 📩 RESPUESTA
    // ========================================

    await sock.sendMessage(
        msg.key.remoteJid,
        {
            text:
`❄️ *ALEXIS RHODES* ❄️

👑 *CONTROL DEL CREADOR*

💰 Dinero agregado:
*+$${cantidad.toLocaleString()}*

🪽 Duelista:
@${numeroVisibleUsuario}

💎 Saldo anterior:
*$${dineroAntes.toLocaleString()}*

💎 Nuevo saldo:
*$${nuevoSaldo.toLocaleString()}*

🎴 *Fondos actualizados correctamente.*

❄️ *— Alexis Rhodes*`,

            // Solo mencionamos UNA vez
            mentions: [
                usuarioObjetivo
            ]
        }
    );
};