/**
 * Adds historic (off-calendar) circuits as new tracks: Sochi Autodrom (Russia)
 * and Sepang International Circuit (Malaysia). Same approach as gen-austria.mjs —
 * neither has a real lap in the dataset, so we synthesize ONE base lap per circuit:
 *   • outline from the bacinger/f1-circuits GeoJSON, projected into the 500×420 viewBox;
 *   • racing line = the projected outline, normalized to 0..1 (co-registered with it);
 *   • speed/throttle/brake from a curvature-derived corner-speed limit plus braking
 *     (backward) and traction (forward) passes, scaled so the implied lap time matches
 *     the base lap (pins a realistic average while keeping the dynamic range).
 * Every driver lap reuses the base points array and varies only the metadata.
 *
 * Idempotent: skips circuit / telemetry / race entries that already exist.
 *
 *   node scripts/gen-historic-tracks.mjs
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const TEL_DIR = path.join(ROOT, 'public/data/telemetry')
const RACES_PATH = path.join(ROOT, 'public/data/races.json')
const CIRCUITS_PATH = path.join(ROOT, 'public/data/circuits.json')

const GEOJSON_URL = 'https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson'
const SVG_W = 500, SVG_H = 420, PAD = 40, N = 130

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

function synthesize(line, targetT, lapLengthM) {
  const n = line.length
  const at = (i) => line[(i % n + n) % n]
  let projTotal = 0
  const ds = []
  for (let i = 0; i < n; i++) {
    const a = at(i), b = at(i + 1)
    ds.push(Math.hypot(b[0] - a[0], b[1] - a[1]))
    projTotal += ds[i]
  }
  const mPerPx = lapLengthM / projTotal
  const dsM = ds.map((d) => Math.max(0.5, d * mPerPx))

  const A_LAT = 30, A_BRAKE = 22, A_ACCEL = 13
  const V_MAX = 95, V_MIN = 22
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
  const vScale = impliedT / targetT
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

const CONFIGS = [
  {
    id: 'sochi', match: /sochi|russia/i, name: 'Sochi Autodrom', location: 'Sochi, Russia',
    lapLength: 5848, corners: 18, drsZones: 2,
    drivers: [
      { id: 'hamilton_sochi_2019', driverId: 'hamilton', year: 2019, name: 'Russian Grand Prix 2019',
        lapTime: '1:35.761', sectors: { s1Time: 24.061, s2Time: 44.000, s3Time: 27.700 },
        championshipPoints: [25, 43, 50, 70, 95, 120, 145, 171, 188, 213, 238, 256, 281, 306, 331, 358],
        description: "Hamilton inherited the lead through a Virtual Safety Car cycle and controlled it to the flag at Sochi — a strategic Mercedes win on his way to a sixth title." },
      { id: 'verstappen_sochi_2021', driverId: 'verstappen', year: 2021, name: 'Russian Grand Prix 2021',
        lapTime: '1:36.200', sectors: { s1Time: 24.300, s2Time: 44.200, s3Time: 27.700 },
        championshipPoints: [25, 43, 69, 87, 107, 125, 156, 182, 207, 233, 258, 284, 310, 332, 351, 370],
        description: "From the back of the grid to second in the closing laps — Verstappen's late call for intermediates as the rain arrived turned a damage-limitation day into a points coup." },
      { id: 'norris_sochi_2021', driverId: 'norris', year: 2021, name: 'Russian Grand Prix 2021',
        lapTime: '1:35.500', sectors: { s1Time: 24.000, s2Time: 44.000, s3Time: 27.500 },
        championshipPoints: [8, 20, 47, 65, 90, 113, 131, 156, 178, 199, 225, 250, 279, 291, 309, 331],
        description: "A maiden pole and a long-awaited first win in sight — Norris led at Sochi until late rain caught McLaren out, a heartbreaking what-might-have-been." },
      { id: 'sainz_sochi_2021', driverId: 'sainz', year: 2021, name: 'Russian Grand Prix 2021',
        lapTime: '1:36.000', sectors: { s1Time: 24.200, s2Time: 44.100, s3Time: 27.700 },
        championshipPoints: [0, 18, 33, 45, 58, 70, 76, 83, 95, 113, 133, 156, 171, 175, 187, 202],
        description: "Sainz led his home-from-home Ferrari into the early lead at Sochi and held on for a podium, a high point of his first season in red." },
      { id: 'leclerc_sochi_2019', driverId: 'leclerc', year: 2019, name: 'Russian Grand Prix 2019',
        lapTime: '1:35.900', sectors: { s1Time: 24.100, s2Time: 44.100, s3Time: 27.700 },
        championshipPoints: [26, 45, 71, 104, 116, 138, 159, 170, 178, 186, 200, 219, 237, 252, 275, 290],
        description: "Pole position and the early lead for Leclerc at Sochi, part of a blistering late-2019 run of qualifying performances in the Ferrari." },
    ],
  },
  {
    id: 'sepang', match: /sepang|malaysia/i, name: 'Sepang International Circuit', location: 'Sepang, Malaysia',
    lapLength: 5543, corners: 15, drsZones: 2,
    drivers: [
      { id: 'verstappen_malaysia_2017', driverId: 'verstappen', year: 2017, name: 'Malaysian Grand Prix 2017',
        lapTime: '1:34.080', sectors: { s1Time: 30.080, s2Time: 35.000, s3Time: 29.000 },
        championshipPoints: [25, 43, 69, 87, 107, 125, 156, 182, 207, 233, 258, 284, 310, 332, 351, 370],
        description: "Verstappen swept past Hamilton on lap four and drove away to a commanding win at Sepang — a statement drive on his nineteenth birthday weekend." },
      { id: 'hamilton_malaysia_2014', driverId: 'hamilton', year: 2014, name: 'Malaysian Grand Prix 2014',
        lapTime: '1:35.200', sectors: { s1Time: 30.500, s2Time: 35.400, s3Time: 29.300 },
        championshipPoints: [0, 25, 43, 61, 86, 111, 136, 161, 186, 211, 230, 255, 280, 305, 334, 384],
        description: "A lights-to-flag win from pole at Sepang — Hamilton's Mercedes was untouchable, the start of the run that defined the 2014 title." },
      { id: 'vettel_malaysia_2013', driverId: 'vettel', year: 2013, name: 'Malaysian Grand Prix 2013',
        lapTime: '1:35.600', sectors: { s1Time: 30.600, s2Time: 35.700, s3Time: 29.300 },
        championshipPoints: [15, 25, 40, 58, 73, 98, 123, 148, 171, 196, 221, 246, 271, 296, 322, 347],
        description: "\"Multi-21\" — Vettel ignored team orders to pass Webber and win at Sepang, a ruthless, controversial victory that soured a Red Bull weekend." },
      { id: 'alonso_malaysia_2012', driverId: 'alonso', year: 2012, name: 'Malaysian Grand Prix 2012',
        lapTime: '1:36.500', sectors: { s1Time: 30.900, s2Time: 36.000, s3Time: 29.600 },
        championshipPoints: [10, 35, 53, 71, 89, 100, 111, 129, 154, 179, 194, 209, 219, 229, 245, 278],
        description: "A masterclass in the wet — Alonso wrung a win out of an uncompetitive Ferrari at a rain-hit Sepang, the drive that launched an against-the-odds title fight." },
      { id: 'ricciardo_malaysia_2016', driverId: 'ricciardo', year: 2016, name: 'Malaysian Grand Prix 2016',
        lapTime: '1:34.900', sectors: { s1Time: 30.300, s2Time: 35.300, s3Time: 29.300 },
        championshipPoints: [12, 22, 37, 47, 59, 71, 96, 108, 119, 132, 144, 152, 158, 170, 192, 200],
        description: "Ricciardo held off his team-mate through a tense finish at Sepang for a popular win, after Hamilton's leading Mercedes expired in flames." },
    ],
  },
]

const circuits = JSON.parse(fs.readFileSync(CIRCUITS_PATH, 'utf8'))
const races = JSON.parse(fs.readFileSync(RACES_PATH, 'utf8'))
const existing = new Set(races.map((r) => r.id))
let geo = null
let telWritten = 0, racesAdded = 0, circuitsAdded = 0

for (const cfg of CONFIGS) {
  let basePoints = null, baseMeta = null

  if (!circuits[cfg.id]) {
    geo ??= await (await fetch(GEOJSON_URL)).json()
    const feat = (geo.features ?? []).find((f) =>
      cfg.match.test(f.properties?.Name ?? f.properties?.name ?? '') || cfg.match.test(f.properties?.Location ?? ''))
    if (!feat) throw new Error(`${cfg.id}: not found in source GeoJSON`)
    const g = feat.geometry
    const coords = g.type === 'LineString' ? g.coordinates
      : g.type === 'MultiLineString' ? g.coordinates.flat() : g.coordinates[0]
    const proj = project(coords)
    const pathStr = proj.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ') + ' Z'
    const synth = synthesize(resample(proj, N), lapSeconds(cfg.drivers[0].lapTime), cfg.lapLength)
    basePoints = synth.points
    baseMeta = synth
    circuits[cfg.id] = {
      id: cfg.id, name: cfg.name, location: cfg.location, lapLength: cfg.lapLength,
      corners: cfg.corners, drsZones: cfg.drsZones, viewBox: `0 0 ${SVG_W} ${SVG_H}`,
      path: pathStr, sector1End: 0.33, sector2End: 0.67, source: 'f1-circuits',
    }
    circuitsAdded++
    console.log(`circuit added: ${cfg.id} (top ${synth.topSpeed} km/h, avg ${synth.averageSpeed})`)
  } else {
    const baseFile = path.join(TEL_DIR, `${cfg.drivers[0].id}.json`)
    const t = JSON.parse(fs.readFileSync(baseFile, 'utf8'))
    basePoints = t.points
    baseMeta = { topSpeed: t.topSpeed, averageSpeed: t.averageSpeed }
    console.log(`circuit ${cfg.id} already present — reusing base lap`)
  }

  for (const d of cfg.drivers) {
    const sum = d.sectors.s1Time + d.sectors.s2Time + d.sectors.s3Time
    if (Math.abs(sum - lapSeconds(d.lapTime)) > 0.01) {
      throw new Error(`${d.id}: sectors sum ${sum.toFixed(3)} != lapTime ${d.lapTime}`)
    }
    const telPath = path.join(TEL_DIR, `${d.id}.json`)
    if (!fs.existsSync(telPath)) {
      fs.writeFileSync(telPath, JSON.stringify({
        driverId: d.driverId, raceId: d.id, lapTime: d.lapTime, sectors: d.sectors,
        topSpeed: baseMeta.topSpeed, averageSpeed: baseMeta.averageSpeed, benchmarkLapTime: d.lapTime,
        championshipPoints: d.championshipPoints, points: basePoints,
      }))
      telWritten++
    }
    if (!existing.has(d.id)) {
      races.push({
        id: d.id, driverId: d.driverId, name: d.name, circuit: cfg.id, circuitName: cfg.name,
        year: d.year, location: cfg.location, lapTime: d.lapTime, description: d.description,
        isFree: true, telemetryFile: d.id,
      })
      existing.add(d.id)
      racesAdded++
    }
  }
}

if (circuitsAdded) fs.writeFileSync(CIRCUITS_PATH, JSON.stringify(circuits, null, 2) + '\n')
fs.writeFileSync(RACES_PATH, JSON.stringify(races, null, 2) + '\n')
console.log(`circuits added: ${circuitsAdded}`)
console.log(`telemetry files written: ${telWritten}`)
console.log(`race entries added: ${racesAdded}`)
console.log(`total races now: ${races.length}`)
