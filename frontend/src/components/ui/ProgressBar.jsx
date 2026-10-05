const tones = {
  brand: 'bg-brand',
  accent: 'bg-accent',
  mint: 'bg-mint',
}

export default function ProgressBar({ value, tone = 'brand', label, className = '' }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={`h-1.5 w-full max-w-52 overflow-hidden rounded-full bg-line ${className}`}
    >
      <div className={`h-full rounded-full ${tones[tone]}`} style={{ width: `${value}%` }} />
    </div>
  )
}
