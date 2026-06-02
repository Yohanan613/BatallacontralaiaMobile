// cohete.js — física del misil y detección de impacto

function launchRocket() {
  if (ST.phase !== 'playing' || !ST.currentFn) return;

  ST.phase = 'launching';
  ST.nearMissThisLaunch = false;
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

  // Mantener el pivote siguiendo al cohete en cualquier fase activa
  if (ST.cam.phase !== 'idle') {
    ST.cam.pivotX = r.px;
    ST.cam.pivotY = r.py;
  }

  checkSlowMo(now);
  if (checkImpact(now)) return;

  // fuera de rango — derecha por coordenada de mundo, arriba/abajo por píxeles
  const margin = 90;
  if (r.t > CFG.WX_MAX + 4 || r.py < -margin || r.py > canvas.height + margin) {
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

      const miss = Math.abs(fy - e.wy);

      if (miss <= CFG.HIT_TOL) {
        // ¡Impacto! — explosión en la posición exacta del cruce
        const hitPos = w2s(e.wx, fy);
        e.alive = false;
        ST.explosions.push({ x: hitPos.x, y: hitPos.y, t: now, scale: 1.2 });
        playSound('exp_' + e.type);

        ST.cam.phase      = 'holding';
        ST.cam.targetZoom = CFG.ZOOM_MAX;
        ST.cam.pivotX     = hitPos.x;
        ST.cam.pivotY     = hitPos.y;
        ST.cam.holdUntil  = now + CFG.ZOOM_HOLD_MS;
        ST.cam.slowMo     = 1;

        ST.rocket = null;

        updateHudAlive();
        recalcTraj();

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

      } else if (miss <= CFG.NEAR_MISS_TOL) {
        // Near miss — efecto sssh
        const missPos = w2s(e.wx, fy);
        ST.nearMisses.push({ x: missPos.x, y: missPos.y, t: now });
        ST.nearMissThisLaunch = true;
        // Restaurar velocidad del misil pero mantener zoom un momento antes de salir
        ST.cam.slowMo     = 1;
        ST.cam.phase      = 'holding';
        ST.cam.holdUntil  = now + 520;
        ST.cam.targetZoom = CFG.ZOOM_MAX;
        showToast(`¡Sssh! Te pasaste ${miss.toFixed(2)} m del objetivo ${e.code}`, 2500);
      } else if (ST.cam.phase === 'zooming') {
        // Pasó cerca para activar slow-mo pero no lo suficiente para near-miss — salir
        ST.cam.slowMo     = 1;
        ST.cam.phase      = 'out';
        ST.cam.targetZoom = 1;
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
    ? `Cerca de ${bestCode}: ${best.toFixed(2)} m de distancia`
    : 'Misil fuera de rango';

  setTimeout(() => {
    if (!ST.nearMissThisLaunch) showToast(msg, 2800);
    ST.phase = 'playing';
    document.getElementById('btn-launch').disabled = false;
  }, 300);
}
