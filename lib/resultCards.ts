'use client'

// Shareable result cards: 1200×630 PNGs drawn entirely on a client-side
// canvas (no external assets, so the strict CSP is never an issue). Specs are
// plain serializable objects, so server components can build them and pass
// them straight to the <ShareCardButton> client leaf.

export interface StandingsCardSpec {
  type: 'standings'
  eyebrow: string
  title: string
  sub?: string
  credit?: string
  /** Up to 10 rows, already ordered. */
  rows: { pos: string; name: string; color: string; points: string }[]
}

export interface PodiumCardSpec {
  type: 'podium'
  eyebrow: string
  title: string
  sub?: string
  credit?: string
  /** P1–P3, in order. */
  rows: { name: string; team: string; color: string; detail?: string }[]
}

export interface PredictionCardSpec {
  type: 'prediction'
  eyebrow: string
  title: string
  sub?: string
  credit?: string
  total: number
  max: number
  username?: string
  rank?: number
  rows: { label: string; pick: string; result: 'exact' | 'partial' | 'miss' }[]
}

export type CardSpec = StandingsCardSpec | PodiumCardSpec | PredictionCardSpec

/** 'wide' = 1200×630 (posts, link previews) · 'story' = 1080×1920 (TikTok/Reels/Stories). */
export type CardFormat = 'wide' | 'story'

export const CARD_W = 1200
export const CARD_H = 630
export const STORY_W = 1080
export const STORY_H = 1920
const SCALE = 2 // export at 2× so text stays crisp on retina screens

// Site palette (matches globals.css / Tailwind usage across the app).
const GOLD = '#d4a017'
const BG = '#050505'
const PANEL = '#0a0a0a'
const BORDER = '#1f1f1f'
const WHITE = '#ffffff'
const DIM = 'rgba(255,255,255,0.65)'
const GREEN = '#22c55e'
const MEDALS = ['#d4a017', '#b8b8b8', '#cd7f32']

// The site's display face is italic Georgia (see .font-display in globals.css);
// both faces below are system fonts, so the canvas needs no font loading.
const DISPLAY = 'Georgia, "Times New Roman", serif'
const SANS = '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
const MONO = 'ui-monospace, "Cascadia Mono", "Segoe UI Mono", Menlo, Consolas, monospace'

const MARGIN = 80

type Ctx = CanvasRenderingContext2D

function roundedRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Uppercase mono text with manual letter-spacing (canvas has no reliable letterSpacing). */
function tracked(ctx: Ctx, text: string, x: number, y: number, spacing: number, align: 'left' | 'right' | 'center' = 'left') {
  const chars = [...text.toUpperCase()]
  const prev = ctx.textAlign
  ctx.textAlign = 'left'
  let width = -spacing
  for (const c of chars) width += ctx.measureText(c).width + spacing
  let cx = align === 'right' ? x - width : align === 'center' ? x - width / 2 : x
  for (const c of chars) {
    ctx.fillText(c, cx, y)
    cx += ctx.measureText(c).width + spacing
  }
  ctx.textAlign = prev
}

/** Shrinks the font size until `text` fits `maxWidth`. Returns the size used. */
function fitFont(ctx: Ctx, text: string, style: string, startSize: number, minSize: number, maxWidth: number): number {
  let size = startSize
  while (size > minSize) {
    ctx.font = style.replace('{s}', String(size))
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 2
  }
  ctx.font = style.replace('{s}', String(size))
  return size
}

// ── Shared chrome ─────────────────────────────────────────────────────────────

function drawBackground(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, w, h)

  // Faint grid, same texture the site's hero sections use.
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 1
  for (let x = 0; x <= w; x += 60) {
    ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke()
  }
  for (let y = 0; y <= h; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke()
  }

  // Soft gold glow behind the header.
  const glow = ctx.createRadialGradient(w / 2, h * 0.18, 0, w / 2, h * 0.18, w * 0.6)
  glow.addColorStop(0, 'rgba(212,160,23,0.08)')
  glow.addColorStop(1, 'rgba(212,160,23,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  // Gold hairline across the top.
  const bar = ctx.createLinearGradient(0, 0, w, 0)
  bar.addColorStop(0, 'rgba(212,160,23,0)')
  bar.addColorStop(0.5, GOLD)
  bar.addColorStop(1, 'rgba(212,160,23,0)')
  ctx.fillStyle = bar
  ctx.fillRect(0, 0, w, 4)
}

function drawHeader(ctx: Ctx, eyebrow: string, title: string, sub?: string) {
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = GOLD
  ctx.font = `600 15px ${MONO}`
  tracked(ctx, eyebrow, MARGIN, 92, 4)

  ctx.fillStyle = WHITE
  fitFont(ctx, title, `italic 600 {s}px ${DISPLAY}`, 54, 32, CARD_W - MARGIN * 2)
  ctx.fillText(title, MARGIN, 152)

  if (sub) {
    ctx.fillStyle = DIM
    ctx.font = `400 17px ${SANS}`
    ctx.fillText(sub, MARGIN, 186)
  }
}

function drawFooter(ctx: Ctx, credit?: string) {
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(MARGIN, 556.5); ctx.lineTo(CARD_W - MARGIN, 556.5); ctx.stroke()

  ctx.fillStyle = GOLD
  ctx.font = `600 14px ${MONO}`
  tracked(ctx, 'F1RACESIGNATURE.SITE', MARGIN, 592, 3)

  if (credit) {
    ctx.fillStyle = DIM
    ctx.font = `400 13px ${SANS}`
    ctx.textAlign = 'right'
    ctx.fillText(credit, CARD_W - MARGIN, 592)
    ctx.textAlign = 'left'
  }
}

// ── Card bodies ───────────────────────────────────────────────────────────────

function drawStandingsBody(ctx: Ctx, spec: StandingsCardSpec) {
  const rows = spec.rows.slice(0, 10)
  const perCol = Math.ceil(rows.length / 2)
  const colW = 508
  const rowH = 60
  const topY = 236

  rows.forEach((row, i) => {
    const col = Math.floor(i / perCol)
    const x = MARGIN + col * (colW + 32)
    const y = topY + (i % perCol) * rowH
    const baseline = y + 38

    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x, y + rowH - 0.5); ctx.lineTo(x + colW, y + rowH - 0.5); ctx.stroke()

    ctx.fillStyle = i < 3 && col === 0 ? GOLD : DIM
    ctx.font = `700 17px ${MONO}`
    ctx.textAlign = 'right'
    ctx.fillText(row.pos, x + 30, baseline)
    ctx.textAlign = 'left'

    ctx.fillStyle = row.color
    roundedRect(ctx, x + 44, y + 14, 4, 30, 2)
    ctx.fill()

    ctx.fillStyle = DIM
    ctx.font = `400 13px ${MONO}`
    ctx.textAlign = 'right'
    ctx.fillText('pts', x + colW, baseline)
    const ptsUnitW = ctx.measureText('pts').width
    ctx.fillStyle = WHITE
    ctx.font = `700 19px ${MONO}`
    ctx.fillText(row.points, x + colW - ptsUnitW - 8, baseline)
    const ptsW = ptsUnitW + 8 + ctx.measureText(row.points).width
    ctx.textAlign = 'left'

    ctx.fillStyle = WHITE
    fitFont(ctx, row.name, `600 {s}px ${SANS}`, 21, 14, colW - 64 - ptsW - 16)
    ctx.fillText(row.name, x + 64, baseline)
  })
}

function drawPodiumBody(ctx: Ctx, spec: PodiumCardSpec) {
  const rows = spec.rows.slice(0, 3)
  const w = 330
  const h = 280
  const y = 232
  const labels = ['1ST', '2ND', '3RD']

  rows.forEach((row, i) => {
    const x = MARGIN + i * (w + 24)

    ctx.fillStyle = PANEL
    roundedRect(ctx, x, y, w, h, 16)
    ctx.fill()
    ctx.strokeStyle = i === 0 ? 'rgba(212,160,23,0.45)' : BORDER
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Team-colour pill on the left edge, like the site's borderLeft accents.
    ctx.fillStyle = row.color
    roundedRect(ctx, x + 18, y + 26, 4, h - 52, 2)
    ctx.fill()

    ctx.fillStyle = MEDALS[i]
    ctx.font = `700 18px ${MONO}`
    tracked(ctx, labels[i], x + 40, y + 56, 2)

    ctx.fillStyle = WHITE
    // Wrap the driver name onto two lines when it doesn't fit.
    const maxW = w - 64
    ctx.font = `700 27px ${SANS}`
    const parts = row.name.split(' ')
    const oneLine = ctx.measureText(row.name).width <= maxW
    if (oneLine || parts.length < 2) {
      fitFont(ctx, row.name, `700 {s}px ${SANS}`, 27, 18, maxW)
      ctx.fillText(row.name, x + 40, y + 112)
    } else {
      const first = parts.slice(0, -1).join(' ')
      const last = parts[parts.length - 1]
      ctx.font = `400 20px ${SANS}`
      ctx.fillText(first, x + 40, y + 102)
      fitFont(ctx, last, `700 {s}px ${SANS}`, 27, 18, maxW)
      ctx.fillText(last, x + 40, y + 134)
    }

    ctx.fillStyle = DIM
    fitFont(ctx, row.team, `400 {s}px ${SANS}`, 16, 12, maxW)
    ctx.fillText(row.team, x + 40, y + 168)

    if (row.detail) {
      ctx.fillStyle = WHITE
      fitFont(ctx, row.detail, `600 {s}px ${MONO}`, 19, 14, maxW)
      ctx.fillText(row.detail, x + 40, y + h - 30)
    }
  })
}

function drawPredictionBody(ctx: Ctx, spec: PredictionCardSpec) {
  // Left: the headline score.
  const scoreY = 388
  ctx.fillStyle = GOLD
  ctx.font = `italic 700 128px ${DISPLAY}`
  ctx.fillText(String(spec.total), MARGIN, scoreY)
  const totalW = ctx.measureText(String(spec.total)).width
  ctx.fillStyle = DIM
  ctx.font = `italic 400 40px ${DISPLAY}`
  ctx.fillText(`/ ${spec.max} pts`, MARGIN + totalW + 16, scoreY)

  if (spec.username) {
    ctx.fillStyle = WHITE
    ctx.font = `600 19px ${SANS}`
    ctx.fillText(spec.username, MARGIN, 444)
  }
  if (spec.rank) {
    ctx.fillStyle = DIM
    ctx.font = `400 15px ${SANS}`
    ctx.fillText(`#${spec.rank} in the season league`, MARGIN, 474)
  }

  // Right: the four picks with hit/miss badges.
  const x = 560
  const colW = CARD_W - MARGIN - x
  const rowH = 68
  let y = 238
  const badge = {
    exact: { text: 'EXACT', color: GREEN },
    partial: { text: 'ON PODIUM', color: GOLD },
    miss: { text: 'MISS', color: DIM },
  }

  for (const row of spec.rows.slice(0, 4)) {
    const baseline = y + 42

    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x, y + rowH - 0.5); ctx.lineTo(x + colW, y + rowH - 0.5); ctx.stroke()

    ctx.fillStyle = DIM
    ctx.font = `600 13px ${MONO}`
    tracked(ctx, row.label, x, baseline, 2)

    const b = badge[row.result]
    ctx.fillStyle = b.color
    ctx.font = `600 13px ${MONO}`
    tracked(ctx, b.text, x + colW, baseline, 2, 'right')

    ctx.fillStyle = WHITE
    fitFont(ctx, row.pick, `600 {s}px ${SANS}`, 21, 14, colW - 220)
    ctx.fillText(row.pick, x + 80, baseline)

    y += rowH
  }
}

// ── Story format (9:16 — TikTok / Reels / Stories) ───────────────────────────
// Same palette and faces, recomposed vertically: centered header, stacked
// panels, everything inside the middle of the frame so platform UI (captions,
// action rail, progress bar) doesn't cover the content.

const SM = 90 // story side margin; content width = STORY_W - 2*SM = 900

function drawStoryHeader(ctx: Ctx, eyebrow: string, title: string, sub?: string) {
  const cx = STORY_W / 2
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = GOLD
  ctx.font = `600 22px ${MONO}`
  tracked(ctx, eyebrow, cx, 300, 5, 'center')

  ctx.textAlign = 'center'
  ctx.fillStyle = WHITE
  fitFont(ctx, title, `italic 600 {s}px ${DISPLAY}`, 76, 40, STORY_W - SM * 2)
  ctx.fillText(title, cx, 396)

  if (sub) {
    ctx.fillStyle = DIM
    fitFont(ctx, sub, `400 {s}px ${SANS}`, 25, 18, STORY_W - SM * 2)
    ctx.fillText(sub, cx, 448)
  }
  ctx.textAlign = 'left'
}

function drawStoryFooter(ctx: Ctx, credit?: string) {
  const cx = STORY_W / 2
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(SM, 1668.5); ctx.lineTo(STORY_W - SM, 1668.5); ctx.stroke()

  ctx.fillStyle = GOLD
  ctx.font = `600 22px ${MONO}`
  tracked(ctx, 'F1RACESIGNATURE.SITE', cx, 1726, 4, 'center')

  if (credit) {
    ctx.fillStyle = DIM
    ctx.font = `400 18px ${SANS}`
    ctx.textAlign = 'center'
    ctx.fillText(credit, cx, 1766)
    ctx.textAlign = 'left'
  }
}

function drawStoryStandingsBody(ctx: Ctx, spec: StandingsCardSpec) {
  const rows = spec.rows.slice(0, 10)
  const x = SM
  const colW = STORY_W - SM * 2
  const rowH = 96
  const topY = 560

  rows.forEach((row, i) => {
    const y = topY + i * rowH
    const baseline = y + 60

    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x, y + rowH - 0.5); ctx.lineTo(x + colW, y + rowH - 0.5); ctx.stroke()

    ctx.fillStyle = i < 3 ? GOLD : DIM
    ctx.font = `700 27px ${MONO}`
    ctx.textAlign = 'right'
    ctx.fillText(row.pos, x + 46, baseline)
    ctx.textAlign = 'left'

    ctx.fillStyle = row.color
    roundedRect(ctx, x + 66, y + 24, 5, 46, 2.5)
    ctx.fill()

    ctx.fillStyle = DIM
    ctx.font = `400 19px ${MONO}`
    ctx.textAlign = 'right'
    ctx.fillText('pts', x + colW, baseline)
    const ptsUnitW = ctx.measureText('pts').width
    ctx.fillStyle = WHITE
    ctx.font = `700 30px ${MONO}`
    ctx.fillText(row.points, x + colW - ptsUnitW - 12, baseline)
    const ptsW = ptsUnitW + 12 + ctx.measureText(row.points).width
    ctx.textAlign = 'left'

    ctx.fillStyle = WHITE
    fitFont(ctx, row.name, `600 {s}px ${SANS}`, 31, 20, colW - 98 - ptsW - 24)
    ctx.fillText(row.name, x + 98, baseline)
  })
}

function drawStoryPodiumBody(ctx: Ctx, spec: PodiumCardSpec) {
  const rows = spec.rows.slice(0, 3)
  const x = SM
  const w = STORY_W - SM * 2
  const labels = ['1ST', '2ND', '3RD']
  let y = 540

  rows.forEach((row, i) => {
    const h = i === 0 ? 330 : 260 // the winner gets the biggest panel

    ctx.fillStyle = PANEL
    roundedRect(ctx, x, y, w, h, 20)
    ctx.fill()
    ctx.strokeStyle = i === 0 ? 'rgba(212,160,23,0.45)' : BORDER
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = row.color
    roundedRect(ctx, x + 28, y + 32, 5, h - 64, 2.5)
    ctx.fill()

    const tx = x + 64
    const maxW = w - 100

    ctx.fillStyle = MEDALS[i]
    ctx.font = `700 26px ${MONO}`
    tracked(ctx, labels[i], tx, y + 74, 3)

    ctx.fillStyle = WHITE
    fitFont(ctx, row.name, `700 {s}px ${SANS}`, i === 0 ? 48 : 38, 24, maxW)
    ctx.fillText(row.name, tx, y + (i === 0 ? 156 : 138))

    ctx.fillStyle = DIM
    fitFont(ctx, row.team, `400 {s}px ${SANS}`, 24, 16, maxW)
    ctx.fillText(row.team, tx, y + (i === 0 ? 204 : 182))

    if (row.detail) {
      ctx.fillStyle = WHITE
      fitFont(ctx, row.detail, `600 {s}px ${MONO}`, 27, 18, maxW)
      ctx.fillText(row.detail, tx, y + h - 42)
    }

    y += h + 30
  })
}

function drawStoryPredictionBody(ctx: Ctx, spec: PredictionCardSpec) {
  const cx = STORY_W / 2

  // Headline score, front and centre.
  ctx.textAlign = 'center'
  ctx.fillStyle = GOLD
  ctx.font = `italic 700 210px ${DISPLAY}`
  ctx.fillText(String(spec.total), cx, 748)
  ctx.fillStyle = DIM
  ctx.font = `italic 400 52px ${DISPLAY}`
  ctx.fillText(`/ ${spec.max} pts`, cx, 830)

  if (spec.username) {
    ctx.fillStyle = WHITE
    ctx.font = `600 30px ${SANS}`
    ctx.fillText(spec.username, cx, 916)
  }
  if (spec.rank) {
    ctx.fillStyle = DIM
    ctx.font = `400 23px ${SANS}`
    ctx.fillText(`#${spec.rank} in the season league`, cx, 958)
  }
  ctx.textAlign = 'left'

  // Picks list.
  const x = SM
  const colW = STORY_W - SM * 2
  const rowH = 110
  let y = 1050
  const badge = {
    exact: { text: 'EXACT', color: GREEN },
    partial: { text: 'ON PODIUM', color: GOLD },
    miss: { text: 'MISS', color: DIM },
  }

  for (const row of spec.rows.slice(0, 4)) {
    const baseline = y + 68

    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x, y + rowH - 0.5); ctx.lineTo(x + colW, y + rowH - 0.5); ctx.stroke()

    ctx.fillStyle = DIM
    ctx.font = `600 20px ${MONO}`
    tracked(ctx, row.label, x, baseline, 3)

    const b = badge[row.result]
    ctx.fillStyle = b.color
    ctx.font = `600 20px ${MONO}`
    tracked(ctx, b.text, x + colW, baseline, 3, 'right')

    ctx.fillStyle = WHITE
    fitFont(ctx, row.pick, `600 {s}px ${SANS}`, 32, 20, colW - 420)
    ctx.fillText(row.pick, x + 130, baseline)

    y += rowH
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

/** Renders a card spec to a PNG blob + data URL (for the preview <img>). */
export async function renderCard(
  spec: CardSpec,
  format: CardFormat = 'wide',
): Promise<{ blob: Blob; dataUrl: string }> {
  const w = format === 'story' ? STORY_W : CARD_W
  const h = format === 'story' ? STORY_H : CARD_H
  const canvas = document.createElement('canvas')
  canvas.width = w * SCALE
  canvas.height = h * SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')
  ctx.scale(SCALE, SCALE)

  drawBackground(ctx, w, h)
  if (format === 'story') {
    drawStoryHeader(ctx, spec.eyebrow, spec.title, spec.sub)
    if (spec.type === 'standings') drawStoryStandingsBody(ctx, spec)
    else if (spec.type === 'podium') drawStoryPodiumBody(ctx, spec)
    else drawStoryPredictionBody(ctx, spec)
    drawStoryFooter(ctx, spec.credit)
  } else {
    drawHeader(ctx, spec.eyebrow, spec.title, spec.sub)
    if (spec.type === 'standings') drawStandingsBody(ctx, spec)
    else if (spec.type === 'podium') drawPodiumBody(ctx, spec)
    else drawPredictionBody(ctx, spec)
    drawFooter(ctx, spec.credit)
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
  return { blob, dataUrl: canvas.toDataURL('image/png') }
}
