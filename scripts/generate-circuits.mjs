/**
 * Fetches real F1 circuit GeoJSON from bacinger/f1-circuits and converts
 * each circuit's GPS coordinates to normalized SVG path data for use in
 * the F1RaceSignature poster generator.
 *
 * Run: node scripts/generate-circuits.mjs
 */

const GEOJSON_URL =
  'https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson'

// Which circuits we need — matched by partial name (case-insensitive)
const CIRCUITS_NEEDED = [
  { id: 'monaco',      match: 'monaco' },
  { id: 'silverstone', match: 'silverstone' },
  { id: 'spa',         match: 'spa-francorchamps' },
  { id: 'bahrain',     match: 'bahrain' },
  { id: 'abu_dhabi',   match: 'yas marina' },
  { id: 'suzuka',      match: 'suzuka' },
  { id: 'interlagos',  match: 'interlagos' },
  { id: 'monza',       match: 'monza' },
  { id: 'hungaroring', match: 'hungaroring' },
]

// Target SVG viewport (matches circuits.json viewBox)
const SVG_W = 500
const SVG_H = 420
const PAD   = 40   // padding inside the viewBox

function coordsToSvgPath(coords) {
  if (!coords || coords.length < 2) return ''

  // Compute bounding box
  let minLon = Infinity, maxLon = -Infinity
  let minLat = Infinity, maxLat = -Infinity
  for (const [lon, lat] of coords) {
    if (lon < minLon) minLon = lon
    if (lon > maxLon) maxLon = lon
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }

  const lonRange = maxLon - minLon || 1
  const latRange = maxLat - minLat || 1

  // Keep aspect ratio — fit within PAD-inset viewBox
  const availW = SVG_W - PAD * 2
  const availH = SVG_H - PAD * 2
  const scale  = Math.min(availW / lonRange, availH / latRange)

  // Center the circuit in the viewBox
  const usedW = lonRange * scale
  const usedH = latRange * scale
  const offX  = PAD + (availW - usedW) / 2
  const offY  = PAD + (availH - usedH) / 2

  const project = ([lon, lat]) => {
    const x = offX + (lon - minLon) * scale
    // latitude increases north → flip for SVG (y increases down)
    const y = offY + usedH - (lat - minLat) * scale
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10]
  }

  const pts = coords.map(project)

  // Build an SVG path from the projected points
  const d = pts
    .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(' ')

  // Close the path only if start ≈ end (within 5px)
  const [x0, y0] = pts[0]
  const [xl, yl] = pts[pts.length - 1]
  const closed = Math.hypot(xl - x0, yl - y0) < 5

  return closed ? d + ' Z' : d + ' Z'
}

async function main() {
  console.log('Fetching GeoJSON…')
  const res  = await fetch(GEOJSON_URL)
  const json = await res.json()

  const features = json.features ?? []
  console.log(`Loaded ${features.length} circuit features`)

  const result = {}

  for (const { id, match } of CIRCUITS_NEEDED) {
    const feature = features.find((f) => {
      const name = (
        f.properties?.Name ??
        f.properties?.name ??
        f.properties?.circuit ??
        ''
      ).toLowerCase()
      return name.includes(match)
    })

    if (!feature) {
      console.warn(`  ⚠ Not found: ${id} (looking for "${match}")`)
      continue
    }

    const geom   = feature.geometry
    let coords   = []

    if (geom.type === 'LineString') {
      coords = geom.coordinates
    } else if (geom.type === 'MultiLineString') {
      coords = geom.coordinates.flat()
    } else if (geom.type === 'Polygon') {
      coords = geom.coordinates[0]
    }

    const path = coordsToSvgPath(coords)
    const name = feature.properties?.Name ?? feature.properties?.name ?? id

    result[id] = {
      id,
      name,
      location: feature.properties?.Location ?? '',
      lapLength: feature.properties?.length ?? 0,
      corners:   feature.properties?.corners ?? 0,
      drsZones:  feature.properties?.drs ?? 0,
      viewBox:   `0 0 ${SVG_W} ${SVG_H}`,
      path,
      sector1End: 0.33,
      sector2End: 0.67,
      pointCount: coords.length,
    }

    console.log(`  ✓ ${id} — ${coords.length} points`)
  }

  // Write to public/data/circuits.json
  const fs = await import('fs')
  const outPath = new URL('../public/data/circuits.json', import.meta.url).pathname
    .replace(/^\/([A-Z]:)/, '$1') // strip leading slash on Windows paths

  fs.writeFileSync(outPath, JSON.stringify(result, null, 2))
  console.log(`\nWritten to public/data/circuits.json`)
}

main().catch(console.error)
