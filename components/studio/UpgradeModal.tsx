'use client'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useStudioStore } from '@/lib/store'
import { SteeringWheelIcon } from '@/components/icons/SteeringWheel'

const TIERS = [
  {
    name: 'Paddock Pass',
    price: '$9',
    period: '/month',
    features: [
      'All 8 legendary drivers',
      'Full race library (15+ iconic laps)',
      'All 6 visualization modes',
      'All 8 artistic themes',
      'High-res poster export',
    ],
    cta: 'Start Racing',
    highlighted: false,
  },
  {
    name: 'Championship Edition',
    price: '$24',
    period: '/lifetime',
    features: [
      'Everything in Paddock Pass',
      'All export formats (5 sizes)',
      'No watermark on exports',
      'Gallery collection access',
      'Early access to new features',
    ],
    cta: 'Go Champion',
    highlighted: true,
  },
]

export function UpgradeModal() {
  const { showUpgradeModal, upgradeModalReason, closeUpgradeModal } = useStudioStore()

  return (
    <Modal isOpen={showUpgradeModal} onClose={closeUpgradeModal}>
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <SteeringWheelIcon className="w-10 h-10 text-[#d4a017] mx-auto mb-3" />
          <h2
            className="text-2xl text-white mb-2"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Unlock the Full Collection
          </h2>
          <p className="text-white/60 text-sm">
            {upgradeModalReason ?? 'Access all drivers, visualizations, themes, and export formats.'}
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl p-4 border ${
                tier.highlighted
                  ? 'border-[#d4a017] bg-[#d4a017]/5'
                  : 'border-[#1a1a1a] bg-[#0a0a0a]'
              }`}
            >
              {tier.highlighted && (
                <div className="text-[10px] font-medium text-[#d4a017] uppercase tracking-widest mb-2">
                  Best Value
                </div>
              )}
              <div className="mb-3">
                <span className="text-white font-semibold text-sm">{tier.name}</span>
                <div className="flex items-baseline gap-0.5 mt-1">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: tier.highlighted ? '#d4a017' : '#ffffff' }}
                  >
                    {tier.price}
                  </span>
                  <span className="text-white/55 text-xs">{tier.period}</span>
                </div>
              </div>
              <ul className="space-y-1.5 mb-4">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-white/55">
                    <svg className="w-3 h-3 text-white/40 mt-0.5 flex-shrink-0" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={tier.highlighted ? 'gold' : 'secondary'}
                size="sm"
                className="w-full"
                onClick={closeUpgradeModal}
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>

        <button
          onClick={closeUpgradeModal}
          className="w-full text-center text-white/45 text-xs hover:text-white/70 transition-colors py-1 cursor-pointer"
        >
          Continue with free tier
        </button>
      </div>
    </Modal>
  )
}
