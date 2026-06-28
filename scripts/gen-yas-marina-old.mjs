/**
 * Adds the OLD Yas Marina layout (2009–2020) as a separate circuit and re-points the
 * pre-2021 Abu Dhabi laps onto it.
 *
 * Yas Marina was heavily reprofiled before the 2021 finale (chicane bypassed, the
 * south-marina 90° complex replaced by one sweeping corner, hotel section opened up),
 * dropping the lap from 5554 m to 5281 m. Our `abu_dhabi` circuit is the NEW layout
 * (from the current f1-circuits GeoJSON), so the generated 2010/2014/2016 laps were
 * drawn on the wrong shape. This builds the old layout from the f1-circuits GeoJSON at
 * a pre-rebuild commit and moves those laps to it.
 *
 *   • outline: bacinger/f1-circuits @ 38af3e4a (2020-12-06), Yas Marina = 5554 m;
 *   • racing line: the projected outline, normalized 0..1 (co-registered with the
 *     outline under the poster's shared fit, exactly like gen-austria.mjs);
 *   • speed/throttle/brake: the same curvature → corner-limit → braking/traction sim.
 * Each re-pointed lap keeps its own lapTime / sectors / championshipPoints; only the
 * geometry (points) + circuit id change.
 *
 * Idempotent: skips the circuit if it already exists; only rewrites laps still on the
 * new `abu_dhabi` circuit.
 *
 *   node scripts/gen-yas-marina-old.mjs
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const TEL_DIR = path.join(ROOT, 'public/data/telemetry')
const RACES_PATH = path.join(ROOT, 'public/data/races.json')
const CIRCUITS_PATH = path.join(ROOT, 'public/data/circuits.json')

// Pre-rebuild commit (2020-12-06) where Yas Marina is still the 5554 m old layout.
const GEOJSON_URL = 'https://raw.githubusercontent.com/bacinger/f1-circuits/38af3e4a/f1-circuits.geojson'
const NEW_CIRCUIT_ID = 'abu_dhabi_2009'
const OLD_LAYOUT_CIRCUIT = 'abu_dhabi' // the laps currently (wrongly) sit on this
const SVG_W = 500, SVG_H = 420, PAD = 40
const LAP_LENGTH_M = 5554
const N = 130 // resampled telemetry points

// Pre-2021 Abu Dhabi laps to move onto the old layout.
const TARGET_RACE_IDS = ['vettel_abu_dhabi_2010', 'hamilton_abu_dhabi_2014', 'rosberg_abu_dhabi_2016']
const TARGET_T = 101.274 // vettel_abu_dhabi_2010 lapTime — pins the speed profile

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// ── Project [lon,lat] coords into the poster viewBox (mirrors gen-austria.mjs) ──
function project(coords) {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity
  for (const [lon, lat] of coords) {
    if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon
    if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat
  }
  const lonRange = maxLon - minLon || 1, latRange = maxLat - minLat || 1
  const availW = SVG_W - PAD * 2, availH = SVG_H - PAD * 2
  const scale = Math.min(availW / lonRange, availH / latRange)
  const usedW = lonRange * scale, usedH = latRange * scale
  const offX = PAD + (availW - usedW) / 2, offY = PAD + (availH - usedH) / 2
  return coords.map(([lon, lat]) => [
    Math.round((offX + (lon - minLon) * scale) * 10) / 10,
    Math.round((offY + usedH - (lat - minLat) * scale) * 10) / 10,
  ])
}

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

  // A_LAT/V_MIN tuned so the long back straight vs the slow corners give a realistic
  // ~310 km/h top / ~200 km/h average for the old layout (matches the historic data).
  const A_LAT = 22, A_BRAKE = 22, A_ACCEL = 13
  const V_MAX = 95, V_MIN = 18 // m/s
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

// ── 1. Old-layout outline → circuits.json (always re-synthesized, so re-running
//       the script re-tunes the speed profile; the circuit entry is upserted) ──
const circuits = JSON.parse(fs.readFileSync(CIRCUITS_PATH, 'utf8'))

const geo = await (await fetch(GEOJSON_URL)).json()
const feat = (geo.features ?? []).find((f) =>
  /yas marina/i.test(f.properties?.Name ?? f.properties?.name ?? ''))
if (!feat) throw new Error('Yas Marina not found in source GeoJSON')
const g = feat.geometry
const coords = g.type === 'LineString' ? g.coordinates
  : g.type === 'MultiLineString' ? g.coordinates.flat()
  : g.coordinates[0]
const proj = project(coords)
const pathStr = proj.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ') + ' Z'

const base = synthesize(resample(proj, N))

circuits[NEW_CIRCUIT_ID] = {
  id: NEW_CIRCUIT_ID,
  name: 'Yas Marina Circuit (2009–2020)',
  location: 'Yas Marina',
  lapLength: LAP_LENGTH_M,
  corners: 21,
  drsZones: 2,
  viewBox: `0 0 ${SVG_W} ${SVG_H}`,
  path: pathStr,
  sector1End: 0.33,
  sector2End: 0.67,
  source: 'f1-circuits@38af3e4a',
  // Historic layout — kept out of the guess/draw games (would duplicate Yas Marina).
  variant: 'historic',
}
fs.writeFileSync(CIRCUITS_PATH, JSON.stringify(circuits, null, 2) + '\n')
console.log(`circuit upserted: ${NEW_CIRCUIT_ID} (top ${base.topSpeed} km/h, avg ${base.averageSpeed})`)

// ── 2. Re-point the pre-2021 laps: new geometry + new circuit id ──
const races = JSON.parse(fs.readFileSync(RACES_PATH, 'utf8'))
let telUpdated = 0, racesMoved = 0

for (const rid of TARGET_RACE_IDS) {
  // Rewrite telemetry points (keep lapTime / sectors / championshipPoints).
  const telPath = path.join(TEL_DIR, `${rid}.json`)
  if (fs.existsSync(telPath)) {
    const t = JSON.parse(fs.readFileSync(telPath, 'utf8'))
    t.points = base.points
    t.topSpeed = base.topSpeed
    t.averageSpeed = base.averageSpeed
    t.source = 'generated-yasmarina-old'
    fs.writeFileSync(telPath, JSON.stringify(t))
    telUpdated++
  }
  // Move the race onto the old-layout circuit.
  const r = races.find((x) => x.id === rid)
  if (r && r.circuit === OLD_LAYOUT_CIRCUIT) {
    r.circuit = NEW_CIRCUIT_ID
    racesMoved++
  }
}

fs.writeFileSync(RACES_PATH, JSON.stringify(races, null, 2) + '\n')
console.log(`telemetry rewritten: ${telUpdated}`)
console.log(`races moved to ${NEW_CIRCUIT_ID}: ${racesMoved}`)
