type LogoProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const markSize = { sm: 18, md: 22, lg: 28 } as const
const textSize = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' } as const

export function Logo({ size = 'md', className = '' }: LogoProps) {
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
        <rect width="32" height="32" rx="7" fill="#09090b" />
        <rect x="6" y="8" width="11" height="4" rx="2" fill="#d4a017" />
        <rect x="6" y="14" width="16" height="4" rx="2" fill="#a1a09a" />
        <rect x="6" y="20" width="20" height="4" rx="2" fill="#63635e" />
      </svg>
      <span className={`font-display ${textSize[size]} font-semibold tracking-tight text-ink`}>
        StackPulse
      </span>
    </span>
  )
}
