/**
 * Adds the Austrian Grand Prix (Red Bull Ring, Spielberg) as a new circuit.
 *
 * Unlike gen-legendary-tracks.mjs — which relabels an existing real lap for a new
 * driver — Austria has no lap in the dataset, so we synthesize ONE base lap:
 *   • the outline comes from the bacinger/f1-circuits GeoJSON (same source as the
 *     original circuits), projected into the 500×420 poster viewBox;
 *   • the racing line is the projected outline, normalized to 0..1 so it stays
 *     co-registered with the outline under the poster's shared fit transform;
 *   • speed/throttle/brake come from a tiny lap-sim: a curvature-derived corner
 *     speed limit, then braking (backward) and traction (forward) passes around the
 *     loop, with throttle/brake read off the resulting longitudinal acceleration.
 * Every driver lap reuses that base points array (exactly like the other added
 * laps) and only varies the metadata.
 *
 * Idempotent: skips the circuit / telemetry / race entries that already exist.
 *
 *   node scripts/gen-austria.mjs
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const TEL_DIR = path.join(ROOT, 'public/data/telemetry')
const RACES_PATH = path.join(ROOT, 'public/data/races.json')
const CIRCUITS_PATH = path.join(ROOT, 'public/data/circuits.json')

const GEOJSON_URL = 'https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson'
const CIRCUIT_ID = 'red_bull_ring'
const SVG_W = 500, SVG_H = 420, PAD = 40
const LAP_LENGTH_M = 4318
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
  // segment lengths in metres
  let projTotal = 0
  const ds = []
  for (let i = 0; i < n; i++) {
    const a = at(i), b = at(i + 1)
    ds.push(Math.hypot(b[0] - a[0], b[1] - a[1]))
    projTotal += ds[i]
  }
  const mPerPx = LAP_LENGTH_M / projTotal
  const dsM = ds.map((d) => Math.max(0.5, d * mPerPx))

  // curvature → corner speed limit. Heading change is summed over a window so a
  // sweeping corner spread across several coarse outline points still reads as one
  // slow corner (a single-point angle would under-read it).
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
    const kappa = turn / (arc || 1) // 1/m over the window
    v[i] = kappa < 1e-4 ? V_MAX : clamp(Math.sqrt(A_LAT / kappa), V_MIN, V_MAX)
  }
  // braking (backward) + traction (forward) passes, wrapped around the loop
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
  // Scale the whole profile so the implied lap time matches the base lap, which
  // pins the average speed to a realistic value while keeping the corner↔straight
  // dynamic range (and so the throttle/brake zones) intact.
  const TARGET_T = 65.683 // verstappen_austria_2021 lapTime
  const impliedT = dsM.reduce((s, d, i) => s + d / v[i], 0)
  const vScale = impliedT / TARGET_T
  for (let i = 0; i < n; i++) v[i] *= vScale

  // cumulative distance (normalized) + sectors + throttle/brake
  const totalM = dsM.reduce((s, d) => s + d, 0)
  const points = []
  let cum = 0
  for (let i = 0; i < n; i++) {
    const distFrac = cum / totalM
    const vNext = v[(i + 1) % n]
    const aLong = (vNext * vNext - v[i] * v[i]) / (2 * dsM[i]) // m/s²
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

// Each Austrian GP lap. The first is the synthesized base; the rest reuse its line.
const DRIVERS = [
  { id: 'verstappen_austria_2021', driverId: 'verstappen', year: 2021, name: 'Austrian Grand Prix 2021',
    lapTime: '1:05.683', sectors: { s1Time: 17.683, s2Time: 28.500, s3Time: 19.500 },
    championshipPoints: [25, 43, 69, 87, 107, 125, 156, 182, 207, 233, 258, 284, 310, 332, 351, 370],
    description: "Pole, fastest lap and a lights-to-flag win at Red Bull's home race — Verstappen was untouchable at the Red Bull Ring, the high point of a dominant championship run." },
  { id: 'leclerc_austria_2022', driverId: 'leclerc', year: 2022, name: 'Austrian Grand Prix 2022',
    lapTime: '1:06.200', sectors: { s1Time: 17.900, s2Time: 28.700, s3Time: 19.600 },
    championshipPoints: [26, 45, 71, 104, 116, 138, 159, 170, 178, 186, 200, 219, 237, 252, 275, 290],
    description: "Leclerc beat Verstappen in a straight fight, passing him three times as a throttle issue bit late — a rare 2022 weekend where Ferrari's pace held to the flag." },
  { id: 'russell_austria_2024', driverId: 'russell', year: 2024, name: 'Austrian Grand Prix 2024',
    lapTime: '1:05.900', sectors: { s1Time: 17.800, s2Time: 28.600, s3Time: 19.500 },
    championshipPoints: [0, 18, 33, 45, 58, 70, 76, 83, 95, 113, 133, 156, 171, 175, 187, 202],
    description: "Handed the lead when the leaders collided, Russell pounced to take a surprise Mercedes win at the Red Bull Ring after a tense late-race scrap." },
  { id: 'hamilton_austria_2016', driverId: 'hamilton', year: 2016, name: 'Austrian Grand Prix 2016',
    lapTime: '1:07.100', sectors: { s1Time: 18.200, s2Time: 29.000, s3Time: 19.900 },
    championshipPoints: [25, 43, 50, 70, 95, 120, 145, 171, 188, 213, 238, 256, 281, 306, 331, 358],
    description: "A last-lap collision with his title rival settled it Hamilton's way — he held on to win at the Red Bull Ring after contact at the final corner." },
  { id: 'norris_austria_2024', driverId: 'norris', year: 2024, name: 'Austrian Grand Prix 2024',
    lapTime: '1:04.900', sectors: { s1Time: 17.500, s2Time: 28.200, s3Time: 19.200 },
    championshipPoints: [8, 20, 47, 65, 90, 113, 131, 156, 178, 199, 225, 250, 279, 291, 309, 331],
    description: "Norris hunted down the lead and was wheel-to-wheel for the win until a clash with Verstappen ended his charge — a what-might-have-been at the Red Bull Ring." },
]

// ── 1. Circuit outline → merge into circuits.json (preserve existing circuits) ──
const circuits = JSON.parse(fs.readFileSync(CIRCUITS_PATH, 'utf8'))
let basePoints = null, baseMeta = null

if (!circuits[CIRCUIT_ID]) {
  const geo = await (await fetch(GEOJSON_URL)).json()
  const feat = (geo.features ?? []).find((f) =>
    /red bull|spielberg/i.test(f.properties?.Name ?? f.properties?.name ?? ''))
  if (!feat) throw new Error('Red Bull Ring not found in source GeoJSON')
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
    name: feat.properties?.Name ?? 'Red Bull Ring',
    location: 'Spielberg, Austria',
    lapLength: LAP_LENGTH_M,
    corners: 10,
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

// Need the base points to write telemetry; if the circuit already existed we read
// them back from the base driver's telemetry file.
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
      circuitName: 'Red Bull Ring',
      year: d.year,
      location: 'Spielberg, Austria',
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
