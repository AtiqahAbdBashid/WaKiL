// Page heading with an optional subtitle and an optional element on the right.
export default function PageTitle({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-base text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
