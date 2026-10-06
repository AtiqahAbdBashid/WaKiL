import { useLanguage } from '../../context/useLanguage'

const options = [
  { value: 'bm', label: 'BM' },
  { value: 'en', label: 'EN' },
]

export default function LanguageToggle({ translucent = false }) {
  const { language, setLanguage } = useLanguage()
  return (
    <div
      role="group"
      aria-label="Language"
      className={`flex items-center rounded-full border p-1 text-xs font-bold ${
        translucent ? 'border-white/70 bg-white/70 backdrop-blur' : 'border-line bg-canvas'
      }`}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={language === opt.value}
          onClick={() => setLanguage(opt.value)}
          className={`rounded-full px-3 py-1 transition focus-visible:outline-2 focus-visible:outline-brand ${
            language === opt.value ? 'bg-brand text-white' : 'text-muted hover:text-ink'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
