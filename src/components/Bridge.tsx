import { createContext, useContext, useState, type ReactNode } from 'react'
import { ALL_LANGS, useCourse, type LangId } from '../course'
import { Inline } from './highlight'

/** Renders "C++" with the plus signs in a sturdier face: the display serif's "+" is a hairline. */
export function Plus({ text }: { text: string }) {
  const parts = text.split(/(\+\+)/)
  return <>{parts.map((p, i) => (p === '++' ? <span key={i} className="plus">++</span> : p))}</>
}

// The reader's "home" language for this course, shared by the module notes and every code comparison.
const LangCtx = createContext<{ lang: LangId; setLang: (l: LangId) => void }>({ lang: 'python', setLang: () => {} })

export function LangProvider({ children }: { children: ReactNode }) {
  const course = useCourse()
  const key = `${course.id}-compare-lang`
  const [lang, set] = useState<LangId>(() => {
    try { const v = localStorage.getItem(key) as LangId | null; if (v && course.others.includes(v)) return v } catch { /* ignore */ }
    return course.others[0]
  })
  const setLang = (l: LangId) => {
    set(l)
    try { localStorage.setItem(key, l) } catch { /* ignore */ }
  }
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>
}
export const useLang = () => useContext(LangCtx)

export function LangChips({ label }: { label?: string }) {
  const { others } = useCourse()
  const { lang, setLang } = useLang()
  return (
    <div className="lang-chips" role="tablist" aria-label={label ?? 'Language'}>
      {label && <span className="lang-chips-label">{label}</span>}
      {others.map((id) => (
        <button key={id} role="tab" aria-selected={id === lang} className={`lang-chip ${id}` + (id === lang ? ' on' : '')} onClick={() => setLang(id)}>
          {ALL_LANGS[id]}
        </button>
      ))}
    </div>
  )
}

/** Collapsible "coming from…" note for a module, one tab per comparison language. */
export function Bridge({ n }: { n: number }) {
  const course = useCourse()
  const notes = course.bridges[n]
  const { lang } = useLang()
  if (!notes) return null
  const name = ALL_LANGS[lang]
  return (
    <details className="bridge">
      <summary>
        <span className="label">Coming from another language?</span>
        <span className="hint">
          {course.others.map((id, i) => (
            <span key={id}>{i > 0 && ' · '}<span className={id === 'python' ? 'py' : id}>{ALL_LANGS[id]}</span></span>
          ))}
        </span>
      </summary>
      <div className="bridge-body">
        <LangChips />
        <p className={`bridge-note ${lang}`}>
          <Inline text={notes[lang] || `Nothing in this module maps directly onto ${name}. It is all new ground.`} />
        </p>
      </div>
    </details>
  )
}
