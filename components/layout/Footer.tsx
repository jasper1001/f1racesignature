import Link from 'next/link'
import { SteeringWheelIcon } from '@/components/icons/SteeringWheel'

export function Footer() {
  return (
    <footer className="border-t border-[#111111] bg-[#030303]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <SteeringWheelIcon className="w-6 h-6 text-[#d4a017]" />
              <span
                className="text-white font-semibold"
                style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
              >
                F1Race<span className="text-[#d4a017]">Signature</span>
              </span>
            </div>
            <p className="text-[#444444] text-sm max-w-xs">
              Where speed becomes art. F1 telemetry rendered as museum-quality collectible prints.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 text-sm">
            <div className="flex flex-col gap-2">
              <span className="text-[#333333] font-medium uppercase tracking-widest text-xs">Navigate</span>
              <Link href="/" className="text-[#666666] hover:text-white transition-colors">Home</Link>
              <Link href="/studio" className="text-[#666666] hover:text-white transition-colors">Studio</Link>
              <Link href="/gallery" className="text-[#666666] hover:text-white transition-colors">Gallery</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[#333333] font-medium uppercase tracking-widest text-xs">Legal</span>
              <span className="text-[#666666]">Privacy</span>
              <span className="text-[#666666]">Terms</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[#333333] font-medium uppercase tracking-widest text-xs">More</span>
              <a
                href="https://jascodingvibe.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#666666] hover:text-white transition-colors inline-flex items-center gap-1.5"
              >
                More Projects
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M3.5 3h5.5v5.5M9 3L3 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#0f0f0f] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-[#333333] text-xs">
            © {new Date().getFullYear()} F1RaceSignature. All rights reserved.
          </p>
          <p className="text-[#333333] text-xs">
            Built by{' '}
            <a
              href="https://jascodingvibe.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4a017] hover:text-[#e8b84b] transition-colors"
            >
              JasCodingVibe
            </a>
          </p>
        </div>

        <p className="mt-4 text-[#222222] text-xs text-center sm:text-left">
          Data for artistic purposes only. Not affiliated with Formula 1 or FIA.
        </p>
      </div>
    </footer>
  )
}
