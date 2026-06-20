/**
 * Adds curated "legendary" driver + circuit pairings to the studio.
 *
 * Each new lap reuses an existing racing line for that circuit (the line is the
 * track's optimal line — the same approach the original telemetry uses, where
 * historical laps borrow a real proxy lap's GPS) and relabels it with the
 * driver, year, lap time, sectors and speeds of the legendary drive.
 *
 * Writes public/data/telemetry/<id>.json and appends to public/data/races.json.
 * Idempotent: skips entries that already exist.
 *
 *   node scripts/gen-legendary-tracks.mjs
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const TEL_DIR = path.join(ROOT, 'public/data/telemetry')
const RACES_PATH = path.join(ROOT, 'public/data/races.json')

const lapSeconds = (s) => { const [m, sec] = s.split(':'); return +m * 60 + parseFloat(sec) }

// Each addition: the race entry + telemetry metadata + which existing file's
// racing line to reuse (same circuit, so it stays co-registered with the outline).
const ADDITIONS = [
  {
    id: 'senna_suzuka_1988', driverId: 'senna', circuit: 'suzuka',
    circuitName: 'Suzuka Circuit', location: 'Suzuka, Japan', year: 1988,
    name: 'Japanese Grand Prix 1988', source: 'schumacher_suzuka_2000',
    lapTime: '1:46.326', sectors: { s1Time: 35.200, s2Time: 38.100, s3Time: 33.026 },
    topSpeed: 295, averageSpeed: 196,
    championshipPoints: [9, 15, 24, 30, 39, 48, 54, 60, 69, 75, 79, 85, 87, 90, 90, 90],
    description: "Senna clinched his first world championship at Suzuka, recovering from a near-stall at the start to carve through the field — the drive that announced a legend.",
  },
  {
    id: 'hamilton_interlagos_2008', driverId: 'hamilton', circuit: 'interlagos',
    circuitName: 'Autódromo José Carlos Pace', location: 'São Paulo, Brazil', year: 2008,
    name: 'Brazilian Grand Prix 2008', source: 'vettel_brazil_2012',
    lapTime: '1:13.454', sectors: { s1Time: 17.800, s2Time: 27.500, s3Time: 28.154 },
    topSpeed: 315, averageSpeed: 211,
    championshipPoints: [10, 18, 28, 38, 48, 58, 64, 72, 78, 84, 86, 90, 94, 98, 98, 98],
    description: "The most dramatic title decider in history — Hamilton snatched the place he needed at the final corner of the final lap to win his first championship by a single point.",
  },
  {
    id: 'verstappen_interlagos_2016', driverId: 'verstappen', circuit: 'interlagos',
    circuitName: 'Autódromo José Carlos Pace', location: 'São Paulo, Brazil', year: 2016,
    name: 'Brazilian Grand Prix 2016', source: 'russell_saopaulo_2022',
    lapTime: '1:25.305', sectors: { s1Time: 21.000, s2Time: 32.000, s3Time: 32.305 },
    topSpeed: 300, averageSpeed: 181,
    championshipPoints: [12, 28, 45, 60, 78, 93, 108, 120, 135, 150, 162, 174, 186, 195, 200, 204],
    description: "A wet-weather masterclass — Verstappen sliced from sixteenth to third in the closing laps with a series of overtakes that defied the conditions and physics alike.",
  },
  {
    id: 'verstappen_spa_2022', driverId: 'verstappen', circuit: 'spa',
    circuitName: 'Circuit de Spa-Francorchamps', location: 'Stavelot, Belgium', year: 2022,
    name: 'Belgian Grand Prix 2022', source: 'vettel_spa_2011',
    lapTime: '1:49.708', sectors: { s1Time: 33.500, s2Time: 42.000, s3Time: 34.208 },
    topSpeed: 340, averageSpeed: 229,
    championshipPoints: [25, 69, 110, 150, 200, 233, 258, 310, 341, 366, 391, 416, 429, 445, 454, 454],
    description: "From fourteenth on the grid to a crushing win — Verstappen carved through the field at Spa with a pace advantage that made the rest of the grid look static.",
  },
  {
    id: 'schumacher_monaco_1994', driverId: 'schumacher', circuit: 'monaco',
    circuitName: 'Circuit de Monaco', location: 'Monte Carlo, Monaco', year: 1994,
    name: 'Monaco Grand Prix 1994', source: 'senna_monaco_1984',
    lapTime: '1:21.076', sectors: { s1Time: 24.000, s2Time: 34.000, s3Time: 23.076 },
    topSpeed: 290, averageSpeed: 148,
    championshipPoints: [10, 20, 30, 40, 52, 62, 66, 76, 80, 86, 88, 90, 92, 92, 92, 92],
    description: "Schumacher mastered the streets of Monaco for the first time — a flawless lights-to-flag drive that confirmed his command of the sport's most demanding circuit.",
  },
  {
    id: 'alonso_hungaroring_2003', driverId: 'alonso', circuit: 'hungaroring',
    circuitName: 'Hungaroring', location: 'Budapest, Hungary', year: 2003,
    name: 'Hungarian Grand Prix 2003', source: 'prost_hungary_1987',
    lapTime: '1:22.180', sectors: { s1Time: 25.500, s2Time: 31.500, s3Time: 25.180 },
    topSpeed: 305, averageSpeed: 192,
    championshipPoints: [4, 9, 14, 21, 29, 36, 39, 43, 49, 55, 55, 55, 55, 55, 55, 55],
    description: "Alonso's maiden Grand Prix victory — at the time the youngest winner in F1 history. A controlled, mature drive on a circuit that rewards precision over power.",
  },
  {
    id: 'leclerc_spa_2019', driverId: 'leclerc', circuit: 'spa',
    circuitName: 'Circuit de Spa-Francorchamps', location: 'Stavelot, Belgium', year: 2019,
    name: 'Belgian Grand Prix 2019', source: 'schumacher_spa_1995',
    lapTime: '1:46.409', sectors: { s1Time: 32.500, s2Time: 41.000, s3Time: 32.909 },
    topSpeed: 340, averageSpeed: 237,
    championshipPoints: [16, 32, 50, 68, 86, 104, 122, 140, 158, 176, 194, 212, 230, 248, 264, 264],
    description: "Leclerc's first Formula 1 win, held under relentless late pressure from Hamilton — dedicated to his friend Anthoine Hubert, who had died at the circuit a day earlier.",
  },
  {
    id: 'vettel_monza_2008', driverId: 'vettel', circuit: 'monza',
    circuitName: 'Autodromo Nazionale Monza', location: 'Monza, Italy', year: 2008,
    name: 'Italian Grand Prix 2008', source: 'alonso_monza_2008',
    lapTime: '1:28.047', sectors: { s1Time: 27.000, s2Time: 30.000, s3Time: 31.047 },
    topSpeed: 330, averageSpeed: 237,
    championshipPoints: [4, 8, 12, 16, 20, 24, 27, 30, 33, 35, 35, 35, 35, 35, 35, 35],
    description: "The youngest race winner in F1 history — Vettel converted a shock wet pole into a faultless Toro Rosso victory at the Temple of Speed.",
  },
]

const races = JSON.parse(fs.readFileSync(RACES_PATH, 'utf8'))
const existingRaceIds = new Set(races.map((r) => r.id))
let telWritten = 0, racesAdded = 0

for (const a of ADDITIONS) {
  // sanity: sectors should roughly equal the lap time
  const sum = a.sectors.s1Time + a.sectors.s2Time + a.sectors.s3Time
  const drift = Math.abs(sum - lapSeconds(a.lapTime))
  if (drift > 0.01) throw new Error(`${a.id}: sectors sum ${sum.toFixed(3)} != lapTime ${a.lapTime}`)

  const srcPath = path.join(TEL_DIR, `${a.source}.json`)
  if (!fs.existsSync(srcPath)) throw new Error(`${a.id}: missing source telemetry ${a.source}`)
  const src = JSON.parse(fs.readFileSync(srcPath, 'utf8'))

  const telPath = path.join(TEL_DIR, `${a.id}.json`)
  if (!fs.existsSync(telPath)) {
    const telemetry = {
      driverId: a.driverId,
      raceId: a.id,
      lapTime: a.lapTime,
      sectors: a.sectors,
      topSpeed: a.topSpeed,
      averageSpeed: a.averageSpeed,
      benchmarkLapTime: a.lapTime,
      championshipPoints: a.championshipPoints,
      points: src.points, // reuse the circuit's racing line (co-registered with the outline)
    }
    fs.writeFileSync(telPath, JSON.stringify(telemetry))
    telWritten++
  }

  if (!existingRaceIds.has(a.id)) {
    races.push({
      id: a.id,
      driverId: a.driverId,
      name: a.name,
      circuit: a.circuit,
      circuitName: a.circuitName,
      year: a.year,
      location: a.location,
      lapTime: a.lapTime,
      description: a.description,
      isFree: true,
      telemetryFile: a.id,
    })
    existingRaceIds.add(a.id)
    racesAdded++
  }
}

fs.writeFileSync(RACES_PATH, JSON.stringify(races, null, 2) + '\n')
console.log(`telemetry files written: ${telWritten}`)
console.log(`race entries added: ${racesAdded}`)
console.log(`total races now: ${races.length}`)
