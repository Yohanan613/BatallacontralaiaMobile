// ui.js — interfaz de usuario, eventos, overlays

// ── KaTeX helper ──────────────────────────────────────────────
function renderTex(el, tex) {
  if (!el) return;
  if (window.katex) {
    try { katex.render(tex, el, { throwOnError: false }); return; } catch {}
  }
  el.textContent = tex;
}

// ── Toast ─────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, ms = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add('hidden'), ms);
}

// ── HUD ───────────────────────────────────────────────────────
function updateHudAlive() {
  const alive = ST.enemies.filter(e => e.alive).length;
  document.getElementById('hud-alive').textContent = alive;
}

// ── Trayectoria ───────────────────────────────────────────────
function recalcTraj() {
  if (!ST.currentFn || ST.level === 4) { ST.traj = []; ST.trajHits = []; return; }
  const N = 120, pts = [];
  for (let i = 0; i <= N; i++) {
    const wx = CFG.WX_MIN + (CFG.WX_MAX - CFG.WX_MIN) * i / N;
    try {
      const wy = ST.currentFn(wx);
      if (!isFinite(wy) || wy < CFG.WY_MIN - 4 || wy > CFG.WY_MAX + 4) { pts.push(null); continue; }
      pts.push(w2s(wx, wy));
    } catch { pts.push(null); }
  }
  ST.traj = pts;
  ST.trajHits = [];
  for (let i = 0; i < ST.enemies.length; i++) {
    const e = ST.enemies[i];
    if (!e.alive) continue;
    try {
      const fy = ST.currentFn(e.wx);
      if (isFinite(fy) && Math.abs(fy - e.wy) <= CFG.HIT_TOL) ST.trajHits.push(i);
    } catch {}
  }
}

// ── Coef popup ────────────────────────────────────────────────
const COEF_META = {
  'a-lin': { label: 'A', step: 0.5, signKey: null   },
  'b-lin': { label: 'B', step: 0.5, signKey: 'lin'  },
  'a-cua': { label: 'A', step: 0.5, signKey: null   },
  'b-cua': { label: 'B', step: 0.5, signKey: 'cua1' },
  'c-cua': { label: 'C', step: 0.5, signKey: 'cua2' },
  'a-exp': { label: 'A', step: 0.5, signKey: null   },
  'c-exp': { label: 'C', step: 0.5, signKey: 'exp'  }
};

const SIGN_BTN_MAP = { lin: 'sg-lin', cua1: 'sg1-cua', cua2: 'sg2-cua', exp: 'sg-exp' };

let _popupCoef = null;

function getEffVal(coefId) {
  const meta = COEF_META[coefId];
  const raw  = parseFloat(document.getElementById(coefId).value) || 0;
  if (!meta.signKey) return raw;
  return (ST.signs[meta.signKey] === '-' ? -1 : 1) * Math.abs(raw);
}

function setEffVal(coefId, val) {
  const meta = COEF_META[coefId];
  const inp  = document.getElementById(coefId);
  if (!meta.signKey) {
    inp.value = +val.toFixed(4);
    if (coefId === 'a-lin') syncSignABtn('sga-lin', 'a-lin');
    if (coefId === 'a-cua') syncSignABtn('sga-cua', 'a-cua');
  } else {
    inp.value = +Math.abs(val).toFixed(4);
    ST.signs[meta.signKey] = val < 0 ? '-' : '+';
    const btn = document.getElementById(SIGN_BTN_MAP[meta.signKey]);
    if (btn) btn.textContent = ST.signs[meta.signKey];
  }
  inp.dispatchEvent(new Event('input'));
}

function fmtVal(val) {
  const abs = Math.abs(val);
  const s   = Number.isInteger(abs) ? String(abs) : abs.toFixed(abs < 0.1 ? 3 : 2).replace(/\.?0+$/, '');
  return (val < 0 ? '−' : '') + s;
}

function updateCoefBtn(coefId) {
  const btn = document.getElementById('cbt-' + coefId);
  if (!btn) return;
  const meta = COEF_META[coefId];
  const val  = getEffVal(coefId);
  const sign = (meta.signKey && val >= 0) ? '+ ' : (meta.signKey && val < 0) ? '− ' : '';
  const abs  = Math.abs(val);
  const absS = Number.isInteger(abs) ? String(abs) : abs.toFixed(abs < 0.1 ? 3 : 2).replace(/\.?0+$/, '');
  btn.textContent = `${sign}${meta.label} = ${absS}`;
}

function updateAllCoefBtns() {
  Object.keys(COEF_META).forEach(updateCoefBtn);
}

function openPopup(coefId) {
  _popupCoef = coefId;
  const meta = COEF_META[coefId];
  document.getElementById('popup-lbl').textContent = meta.label;
  document.getElementById('popup-val-input').value = getEffVal(coefId);
  document.getElementById('coef-popup').classList.remove('hidden');
  setTimeout(() => document.getElementById('popup-val-input').select(), 80);
}

function closePopup() {
  document.getElementById('coef-popup').classList.add('hidden');
  _popupCoef = null;
}

// ── Sign-A helpers ────────────────────────────────────────────
function syncSignABtn(btnId, inputId) {
  const v = parseFloat(document.getElementById(inputId).value) || 0;
  document.getElementById(btnId).textContent = v < 0 ? '−' : '+';
}

// ── onStructuredChange ────────────────────────────────────────
function onStructuredChange() {
  ST.currentFn = readStructuredFn();
  renderTex(document.getElementById('formula-preview'), `f(x)=${getStructuredTex()}`);
  updateAllCoefBtns();
  recalcTraj();
}

// ── applyExample ──────────────────────────────────────────────
function applyExample(chip) {
  const type = chip.dataset.type;
  if (type === 'lineal') {
    document.getElementById('a-lin').value = chip.dataset.a;
    syncSignABtn('sga-lin', 'a-lin');
    document.getElementById('b-lin').value = chip.dataset.b;
    ST.signs.lin = chip.dataset.sb;
    document.getElementById('sg-lin').textContent = chip.dataset.sb;
  } else if (type === 'cuadratica') {
    document.getElementById('a-cua').value = chip.dataset.a;
    syncSignABtn('sga-cua', 'a-cua');
    document.getElementById('b-cua').value = chip.dataset.b;
    document.getElementById('c-cua').value = chip.dataset.c;
    ST.signs.cua1 = chip.dataset.sb;
    ST.signs.cua2 = chip.dataset.sc;
    document.getElementById('sg1-cua').textContent = chip.dataset.sb;
    document.getElementById('sg2-cua').textContent = chip.dataset.sc;
  } else if (type === 'exponencial') {
    document.getElementById('a-exp').value = chip.dataset.a;
    document.getElementById('c-exp').value = chip.dataset.c;
    ST.signs.exp = chip.dataset.sc;
    document.getElementById('sg-exp').textContent = chip.dataset.sc;
  }
  onStructuredChange();
  playSound('boton');
}

// ── showEditorFor ─────────────────────────────────────────────
function showEditorFor(type) {
  const map = { lineal: 'ed-lineal', cuadratica: 'ed-cua', exponencial: 'ed-exp' };
  document.querySelectorAll('.ed-block').forEach(el => el.classList.add('hidden'));
  const el = document.getElementById(map[type]);
  if (el) el.classList.remove('hidden');
}

// ── initUI ────────────────────────────────────────────────────
function initUI() {
  // Sign buttons (hidden, state only)
  function setupSign(btnId, stateKey) {
    document.getElementById(btnId).addEventListener('click', () => {
      ST.signs[stateKey] = ST.signs[stateKey] === '+' ? '-' : '+';
      document.getElementById(btnId).textContent = ST.signs[stateKey];
      onStructuredChange();
    });
  }
  setupSign('sg-lin',  'lin');
  setupSign('sg1-cua', 'cua1');
  setupSign('sg2-cua', 'cua2');
  setupSign('sg-exp',  'exp');

  function setupSignA(btnId, inputId) {
    document.getElementById(btnId).addEventListener('click', () => {
      const inp = document.getElementById(inputId);
      inp.value = -(parseFloat(inp.value) || 1);
      syncSignABtn(btnId, inputId);
      onStructuredChange();
    });
    document.getElementById(inputId).addEventListener('input', () => syncSignABtn(btnId, inputId));
  }
  setupSignA('sga-lin', 'a-lin');
  setupSignA('sga-cua', 'a-cua');

  // Hidden inputs → update on change
  ['a-lin','b-lin','a-cua','b-cua','c-cua','a-exp','c-exp'].forEach(id => {
    document.getElementById(id).addEventListener('input', onStructuredChange);
  });

  // Coef buttons → open popup
  document.querySelectorAll('.coef-btn').forEach(btn => {
    btn.addEventListener('click', () => { openPopup(btn.dataset.coef); playSound('boton'); });
  });

  // Popup controls
  document.getElementById('popup-plus').addEventListener('click', () => {
    if (!_popupCoef) return;
    const newVal = getEffVal(_popupCoef) + COEF_META[_popupCoef].step;
    setEffVal(_popupCoef, newVal);
    document.getElementById('popup-val-input').value = getEffVal(_popupCoef);
  });
  document.getElementById('popup-minus').addEventListener('click', () => {
    if (!_popupCoef) return;
    const newVal = getEffVal(_popupCoef) - COEF_META[_popupCoef].step;
    setEffVal(_popupCoef, newVal);
    document.getElementById('popup-val-input').value = getEffVal(_popupCoef);
  });
  document.getElementById('popup-close').addEventListener('click', closePopup);

  document.getElementById('popup-val-input').addEventListener('input', () => {
    if (!_popupCoef) return;
    const v = parseFloat(document.getElementById('popup-val-input').value);
    if (!isFinite(v)) return;
    setEffVal(_popupCoef, v);
  });

  // Custom input
  document.getElementById('custom-input').addEventListener('input', () => {
    const raw = document.getElementById('custom-input').value;
    const fn  = parseFormula(raw);
    const err = document.getElementById('custom-err');
    if (fn) { ST.currentFn = fn; err.classList.add('hidden'); }
    else    { ST.currentFn = null; err.classList.remove('hidden'); }
    const prev = document.getElementById('formula-preview');
    try { renderTex(prev, `f(x)=${raw}`); } catch { if (prev) prev.textContent = raw; }
    recalcTraj();
  });

  // Toggle modo
  document.getElementById('btn-propia').addEventListener('click', () => {
    ST.formulaMode = 'custom';
    closePopup();
    document.getElementById('struct-editors').classList.add('hidden');
    document.getElementById('custom-editor').classList.remove('hidden');
    document.getElementById('btn-propia').classList.add('hidden');
    document.getElementById('btn-struct').classList.remove('hidden');
    document.getElementById('formula-preview').textContent = '';
    ST.currentFn = null; ST.traj = []; ST.trajHits = [];
    playSound('boton');
    setTimeout(() => document.getElementById('custom-input').focus(), 50);
  });

  document.getElementById('btn-struct').addEventListener('click', () => {
    ST.formulaMode = 'structured';
    document.getElementById('custom-editor').classList.add('hidden');
    document.getElementById('struct-editors').classList.remove('hidden');
    document.getElementById('btn-struct').classList.add('hidden');
    document.getElementById('btn-propia').classList.remove('hidden');
    onStructuredChange();
    playSound('boton');
  });

  // Lanzar
  document.getElementById('btn-launch').addEventListener('click', () => {
    if (ST.phase === 'playing' && ST.currentFn) {
      closePopup();
      launchRocket();
      playSound('boton');
    }
  });

  // Game intro → level intro
  document.getElementById('btn-game-start').addEventListener('click', () => {
    document.getElementById('game-intro-overlay').classList.add('hidden');
    showLevelIntro(CFG.LEVELS[0]);
    playSound('boton');
  });

  // Comenzar nivel
  document.getElementById('btn-begin').addEventListener('click', () => {
    document.getElementById('intro-overlay').classList.add('hidden');
    ST.phase = 'playing';
    playSound('boton');
  });

  // Victoria
  document.getElementById('btn-reforzar').addEventListener('click', () => {
    document.getElementById('win-overlay').classList.add('hidden');
    startLevel(ST.level);
    playSound('boton');
  });
  document.getElementById('btn-siguiente').addEventListener('click', () => {
    document.getElementById('win-overlay').classList.add('hidden');
    const next = ST.level + 1;
    startLevel(next > CFG.LEVELS.length ? 1 : next);
    playSound('boton');
  });

  // Tabs nivel 4
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ST.activeType = btn.dataset.type;
      showEditorFor(ST.activeType);
      onStructuredChange();
      playSound('boton');
    });
  });

  // Chips de ejemplo
  document.querySelectorAll('.ex-chip').forEach(chip => {
    chip.addEventListener('click', () => applyExample(chip));
  });

  // Reinicio
  document.getElementById('btn-restart').addEventListener('click', () => {
    document.getElementById('confirm-overlay').classList.remove('hidden');
    playSound('boton');
  });
  document.getElementById('btn-confirm-no').addEventListener('click', () => {
    document.getElementById('confirm-overlay').classList.add('hidden');
    playSound('boton');
  });
  document.getElementById('btn-confirm-yes').addEventListener('click', () => {
    document.getElementById('confirm-overlay').classList.add('hidden');
    startLevel(1);
    playSound('boton');
  });

  // Canvas touch
  canvas.addEventListener('touchstart', onCanvasTouch, { passive: true });
  canvas.addEventListener('click', onCanvasTouch);
}

function onCanvasTouch(e) {
  if (ST.phase !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  const sx = (cx - rect.left) * (canvas.width  / rect.width);
  const sy = (cy - rect.top)  * (canvas.height / rect.height);
  const { x: wx, y: wy } = s2w(sx, sy);
  let best = null, bestDist = Infinity;
  for (const enemy of ST.enemies) {
    if (!enemy.alive) continue;
    const d = Math.hypot(enemy.wx - wx, enemy.wy - wy);
    if (d < 2 && d < bestDist) { best = enemy; bestDist = d; }
  }
  if (best) showToast(`${best.code} → (${best.wx}, ${best.wy})`, 2200);
}

// ── Level intro ───────────────────────────────────────────────
function showLevelIntro(lvl) {
  document.getElementById('intro-num').textContent   = lvl.id;
  document.getElementById('intro-title').textContent = lvl.nombre;
  document.getElementById('intro-desc').textContent  = lvl.desc;
  renderTex(document.getElementById('intro-formula'), lvl.tex);
  document.getElementById('intro-overlay').classList.remove('hidden');
  document.getElementById('win-overlay').classList.add('hidden');
  if (lvl.id === 4) {
    setTimeout(() => showToast('🎯 La ruta está oculta — ¡Buena suerte!', 3500), 400);
  }
}

// ── Win overlay ───────────────────────────────────────────────
function showWin() {
  const lvl    = CFG.LEVELS[ST.level - 1];
  const isLast = ST.level === CFG.LEVELS.length;
  const card   = document.querySelector('.win-card');
  const title  = document.getElementById('win-title');
  const sub    = document.getElementById('win-sub');
  const btnNxt = document.getElementById('btn-siguiente');
  if (isLast) {
    title.textContent  = '¡Completaste el Juego!';
    sub.textContent    = '¡Dominaste las tres funciones matemáticas!';
    btnNxt.textContent = '¡Jugar de Nuevo!';
    card.classList.add('final');
  } else {
    title.textContent  = `¡Venciste el Nivel ${ST.level}!`;
    sub.textContent    = `Dominas la ${lvl.nombre.toLowerCase()}`;
    btnNxt.textContent = 'Siguiente Nivel ›';
    card.classList.remove('final');
  }
  document.getElementById('win-overlay').classList.remove('hidden');
  ST.phase = 'won';
  playSound('win');
}

// ── startLevel ────────────────────────────────────────────────
function startLevel(id) {
  const lvl = CFG.LEVELS[id - 1];
  ST.level  = id;
  ST.phase  = 'intro';
  ST.rocket = null;
  ST.explosions = []; ST.traj = []; ST.trajHits = [];
  ST.currentFn  = null;
  ST.nearMisses = []; ST.nearMissThisLaunch = false;
  ST.cam = { zoom: 1, targetZoom: 1, pivotX: 0, pivotY: 0, slowMo: 1, phase: 'idle', holdUntil: 0 };

  closePopup();

  ST.formulaMode = 'structured';
  document.getElementById('struct-editors').classList.remove('hidden');
  document.getElementById('custom-editor').classList.add('hidden');
  document.getElementById('btn-propia').classList.remove('hidden');
  document.getElementById('btn-struct').classList.add('hidden');

  ST.activeType = lvl.tipo === 'libre' ? 'lineal' : lvl.tipo;

  document.getElementById('hud-level-badge').textContent = `Nivel ${id}`;
  document.getElementById('hud-level-name').textContent  = lvl.nombre;

  const tabs = document.getElementById('type-tabs');
  if (lvl.tipo === 'libre') {
    tabs.classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.type === 'lineal');
    });
  } else {
    tabs.classList.add('hidden');
  }

  showEditorFor(ST.activeType);

  // Resetear signos y valores
  ST.signs = { lin: '+', cua1: '+', cua2: '+', exp: '+' };
  ['sg-lin','sg1-cua','sg2-cua','sg-exp'].forEach(sid => {
    const el = document.getElementById(sid);
    if (el) el.textContent = '+';
  });
  document.getElementById('a-lin').value = 1;
  document.getElementById('b-lin').value = 0;
  document.getElementById('a-cua').value = 1;
  document.getElementById('b-cua').value = 0;
  document.getElementById('c-cua').value = 0;
  document.getElementById('a-exp').value = 2;
  document.getElementById('c-exp').value = 0;
  syncSignABtn('sga-lin', 'a-lin');
  syncSignABtn('sga-cua', 'a-cua');

  const enemyCount = lvl.enemigosMin + Math.floor(Math.random() * (lvl.enemigosMax - lvl.enemigosMin + 1));
  ST.enemies = spawnEnemies(enemyCount);
  updateHudAlive();

  document.getElementById('btn-launch').disabled = false;
  onStructuredChange();
  showLevelIntro(lvl);
}
