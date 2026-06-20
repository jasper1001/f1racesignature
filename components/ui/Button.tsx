'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, className = '', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-medium tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none'

    const variants = {
      primary:
        'bg-[#e8002d] text-white hover:bg-[#c8001a] border border-[#e8002d]/30 hover:border-[#c8001a]/30',
      secondary:
        'bg-[#1a1a1a] text-white hover:bg-[#222222] border border-[#333333] hover:border-[#444444]',
      ghost:
        'bg-transparent text-[#aaaaaa] hover:text-white hover:bg-white/5 border border-transparent hover:border-[#333333]',
      gold: 'bg-[#d4a017] text-black hover:bg-[#e8b84b] border border-[#d4a017]/30',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-md',
      md: 'px-4 py-2 text-sm rounded-lg',
      lg: 'px-6 py-3 text-base rounded-xl',
    }

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </motion.button>
    )
  },
)

Button.displayName = 'Button'
