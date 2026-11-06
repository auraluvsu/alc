import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { shuffleOptions } from './shuffle'
import type { Block, Step } from '../content/types'
import { highlight, Inline } from './highlight'
import { LangChips, useLang } from './Bridge'
import { ALL_LANGS, useCourse } from '../course'

export function Code({ code, label, cls }: { code: string; label?: string; cls?: string }) {
  const course = useCourse()
  label ??= course.codeLabel
  cls ??= course.mainLang
  const lang = cls === 'python' || cls === 'pseudo' ? 'python' : cls === 'java' ? 'java' : undefined   // '#' comments; Java keywords
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(code).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 1200) },
      () => {},
    )
  }
  return (
    <div className="code">
      <div className="bar">
        <span className={cls}>{label}</span>
        <button onClick={copy} aria-label="Copy code">{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <pre><code>{highlight(code, lang)}</code></pre>
    </div>
  )
}

// ---------- Multi-language code blocks (Foundations course) ----------
// The reader picks the language once (pseudocode by default) and every poly block follows.
export type CodeLang = 'pseudo' | 'python' | 'ts' | 'go' | 'java' | 'cpp'
const CODE_LANGS: { id: CodeLang; name: string }[] = [
  { id: 'pseudo', name: 'Pseudocode' }, { id: 'python', name: 'Python' }, { id: 'ts', name: 'TypeScript' },
  { id: 'go', name: 'Go' }, { id: 'java', name: 'Java' }, { id: 'cpp', name: 'C++' },
]
const CodeLangCtx = createContext<{ lang: CodeLang; setLang: (l: CodeLang) => void }>({ lang: 'pseudo', setLang: () => {} })

export function CodeLangProvider({ children }: { children: ReactNode }) {
  const course = useCourse()
  const key = `${course.id}-code-lang`
  const [lang, set] = useState<CodeLang>(() => {
    try { const v = localStorage.getItem(key) as CodeLang | null; if (v && CODE_LANGS.some((c) => c.id === v)) return v } catch { /* ignore */ }
    return 'pseudo'
  })
  const setLang = (l: CodeLang) => { set(l); try { localStorage.setItem(key, l) } catch { /* ignore */ } }
  return <CodeLangCtx.Provider value={{ lang, setLang }}>{children}</CodeLangCtx.Provider>
}

export function CodeLangChips() {
  const { lang, setLang } = useContext(CodeLangCtx)
  return (
    <div className="lang-chips code-lang-chips" role="tablist" aria-label="Show code in">
      <span className="lang-chips-label">Show code in</span>
      {CODE_LANGS.map((c) => (
        <button key={c.id} role="tab" aria-selected={c.id === lang} className={`lang-chip ${c.id}` + (c.id === lang ? ' on' : '')} onClick={() => setLang(c.id)}>
          {c.name}
        </button>
      ))}
    </div>
  )
}

function Poly({ b }: { b: Extract<Block, { kind: 'poly' }> }) {
  const { lang } = useContext(CodeLangCtx)
  const name = CODE_LANGS.find((c) => c.id === lang)!.name
  return (
    <div className="poly">
      <CodeLangChips />
      <Code code={b[lang]} label={name} cls={lang === 'pseudo' ? 'pseudo' : lang} />
      {b.caption && <p className="caption"><Inline text={b.caption} /></p>}
    </div>
  )
}

const KEYS = 'ABCDEFGH'

export function Options({
  options, picked, answer, reveal, onPick,
}: { options: string[]; picked: number | null; answer: number; reveal: boolean; onPick: (i: number) => void }) {
  return (
    <div className="opts">
      {options.map((o, i) => {
        let cls = 'opt'
        if (reveal && i === answer) cls += ' right'
        else if (reveal && i === picked) cls += ' wrong'
        else if (i === picked) cls += ' sel'
        return (
          <button key={i} className={cls} disabled={reveal} onClick={() => onPick(i)}>
            <span className="key">{KEYS[i]}</span>
            <span><Inline text={o} /></span>
          </button>
        )
      })}
    </div>
  )
}

function Check({ b: raw }: { b: Extract<Block, { kind: 'check' }> }) {
  const b = useMemo(() => ({ ...raw, ...shuffleOptions(raw.options, raw.answer) }), [raw])
  const [picked, setPicked] = useState<number | null>(null)
  const [hint, setHint] = useState(false)
  const [done, setDone] = useState(false)
  const [tries, setTries] = useState(0)
  const pick = (i: number) => {
    setPicked(i)
    if (i === b.answer) setDone(true)
    else setTries((t) => t + 1)
  }
  const wrongOnce = picked !== null && picked !== b.answer && !done
  return (
    <div className="check">
      <div className="label">Checkpoint</div>
      <div className="q"><Inline text={b.q} /></div>
      {b.code && <Code code={b.code} />}
      <Options options={b.options} picked={picked} answer={b.answer} reveal={done} onPick={pick} />
      {wrongOnce && !hint && <div className="feedback no">Not that one. Have another go, or take the hint.</div>}
      {(hint || (wrongOnce && tries >= 2)) && !done && (
        <div className="feedback hint"><strong>Hint: </strong><Inline text={b.hint} /></div>
      )}
      {done && <div className="feedback ok"><strong>{tries === 0 ? 'Spot on. ' : 'Got there. '}</strong><Inline text={b.explain} /></div>}
      {!done && (
        <div className="btn-row">
          {!hint && <button className="btn ghost" onClick={() => setHint(true)}>Show hint</button>}
          <button className="btn ghost" onClick={() => { setPicked(b.answer); setDone(true) }}>Reveal answer</button>
        </div>
      )}
    </div>
  )
}

function Stepper({ b }: { b: Extract<Block, { kind: 'stepper' }> }) {
  const { mainLang } = useCourse()
  const [i, setI] = useState(0)
  const s: Step = b.steps[i]
  return (
    <div className="stepper">
      <div className="head">
        <span className="t">{b.title}</span>
        <div className="btn-row">
          <button className="btn" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>Back</button>
          <span style={{ fontSize: 13, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>Step {i + 1} / {b.steps.length}</span>
          <button className="btn primary" onClick={() => setI((x) => Math.min(b.steps.length - 1, x + 1))} disabled={i === b.steps.length - 1}>Next line</button>
        </div>
      </div>
      <div className="body">
        <div className="src">
          {b.code.map((line, n) => (
            <div key={n} className={n + 1 === s.line ? 'cur' : ''}>
              <span className="ln">{n + 1}</span>{highlight(line, mainLang)}
            </div>
          ))}
        </div>
        <div className="mem">
          <div className="note"><Inline text={s.note} /></div>
          <div className="cells">
            {s.memory.map((c, k) => (
              <div key={k} className={`cell ${c.kind ?? 'val'}`}>
                <span className="nm">{c.name}</span>
                <span className="ad">{c.addr}</span>
                <span className="vl">{c.value}</span>
                {c.note && <span className="nt">{c.note}</span>}
              </div>
            ))}
            {s.memory.length === 0 && <div className="mem-legend">(nothing in scope yet)</div>}
          </div>
          <div className="mem-legend">Solid colour = pointer · dashed = reference/alias · tinted = heap · struck = moved-from or destroyed</div>
        </div>
      </div>
    </div>
  )
}

export function BlockView({ b }: { b: Block }) {
  switch (b.kind) {
    case 'p': return <p><Inline text={b.text} /></p>
    case 'h': return <h3><Inline text={b.text} /></h3>
    case 'list': return <ul>{b.items.map((t, i) => <li key={i}><Inline text={t} /></li>)}</ul>
    case 'analogy':
      return <div className="callout analogy"><span className="label">Analogy first</span><p><Inline text={b.text} /></p></div>
    case 'new23':
      return <div className="callout new23"><span className="label"><NewLabel /> Updated from the book</span><p><Inline text={b.text} /></p></div>
    case 'pitfall':
      return <div className="callout pitfall"><span className="label">Watch out</span><p><Inline text={b.text} /></p></div>
    case 'code':
      return <>{<Code code={b.code} {...(b.lang ? { label: ALL_LANGS[b.lang], cls: b.lang } : {})} />}{b.caption && <div className="caption"><Inline text={b.caption} /></div>}</>
    case 'poly': return <Poly b={b} />
    case 'compare': return <Compare b={b} />
    case 'check': return <Check b={b} />
    case 'stepper': return <Stepper b={b} />
  }
}

function NewLabel() {
  return <span className="pill rose">{useCourse().newLabel}</span>
}

function Compare({ b }: { b: Extract<Block, { kind: 'compare' }> }) {
  const course = useCourse()
  const { lang } = useLang()
  const name = ALL_LANGS[lang]
  const other = b[lang]
  const main = b[course.mainLang] ?? ''
  return (
    <div className="compare-wrap">
      <LangChips label="Compare with" />
      <div className="compare">
        {other
          ? <Code code={other} label={name} cls={lang} />
          : <div className="code"><div className="bar"><span className={lang}>{name}</span></div><pre><code>{`// No direct ${name} equivalent.`}</code></pre></div>}
        <Code code={main} />
      </div>
      {b.note && <div className="caption" style={{ marginTop: 0 }}><Inline text={b.note} /></div>}
    </div>
  )
}
