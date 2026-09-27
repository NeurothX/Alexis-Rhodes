# ❄️ Alexis Rhodes · Duel Academy Bot

> Un bot de WhatsApp inspirado en Duel Academy, con economía, minijuegos, anime, perfil, rangos y un arcade web privado.

**Creador:** [NeurothX](https://github.com/NeurothX/Alexis-Rhodes) · **Repositorio:** [Alexis-Rhodes](https://github.com/NeurothX/Alexis-Rhodes)

## ✨ Incluye

- 🎴 Menú temático de Alexis Rhodes / Obelisk Blue.
- 💰 Economía, XP, niveles, tienda, inventario y rankings.
- 🧩 Trivia, retos, adivinanzas, dados, moneda y piedra-papel-tijera.
- 🍥 Recomendaciones de anime y comandos sociales.
- 🏆 Logros, récords, misiones y progreso por juego.
- 🕹️ Arcade web con búsqueda, filtros, partidas privadas y guardados por usuario.
- 🛡️ Herramientas de grupo: reglas, anti-enlaces, anti-spam, AFK y recordatorios.

## 🚀 Instalación

Necesitas [Node.js](https://nodejs.org/) 18 o superior.

```powershell
git clone https://github.com/NeurothX/Alexis-Rhodes.git
cd Alexis-Rhodes
npm install
Copy-Item config.example.js config.js
npm start
```

Al iniciarlo, escribe `Alexis` en la terminal. Si es la primera vez, WhatsApp mostrará un código de vinculación.

## 📱 Usar otro número como bot

Abre `config.js` y cambia **solamente** esta línea por el número que usarás como bot, sin `+`, espacios ni guiones:

```js
botNumber: "50500000000",
```

El owner y los créditos de **NeurothX** se conservan tal como están. Las sesiones de WhatsApp se guardan sólo en tu PC y no se suben al repositorio.

## 🎮 Arcade web

```text
#juegos
#jugar ID
#continuar ID
#logros juego ID
#sesion
```

La web entrega enlaces temporales, mantiene las partidas privadas y muestra los logros de cada juego. Consulta [games/README.md](games/README.md) para los detalles técnicos y el uso responsable de recursos.

## 🔐 Seguridad

El repositorio no incluye sesiones de WhatsApp, configuración personal, partidas, ROMs, BIOS, emuladores instalados, copias de seguridad ni cachés regenerables. No publiques esos archivos ni compartas tu carpeta `session/`.

## 🧭 Comandos útiles

| Comando | Acción |
| --- | --- |
| `#menu` | Abre el menú principal. |
| `#perfil` | Muestra XP, nivel, dinero y logros. |
| `#anime random 2` | Recomienda dos animes. |
| `#juegos` | Muestra el catálogo web. |
| `#buscarjuego nombre` | Busca por nombre o ID. |
| `#owner` | Muestra al creador y este repositorio. |

---

❄️ **Alexis Rhodes Bot** · _Juega con elegancia, gana con determinación._
