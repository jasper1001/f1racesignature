/**
 * Adds George Russell's recent win — the Canadian Grand Prix 2026 (Montréal) — to
 * the studio. The Circuit Gilles-Villeneuve already exists in the dataset, so this
 * reuses the existing Canada base lap (exactly like gen-austria.mjs reuses its base
 * points) and only varies the metadata.
 *
 * Idempotent: skips the telemetry / race entries if they already exist.
 *
 *   node scripts/gen-russell-canada-2026.mjs
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const TEL_DIR = path.join(ROOT, 'public/data/telemetry')
const RACES_PATH = path.join(ROOT, 'public/data/races.json')

const BASE_TELEMETRY = 'hamilton_canada_2017' // same circuit (canada) — reuse its lap
const lapSeconds = (s) => { const [m, sec] = s.split(':'); return +m * 60 + parseFloat(sec) }

const RACE = {
  id: 'russell_canada_2026',
  driverId: 'russell',
  name: 'Canadian Grand Prix 2026',
  circuit: 'canada',
  circuitName: 'Circuit Gilles-Villeneuve',
  year: 2026,
  location: 'Montréal, Canada',
  lapTime: '1:13.150',
  description: 'Russell converted pole into a commanding lights-to-flag win on the streets of Montréal — leading a Mercedes resurgence and seizing the championship lead with the ice-cool precision of a driver hitting his stride.',
  isFree: false,
  telemetryFile: 'russell_canada_2026',
}

const SECTORS = { s1Time: 23.850, s2Time: 24.850, s3Time: 24.450 }
const CHAMPIONSHIP_POINTS = [15, 33, 51, 62, 74, 95, 110, 128, 153]

// ── sanity: sectors must sum to the lap time ──
const sum = SECTORS.s1Time + SECTORS.s2Time + SECTORS.s3Time
if (Math.abs(sum - lapSeconds(RACE.lapTime)) > 0.01) {
  throw new Error(`sectors sum ${sum.toFixed(3)} != lapTime ${RACE.lapTime}`)
}

// ── 1. Telemetry file — reuse the Canada base lap's racing line ──
const base = JSON.parse(fs.readFileSync(path.join(TEL_DIR, `${BASE_TELEMETRY}.json`), 'utf8'))
const telPath = path.join(TEL_DIR, `${RACE.telemetryFile}.json`)
let telWritten = 0
if (!fs.existsSync(telPath)) {
  fs.writeFileSync(telPath, JSON.stringify({
    driverId: RACE.driverId,
    raceId: RACE.id,
    lapTime: RACE.lapTime,
    sectors: SECTORS,
    topSpeed: base.topSpeed,
    averageSpeed: base.averageSpeed,
    benchmarkLapTime: RACE.lapTime,
    championshipPoints: CHAMPIONSHIP_POINTS,
    points: base.points,
  }))
  telWritten++
}

// ── 2. Race entry ──
const races = JSON.parse(fs.readFileSync(RACES_PATH, 'utf8'))
let racesAdded = 0
if (!races.some((r) => r.id === RACE.id)) {
  races.push(RACE)
  racesAdded++
}
fs.writeFileSync(RACES_PATH, JSON.stringify(races, null, 2) + '\n')

console.log(`telemetry files written: ${telWritten}`)
console.log(`race entries added: ${racesAdded}`)
console.log(`total races now: ${races.length}`)
