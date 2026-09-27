# Sistema de juegos web

Este módulo se ejecuta dentro del proceso de Alexis, pero está separado del bot de WhatsApp. El bot solo crea accesos temporales; el navegador usa la API local para el catálogo, partidas y actividad.

## Uso local

1. Ejecuta el bot normalmente con `npm start`.
2. Para probar desde la misma PC, abre el enlace de `#jugar memoria-academy`.
3. Para un teléfono en la red local, inicia el bot con `GAMES_PUBLIC_URL` configurado a `http://IP-DE-TU-PC:3100`. Para que WhatsApp muestre un enlace público y compartible, usa una URL completa con `https://` en un dominio público. En producción usa un dominio HTTPS detrás de un proxy inverso.

El puerto se configura con `GAMES_PORT` (3100 por defecto). Las credenciales y datos de partidas se guardan en `games/data/`, excluidos del control de versiones.

## Seguridad y migración

- La identidad de WhatsApp se convierte mediante HMAC en un ID interno: ni el navegador ni la base reciben el número.
- Los enlaces llevan un token aleatorio de 256 bits en el fragmento de URL, que no se envía al servidor en la navegación. La API guarda únicamente su hash, caduca en una hora y verifica propietario en cada operación.
- Cada consulta, guardado, carga y borrado filtra por el ID interno autenticado en el servidor.
- `games/database.js` concentra el repositorio. Para migrar a SQLite/PostgreSQL/S3 se sustituye esa capa, sin tocar comandos, API ni interfaz.

## Juegos legales

El catálogo vive en `games/catalog/*.json`. El único juego incluido es una demostración original de memoria. No se incluyen ROMs, BIOS, emuladores ni obras de terceros. Añade únicamente recursos, runners y créditos que tengas derecho a alojar.

Una ROM en `games/roms/nes/` solo aparece en `#juegos` si tiene a su lado un manifiesto con el mismo nombre y extensión `.nes.json`, por ejemplo `MiJuego.nes.json`. Debe incluir `name`, `credits`, `rightsHolder` y `licenseConfirmed: true`. La ROM `Contra.nes` actual no aparece porque no tiene ese manifiesto: no se debe crear ni confirmar uno sin contar con autorización válida para distribuirla.

## Enlace público automático

Al arrancar, el bot inicia `tools/cloudflared.exe` y crea una dirección HTTPS temporal `trycloudflare.com`. Esa dirección se usa en `#jugar` cuando no se definió `GAMES_PUBLIC_URL`. El túnel no guarda ni borra partidas: los progresos continúan en `games/data/games-db.json`. Para desactivarlo, define `GAMES_AUTO_TUNNEL=false`.
