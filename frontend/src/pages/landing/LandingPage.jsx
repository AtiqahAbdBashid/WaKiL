import AboutSection from '../../components/landing/AboutSection'
import SmartEcosystemSection from '../../components/landing/SmartEcosystemSection'
import StatsSection from '../../components/landing/StatsSection'
import klccHero from '../../assets/klcc-hero.jpg'

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
            Connect citizen complaints directly to Service Centre through{' '}
            <em className="font-semibold text-brand">Artificial Intelligence</em> and{' '}
            <em className="font-semibold text-accent-dark">Data-Driven Analytics</em>.
          </p>
        </div>
      </section>

      <SmartEcosystemSection />
      <StatsSection />
      <AboutSection />
    </>
  )
}
