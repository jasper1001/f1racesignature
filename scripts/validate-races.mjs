/**
 * validate-races.mjs — data integrity gate for the race dataset.
 *
 * Fails (exit 1) if any race isn't backed by real, internally-consistent data.
 * Designed for CI / pre-commit: pure Node, no deps, no network.
 *
 *   node scripts/validate-races.mjs
 *
 * Checks, per race:
 *   • telemetry file exists and is valid JSON (catches NaN/corruption)
 *   • telemetry is real: source === 'fastf1'  (the anti-fabrication gate)
 *   • metadata agrees: telemetry driverId/raceId/lapTime match the race entry
 *   • lapTime is well-formed and equals s1+s2+s3 sectors (±0.01s)
 *   • benchmarkLapTime present; topSpeed/averageSpeed > 0
 *   • every telemetry point is finite (no NaN/Infinity), distance in [0,1],
 *     speed ≥ 0; the lap isn't all-zero speed
 *   • driverId exists in drivers.json; raceId is unique
 * Plus dataset-level warnings (non-fatal): orphan telemetry files, drivers
 * with zero races.
 *
 * Why no winner/date cross-check: the dataset intentionally includes non-win
 * laps (poles, lost leads, DNFs), so a "winner must match results" rule would
 * reject valid entries. Verifying a race actually happened is a human/Jolpica
 * step done when ADDING a race, not a property of existing rows.
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const TEL_DIR = path.join(ROOT, 'public/data/telemetry')
const RACES_PATH = path.join(ROOT, 'public/data/races.json')
const DRIVERS_PATH = path.join(ROOT, 'public/data/drivers.json')

const errors = []
const warnings = []
const err = (id, msg) => errors.push(`${id}: ${msg}`)
const warn = (msg) => warnings.push(msg)

const lapSeconds = (s) => {
  const m = /^(\d+):(\d{2}\.\d{3})$/.exec(s)
  if (!m) return null
  return parseInt(m[1], 10) * 60 + parseFloat(m[2])
}
const isFiniteNum = (v) => typeof v === 'number' && Number.isFinite(v)

const races = JSON.parse(fs.readFileSync(RACES_PATH, 'utf8'))
const drivers = JSON.parse(fs.readFileSync(DRIVERS_PATH, 'utf8'))
const driverIds = new Set(drivers.map((d) => d.id))

const seenRaceIds = new Set()
const usedTelemetry = new Set()

for (const r of races) {
  const id = r.id ?? '(no id)'

  // ── race entry shape ──
  for (const f of ['id', 'driverId', 'circuit', 'circuitName', 'year', 'location', 'lapTime', 'telemetryFile']) {
    if (r[f] === undefined || r[f] === null || r[f] === '') err(id, `missing race field "${f}"`)
  }
  if (seenRaceIds.has(id)) err(id, 'duplicate raceId')
  seenRaceIds.add(id)
  if (!driverIds.has(r.driverId)) err(id, `driverId "${r.driverId}" not in drivers.json`)
  if (typeof r.year !== 'number') err(id, `year must be a number (got ${typeof r.year})`)
  const raceLap = lapSeconds(r.lapTime ?? '')
  if (raceLap === null) err(id, `lapTime "${r.lapTime}" not in m:ss.mmm format`)

  // ── telemetry file ──
  if (!r.telemetryFile) continue
  usedTelemetry.add(r.telemetryFile)
  const telPath = path.join(TEL_DIR, `${r.telemetryFile}.json`)
  if (!fs.existsSync(telPath)) { err(id, `telemetry file missing: ${r.telemetryFile}.json`); continue }

  const raw = fs.readFileSync(telPath, 'utf8')
  if (/\bNaN\b|\b-?Infinity\b/.test(raw)) { err(id, 'telemetry contains NaN/Infinity (corrupt)'); continue }
  let t
  try { t = JSON.parse(raw) } catch (e) { err(id, `telemetry is invalid JSON: ${e.message}`); continue }

  // ── the anti-fabrication gate ──
  if (t.source !== 'fastf1') err(id, `telemetry.source must be "fastf1" (got ${JSON.stringify(t.source)}) — real GPS only`)

  // ── metadata agreement ──
  if (t.driverId !== r.driverId) err(id, `telemetry.driverId "${t.driverId}" != race.driverId "${r.driverId}"`)
  if (t.raceId !== r.id) err(id, `telemetry.raceId "${t.raceId}" != race.id "${r.id}"`)
  if (t.lapTime !== r.lapTime) err(id, `telemetry.lapTime "${t.lapTime}" != race.lapTime "${r.lapTime}"`)

  // ── timing consistency ──
  const telLap = lapSeconds(t.lapTime ?? '')
  if (!t.sectors) err(id, 'telemetry.sectors missing')
  else {
    const { s1Time, s2Time, s3Time } = t.sectors
    if (![s1Time, s2Time, s3Time].every(isFiniteNum)) err(id, 'sectors have non-numeric values')
    else if (telLap !== null && Math.abs(s1Time + s2Time + s3Time - telLap) > 0.01)
      err(id, `sectors sum ${(s1Time + s2Time + s3Time).toFixed(3)} != lapTime ${t.lapTime}`)
  }
  if (!t.benchmarkLapTime) err(id, 'telemetry.benchmarkLapTime missing')
  if (!isFiniteNum(t.topSpeed) || t.topSpeed <= 0) err(id, `topSpeed must be > 0 (got ${t.topSpeed})`)
  if (!isFiniteNum(t.averageSpeed) || t.averageSpeed <= 0) err(id, `averageSpeed must be > 0 (got ${t.averageSpeed})`)

  // ── points ──
  if (!Array.isArray(t.points) || t.points.length < 2) { err(id, 'telemetry.points must have ≥2 points'); continue }
  let maxSpeed = 0, ptBad = 0
  for (const p of t.points) {
    if (![p.x, p.y, p.speed, p.distance].every(isFiniteNum)) { ptBad++; continue }
    if (p.speed < 0) ptBad++
    if (p.distance < 0 || p.distance > 1.001) ptBad++
    if (p.speed > maxSpeed) maxSpeed = p.speed
  }
  if (ptBad > 0) err(id, `${ptBad} telemetry point(s) with invalid x/y/speed/distance`)
  if (maxSpeed <= 0) err(id, 'all telemetry speeds are 0 (no real speed data)')
  if (!Array.isArray(t.championshipPoints) || !t.championshipPoints.every(isFiniteNum))
    err(id, 'championshipPoints must be an array of numbers')
}

// ── dataset-level (warnings, non-fatal) ──
const allTel = fs.readdirSync(TEL_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
for (const f of allTel) if (!usedTelemetry.has(f)) warn(`orphan telemetry file (no race references it): ${f}.json`)
const raced = new Set(races.map((r) => r.driverId))
for (const d of drivers) if (!raced.has(d.id)) warn(`driver "${d.id}" has zero races`)

// ── report ──
console.log(`Validated ${races.length} races / ${drivers.length} drivers.`)
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`)
  for (const w of warnings) console.log(`  ⚠ ${w}`)
}
if (errors.length) {
  console.error(`\n${errors.length} error(s):`)
  for (const e of errors) console.error(`  ✗ ${e}`)
  console.error('\nFAILED — fix the above before committing.')
  process.exit(1)
}
console.log('\nOK — every race is backed by real, consistent FastF1 data.')
