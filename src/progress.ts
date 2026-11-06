import { useCallback, useEffect, useState } from 'react'

// Per-browser progress. Storage can be unavailable (private windows, previews), so every access is guarded.
export type QuizDraft = { seed: number; i: number; answers: number[] }
export type Progress = {
  lessons: Record<string, true> // "m1:l2"
  quiz: Record<number, number> // module -> best score percent
  last?: { n: number; l?: number; quiz?: true } // where the reader stopped
  draft?: Record<number, QuizDraft> // module -> quiz in progress
}

const empty: Progress = { lessons: {}, quiz: {} }
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

export function readProgress(key: string): Progress {
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const j = JSON.parse(raw)
      if (isObj(j) && isObj(j.lessons) && isObj(j.quiz)) return { ...empty, ...j } as Progress
    }
  } catch { /* ignore */ }
  return empty
}

export const PASS_MARK = 70

export function useProgress(key: string) {
  const [p, setP] = useState<Progress>(() => readProgress(key))
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(p)) } catch { /* ignore */ }
  }, [p, key])

  const markLesson = useCallback((id: string) => {
    setP((s) => (s.lessons[id] ? s : { ...s, lessons: { ...s.lessons, [id]: true } }))
  }, [])
  const recordQuiz = useCallback((m: number, pct: number) => {
    setP((s) => {
      const { [m]: _gone, ...draft } = s.draft ?? {}
      void _gone
      return { ...s, quiz: { ...s.quiz, [m]: Math.max(pct, s.quiz[m] ?? 0) }, draft }
    })
  }, [])
  const setLast = useCallback((pos: NonNullable<Progress['last']>) => {
    setP((s) => (s.last && s.last.n === pos.n && s.last.l === pos.l && s.last.quiz === pos.quiz ? s : { ...s, last: pos }))
  }, [])
  const saveDraft = useCallback((m: number, d: QuizDraft | null) => {
    setP((s) => {
      const { [m]: _old, ...rest } = s.draft ?? {}
      void _old
      if (!d && !(m in (s.draft ?? {}))) return s
      return { ...s, draft: d ? { ...rest, [m]: d } : rest }
    })
  }, [])
  const reset = useCallback(() => setP(empty), [])
  return { p, markLesson, recordQuiz, setLast, saveDraft, reset }
}

export const passed = (p: Progress, m: number) => (p.quiz[m] ?? 0) >= PASS_MARK

/** Where "Resume" should go for one course, or null if there is nothing sensible to resume. */
export function resumePoint(
  c: { base: string; modules: { n: number; lessons: { length: number }; quiz: { length: number } }[] },
  p: Progress,
): { href: string; label: string } | null {
  const last = p.last
  if (!last || passed(p, last.n)) return null
  const m = c.modules.find((x) => x.n === last.n)
  if (!m || m.lessons.length === 0) return null
  if (last.quiz) return m.quiz.length ? { href: `${c.base}/quiz-${m.n}`, label: `Resume quiz ${m.n}` } : null
  const l = last.l ?? 0
  if (l < 0 || l >= m.lessons.length) return null
  return { href: `${c.base}/module-${m.n}-${l + 1}`, label: `Resume: module ${m.n}, lesson ${l + 1}` }
}
