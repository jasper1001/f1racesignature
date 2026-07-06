'use client'

import { useCallback, useEffect, useState } from 'react'
import { renderCard, type CardSpec, type CardFormat } from '@/lib/resultCards'
import { canShareImage, shareImage, copyImage } from '@/lib/shareResult'

interface Props {
  spec: CardSpec
  /** PNG filename for downloads, e.g. "f1racesignature-standings.png" */
  filename: string
  /** Text sent alongside the image via the native share sheet. */
  shareText: string
  /** Icon-only button for tight spots (list rows, card headers). */
  compact?: boolean
  label?: string
}

function ShareIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.4" className="shrink-0" aria-hidden="true"
    >
      <circle cx="12" cy="3.5" r="1.9" />
      <circle cx="4" cy="8" r="1.9" />
      <circle cx="12" cy="12.5" r="1.9" />
      <path d="M5.7 7.1l4.6-2.6M5.7 8.9l4.6 2.6" strokeLinecap="round" />
    </svg>
  )
}

export function ShareCardButton({ spec, filename, shareText, compact, label = 'Share' }: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [format, setFormat] = useState<CardFormat>('wide')
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [canNative, setCanNative] = useState(false)
  const [copied, setCopied] = useState(false)

  // "-story" suffix so both formats can sit in the same downloads folder.
  const exportName = format === 'story' ? filename.replace(/\.png$/, '-story.png') : filename

  const render = useCallback(async (fmt: CardFormat) => {
    setBusy(true)
    try {
      const card = await renderCard(spec, fmt)
      const name = fmt === 'story' ? filename.replace(/\.png$/, '-story.png') : filename
      setBlob(card.blob)
      setDataUrl(card.dataUrl)
      setCanNative(canShareImage(card.blob, name))
      setCopied(false)
      return true
    } catch {
      return false // canvas unavailable (very old browser) — quietly do nothing
    } finally {
      setBusy(false)
    }
  }, [spec, filename])

  const openPreview = useCallback(async () => {
    if (busy) return
    if (await render(format)) setOpen(true)
  }, [busy, render, format])

  const switchFormat = useCallback(async (fmt: CardFormat) => {
    if (fmt === format || busy) return
    setFormat(fmt)
    await render(fmt)
  }, [format, busy, render])

  // Esc closes; lock page scroll while the preview is up.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  const download = () => {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = exportName
    a.click()
  }

  const copy = async () => {
    if (!blob) return
    if (await copyImage(blob)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const actionBase =
    'inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all active:scale-95'
  const pillBase =
    'px-3 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-wider transition-colors'

  return (
    <>
      <button
        type="button"
        onClick={openPreview}
        aria-label={compact ? `${label} as image` : undefined}
        title={compact ? `${label} as image` : undefined}
        className={
          compact
            ? 'inline-flex items-center justify-center w-7 h-7 rounded-lg border border-[#222222] text-white/65 hover:text-[#d4a017] hover:border-[#d4a017]/40 transition-colors shrink-0'
            : 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#222222] text-white/65 hover:text-[#d4a017] hover:border-[#d4a017]/40 text-[11px] font-mono uppercase tracking-wider transition-colors shrink-0'
        }
      >
        <ShareIcon />
        {!compact && <span>{busy ? 'Rendering…' : label}</span>}
      </button>

      {open && dataUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Share card preview"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl max-h-full overflow-y-auto rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-white/65 text-[10px] font-mono uppercase tracking-widest shrink-0">Share card</p>
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => switchFormat('wide')}
                  aria-pressed={format === 'wide'}
                  className={`${pillBase} ${
                    format === 'wide'
                      ? 'border-[#d4a017]/50 text-[#d4a017] bg-[#d4a017]/10'
                      : 'border-[#222222] text-white/65 hover:border-[#333333]'
                  }`}
                >
                  Wide
                </button>
                <button
                  type="button"
                  onClick={() => switchFormat('story')}
                  aria-pressed={format === 'story'}
                  className={`${pillBase} ${
                    format === 'story'
                      ? 'border-[#d4a017]/50 text-[#d4a017] bg-[#d4a017]/10'
                      : 'border-[#222222] text-white/65 hover:border-[#333333]'
                  }`}
                >
                  Story 9:16
                </button>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close preview"
                className="text-white/65 hover:text-white text-xl leading-none px-1 shrink-0"
              >
                ×
              </button>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element -- data URL preview, not an optimizable asset */}
            <img
              src={dataUrl}
              alt="Preview of the shareable result card"
              className={`rounded-lg border border-[#161616] ${
                format === 'story' ? 'max-h-[55vh] w-auto mx-auto' : 'w-full'
              } ${busy ? 'opacity-50' : ''}`}
            />
            {format === 'story' && (
              <p className="text-white/65 text-[10px] font-mono uppercase tracking-wider text-center">
                1080×1920 — sized for TikTok, Reels &amp; Stories
              </p>
            )}

            <div className={`grid gap-2 ${canNative ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {canNative && blob && (
                <button
                  type="button"
                  onClick={() => shareImage(blob, exportName, shareText)}
                  className={`${actionBase} bg-[#d4a017] border-[#d4a017] text-black hover:bg-[#e8b84b]`}
                >
                  Share
                </button>
              )}
              <button
                type="button"
                onClick={download}
                className={`${actionBase} border-[#222222] bg-[#060606] text-white hover:border-[#333333]`}
              >
                Download
              </button>
              <button
                type="button"
                onClick={copy}
                className={`${actionBase} border-[#222222] bg-[#060606] text-white hover:border-[#333333]`}
              >
                {copied ? <span className="text-[#22c55e]">✓ Copied</span> : 'Copy image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
