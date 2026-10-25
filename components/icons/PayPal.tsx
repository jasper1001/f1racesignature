interface IconProps {
  className?: string
  size?: number
}

// Line-style PayPal mark (two offset italic "P"s) — matches the outline icons
// used elsewhere in the footer rather than the filled brand logo.
export function PayPalIcon({ className = '', size = 16 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7 20 9.5 3.5h6a4 4 0 0 1 0 8H11L10 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 20.5h3l.8-5h2.2a4 4 0 0 0 3.9-4.6 3.6 3.6 0 0 0-1.4-2.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
