import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'

import Button from '../../components/ui/Button'
import IconButton from '../../components/ui/IconButton'
import TextField from '../../components/ui/TextField'

export default function YbLoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  // TODO: replace with real YB office authentication
  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/yb/dashboard')
  }

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[30.5rem] rounded-3xl bg-white p-8 shadow-card sm:p-10"
      >
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">YB Office Sign In</h1>
          <p className="mt-2 text-base text-muted">Sign in with your official office account.</p>
        </div>

        <div className="mt-8 space-y-5">
          <TextField
            label="Official email"
            type="email"
            name="email"
            required
            autoComplete="username"
            icon={Mail}
            placeholder="name@parlimen.gov.my"
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            required
            autoComplete="current-password"
            icon={LockKeyhole}
            placeholder="Enter your password"
            trailing={
              <IconButton
                label={showPassword ? 'Hide password' : 'Show password'}
                icon={showPassword ? EyeOff : Eye}
                onClick={() => setShowPassword((s) => !s)}
              />
            }
          />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-muted">
            <input type="checkbox" name="remember" defaultChecked className="h-4 w-4 rounded accent-brand" />
            Keep me signed in on this device
          </label>
          <a href="#" onClick={(e) => e.preventDefault()} className="font-semibold text-brand hover:underline">
            Forgot password?
          </a>
        </div>

        <Button type="submit" size="lg" className="mt-6 w-full">
          Sign in <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Button>

        <button
          type="button"
          onClick={() => navigate('/yb/dashboard')}
          className="mt-3 w-full rounded-2xl border border-line bg-white py-3 text-sm font-bold text-ink hover:bg-canvas"
        >
          Continue with Google (mock)
        </button>

        <div className="mt-6 space-y-3 border-t border-line pt-6 text-sm text-muted">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Access is limited to authorised YB office staff. All sign-ins are logged.
          </p>
          <p className="text-center">
            No account?{' '}
            <a href="#" onClick={(e) => e.preventDefault()} className="font-semibold text-brand hover:underline">
              Contact your office administrator.
            </a>
          </p>
        </div>
      </form>
    </div>
  )
}
