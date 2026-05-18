import { ImageResponse } from 'next/og'

export const alt = 'StackPulse - GitHub release tracker for breaking changes and upgrade notes'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#08080a',
        color: '#e8e8ec',
        fontFamily: 'monospace',
        padding: '60px',
        position: 'relative',
      }}
    >
      {/* Top-left logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            background: '#0d0d10',
            border: '1px solid #26262e',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 8px',
            gap: '4px',
          }}
        >
          <div
            style={{ width: '14px', height: '4px', background: '#a3e635', borderRadius: '2px' }}
          />
          <div
            style={{ width: '22px', height: '4px', background: '#9b9ba1', borderRadius: '2px' }}
          />
          <div
            style={{ width: '18px', height: '4px', background: '#5a5a62', borderRadius: '2px' }}
          />
        </div>
        <div style={{ display: 'flex', fontSize: '24px', fontWeight: 600 }}>
          <span>stack</span>
          <span style={{ color: '#a3e635' }}>.</span>
          <span>pulse</span>
        </div>
      </div>

      {/* Headline */}
      <div
        style={{
          marginTop: '120px',
          display: 'flex',
          flexDirection: 'column',
          fontSize: '92px',
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
        }}
      >
        <div style={{ color: '#5a5a62', fontSize: '32px', marginBottom: '8px' }}>{'/*'}</div>
        <div>Track releases.</div>
        <div style={{ color: '#a3e635' }}>Catch breaks.</div>
        <div style={{ color: '#5a5a62', fontSize: '32px', marginTop: '8px' }}>{'*/'}</div>
      </div>

      {/* Bottom strip */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '20px',
          color: '#5a5a62',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{ width: '10px', height: '10px', background: '#a3e635', borderRadius: '5px' }}
          />
          <span>live</span>
        </div>
        <span style={{ color: '#3a3a42' }}>·</span>
        <span>github releases, AI-distilled</span>
        <span style={{ color: '#3a3a42' }}>·</span>
        <span>breaking changes and upgrade notes</span>
      </div>
    </div>,
    size,
  )
}
