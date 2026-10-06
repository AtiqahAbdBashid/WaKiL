import { useId } from 'react'

export default function TextField({ label, icon: Icon, trailing, className = '', ...props }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          className={`w-full rounded-2xl border border-line bg-canvas/60 py-3.5 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:bg-white focus:outline-2 focus:outline-brand/30 ${
            Icon ? 'pl-11' : 'pl-4'
          } ${trailing ? 'pr-12' : 'pr-4'}`}
          {...props}
        />
        {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
    </div>
  )
}
