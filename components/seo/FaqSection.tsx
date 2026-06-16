import type { FaqItem } from '@/lib/seo'

/**
 * Visible, crawlable FAQ block. The copy here mirrors the FAQPage JSON-LD so
 * the on-page content and structured data stay in sync for search engines.
 */
export function FaqSection({ items, title = 'Frequently asked questions' }: { items: FaqItem[]; title?: string }) {
  if (items.length === 0) return null
  return (
    <section className="border-t border-[#0f0f0f] pt-10">
      <p className="text-[#d4a017] text-xs font-medium uppercase tracking-widest mb-2">FAQ</p>
      <h2 className="text-2xl md:text-3xl text-white mb-6" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
        {title}
      </h2>
      <div className="space-y-3">
        {items.map((it) => (
          <details
            key={it.q}
            className="group rounded-xl border border-[#161616] bg-[#0a0a0a] px-4 py-3 open:bg-[#0d0d0d] transition-colors"
          >
            <summary className="flex items-center justify-between gap-3 cursor-pointer list-none text-white text-sm font-medium">
              {it.q}
              <span className="shrink-0 text-[#d4a017] text-lg leading-none transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="text-white/70 text-sm leading-relaxed mt-3">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
