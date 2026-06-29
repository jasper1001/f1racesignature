/**
 * Adds George Russell's Austrian Grand Prix 2026 (Red Bull Ring) win to the studio.
 * The Red Bull Ring already exists in the dataset, so this reuses the existing
 * Austria base lap and only varies the metadata (mirrors gen-russell-canada-2026.mjs).
 *
 * Idempotent: skips the telemetry / race entries if they already exist.
 *
 *   node scripts/gen-russell-austria-2026.mjs
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const TEL_DIR = path.join(ROOT, 'public/data/telemetry')
const RACES_PATH = path.join(ROOT, 'public/data/races.json')

const BASE_TELEMETRY = 'russell_austria_2024' // same circuit (red_bull_ring) — reuse its lap
const lapSeconds = (s) => { const [m, sec] = s.split(':'); return +m * 60 + parseFloat(sec) }

const RACE = {
  id: 'russell_austria_2026',
  driverId: 'russell',
  name: 'Austrian Grand Prix 2026',
  circuit: 'red_bull_ring',
  circuitName: 'Red Bull Ring',
  year: 2026,
  location: 'Spielberg, Austria',
  lapTime: '1:05.700',
  description: 'Back-to-back for Russell. A faultless lights-to-flag drive through the Styrian hills extended his Mercedes hot streak and tightened his grip on the championship lead at the Red Bull Ring.',
  isFree: false,
  telemetryFile: 'russell_austria_2026',
}

const SECTORS = { s1Time: 17.700, s2Time: 28.500, s3Time: 19.500 }
const CHAMPIONSHIP_POINTS = [15, 33, 51, 62, 74, 95, 110, 128, 153, 178]

// ── sanity: sectors must sum to the lap time ──
const sum = SECTORS.s1Time + SECTORS.s2Time + SECTORS.s3Time
if (Math.abs(sum - lapSeconds(RACE.lapTime)) > 0.01) {
  throw new Error(`sectors sum ${sum.toFixed(3)} != lapTime ${RACE.lapTime}`)
}

// ── 1. Telemetry file — reuse the Austria base lap's racing line ──
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
