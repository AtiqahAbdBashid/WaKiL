// Shared modal focus management: focus the first focusable node, trap Tab
// inside the dialog, lock body scroll, and restore both on close.
import { useEffect, useRef } from "react";

const FOCUSABLE = 'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';

export default function useDialogFocus(open) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open || !ref.current) return;
    const node = ref.current;
    const previous = document.activeElement;
    node.querySelector(FOCUSABLE)?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const trapTab = (e) => {
      if (e.key !== "Tab") return;
      const items = node.querySelectorAll(FOCUSABLE);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    node.addEventListener("keydown", trapTab);
    return () => {
      node.removeEventListener("keydown", trapTab);
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, [open]);
  return ref;
}
