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
        {/* terminal chevron */}
        <path
          d="M 9 9.5 L 14.5 16 L 9 22.5"
          fill="none"
          stroke="#a3e635"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* pulse spike */}
        <path
          d="M 16.5 16 L 19.5 16 L 21 10 L 22.5 16 L 25 16"
          fill="none"
          stroke="#a3e635"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* cursor dot */}
        <circle cx="25" cy="16" r="2" fill="#a3e635" />
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
