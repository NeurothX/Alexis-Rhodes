# Catálogo modular de juegos

Cada archivo `.json` de esta carpeta representa un juego. No se modifica el bot para añadir uno: agrega un manifiesto y los recursos con licencia correspondiente.

Campos obligatorios: `id`, `name`, `platform`, `description`, `credits`, `rightsHolder`, `resource`, `runner`, `enabled`.

`resource` debe identificar un recurso que tengas derecho a distribuir. Para emuladores, registra también `emulator` y crea un runner revisado para esa plataforma. Nunca agregues ROMs, BIOS ni contenido comercial sin autorización verificable.
