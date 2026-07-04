// Geometric racing line from a track centreline.
//
// The "Racing Line" viz draws the OSM centreline as a to-scale asphalt ribbon
// and overlays an ideal racing line inside it. A real racing line uses the full
// width of the asphalt: wide on entry, clip the apex, wide on exit.
//
// Earlier versions computed this with a min-curvature relaxation (minimise
// Σ|Q₋₁ − 2Q + Q₊₁|² over lateral offsets). That energy is discretisation-
// dependent — the optimum shrinks as sampling gets finer, and at our ~15-20m
// sample spacing its converged solution cuts corners on the inside without ever
// swinging wide on entry, so tight hairpins didn't read as a racing line.
//
// This version is a deterministic geometric planner instead:
//   1. resample the centreline to uniform arc length (input resolution no
//      longer affects the result),
//   2. detect corners from smoothed signed curvature (threshold + minimum
//      total turn, nearby same-direction segments merged),
//   3. place control offsets per corner — apex pinned toward the inside kerb,
//      entry/exit pushed to the outside, lead length ∝ √(radius · corridor),
//      amplitudes scaled by corner severity so gentle kinks stay near centre,
//   4. cosine-interpolate between control points and lightly smooth.
// Closed form: no iteration, no convergence concerns, ~1ms per track.

export interface Pt {
  x: number
  y: number
}

// Snap a GPS lap onto the track ribbon. Stored telemetry frames drift off the
// OSM centreline on some circuits (their reference outline was distorted when
// the telemetry was co-registered), so head-to-head lines can leave the drawn
// asphalt. Two stages:
//   1. similarity ICP (rotation + uniform scale + translation, outlier-trimmed)
//      against the centreline — removes the systematic frame error,
//   2. lateral clamp — any residual excursion beyond the corridor is pulled
//      back to the kerb, preserving each driver's line WITHIN the track width.
export function alignLapToTrack(lap: Pt[], center: Pt[], corridorHalf: number, lapFrac?: number[]): Pt[] {
  const n = lap.length
  const m = center.length
  if (n < 8 || m < 8 || corridorHalf <= 0) return lap

  const nearestIdx = (p: Pt): number => {
    let best = Infinity
    let bi = 0
    for (let j = 0; j < m; j++) {
      const d = (p.x - center[j].x) ** 2 + (p.y - center[j].y) ** 2
      if (d < best) {
        best = d
        bi = j
      }
    }
    return bi
  }

  let cur = lap.map((p) => ({ x: p.x, y: p.y }))
  let totalScale = 1
  for (let iter = 0; iter < 10; iter++) {
    const dst = cur.map((p) => center[nearestIdx(p)])
    const resid = cur.map((p, i) => Math.hypot(p.x - dst[i].x, p.y - dst[i].y))
    // Trim the worst pairs so off-ribbon excursions don't steer the fit.
    const sorted = [...resid].sort((a, b) => a - b)
    const cut = sorted[Math.floor(sorted.length * 0.7)] * 1.4 + 1e-6
    let sx = 0, sy = 0, dx = 0, dy = 0, k = 0
    for (let i = 0; i < n; i++) if (resid[i] <= cut) { sx += cur[i].x; sy += cur[i].y; dx += dst[i].x; dy += dst[i].y; k++ }
    if (k < 8) break
    sx /= k; sy /= k; dx /= k; dy /= k
    // Umeyama similarity: rotation from the cross/dot sums, scale from the ratio.
    let num = 0, den = 0, ss = 0
    for (let i = 0; i < n; i++) {
      if (resid[i] > cut) continue
      const px = cur[i].x - sx, py = cur[i].y - sy
      const qx = dst[i].x - dx, qy = dst[i].y - dy
      num += px * qy - py * qx
      den += px * qx + py * qy
      ss += px * px + py * py
    }
    const th = Math.atan2(num, den)
    const c = Math.cos(th), s = Math.sin(th)
    // Bounded scale — CUMULATIVE across iterations. A per-iteration bound
    // compounds (0.9¹⁰ ≈ 0.35) and lets a trimmed fit progressively collapse
    // the lap onto whatever subsection happens to match best.
    let scale = (c * den + s * num) / (ss || 1)
    scale = Math.max(0.9 / totalScale, Math.min(1.1 / totalScale, scale))
    totalScale *= scale
    cur = cur.map((p) => {
      const px = p.x - sx, py = p.y - sy
      return { x: (px * c - py * s) * scale + dx, y: (px * s + py * c) * scale + dy }
    })
    if (Math.abs(th) < 1e-5 && Math.abs(scale - 1) < 1e-5) break
  }

  return snapToCorridor(cur, center, corridorHalf, lapFrac)
}

// Radial clamp to the corridor (small margin keeps the line off the kerb
// paint). Capping the distance to the nearest centreline point — rather than
// only the lateral component — guarantees the line stays on the ribbon even
// where the residual frame error is diagonal (non-rigid distortion).
//
// Matching is paced by LAP-DISTANCE FRACTION: the lap traverses the whole
// track once, so the point at fraction f of the lap should match near
// centreline node f·m (plus an anchor offset, in the lap's travel direction),
// refined within a local window. A global nearest search teleports across the
// track where two sections run close together; a previous-match feedback walk
// can lose lock at a data gap and pile the rest of the lap onto one section.
// Pass `frac` (per-point 0..1 REAL lap-distance from telemetry) when you have
// it — the drawn polyline's own arc length is distorted on exactly the
// circuits that need this clamp most, real distance is not.
export function snapToCorridor(pts: Pt[], center: Pt[], corridorHalf: number, frac?: number[]): Pt[] {
  const m = center.length
  const n = pts.length
  if (m < 2 || n < 2 || corridorHalf <= 0) return pts
  const bound = corridorHalf * 0.95

  // Lap fraction per point: real telemetry distance when provided, else the
  // polyline's cumulative length.
  let cum: number[]
  let total: number
  if (frac && frac.length === n) {
    cum = frac
    total = frac[n - 1] || 1
  } else {
    cum = new Array<number>(n).fill(0)
    for (let i = 1; i < n; i++) cum[i] = cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
    total = cum[n - 1] || 1
  }

  // Anchor: global nearest centreline node for the lap's first point.
  let anchor = 0
  {
    let best = Infinity
    for (let k = 0; k < m; k++) {
      const d = (pts[0].x - center[k].x) ** 2 + (pts[0].y - center[k].y) ** 2
      if (d < best) {
        best = d
        anchor = k
      }
    }
  }

  // Travel direction: does the lap run with increasing or decreasing node
  // index? Score both hypotheses on a spread of probe points.
  const cost = (dir: 1 | -1) => {
    let sum = 0
    for (let s = 1; s <= 8; s++) {
      const i = Math.floor((s / 9) * (n - 1))
      const e = (anchor + dir * Math.round((cum[i] / total) * m) + 2 * m) % m
      sum += (pts[i].x - center[e].x) ** 2 + (pts[i].y - center[e].y) ** 2
    }
    return sum
  }
  const dir = cost(1) <= cost(-1) ? 1 : -1

  // ±window around the expected node — generous enough for pacing error
  // (corners vs straights), far too small to reach a different track section.
  const W = Math.max(8, Math.round(m * 0.08))

  return pts.map((p, i) => {
    const e = (anchor + dir * Math.round((cum[i] / total) * m) + 2 * m) % m
    let best = Infinity
    let j = e
    for (let o = -W; o <= W; o++) {
      const k = (e + o + 2 * m) % m
      const d = (p.x - center[k].x) ** 2 + (p.y - center[k].y) ** 2
      if (d < best) {
        best = d
        j = k
      }
    }
    const dx = p.x - center[j].x
    const dy = p.y - center[j].y
    const d = Math.hypot(dx, dy)
    if (d <= bound) return p
    const k = bound / d
    return { x: center[j].x + dx * k, y: center[j].y + dy * k }
  })
}

// Full lap→ribbon projection by RECONSTRUCTION. Some stored laps are
// non-rigidly distorted against the OSM ribbon (worst case ~2.5 track widths):
// no similarity transform maps them on, and clamping points where they lie
// preserves the distorted spacing, bunching the lap onto part of the circuit.
// Instead, rebuild every drawn point from the two things we can trust:
//   - LONGITUDINAL position: the telemetry's real lap-distance fraction, laid
//     out along the centreline's own arc length (immune to frame distortion),
//   - LATERAL position: the coarsely-aligned lap's signed offset from the
//     centreline, clamped to the corridor and lightly smoothed.
// Output is densely sampled (~4 points per input), so segments cannot chord
// across corners; full-lap coverage is guaranteed by construction. `frac` maps
// each output point to its fractional index in the ORIGINAL lap, for
// interpolating speed/throttle/brake.
export function projectLapToRibbon(
  lap: Pt[],
  center: Pt[],
  corridorHalf: number,
  lapFrac?: number[],
): { pts: Pt[]; frac: number[] } {
  const n = lap.length
  const m = center.length
  if (n < 8 || m < 8 || corridorHalf <= 0) return { pts: lap, frac: lap.map((_, i) => i) }

  // Per-point lap fraction: real telemetry distance when provided (sanitised to
  // be non-decreasing), else the drawn polyline's cumulative length.
  const f = new Array<number>(n)
  if (lapFrac && lapFrac.length === n) {
    let prev = 0
    for (let i = 0; i < n; i++) {
      prev = Math.max(prev, Math.min(1, lapFrac[i] ?? 0))
      f[i] = prev
    }
  } else {
    let acc = 0
    f[0] = 0
    for (let i = 1; i < n; i++) {
      acc += Math.hypot(lap[i].x - lap[i - 1].x, lap[i].y - lap[i - 1].y)
      f[i] = acc
    }
    const total = acc || 1
    for (let i = 0; i < n; i++) f[i] /= total
  }

  // Coarse rigid registration (rotation/scale/translation) so the lateral
  // offsets we sample below are measured in roughly the right frame.
  const aligned = alignLapToTrack(lap, center, corridorHalf, f)

  // Centreline arc-length table + samplers (cyclic).
  const cum = new Array<number>(m + 1).fill(0)
  for (let j = 1; j <= m; j++) {
    const a = center[j - 1]
    const b = center[j % m]
    cum[j] = cum[j - 1] + Math.hypot(b.x - a.x, b.y - a.y)
  }
  const L = cum[m] || 1
  const atArc = (s: number): { x: number; y: number; nx: number; ny: number } => {
    let t = s % L
    if (t < 0) t += L
    let j = 0
    while (j < m - 1 && cum[j + 1] < t) j++
    const seg = cum[j + 1] - cum[j] || 1
    const u = (t - cum[j]) / seg
    const a = center[j]
    const b = center[(j + 1) % m]
    const x = a.x + (b.x - a.x) * u
    const y = a.y + (b.y - a.y) * u
    // Normal from the segment tangent (left normal).
    let tx = b.x - a.x, ty = b.y - a.y
    const tl = Math.hypot(tx, ty) || 1
    return { x, y, nx: -ty / tl, ny: tx / tl }
  }

  // Anchor arc position: nearest centreline node to the aligned first point.
  let anchorS = 0
  {
    let best = Infinity
    for (let j = 0; j < m; j++) {
      const d = (aligned[0].x - center[j].x) ** 2 + (aligned[0].y - center[j].y) ** 2
      if (d < best) {
        best = d
        anchorS = cum[j]
      }
    }
  }
  // Travel direction along the centreline: score both on a spread of probes.
  const cost = (dir: 1 | -1) => {
    let sum = 0
    for (let s = 1; s <= 8; s++) {
      const i = Math.floor((s / 9) * (n - 1))
      const c = atArc(anchorS + dir * f[i] * L)
      sum += (aligned[i].x - c.x) ** 2 + (aligned[i].y - c.y) ** 2
    }
    return sum
  }
  const dir = cost(1) <= cost(-1) ? 1 : -1

  // Signed lateral offset of each aligned point at its distance-true arc
  // position, clamped to the corridor, then lightly smoothed along the lap.
  const bound = corridorHalf * 0.95
  const lat = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    const c = atArc(anchorS + dir * f[i] * L)
    const d = (aligned[i].x - c.x) * c.nx + (aligned[i].y - c.y) * c.ny
    lat[i] = Math.max(-bound, Math.min(bound, d))
  }
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 1; i < n - 1; i++) lat[i] = (lat[i - 1] + 2 * lat[i] + lat[i + 1]) / 4
  }

  // Emit densely: 4 samples per input point, lateral interpolated between
  // neighbouring lap points, longitudinal swept along the centreline arc.
  const K = 4 * n
  const pts = new Array<Pt>(K)
  const frac = new Array<number>(K)
  for (let k = 0; k < K; k++) {
    const fi = (k / (K - 1)) * (n - 1)
    const i = Math.min(n - 2, Math.floor(fi))
    const t = fi - i
    const fk = f[i] + (f[i + 1] - f[i]) * t
    const lk = lat[i] + (lat[i + 1] - lat[i]) * t
    const c = atArc(anchorS + dir * fk * L)
    pts[k] = { x: c.x + lk * c.nx, y: c.y + lk * c.ny }
    frac[k] = fi
  }
  return { pts, frac }
}

// Two drivers' laps of the same circuit differ by only a car-width or two — real,
// but invisible at a scale that shows the whole track. To compare their lines we
// therefore build a shared reference (the mean of the two laps, matched by real
// lap-distance so corners line up) and AMPLIFY each driver's lateral deviation from
// it by `gain`, clamped so the lines stay within a drawable corridor. The result:
// where both drivers took the same line the two lines converge; where they picked
// different apexes they visibly fan apart — the actual comparison, legible full-lap.
//
// All coordinates are in one shared space (caller's choice — we use PATH space, so
// the exaggeration is aspect-correct). `distance` (real per-point lap distance) is
// used to correspond the two laps; index fraction is the fallback.
export function separatedComparisonLines(
  lapA: { x: number; y: number; distance?: number }[],
  lapB: { x: number; y: number; distance?: number }[],
  opts?: { gain?: number; maxHalf?: number; samples?: number },
): { center: Pt[]; a: Pt[]; b: Pt[] } {
  const gain = opts?.gain ?? 3.2
  const maxHalf = opts?.maxHalf ?? Infinity
  const K = opts?.samples ?? 400

  // Non-decreasing 0..1 lap fraction per point: real distance when present, else index.
  const fracOf = (lap: { distance?: number }[]): number[] => {
    const n = lap.length
    const hasDist = lap.every((p) => typeof p.distance === 'number')
    const f = new Array<number>(n)
    if (hasDist) {
      const d0 = lap[0].distance as number
      const dN = lap[n - 1].distance as number
      const span = dN - d0 || 1
      let prev = 0
      for (let i = 0; i < n; i++) {
        prev = Math.max(prev, Math.min(1, ((lap[i].distance as number) - d0) / span))
        f[i] = prev
      }
    } else {
      for (let i = 0; i < n; i++) f[i] = i / Math.max(1, n - 1)
    }
    return f
  }
  // Sample a lap at lap-fraction `t` (0..1) by interpolating between bracketing points.
  const sampleAt = (lap: Pt[], f: number[], t: number): Pt => {
    let i = 0
    while (i < f.length - 2 && f[i + 1] < t) i++
    const span = f[i + 1] - f[i] || 1
    const u = Math.min(1, Math.max(0, (t - f[i]) / span))
    return { x: lap[i].x + (lap[i + 1].x - lap[i].x) * u, y: lap[i].y + (lap[i + 1].y - lap[i].y) * u }
  }

  const fa = fracOf(lapA)
  const fb = fracOf(lapB)
  const A = lapA.map((p) => ({ x: p.x, y: p.y }))
  const B = lapB.map((p) => ({ x: p.x, y: p.y }))

  // Reference = mean of the two laps at each matched fraction, lightly smoothed.
  const center = new Array<Pt>(K)
  const as = new Array<Pt>(K)
  const bs = new Array<Pt>(K)
  for (let k = 0; k < K; k++) {
    const t = k / (K - 1)
    const pa = sampleAt(A, fa, t)
    const pb = sampleAt(B, fb, t)
    as[k] = pa
    bs[k] = pb
    center[k] = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 }
  }
  const smooth = (pts: Pt[], passes: number) => {
    for (let p = 0; p < passes; p++) {
      const prev = pts.map((q) => ({ ...q }))
      for (let i = 1; i < pts.length - 1; i++) {
        pts[i] = { x: (prev[i - 1].x + 2 * prev[i].x + prev[i + 1].x) / 4, y: (prev[i - 1].y + 2 * prev[i].y + prev[i + 1].y) / 4 }
      }
    }
  }
  smooth(center, 3)

  // Push each driver out from the reference along its local normal, amplified.
  const a = new Array<Pt>(K)
  const b = new Array<Pt>(K)
  for (let k = 0; k < K; k++) {
    const p = center[(k - 1 + K) % K]
    const n = center[(k + 1) % K]
    let tx = n.x - p.x, ty = n.y - p.y
    const tl = Math.hypot(tx, ty) || 1
    const nx = -ty / tl, ny = tx / tl
    const offA = Math.max(-maxHalf, Math.min(maxHalf, ((as[k].x - center[k].x) * nx + (as[k].y - center[k].y) * ny) * gain))
    const offB = Math.max(-maxHalf, Math.min(maxHalf, ((bs[k].x - center[k].x) * nx + (bs[k].y - center[k].y) * ny) * gain))
    a[k] = { x: center[k].x + nx * offA, y: center[k].y + ny * offA }
    b[k] = { x: center[k].x + nx * offB, y: center[k].y + ny * offB }
  }
  smooth(a, 1)
  smooth(b, 1)
  return { center, a, b }
}

// Resample a closed polyline to `m` points at uniform arc-length spacing.
function resampleUniform(pts: Pt[], m: number): { pts: Pt[]; ds: number } {
  const n = pts.length
  const cum = [0]
  for (let i = 1; i <= n; i++) {
    const a = pts[i - 1]
    const b = pts[i % n]
    cum.push(cum[i - 1] + Math.hypot(b.x - a.x, b.y - a.y))
  }
  const total = cum[n]
  const out = new Array<Pt>(m)
  let seg = 0
  for (let k = 0; k < m; k++) {
    const t = (k / m) * total
    while (seg < n - 1 && cum[seg + 1] < t) seg++
    const span = cum[seg + 1] - cum[seg] || 1
    const f = (t - cum[seg]) / span
    const a = pts[seg]
    const b = pts[(seg + 1) % n]
    out[k] = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
  }
  return { pts: out, ds: total / m }
}

// Cyclic Gaussian smoothing of a scalar field.
function gaussSmooth(v: number[], sigma: number): number[] {
  const n = v.length
  const r = Math.max(1, Math.ceil(sigma * 3))
  const w: number[] = []
  for (let k = -r; k <= r; k++) w.push(Math.exp(-(k * k) / (2 * sigma * sigma)))
  const ws = w.reduce((a, b) => a + b, 0)
  const out = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    let s = 0
    for (let k = -r; k <= r; k++) s += w[k + r] * v[(i + k + n) % n]
    out[i] = s / ws
  }
  return out
}

interface Corner {
  start: number
  end: number
  apex: number
  kApex: number
  dir: number // sign of curvature at apex (+ = left turn)
}

// Geometric racing line through a (closed-loop) centreline.
//  - `center`:       ordered centreline points, wrapping as a loop (the caller
//                    should drop any duplicated closing point)
//  - `corridorHalf`: max lateral travel either side of the centreline, in the
//                    same units (≈ half the track width, minus a kerb margin)
// Returns the line resampled at `opts.points` (default 600) uniform arc-length
// samples — NOT one point per input point; callers treat it as a polyline.
export function computeRacingLine(
  center: Pt[],
  corridorHalf: number,
  opts?: { points?: number },
): Pt[] {
  const nIn = center.length
  if (nIn < 8 || corridorHalf <= 0) return center
  const m = opts?.points ?? 600

  const { pts, ds } = resampleUniform(center, m)

  // Signed curvature (turn angle per arc length), smoothed at ~2-sample scale
  // so single-vertex kinks in the OSM data don't register as corners.
  let kappa = new Array<number>(m)
  for (let i = 0; i < m; i++) {
    const a = pts[(i - 1 + m) % m]
    const b = pts[i]
    const c = pts[(i + 1) % m]
    const v1x = b.x - a.x, v1y = b.y - a.y
    const v2x = c.x - b.x, v2y = c.y - b.y
    kappa[i] = Math.atan2(v1x * v2y - v1y * v2x, v1x * v2x + v1y * v2y) / ds
  }
  kappa = gaussSmooth(kappa, 2)

  // Corner segments: contiguous runs tighter than radius ≈ 10 corridor halves.
  const kThresh = 1 / (corridorHalf * 10)
  const minTurnRad = (12 * Math.PI) / 180
  const inCorner = kappa.map((k) => Math.abs(k) > kThresh)
  const segs: { start: number; end: number }[] = []
  {
    // Scan from a point on a straight so no segment straddles the seam.
    let i0 = 0
    while (i0 < m && inCorner[i0]) i0++
    if (i0 === m) i0 = 0
    let start = -1
    for (let k = 0; k <= m; k++) {
      const j = (i0 + k) % m
      if (k < m && inCorner[j]) {
        if (start < 0) start = j
      } else if (start >= 0) {
        segs.push({ start, end: (j - 1 + m) % m })
        start = -1
      }
    }
  }
  // Merge nearby same-direction segments (double apex → one corner).
  const gapMin = Math.round(m / 100)
  const midOf = (s: { start: number; end: number }) =>
    (s.start + Math.floor(((s.end - s.start + m) % m) / 2)) % m
  for (let k = segs.length - 1; k > 0; k--) {
    const prev = segs[k - 1]
    const cur = segs[k]
    const gap = (cur.start - prev.end + m) % m
    if (gap <= gapMin && Math.sign(kappa[midOf(prev)]) === Math.sign(kappa[midOf(cur)])) {
      prev.end = cur.end
      segs.splice(k, 1)
    }
  }
  // Keep segments with enough total turn; find each corner's apex + severity.
  const corners: Corner[] = []
  for (const seg of segs) {
    const len = ((seg.end - seg.start + m) % m) + 1
    let turn = 0
    let apex = seg.start
    let best = 0
    for (let k = 0; k < len; k++) {
      const j = (seg.start + k) % m
      turn += Math.abs(kappa[j]) * ds
      if (Math.abs(kappa[j]) > best) {
        best = Math.abs(kappa[j])
        apex = j
      }
    }
    if (turn < minTurnRad) continue
    corners.push({ start: seg.start, end: seg.end, apex, kApex: best, dir: Math.sign(kappa[apex]) })
  }

  // Control offsets: apex toward the inside kerb, entry/exit toward the outside,
  // both scaled by corner severity so gentle kinks don't command the full width.
  const alpha = new Array<number>(m).fill(0)
  if (corners.length >= 1) {
    const severity = (c: Corner) => Math.max(0, Math.min(1, (c.kApex - kThresh) / (3 * kThresh)))
    const ctrl: { idx: number; val: number }[] = []
    for (let ci = 0; ci < corners.length; ci++) {
      const c = corners[ci]
      const prev = corners[(ci - 1 + corners.length) % corners.length]
      const next = corners[(ci + 1) % corners.length]
      const s = severity(c)
      const apexAmp = 0.45 + 0.55 * s
      const outAmp = 0.85 * apexAmp
      // Lead ∝ √(R · corridor): the arc over which drifting one track width
      // costs less turning than the corner saves. Clamped to half the gap to
      // the neighbouring corner so control points never cross.
      const R = 1 / Math.max(1e-6, c.kApex)
      const lead = Math.round(Math.max(3, (2.2 * Math.sqrt(R * corridorHalf)) / ds))
      const leadIn = Math.min(lead, Math.max(2, Math.floor(((c.start - prev.end + m) % m) / 2)))
      const leadOut = Math.min(lead, Math.max(2, Math.floor(((next.start - c.end + m) % m) / 2)))
      ctrl.push({ idx: (c.start - leadIn + m) % m, val: -c.dir * outAmp })
      ctrl.push({ idx: c.apex, val: c.dir * apexAmp })
      ctrl.push({ idx: (c.end + leadOut) % m, val: -c.dir * outAmp })
    }
    // Sort along the lap and merge clusters (chicanes produce conflicting
    // controls a few samples apart — average them, weighted by amplitude).
    ctrl.sort((a, b) => a.idx - b.idx)
    const win = Math.max(2, Math.round(m / 120))
    const merged: { idx: number; val: number }[] = []
    for (const c of ctrl) {
      const last = merged[merged.length - 1]
      if (last && c.idx - last.idx <= win) {
        const wA = Math.abs(last.val)
        const wB = Math.abs(c.val)
        last.val = (last.val * wA + c.val * wB) / (wA + wB || 1)
        last.idx = Math.round((last.idx + c.idx) / 2)
      } else merged.push({ ...c })
    }
    if (merged.length >= 2) {
      const first = merged[0]
      const last = merged[merged.length - 1]
      if (first.idx + m - last.idx <= win) {
        const wA = Math.abs(last.val)
        const wB = Math.abs(first.val)
        first.val = (first.val * wB + last.val * wA) / (wA + wB || 1)
        merged.pop()
      }
    }
    if (merged.length === 1) {
      alpha.fill(merged[0].val)
    } else {
      // Cosine easing between consecutive control points (cyclic): C¹ smooth,
      // no overshoot, holds each control value exactly at its index.
      for (let k = 0; k < merged.length; k++) {
        const a = merged[k]
        const b = merged[(k + 1) % merged.length]
        const span = ((b.idx - a.idx + m) % m) || m
        for (let t = 0; t <= span; t++) {
          const u = (1 - Math.cos(Math.PI * (t / span))) / 2
          alpha[(a.idx + t) % m] = a.val * (1 - u) + b.val * u
        }
      }
    }
  }

  const sm = gaussSmooth(alpha, 2.5).map((v) => Math.max(-1, Math.min(1, v)))

  const raw = new Array<Pt>(m)
  for (let i = 0; i < m; i++) {
    const a = pts[(i - 1 + m) % m]
    const b = pts[(i + 1) % m]
    const tx = b.x - a.x
    const ty = b.y - a.y
    const L = Math.hypot(tx, ty) || 1
    raw[i] = {
      x: pts[i].x + sm[i] * corridorHalf * (-ty / L),
      y: pts[i].y + sm[i] * corridorHalf * (tx / L),
    }
  }

  // De-fold the offset curve. Where the inside offset exceeds the centreline's
  // local corner radius (hairpin tips), the offset curve folds back on itself —
  // a self-intersecting loop that renders as a sharp cusp. Standard offset-curve
  // cleanup: drop points that move BACKWARD against the local track direction,
  // which collapses each loop into a chord across the corner tip (the same
  // shortcut a driver takes — at those tips the "inside" is all asphalt, because
  // the ribbon's half-width exceeds the tip radius). Then smooth the survivors
  // and resample back to a uniform polyline.
  const kept: Pt[] = []
  for (let i = 0; i < m; i++) {
    const a = pts[(i - 1 + m) % m]
    const b = pts[(i + 1) % m]
    const txc = b.x - a.x
    const tyc = b.y - a.y
    if (kept.length === 0) {
      kept.push(raw[i])
      continue
    }
    const last = kept[kept.length - 1]
    // Keep only points that advance along the centreline's direction of travel.
    if ((raw[i].x - last.x) * txc + (raw[i].y - last.y) * tyc > 0) kept.push(raw[i])
  }
  // Iterative despike: the forward pass can miss folds at the wrap seam or
  // stacked double-folds. Any surviving vertex turning sharper than ~65° in one
  // step is a residual cusp, not a drivable arc — drop it and re-check until
  // stable (bounded passes; each pass strictly shrinks the polyline).
  let poly = kept
  for (let pass = 0; pass < 8; pass++) {
    const k = poly.length
    if (k < 8) break
    const next: Pt[] = []
    for (let i = 0; i < k; i++) {
      const a = poly[(i - 1 + k) % k]
      const b = poly[i]
      const c = poly[(i + 1) % k]
      const v1x = b.x - a.x, v1y = b.y - a.y
      const v2x = c.x - b.x, v2y = c.y - b.y
      const ang = Math.abs(Math.atan2(v1x * v2y - v1y * v2x, v1x * v2x + v1y * v2y))
      if (ang < 1.15) next.push(b)
    }
    if (next.length === poly.length) break
    poly = next
  }
  const xs = gaussSmooth(poly.map((p) => p.x), 1.8)
  const ys = gaussSmooth(poly.map((p) => p.y), 1.8)
  const cleaned = xs.map((x, i) => ({ x, y: ys[i] }))
  return resampleUniform(cleaned, m).pts
}
