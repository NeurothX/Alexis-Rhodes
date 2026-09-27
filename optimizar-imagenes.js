const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const carpeta = path.join(__dirname, "assets");

const imagenes = [
    "alexis.jpg",
    "menu.jpg",
    "welcome.jpg",
    "goodbye.jpg"
];

async function optimizar() {
    for (const nombre of imagenes) {
        const entrada = path.join(carpeta, nombre);

        if (!fs.existsSync(entrada)) {
            console.log(`❌ No existe: ${nombre}`);
            continue;
        }

        const temporal = path.join(carpeta, "temp-" + nombre);

        const antes = fs.statSync(entrada).size;

        await sharp(entrada)
            .resize({
                width: 1280,
                height: 1280,
                fit: "inside",
                withoutEnlargement: true
            })
            .jpeg({
                quality: 80,
                mozjpeg: true
            })
            .toFile(temporal);

        fs.renameSync(temporal, entrada);

        const despues = fs.statSync(entrada).size;

        console.log(
            `✅ ${nombre}: ` +
            `${(antes / 1024 / 1024).toFixed(2)} MB → ` +
            `${(despues / 1024 / 1024).toFixed(2)} MB`
        );
    }

    console.log("\n🎉 Imágenes optimizadas.");
}

optimizar().catch(console.error);