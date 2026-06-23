/**
 * Adds six circuits — Montreal, Zandvoort, COTA (Austin), Mexico City, Imola and
 * Melbourne — plus two signature laps each, following the gen-las-vegas.mjs recipe:
 *   • outline projected from the bacinger/f1-circuits GeoJSON into the poster viewBox;
 *   • racing line = projected outline normalized to 0..1;
 *   • speed/throttle/brake synthesized by the shared curvature-derived lap-sim,
 *     scaled so the implied lap time matches each circuit's base lap.
 * Every lap reuses its circuit's synthesized base points and only varies the metadata.
 *
 * All referenced drivers already exist in public/data/drivers.json.
 * Idempotent: skips circuits / telemetry / races that already exist.
 *
 *   node scripts/gen-circuits-batch.mjs
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const TEL_DIR = path.join(ROOT, 'public/data/telemetry')
const RACES_PATH = path.join(ROOT, 'public/data/races.json')
const CIRCUITS_PATH = path.join(ROOT, 'public/data/circuits.json')

const GEOJSON_URL = 'https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson'
const SVG_W = 500, SVG_H = 420, PAD = 40
const N = 130

const lapSeconds = (s) => { const [m, sec] = s.split(':'); return +m * 60 + parseFloat(sec) }
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// Decorative cumulative-points curve for the ChampionshipRun viz (monotonic).
function makeCurve(total, rounds) {
  const out = []
  for (let i = 0; i < rounds; i++) out.push(Math.round(total * Math.pow((i + 1) / rounds, 0.92)))
  for (let i = 1; i < out.length; i++) if (out[i] < out[i - 1]) out[i] = out[i - 1]
  return out
}

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

function synthesize(line, lapLengthM, targetT) {
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

// ── Circuit + signature-lap config. First driver per circuit is the synthesized base. ──
const CIRCUITS = [
  {
    id: 'canada', match: /villeneuve|montreal/i, name: 'Circuit Gilles-Villeneuve',
    location: 'Montréal, Canada', lapLength: 4361, corners: 14, drsZones: 3,
    drivers: [
      { id: 'ricciardo_canada_2014', driverId: 'ricciardo', year: 2014, lapTime: '1:14.000',
        sectors: { s1Time: 24.000, s2Time: 25.000, s3Time: 25.000 }, seasonTotal: 238, rounds: 19,
        description: "Ricciardo's maiden Grand Prix win — chasing down the leaders in the closing laps at Montréal, the breakthrough that announced him as a genuine front-runner." },
      { id: 'hamilton_canada_2017', driverId: 'hamilton', year: 2017, lapTime: '1:13.800',
        sectors: { s1Time: 23.900, s2Time: 24.900, s3Time: 25.000 }, seasonTotal: 363, rounds: 20,
        description: "A flawless pole-to-flag win in Montréal that drew Hamilton level with Ayrton Senna's career pole tally — Canada has always been his happiest hunting ground." },
    ],
  },
  {
    id: 'zandvoort', match: /zandvoort/i, name: 'Circuit Zandvoort',
    location: 'Zandvoort, Netherlands', lapLength: 4259, corners: 14, drsZones: 2,
    drivers: [
      { id: 'verstappen_zandvoort_2021', driverId: 'verstappen', year: 2021, lapTime: '1:12.000',
        sectors: { s1Time: 23.000, s2Time: 24.500, s3Time: 24.500 }, seasonTotal: 395, rounds: 22,
        description: "Home heaven for the Orange Army — Verstappen controlled his home Grand Prix at a reborn, banked Zandvoort to retake the championship lead." },
      { id: 'norris_zandvoort_2024', driverId: 'norris', year: 2024, lapTime: '1:11.900',
        sectors: { s1Time: 22.900, s2Time: 24.500, s3Time: 24.500 }, seasonTotal: 374, rounds: 24,
        description: "A statement drive — Norris hunted down and passed Verstappen at his own home race, then pulled clear to win by over twenty seconds at Zandvoort." },
    ],
  },
  {
    id: 'cota', match: /americas|austin/i, name: 'Circuit of the Americas',
    location: 'Austin, USA', lapLength: 5513, corners: 20, drsZones: 2,
    drivers: [
      { id: 'raikkonen_usa_2018', driverId: 'raikkonen', year: 2018, lapTime: '1:37.000',
        sectors: { s1Time: 32.000, s2Time: 32.500, s3Time: 32.500 }, seasonTotal: 251, rounds: 21,
        description: "The Iceman's fairy tale — Räikkönen ended a 113-race victory drought with a tactical masterclass in Austin, proof the raw speed had never left." },
      { id: 'hamilton_usa_2015', driverId: 'hamilton', year: 2015, lapTime: '1:37.200',
        sectors: { s1Time: 32.200, s2Time: 32.500, s3Time: 32.500 }, seasonTotal: 381, rounds: 19,
        description: "Title number three, sealed in style — Hamilton fought through a chaotic, rain-soaked Austin race, passing Rosberg late to clinch the championship at COTA." },
    ],
  },
  {
    id: 'mexico', match: /rodr|mexico/i, name: 'Autódromo Hermanos Rodríguez',
    location: 'Mexico City, Mexico', lapLength: 4304, corners: 17, drsZones: 3,
    drivers: [
      { id: 'verstappen_mexico_2021', driverId: 'verstappen', year: 2021, lapTime: '1:19.000',
        sectors: { s1Time: 26.000, s2Time: 26.500, s3Time: 26.500 }, seasonTotal: 395, rounds: 22,
        description: "A perfect launch into Turn 1 and never seen again — Verstappen dominated at altitude in Mexico City to stretch his title lead with a near-faultless drive." },
      { id: 'perez_mexico_2022', driverId: 'perez', year: 2022, lapTime: '1:19.300',
        sectors: { s1Time: 26.100, s2Time: 26.600, s3Time: 26.600 }, seasonTotal: 305, rounds: 22,
        description: "Deafening grandstands willing him on — Pérez delivered the home podium Mexico craved, third at the Autódromo Hermanos Rodríguez before his adoring crowd." },
    ],
  },
  {
    id: 'imola', match: /imola|enzo|dino/i, name: 'Autodromo Enzo e Dino Ferrari',
    location: 'Imola, Italy', lapLength: 4909, corners: 19, drsZones: 2,
    drivers: [
      { id: 'verstappen_imola_2022', driverId: 'verstappen', year: 2022, lapTime: '1:17.000',
        sectors: { s1Time: 25.000, s2Time: 26.000, s3Time: 26.000 }, seasonTotal: 454, rounds: 22,
        description: "A weekend sweep in Ferrari's backyard — Verstappen took pole, the sprint and a commanding wet-to-dry win at Imola, silencing the Tifosi." },
      { id: 'schumacher_imola_2004', driverId: 'schumacher', year: 2004, lapTime: '1:17.500',
        sectors: { s1Time: 25.500, s2Time: 26.000, s3Time: 26.000 }, seasonTotal: 148, rounds: 18,
        description: "Ferrari supremacy on Italian soil — Schumacher's San Marino win at Imola was another link in the most dominant season the sport had ever seen." },
    ],
  },
  {
    id: 'australia', match: /albert park|melbourne/i, name: 'Albert Park Circuit',
    location: 'Melbourne, Australia', lapLength: 5278, corners: 14, drsZones: 4,
    drivers: [
      { id: 'leclerc_australia_2022', driverId: 'leclerc', year: 2022, lapTime: '1:20.000',
        sectors: { s1Time: 26.000, s2Time: 27.000, s3Time: 27.000 }, seasonTotal: 308, rounds: 22,
        description: "A grand slam in Melbourne — pole, fastest lap, every lap led and a runaway win. Leclerc's perfect weekend at Albert Park was Ferrari at its 2022 peak." },
      { id: 'norris_australia_2025', driverId: 'norris', year: 2025, lapTime: '1:20.300',
        sectors: { s1Time: 26.100, s2Time: 27.100, s3Time: 27.100 }, seasonTotal: 390, rounds: 24,
        description: "A cool head in chaos — Norris mastered a treacherous wet-dry season opener at Albert Park to win, the ideal start to a title campaign." },
    ],
  },
]

const geo = await (await fetch(GEOJSON_URL)).json()
const features = geo.features ?? []

const circuits = JSON.parse(fs.readFileSync(CIRCUITS_PATH, 'utf8'))
const races = JSON.parse(fs.readFileSync(RACES_PATH, 'utf8'))
const existingRace = new Set(races.map((r) => r.id))

let circuitsAdded = 0, telWritten = 0, racesAdded = 0

for (const cfg of CIRCUITS) {
  let basePoints = null, baseMeta = null

  if (!circuits[cfg.id]) {
    const feat = features.find((f) => cfg.match.test(f.properties?.Name ?? f.properties?.name ?? ''))
    if (!feat) throw new Error(`${cfg.id} not found in source GeoJSON`)
    const g = feat.geometry
    const coords = g.type === 'LineString' ? g.coordinates
      : g.type === 'MultiLineString' ? g.coordinates.flat()
      : g.coordinates[0]
    const proj = project(coords)
    const pathStr = proj.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ') + ' Z'

    const targetT = lapSeconds(cfg.drivers[0].lapTime)
    const line = resample(proj, N)
    const synth = synthesize(line, cfg.lapLength, targetT)
    basePoints = synth.points
    baseMeta = synth

    circuits[cfg.id] = {
      id: cfg.id,
      name: cfg.name,
      location: cfg.location,
      lapLength: cfg.lapLength,
      corners: cfg.corners,
      drsZones: cfg.drsZones,
      viewBox: `0 0 ${SVG_W} ${SVG_H}`,
      path: pathStr,
      sector1End: 0.33,
      sector2End: 0.67,
      source: 'f1-circuits',
    }
    circuitsAdded++
    console.log(`circuit added: ${cfg.id} (top ${synth.topSpeed} km/h, avg ${synth.averageSpeed})`)
  } else {
    const baseFile = path.join(TEL_DIR, `${cfg.drivers[0].id}.json`)
    if (!fs.existsSync(baseFile)) throw new Error(`${cfg.id} exists but base telemetry missing`)
    const t = JSON.parse(fs.readFileSync(baseFile, 'utf8'))
    basePoints = t.points
    baseMeta = { topSpeed: t.topSpeed, averageSpeed: t.averageSpeed }
    console.log(`circuit ${cfg.id} already present — skipping outline`)
  }

  for (const d of cfg.drivers) {
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
        championshipPoints: makeCurve(d.seasonTotal, d.rounds),
        points: basePoints,
      }))
      telWritten++
    }
    if (!existingRace.has(d.id)) {
      races.push({
        id: d.id,
        driverId: d.driverId,
        name: `${cfg.id === 'cota' ? 'United States' : cfg.id === 'canada' ? 'Canadian' : cfg.id === 'zandvoort' ? 'Dutch' : cfg.id === 'mexico' ? 'Mexico City' : cfg.id === 'imola' ? 'Emilia-Romagna' : 'Australian'} Grand Prix ${d.year}`,
        circuit: cfg.id,
        circuitName: cfg.name,
        year: d.year,
        location: cfg.location,
        lapTime: d.lapTime,
        description: d.description,
        isFree: true,
        telemetryFile: d.id,
      })
      existingRace.add(d.id)
      racesAdded++
    }
  }
}

fs.writeFileSync(CIRCUITS_PATH, JSON.stringify(circuits, null, 2) + '\n')
fs.writeFileSync(RACES_PATH, JSON.stringify(races, null, 2) + '\n')
console.log(`\ncircuits added: ${circuitsAdded} | telemetry written: ${telWritten} | races added: ${racesAdded}`)
console.log(`total circuits: ${Object.keys(circuits).length} | total races: ${races.length}`)
