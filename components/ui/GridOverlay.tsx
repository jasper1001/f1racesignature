/** Faint blueprint-grid background for teaser cards. Parent needs `relative`. */
export function GridOverlay() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    />
  )
}
