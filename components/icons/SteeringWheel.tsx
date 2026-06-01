interface IconProps {
  className?: string
}

export function SteeringWheelIcon({ className = '' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 3 L16 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 20 L16 29" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 16 L12 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 16 L29 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.22 7.22 L13.17 13.17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18.83 18.83 L24.78 24.78" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M24.78 7.22 L18.83 13.17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.17 18.83 L7.22 24.78" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
