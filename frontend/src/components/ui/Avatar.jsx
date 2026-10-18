const tones = {
  brand: 'bg-brand-soft text-brand',
  accent: 'bg-accent-soft text-accent-dark',
  mint: 'bg-mint-soft text-mint-dark',
  neutral: 'bg-line text-muted',
}

const sizes = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-base',
}

export default function Avatar({ initials, tone = 'brand', size = 'md', online = false, ring = false }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full font-bold ${tones[tone]} ${sizes[size]} ${
        ring ? 'ring-2 ring-white' : ''
      }`}
    >
      {initials}
      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-mint" />
      )}
    </span>
  )
}
