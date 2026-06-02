import { ImageResponse } from 'next/og'

export const alt = 'F1RaceSignature — Where Speed Becomes Art'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#030303',
          position: 'relative',
        }}
      >
        {/* Subtle grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Gold glow */}
        <div
          style={{
            position: 'absolute',
            width: 800,
            height: 500,
            borderRadius: 9999,
            background: 'radial-gradient(closest-side, rgba(212,160,23,0.18), transparent)',
            display: 'flex',
          }}
        />

        {/* Racing line accent */}
        <svg width="520" height="160" viewBox="0 0 520 160" style={{ marginBottom: 28 }}>
          <path
            d="M20 120 C 80 40, 160 40, 220 90 C 280 140, 340 140, 380 80 C 410 36, 460 36, 500 60"
            fill="none"
            stroke="#d4a017"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="20" cy="120" r="10" fill="#d4a017" />
        </svg>

        <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, color: '#f5f5f5', letterSpacing: -1 }}>
          F1Race<span style={{ color: '#d4a017' }}>Signature</span>
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: '#888888', marginTop: 16, fontStyle: 'italic' }}>
          Where Speed Becomes Art
        </div>
        <div style={{ display: 'flex', fontSize: 20, color: '#555555', marginTop: 36, letterSpacing: 4 }}>
          F1 TELEMETRY · RENDERED AS COLLECTIBLE POSTER ART
        </div>
      </div>
    ),
    { ...size },
  )
}
