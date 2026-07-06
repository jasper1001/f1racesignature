import Link from 'next/link'
import { ArrowRightIcon } from '@/components/ui/ArrowRightIcon'

interface SectionHeaderProps {
  /** Small gold mono label above the title */
  kicker: string
  title: string
  /** Optional "view all" link, hidden on mobile */
  link?: { href: string; label: string }
  className?: string
}

/** Standard landing-page section header: gold kicker, serif title, view-all link. */
export function SectionHeader({ kicker, title, link, className = 'mb-8' }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        <p className="text-[#d4a017] text-xs font-mono uppercase tracking-widest mb-2">
          {kicker}
        </p>
        <h2 className="text-2xl md:text-3xl text-white font-display">{title}</h2>
      </div>
      {link && (
        <Link
          href={link.href}
          className="hidden sm:flex items-center gap-1.5 text-white/65 text-sm hover:text-[#d4a017] transition-colors"
        >
          {link.label}
          <ArrowRightIcon />
        </Link>
      )}
    </div>
  )
}
