type PulseSize = 'inline' | 'sm' | 'lg'

type SizeSpec = { bar: number; height: number; gap: number }

const SIZES: Record<PulseSize, SizeSpec> = {
  inline: { bar: 2.5, height: 11, gap: 2 },
  sm: { bar: 3, height: 16, gap: 3 },
  lg: { bar: 5, height: 38, gap: 5 },
}

const BAR_COUNT = 5
// Per-bar scale ceiling so the wave reads as an irregular waveform, not a uniform bounce.
const PEAKS = [0.55, 0.85, 1, 0.7, 0.45]

const LABEL_SIZE: Record<PulseSize, string> = {
  inline: 'text-[12px]',
  sm: 'text-[12px]',
  lg: 'text-[13px]',
}

// 'lime' for dark surfaces, 'dark' for lime/rose buttons where lime bars vanish.
const TONE: Record<'lime' | 'dark', string> = {
  lime: 'var(--lime)',
  dark: 'var(--void)',
}

export function PulseLoader({
  size = 'sm',
  label,
  tone = 'lime',
  className = '',
}: {
  size?: PulseSize
  label?: string
  tone?: 'lime' | 'dark'
  className?: string
}) {
  const spec = SIZES[size]

  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`}
      role="status"
      aria-label={label ?? 'Loading'}
    >
      <span
        className="inline-flex items-end"
        style={{ gap: `${spec.gap}px`, height: `${spec.height}px` }}
        aria-hidden="true"
      >
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <span
            key={i}
            className="pulse-bar"
            style={{
              width: `${spec.bar}px`,
              height: `${spec.height}px`,
              maxHeight: `${spec.height * PEAKS[i]}px`,
              background: TONE[tone],
              animationDelay: `${i * 0.11}s`,
            }}
          />
        ))}
      </span>
      {label && (
        <span
          className={`font-mono ${LABEL_SIZE[size]} ${
            tone === 'dark' ? 'text-void' : 'text-dust'
          } lowercase tracking-tight`}
        >
          {label}
        </span>
      )}
    </span>
  )
}
