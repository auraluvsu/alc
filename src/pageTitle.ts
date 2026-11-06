import { SITE_NAME } from './site'
import { BY_SECTION } from './courses'

const VIEWS: Record<string, string> = { reference: 'Reference', standard: 'Standard library', design: 'Design' }

/** <title> for an app path. Shared by the client (App.tsx) and the prerenderer (entry-server.tsx). */
export function pageTitle(path: string): string {
  const [, section = '', ...rest] = path.split('/')
  const sub = rest.join('/')
  const course = BY_SECTION[section]
  if (section === 'design') return `Design · ${SITE_NAME}`
  if (!course) return SITE_NAME
  const brand = `${course.brand} · ${SITE_NAME}`
  const mod = sub.match(/^module-(\d+)(?:-(\d+))?$/)
  if (mod) {
    const m = course.modules.find((x) => x.n === +mod[1])
    if (m) {
      const lesson = mod[2] ? m.lessons[+mod[2] - 1] : undefined
      return `${lesson ? `${lesson.title} · ` : ''}${m.title} · ${brand}`
    }
  }
  return VIEWS[sub] ? `${VIEWS[sub]} · ${brand}` : brand
}
