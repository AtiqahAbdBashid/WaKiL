import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

import MyDigitalIdButton from './MyDigitalIdButton'
import { brandSolidButton, inputClass } from '../ui/styles'
import useDialogFocus from '../yb/useDialogFocus'

export default function CitizenLoginDialog({ open, onClose }) {
  const navigate = useNavigate()
  const dialogRef = useDialogFocus(open)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  // TODO: replace with real email sign-in and the MyDigital ID redirect flow
  const handleLogin = (e) => {
    e?.preventDefault()
    onClose()
    navigate('/citizen/dashboard')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="citizen-login-title"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-[33rem] overflow-y-auto rounded-3xl bg-white p-8 shadow-card sm:p-10"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close login"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="text-center">
          <h2 id="citizen-login-title" className="text-4xl font-extrabold tracking-tight text-ink">
            Log In
          </h2>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-3">
          <div>
            <label htmlFor="citizen-email" className="sr-only">
              Email
            </label>
            <input
              id="citizen-email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="citizen-password" className="sr-only">
              Password
            </label>
            <input
              id="citizen-password"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              className={inputClass}
            />
          </div>
          <button type="submit" className={brandSolidButton}>
            Log In
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted">
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
          or
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </div>

        <MyDigitalIdButton onClick={handleLogin} />

        <p className="mt-6 border-t border-line pt-6 text-center text-sm text-muted">
          No MyDigital ID?{' '}
          {/* TODO: link to the MyDigital ID registration guide */}
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="font-semibold text-brand hover:underline"
          >
            Register Here
          </a>
        </p>
      </div>
    </div>
  )
}
