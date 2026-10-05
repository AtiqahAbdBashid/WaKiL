import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, ShieldCheck } from 'lucide-react'

import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

const points = [
  'Your identity is verified securely',
  'No new password to remember',
  'Your personal data is never shared without your consent',
]

export default function CitizenLoginPage() {
  const navigate = useNavigate()

  // TODO: replace with the real MyDigital ID redirect flow
  const handleLogin = () => navigate('/citizen/dashboard')

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-[33rem] rounded-3xl bg-white p-8 shadow-card sm:p-10">
        <div className="text-center">
          <Badge tone="brand" caps>
            Citizen Portal
          </Badge>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-ink">Log In</h1>
          <p className="mx-auto mt-3 max-w-sm text-base text-muted">
            Log in with your digital identity to submit and track complaints.
          </p>
        </div>

        <ul className="mt-8 space-y-4 rounded-2xl border border-line bg-canvas/60 p-5">
          {points.map((text) => (
            <li key={text} className="flex items-start gap-3 text-sm font-medium text-ink">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint-soft text-mint-dark">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              {text}
            </li>
          ))}
        </ul>

        <Button variant="danger" size="lg" className="mt-6 w-full" onClick={handleLogin}>
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          Log in with MyDigital ID
        </Button>
        <p className="mt-3 text-center text-sm text-muted">
          You will be taken to the MyDigital ID page and returned to WaKiL after verification.
        </p>

        <p className="mt-6 border-t border-line pt-6 text-center text-sm text-muted">
          No MyDigital ID?{' '}
          {/* TODO: link to the MyDigital ID registration guide */}
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
          >
            How to register <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </p>
      </div>
    </div>
  )
}
