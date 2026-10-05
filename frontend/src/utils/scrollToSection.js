export function scrollToSection(id) {
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' })
}
