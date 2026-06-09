'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FAQ_ITEMS } from '@/lib/faq'

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="py-24 border-t border-[#0f0f0f]" aria-labelledby="faq-heading">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[#d4a017] text-xs font-medium uppercase tracking-widest mb-3">
            Questions
          </p>
          <h2
            id="faq-heading"
            className="text-3xl md:text-4xl text-white"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Frequently Asked
          </h2>
        </div>

        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={i}
                className="border border-[#161616] rounded-xl overflow-hidden bg-[#0a0a0a]"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-white text-sm font-medium">{item.q}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className={`flex-shrink-0 text-[#d4a017] transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
                  >
                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className="px-5 pb-4 text-[#888888] text-sm leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
