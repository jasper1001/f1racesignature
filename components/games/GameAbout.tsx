/**
 * Crawlable "about this game" prose block for the light-theme game pages.
 * Each game passes its own copy so the pages read as genuinely distinct
 * content to search engines, not interchangeable templates.
 */
export function GameAbout({ title, paragraphs, accent = '#06b6d4' }: { title: string; paragraphs: string[]; accent?: string }) {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-14">
      <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: accent }}>
        About this game
      </p>
      <h2 className="text-2xl text-[#1a1712] mb-4 font-display">{title}</h2>
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-[#6b6358] text-sm leading-relaxed">{p}</p>
        ))}
      </div>
    </section>
  )
}
