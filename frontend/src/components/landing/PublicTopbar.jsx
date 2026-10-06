import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, User } from 'lucide-react'

import Badge from '../ui/Badge'
import Button from '../ui/Button'
import LanguageToggle from '../ui/LanguageToggle'
import Logo from '../ui/Logo'
import { useScrolled } from '../../hooks/usePageScroll'

function LoginMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <Button
        ref={buttonRef}
        variant="outline"
        className="whitespace-nowrap !px-3 motion-safe:active:scale-[0.97] sm:!px-5"
        aria-expanded={open}
        aria-controls="login-options"
        onClick={() => setOpen((o) => !o)}
      >
        <User className="h-4 w-4" aria-hidden="true" />
        Log In
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </Button>
      {open && (
        <div
          id="login-options"
          className="absolute right-0 top-full z-30 mt-2 w-64 rounded-2xl border border-line bg-white p-2 shadow-card"
        >
          <Link
            to="/citizen/login"
            className="block rounded-xl px-4 py-3 hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand"
          >
            <span className="block text-sm font-semibold text-ink">Citizen Portal</span>
            <span className="block text-xs text-muted">Submit and track complaints</span>
          </Link>
          <Link
            to="/yb/login"
            className="block rounded-xl px-4 py-3 hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand"
          >
            <span className="block text-sm font-semibold text-ink">YB Portal</span>
            <span className="block text-xs text-muted">For representatives and office staff</span>
          </Link>
        </div>
      )}
    </div>
  )
}

export default function PublicTopbar({ nav = [], tag, showLogin = false, showLanguage = true, transparent = false }) {
  const scrolled = useScrolled()

  const headerClass = transparent
    ? `sticky top-0 z-30 border-b transition-colors duration-200 ${
        scrolled ? 'border-line bg-white/80 backdrop-blur-md' : 'border-transparent'
      }`
    : 'relative z-20 border-b border-line bg-white'

  return (
    <header className={headerClass}>
      <div
        className={`flex h-24 items-center justify-between gap-6 px-4 sm:px-6 ${
          nav.length > 0 ? 'xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]' : ''
        }`}
      >
        <div className="flex items-center gap-4">
          <Logo className="h-12" />
          {tag === 'YB PORTAL' ? (
            <Badge tone="brand" caps>
              YB Portal
            </Badge>
          ) : (
            <div className="hidden whitespace-nowrap border-l border-line pl-4 md:block">
              <p className="text-[11px] font-bold uppercase leading-tight tracking-widest text-ink">
                Civic &amp; Service Centre Portal
              </p>
              <p className={`text-sm leading-tight ${transparent ? 'text-[#474d6b]' : 'text-muted'}`}>
                People&apos;s Voice, Representative&apos;s Mandate
              </p>
            </div>
          )}
        </div>

        {nav.length > 0 && (
          <nav aria-label="Main" className="hidden items-center gap-8 whitespace-nowrap text-[15px] font-medium xl:flex">
            {/* TODO: the citizen login nav links have no target pages yet */}
            {nav.map((item) => (
              <a
                key={item.label}
                href="#"
                onClick={(e) => e.preventDefault()}
                className="relative py-1 text-ink after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-brand after:content-[''] after:transition-transform after:duration-200 hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand focus-visible:after:scale-x-100 motion-reduce:after:transition-none"
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3 xl:justify-self-end">
          {showLanguage && <LanguageToggle translucent={transparent} />}
          {showLogin && <LoginMenu />}
        </div>
      </div>
    </header>
  )
}
