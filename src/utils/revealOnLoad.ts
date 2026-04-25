export function revealOnLoad(img: HTMLImageElement): void {
  const reveal = () => img.classList.remove('opacity-0')
  if (img.complete && img.naturalWidth > 0) reveal()
  else img.addEventListener('load', reveal, { once: true })
}
