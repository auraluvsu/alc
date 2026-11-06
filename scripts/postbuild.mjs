// Artifact build only: the artifact host wraps the page in its own <!doctype>/<head>/<body>,
// so strip ours and hoist <title> (titles are read from the first 8KB).
import { readFileSync, writeFileSync } from 'node:fs'
const f = 'dist-artifact/index.html'
let html = readFileSync(f, 'utf8')
html = html
  .replace(/<!doctype html>/i, '')
  .replace(/<\/?(html|head|body)[^>]*>/gi, '')
  .replace(/<meta charset[^>]*>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '')
const head = []
html = html.replace(/<title>[\s\S]*?<\/title>\s*/, (m) => { head.push(m.trim()); return '' })
html = html.replace(/<meta name="claude:viewport-fit-sides"[^>]*>\s*/, (m) => { head.push(m.trim()); return '' })
writeFileSync(f, head.join('\n') + '\n' + html.trim() + '\n')
