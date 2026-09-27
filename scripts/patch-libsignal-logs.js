const fs = require("fs");
const path = require("path");

// libsignal ya propaga el error a Baileys, que conserva el mensaje como
// cifrado y permite que el siguiente paquete prekey reconstruya la sesión.
// Estas trazas duplicadas exponen detalles internos y llenan la consola.
const raizLibsignal = path.join(__dirname, "..", "node_modules", "libsignal", "src");
const ajustes = [
    {
        archivo: "session_cipher.js",
        bloque: `        console.error("Failed to decrypt message with any known session...");
        for (const e of errs) {
            console.error("Session error:" + e, e.stack);
        }
`
    },
    {
        archivo: "session_cipher.js",
        bloque: '                console.warn("Decrypted message with closed session.");\n'
    },
    {
        archivo: "session_builder.js",
        bloque: "            console.warn(\"Closing open session in favor of incoming prekey bundle\");\n"
    },
    {
        archivo: "session_record.js",
        bloque: "        console.info(\"Closing session:\", session);\n"
    },
    {
        archivo: "session_record.js",
        bloque: "                console.info(\"Removing old closed session:\", oldestSession);\n"
    }
];

if (!fs.existsSync(raizLibsignal)) {
    console.warn("⚠️ libsignal no está instalado; se omitió el ajuste de registros.");
    process.exit(0);
}

let cambios = 0;
for (const ajuste of ajustes) {
    const archivo = path.join(raizLibsignal, ajuste.archivo);
    const contenido = fs.readFileSync(archivo, "utf8");
    if (!contenido.includes(ajuste.bloque)) continue;
    fs.writeFileSync(archivo, contenido.replace(ajuste.bloque, ""), "utf8");
    cambios += 1;
}

console.log(cambios ? "✓ Registros repetitivos de sesiones silenciados." : "✓ Registros de sesiones de libsignal ya ajustados.");
