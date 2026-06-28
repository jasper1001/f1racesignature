// Geometric racing line from a track centreline.
//
// The "Racing Line" viz used to draw the generated telemetry template, which
// follows the OSM centreline — so the line ran straight down the MIDDLE of the
// track. A real racing line instead uses the full width of the asphalt: it runs
// wide on entry, clips the apex, and runs wide on exit (classic line, double
// apex, hairpin, etc.). We approximate that ideal line with the well-known
// minimum-curvature method: each point may slide laterally within the track
// corridor (±corridorHalf along the centreline normal), and we relax those
// offsets to minimise the path's curvature. The result naturally cuts apexes
// and opens corners — the same shape a driver takes.

export interface Pt {
  x: number
  y: number
}

// Minimum-curvature racing line through a (closed-loop) centreline.
//  - `center`:       ordered centreline points (any coordinate space)
//  - `corridorHalf`: max lateral travel either side of the centreline, in the
//                    same units (≈ half the track width, minus a kerb margin)
// Returns one point per input point, offset onto the racing line.
export function computeRacingLine(
  center: Pt[],
  corridorHalf: number,
  opts?: { iterations?: number; lambda?: number },
): Pt[] {
  const n = center.length
  if (n < 8 || corridorHalf <= 0) return center

  const iterations = opts?.iterations ?? 260
  const lambda = opts?.lambda ?? 0.18

  // Unit left-normal at each point (perpendicular to the local tangent). The
  // racing line can only move along this normal, so it always stays on track.
  const nx = new Array<number>(n)
  const ny = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    const a = center[(i - 1 + n) % n]
    const b = center[(i + 1) % n]
    let tx = b.x - a.x
    let ty = b.y - a.y
    const L = Math.hypot(tx, ty) || 1
    tx /= L
    ty /= L
    nx[i] = -ty
    ny[i] = tx
  }

  // alpha[i] ∈ [-1, 1] = lateral offset as a fraction of corridorHalf.
  const alpha = new Array<number>(n).fill(0)
  const Qx = new Array<number>(n)
  const Qy = new Array<number>(n)

  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < n; i++) {
      Qx[i] = center[i].x + alpha[i] * corridorHalf * nx[i]
      Qy[i] = center[i].y + alpha[i] * corridorHalf * ny[i]
    }
    const next = alpha.slice()
    for (let i = 0; i < n; i++) {
      const p0 = (i - 1 + n) % n
      const p2 = (i + 1) % n
      // Discrete curvature (Laplacian): pull each point toward the average of
      // its neighbours, but only the component along this point's normal counts.
      const lapx = Qx[p0] + Qx[p2] - 2 * Qx[i]
      const lapy = Qy[p0] + Qy[p2] - 2 * Qy[i]
      const d = lapx * nx[i] + lapy * ny[i]
      next[i] = Math.max(-1, Math.min(1, alpha[i] + (lambda * d) / corridorHalf))
    }
    for (let i = 0; i < n; i++) alpha[i] = next[i]
  }

  const out: Pt[] = new Array(n)
  for (let i = 0; i < n; i++) {
    out[i] = {
      x: center[i].x + alpha[i] * corridorHalf * nx[i],
      y: center[i].y + alpha[i] * corridorHalf * ny[i],
    }
  }
  return out
}
