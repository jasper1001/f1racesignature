interface ArrowRightIconProps {
  size?: number
  strokeWidth?: number
  className?: string
}

/** Small right-pointing arrow used in "view all" links and CTA buttons. */
export function ArrowRightIcon({ size = 12, strokeWidth = 1.3, className }: ArrowRightIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2 6h8M7 3l3 3-3 3"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
