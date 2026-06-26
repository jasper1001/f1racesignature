import { StudioCTA } from '@/components/games/StudioCTA'

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <StudioCTA />
    </>
  )
}
