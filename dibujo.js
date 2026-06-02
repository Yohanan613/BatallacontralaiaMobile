// dibujo.js — renderizado del canvas

// ── Conversión mundo ↔ pantalla ──────────────────────────────
function w2s(wx, wy) {
  return { x: OX + wx * SC, y: OY - wy * SC };
}

function s2w(sx, sy) {
  return { x: (sx - OX) / SC, y: (OY - sy) / SC };
}

// Recalcula SC, OX, OY para que el mundo quepa en el canvas
function updateLayout() {
  const W  = window.innerWidth;
  const hudH = document.getElementById('hud').offsetHeight || 36;
  const panelH = Math.max(165, window.innerHeight * 0.31);
  const H  = Math.max(140, window.innerHeight - hudH - panelH);

  canvas.width  = W;
  canvas.height = H;
  canvas.style.height = H + 'px';

  const scX = (W - 50) / (CFG.WX_MAX - CFG.WX_MIN);
  const scY = (H - 28) / (CFG.WY_MAX - CFG.WY_MIN);
  SC = Math.min(scX, scY);

  OX = 28;
  OY = H / 2;
}

// ── Fondo ────────────────────────────────────────────────────
function drawBackground() {
  const { y: seaY } = w2s(0, 0);
  const H = canvas.height;
  const W = canvas.width;

  // Cielo
  const sky = ctx.createLinearGradient(0, 0, 0, seaY);
  sky.addColorStop(0, '#040c1c');
  sky.addColorStop(1, '#081530');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, seaY);

  // Mar
  const sea = ctx.createLinearGradient(0, seaY, 0, H);
  sea.addColorStop(0, '#06112a');
  sea.addColorStop(1, '#020810');
  ctx.fillStyle = sea;
  ctx.fillRect(0, seaY, W, H - seaY);

  // línea del mar
  ctx.strokeStyle = '#1a4060';
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(0, seaY);
  ctx.lineTo(W, seaY);
  ctx.stroke();
}

// ── Cuadrícula y ejes ─────────────────────────────────────────
function drawGrid() {
  const W = canvas.width;
  const H = canvas.height;

  ctx.strokeStyle = 'rgba(30,65,120,0.3)';
  ctx.lineWidth   = 0.7;
  ctx.setLineDash([3, 7]);

  for (let wx = 0; wx <= CFG.WX_MAX; wx += 2) {
    const { x } = w2s(wx, 0);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let wy = CFG.WY_MIN; wy <= CFG.WY_MAX; wy += 2) {
    const { y } = w2s(0, wy);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.setLineDash([]);

  // Ejes
  ctx.strokeStyle = 'rgba(56,181,255,0.35)';
  ctx.lineWidth   = 1;
  const { y: axY } = w2s(0, 0);
  ctx.beginPath(); ctx.moveTo(0, axY); ctx.lineTo(W, axY); ctx.stroke();
  const { x: axX } = w2s(0, 0);
  ctx.beginPath(); ctx.moveTo(axX, 0); ctx.lineTo(axX, H); ctx.stroke();

  // Etiquetas X
  ctx.fillStyle  = 'rgba(88,120,160,0.7)';
  ctx.font       = `${Math.max(9, SC * 0.65)}px monospace`;
  ctx.textAlign  = 'center';
  for (let wx = 2; wx <= CFG.WX_MAX; wx += 4) {
    const { x, y } = w2s(wx, 0);
    ctx.fillText(wx, x, y + 12);
  }
  // Etiquetas Y
  ctx.textAlign = 'right';
  for (let wy = -8; wy <= 8; wy += 2) {
    if (wy === 0) continue;
    const { x, y } = w2s(0, wy);
    ctx.fillText(wy, x - 3, y + 4);
  }
}

// ── Lanzador ──────────────────────────────────────────────────
function drawLauncher() {
  const { x, y } = w2s(0, 0);
  ctx.save();
  ctx.shadowBlur  = 14;
  ctx.shadowColor = '#38b5ff';
  ctx.fillStyle   = '#38b5ff';
  ctx.beginPath();
  ctx.arc(x, y, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Trayectoria ───────────────────────────────────────────────
function drawTrajectory(now) {
  if (!ST.currentFn || !ST.traj.length) return;

  ctx.save();
  ctx.strokeStyle    = '#38b5ff';
  ctx.globalAlpha    = 0.45;
  ctx.lineWidth      = 1.5;
  ctx.setLineDash([5, 9]);
  ctx.lineDashOffset = -(now / 32) % 14;

  ctx.beginPath();
  let open = false;
  for (const pt of ST.traj) {
    if (!pt) { open = false; continue; }
    if (!open) { ctx.moveTo(pt.x, pt.y); open = true; }
    else ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Puntos de impacto
  ctx.globalAlpha = 0.9;
  for (const idx of ST.trajHits) {
    const e  = ST.enemies[idx];
    const pt = w2s(e.wx, e.wy);
    ctx.shadowBlur  = 10;
    ctx.shadowColor = '#22d364';
    ctx.fillStyle   = '#22d364';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur  = 0;
  }
  ctx.restore();
}

// ── Enemigos ──────────────────────────────────────────────────
function drawEnemies(now) {
  for (const e of ST.enemies) {
    if (!e.alive) continue;

    e.bobOffset = Math.sin(now / 640 + e.bobPhase) * 3;
    const { x, y } = w2s(e.wx, e.wy);
    const drawW = e.et.drawW * (SC / 14);
    const drawH = drawW * 0.55;
    const img   = IMGS[e.et.img];

    if (img) {
      ctx.drawImage(img, x - drawW / 2, y - drawH / 2 + e.bobOffset, drawW, drawH);
    } else {
      ctx.fillStyle = '#ff4757';
      ctx.fillRect(x - 15, y - 8 + e.bobOffset, 30, 16);
    }

    // Código
    ctx.fillStyle  = '#38b5ff';
    ctx.font       = `bold ${Math.max(10, SC * 0.72)}px monospace`;
    ctx.textAlign  = 'center';
    ctx.fillText(e.code, x, y - drawH / 2 + e.bobOffset - 5);

    // Coordenadas
    ctx.fillStyle = 'rgba(140,190,255,0.75)';
    ctx.font      = `${Math.max(9, SC * 0.6)}px monospace`;
    ctx.fillText(`(${e.wx},${e.wy})`, x, y + drawH / 2 + e.bobOffset + 13);

    // Hitbox roja: círculo con radio = tolerancia de impacto
    ctx.beginPath();
    ctx.arc(x, y, CFG.HIT_TOL * SC, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,71,87,0.7)';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Punto amarillo en la posición lógica exacta (sin bob)
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle   = '#FFD700';
    ctx.shadowBlur  = 10;
    ctx.shadowColor = '#FFD700';
    ctx.fill();
    ctx.shadowBlur  = 0;
  }
}

// ── Misil ─────────────────────────────────────────────────────
function drawRocket() {
  if (!ST.rocket) return;
  const r = ST.rocket;

  // Trail
  for (let i = 0; i < r.trail.length; i++) {
    const a    = (i / r.trail.length) * 0.55;
    const sz   = (i / r.trail.length) * 4;
    ctx.globalAlpha = a;
    ctx.fillStyle   = '#38b5ff';
    ctx.fillRect(r.trail[i].x - sz / 2, r.trail[i].y - sz / 2, sz, sz);
  }
  ctx.globalAlpha = 1;

  // Imagen
  const img  = IMGS['cohete'];
  const rW   = 34 * (SC / 14);
  const rH   = rW * 0.42;
  const angle = Math.atan2(r.py - r.lastPy, r.px - r.lastPx);

  ctx.save();
  ctx.translate(r.px, r.py);
  ctx.rotate(angle);
  if (img) {
    ctx.drawImage(img, -rW / 2, -rH / 2, rW, rH);
  } else {
    ctx.fillStyle = '#38b5ff';
    ctx.fillRect(-12, -5, 24, 10);
  }
  ctx.restore();
}

// ── Explosiones ───────────────────────────────────────────────
function drawExplosions(now) {
  const sheet = IMGS['explosion'];
  ST.explosions = ST.explosions.filter(e => now - e.t < 700);
  if (!sheet) return;

  for (const exp of ST.explosions) {
    const elapsed  = now - exp.t;
    const progress = elapsed / 700;
    const fi       = Math.min(15, Math.floor(progress * 16));
    const col = fi % 4;
    const row = Math.floor(fi / 4);
    const fs  = 64;
    const ds  = 58 * exp.scale;
    ctx.drawImage(sheet, col * fs, row * fs, fs, fs, exp.x - ds / 2, exp.y - ds / 2, ds, ds);
  }
}

// ── Cámara ────────────────────────────────────────────────────
function updateCamera(rawDt, now) {
  const cam = ST.cam;
  if (cam.phase === 'holding' && now >= cam.holdUntil) {
    cam.phase      = 'out';
    cam.targetZoom = 1;
  }
  const spd = cam.phase === 'out' ? 2 : 7;
  cam.zoom += (cam.targetZoom - cam.zoom) * spd * rawDt;
  if (cam.phase === 'out' && cam.zoom < 1.02) {
    cam.zoom       = 1;
    cam.targetZoom = 1;
    cam.phase      = 'idle';
    cam.slowMo     = 1;
  }
}

// ── Frame completo ────────────────────────────────────────────
function drawFrame(now) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cam = ST.cam;
  if (cam.zoom > 1.001) {
    ctx.save();
    ctx.translate(cam.pivotX, cam.pivotY);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.pivotX, -cam.pivotY);
  }

  drawBackground();
  drawGrid();
  drawTrajectory(now);
  drawLauncher();
  drawEnemies(now);
  drawRocket();
  drawExplosions(now);

  if (cam.zoom > 1.001) ctx.restore();
}
