// ==========================================
// MEMORIA DE MENSAJES
// ==========================================

const mensajesGuardados = new Map();


// ==========================================
// CREAR CLAVE DEL MENSAJE
// ==========================================

function claveMensaje(key) {

    if (!key?.remoteJid || !key?.id) {
        return null;
    }

    return (
        key.remoteJid +
        ":" +
        key.id
    );
}


// ==========================================
// GUARDAR MENSAJE
// ==========================================

function guardarMensaje(msg) {

    if (!msg?.key || !msg?.message) {
        return;
    }

    const clave =
        claveMensaje(msg.key);

    if (!clave) {
        return;
    }

    mensajesGuardados.set(
        clave,
        msg.message
    );


    // ==========================================
    // LIMITE DE MEMORIA
    // ==========================================

    // Conservamos como máximo 500 mensajes.

    if (mensajesGuardados.size > 500) {

        const primeraClave =
            mensajesGuardados
                .keys()
                .next()
                .value;

        mensajesGuardados.delete(
            primeraClave
        );
    }
}


// ==========================================
// OBTENER MENSAJE
// ==========================================

function obtenerMensaje(key) {

    const clave =
        claveMensaje(key);

    if (!clave) {
        return undefined;
    }

    return mensajesGuardados.get(
        clave
    );
}


// ==========================================
// EXPORTAR
// ==========================================

module.exports = {

    guardarMensaje,

    obtenerMensaje,

    claveMensaje

};