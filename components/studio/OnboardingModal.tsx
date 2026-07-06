'use client'

import { Modal } from '@/components/ui/Modal'
import { SteeringWheelIcon } from '@/components/icons/SteeringWheel'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const TIPS = [
  {
    title: 'Pick a driver & race',
    body: 'Choose a legendary lap from the sidebar — from Senna at Monaco to Piastri in Hungary.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6"/><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
  {
    title: 'Style your poster',
    body: 'Switch the visualization (racing line, speed heatmap, sectors) and apply one of 8 artistic themes.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/><path d="M12 3v9l6 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
  {
    title: 'Play the lap',
    body: 'Hit Play to watch the car trace the real GPS racing line in real time, coloured by speed.',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M7 5v14a1 1 0 0 0 1.5.86l11-7a1 1 0 0 0 0-1.72l-11-7A1 1 0 0 0 7 5z"/></svg>
    ),
  },
  {
    title: 'Save, share & export',
    body: 'Keep favourites in My Garage, share a link that restores your exact poster, or export a print — free.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M12 3v11M8 11l4 4 4-4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
]

export function OnboardingModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="text-center mb-6">
          <SteeringWheelIcon className="w-9 h-9 text-[#d4a017] mx-auto mb-3" />
          <h2 className="text-2xl text-white mb-1 font-display">
            Welcome to the Studio
          </h2>
          <p className="text-[#aaaaaa] text-sm">Four things you can do to turn a lap into art.</p>
        </div>

        <div className="space-y-3 mb-6">
          {TIPS.map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#d4a017]/10 text-[#d4a017] flex items-center justify-center flex-shrink-0">
                {tip.icon}
              </div>
              <div>
                <div className="text-white text-sm font-medium">{tip.title}</div>
                <div className="text-[#aaaaaa] text-xs mt-0.5 leading-relaxed">{tip.body}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-colors cursor-pointer"
        >
          Got it — let&apos;s create
        </button>
      </div>
    </Modal>
  )
}
