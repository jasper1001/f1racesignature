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
