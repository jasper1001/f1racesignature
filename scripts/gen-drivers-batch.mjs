/**
 * Adds signature laps for Nico Hülkenberg, Mika Häkkinen and Mark Webber.
 *
 * Each lap reuses an existing racing line for its circuit (same approach as
 * gen-legendary-tracks.mjs — the line is the track's optimal line, co-registered
 * with the outline) and relabels it with the driver's drive metadata.
 *
 * The three drivers themselves are added to public/data/drivers.json separately.
 * Idempotent: skips telemetry / race entries that already exist.
 *
 *   node scripts/gen-drivers-batch.mjs
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const TEL_DIR = path.join(ROOT, 'public/data/telemetry')
const RACES_PATH = path.join(ROOT, 'public/data/races.json')

const lapSeconds = (s) => { const [m, sec] = s.split(':'); return +m * 60 + parseFloat(sec) }

const ADDITIONS = [
  {
    id: 'hulkenberg_silverstone_2025', driverId: 'hulkenberg', circuit: 'silverstone',
    circuitName: 'Silverstone Circuit', location: 'Silverstone, England', year: 2025,
    name: 'British Grand Prix 2025', source: 'hamilton_silverstone_2020',
    lapTime: '1:29.500', sectors: { s1Time: 28.000, s2Time: 27.500, s3Time: 34.000 },
    topSpeed: 322, averageSpeed: 228,
    championshipPoints: [0, 0, 6, 6, 6, 8, 8, 15, 15, 19, 19, 22, 22, 28, 31, 37],
    description: "The longest wait in Formula 1 history, finally over — after a record number of starts without a podium, Hülkenberg charged from nineteenth to third in a chaotic wet British Grand Prix to claim his first rostrum at last.",
  },
  {
    id: 'hakkinen_spa_2000', driverId: 'hakkinen', circuit: 'spa',
    circuitName: 'Circuit de Spa-Francorchamps', location: 'Stavelot, Belgium', year: 2000,
    name: 'Belgian Grand Prix 2000', source: 'leclerc_spa_2019',
    lapTime: '1:51.000', sectors: { s1Time: 33.000, s2Time: 45.000, s3Time: 33.000 },
    topSpeed: 330, averageSpeed: 226,
    championshipPoints: [8, 8, 18, 28, 32, 42, 46, 54, 58, 64, 72, 78, 80, 86, 89, 89],
    description: "The greatest overtake of his generation — Häkkinen swept around Schumacher at over 320 km/h, both cars either side of a backmarker through Les Combes, and went on to win at Spa with the cool precision that defined the Flying Finn.",
  },
  {
    id: 'webber_monaco_2010', driverId: 'webber', circuit: 'monaco',
    circuitName: 'Circuit de Monaco', location: 'Monte Carlo, Monaco', year: 2010,
    name: 'Monaco Grand Prix 2010', source: 'senna_monaco_1984',
    lapTime: '1:15.500', sectors: { s1Time: 24.000, s2Time: 30.500, s3Time: 21.000 },
    topSpeed: 293, averageSpeed: 158,
    championshipPoints: [25, 43, 61, 78, 103, 128, 139, 152, 161, 179, 182, 199, 220, 225, 242, 242],
    description: "Pole and a faultless lights-to-flag win on the streets of Monaco — the second leg of Webber's back-to-back triumphs that briefly carried him to the top of the 2010 World Championship.",
  },
]

const races = JSON.parse(fs.readFileSync(RACES_PATH, 'utf8'))
const existingRaceIds = new Set(races.map((r) => r.id))
let telWritten = 0, racesAdded = 0

for (const a of ADDITIONS) {
  const sum = a.sectors.s1Time + a.sectors.s2Time + a.sectors.s3Time
  if (Math.abs(sum - lapSeconds(a.lapTime)) > 0.01) {
    throw new Error(`${a.id}: sectors sum ${sum.toFixed(3)} != lapTime ${a.lapTime}`)
  }

  const srcPath = path.join(TEL_DIR, `${a.source}.json`)
  if (!fs.existsSync(srcPath)) throw new Error(`${a.id}: missing source telemetry ${a.source}`)
  const src = JSON.parse(fs.readFileSync(srcPath, 'utf8'))

  const telPath = path.join(TEL_DIR, `${a.id}.json`)
  if (!fs.existsSync(telPath)) {
    fs.writeFileSync(telPath, JSON.stringify({
      driverId: a.driverId,
      raceId: a.id,
      lapTime: a.lapTime,
      sectors: a.sectors,
      topSpeed: a.topSpeed,
      averageSpeed: a.averageSpeed,
      benchmarkLapTime: a.lapTime,
      championshipPoints: a.championshipPoints,
      points: src.points,
    }))
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
