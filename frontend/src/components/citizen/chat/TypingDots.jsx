import Assistant from './Assistant'

export default function TypingDots() {
  return (
    <Assistant>
      <div role="status" aria-label="WaKiL AI is typing" className="flex items-center gap-2 py-2 text-muted text-sm">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              aria-hidden="true"
              className="typing-dot h-2 w-2 rounded-full bg-muted"
              style={{ '--d': `${i * 160}ms` }}
            />
          ))}
        </div>
        <span className="text-xs">WaKiL AI is thinking...</span>
      </div>
    </Assistant>
  )
}
