const tones = {
  brand: 'bg-brand-soft text-brand',
  accent: 'bg-accent-soft text-accent-dark',
  mint: 'bg-mint-soft text-mint-dark',
  neutral: 'bg-canvas text-muted',
  onColor: 'bg-white/20 text-white',
  onColorDark: 'bg-black/20 text-white',
}

export default function Badge({ tone = 'brand', caps = false, className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
        caps ? 'uppercase tracking-wider' : ''
      } ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
