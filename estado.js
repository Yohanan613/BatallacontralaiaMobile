// estado.js — estado global del juego móvil

// Canvas y contexto (asignados en main.js)
let canvas, ctx;

// Escala pixels/unidad-mundo y origen en pixels
let SC = 1;
let OX = 0, OY = 0;

// Estado del juego
const ST = {
  level:       1,
  phase:       'intro',   // 'intro' | 'playing' | 'launching' | 'won'
  enemies:     [],
  rocket:      null,
  explosions:  [],
  traj:        [],        // puntos de trayectoria [{x,y}|null]
  trajHits:    [],        // índices de enemigos que la trayectoria golpea
  nearMisses:  [],        // efectos sssh activos [{x,y,t}]
  nearMissThisLaunch: false,

  formulaMode: 'structured',   // 'structured' | 'custom'
  activeType:  'lineal',       // 'lineal' | 'cuadratica' | 'exponencial'
  currentFn:   null,           // Function(x) actual

  signs: { lin: '+', cua1: '+', cua2: '+', exp: '+' },

  cam: {
    zoom:      1,
    targetZoom: 1,
    pivotX:    0,
    pivotY:    0,
    slowMo:    1,
    phase:     'idle',    // 'idle' | 'zooming' | 'holding' | 'out'
    holdUntil: 0
  }
};

// Imágenes cargadas
const IMGS = {};

// Sonidos
const SNDS = {};
