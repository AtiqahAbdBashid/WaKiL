export default function Assistant({ children }) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white shadow-sm"
      >
        W
      </span>
      <div className="min-w-0 flex-1 space-y-3 text-[15px] leading-relaxed text-ink">{children}</div>
    </div>
  )
}
