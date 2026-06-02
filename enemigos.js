// enemigos.js — definición y spawn de enemigos

const ETYPES = {
  avion:     { img: 'avion',     code: 'A', yMin:  3.5, yMax:  8.0, drawW: 82 },
  barco:     { img: 'barco',     code: 'B', yMin: -1.0, yMax:  1.0, drawW: 88 },
  submarino: { img: 'submarino', code: 'S', yMin: -8.0, yMax: -3.5, drawW: 85 }
};

function spawnEnemies(count) {
  const typeKeys = Object.keys(ETYPES);
  const list     = [...typeKeys]; // uno garantizado por tipo
  while (list.length < count) list.push(typeKeys[Math.floor(Math.random() * typeKeys.length)]);
  // barajar
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }

  const counters = { avion: 0, barco: 0, submarino: 0 };
  const usedX    = [];
  const enemies  = [];

  for (let i = 0; i < count; i++) {
    const type = list[i];
    const et   = ETYPES[type];
    counters[type]++;
    const code = et.code + counters[type];

    // X con separación mínima, redondeado a 0.5
    let wx, tries = 0;
    do {
      wx = Math.round((5 + Math.random() * 13) * 2) / 2; // 5.0 – 18.0
      tries++;
    } while (tries < 60 && usedX.some(x => Math.abs(x - wx) < 2.5));
    usedX.push(wx);

    // Y redondeado a 0.5 para que los cálculos sean exactos
    const wy = Math.round((et.yMin + Math.random() * (et.yMax - et.yMin)) * 2) / 2;

    enemies.push({
      id:        Math.random().toString(36).slice(2),
      type, code, et,
      wx, wy,
      alive:     true,
      bobPhase:  Math.random() * Math.PI * 2,
      bobOffset: 0
    });
  }
  return enemies;
}
