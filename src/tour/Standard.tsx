import { useMemo, useState } from 'react'
import { Code } from '../components/Blocks'
import { Inline } from '../components/highlight'
import { to } from '../router'
import { useCourse } from '../course'

/** "The Standard": the most useful library functions, each expandable to what / how / when. */
export function Standard() {
  const course = useCourse()
  const STANDARD = course.standard
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  const [open, setOpen] = useState<Set<string>>(() => new Set())
  const cats = useMemo(() => ['All', ...Array.from(new Set(STANDARD.map((e) => e.cat)))], [STANDARD])
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return STANDARD.filter((e) => (cat === 'All' || e.cat === cat) &&
      (!s || `${e.name} ${e.summary} ${e.what} ${e.when} ${e.header}`.toLowerCase().includes(s)))
  }, [q, cat, STANDARD])
  const allOpen = list.length > 0 && list.every((e) => open.has(e.name))

  const toggle = (name: string) => setOpen((o) => {
    const n = new Set(o)
    if (n.has(name)) n.delete(name); else n.add(name)
    return n
  })
  const toggleAll = () => setOpen(allOpen ? new Set() : new Set(list.map((e) => e.name)))

  return (
    <div className="col wide">
      <header className="mod-head">
        <span className="eyebrow">The Standard</span>
        <h1>The functions you'll actually use</h1>
        <p className="summary">
          {STANDARD.length} of the most useful functions and methods in {course.stdName}. Open one to see what
          it does, how to call it and when to reach for it.
        </p>
      </header>
      <div className="ref-tools">
        <input id="std-search" className="search" placeholder={course.stdSearchHint} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the standard library list" />
        <div className="std-toolbar">
          <div className="chips">
            {cats.map((c) => <button key={c} className={'chip' + (c === cat ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          <button className="btn ghost std-expand" onClick={toggleAll} disabled={!list.length}>{allOpen ? 'Collapse all' : 'Expand all'}</button>
        </div>
      </div>
      {list.length === 0 ? <div className="empty">Nothing matches “{q}”. Try a shorter term.</div> : (
        <div className="std-list">
          {list.map((e) => {
            const isOpen = open.has(e.name)
            return (
              <section key={e.name} className={'std-item' + (isOpen ? ' open' : '')}>
                <button className="std-head" aria-expanded={isOpen} onClick={() => toggle(e.name)}>
                  <span className="std-name">{e.name}</span>
                  <span className="std-summary"><Inline text={e.summary} /></span>
                  <span className="std-tags">
                    {e.since && <span className="pill rose">{e.since}</span>}
                    <span className="pill">{e.header}</span>
                  </span>
                  <span className="caret" aria-hidden="true" />
                </button>
                {isOpen && (
                  <div className="std-body">
                    <div className="std-section"><span className="std-label">What it does</span><p><Inline text={e.what} /></p></div>
                    <div className="std-section"><span className="std-label">How to use it</span><Code code={e.code} label={e.header} /></div>
                    <div className="std-section"><span className="std-label">Use it when</span><p><Inline text={e.when} /></p></div>
                    <a className="std-more" href={to(`${course.base}/module-${e.module}`)}>Covered in module {e.module} →</a>
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
