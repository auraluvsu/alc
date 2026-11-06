import { useEffect } from 'react'

/**
 * Fades in every `.reveal` element on the page as it scrolls into view, staggering
 * elements that arrive together. Uses a data attribute (not a class) so React re-renders
 * never strip it. Without IntersectionObserver, or under reduced motion, everything shows at once.
 */
export function useReveal(dep?: unknown) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not([data-in])'))
    const show = (el: HTMLElement) => el.setAttribute('data-in', '')
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') { els.forEach(show); return }
    const io = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((e, i) => {
        const el = e.target as HTMLElement
        el.style.setProperty('--d', `${Math.min(i, 8) * 70}ms`)
        show(el)
        io.unobserve(el)
      })
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [dep])
}
