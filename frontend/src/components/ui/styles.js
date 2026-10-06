// Shared Tailwind classes for inputs, labels and buttons, so every form looks the same.
export const inputClass =
  "min-h-11 w-full rounded-ticket border border-line-ink bg-paper px-3 text-base text-ink transition-colors focus:border-brand focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand aria-[invalid=true]:border-red-600";

export const labelClass = "mb-1 block text-sm font-bold text-ink";

export const errorClass = "mt-1 text-sm font-medium text-red-700";

export const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-ticket bg-brand px-5 py-2 text-sm font-bold text-paper transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft";

export const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-ticket border-2 border-ink/80 px-5 py-2 text-sm font-bold text-ink transition-colors hover:border-brand hover:text-brand";

export const textLink =
  "font-bold text-brand underline decoration-2 underline-offset-4 hover:text-brand-deep";
