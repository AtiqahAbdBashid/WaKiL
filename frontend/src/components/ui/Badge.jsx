const tones = {
  brand: 'bg-brand-soft text-brand',
  accent: 'bg-accent-soft text-accent-dark',
  mint: 'bg-mint-soft text-mint-dark',
  neutral: 'bg-canvas text-muted',
  onColor: 'bg-white/20 text-white',
  onColorDark: 'bg-black/20 text-white',
}

// Status text picks its own tone so call sites stay readable without a tone prop.
const statusTone = {
  Pending: 'brand',
  'In Progress': 'accent',
  New: 'accent',
  'In Review': 'neutral',
  'In Action': 'mint',
  Resolved: 'mint',
}

export default function Badge({ tone, caps = false, className = '', children }) {
  const resolved = tone ?? statusTone[children] ?? 'brand'
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
        caps ? 'uppercase tracking-wider' : ''
      } ${tones[resolved]} ${className}`}
    >
      {children}
    </span>
  )
}
