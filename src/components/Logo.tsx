import { useId } from 'react'

/**
 * The site mark: an "A" drawn as a ribbon of aurora light on a night-sky tile, with one star.
 * The tile is always dark so the mark reads the same in light and dark themes.
 * `animate` draws the strokes in once on load (skipped under prefers-reduced-motion).
 */
export function Logo({ size = 28, animate = false, className = '' }: { size?: number; animate?: boolean; className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg className={`logo-mark${animate ? ' draw' : ''} ${className}`} width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0c2128" />
          <stop offset="1" stopColor="#141f3d" />
        </linearGradient>
        <radialGradient id={`${id}glow`} cx=".5" cy=".42" r=".5">
          <stop offset="0" stopColor="var(--aurora-b, #5fc9c0)" stopOpacity=".45" />
          <stop offset="1" stopColor="var(--aurora-b, #5fc9c0)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}ribbon`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="var(--aurora-a, #2fbf85)" />
          <stop offset=".55" stopColor="var(--aurora-b, #5fc9c0)" />
          <stop offset="1" stopColor="var(--aurora-c, #a99be0)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill={`url(#${id}sky)`} />
      <ellipse cx="20" cy="18" rx="16" ry="13" fill={`url(#${id}glow)`} />
      <path className="lm-glow" d="M9.5 32 C13 22.5 16 14 20 8.5 C24 14 27 22.5 30.5 32"
        fill="none" stroke={`url(#${id}ribbon)`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity=".16" />
      <circle cx="8.5" cy="11" r=".7" fill="#fff" opacity=".45" />
      <circle cx="26" cy="5.5" r=".55" fill="#fff" opacity=".35" />
      <path className="lm-a" pathLength={1} d="M9.5 32 C13 22.5 16 14 20 8.5 C24 14 27 22.5 30.5 32"
        fill="none" stroke={`url(#${id}ribbon)`} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path className="lm-bar" pathLength={1} d="M13.5 24.5 C17 22.6 23 22.6 26.5 24.5"
        fill="none" stroke={`url(#${id}ribbon)`} strokeWidth="2.6" strokeLinecap="round" opacity=".9" />
      <circle className="lm-star" cx="31" cy="9.5" r="1.4" fill="#fff" />
    </svg>
  )
}
