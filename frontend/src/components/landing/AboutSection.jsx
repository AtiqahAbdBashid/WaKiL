import { Link } from 'react-router-dom'

import Button from '../ui/Button'
import Reveal from '../ui/Reveal'
import aboutCelebration from '../../assets/about-celebration.png'

export default function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-title" className="blueprint flex min-h-[calc(100svh-6rem)] flex-col justify-center px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto w-full max-w-[96rem]">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal delay={150} className="order-2 lg:order-1">
            <img
              src={aboutCelebration}
              alt=""
              width="501"
              height="302"
              loading="lazy"
              className="h-auto w-full"
            />
          </Reveal>

          <div className="order-1 lg:order-2">
            <Reveal>
              <p className="text-3xl font-extrabold uppercase tracking-widest text-black sm:text-5xl">About WaKiL</p>
              <h2 id="about-title" className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Two-way conversation between people and their representatives
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-blue-50">
                WaKiL connects citizens with their elected representatives through transparent two-way communication,
                so every complaint is seen, tracked and answered.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  as={Link}
                  to="/citizen/login"
                  variant="soft"
                  size="lg"
                  className="focus-visible:outline-white! motion-safe:active:scale-[0.97]"
                >
                  Citizen Portal
                </Button>
                <Button
                  as={Link}
                  to="/yb/login"
                  variant="onColor"
                  size="lg"
                  className="focus-visible:outline-white! motion-safe:active:scale-[0.97]"
                >
                  YB Portal
                </Button>
              </div>
            </Reveal>
          </div>
        </div>

        <p className="mt-16 border-t border-white/20 pt-6 text-center text-sm text-blue-50">
          © 2026 WaKiL. All rights reserved.
        </p>
      </div>
    </section>
  )
}
