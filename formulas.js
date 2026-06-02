// formulas.js — parseo seguro de funciones matemáticas

function parseFormula(raw) {
  if (!raw || !raw.includes('x')) return null;
  let s = raw.trim().toLowerCase();
  s = s.replace(/,/g, '.').replace(/\^/g, '**');
  s = s.replace(/\bpi\b/g, 'Math.PI');
  s = s.replace(/\be\b/g, 'Math.E');
  s = s.replace(/\bsin\b/g, 'Math.sin');
  s = s.replace(/\bcos\b/g, 'Math.cos');
  s = s.replace(/\btan\b/g, 'Math.tan');
  s = s.replace(/\bsqrt\b/g, 'Math.sqrt');
  s = s.replace(/\blog\b/g, 'Math.log');
  s = s.replace(/\babs\b/g, 'Math.abs');
  // multiplicación implícita
  s = s.replace(/(\d)(x)/g, '$1*$2');
  s = s.replace(/(x)(\d)/g, '$1*$2');
  s = s.replace(/(\d)\(/g, '$1*(');
  s = s.replace(/\)(\d)/g, ')*$1');
  s = s.replace(/\)(x)/g, ')*$1');
  s = s.replace(/(x)\(/g, '$1*(');
  // bloquear globales peligrosas
  const blocked = ['window','document','eval','fetch','setTimeout','localStorage','alert','import','require'];
  for (const b of blocked) if (s.includes(b)) return null;
  try {
    const fn = new Function('x', `"use strict"; const y=(${s}); return Number.isFinite(y)?y:NaN;`);
    const ok = [0,1,2,5].every(v => { const r=fn(v); return r===r; }); // NaN check
    return ok ? fn : null;
  } catch { return null; }
}

// Funciones estructuradas: construyen fn directamente sin parseo

function buildLinFn(a, b, sign) {
  const bv = sign === '-' ? -Math.abs(b) : Math.abs(b);
  return x => a * x + bv;
}

function buildCuaFn(a, b, s1, c, s2) {
  const bv = s1 === '-' ? -Math.abs(b) : Math.abs(b);
  const cv = s2 === '-' ? -Math.abs(c) : Math.abs(c);
  return x => a * x * x + bv * x + cv;
}

function buildExpFn(a, c, sign) {
  const base = Math.max(0.01, Math.abs(a));
  const cv   = sign === '-' ? -Math.abs(c) : Math.abs(c);
  return x => Math.pow(base, x) + cv;
}

function readStructuredFn() {
  const t  = ST.activeType;
  const sg = ST.signs;
  if (t === 'lineal') {
    const a = parseFloat(document.getElementById('a-lin').value) || 0;
    const b = parseFloat(document.getElementById('b-lin').value) || 0;
    return buildLinFn(a, b, sg.lin);
  }
  if (t === 'cuadratica') {
    const a = parseFloat(document.getElementById('a-cua').value) || 0;
    const b = parseFloat(document.getElementById('b-cua').value) || 0;
    const c = parseFloat(document.getElementById('c-cua').value) || 0;
    return buildCuaFn(a, b, sg.cua1, c, sg.cua2);
  }
  if (t === 'exponencial') {
    const a = parseFloat(document.getElementById('a-exp').value) || 2;
    const c = parseFloat(document.getElementById('c-exp').value) || 0;
    return buildExpFn(a, c, sg.exp);
  }
  return null;
}

function getStructuredTex() {
  const t  = ST.activeType;
  const sg = ST.signs;
  if (t === 'lineal') {
    const a = document.getElementById('a-lin').value;
    const b = Math.abs(parseFloat(document.getElementById('b-lin').value) || 0);
    return `${a}\\cdot x ${sg.lin} ${b}`;
  }
  if (t === 'cuadratica') {
    const a = document.getElementById('a-cua').value;
    const b = Math.abs(parseFloat(document.getElementById('b-cua').value) || 0);
    const c = Math.abs(parseFloat(document.getElementById('c-cua').value) || 0);
    return `${a}x^{2} ${sg.cua1} ${b}x ${sg.cua2} ${c}`;
  }
  if (t === 'exponencial') {
    const a = Math.abs(parseFloat(document.getElementById('a-exp').value) || 2);
    const c = Math.abs(parseFloat(document.getElementById('c-exp').value) || 0);
    return `${a}^{x} ${sg.exp} ${c}`;
  }
  return '';
}
