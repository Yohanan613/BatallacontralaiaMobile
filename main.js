// main.js — inicialización y bucle principal

// ── Carga de assets ───────────────────────────────────────────
async function loadImages() {
  const defs = {
    avion:     'assets/avion.png',
    barco:     'assets/barco.png',
    submarino: 'assets/submarino.png',
    cohete:    'assets/cohete.png',
    explosion: 'assets/explosion_spritesheet.png',
    coronaV:   'assets/coronaV.png',
    sssh:      'assets/sssh.png'
  };
  await Promise.all(Object.entries(defs).map(([k, src]) =>
    new Promise(res => {
      const img = new Image();
      img.onload  = () => { IMGS[k] = img; res(); };
      img.onerror = () => res();
      img.src = src;
    })
  ));
}

function initSounds() {
  const defs = {
    missilfly:    'sonidos/missilfly.mp3',
    win:          'sonidos/Win.mp3',
    boton:        'sonidos/boton.mp3',
    ambiente:     'sonidos/ambiente.mp3',
    exp_avion:    'sonidos/explosionaeroplane.mp3',
    exp_barco:    'sonidos/explosionboat.mp3',
    exp_submarino:'sonidos/explosionsubmarine.mp3'
  };
  for (const [k, src] of Object.entries(defs)) {
    const a = new Audio(src);
    a.preload = 'auto';
    SNDS[k] = a;
  }
  if (SNDS.ambiente) { SNDS.ambiente.loop = true; SNDS.ambiente.volume = 0.25; }
}

const SOUND_VOL = { missilfly: 0.06 };  // default 0.7; missilfly muy bajo

function playSound(key) {
  const snd = SNDS[key];
  if (!snd) return;
  const clone = snd.cloneNode(false);
  clone.volume = SOUND_VOL[key] ?? 0.7;
  clone.play().catch(() => {});
}

// ── Bucle de animación ────────────────────────────────────────
let _lastTime = 0;

function gameLoop(now) {
  const rawDt = Math.min((now - _lastTime) / 1000, 0.05);
  _lastTime   = now;

  updateCamera(rawDt, now);

  if (ST.phase === 'launching') {
    updateRocket(rawDt, now);
  }

  drawFrame(now);
  requestAnimationFrame(gameLoop);
}

// ── Inicialización ────────────────────────────────────────────
async function init() {
  canvas = document.getElementById('game-canvas');
  ctx    = canvas.getContext('2d');

  updateLayout();
  window.addEventListener('resize', () => { updateLayout(); recalcTraj(); });
  window.addEventListener('orientationchange', () => {
    setTimeout(() => { updateLayout(); recalcTraj(); }, 300);
  });

  initSounds();
  await loadImages();
  initUI();
  // startLevel se llama desde btn-game-start tras la intro
  // Preparamos el estado base sin mostrar intro de nivel todavía
  startLevel(1);
  // Ocultar intro de nivel: el game-intro-overlay ya está visible
  document.getElementById('intro-overlay').classList.add('hidden');

  // Música de fondo al primer toque (reintenta hasta que el navegador la permita)
  function startMusic() {
    if (!SNDS.ambiente || !SNDS.ambiente.paused) return;
    SNDS.ambiente.play().then(() => {
      document.removeEventListener('touchstart', startMusic);
      document.removeEventListener('click',      startMusic);
    }).catch(() => {});
  }
  document.addEventListener('touchstart', startMusic);
  document.addEventListener('click',      startMusic);

  requestAnimationFrame(t => { _lastTime = t; requestAnimationFrame(gameLoop); });
}

document.addEventListener('DOMContentLoaded', init);
