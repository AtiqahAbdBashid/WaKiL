import { Link } from 'react-router-dom'

import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Reveal from '../ui/Reveal'
import { aboutValues, pilotAreas } from '../../data/landingContent'

export default function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-title" className="px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-widest text-brand">About WaKiL</p>
            <h2 id="about-title" className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Two-way conversation between people and their representatives
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              WaKiL connects citizens with their elected representatives through transparent two-way communication, so
              every complaint is seen, tracked and answered.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} to="/citizen/login" size="lg" className="motion-safe:active:scale-[0.97]">
                Citizen Portal
              </Button>
              <Button as={Link} to="/yb/login" variant="outline" size="lg" className="motion-safe:active:scale-[0.97]">
                YB Portal
              </Button>
            </div>
          </Reveal>

          <div>
            <Reveal as="h3" delay={100} className="text-xl font-bold text-ink">
              Pilot areas
            </Reveal>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {pilotAreas.map((area, i) => (
                <Reveal
                  as="li"
                  key={area.code}
                  delay={160 + i * 90}
                  className="lift rounded-3xl border border-line bg-white p-6 shadow-card"
                >
                  <Badge tone="mint">Pilot area</Badge>
                  <p className="mt-4 text-xl font-bold text-ink">{area.name}</p>
                  <p className="text-muted">{area.code}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>

        <ul className="mt-14 grid gap-5 md:grid-cols-3">
          {aboutValues.map(({ icon: Icon, title, text }, i) => (
            <Reveal as="li" key={title} delay={i * 90} className="lift rounded-3xl border border-line bg-white p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-dark">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-xl font-bold text-ink">{title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
