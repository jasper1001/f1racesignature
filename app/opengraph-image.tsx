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
        }}
      >
        {/* Soft vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.52) 100%)',
            display: 'flex',
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            display: 'flex',
            fontSize: 96,
            fontWeight: 800,
            color: '#f0f0f0',
            letterSpacing: '-3px',
            lineHeight: 1,
          }}
        >
          F1Race
          <span style={{ color: '#d4a017' }}>Signature</span>
          <span style={{ color: '#484848', fontWeight: 600 }}>.site</span>
        </div>

        {/* Separator */}
        <div
          style={{
            display: 'flex',
            width: 64,
            height: 2,
            background: '#d4a017',
            marginTop: 32,
            marginBottom: 32,
            opacity: 0.6,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            fontSize: 32,
            color: '#777777',
            fontStyle: 'italic',
            letterSpacing: '0.5px',
          }}
        >
          Where Speed Becomes Art
        </div>
      </div>
    ),
    { ...size },
  )
}
