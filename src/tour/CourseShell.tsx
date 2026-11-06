import { useEffect, useMemo, useState } from 'react'
import { to } from '../router'
import { useTheme } from '../theme'
import { Standard } from './Standard'
import { DesignPage } from './DesignPage'
import type { Module } from '../content/types'
import { BlockView, Code, CodeLangProvider } from '../components/Blocks'
import { Inline } from '../components/highlight'
import { Quiz } from '../components/Quiz'
import { Bridge, LangProvider, Plus } from '../components/Bridge'
import { CourseCtx, useCourse, type Course } from '../course'
import { passed, PASS_MARK, resumePoint, useProgress, type Progress, type QuizDraft } from '../progress'
import { Logo } from '../components/Logo'
import { useReveal } from '../components/reveal'

type Route = { view: 'home' } | { view: 'module'; n: number; l: number } | { view: 'quiz'; n: number } | { view: 'reference' } | { view: 'standard' } | { view: 'design' }

function parse(sub: string): Route {
  let m = sub.match(/^module-(\d+)(?:-(\d+))?$/)
  if (m) return { view: 'module', n: +m[1], l: m[2] ? +m[2] - 1 : 0 }
  m = sub.match(/^quiz-(\d+)$/)
  if (m) return { view: 'quiz', n: +m[1] }
  if (sub === 'reference') return { view: 'reference' }
  if (sub === 'standard') return { view: 'standard' }
  if (sub === 'design') return { view: 'design' }
  return { view: 'home' }
}

const ready = (m: Module) => m.lessons.length > 0
const doneLessons = (p: Progress, m: Module) => m.lessons.filter((_, i) => p.lessons[`m${m.n}:l${i}`]).length

/** A language course (C++, Go, …). `sub` is the part of the path after the course's base path. */
export default function CourseShell({ course, sub }: { course: Course; sub: string }) {
  return (
    <CourseCtx.Provider value={course}>
      <LangProvider key={course.id}>
        <CodeLangProvider key={course.id}>
          <Shell sub={sub} />
        </CodeLangProvider>
      </LangProvider>
    </CourseCtx.Provider>
  )
}

function Shell({ sub }: { sub: string }) {
  const course = useCourse()
  const { base, modules: MODULES } = course
  const route = useMemo<Route>(() => { const r = parse(sub); return r.view === 'design' && course.design === false ? { view: 'home' } : r }, [sub, course.design])
  const { p, markLesson, recordQuiz, setLast, saveDraft, reset } = useProgress(course.progressKey)
  const theme = useTheme()
  const [menu, setMenu] = useState(false)
  useEffect(() => setMenu(false), [route])

  const activeN = route.view === 'module' || route.view === 'quiz' ? route.n : 0

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-left">
          <a href={to('/')} className="topbar-home" aria-label="Back to Aurora's Learning Centre">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <Logo size={24} />
          </a>
          <a href={to(base)} className="logo sheen-text" style={{ textDecoration: 'none' }}><Plus text={course.brand} /></a>
        </div>
        <button className="btn" onClick={() => setMenu((x) => !x)} aria-expanded={menu}>{menu ? 'Close' : 'Modules'}</button>
      </header>
      <nav className={'rail' + (menu ? ' open' : '')}>
        <a href={to('/')} className="back-home"><Logo size={18} /> Aurora's Learning Centre</a>
        <a href={to(base)} className="brand">
          <span className="logo sheen-text"><Plus text={course.brand} /></span>
          <small><Plus text={course.edition} /></small>
        </a>
        <div className="nav-top">
          <a href={to(base)} className={'nav-link' + (route.view === 'home' ? ' active' : '')}>Course overview</a>
          <a href={to(`${base}/reference`)} className={'nav-link' + (route.view === 'reference' ? ' active' : '')}>Reference dictionary</a>
          {course.standard.length > 0 && <a href={to(`${base}/standard`)} className={'nav-link' + (route.view === 'standard' ? ' active' : '')}>The Standard</a>}
          {course.design !== false && <a href={to(`${base}/design`)} className={'nav-link' + (route.view === 'design' ? ' active' : '')}>Design</a>}
        </div>
        <div className="rail-label">Modules</div>
        <ul className="mod-list">
          {MODULES.map((m) => {
            const ok = passed(p, m.n)
            return (
              <li key={m.n}>
                <a href={to(`${base}/module-${m.n}`)} className={'mod-link' + (activeN === m.n ? ' active' : '') + (ready(m) ? '' : ' soon')}>
                  <span className={'mod-num' + (ok ? ' done sheen-fill' : '')}>{ok ? '✓' : m.n}</span>
                  <span>{m.title}</span>
                  {!ready(m) && <span className="pill">soon</span>}
                </a>
              </li>
            )
          })}
        </ul>
        <button className="nav-link theme-toggle" onClick={theme.toggle}>{theme.isDark ? 'Switch to light' : 'Switch to dark'}</button>
      </nav>
      <main className="main">
        {route.view === 'home' && <Home p={p} reset={reset} />}
        {route.view === 'reference' && <Reference />}
        {route.view === 'standard' && <Standard />}
        {route.view === 'design' && course.design !== false && <DesignPage />}
        {route.view === 'module' && <ModulePage n={route.n} l={route.l} p={p} markLesson={markLesson} setLast={setLast} />}
        {route.view === 'quiz' && <QuizPage n={route.n} p={p} record={recordQuiz} setLast={setLast} saveDraft={saveDraft} />}
      </main>
    </div>
  )
}

function Home({ p, reset }: { p: Progress; reset: () => void }) {
  const course = useCourse()
  const { base, modules: MODULES, hero } = course
  const [confirm, setConfirm] = useState(false)
  const live = MODULES.filter(ready)
  const complete = MODULES.filter((m) => passed(p, m.n)).length
  const next = live.find((m) => !passed(p, m.n))
  const resume = resumePoint(course, p)
  const lessonsTotal = live.reduce((a, m) => a + m.lessons.length, 0)
  const lessonsDone = live.reduce((a, m) => a + doneLessons(p, m), 0)
  useReveal(base)
  return (
    <div className="col wide">
      <section className="hero rise">
        <span className="eyebrow">{hero.eyebrow}</span>
        <h1>{hero.before}<span className="sheen-text"><Plus text={hero.accent} /></span>{hero.after}</h1>
        <p><Inline text={hero.text.replace('{pass}', String(PASS_MARK))} /></p>
        <div className="btn-row">
          {resume
            ? <a className="btn primary" href={to(resume.href)}>{resume.label}</a>
            : next && <a className="btn primary" href={to(`${base}/module-${next.n}`)}>{complete === 0 && lessonsDone === 0 ? 'Start module 1' : `Continue: module ${next.n}`}</a>}
          <a className="btn" href={to(`${base}/reference`)}>Open the reference</a>
        </div>
        <div className="progress-bar" aria-label="Course progress"><span className="sheen-fill" style={{ width: `${(complete / MODULES.length) * 100}%` }} /></div>
        <div className="stat-line">
          <span><b>{complete}</b> / {MODULES.length} modules complete</span>
          <span><b>{lessonsDone}</b> / {lessonsTotal} lessons read</span>
          <span><b>{live.length}</b> modules written so far</span>
          {(complete > 0 || lessonsDone > 0) && (confirm
            ? <span>Erase all progress? <button className="btn ghost" style={{ padding: '2px 10px' }} onClick={() => { reset(); setConfirm(false) }}>Yes, reset</button> <button className="btn ghost" style={{ padding: '2px 10px' }} onClick={() => setConfirm(false)}>Keep</button></span>
            : <button className="btn ghost" style={{ padding: '2px 10px' }} onClick={() => setConfirm(true)}>Reset progress</button>)}
        </div>
      </section>
      <div className="mod-grid">
        {MODULES.map((m) => {
          const ok = passed(p, m.n)
          return (
            <a key={m.n} href={to(`${base}/module-${m.n}`)} className={'mod-card reveal' + (ready(m) ? '' : ' soon')}>
              <div className="top">
                <span className={'n ' + (ok ? 'sheen-text' : '')}>{String(m.n).padStart(2, '0')}</span>
                {ok ? <span className="pill rose">Complete · {p.quiz[m.n]}%</span>
                  : p.draft?.[m.n] ? <span className="pill">Quiz in progress</span>
                : ready(m) ? <span className="pill">{doneLessons(p, m)}/{m.lessons.length} lessons</span>
                  : <span className="pill">Next batch</span>}
              </div>
              <h3>{m.title}</h3>
              <p>{m.summary}</p>
              <span className="tour">{chapter(course, m.tour)}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

function ModulePage({ n, l, p, markLesson, setLast }: { n: number; l: number; p: Progress; markLesson: (id: string) => void; setLast: (pos: { n: number; l?: number }) => void }) {
  const course = useCourse()
  const { base } = course
  const m = course.modules.find((x) => x.n === n)
  const lesson = m?.lessons[l]
  useEffect(() => { if (m && lesson) { markLesson(`m${m.n}:l${l}`); setLast({ n: m.n, l }) } }, [m, lesson, l, markLesson, setLast])
  if (!m) return <div className="col"><p>That module doesn't exist. <a href={to(base)}>Back to the overview</a>.</p></div>
  const prevOk = m.n === 1 || passed(p, m.n - 1)

  return (
    <div className="col">
      <header className="mod-head">
        <span className="eyebrow">Module {m.n} · {chapter(course, m.tour)}</span>
        <h1>{m.title}</h1>
        <p className="summary">{m.summary}</p>
        <div className="meta-row">{m.topics.map((t) => <span key={t} className="pill">{t}</span>)}</div>
      </header>
      <Bridge n={m.n} />

      {!ready(m) ? (
        <div className="outline">
          <span className="eyebrow">Coming in the next batch</span>
          <p style={{ margin: 0 }}>This module's lessons and quiz haven't been written yet. Here's what it will cover:</p>
          <ul>{m.topics.map((t) => <li key={t}>{t}</li>)}</ul>
          {m.cpp23.length > 0 && <><strong>Newer than the book ({course.newLabel})</strong><ul>{m.cpp23.map((t) => <li key={t}><Inline text={t} /></li>)}</ul></>}
          <div className="btn-row"><a className="btn" href={to(`${base}/reference`)}>Use the reference meanwhile</a></div>
        </div>
      ) : (
        <>
          {!prevOk && (
            <div className="callout pitfall"><span className="label">Recommended order</span><p>This builds on module {m.n - 1}. You haven't passed its quiz yet. You can carry on, but <a href={to(`${base}/quiz-${m.n - 1}`)}>that quiz</a> is the quicker check.</p></div>
          )}
          {m.cpp23.length > 0 && (
            <div className="callout new23"><span className="label"><span className="pill rose">{course.newLabel}</span> {course.newHeading ?? "What's newer than the book here"}</span>
              <ul style={{ margin: 0, paddingLeft: 20 }}>{m.cpp23.map((t) => <li key={t}><Inline text={t} /></li>)}</ul></div>
          )}
          <div className="lesson-tabs" role="tablist">
            {m.lessons.map((ls, i) => (
              <a key={ls.id} role="tab" aria-selected={i === l} href={to(`${base}/module-${m.n}-${i + 1}`)} className={'lesson-tab' + (i === l ? ' active' : '')}>
                {p.lessons[`m${m.n}:l${i}`] && <span className="tick">✓</span>}{i + 1}. {ls.title}
              </a>
            ))}
            <a href={to(`${base}/quiz-${m.n}`)} className="lesson-tab">Quiz{passed(p, m.n) ? ` · ${p.quiz[m.n]}%` : p.draft?.[m.n] ? ' · in progress' : ''}</a>
          </div>
          {lesson && (
            <article className="lesson" key={lesson.id}>
              <span className="lesson-count">Lesson {l + 1} of {m.lessons.length}</span>
              <h2>{lesson.title}</h2>
              {lesson.blocks.map((b, i) => <BlockView key={i} b={b} />)}
            </article>
          )}
          <nav className="foot-nav">
            {l > 0 ? <a className="btn" href={to(`${base}/module-${m.n}-${l}`)}>← {m.lessons[l - 1].title}</a> : <span />}
            {l + 1 < m.lessons.length
              ? <a className="btn primary" href={to(`${base}/module-${m.n}-${l + 2}`)}>Next: {m.lessons[l + 1].title} →</a>
              : <a className="btn primary" href={to(`${base}/quiz-${m.n}`)}>Take the module {m.n} quiz →</a>}
          </nav>
        </>
      )}
    </div>
  )
}

function QuizPage({ n, p, record, setLast, saveDraft }: { n: number; p: Progress; record: (n: number, pct: number) => void; setLast: (pos: { n: number; quiz: true }) => void; saveDraft: (n: number, d: QuizDraft | null) => void }) {
  const { base, modules: MODULES } = useCourse()
  const m = MODULES.find((x) => x.n === n)
  useEffect(() => { if (m?.quiz.length) setLast({ n, quiz: true }) }, [m, n, setLast])
  if (!m || !m.quiz.length) return <div className="col"><p>No quiz here yet. <a href={to(`${base}/module-${n}`)}>Back to the module</a>.</p></div>
  const next = MODULES.find((x) => x.n === n + 1)
  return (
    <div className="col">
      <header className="mod-head">
        <span className="eyebrow">Module {m.n} · Quiz</span>
        <h1>{m.title}</h1>
        <p className="summary">{m.quiz.length} questions. Score {PASS_MARK}% or more to complete the module. Every answer comes with an explanation.</p>
      </header>
      <Quiz key={n} mod={m} best={p.quiz[n]} onFinish={(pct) => record(n, pct)} draft={p.draft?.[n]} onDraft={(d) => saveDraft(n, d)} next={next && ready(next) ? next.n : undefined} />
    </div>
  )
}

function Reference() {
  const course = useCourse()
  const DICT = course.dict
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  const cats = useMemo(() => ['All', ...Array.from(new Set(DICT.map((d) => d.cat)))], [DICT])
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return DICT.filter((d) => (cat === 'All' || d.cat === cat) && (!s || `${d.term} ${d.desc} ${d.syntax} ${d.cat}`.toLowerCase().includes(s)))
  }, [q, cat, DICT])
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); document.getElementById('ref-search')?.focus() }
    }
    addEventListener('keydown', on)
    return () => removeEventListener('keydown', on)
  }, [])
  return (
    <div className="col wide">
      <header className="mod-head">
        <span className="eyebrow">Reference dictionary</span>
        <h1>Syntax &amp; concepts</h1>
        <p className="summary">{DICT.length} entries covering all {course.modules.length} modules, written for quick lookup mid-project. Press <code>/</code> to search.</p>
      </header>
      <div className="ref-tools">
        <input id="ref-search" className="search" placeholder={course.dictSearchHint} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the reference" />
        <div className="chips">
          {cats.map((c) => <button key={c} className={'chip' + (c === cat ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}
        </div>
      </div>
      {list.length === 0 ? <div className="empty">Nothing matches “{q}”. Try a shorter term.</div> : (
        <div className="entries">
          {list.map((d) => (
            <div className="entry" key={d.term}>
              <div className="eh">
                <span className="term">{d.term}</span>
                <span className="tags">
                  {d.since && <span className="pill rose">{d.since}</span>}
                  <a className="pill" href={to(`${course.base}/module-${d.module}`)} style={{ textDecoration: 'none' }}>Module {d.module}</a>
                </span>
              </div>
              <p className="desc"><Inline text={d.desc} /></p>
              <Code code={d.syntax} label={d.cat} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** "Book ch. 5 · …", or just "Added · …" for modules that aren't from the book. */
function chapter(course: Course, tour: string) {
  return tour.startsWith('Added') || !course.chapterLabel ? tour : `${course.chapterLabel} ${tour}`
}
