'use client'

import { useEffect } from 'react'
import { Analytics } from '@/lib/analytics'

/**
 * Global click auto-tracker.
 *
 * Attaches a single delegated listener to the document and reports a
 * `ui_click` GA4 event for every click that lands on (or inside) a
 * button, link, or element marked with `data-track`.
 *
 * Label resolution priority:
 *   1. `data-track`  — explicit label you set on an element
 *   2. `aria-label`
 *   3. trimmed text content (truncated to 60 chars)
 *   4. `title`
 */
export function ClickTracker() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      const el = target.closest<HTMLElement>(
        'a, button, [role="button"], [data-track]',
      )
      if (!el) return

      const label =
        el.dataset.track ||
        el.getAttribute('aria-label') ||
        el.textContent?.trim().slice(0, 60) ||
        el.getAttribute('title') ||
        '(unlabeled)'

      const tag = el.tagName.toLowerCase()
      const element =
        tag === 'a' ? 'link' : tag === 'button' ? 'button' : (el.getAttribute('role') ?? tag)

      const href = el.getAttribute('href') ?? undefined

      // Nearest section/landmark for context (data-section, <section id>, etc.)
      const sectionEl = el.closest<HTMLElement>('[data-section], section, aside, header, footer, main')
      const section =
        sectionEl?.dataset.section ||
        sectionEl?.id ||
        sectionEl?.tagName.toLowerCase() ||
        undefined

      Analytics.uiClick({
        label,
        element,
        ...(href ? { href } : {}),
        ...(section ? { section } : {}),
        page: window.location.pathname,
      })
    }

    document.addEventListener('click', handleClick, { capture: true })
    return () => document.removeEventListener('click', handleClick, { capture: true })
  }, [])

  return null
}
