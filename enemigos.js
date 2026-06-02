// enemigos.js — definición y spawn de enemigos

const ETYPES = {
  avion:     { img: 'avion',     code: 'A', yMin:  3.5, yMax:  7.0, drawW: 82 },
  barco:     { img: 'barco',     code: 'B', yMin: 0, yMax:  0, drawW: 88 },
  submarino: { img: 'submarino', code: 'S', yMin: -7.0, yMax: -3.5, drawW: 85 }
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

    // X entera con separación mínima de 2
    let wx, tries = 0;
    do {
      wx = 5 + Math.floor(Math.random() * 14); // enteros 5–18
      tries++;
    } while (tries < 60 && usedX.some(x => Math.abs(x - wx) < 3));
    usedX.push(wx);

    // Y entera dentro del rango del tipo
    const wyMin = Math.ceil(et.yMin);
    const wyMax = Math.floor(et.yMax);
    const wy    = wyMin + Math.floor(Math.random() * (wyMax - wyMin + 1));

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
