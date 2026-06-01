'use client'

interface LockBadgeProps {
  className?: string
  size?: 'sm' | 'md'
}

export function LockBadge({ className = '', size = 'sm' }: LockBadgeProps) {
  const sizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  }
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      aria-label="Premium"
    >
      <svg
        className={sizes[size]}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="3" y="7" width="10" height="8" rx="1.5" fill="currentColor" opacity="0.9" />
        <path
          d="M5 7V5a3 3 0 0 1 6 0v2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  )
}
