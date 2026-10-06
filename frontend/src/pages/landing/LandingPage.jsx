import { ChevronDown } from 'lucide-react'

import AboutSection from '../../components/landing/AboutSection'
import SmartEcosystemSection from '../../components/landing/SmartEcosystemSection'
import StatsSection from '../../components/landing/StatsSection'
import klccHero from '../../assets/klcc-hero.jpg'
import { scrollToSection } from '../../utils/scrollToSection'

export default function LandingPage() {
  return (
    <>
      <section
        aria-labelledby="hero-title"
        className="relative flex min-h-[calc(100svh-6rem)] flex-col items-center justify-center px-5 py-28 text-center sm:px-8"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -bottom-40 -top-24 -z-10 overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)] md:-bottom-52 lg:-bottom-64"
        >
          <img src={klccHero} alt="" className="hero-drift h-full w-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-b from-canvas/45 via-canvas/55 to-canvas/90" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-canvas/95 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-canvas)_0%,transparent_60%)] opacity-80" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <div aria-hidden="true" className="absolute -inset-x-10 -inset-y-10 -z-10 rounded-[3rem] bg-canvas/85 blur-xl" />
          <h1
            id="hero-title"
            className="text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl"
          >
            <span className="hero-rise block">A Stronger Malaysia, Together.</span>
            <span className="hero-rise block" style={{ '--d': '60ms' }}>
              Through Smarter Conversation.
            </span>
          </h1>
          <p className="hero-rise mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-ink/80" style={{ '--d': '120ms' }}>
            Connect citizen complaints directly to Service Centre through Artificial Intelligence and data-driven
            analytics.
          </p>
          <p className="hero-rise mt-3 text-base font-semibold italic text-accent-dark" style={{ '--d': '180ms' }}>
            Conversations that lead to real civic action.
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-8 flex justify-center">
          <a
            href="#smart-ecosystem"
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('smart-ecosystem')
            }}
            className="hero-rise inline-flex items-center gap-1 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-brand transition hover:bg-white focus-visible:outline-2 focus-visible:outline-brand motion-safe:active:scale-[0.97]"
            style={{ '--d': '240ms' }}
          >
            See how it works
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      <SmartEcosystemSection />
      <StatsSection />
      <AboutSection />
    </>
  )
}
