// Shared Tailwind classes for inputs, labels and buttons, so every form looks the same.
export const inputClass =
  "min-h-11 w-full rounded-2xl border border-line bg-white px-3 text-base text-ink transition-colors focus:border-brand focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand aria-[invalid=true]:border-red-600";

export const labelClass = "mb-1 block text-sm font-bold text-ink";

export const errorClass = "mt-1 text-sm font-medium text-red-700";

export const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-muted";

export const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border-2 border-ink/80 px-5 py-2 text-sm font-bold text-ink transition-colors hover:border-brand hover:text-brand";

export const textLink =
  "font-bold text-brand underline decoration-2 underline-offset-4 hover:text-brand-deep";

// White button with a MyDigital-blue outline, shared by the login popup buttons.
export const mydigitalButton =
  "flex min-h-12 w-full items-center justify-center gap-3 rounded-md border-2 border-mydigital bg-white px-4 py-2 text-base font-medium text-mydigital transition hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mydigital motion-safe:active:scale-[0.98]";

// Solid primary-blue twin of mydigitalButton, for the login popup's main action.
export const brandSolidButton =
  "flex min-h-12 w-full items-center justify-center gap-3 rounded-md border-2 border-brand bg-brand px-4 py-2 text-base font-medium text-white transition hover:border-brand-dark hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.98]";
