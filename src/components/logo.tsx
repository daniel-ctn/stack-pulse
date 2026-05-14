type LogoProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showWordmark?: boolean
}

const markSize = { sm: 18, md: 22, lg: 28 } as const
const textSize = { sm: 'text-[13px]', md: 'text-[15px]', lg: 'text-[17px]' } as const

export function Logo({ size = 'md', className = '', showWordmark = true }: LogoProps) {
  const m = markSize[size]
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={m}
        height={m}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="0.5" y="0.5" width="31" height="31" rx="5" fill="#0d0d10" stroke="#26262e" />
        {/* stack bars / waveform */}
        <rect x="7" y="9" width="10" height="3" rx="1" fill="#a3e635" />
        <rect x="7" y="14.5" width="16" height="3" rx="1" fill="#9b9ba1" />
        <rect x="7" y="20" width="13" height="3" rx="1" fill="#5a5a62" />
        {/* pulse dot */}
        <circle cx="25" cy="10.5" r="1.5" fill="#a3e635" />
      </svg>
      {showWordmark && (
        <span
          className={`font-mono ${textSize[size]} font-semibold tracking-tight text-ink lowercase`}
        >
          stack<span className="text-lime">.</span>pulse
        </span>
      )}
    </span>
  )
}
