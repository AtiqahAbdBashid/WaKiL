import { mydigitalButton } from '../ui/styles'

// Recreated from docs/ui reference/mydigital-id-button.png: white button, blue outline,
// round "my iD" badge on the left. Colours come from theme tokens.
function MyDigitalIdLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 shrink-0">
      <defs>
        <linearGradient id="mydigital-badge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="[stop-color:var(--color-canvas)]" />
          <stop offset="1" className="[stop-color:var(--color-line-ink)]" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="12" fill="url(#mydigital-badge)" />
      <text x="12.4" y="9.6" fontSize="6.2" fontWeight="700" fontFamily="Arial, sans-serif" className="fill-accent">
        my
      </text>
      <text x="3.2" y="12.6" fontSize="3" fontFamily="Arial, sans-serif" className="fill-mydigital">
        digital
      </text>
      <text x="7.4" y="20" fontSize="11.5" fontWeight="700" fontFamily="Arial, sans-serif" className="fill-mydigital">
        iD
      </text>
    </svg>
  )
}

export default function MyDigitalIdButton({ onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${mydigitalButton} ${className}`}
    >
      <MyDigitalIdLogo />
      Sign in with MyDigital ID
    </button>
  )
}
