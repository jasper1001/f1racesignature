import type { CSSProperties } from 'react'
import { GAME_ICONS, FALLBACK_GAME_ICON } from '@/lib/games/gameIcons'

interface GameIconProps {
  /** Game id from lib/games/registry.ts */
  id: string
  size?: number
  /** Stroke weight in 24-unit icon space; drop it for very large renders. */
  strokeWidth?: number
  className?: string
  style?: CSSProperties
}

// Line icon for a mini-game. Strokes use currentColor, so set `color` (usually
// the game's accent) on this element or a parent.
export function GameIcon({ id, size = 24, strokeWidth = 1.75, className, style }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
      // Static, trusted markup from lib/games/gameIcons.ts.
      dangerouslySetInnerHTML={{ __html: GAME_ICONS[id] ?? FALLBACK_GAME_ICON }}
    />
  )
}
