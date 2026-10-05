const variants = {
  primary: 'bg-brand text-white hover:bg-brand-dark shadow-glow-brand',
  danger: 'bg-accent text-white hover:bg-accent-dark shadow-glow-accent',
  outline: 'border-2 border-brand bg-white text-brand hover:bg-brand-soft',
  soft: 'bg-brand-soft text-brand hover:bg-[#dbe7ff] hover:text-brand-dark',
  ghost: 'bg-canvas text-ink hover:bg-line',
  onColor: 'border border-white/80 text-white hover:bg-white/15',
  onColorSoft: 'bg-white/20 text-white hover:bg-white/30',
}

const sizes = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-4 text-base',
}

export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  const typeProp = Tag === 'button' ? { type: 'button' } : {}
  return (
    <Tag
      {...typeProp}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
