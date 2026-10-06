import PageColumns from '../dashboard/PageColumns'

export default function PagePlaceholder({ title }) {
  return (
    <PageColumns>
      <h1 className="text-3xl font-extrabold text-ink">{title}</h1>
      <p className="mt-2 text-muted">This page is not built yet.</p>
    </PageColumns>
  )
}
