// Prerenders every URL in public/sitemap.xml into dist/<path>/index.html so crawlers that
// don't run JS (and fast first paint) get real content. Run after `vite build` and
// `vite build --ssr src/entry-server.tsx --outDir dist-ssr`.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const { render } = await import(pathToFileURL(resolve('dist-ssr/entry-server.js')).href)
const template = readFileSync('dist/index.html', 'utf8')
const sitemap = readFileSync('public/sitemap.xml', 'utf8')
const origin = 'https://alc-orcin.vercel.app'
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/\/+$/, '') || '/')

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
for (const path of paths) {
  const { html, title, section } = render(path)
  let out = template
    .replace('<div id="root"></div>', () => `<div id="root">${html}</div>`)
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(title)}</title>\n<link rel="canonical" href="${origin}${path === '/' ? '/' : path}">`)
    .replace('<html ', `<html data-section="${section}" `)
  const file = path === '/' ? 'dist/index.html' : join('dist', path, 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, out)
}
rmSync('dist-ssr', { recursive: true, force: true })
console.log(`prerendered ${paths.length} pages`)
