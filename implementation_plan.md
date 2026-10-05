# Plan de Implementación: Galaxy Strike (Shooter Espacial Arcade)

Diseño y arquitectura completa para un shooter espacial de vista superior en **HTML5 Canvas**, **JavaScript Moderno (ES6+)** y **CSS3 futurista con efectos de brillo y glassmorphism**, 100% jugable en el navegador sin dependencias externas.

---

## 🚀 1. Visión General del Proyecto

Un videojuego arcade de combate espacial fluido, visualmente impactante y altamente rejugable. Cuenta con gráficos generados por canvas con efectos de resplandor (bloom/glow), partículas dinámicas, fondo estelar en capas con paralaje, sistema de audio sintetizado en tiempo real (Web Audio API) y soporte completo para teclado, ratón y dispositivos táctiles.

---

## 🛠️ 2. Arquitectura Técnica

```
g:/JORGE-2026/PMAS-ANTIGRAVITY/JUEGO-GALAXIA/
│
├── index.html         # Estructura del juego, HUD, overlays y modales
├── style.css          # Estilos Sci-Fi, fuentes, animaciones, filtros CRT y HUD
├── js/
│   ├── main.js        # Inicialización del juego y orquestador principal
│   ├── engine.js      # Game loop a 60/120 FPS con Delta Time, Input Handler
│   ├── audio.js       # Motor de sonido procedural (Web Audio API: SFX + BGM)
│   ├── stars.js       # Campo de estrellas en 3 capas con paralaje y nebulosas
│   ├── particles.js   # Sistema de partículas (explosiones, estelas, destellos)
│   ├── player.js      # Física y controles de la nave, vidas, escudos, armas
│   ├── enemies.js     # Clases de enemigos (Scouts, ZigZags, Cruisers, Bosses)
│   ├── waves.js       # Gestor de oleadas progresivas, asteroides y eventos
│   ├── powerups.js    # Multi-disparo, Escudo, Hiper-velocidad, Nuke, Curación
│   └── storage.js     # Tablero de récords en LocalStorage y estadísticas
```

---

## 🎮 3. Módulos y Características Detalladas

### A. Campo de Estrellas con Paralaje y Entorno Cósmico (`stars.js`)
* **3 Capas de Profundidad**: Estrellas lejanas lentas (polvo cósmico), estrellas medias titilantes y estrellas cercanas de alta velocidad.
* **Nebulosas dinámicas**: Gradientes radiales interactivos con colores púrpuras, azules y cian para dar profundidad visual.
* **Efecto de velocidad ("Warp Speed")**: Las estrellas se estiran en líneas lumínicas al pasar de oleada o activar power-ups de hipervelocidad.

### B. Controles y Movimiento Suave del Jugador (`player.js` & `engine.js`)
* **Física con inercia**: Aceleración y fricción para un desplazamiento suave con ladeo visual (bank roll) de la nave al girar.
* **Modos de Control Dual**:
  * **Teclado**: `W, A, S, D` o Flechas para mover, `Barra Espaciadora` / `J` para disparar.
  * **Ratón / Puntero**: Movimiento directo siguiendo el cursor o arrastre suave con disparo continuo o clic.
  * **Táctil**: Soporte para pantallas táctiles y móviles.
* **Efectos Visuales**: Destellos de boca de cañón (muzzle flashes), estela de propulsores con partículas de fuego iónico y vibración de pantalla (screen shake) al disparar o recibir impactos.

### C. Sistema de Disparos y Power-ups (`powerups.js`)
* **Armamento base y mejoras**:
  1. *Láser Simple*: Disparo recto inicial.
  2. *Doble Láser*: Disparos paralelos gemelos.
  3. *Disparo Triple / Spread*: Cobertura en abanico.
  4. *Plasma Cannon*: Proyectiles pesados con daño de área.
  5. *Misiles Teledirigidos*: Se fijan en los enemigos cercanos.
* **Power-ups coleccionables (cápsulas brillantes)**:
  * 🛡️ **Escudo de Energía**: Absorbe impactos durante un tiempo o hasta agotar energía.
  * ⚡ **Hiper-Velocidad**: Aumenta la velocidad de maniobra y cadencia de fuego.
  * 💥 **Bomba EMP / Nuke**: Elimina todos los proyectiles y enemigos comunes en pantalla.
  * ❤️ **Reparación / Vida Extra**: Recupera integridad del casco o suma una vida.
  * 🧲 **Imán de Cristales**: Atrae puntos y power-ups automáticamente.

### D. Enemigos, Oleadas y Jefes Finales (`enemies.js` & `waves.js`)
* **Variedad de Enemigos**:
  * *Drones Ligeros (Scouts)*: Formaciones rápidas de disparo ligero.
  * *Cazas Furtivos (Interceptors)*: Movimiento errático en zig-zag y ráfagas.
  * *Cruceros Pesados (Cruisers)*: Naves blindadas con patrones de balas tipo "Bullet Hell".
  * *Kamikazes*: Se lanzan en picada hacia la posición del jugador.
  * *Asteroides Espaciales*: Obstáculos destructibles que se dividen en fragmentos.
* **Jefes Épicos (Boss Battles cada 5 oleadas)**:
  * Barra de vida gigante en el HUD.
  * Fases múltiples: escudo de energía, torretas laterales destruibles y ataques especiales con rayos láser gigantes.

### E. HUD, Sistema de Vidas, Récords y Menú de Pausa
* **HUD Sci-Fi**: Vidas en corazones/hologramas, barra de escudo, puntuación con multiplicador de combo (x2, x3, x4), indicador de oleada actual.
* **Menú de Pausa**: `Escape` o `P` para pausar; opciones de volumen, reanudación, reinicio y controles.
* **Tablero de Récords (Leaderboard)**: Top 10 mejores puntuaciones persistentes en `localStorage`, con nombre de piloto, oleada alcanzada y precisión.
* **Efectos Extra**: Filtro opcional estilo Arcade CRT con scanlines sutiles.

### F. Motor de Audio Sintetizado (`audio.js`)
* Totalmente autónomo usando la **Web Audio API** nativa (sin archivos MP3 externos pesados que puedan fallar):
  * Sonido de disparo láser de alta frecuencia.
  * Explosiones con ruido blanco filtrado por graves.
  * Campanilleo sintetizado al recoger Power-ups.
  * Alarma y fanfarria para la llegada de Jefes.
  * Música espacial ambiental sintetizada proceduralmente.

---

## 📋 4. Fases de Desarrollo

| Fase | Tareas Clave | Entregables |
|---|---|---|
| **Fase 1** | Estructura HTML, CSS Sci-Fi, Canvas responsivo, HUD y Menús | Interfaz de juego, pantallas de inicio y pausa |
| **Fase 2** | Motor de render, paralaje de estrellas, sistema de partículas y audio sintetizado | Fondo animado, efectos de chispas y sonido Web Audio |
| **Fase 3** | Nave del jugador, movimiento suave, controles (teclado/ratón), disparos y muzzle flash | Control del jugador totalmente responsivo |
| **Fase 4** | Tipos de enemigos, IA de movimiento, patrones de disparo y oleadas progresivas | Sistema de combate y oleadas funcionales |
| **Fase 5** | Sistema de Power-ups, colisiones, explosiones, combos y Boss Fights | Ciclo de juego completo con jefes |
| **Fase 6** | Tablero de récords, persistencia de datos, pulido visual (glow, scanlines) y pruebas | Juego 100% probado, optimizado y listo para jugar |

---

## 🕹️ 5. Verificación y Validación

1. Probar fluidez a 60+ FPS con cientos de partículas y proyectiles simultáneos.
2. Verificar respuesta precisa de controles en Teclado y Ratón.
3. Comprobar que los sonidos generados con Web Audio API suenen claros y no saturen.
4. Validar el guardado y carga de las puntuaciones en el tablero de récords.
5. Probar la apertura del juego en el navegador con el subagente de navegación para verificar la jugabilidad.
