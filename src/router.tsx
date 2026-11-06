import { useEffect, useState } from 'react'

/*
 * Tiny router with two modes:
 *  - 'path' (default, for real deployments): URLs are /tour, /tour/module-3-2, /design
 *  - 'hash' (the artifact build, VITE_ROUTER=hash): the artifact host only passes a plain
 *    #name, so the same routes become #tour, #tour-module-3-2, #design
 * App code always works with paths; only this file knows about the difference.
 */
export const MODE: 'path' | 'hash' = import.meta.env.VITE_ROUTER === 'hash' ? 'hash' : 'path'

/** Top-level sections. A hash's first segment is matched against these. */
export const SECTIONS = ['tour', 'design', 'go', 'java', 'python', 'data', 'ml', 'dl', 'systems', 'intro'] as const

function hashToPath(hash: string): string {
  const h = hash.replace(/^#/, '')
  if (!h) return '/'
  for (const s of SECTIONS) {
    if (h === s) return '/' + s
    if (h.startsWith(s + '-')) return `/${s}/${h.slice(s.length + 1)}`
  }
  return '/tour/' + h // links shared before sections existed (#module-1, #reference)
}

function pathToHash(path: string): string {
  const [section, ...rest] = path.replace(/^\/+|\/+$/g, '').split('/')
  if (!section) return '#'
  return '#' + [section, rest.join('-')].filter(Boolean).join('-')
}

/** Set by the prerenderer (entry-server.tsx) so usePath works without `location`. */
let ssrPath = '/'
export const setSsrPath = (p: string) => { ssrPath = p }

function readPath(): string {
  if (typeof location === 'undefined') return ssrPath
  if (MODE === 'hash') return hashToPath(location.hash)
  return location.pathname.replace(/\/+$/, '') || '/'
}

/** Turn an app path into an href for the current mode. */
export const to = (path: string) => (MODE === 'hash' ? pathToHash(path) : path)

export function navigate(path: string, replace = false) {
  if (MODE === 'hash') {
    if (replace) history.replaceState(null, '', pathToHash(path))
    else location.hash = pathToHash(path)
  } else {
    history[replace ? 'replaceState' : 'pushState'](null, '', path)
  }
  dispatchEvent(new Event('routechange'))
}

export function usePath() {
  const [path, setPath] = useState(readPath)
  useEffect(() => {
    const on = () => {
      const next = readPath()
      setPath((prev) => {
        if (prev !== next) window.scrollTo(0, 0)
        return next
      })
    }
    addEventListener('routechange', on)
    addEventListener(MODE === 'hash' ? 'hashchange' : 'popstate', on)
    return () => {
      removeEventListener('routechange', on)
      removeEventListener(MODE === 'hash' ? 'hashchange' : 'popstate', on)
    }
  }, [])
  return path
}

/** In path mode, turn clicks on internal <a href="/..."> links into client-side navigation. */
export function useLinkInterception() {
  useEffect(() => {
    if (MODE !== 'path') return
    const on = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element).closest?.('a')
      const href = a?.getAttribute('href')
      if (!a || !href || !href.startsWith('/') || href.startsWith('//') || a.target) return
      e.preventDefault()
      navigate(href)
    }
    document.addEventListener('click', on)
    return () => document.removeEventListener('click', on)
  }, [])
}
