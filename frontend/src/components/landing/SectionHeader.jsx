import Reveal from '../ui/Reveal'

export default function SectionHeader({ id, eyebrow, title, badge, scrim = false, children }) {
  return (
    <Reveal className={`mx-auto max-w-3xl text-center ${scrim ? 'relative' : ''}`}>
      {scrim && (
        <div aria-hidden="true" className="absolute -inset-x-6 -inset-y-5 -z-10 rounded-[2rem] bg-canvas/75 blur-lg" />
      )}
      {(eyebrow || badge) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {eyebrow && <p className="text-xs font-bold uppercase tracking-widest text-brand">{eyebrow}</p>}
          {badge}
        </div>
      )}
      <h2 id={id} className={`${eyebrow || badge ? 'mt-3 ' : ''}text-3xl font-extrabold tracking-tight text-ink sm:text-4xl`}>
        {title}
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-muted">{children}</p>
    </Reveal>
  )
}
