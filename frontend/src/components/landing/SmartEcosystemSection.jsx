import Reveal from '../ui/Reveal'
import SectionHeader from './SectionHeader'
import { ecosystemFeatures, ecosystemSteps } from '../../data/landingContent'

export default function SmartEcosystemSection() {
  return (
    <section
      id="smart-ecosystem"
      aria-labelledby="smart-ecosystem-title"
      className="px-4 pb-20 pt-14 sm:px-6 lg:pb-28 lg:pt-16"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          id="smart-ecosystem-title"
          eyebrow="Smart ecosystem"
          title="Everything you need, from report to result"
          scrim
        >
          Report a problem, follow it as it moves, and hear back, all in one place.
        </SectionHeader>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {ecosystemFeatures.map(({ icon: Icon, title, text }, i) => (
            <Reveal
              as="li"
              key={title}
              delay={(i % 2) * 90}
              className="lift rounded-3xl border border-line bg-white p-6 shadow-card"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-xl font-bold text-ink">{title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{text}</p>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-14 rounded-3xl bg-brand p-8 text-white shadow-glow-brand sm:p-10">
          <h3 className="text-2xl font-extrabold">From report to resolution</h3>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {ecosystemSteps.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white font-extrabold text-brand">
                  {i + 1}
                </span>
                {i < ecosystemSteps.length - 1 && (
                  <Reveal
                    as="span"
                    effect="grow"
                    delay={250 + i * 350}
                    aria-hidden="true"
                    className="absolute -right-5 left-14 top-[1.375rem] hidden h-0.5 -translate-y-1/2 rounded-full bg-white/50 md:block"
                  />
                )}
                <h4 className="mt-4 flex items-center gap-2 text-lg font-bold">
                  {title}
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </h4>
                <p className="mt-1 leading-relaxed text-white">{text}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}
