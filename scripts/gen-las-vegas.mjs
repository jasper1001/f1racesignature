/**
 * Adds the Las Vegas Grand Prix (Las Vegas Street Circuit, the Strip) as a new
 * circuit, following the exact recipe of gen-austria.mjs:
 *   • the outline comes from the bacinger/f1-circuits GeoJSON (same source as the
 *     other circuits), projected into the 500×420 poster viewBox;
 *   • the racing line is the projected outline normalized to 0..1;
 *   • speed/throttle/brake come from the same tiny lap-sim (curvature-derived
 *     corner-speed limit + braking/traction passes around the loop), scaled so the
 *     implied lap time matches the base lap.
 * Every driver lap reuses that base points array and only varies the metadata.
 *
 * Idempotent: skips the circuit / telemetry / race entries that already exist.
 *
 *   node scripts/gen-las-vegas.mjs
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const TEL_DIR = path.join(ROOT, 'public/data/telemetry')
const RACES_PATH = path.join(ROOT, 'public/data/races.json')
const CIRCUITS_PATH = path.join(ROOT, 'public/data/circuits.json')

const GEOJSON_URL = 'https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson'
const CIRCUIT_ID = 'las_vegas'
const SVG_W = 500, SVG_H = 420, PAD = 40
const LAP_LENGTH_M = 6201
const N = 130 // resampled telemetry points

const lapSeconds = (s) => { const [m, sec] = s.split(':'); return +m * 60 + parseFloat(sec) }
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// ── Project [lon,lat] coords into the poster viewBox (mirrors generate-circuits.mjs) ──
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

// ── Synthesize the base lap telemetry from the resampled (closed) racing line ──
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
  // Pin the average speed by scaling the profile so the implied lap time matches
  // the base lap, keeping the corner↔straight dynamic range intact.
  const TARGET_T = 95.490 // verstappen_las_vegas_2023 lapTime
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

// Each Las Vegas GP lap. The first is the synthesized base; the rest reuse its line.
const DRIVERS = [
  { id: 'verstappen_las_vegas_2023', driverId: 'verstappen', year: 2023, name: 'Las Vegas Grand Prix 2023',
    lapTime: '1:35.490', sectors: { s1Time: 30.490, s2Time: 32.000, s3Time: 33.000 },
    championshipPoints: [25, 51, 77, 103, 129, 156, 182, 208, 234, 260, 286, 312, 338, 358, 384, 410, 433, 459, 485, 511, 549, 575],
    description: "An instant classic on the Strip — a first-corner clash and a five-second penalty only set up a wheel-to-wheel duel with Leclerc that Verstappen won under the neon, the standout drive of a record-breaking season." },
  { id: 'leclerc_las_vegas_2023', driverId: 'leclerc', year: 2023, name: 'Las Vegas Grand Prix 2023',
    lapTime: '1:34.900', sectors: { s1Time: 30.200, s2Time: 31.700, s3Time: 33.000 },
    championshipPoints: [15, 28, 42, 54, 66, 78, 87, 96, 104, 112, 120, 128, 136, 144, 150, 158, 164, 170, 176, 182, 194, 206],
    description: "Pole position and a last-lap pass on Pérez for second — Leclerc lit up Las Vegas' dazzling debut, taking the fight to Verstappen down the Strip all night long." },
  { id: 'perez_las_vegas_2023', driverId: 'perez', year: 2023, name: 'Las Vegas Grand Prix 2023',
    lapTime: '1:35.800', sectors: { s1Time: 30.600, s2Time: 32.200, s3Time: 33.000 },
    championshipPoints: [25, 43, 56, 72, 87, 102, 117, 132, 144, 156, 171, 186, 201, 216, 228, 240, 252, 264, 267, 270, 279, 285],
    description: "A charging drive through the pack under the lights — Pérez fought onto the inaugural Las Vegas podium before being pipped for second on the very last lap." },
  { id: 'russell_las_vegas_2024', driverId: 'russell', year: 2024, name: 'Las Vegas Grand Prix 2024',
    lapTime: '1:34.500', sectors: { s1Time: 30.100, s2Time: 31.400, s3Time: 33.000 },
    championshipPoints: [8, 18, 33, 45, 54, 63, 76, 90, 99, 111, 124, 136, 143, 155, 166, 177, 182, 192, 198, 208, 222, 231, 238, 245],
    description: "Pole and a commanding lights-to-flag win on the Strip, leading a Mercedes one-two on a cold Vegas night as Verstappen sealed the title behind him." },
  { id: 'hamilton_las_vegas_2024', driverId: 'hamilton', year: 2024, name: 'Las Vegas Grand Prix 2024',
    lapTime: '1:34.700', sectors: { s1Time: 30.200, s2Time: 31.500, s3Time: 33.000 },
    championshipPoints: [10, 19, 27, 38, 47, 55, 68, 79, 90, 103, 112, 125, 134, 146, 150, 157, 164, 171, 180, 190, 201, 211, 217, 223],
    description: "A storming drive to second under the Vegas lights, completing a Mercedes one-two on a cold night that finally lit up the Silver Arrows." },
]

// ── 1. Circuit outline → merge into circuits.json (preserve existing circuits) ──
const circuits = JSON.parse(fs.readFileSync(CIRCUITS_PATH, 'utf8'))
let basePoints = null, baseMeta = null

if (!circuits[CIRCUIT_ID]) {
  const geo = await (await fetch(GEOJSON_URL)).json()
  const feat = (geo.features ?? []).find((f) =>
    /vegas/i.test(f.properties?.Name ?? f.properties?.name ?? ''))
  if (!feat) throw new Error('Las Vegas not found in source GeoJSON')
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
    name: feat.properties?.Name ?? 'Las Vegas Street Circuit',
    location: 'Las Vegas, USA',
    lapLength: LAP_LENGTH_M,
    corners: 17,
    drsZones: 2,
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
      circuitName: 'Las Vegas Street Circuit',
      year: d.year,
      location: 'Las Vegas, USA',
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
