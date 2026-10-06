import { Link, Outlet, useLocation } from 'react-router-dom'

import FloatingChat from '../components/landing/FloatingChat'
import PublicTopbar from '../components/landing/PublicTopbar'

const variants = {
  landing: {
    showLogin: true,
    chat: true,
    footer: 'plain',
    photo: true,
    blobs: [],
  },
  citizen: {
    nav: [{ label: 'How It Works' }, { label: 'Pilot Areas' }, { label: 'FAQ' }, { label: 'About WaKiL' }],
    chat: true,
    footer: 'links',
    blobs: [
      'left-[-5%] top-[-5%] h-[30rem] w-[30rem] bg-brand/20',
      'right-[-5%] top-[35%] h-[30rem] w-[30rem] bg-accent/15',
      'left-[35%] bottom-[-15%] h-96 w-96 bg-mint/25',
    ],
  },
  yb: {
    tag: 'YB PORTAL',
    showLanguage: false,
    footer: 'centered',
    blobs: [
      'left-[10%] top-[-10%] h-[32rem] w-[32rem] bg-brand/15',
      'left-[-5%] bottom-[-5%] h-[30rem] w-[30rem] bg-accent/10',
    ],
  },
}

function pickVariant(pathname) {
  if (pathname.startsWith('/yb')) return variants.yb
  if (pathname.startsWith('/citizen')) return variants.citizen
  return variants.landing
}

function Footer({ mode }) {
  if (mode === 'centered') {
    return (
      <footer className="relative z-10 py-8 text-center text-sm text-muted">
        © 2026 WaKiL. All rights reserved. ·{' '}
        <Link to="/" className="hover:text-brand">
          Privacy Policy
        </Link>
      </footer>
    )
  }
  return (
    <footer className="relative z-10 border-t border-line bg-white/80">
      <div className="flex flex-wrap items-center justify-between gap-3 py-6 pl-4 pr-24 text-sm text-muted sm:pl-6 sm:pr-80">
        <p>© 2026 WaKiL. All rights reserved.</p>
        {mode === 'links' && (
          <p className="flex gap-3">
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-brand">
              Privacy Policy
            </a>
            <span aria-hidden="true">·</span>
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-brand">
              Terms of Use
            </a>
          </p>
        )}
      </div>
    </footer>
  )
}

export default function PublicLayout() {
  const { pathname } = useLocation()
  const v = pickVariant(pathname)

  return (
    <div className="relative flex min-h-screen flex-col overflow-clip bg-canvas">
      <a
        href="#main"
        className="sr-only rounded-full bg-white px-5 py-3 font-semibold text-brand shadow-card focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus-visible:outline-2 focus-visible:outline-brand"
      >
        Skip to main content
      </a>
      {v.blobs.map((cls) => (
        <div key={cls} aria-hidden="true" className={`blob ${cls}`} />
      ))}
      <PublicTopbar
        nav={v.nav}
        tag={v.tag}
        showLogin={v.showLogin}
        showLanguage={v.showLanguage}
        transparent={v.photo}
      />
      <main id="main" className="relative z-10 flex flex-1 flex-col">
        <Outlet />
      </main>
      <Footer mode={v.footer} />
      {v.chat && <FloatingChat />}
    </div>
  )
}
