import { useMemo, useState } from 'react'
import { shuffleOptions } from './shuffle'
import type { Module } from '../content/types'
import { Code, Options } from './Blocks'
import { Inline } from './highlight'
import { PASS_MARK } from '../progress'
import { to } from '../router'
import { useCourse } from '../course'

export function Quiz({ mod, best, onFinish, next }: { mod: Module; best?: number; onFinish: (pct: number) => void; next?: number }) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [answers, setAnswers] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const { base } = useCourse()
  const [round, setRound] = useState(0)                 // bump to reshuffle on retake
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const qs = useMemo(() => mod.quiz.map((qq) => ({ ...qq, ...shuffleOptions(qq.options, qq.answer) })), [mod, round])
  const q = qs[i]

  const check = () => {
    if (picked === null) return
    setChecked(true)
    setAnswers((a) => [...a, picked])
  }
  const advance = () => {
    if (i + 1 < qs.length) { setI(i + 1); setPicked(null); setChecked(false) }
    else {
      const right = answers.filter((a, k) => a === qs[k].answer).length
      onFinish(Math.round((right / qs.length) * 100))
      setDone(true)
    }
  }
  const restart = () => { setRound((r) => r + 1); setI(0); setPicked(null); setChecked(false); setAnswers([]); setDone(false) }

  if (done) {
    const right = answers.filter((a, k) => a === qs[k].answer).length
    const pct = Math.round((right / qs.length) * 100)
    const pass = pct >= PASS_MARK
    const wrong = qs.map((qq, k) => ({ qq, a: answers[k] })).filter((x) => x.a !== x.qq.answer)
    return (
      <div className="quiz-card">
        <div className="result">
          <div className="eyebrow">Module {mod.n} quiz</div>
          <div className={'score ' + (pass ? 'sheen-text' : '')}>{pct}%</div>
          <div>{right} of {qs.length} correct. {pass ? 'Module complete.' : `You need ${PASS_MARK}% to complete the module. Review the misses below and retry.`}</div>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <button className="btn" onClick={restart}>Retake quiz</button>
            <a className="btn" href={to(`${base}/module-${mod.n}`)}>Back to lessons</a>
            {pass && next && <a className="btn primary" href={to(`${base}/module-${next}`)}>Start module {next}</a>}
          </div>
        </div>
        {wrong.length > 0 && (
          <div className="review">
            <div className="eyebrow">To review</div>
            {wrong.map(({ qq }, k) => (
              <div className="item no" key={k}>
                <div style={{ fontWeight: 700 }}><Inline text={qq.q} /></div>
                <div>Answer: <Inline text={qq.options[qq.answer]} /></div>
                <div style={{ color: 'var(--muted)' }}><Inline text={qq.explain} /></div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="quiz-card">
      <div className="quiz-top">
        <span>Question {i + 1} of {qs.length}{best !== undefined ? ` · best so far ${best}%` : ''}</span>
        <div className="dots">
          {qs.map((qq, k) => (
            <span key={k} className={k < answers.length ? (answers[k] === qq.answer ? 'ok' : 'no') : k === i ? 'cur' : ''} />
          ))}
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 17 }}><Inline text={q.q} /></div>
      {q.code && <Code code={q.code} />}
      <Options options={q.options} picked={picked} answer={q.answer} reveal={checked} onPick={(k) => !checked && setPicked(k)} />
      {checked && (
        <div className={'feedback ' + (picked === q.answer ? 'ok' : 'no')}>
          <strong>{picked === q.answer ? 'Correct. ' : 'Not quite. '}</strong><Inline text={q.explain} />
        </div>
      )}
      <div className="btn-row">
        {!checked
          ? <button className="btn primary" disabled={picked === null} onClick={check}>Check answer</button>
          : <button className="btn primary" onClick={advance}>{i + 1 < qs.length ? 'Next question' : 'See result'}</button>}
      </div>
    </div>
  )
}
