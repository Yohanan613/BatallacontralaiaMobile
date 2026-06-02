// cohete.js — física del misil y detección de impacto

function launchRocket() {
  if (ST.phase !== 'playing' || !ST.currentFn) return;

  ST.phase = 'launching';
  document.getElementById('btn-launch').disabled = true;

  const origin = w2s(0, 0);
  ST.rocket = {
    fn:     ST.currentFn,
    t:      CFG.WX_MIN,
    lastT:  CFG.WX_MIN,
    px:     origin.x,
    py:     origin.y,
    lastPx: origin.x,
    lastPy: origin.y,
    trail:  []
  };

  playSound('missilfly');
}

function updateRocket(dt, now) {
  if (!ST.rocket) return;
  const r   = ST.rocket;
  const cam = ST.cam;

  r.lastT  = r.t;
  r.lastPx = r.px;
  r.lastPy = r.py;

  r.t += dt * CFG.ROCKET_SPEED * cam.slowMo;

  let wy;
  try { wy = r.fn(r.t); } catch { wy = NaN; }

  if (!isFinite(wy)) { rocketOOB(); return; }

  const pos = w2s(r.t, wy);
  r.px = pos.x;
  r.py = pos.y;

  r.trail.push({ x: r.px, y: r.py });
  if (r.trail.length > CFG.TRAIL_MAX) r.trail.shift();

  // Si la cámara ya está haciendo zoom, mantener el pivote siguiendo al cohete
  if (ST.cam.phase === 'zooming') {
    ST.cam.pivotX = r.px;
    ST.cam.pivotY = r.py;
  }

  checkSlowMo(now);
  if (checkImpact(now)) return;

  // fuera de pantalla
  const margin = 90;
  if (r.px > canvas.width + margin || r.py < -margin || r.py > canvas.height + margin) {
    rocketOOB();
  }
}

function checkSlowMo(now) {
  if (!ST.rocket || ST.cam.phase === 'holding') return;
  const r = ST.rocket;
  for (const e of ST.enemies) {
    if (!e.alive) continue;
    const ep   = w2s(e.wx, e.wy);
    const dist = Math.hypot(r.px - ep.x, r.py - ep.y);
    if (dist < CFG.SLOW_MO_DIST && ST.cam.phase === 'idle') {
      ST.cam.phase      = 'zooming';
      ST.cam.targetZoom = CFG.ZOOM_MAX;
      ST.cam.pivotX     = r.px;
      ST.cam.pivotY     = r.py;
      ST.cam.slowMo     = CFG.SLOW_MO_FACTOR;
      break;
    }
  }
}

function checkImpact(now) {
  if (!ST.rocket) return false;
  const r = ST.rocket;

  for (let i = 0; i < ST.enemies.length; i++) {
    const e = ST.enemies[i];
    if (!e.alive) continue;

    // el misil cruzó la X del objetivo
    if (r.lastT <= e.wx && r.t >= e.wx) {
      let fy;
      try { fy = r.fn(e.wx); } catch { continue; }
      if (!isFinite(fy)) continue;

      if (Math.abs(fy - e.wy) <= CFG.HIT_TOL) {
        // ¡Impacto! — explosión en la posición exacta del cruce (no en la pos actual del misil)
        const hitPos = w2s(e.wx, fy);
        e.alive = false;
        ST.explosions.push({ x: hitPos.x, y: hitPos.y, t: now, scale: 1.2 });
        playSound('exp_' + e.type);

        ST.cam.phase      = 'holding';
        ST.cam.targetZoom = CFG.ZOOM_MAX;
        ST.cam.pivotX     = r.px;
        ST.cam.pivotY     = r.py;
        ST.cam.holdUntil  = now + CFG.ZOOM_HOLD_MS;
        ST.cam.slowMo     = 1;

        ST.rocket = null;

        updateHudAlive();
        recalcTraj(); // quitar el punto verde del destruido

        setTimeout(() => {
          const alive = ST.enemies.filter(e => e.alive).length;
          if (alive === 0) {
            showWin();
          } else {
            ST.phase = 'playing';
            document.getElementById('btn-launch').disabled = false;
          }
        }, CFG.ZOOM_HOLD_MS + 80);

        return true;
      }
    }
  }
  return false;
}

function rocketOOB() {
  // Calcula cuán cerca estuvo
  let best = Infinity, bestCode = '';
  if (ST.rocket) {
    for (const e of ST.enemies) {
      if (!e.alive) continue;
      try {
        const fy   = ST.rocket.fn(e.wx);
        const dist = Math.abs(fy - e.wy);
        if (dist < best) { best = dist; bestCode = e.code; }
      } catch {}
    }
  }

  ST.rocket      = null;
  ST.cam.slowMo  = 1;
  ST.cam.phase   = 'idle';
  ST.cam.targetZoom = 1;

  const msg = best < 99
    ? `Cerca de ${bestCode}: ${best.toFixed(2)} unidades de distancia`
    : 'Misil fuera de rango';

  setTimeout(() => {
    showToast(msg, 2800);
    ST.phase = 'playing';
    document.getElementById('btn-launch').disabled = false;
  }, 300);
}
