import { Droplet, Lightbulb, Trash2, TriangleAlert } from 'lucide-react'

const categories = {
  'Roads & Infrastructure': { icon: TriangleAlert, bg: 'bg-navy' },
  Roads: { icon: TriangleAlert, bg: 'bg-navy' },
  'Street lights': { icon: Lightbulb, bg: 'bg-accent' },
  'Flooding & Drainage': { icon: Droplet, bg: 'bg-brand' },
  Drainage: { icon: Droplet, bg: 'bg-brand' },
  'Cleanliness & Environment': { icon: Trash2, bg: 'bg-mint-dark' },
  Rubbish: { icon: Trash2, bg: 'bg-mint-dark' },
}

export default function CategoryTile({ category }) {
  const { icon: Icon, bg } = categories[category] ?? categories.Roads
  return (
    <span
      aria-hidden="true"
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white ${bg}`}
    >
      <Icon className="h-5 w-5" />
    </span>
  )
}
