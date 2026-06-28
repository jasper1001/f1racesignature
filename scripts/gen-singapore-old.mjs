/**
 * Adds the OLD Marina Bay layout (2008–2022) as a separate circuit and re-points the
 * pre-2023 Singapore laps onto it.
 *
 * Marina Bay was reconfigured for 2023 — the turns 16–19 sequence by the Bay
 * grandstand was bulldozed into a single straight (23 → 19 corners, 5.063 → 4.940 km).
 * Our `marina_bay` circuit was built from a post-2023 FastF1 lap (the NEW layout), so:
 *   • the generated 2010 / 2013 laps were drawn on the wrong (new) shape;
 *   • the 2018 / 2022 real-GPS laps DO trace the old layout (they were driven on it),
 *     but sat in the same circuit group as 2023/2024 — so head-to-head could overlay
 *     an old-layout lap on a new one.
 *
 * Unlike Yas Marina, the bacinger GeoJSON never carried the old Singapore layout, so
 * the old-layout outline is taken from a real old-layout GPS lap we already have
 * (hamilton_singapore_2018 — the staircase of turns 16–19 is clearly in it). Then:
 *   • 2010 / 2013 (generated): re-synthesized on that outline + moved to the new id;
 *   • 2018 / 2022 (real GPS):  moved to the new id only (telemetry untouched — they
 *     render their own real shape, and the move keeps them out of the new-layout group).
 *
 * Idempotent: the circuit is upserted; only laps still on `marina_bay` are moved.
 *
 *   node scripts/gen-singapore-old.mjs
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const TEL_DIR = path.join(ROOT, 'public/data/telemetry')
const RACES_PATH = path.join(ROOT, 'public/data/races.json')
const CIRCUITS_PATH = path.join(ROOT, 'public/data/circuits.json')

const NEW_CIRCUIT_ID = 'marina_bay_2008'
const NEW_LAYOUT_CIRCUIT = 'marina_bay' // laps currently (wrongly) grouped here
const GEOM_SOURCE_ID = 'hamilton_singapore_2018' // real old-layout GPS lap = the outline
const SVG_W = 500, SVG_H = 420
const LAP_LENGTH_M = 5063
const N = 130
const TARGET_T = 107.976 // alonso_singapore_2010 lapTime — pins the speed profile

// Generated laps: re-synthesize their line on the old layout + move them.
const GEN_RACE_IDS = ['alonso_singapore_2010', 'vettel_singapore_2013']
// Real-GPS laps: keep telemetry, just move them onto the old-layout circuit.
const GPS_RACE_IDS = ['hamilton_singapore_2018', 'perez_singapore_2022']

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// Evenly resample a polyline to N points by arc length.
function resample(pts, n) {
  const seg = []
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
    seg.push(d); total += d
  }
  const step = total / n
  const out = []
  let i = 0, acc = 0
  for (let k = 0; k < n; k++) {
    const target = k * step
    while (i < seg.length - 1 && acc + seg[i] < target) { acc += seg[i]; i++ }
    const t = (target - acc) / (seg[i] || 1)
    out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t])
  }
  return out
}

// ── Synthesize base lap telemetry from the resampled (closed) racing line ──
// (identical model to gen-yas-marina-old.mjs / gen-austria.mjs)
function synthesize(line) {
  const n = line.length
  const at = (i) => line[(i % n + n) % n]
  let projTotal = 0
  const ds = []
  for (let i = 0; i < n; i++) {
    const a = at(i), b = at(i + 1)
    ds.push(Math.hypot(b[0] - a[0], b[1] - a[1]))
    projTotal += ds[i]
  }
  const mPerPx = LAP_LENGTH_M / projTotal
  const dsM = ds.map((d) => Math.max(0.5, d * mPerPx))

  // A_LAT/V_MIN tuned for a slow, twisty street circuit (~300 km/h top, ~185 avg).
  const A_LAT = 18, A_BRAKE = 22, A_ACCEL = 13
  const V_MAX = 95, V_MIN = 14 // m/s
  const head = []
  for (let i = 0; i < n; i++) {
    const a = at(i), b = at(i + 1)
    head.push(Math.atan2(b[1] - a[1], b[0] - a[0]))
  }
  const wrap = (x) => { while (x > Math.PI) x -= 2 * Math.PI; while (x < -Math.PI) x += 2 * Math.PI; return x }
  const W = 3
  const v = new Array(n)
  for (let i = 0; i < n; i++) {
    let turn = 0, arc = 0
    for (let k = -W; k < W; k++) {
      const idx = ((i + k) % n + n) % n
      turn += Math.abs(wrap(head[(idx + 1) % n] - head[idx]))
      arc += dsM[idx]
    }
    const kappa = turn / (arc || 1)
    v[i] = kappa < 1e-4 ? V_MAX : clamp(Math.sqrt(A_LAT / kappa), V_MIN, V_MAX)
  }
  for (let pass = 0; pass < 3; pass++) {
    for (let k = 0; k < n; k++) {
      const i = (n - 1 - k + n) % n, j = (i + 1) % n
      v[i] = Math.min(v[i], Math.sqrt(v[j] * v[j] + 2 * A_BRAKE * dsM[i]))
    }
    for (let k = 0; k < n; k++) {
      const i = k % n, h = (i - 1 + n) % n
      v[i] = Math.min(v[i], Math.sqrt(v[h] * v[h] + 2 * A_ACCEL * dsM[h]))
    }
  }
  const impliedT = dsM.reduce((s, d, i) => s + d / v[i], 0)
  const vScale = impliedT / TARGET_T
  for (let i = 0; i < n; i++) v[i] *= vScale

  const totalM = dsM.reduce((s, d) => s + d, 0)
  const points = []
  let cum = 0
  for (let i = 0; i < n; i++) {
    const distFrac = cum / totalM
    const vNext = v[(i + 1) % n]
    const aLong = (vNext * vNext - v[i] * v[i]) / (2 * dsM[i])
    let throttle, brake
    if (aLong < -0.8) { brake = clamp(-aLong / A_BRAKE, 0.12, 1); throttle = 0 }
    else if (aLong > 0.8) { throttle = 100; brake = 0 }
    else { throttle = Math.round(clamp((v[i] / V_MAX) * 100, 45, 100)); brake = 0 }
    points.push({
      x: Math.round((at(i)[0] / SVG_W) * 1e4) / 1e4,
      y: Math.round((at(i)[1] / SVG_H) * 1e4) / 1e4,
      speed: Math.round(v[i] * 3.6),
      sector: distFrac < 0.33 ? 1 : distFrac < 0.67 ? 2 : 3,
      throttle,
      brake: Math.round(brake * 100) / 100,
      distance: Math.round(distFrac * 1e4) / 1e4,
    })
    cum += dsM[i]
  }
  const speeds = points.map((p) => p.speed)
  return { points, topSpeed: Math.max(...speeds), averageSpeed: Math.round(speeds.reduce((s, x) => s + x, 0) / n) }
}

// ── 1. Old-layout outline from the 2018 GPS lap → circuits.json (upsert) ──
const circuits = JSON.parse(fs.readFileSync(CIRCUITS_PATH, 'utf8'))
const geomTel = JSON.parse(fs.readFileSync(path.join(TEL_DIR, `${GEOM_SOURCE_ID}.json`), 'utf8'))
const line = resample(geomTel.points.map((p) => [p.x * SVG_W, p.y * SVG_H]), N)
const base = synthesize(line)
const pathStr = line.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + ' Z'

circuits[NEW_CIRCUIT_ID] = {
  id: NEW_CIRCUIT_ID,
  name: 'Marina Bay Street Circuit (2008–2022)',
  location: 'Marina Bay',
  lapLength: LAP_LENGTH_M,
  corners: 23,
  drsZones: 3,
  viewBox: `0 0 ${SVG_W} ${SVG_H}`,
  path: pathStr,
  sector1End: 0.33,
  sector2End: 0.67,
  source: `gps:${GEOM_SOURCE_ID}`,
  // Historic layout — kept out of the guess/draw games (would duplicate Singapore).
  variant: 'historic',
}
fs.writeFileSync(CIRCUITS_PATH, JSON.stringify(circuits, null, 2) + '\n')
console.log(`circuit upserted: ${NEW_CIRCUIT_ID} (top ${base.topSpeed} km/h, avg ${base.averageSpeed})`)

// ── 2. Re-point the pre-2023 laps ──
const races = JSON.parse(fs.readFileSync(RACES_PATH, 'utf8'))
let telUpdated = 0, racesMoved = 0

// Generated laps: rewrite geometry (keep lapTime / sectors / championshipPoints).
for (const rid of GEN_RACE_IDS) {
  const telPath = path.join(TEL_DIR, `${rid}.json`)
  if (fs.existsSync(telPath)) {
    const t = JSON.parse(fs.readFileSync(telPath, 'utf8'))
    t.points = base.points
    t.topSpeed = base.topSpeed
    t.averageSpeed = base.averageSpeed
    t.source = 'generated-singapore-old'
    fs.writeFileSync(telPath, JSON.stringify(t))
    telUpdated++
  }
}

// Move every pre-2023 lap onto the old-layout circuit (GPS laps keep their telemetry).
for (const rid of [...GEN_RACE_IDS, ...GPS_RACE_IDS]) {
  const r = races.find((x) => x.id === rid)
  if (r && r.circuit === NEW_LAYOUT_CIRCUIT) {
    r.circuit = NEW_CIRCUIT_ID
    racesMoved++
  }
}

fs.writeFileSync(RACES_PATH, JSON.stringify(races, null, 2) + '\n')
console.log(`telemetry rewritten (generated laps): ${telUpdated}`)
console.log(`races moved to ${NEW_CIRCUIT_ID}: ${racesMoved}`)
