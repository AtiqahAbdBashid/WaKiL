import { useEffect, useState } from 'react'

import { useInView } from '../../hooks/useInView'

const SETTLE_MS = 1000

export default function Reveal({
  as: Tag = 'div',
  effect = 'rise',
  delay = 0,
  className = '',
  style,
  children,
  ...props
}) {
  const [ref, inView] = useInView()
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!inView) return undefined
    const timer = setTimeout(() => setSettled(true), delay + SETTLE_MS)
    return () => clearTimeout(timer)
  }, [inView, delay])

  const state = settled ? 'done' : inView ? 'shown' : 'hidden'

  return (
    <Tag
      ref={ref}
      data-reveal={state}
      data-effect={effect}
      style={{ '--reveal-delay': `${delay}ms`, ...style }}
      className={className}
      {...props}
    >
      {children}
    </Tag>
  )
}
