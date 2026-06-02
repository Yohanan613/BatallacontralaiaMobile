// config.js — constantes del juego móvil

const CFG = {
  // Mundo en coordenadas de juego
  WX_MIN: 0,
  WX_MAX: 22,
  WY_MIN: -9,
  WY_MAX: 9,

  // Velocidad del misil (unidades/seg)
  ROCKET_SPEED: 7,

  // Tolerancia de impacto (unidades de mundo)
  HIT_TOL:       0.05,
  NEAR_MISS_TOL: 0.5,   // rango para mostrar el efecto ¡Sssh!

  // Cámara lenta
  SLOW_MO_FACTOR: 0.15,
  SLOW_MO_DIST:   55,   // px
  ZOOM_MAX:       3.8,
  ZOOM_HOLD_MS:   900,

  // Trail del misil
  TRAIL_MAX: 60,

  LEVELS: [
    {
      id: 1,
      tipo: 'lineal',
      nombre: 'Función Lineal',
      enemigosMin: 3, enemigosMax: 3,
      desc: 'Cambia a y b para que el misil pase exactamente por cada objetivo.',
      tex: 'f(x) = a \\cdot x + b'
    },
    {
      id: 2,
      tipo: 'cuadratica',
      nombre: 'Función Cuadrática',
      enemigosMin: 3, enemigosMax: 3,
      desc: 'Ajusta a, b y c. La parábola puede alcanzar distintas alturas.',
      tex: 'f(x) = a \\cdot x^2 + b \\cdot x + c'
    },
    {
      id: 3,
      tipo: 'exponencial',
      nombre: 'Función Exponencial',
      enemigosMin: 3, enemigosMax: 4,
      desc: 'La base a controla qué tan rápido sube o baja el misil. Ajusta c para moverla.',
      tex: 'f(x) = a^x + c'
    },
    {
      id: 4,
      tipo: 'libre',
      nombre: 'Aplica lo Aprendido',
      enemigosMin: 4, enemigosMax: 4,
      desc: '¡Elige la función que mejor se adapte a cada objetivo!',
      tex: 'f(x) = ?'
    }
  ]
};
