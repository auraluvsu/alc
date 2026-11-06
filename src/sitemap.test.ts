import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { COURSES } from './courses'
import { render } from './entry-server'

const ORIGIN = 'https://alc-orcin.vercel.app'
const sitemap = readFileSync('public/sitemap.xml', 'utf8')
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
const paths = locs.map((l) => new URL(l).pathname.replace(/\/+$/, '') || '/')

/** Every crawlable route implied by the course data (quiz pages are interactive, so not listed). */
function expected(): Set<string> {
  const s = new Set<string>(['/'])
  for (const c of Object.values(COURSES)) {
    s.add(c.base)
    s.add(`${c.base}/reference`)
    if (c.standard.length) s.add(`${c.base}/standard`)
    if (c.design !== false) s.add(`${c.base}/design`)
    for (const m of c.modules) {
      if (!m.lessons.length) continue
      s.add(`${c.base}/module-${m.n}`)
      m.lessons.forEach((_, i) => i > 0 && s.add(`${c.base}/module-${m.n}-${i + 1}`)) // lesson 1 lives at module-N
    }
  }
  return s
}

describe('sitemap.xml', () => {
  it('uses the production origin and has no duplicates', () => {
    expect(locs.every((l) => l.startsWith(ORIGIN))).toBe(true)
    expect(new Set(paths).size).toBe(paths.length)
  })
  it('lists every route generated from course data', () => {
    const have = new Set(paths)
    const missing = [...expected()].filter((p) => !have.has(p))
    expect(missing, 'routes missing from public/sitemap.xml').toEqual([])
  })
  it('lists no stale routes', () => {
    const want = expected()
    const stale = paths.filter((p) => !want.has(p))
    expect(stale, 'sitemap entries with no matching content').toEqual([])
  })
  it('robots.txt points at the sitemap', () => {
    expect(readFileSync('public/robots.txt', 'utf8')).toContain(`${ORIGIN}/sitemap.xml`)
  })
})

describe('server render of every sitemap path', () => {
  it('produces non-empty html and a unique title', () => {
    const titles = new Map<string, string>()
    for (const p of paths) {
      const { html, title, section } = render(p)
      expect(html.length, `${p}: empty html`).toBeGreaterThan(200)
      expect(title.trim(), `${p}: empty title`).not.toBe('')
      expect(section, p).toBeTruthy()
      expect(titles.has(title), `${p}: title "${title}" duplicates ${titles.get(title)}`).toBe(false)
      titles.set(title, p)
    }
  })
})
