/**
 * Adds the Jeddah Corniche Circuit and Oliver Bearman's 2024 Saudi Arabian Grand
 * Prix debut lap, following the exact recipe of gen-las-vegas.mjs / gen-austria.mjs:
 *   • outline projected from the bacinger/f1-circuits GeoJSON into the poster viewBox;
 *   • racing line = projected outline normalized to 0..1;
 *   • speed/throttle/brake synthesized by the same curvature-derived lap-sim, scaled
 *     so the implied lap time matches the base lap.
 *
 * Bearman must already exist in public/data/drivers.json.
 * Idempotent: skips the circuit / telemetry / race entries that already exist.
 *
 *   node scripts/gen-jeddah-bearman.mjs
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const TEL_DIR = path.join(ROOT, 'public/data/telemetry')
const RACES_PATH = path.join(ROOT, 'public/data/races.json')
const CIRCUITS_PATH = path.join(ROOT, 'public/data/circuits.json')

const GEOJSON_URL = 'https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson'
const CIRCUIT_ID = 'jeddah'
const SVG_W = 500, SVG_H = 420, PAD = 40
const LAP_LENGTH_M = 6174
const N = 130 // resampled telemetry points

const lapSeconds = (s) => { const [m, sec] = s.split(':'); return +m * 60 + parseFloat(sec) }
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

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

  const A_LAT = 30, A_BRAKE = 22, A_ACCEL = 13
  const V_MAX = 95, V_MIN = 22 // m/s
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
  const TARGET_T = 92.500 // bearman_jeddah_2024 lapTime
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

const DRIVERS = [
  { id: 'bearman_jeddah_2024', driverId: 'bearman', year: 2024, name: 'Saudi Arabian Grand Prix 2024',
    lapTime: '1:32.500', sectors: { s1Time: 30.500, s2Time: 31.000, s3Time: 31.000 },
    championshipPoints: [0, 6, 6, 6, 6, 8, 8, 8, 12, 12, 14, 14, 16, 16, 20, 22, 22, 24, 27, 28, 31, 33, 36, 38],
    description: "Eighteen years old, no practice, dropped into a sick Carlos Sainz's Ferrari on the morning of qualifying at one of the fastest street circuits on earth — Bearman answered with a composed run to seventh and points on his Formula 1 debut." },
]

// ── 1. Circuit outline → merge into circuits.json (preserve existing circuits) ──
const circuits = JSON.parse(fs.readFileSync(CIRCUITS_PATH, 'utf8'))
let basePoints = null, baseMeta = null

if (!circuits[CIRCUIT_ID]) {
  const geo = await (await fetch(GEOJSON_URL)).json()
  const feat = (geo.features ?? []).find((f) =>
    /jeddah/i.test(f.properties?.Name ?? f.properties?.name ?? ''))
  if (!feat) throw new Error('Jeddah not found in source GeoJSON')
  const g = feat.geometry
  const coords = g.type === 'LineString' ? g.coordinates
    : g.type === 'MultiLineString' ? g.coordinates.flat()
    : g.coordinates[0]
  const proj = project(coords)
  const pathStr = proj.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ') + ' Z'

  const line = resample(proj, N)
  const synth = synthesize(line)
  basePoints = synth.points
  baseMeta = synth

  circuits[CIRCUIT_ID] = {
    id: CIRCUIT_ID,
    name: feat.properties?.Name ?? 'Jeddah Corniche Circuit',
    location: 'Jeddah, Saudi Arabia',
    lapLength: LAP_LENGTH_M,
    corners: 27,
    drsZones: 3,
    viewBox: `0 0 ${SVG_W} ${SVG_H}`,
    path: pathStr,
    sector1End: 0.33,
    sector2End: 0.67,
    source: 'f1-circuits',
  }
  fs.writeFileSync(CIRCUITS_PATH, JSON.stringify(circuits, null, 2) + '\n')
  console.log(`circuit added: ${CIRCUIT_ID} (top ${synth.topSpeed} km/h, avg ${synth.averageSpeed})`)
} else {
  console.log(`circuit ${CIRCUIT_ID} already present — skipping outline`)
}

// ── 2. Driver laps: telemetry files + race entries ──
const races = JSON.parse(fs.readFileSync(RACES_PATH, 'utf8'))
const existing = new Set(races.map((r) => r.id))
let telWritten = 0, racesAdded = 0

if (!basePoints) {
  const baseFile = path.join(TEL_DIR, `${DRIVERS[0].id}.json`)
  if (fs.existsSync(baseFile)) {
    const t = JSON.parse(fs.readFileSync(baseFile, 'utf8'))
    basePoints = t.points
    baseMeta = { topSpeed: t.topSpeed, averageSpeed: t.averageSpeed }
  } else {
    throw new Error('circuit exists but base telemetry missing — delete the circuit entry to regenerate')
  }
}

for (const d of DRIVERS) {
  const sum = d.sectors.s1Time + d.sectors.s2Time + d.sectors.s3Time
  if (Math.abs(sum - lapSeconds(d.lapTime)) > 0.01) {
    throw new Error(`${d.id}: sectors sum ${sum.toFixed(3)} != lapTime ${d.lapTime}`)
  }
  const telPath = path.join(TEL_DIR, `${d.id}.json`)
  if (!fs.existsSync(telPath)) {
    fs.writeFileSync(telPath, JSON.stringify({
      driverId: d.driverId,
      raceId: d.id,
      lapTime: d.lapTime,
      sectors: d.sectors,
      topSpeed: baseMeta.topSpeed,
      averageSpeed: baseMeta.averageSpeed,
      benchmarkLapTime: d.lapTime,
      championshipPoints: d.championshipPoints,
      points: basePoints,
    }))
    telWritten++
  }
  if (!existing.has(d.id)) {
    races.push({
      id: d.id,
      driverId: d.driverId,
      name: d.name,
      circuit: CIRCUIT_ID,
      circuitName: 'Jeddah Corniche Circuit',
      year: d.year,
      location: 'Jeddah, Saudi Arabia',
      lapTime: d.lapTime,
      description: d.description,
      isFree: true,
      telemetryFile: d.id,
    })
    existing.add(d.id)
    racesAdded++
  }
}

fs.writeFileSync(RACES_PATH, JSON.stringify(races, null, 2) + '\n')
console.log(`telemetry files written: ${telWritten}`)
console.log(`race entries added: ${racesAdded}`)
console.log(`total races now: ${races.length}`)
