const fs = require("fs");
const path = require("path");

// ==========================================
// ARCHIVO DE DATOS
// ==========================================

const dataPath = path.join(
    __dirname,
    "economy.json"
);


// ==========================================
// CREAR ARCHIVO SI NO EXISTE
// ==========================================

function asegurarArchivo() {

    if (!fs.existsSync(dataPath)) {

        fs.writeFileSync(
            dataPath,
            JSON.stringify({}, null, 4),
            "utf8"
        );
    }
}


// ==========================================
// CARGAR DATOS
// ==========================================

function cargarDatos() {

    asegurarArchivo();

    try {

        const contenido =
            fs.readFileSync(
                dataPath,
                "utf8"
            );

        if (!contenido.trim()) {
            return {};
        }

        const datos =
            JSON.parse(contenido);

        if (
            !datos ||
            typeof datos !== "object" ||
            Array.isArray(datos)
        ) {

            return {};
        }

        return datos;

    } catch (error) {

        console.log(
            "❌ Error leyendo economy.json"
        );

        console.log(error);

        return {};
    }
}


// ==========================================
// GUARDAR DATOS
// ==========================================

function guardarDatos(datos) {

    try {

        fs.writeFileSync(
            dataPath,
            JSON.stringify(
                datos,
                null,
                4
            ),
            "utf8"
        );

    } catch (error) {

        console.log(
            "❌ Error guardando economía"
        );

        console.log(error);
    }
}


// ==========================================
// CREAR USUARIO
// ==========================================

function crearUsuario(userId) {

    const datos =
        cargarDatos();

    if (!datos[userId]) {

        datos[userId] = {

            dinero: 1000,

            banco: 0,

            xp: 0,

            nivel: 1,

            rango: "Duelista Novato",

            descripcion: "",

            genero: "No especificado",

            casado: false,

            pareja: null,

            propuestaMatrimonio: null,

            ultimoDaily: 0,

            ultimoTrabajo: 0,

            ultimoXPChat: 0,

            xpDiarioFecha: "",

            xpDiarioGanada: 0,

            avisoXPDiario: false,

            inventario: [],

            grupos: [],

            desafio: null

        };

        guardarDatos(datos);
    }

    return datos[userId];
}


// ==========================================
// OBTENER USUARIO
// ==========================================

function obtenerUsuario(userId) {

    const datos =
        cargarDatos();

    if (!datos[userId]) {

        return crearUsuario(userId);
    }

    return datos[userId];
}


// ==========================================
// ACTUALIZAR USUARIO
// ==========================================

function actualizarUsuario(
    userId,
    cambios
) {

    const datos =
        cargarDatos();

    if (!datos[userId]) {

        datos[userId] = {

            dinero: 1000,

            banco: 0,

            xp: 0,

            nivel: 1,

            rango: "Duelista Novato",

            descripcion: "",

            genero: "No especificado",

            casado: false,

            pareja: null,

            propuestaMatrimonio: null,

            ultimoDaily: 0,

            ultimoTrabajo: 0,

            ultimoXPChat: 0,

            xpDiarioFecha: "",

            xpDiarioGanada: 0,

            avisoXPDiario: false,

            inventario: [],

            grupos: [],

            desafio: null
        };
    }

    datos[userId] = {
        ...datos[userId],
        ...cambios
    };

    guardarDatos(datos);

    return datos[userId];
}


// ==========================================
// AGREGAR DINERO
// ==========================================

function agregarDinero(
    userId,
    cantidad
) {

    const usuario =
        obtenerUsuario(userId);

    const dineroActual =
        Number(usuario.dinero) || 0;

    const cantidadAgregar =
        Number(cantidad) || 0;

    return actualizarUsuario(
        userId,
        {
            dinero:
                dineroActual +
                cantidadAgregar
        }
    );
}


// ==========================================
// QUITAR DINERO
// ==========================================

function quitarDinero(
    userId,
    cantidad
) {

    const usuario =
        obtenerUsuario(userId);

    const dineroActual =
        Number(usuario.dinero) || 0;

    const cantidadQuitar =
        Number(cantidad) || 0;

    if (
        cantidadQuitar <= 0
    ) {

        return {
            success: false,
            usuario
        };
    }

    if (
        dineroActual <
        cantidadQuitar
    ) {

        return {
            success: false,
            usuario
        };
    }

    const actualizado =
        actualizarUsuario(
            userId,
            {
                dinero:
                    dineroActual -
                    cantidadQuitar
            }
        );

    return {
        success: true,
        usuario: actualizado
    };
}


// ==========================================
// TRANSFERIR DINERO
// ==========================================

function transferirDinero(
    desde,
    hacia,
    cantidad
) {

    const emisor =
        obtenerUsuario(desde);

    const receptor =
        obtenerUsuario(hacia);

    const cantidadTransferir =
        Number(cantidad);


    if (
        !Number.isFinite(
            cantidadTransferir
        )
    ) {

        return {
            success: false,
            motivo: "cantidad_invalida"
        };
    }


    if (
        cantidadTransferir <= 0
    ) {

        return {
            success: false,
            motivo: "cantidad_invalida"
        };
    }


    if (
        Number(emisor.dinero || 0) <
        cantidadTransferir
    ) {

        return {
            success: false,
            motivo: "dinero_insuficiente"
        };
    }


    actualizarUsuario(
        desde,
        {
            dinero:
                Number(emisor.dinero || 0) -
                cantidadTransferir
        }
    );


    actualizarUsuario(
        hacia,
        {
            dinero:
                Number(receptor.dinero || 0) +
                cantidadTransferir
        }
    );


    return {
        success: true,

        emisor:
            obtenerUsuario(desde),

        receptor:
            obtenerUsuario(hacia)
    };
}


// ==========================================
// AGREGAR XP
// ==========================================

function agregarXP(
    userId,
    cantidad
) {

    const usuario =
        obtenerUsuario(userId);

    let xp =
        Number(usuario.xp) || 0;

    let nivel =
        Number(usuario.nivel) || 1;

    const xpGanada =
        Math.max(
            0,
            Number(cantidad) || 0
        );


    xp += xpGanada;


    // ======================================
    // SUBIDA DE NIVEL
    // ======================================

    let subioNivel = false;

    let nivelesSubidos = 0;


    while (
        xp >=
        nivel * 100
    ) {

        xp -=
            nivel * 100;

        nivel++;

        subioNivel = true;

        nivelesSubidos++;
    }


    const rango =
        obtenerRango(nivel);


    const actualizado =
        actualizarUsuario(
            userId,
            {
                xp,
                nivel,
                rango
            }
        );


    return {

        usuario: actualizado,

        xpGanada,

        subioNivel,

        nivelesSubidos

    };
}


// ==========================================
// GANAR XP
// ==========================================

function ganarXP(
    userId,
    cantidad
) {

    const usuario =
        obtenerUsuario(userId);

    let xp =
        Number(usuario.xp) || 0;

    let nivel =
        Number(usuario.nivel) || 1;


    const xpGanada =
        Math.max(
            0,
            Number(cantidad) || 0
        );


    xp += xpGanada;


    let subioNivel = false;

    let nivelesSubidos = 0;


    while (
        xp >=
        nivel * 100
    ) {

        xp -=
            nivel * 100;

        nivel++;

        subioNivel = true;

        nivelesSubidos++;
    }


    const rango =
        obtenerRango(nivel);


    const actualizado =
        actualizarUsuario(
            userId,
            {
                xp,
                nivel,
                rango
            }
        );


    return {

        usuario: actualizado,

        xpGanada,

        subioNivel,

        nivelesSubidos

    };
}

// ==========================================
// XP POR ACTIVIDAD CON LÍMITE DIARIO
// ==========================================

function otorgarXPChat(userId, cantidad, limite = 200) {

    const usuario = obtenerUsuario(userId);
    const fecha = new Date().toISOString().slice(0, 10);
    let ganadaHoy = Number(usuario.xpDiarioGanada || 0);
    let avisoEnviado = Boolean(usuario.avisoXPDiario);

    if (usuario.xpDiarioFecha !== fecha) {
        ganadaHoy = 0;
        avisoEnviado = false;
    }

    const disponible = Math.max(0, limite - ganadaHoy);
    const otorgada = Math.min(Math.max(0, Number(cantidad) || 0), disponible);

    if (otorgada > 0) {
        agregarXP(userId, otorgada);
        ganadaHoy += otorgada;
    }

    const alcanzoLimite = ganadaHoy >= limite;
    const debeAvisar = alcanzoLimite && !avisoEnviado;

    actualizarUsuario(userId, {
        xpDiarioFecha: fecha,
        xpDiarioGanada: ganadaHoy,
        avisoXPDiario: avisoEnviado || debeAvisar
    });

    return { otorgada, alcanzoLimite, debeAvisar, limite, ganadaHoy };
}


// ==========================================
// RANGOS
// ==========================================

function obtenerRango(nivel) {

    nivel =
        Number(nivel) || 1;


    if (nivel >= 100) {

        return "Leyenda Suprema";
    }


    if (nivel >= 85) {

        return "Emperador de los Duelos";
    }


    if (nivel >= 70) {

        return "Campeón Mundial";
    }


    if (nivel >= 60) {

        return "Gran Maestro de Duelos";
    }


    if (nivel >= 50) {

        return "Rey de los Duelos";
    }


    if (nivel >= 40) {

        return "Maestro de Duelos";
    }


    if (nivel >= 35) {

        return "Duelista Legendario";
    }


    if (nivel >= 30) {

        return "Duelista Élite";
    }


    if (nivel >= 25) {

        return "Duelista Maestro";
    }


    if (nivel >= 20) {

        return "Duelista Experto";
    }


    if (nivel >= 15) {

        return "Duelista Avanzado";
    }


    if (nivel >= 10) {

        return "Duelista Veterano";
    }


    if (nivel >= 5) {

        return "Duelista Intermedio";
    }


    return "Duelista Novato";
}


// ==========================================
// TOP GLOBAL
// ==========================================

function obtenerTopGlobal() {

    const datos =
        cargarDatos();


    /*
     * Object.entries() devuelve:
     *
     * [
     *   [userId, usuario]
     * ]
     *
     * El TOP necesita un objeto que contenga
     * también el ID del usuario.
     *
     * Por eso convertimos cada entrada a:
     *
     * {
     *     id: userId,
     *     ...usuario
     * }
     */


    const lista =
        Object.entries(datos)
            .map(
                ([userId, usuario]) => {

                    // ------------------------------
                    // PROTECCIÓN CONTRA DATOS INVÁLIDOS
                    // ------------------------------

                    if (
                        !usuario ||
                        typeof usuario !== "object"
                    ) {

                        return null;
                    }


                    return {

                        id: userId,

                        ...usuario

                    };
                }
            )
            .filter(
                usuario =>
                    usuario !== null
            );


    // ==========================================
    // ORDENAR POR DINERO
    // ==========================================

    lista.sort(
        (a, b) => {

            const dineroA =
                Number(
                    a.dinero || 0
                );

            const dineroB =
                Number(
                    b.dinero || 0
                );


            return dineroB - dineroA;
        }
    );


    // ==========================================
    // DEVOLVER TOP
    // ==========================================

    return lista;
}

function registrarActividadGrupo(userId, grupo) {
    if (!String(grupo || "").endsWith("@g.us")) return;
    const usuario = obtenerUsuario(userId);
    const grupos = Array.isArray(usuario.grupos) ? usuario.grupos : [];
    if (!grupos.includes(grupo)) actualizarUsuario(userId, { grupos: [...grupos, grupo] });
}

function obtenerTopGrupo(grupo) {
    return obtenerTopGlobal().filter(usuario =>
        Array.isArray(usuario.grupos) && usuario.grupos.includes(grupo)
    );
}


// ==========================================
// EXPORTAR
// ==========================================

module.exports = {

    crearUsuario,

    obtenerUsuario,

    actualizarUsuario,

    agregarDinero,

    quitarDinero,

    transferirDinero,

    agregarXP,

    ganarXP,

    otorgarXPChat,

    obtenerRango,

    obtenerTopGlobal,

    registrarActividadGrupo,

    obtenerTopGrupo

};
