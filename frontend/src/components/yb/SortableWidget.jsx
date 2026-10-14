// Sortable wrapper for one dashboard widget. Edit chrome only in edit mode.
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, EyeOff, GripVertical } from "lucide-react";

export default function SortableWidget({
  id,
  label,
  span,
  rowSpan = "",
  editing,
  hideDisabled,
  onHide,
  onMove,
  isFirst,
  isLast,
  children,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !editing });

  if (!editing) {
    return <div className={`${span} ${rowSpan} h-full`}>{children}</div>;
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${span} ${rowSpan} h-full ${isDragging ? "relative z-10 opacity-90" : ""}`}
    >
      <div className="mb-1 flex min-h-11 items-center gap-1 rounded-2xl border border-dashed border-line-ink bg-canvas px-2">
        <button
          type="button"
          aria-label={`Drag ${label} to reorder`}
          className="inline-flex min-h-11 min-w-11 cursor-grab touch-none items-center justify-center rounded text-ink-soft active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{label}</span>
        <button
          type="button"
          aria-label={`Move ${label} earlier`}
          disabled={isFirst}
          onClick={() => onMove(id, -1)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded text-ink-soft disabled:opacity-30"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label={`Move ${label} later`}
          disabled={isLast}
          onClick={() => onMove(id, 1)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded text-ink-soft disabled:opacity-30"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label={`Hide ${label}`}
          disabled={hideDisabled}
          onClick={() => onHide(id)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded text-ink-soft disabled:opacity-30"
        >
          <EyeOff className="h-5 w-5" />
        </button>
      </div>
      <div inert={editing} className="h-full rounded-2xl ring-2 ring-brand/40 ring-offset-2 ring-offset-paper">{children}</div>
    </div>
  );
}
