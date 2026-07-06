'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { useState } from 'react'
import { ClickTracker } from './ClickTracker'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Static data is immutable per deploy — cache for the whole session.
            staleTime: Infinity,
            gcTime: Infinity,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {/* Respect the OS "reduce motion" setting for all framer-motion animations */}
      <MotionConfig reducedMotion="user">
        <ClickTracker />
        {children}
      </MotionConfig>
    </QueryClientProvider>
  )
}
