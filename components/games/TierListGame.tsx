'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShareButtons } from '@/components/games/ShareButtons'
import { NextGameCard } from '@/components/games/NextGameCard'
import {
  SUBJECTS,
  TIERS,
  POOL_ID,
  type TierSubject,
  type TierItem,
} from '@/lib/games/tierListData'

const ACCENT = '#f43f5e'
const STORE_KEY = 'f1rs_games_tierlist_v1'

// placement maps itemId -> tierId | POOL_ID
type Placement = Record<string, string>

function freshPlacement(subject: TierSubject): Placement {
  const p: Placement = {}
  subject.items.forEach(it => { p[it.id] = POOL_ID })
  return p
}

function loadSaved(): { subjectId: string; placement: Placement } | null {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null') } catch { return null }
}
function save(subjectId: string, placement: Placement) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ subjectId, placement })) } catch {}
}

function resolveZone(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y)
  const zone = el?.closest('[data-tier-zone]')
  return zone?.getAttribute('data-tier-zone') ?? null
}

export function TierListGame() {
  const [subject, setSubject] = useState<TierSubject>(SUBJECTS[0])
  const [placement, setPlacement] = useState<Placement>(() => freshPlacement(SUBJECTS[0]))
  const [dragId, setDragId] = useState<string | null>(null)
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null)
  const [hoverZone, setHoverZone] = useState<string | null>(null)

  const dragIdRef = useRef<string | null>(null)
  const gameRef = useRef<HTMLDivElement>(null)
  const hydrated = useRef(false)

  // Restore last session's list (once, client-side).
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    const saved = loadSaved()
    if (saved) {
      const subj = SUBJECTS.find(s => s.id === saved.subjectId)
      if (subj) {
        // Only keep placements for items that still exist.
        const base = freshPlacement(subj)
        for (const it of subj.items) if (saved.placement[it.id]) base[it.id] = saved.placement[it.id]
        setSubject(subj)
        setPlacement(base)
      }
    }
  }, [])

  const movePlacement = useCallback((id: string, zone: string) => {
    setPlacement(prev => {
      if (prev[id] === zone) return prev
      const next = { ...prev, [id]: zone }
      save(subject.id, next)
      return next
    })
  }, [subject.id])

  // ── Drag handling (pointer events — works for touch + mouse) ────────────────
  useEffect(() => {
    if (!dragId) return

    function onMove(e: PointerEvent) {
      setGhost({ x: e.clientX, y: e.clientY })
      setHoverZone(resolveZone(e.clientX, e.clientY))
    }
    function onUp(e: PointerEvent) {
      const zone = resolveZone(e.clientX, e.clientY)
      const id = dragIdRef.current
      if (id && zone) movePlacement(id, zone)
      dragIdRef.current = null
      setDragId(null)
      setGhost(null)
      setHoverZone(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragId, movePlacement])

  function startDrag(e: React.PointerEvent, id: string) {
    e.preventDefault()
    dragIdRef.current = id
    setDragId(id)
    setGhost({ x: e.clientX, y: e.clientY })
  }

  function switchSubject(s: TierSubject) {
    setSubject(s)
    const fresh = freshPlacement(s)
    setPlacement(fresh)
    save(s.id, fresh)
  }

  function reset() {
    const fresh = freshPlacement(subject)
    setPlacement(fresh)
    save(subject.id, fresh)
  }

  const itemsIn = (zone: string): TierItem[] => subject.items.filter(it => placement[it.id] === zone)
  const placedCount = subject.items.filter(it => placement[it.id] !== POOL_ID).length
  const total = subject.items.length
  const complete = placedCount === total
  const draggingItem = dragId ? subject.items.find(it => it.id === dragId) : null

  const shareText = (() => {
    const lines = TIERS
      .map(t => {
        const names = itemsIn(t.id).map(i => i.label)
        return names.length ? `${t.id}: ${names.join(', ')}` : null
      })
      .filter(Boolean)
    return `🏎️ My F1 Tier List — ${subject.label}\n${lines.join('\n')}\nf1racesignature.site/games/tier-list`
  })()

  // ── Reusable chip ──────────────────────────────────────────────────────────
  function Chip({ it }: { it: TierItem }) {
    const isDragging = dragId === it.id
    return (
      <button
        onPointerDown={e => startDrag(e, it.id)}
        className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition-shadow cursor-grab active:cursor-grabbing select-none ${
          isDragging ? 'opacity-30 border-dashed border-[#c4bca8] bg-[#f3eee3] text-[#1a1712]/50' : 'border-[#dcd5c6] bg-[#fbf9f4] text-[#1a1712] hover:shadow-md'
        }`}
        style={{ touchAction: 'none' }}
      >
        {it.label}
      </button>
    )
  }

  return (
    <div ref={gameRef} className="space-y-5">

      {/* Subject selector */}
      <div className="flex flex-wrap gap-2">
        {SUBJECTS.map(s => {
          const active = s.id === subject.id
          return (
            <button
              key={s.id}
              onClick={() => switchSubject(s)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                active
                  ? 'text-[#1a1712] border-[#f43f5e]/50 bg-[#f43f5e]/10'
                  : 'text-[#1a1712]/65 border-[#dcd5c6] bg-[#fbf9f4] hover:text-[#1a1712] hover:border-[#c4bca8]'
              }`}
            >
              <span className="mr-1.5">{s.emoji}</span>{s.label}
            </button>
          )
        })}
      </div>

      {/* Tier rows */}
      <div className="rounded-2xl border border-[#dcd5c6] overflow-hidden">
        {TIERS.map(t => {
          const isHover = hoverZone === t.id
          return (
            <div key={t.id} className="flex border-b border-[#e2dccd] last:border-b-0">
              {/* Label cell */}
              <div
                className="w-12 sm:w-14 shrink-0 flex items-center justify-center text-xl font-bold"
                style={{ background: t.color, color: t.text, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                {t.id}
              </div>
              {/* Drop zone */}
              <div
                data-tier-zone={t.id}
                className="flex-1 min-h-[60px] p-2 flex flex-wrap gap-2 items-center content-center transition-colors"
                style={{ background: isHover ? `${t.color}14` : '#fbf9f4' }}
              >
                {itemsIn(t.id).map(it => <Chip key={it.id} it={it} />)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pool */}
      <div>
        <p className="text-[#1a1712]/55 text-[10px] font-mono uppercase tracking-widest mb-2">
          {complete ? 'All ranked — drag to reshuffle' : `Drag into a tier · ${total - placedCount} left`}
        </p>
        <div
          data-tier-zone={POOL_ID}
          className="rounded-2xl border border-dashed p-3 flex flex-wrap gap-2 min-h-[64px] items-center transition-colors"
          style={{
            borderColor: hoverZone === POOL_ID ? ACCENT : '#d0c8b6',
            background: hoverZone === POOL_ID ? `${ACCENT}0d` : '#efe9dd',
          }}
        >
          {itemsIn(POOL_ID).map(it => <Chip key={it.id} it={it} />)}
          {itemsIn(POOL_ID).length === 0 && (
            <span className="text-[#1a1712]/35 text-xs font-mono px-1">Empty — everything placed.</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button onClick={reset}
          className="px-4 py-2.5 rounded-xl border border-[#dcd5c6] text-[#1a1712]/70 text-sm font-medium hover:text-[#1a1712] hover:border-[#c4bca8] transition-all"
        >
          Clear
        </button>
      </div>

      {/* Share — appears once at least one item is ranked */}
      <AnimatePresence>
        {placedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-5 space-y-3"
          >
            <div className="text-center">
              <p className="text-xs font-mono uppercase tracking-widest" style={{ color: ACCENT }}>
                {complete ? 'Your ranking is in' : 'Share your hot takes'}
              </p>
              <p className="text-[#1a1712]/60 text-xs mt-1">Screenshot the board or share the list — settle the debate.</p>
            </div>
            <ShareButtons text={shareText} url="https://f1racesignature.site/games/tier-list" />
            {complete && <NextGameCard currentId="tier-list" />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag ghost */}
      {ghost && draggingItem && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg text-sm font-semibold border border-[#c4bca8] bg-white text-[#1a1712] shadow-xl"
          style={{ left: ghost.x, top: ghost.y, transform: 'translate(-50%, -50%) rotate(-3deg) scale(1.05)' }}
        >
          {draggingItem.label}
        </div>
      )}
    </div>
  )
}
