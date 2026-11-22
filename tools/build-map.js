/* Generates src/mapdata.js from tools/provinces.js and the Natural Earth 1:50m land outline.
   The coastline packages are not vendored into the repo. Install them anywhere and point NODE_PATH at them:
     mkdir /tmp/maptool && cd /tmp/maptool && npm init -y && npm i world-atlas topojson-client
     NODE_PATH=/tmp/maptool/node_modules node tools/build-map.js
   Each province is the Voronoi cell of its seed; the game clips cells to land when drawing. */
const fs = require('fs'), path = require('path');
const topo = require('topojson-client');
const land50 = require('world-atlas/land-50m.json');
const { BBOX, PROVS, SEA } = require('./provinces.js');

const KX = 30, KY = 44.8, PAD = 1;
const W = Math.round((BBOX.lon1 - BBOX.lon0) * KX), H = Math.round((BBOX.lat1 - BBOX.lat0) * KY);
const px = (lon, lat) => [(lon - BBOX.lon0) * KX, (BBOX.lat1 - lat) * KY];
const TERR = { p: 'plains', h: 'hills', m: 'mountain', f: 'forest', s: 'marsh', u: 'urban', d: 'desert' };
const r1 = v => Math.round(v * 10) / 10;

/* ---- polygon clipping against a half-plane a*x+b*y<=c ---- */
function clipHalf(poly, a, b, c) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const dp = a * p[0] + b * p[1] - c, dq = a * q[0] + b * q[1] - c;
    if (dp <= 0) out.push(p);
    if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) { const t = dp / (dp - dq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
  }
  return out;
}
function clipRect(poly, x0, y0, x1, y1) {
  let p = clipHalf(poly, -1, 0, -x0); if (p.length) p = clipHalf(p, 1, 0, x1); if (p.length) p = clipHalf(p, 0, -1, -y0); if (p.length) p = clipHalf(p, 0, 1, y1);
  return p;
}
function area(poly) { let s = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; s += p[0] * q[1] - q[0] * p[1]; } return Math.abs(s) / 2; }

/* ---- coastline ---- */
const geo = topo.feature(land50, land50.objects.land);
const geoms = geo.type === 'FeatureCollection' ? geo.features.map(f => f.geometry) : [geo.geometry];
const lonA = BBOX.lon0 - PAD, lonB = BBOX.lon1 + PAD, latA = BBOX.lat0 - PAD, latB = BBOX.lat1 + PAD;
const rings = [];
for (const g of geoms) {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (const poly of polys) for (const ring of poly) {
    let any = false; for (const p of ring) if (p[0] > lonA && p[0] < lonB && p[1] > latA && p[1] < latB) { any = true; break; }
    if (!any) continue;
    let c = clipRect(ring.slice(0, -1), lonA, latA, lonB, latB);
    if (c.length < 3) continue;
    c = c.map(p => px(p[0], p[1]));
    const s = [c[0]];
    for (let i = 1; i < c.length; i++) { const l = s[s.length - 1]; if (Math.hypot(c[i][0] - l[0], c[i][1] - l[1]) >= 1.2) s.push(c[i]); }
    if (s.length < 3 || area(s) < 12) continue;
    rings.push(s.map(p => [r1(p[0]), r1(p[1])]));
  }
}

/* ---- land mask by even-odd scanline fill, 2px cells ---- */
const MS = 2, MW = Math.ceil(W / MS), MH = Math.ceil(H / MS), mask = new Uint8Array(MW * MH);
for (let my = 0; my < MH; my++) {
  const y = my * MS + MS / 2, xs = [];
  for (const r of rings) for (let i = 0; i < r.length; i++) {
    const p = r[i], q = r[(i + 1) % r.length];
    if ((p[1] <= y) !== (q[1] <= y)) xs.push(p[0] + (y - p[1]) / (q[1] - p[1]) * (q[0] - p[0]));
  }
  xs.sort((a, b) => a - b);
  for (let k = 0; k + 1 < xs.length; k += 2) {
    const a = Math.max(0, Math.ceil((xs[k] - MS / 2) / MS)), b = Math.min(MW - 1, Math.floor((xs[k + 1] - MS / 2) / MS));
    for (let mx = a; mx <= b; mx++) mask[my * MW + mx] = 1;
  }
}
const onLand = (x, y) => { const mx = Math.floor(x / MS), my = Math.floor(y / MS); return mx >= 0 && my >= 0 && mx < MW && my < MH && mask[my * MW + mx] === 1; };

/* connected landmasses, so that a border only counts where both provinces stand on the same land */
const comp = new Int32Array(MW * MH); let nComp = 0;
for (let i = 0; i < mask.length; i++) {
  if (!mask[i] || comp[i]) continue;
  nComp++; const st = [i]; comp[i] = nComp;
  while (st.length) { const c = st.pop(), cx = c % MW, cy = (c / MW) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= MW || y >= MH) continue; const n = y * MW + x; if (mask[n] && !comp[n]) { comp[n] = nComp; st.push(n); } } }
}
const compAt = (x, y) => onLand(x, y) ? comp[Math.floor(y / MS) * MW + Math.floor(x / MS)] : 0;

/* ---- provinces and Voronoi cells ---- */
const provs = PROVS.map((r, id) => { const p = px(r[2], r[3]); return { id, key: r[0], name: r[1], x: r1(p[0]), y: r1(p[1]), cx: 0, cy: 0, owner: r[4], terr: TERR[r[5]], ind: r[6], vp: r[7], port: r[8].includes('p'), cap: r[8].includes('c'), area: 0 }; });
const N = provs.length, keyId = {};
provs.forEach(p => { if (keyId[p.key] !== undefined) throw new Error('duplicate key ' + p.key); if (!p.terr) throw new Error('bad terrain ' + p.key); keyId[p.key] = p.id; });
const cells = [], adjSet = provs.map(() => new Set());
for (const p of provs) {
  let poly = [[0, 0], [W, 0], [W, H], [0, H]];
  for (const q of provs) {
    if (q === p) continue;
    const a = q.x - p.x, b = q.y - p.y, c = (q.x * q.x + q.y * q.y - p.x * p.x - p.y * p.y) / 2;
    poly = clipHalf(poly, a, b, c);
    if (poly.length < 3) break;
  }
  cells.push(poly);
}
/* label point and land area from grid samples */
const STEP = 4, acc = provs.map(() => [0, 0, 0]), compCount = provs.map(() => new Map());
for (let y = STEP / 2; y < H; y += STEP) for (let x = STEP / 2; x < W; x += STEP) {
  if (!onLand(x, y)) continue;
  let best = -1, bd = 1e18;
  for (const p of provs) { const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y); if (d < bd) { bd = d; best = p.id; } }
  acc[best][0] += x; acc[best][1] += y; acc[best][2]++;
  const k = compAt(x, y), m = compCount[best]; m.set(k, (m.get(k) || 0) + 1);
}
const home = compCount.map(m => { let b = 0, bn = 0; for (const [k, n] of m) if (n > bn) { bn = n; b = k; } return b; });
/* shared edges: an edge of cell i lies on the bisector with j */
for (const p of provs) {
  const poly = cells[p.id];
  for (let e = 0; e < poly.length; e++) {
    const s = poly[e], t = poly[(e + 1) % poly.length], len = Math.hypot(t[0] - s[0], t[1] - s[1]);
    if (len < 0.5) continue;
    const mx = (s[0] + t[0]) / 2, my = (s[1] + t[1]) / 2, dp = Math.hypot(mx - p.x, my - p.y);
    for (const q of provs) {
      if (q.id <= p.id) continue;
      if (Math.abs(Math.hypot(mx - q.x, my - q.y) - dp) > 0.01) continue;
      /* both endpoints must be equidistant too */
      if (Math.abs(Math.hypot(s[0] - q.x, s[1] - q.y) - Math.hypot(s[0] - p.x, s[1] - p.y)) > 0.01) continue;
      let hits = 0; const n = Math.max(12, Math.ceil(len / 3));
      for (let k = 0; k <= n; k++) { const u = (k + 0.5) / (n + 1); const lc = compAt(s[0] + (t[0] - s[0]) * u, s[1] + (t[1] - s[1]) * u); if (lc && lc === home[p.id] && lc === home[q.id]) hits++; }
      if (hits >= 1) { adjSet[p.id].add(q.id); adjSet[q.id].add(p.id); }
    }
  }
}
const nearestLand = (p, tx, ty) => { /* closest land sample of this province to a target point */
  let b = null, bd = 1e18;
  for (let y = STEP / 2; y < H; y += STEP) for (let x = STEP / 2; x < W; x += STEP) {
    if (!onLand(x, y)) continue; const d = (x - tx) ** 2 + (y - ty) ** 2; if (d >= bd) continue;
    let own = true; const dp = (p.x - x) ** 2 + (p.y - y) ** 2;
    for (const q of provs) if (q !== p && (q.x - x) ** 2 + (q.y - y) ** 2 < dp) { own = false; break; }
    if (own) { bd = d; b = [x, y]; }
  }
  return b;
};
for (const p of provs) {
  const a = acc[p.id]; p.area = a[2] * STEP * STEP;
  if (a[2] < 6) console.warn('WARN almost no land:', p.key, p.area);
  if (!a[2]) { p.cx = p.x; p.cy = p.y; continue; }
  let cx = a[0] / a[2], cy = a[1] / a[2];
  /* the centroid of a crescent-shaped province can fall in the sea or in a neighbour */
  let mine = onLand(cx, cy); if (mine) { const d = (p.x - cx) ** 2 + (p.y - cy) ** 2; for (const q of provs) if (q !== p && (q.x - cx) ** 2 + (q.y - cy) ** 2 < d) { mine = false; break; } }
  if (!mine) { const b = nearestLand(p, cx, cy); if (b) { cx = b[0]; cy = b[1]; } }
  p.cx = r1(cx); p.cy = r1(cy);
}
const sea = SEA.map(([a, b]) => { if (keyId[a] === undefined || keyId[b] === undefined) throw new Error('bad sea link ' + a + '-' + b); return [keyId[a], keyId[b]]; });
const adj = adjSet.map(s => [...s].sort((a, b) => a - b));
for (const p of provs) if (!adj[p.id].length && !sea.some(s => s[0] === p.id || s[1] === p.id)) console.warn('WARN isolated:', p.key);
for (const [a, b] of sea) if (adjSet[a].has(b)) console.warn('note: sea link is also a land border:', provs[a].key, provs[b].key);

const MAP = { W, H, proj: { lon0: BBOX.lon0, lat1: BBOX.lat1, kx: KX, ky: KY }, land: rings.map(r => r.flat()), provs,
  cells: cells.map(c => c.flatMap(p => [r1(p[0]), r1(p[1])])), adj, sea };
const out = '(function(PK){PK.MAP=' + JSON.stringify(MAP) + ';})(globalThis.PK=globalThis.PK||{});\n';
const file = path.join(__dirname, '..', 'src', 'mapdata.js');
fs.writeFileSync(file, out);
console.log('provinces', N, '| land borders', adj.reduce((s, a) => s + a.length, 0) / 2, '| sea links', sea.length, '| coast rings', rings.length, 'points', rings.reduce((s, r) => s + r.length, 0), '| bytes', out.length);
