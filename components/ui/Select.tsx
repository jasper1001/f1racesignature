'use client'

interface SelectOption {
  value: string
  label: string
  locked?: boolean
}

interface SelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
}

export function Select({ options, value, onChange, label, className = '' }: SelectProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-medium text-[#aaaaaa] uppercase tracking-widest">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-[#111111] border border-[#222222] text-white text-sm rounded-lg px-3 py-2.5 pr-8 cursor-pointer focus:outline-none focus:border-[#444444] hover:border-[#333333] transition-colors"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.locked ? '🔒 ' : ''}{opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#aaaaaa]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}
