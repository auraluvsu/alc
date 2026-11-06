// Post-build checks on dist/ (run after `npm run build`). Exits non-zero on any problem.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const origin = 'https://alc-orcin.vercel.app'
const sitemap = readFileSync('public/sitemap.xml', 'utf8')
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/\/+$/, '') || '/')
const errors = []
const titles = new Map()

for (const p of paths) {
  const file = p === '/' ? 'dist/index.html' : join('dist', p, 'index.html')
  if (!existsSync(file)) { errors.push(`${p}: missing ${file}`); continue }
  const html = readFileSync(file, 'utf8')
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim()
  if (!title) errors.push(`${p}: no <title>`)
  else if (titles.has(title)) errors.push(`${p}: duplicate title with ${titles.get(title)}`)
  else titles.set(title, p)
  const canon = [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => m[1])
  if (canon.length !== 1 || canon[0] !== origin + p) errors.push(`${p}: canonical ${JSON.stringify(canon)}`)
  if (!/<html [^>]*data-section="[^"]+"/.test(html)) errors.push(`${p}: no data-section`)
  if (html.includes('<div id="root"></div>')) errors.push(`${p}: root not prerendered`)
}
if (existsSync('dist-ssr')) errors.push('dist-ssr was not cleaned up')
if (!existsSync('dist/robots.txt') || !existsSync('dist/sitemap.xml')) errors.push('robots.txt/sitemap.xml not copied to dist')

if (errors.length) {
  console.error(errors.slice(0, 50).join('\n') + `\n${errors.length} problem(s)`)
  process.exit(1)
}
console.log(`verified ${paths.length} prerendered pages`)
