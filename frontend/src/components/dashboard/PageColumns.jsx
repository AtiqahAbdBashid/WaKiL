export default function PageColumns({ rail, children }) {
  return (
    <div className="flex flex-1 flex-col xl:flex-row">
      <div className="min-w-0 flex-1 px-5 py-6 md:px-8 md:py-8">{children}</div>
      {rail && (
        <aside className="flex shrink-0 flex-col border-t border-line px-5 py-6 md:px-6 xl:w-[23rem] xl:border-l xl:border-t-0">
          {rail}
        </aside>
      )}
    </div>
  )
}
