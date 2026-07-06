'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchDrivers, fetchRaces } from '@/lib/data'
import {
  staticSearchDocs,
  driverDocs,
  raceDocs,
  searchDocs,
  type SearchDoc,
  type SearchGroup,
} from '@/lib/search'

// Event any component can fire to open search (the Header button uses this).
export const OPEN_SITE_SEARCH = 'open-site-search'

const GROUP_LABEL: Record<SearchGroup, string> = {
  Page: 'Page',
  Game: 'Game',
  Driver: 'Driver',
  Race: 'Race',
  Article: 'Article',
  FAQ: 'FAQ',
}

// A handful of destinations shown before the user types anything.
const QUICK_LINK_IDS = ['page-studio', 'page-games', 'page-results', 'page-drivers', 'page-blog', 'page-schedule']

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Bold-gold the matched query terms inside a piece of text. */
function highlight(text: string, terms: string[]): React.ReactNode {
  if (terms.length === 0) return text
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi')
  const parts = text.split(pattern)
  return parts.map((part, i) =>
    terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
      <mark key={i} className="bg-transparent text-[#d4a017]">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

export function SiteSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  // Drivers + races are fetched lazily on first open and merged with the static index.
  const [dynamicDocs, setDynamicDocs] = useState<SearchDoc[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const staticDocs = useMemo(() => staticSearchDocs(), [])
  const allDocs = useMemo(() => [...staticDocs, ...dynamicDocs], [staticDocs, dynamicDocs])

  const terms = useMemo(() => query.trim().toLowerCase().split(/\s+/).filter(Boolean), [query])

  const results = useMemo<SearchDoc[]>(() => {
    if (!query.trim()) {
      return QUICK_LINK_IDS.map((id) => staticDocs.find((d) => d.id === id)).filter(
        (d): d is SearchDoc => Boolean(d),
      )
    }
    return searchDocs(allDocs, query)
  }, [query, allDocs, staticDocs])

  // Load the dynamic half of the index once, the first time search is opened.
  const loadedRef = useRef(false)
  const loadDynamic = useCallback(async () => {
    if (loadedRef.current) return
    loadedRef.current = true
    try {
      const [drivers, races] = await Promise.all([fetchDrivers(), fetchRaces()])
      setDynamicDocs([...driverDocs(drivers), ...raceDocs(races)])
    } catch {
      loadedRef.current = false // let a later open retry
    }
  }, [])

  const openSearch = useCallback(() => {
    setOpen(true)
    void loadDynamic()
  }, [loadDynamic])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setActive(0)
  }, [])

  // Global open triggers: ⌘K / Ctrl+K, "/" (when not already typing), and the event.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => {
          if (!o) void loadDynamic()
          return !o
        })
        return
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault()
        openSearch()
      }
    }
    const onOpenEvent = () => openSearch()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener(OPEN_SITE_SEARCH, onOpenEvent)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener(OPEN_SITE_SEARCH, onOpenEvent)
    }
  }, [openSearch, loadDynamic])

  // Reset highlight to the top whenever the result set changes.
  useEffect(() => {
    setActive(0)
  }, [query])

  // Lock background scroll and focus the input while open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => {
      document.body.style.overflow = prev
      cancelAnimationFrame(id)
    }
  }, [open])

  // Keep the active row scrolled into view.
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active, open, results])

  const go = useCallback(
    (doc: SearchDoc) => {
      close()
      router.push(doc.href)
    },
    [close, router],
  )

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const doc = results[active]
      if (doc) go(doc)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Palette */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search the site"
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#d4a017]/30 bg-[#0a0a0a] shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            {/* Input row */}
            <div className="flex items-center gap-3 border-b border-white/[0.08] px-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-white/60" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
                <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search drivers, games, races, articles…"
                aria-label="Search query"
                className="w-full bg-transparent py-4 text-[15px] text-white placeholder:text-white/40 outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="hidden shrink-0 rounded border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white/50 sm:inline">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-2">
              {!query.trim() && (
                <p className="px-4 pb-1.5 pt-1 text-[10px] font-mono uppercase tracking-[0.15em] text-white/45">
                  Jump to
                </p>
              )}

              {results.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-white/55">
                  No results for “<span className="text-white">{query.trim()}</span>”
                </div>
              ) : (
                results.map((doc, i) => (
                  <button
                    key={doc.id}
                    data-idx={i}
                    onClick={() => go(doc)}
                    onMouseMove={() => setActive(i)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === active ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <span
                      className={`shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                        i === active
                          ? 'border-[#d4a017]/50 text-[#d4a017]'
                          : 'border-white/15 text-white/55'
                      }`}
                    >
                      {GROUP_LABEL[doc.group]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-white">
                        {highlight(doc.title, terms)}
                      </span>
                      {doc.subtitle && (
                        <span className="mt-0.5 block truncate text-xs text-white/55">
                          {highlight(doc.subtitle, terms)}
                        </span>
                      )}
                    </span>
                    {i === active && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-white/50" aria-hidden="true">
                        <path d="M2 7h9M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-between border-t border-white/[0.08] px-4 py-2.5 text-[10px] text-white/45">
              <span className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-white/15 px-1 py-0.5 font-mono">↑</kbd>
                  <kbd className="rounded border border-white/15 px-1 py-0.5 font-mono">↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-white/15 px-1 py-0.5 font-mono">↵</kbd>
                  to open
                </span>
              </span>
              <span className="font-mono uppercase tracking-[0.15em] text-white/30">F1RaceSignature</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
