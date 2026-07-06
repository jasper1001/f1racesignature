import { Header } from '@/components/layout/Header'

/** Shared route-level loading state — shown while async pages fetch data. */
export function PageLoading({ label = 'Loading' }: { label?: string }) {
  return (
    <>
      <Header />
      <main className="pt-14 min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
          <span className="relative flex w-10 h-10">
            <span className="absolute inset-0 rounded-full border-2 border-[#1a1a1a]" />
            <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#d4a017] animate-spin" />
          </span>
          <p className="text-white/65 text-xs font-mono uppercase tracking-widest">{label}…</p>
        </div>
      </main>
    </>
  )
}
