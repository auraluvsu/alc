import { SiteBar } from '../components/SiteBar'
import { Plus } from '../components/Bridge'
import { to } from '../router'
import { LANGUAGES, SITE_NAME } from '../site'
import { COURSES } from '../courses'
import { passed, readProgress, resumePoint } from '../progress'
import type { Course } from '../course'
import { Logo } from '../components/Logo'
import { useReveal } from '../components/reveal'

/** Where a reader is in one course, read from that course's saved progress. */
function status(c: Course) {
  const p = readProgress(c.progressKey)
  const live = c.modules.filter((m) => m.lessons.length > 0)
  const complete = c.modules.filter((m) => passed(p, m.n)).length
  const next = live.find((m) => !passed(p, m.n))
  const started = complete > 0 || Object.keys(p.lessons).length > 0
  return { complete, total: c.modules.length, next, started, resume: resumePoint(c, p) }
}

export default function Home() {
  // A card can cover several courses (ML & Data): its progress is the sum, and its button
  // continues the first course that isn't finished.
  const courses = LANGUAGES.map((l) => {
    const list = (l.courses ?? [l.id]).map((id) => COURSES[id]).filter(Boolean)
    if (!list.length) return { lang: l, course: undefined, s: null }
    const all = list.map((c) => ({ c, s: status(c) }))
    const cur = all.find((x) => x.s.next) ?? all[0]
    const s = {
      complete: all.reduce((n, x) => n + x.s.complete, 0),
      total: all.reduce((n, x) => n + x.s.total, 0),
      next: cur.s.next,
      resume: cur.s.resume,
      started: all.some((x) => x.s.started),
    }
    return { lang: l, course: cur.c, s }
  })

  useReveal()

  return (
    <div className="hub">
      <SiteBar current="/" />
      <main className="hub-main">
        <section className="hub-hero rise">
          <div className="aurora" aria-hidden="true" />
          <Logo size={64} animate className="hub-logo" />
          <span className="hub-eyebrow">A personal school for programming languages</span>
          <h1>{SITE_NAME}</h1>
          <p>
            One language at a time, taught from first principles and checked with quizzes. Each language gets a full
            course, a quick-reference dictionary and a guide to its standard library.
          </p>
          <div className="btn-row">
            {courses.map(({ lang, course, s }, i) => course && s && (
              <a key={lang.id} className={'hub-btn' + (i === 0 ? ' primary' : '')}
                 href={to(s.resume ? s.resume.href : s.started && s.next ? `${course.base}/module-${s.next.n}` : course.base)}>
                {s.resume ? <>Resume <Plus text={lang.name} /></> : s.started && s.next ? <>Continue <Plus text={lang.name} />: module {s.next.n}</> : <>Start <Plus text={lang.name} /></>}
              </a>
            ))}
          </div>
        </section>

        <section className="hub-section">
          <div className="hub-section-head reveal">
            <h2>Languages</h2>
            <span className="hub-count">{LANGUAGES.length} of many</span>
          </div>
          <div className="hub-grid">
            {courses.map(({ lang: l, s }) => (
              <article key={l.id} className={`lang-card reveal ${l.accent}`}>
                <header>
                  <span className="lang-card-name"><Plus text={l.name} /></span>
                  {s && <span className="lang-card-pill">{s.complete} / {s.total} modules</span>}
                </header>
                <p>{l.tagline}</p>
                {s && (
                  <div className="lang-card-bar" aria-label={`${s.complete} of ${s.total} modules complete`}>
                    <span style={{ width: `${(s.complete / s.total) * 100}%` }} />
                  </div>
                )}
                <ul>
                  {l.links.map((k) => (
                    <li key={k.to}>
                      <a href={to(k.to)}><strong>{k.label}</strong><span>{k.desc}</span><i aria-hidden="true">→</i></a>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
            <article className="lang-card next-lang reveal">
              <header><span className="lang-card-name">More languages coming soon</span></header>
              <p>Every new course gets the same treatment: lessons, quizzes, a dictionary and notes for developers coming from other languages.</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}
