import { useEffect, useState } from 'react'

import { useInView } from '../../hooks/useInView'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

export default function CountUp({ value, duration = 1200 }) {
  const decimals = String(value).split('.')[1]?.length ?? 0
  const reduced = usePrefersReducedMotion()
  const [ref, inView] = useInView()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!inView || reduced) return undefined
    let frame
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      setCurrent(t === 1 ? value : value * (1 - (1 - t) ** 3))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, reduced, value, duration])

  const shown = reduced ? value : current

  return (
    <>
      <span ref={ref} aria-hidden="true" className="tabular-nums">
        {shown.toFixed(decimals)}
      </span>
      <span className="sr-only">{value}</span>
    </>
  )
}
