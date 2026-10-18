import { PIXEL_MP_PALETTE, PIXEL_MP_ROWS } from '../../data/pixelMp'

// Merge horizontal runs of the same colour into one rect so the SVG stays small.
const rects = PIXEL_MP_ROWS.flatMap((row, y) => {
  const runs = []
  let x = 0
  while (x < row.length) {
    const ch = row[x]
    let end = x
    while (end + 1 < row.length && row[end + 1] === ch) end += 1
    if (ch !== '.') runs.push({ x, y, w: end - x + 1, fill: PIXEL_MP_PALETTE[ch] })
    x = end + 1
  }
  return runs
})

export default function PixelMp({ className = '' }) {
  return (
    <svg
      viewBox={`0 0 ${PIXEL_MP_ROWS[0].length} ${PIXEL_MP_ROWS.length}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      {rects.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height="1" fill={r.fill} />
      ))}
    </svg>
  )
}
