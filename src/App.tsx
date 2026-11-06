import { useEffect } from 'react'
import Home from './home/Home'
import { SITE_NAME } from './site'
import { navigate, to, useLinkInterception, usePath } from './router'
import CourseShell from './tour/CourseShell'
import { BY_SECTION } from './courses'

// Top-level routes. Add a new section here and to SECTIONS in router.tsx.
//   /          → Aurora's Learning Centre homepage
//   /tour/*    → the C++ course
//   /go/*      → the Go course
//   /python/*  → the Python course
//   /data/*, /ml/*, /dl/* → the three Machine Learning & Data courses
//   /design    → old link: redirects to /tour/design (each course has its own design tab)
export default function App() {
  const path = usePath()
  useLinkInterception()
  const [, section = '', ...rest] = path.split('/')
  const sub = rest.join('/')
  const course = BY_SECTION[section]

  // Each section has its own palette, keyed off data-section on <html>.
  const known = section === '' || section === 'design' || !!course
  useEffect(() => {
    if (section === 'design') navigate('/tour/design', true)
  }, [section])
  useEffect(() => {
    document.documentElement.dataset.section = section || 'home'
    document.title = course ? `${course.brand} · ${SITE_NAME}` : section === 'design' ? `Design · ${SITE_NAME}` : SITE_NAME
  }, [section, course])

  if (!known) return <NotFound path={path} />
  if (section === '') return <Home />
  if (course) return <CourseShell course={course} sub={sub} />
  return null   // /design: redirecting
}

function NotFound({ path }: { path: string }) {
  return (
    <main className="main">
      <div className="col">
        <span className="eyebrow">Page not found</span>
        <h1 style={{ fontSize: 40 }}>Nothing lives at {path}</h1>
        <p style={{ margin: 0, color: 'var(--muted)' }}>The address may be mistyped, or the page may have moved.</p>
        <div className="btn-row"><a className="btn primary" href={to('/')}>Go to the homepage</a></div>
      </div>
    </main>
  )
}
