// White card with an optional title bar. Most sections on every page are built with this.
export default function Sheet({ title, icon: Icon, action, children, className = "" }) {
  return (
    <section className={`rounded-ticket border border-line bg-paper shadow-[0_1px_2px_rgb(15_23_42/0.06)] ${className}`}>
      {title && (
        <div className="mx-4 flex min-h-14 items-center justify-between gap-3 border-b border-ink pt-2 md:mx-5">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink">
            {Icon && <Icon className="h-5 w-5 text-brand" />}
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
