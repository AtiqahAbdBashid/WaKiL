// Grey note that tells users the page is showing sample data, not real records.
export default function SampleNote({ label = "Nota:", children }) {
  return (
    <p className="rounded-2xl bg-canvas px-4 py-2.5 text-sm text-muted">
      <span className="font-bold text-ink">{label} </span>
      {children}
    </p>
  );
}
