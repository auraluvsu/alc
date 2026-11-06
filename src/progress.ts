import { useCallback, useEffect, useState } from 'react'

// Per-browser progress. Storage can be unavailable (private windows, previews), so every access is guarded.
export type Progress = {
  lessons: Record<string, true> // "m1:l2"
  quiz: Record<number, number> // module -> best score percent
}

const empty: Progress = { lessons: {}, quiz: {} }

export function readProgress(key: string): Progress {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return { ...empty, ...JSON.parse(raw) }
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
    setP((s) => ({ ...s, quiz: { ...s.quiz, [m]: Math.max(pct, s.quiz[m] ?? 0) } }))
  }, [])
  const reset = useCallback(() => setP(empty), [])
  return { p, markLesson, recordQuiz, reset }
}

export const passed = (p: Progress, m: number) => (p.quiz[m] ?? 0) >= PASS_MARK
