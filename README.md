# 🌌 Galaxy Strike: Neo Starfighter

[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/es/docs/Web/API/Canvas_API)
[![JavaScript ES6+](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-Modern_Sci--Fi-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/es/docs/Web/CSS)
[![Responsive](https://img.shields.io/badge/Design-Fully_Responsive-00f0ff)](#)
[![Web Audio](https://img.shields.io/badge/Audio-Web_Audio_API-ff0077)](#)

**Galaxy Strike** es un videojuego arcade *top-down space shooter* desarrollado en HTML5 Canvas y JavaScript Vanilla, con estética Sci-Fi, efectos de neón, partículas avanzadas, síntesis de audio procedural, oleadas dinámicas con jefes nodriza y compatibilidad total con dispositivos móviles, tablets y computadoras de escritorio.

---

## 🚀 Características Principales

- 🎮 **Controles Multiplataforma:**
  - **Teclado:** Movimiento fluido con `WASD` o `Flechas`, disparo con `Espacio`/`J`/`Z` y bomba EMP con `B`/`K`/`X`.
  - **Móvil y Tablet:** Control táctil por arrastre (*Touch-to-move*), disparo continuo y botón táctil de Bomba EMP en el HUD.
  - **Ratón:** Modo híbrido y puntero suave.
- ⚡ **Árbol Progresivo de Armamento:** Cañón simple, láser doble, triple dispersión (*Spread*), cañón cuádruple de plasma y micro-misiles teledirigidos.
- 🛡️ **Power-ups Dinámicos:** Escudos de plasma, mejoras de velocidad, imanes de cristales, bombas nucleares EMP y reparaciones de nave.
- 👾 **Enemigos y Jefes:** Cazas de asalto (*Scouts*), cazas furtivos, bombarderos pesados, cazas de choque kamikaze y la colosal **Nave Nodriza Kronos** con múltiples fases de combate.
- 🏆 **Salón de la Fama (Leaderboard):** Sistema de récords locales persistentes en `LocalStorage` con estadísticas de precisión, oleada y combos.
- 🔊 **Motor de Audio Sintetizado:** Efectos de sonido SFX y música sintetizada generados en tiempo real mediante la **Web Audio API** sin requerir archivos pesados externos.
- 📺 **Efectos Visuales:** Sistema de partículas de alta velocidad, vibración de pantalla (*Screen Shake*), ladeo dinámico (*Banking*) y filtro retro CRT opcional.

---

## 🕹️ Controles

| Acción | Teclado | Móvil / Táctil | Ratón |
| :--- | :--- | :--- | :--- |
| **Mover Nave** | `W` `A` `S` `D` o `↑` `←` `↓` `→` | Arrastrar dedo en pantalla | Mover cursor |
| **Disparo Láser** | `Espacio`, `J`, `Z` | Toque automático continuo | Clic Izquierdo |
| **Bomba EMP** | `B`, `K`, `X` | Tocar icono **BOMBA ☢️** en el HUD | Clic Derecho |
| **Pausa / Reanudar** | `ESC` o `P` | Botón **⏸** en el HUD | Botón **⏸** |
| **Silenciar Audio** | `M` | Menú Ajustes ⚙️ | Menú Ajustes ⚙️ |

---

## 📁 Estructura del Proyecto

```
├── index.html              # Estructura principal y modales del juego
├── style.css               # Estilos Sci-Fi, glassmorphism, HUD y responsive
├── js/
│   ├── audio.js            # Sintetizador Web Audio API (SFX y Música)
│   ├── engine.js           # Bucle principal, renderizado y gestión de entradas
│   ├── player.js           # Nave del jugador, armas, física y proyectiles
│   ├── enemies.js          # Tipos de enemigos, IA, patrones y Jefe Kronos
│   ├── waves.js            # Generador y escalado de oleadas
│   ├── powerups.js         # Power-ups y orbes de energía
│   ├── particles.js        # Motor de partículas, explosiones y screen shake
│   ├── stars.js            # Fondo estelar parallax
│   ├── storage.js          # Persistencia de récords y ajustes en LocalStorage
│   └── main.js             # Controlador de interfaz de usuario y eventos
└── imagenes/
    └── astronave.png       # Sprite e icono de la nave espacial
```

---

## 🛠️ Ejecución Local

Para probar o jugar localmente, puedes abrir directamente el archivo `index.html` en cualquier navegador web moderno, o levantar un servidor local ligero:

```bash
# Con Python:
python -m http.server 8080

# Con Node.js (npx):
npx serve .
```

Luego abre tu navegador en `http://localhost:8080`.

---

## 📄 Créditos y Licencia

Desarrollado con pasión para la comunidad de entusiastas de los juegos arcade espaciales.

🔗 **Desarrollado por:** [TeleBitComunicaciones](https://telebitcomunicaciones.info)  
© 2026 Todos los Derechos Reservados.
