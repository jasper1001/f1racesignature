import 'server-only'
import fs from 'fs'
import path from 'path'
import type { Driver, Race, Circuit, Telemetry } from './types'

const DATA_DIR = path.join(process.cwd(), 'public', 'data')

function read<T>(rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, rel), 'utf8')) as T
}

export function getAllDrivers(): Driver[] {
  return read<Driver[]>('drivers.json')
}

export function getAllRaces(): Race[] {
  return read<Race[]>('races.json')
}

export function getAllCircuits(): Record<string, Circuit> {
  return read<Record<string, Circuit>>('circuits.json')
}

export function getDriver(id: string): Driver | undefined {
  return getAllDrivers().find((d) => d.id === id)
}

export function getRace(id: string): Race | undefined {
  return getAllRaces().find((r) => r.id === id)
}

export function getRacesForDriver(driverId: string): Race[] {
  return getAllRaces().filter((r) => r.driverId === driverId)
}

export function getTelemetry(file: string): Telemetry | null {
  try {
    return read<Telemetry>(`telemetry/${file}.json`)
  } catch {
    return null
  }
}

export function telemetryExists(file: string): boolean {
  return fs.existsSync(path.join(DATA_DIR, 'telemetry', `${file}.json`))
}

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '')
}

/**
 * Map live race winners (from the F1 API) to curated Studio laps. Returns a
 * lookup keyed by round, but ONLY for winners we actually have real telemetry
 * for at that circuit + year — so the results page can show a "View on Studio"
 * link without ever pointing at missing or fabricated data. Reads the data
 * files once and matches on driver family name + circuit name.
 */
export function findStudioLapsForWinners(
  winners: { round: string; familyName: string; circuitName: string }[],
  year: number,
): Record<string, { driverId: string; raceId: string }> {
  const drivers = getAllDrivers()
  const races = getAllRaces().filter((r) => r.year === year)
  const out: Record<string, { driverId: string; raceId: string }> = {}

  for (const w of winners) {
    const fam = norm(w.familyName)
    const circ = norm(w.circuitName)
    if (!fam || !circ) continue

    for (const r of races) {
      const rc = norm(r.circuitName)
      if (rc !== circ && !rc.includes(circ) && !circ.includes(rc)) continue
      const d = drivers.find((dr) => dr.id === r.driverId)
      if (!d || !norm(d.name).includes(fam)) continue
      if (!telemetryExists(r.telemetryFile)) continue
      out[w.round] = { driverId: r.driverId, raceId: r.id }
      break
    }
  }
  return out
}
