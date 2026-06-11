'use client'

import { Analytics } from '@/lib/analytics'

interface Props {
  isPlaying: boolean
  onToggle: () => void
  disabled?: boolean
}

export function PlayButton({ isPlaying, onToggle, disabled }: Props) {
  return (
    <button
      onClick={() => {
        if (!isPlaying) Analytics.lapPlayed()
        onToggle()
      }}
      disabled={disabled}
      title={isPlaying ? 'Pause lap' : 'Play lap'}
      data-track="studio_play_lap"
      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-[#111111] text-[#aaaaaa] border border-[#222222] rounded-lg hover:text-white hover:border-[#333333] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {isPlaying ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="3" y="2.5" width="2.6" height="9" rx="0.6" />
          <rect x="8.4" y="2.5" width="2.6" height="9" rx="0.6" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M4 2.6v8.8a.6.6 0 0 0 .92.5l7-4.4a.6.6 0 0 0 0-1l-7-4.4A.6.6 0 0 0 4 2.6z" />
        </svg>
      )}
      <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play lap'}</span>
    </button>
  )
}
