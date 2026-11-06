import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { PASS_MARK, passed, readProgress, resumePoint, useProgress, type Progress } from './progress'

const K = 'test-progress'
const course = {
  base: '/x',
  modules: [
    { n: 1, lessons: { length: 3 }, quiz: { length: 5 } },
    { n: 2, lessons: { length: 0 }, quiz: { length: 5 } },
    { n: 3, lessons: { length: 2 }, quiz: { length: 0 } },
  ],
}
const prog = (o: Partial<Progress> = {}): Progress => ({ lessons: {}, quiz: {}, ...o })

describe('readProgress', () => {
  it('returns empty when nothing stored', () => expect(readProgress(K)).toEqual({ lessons: {}, quiz: {} }))
  it('reads valid data', () => {
    const p = prog({ lessons: { 'm1:l1': true }, quiz: { 1: 80 } })
    localStorage.setItem(K, JSON.stringify(p))
    expect(readProgress(K)).toEqual(p)
  })
  it.each(['not json', '[]', 'null', '42', '{"lessons":{}}', '{"lessons":[],"quiz":{}}'])('falls back on %s', (raw) => {
    localStorage.setItem(K, raw)
    expect(readProgress(K)).toEqual({ lessons: {}, quiz: {} })
  })
  it('survives storage throwing', () => {
    const s = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    expect(readProgress(K)).toEqual({ lessons: {}, quiz: {} })
    s.mockRestore()
  })
})

describe('passed', () => {
  it('uses the pass mark boundary', () => {
    expect(PASS_MARK).toBe(70)
    expect(passed(prog({ quiz: { 1: 69 } }), 1)).toBe(false)
    expect(passed(prog({ quiz: { 1: 70 } }), 1)).toBe(true)
    expect(passed(prog(), 1)).toBe(false)
  })
})

describe('resumePoint', () => {
  it('null without last', () => expect(resumePoint(course, prog())).toBeNull())
  it('null when module passed', () => expect(resumePoint(course, prog({ last: { n: 1, l: 0 }, quiz: { 1: 90 } }))).toBeNull())
  it('null for unknown module', () => expect(resumePoint(course, prog({ last: { n: 9, l: 0 } }))).toBeNull())
  it('null for module with no lessons', () => expect(resumePoint(course, prog({ last: { n: 2, l: 0 } }))).toBeNull())
  it('lesson link is 1-based', () =>
    expect(resumePoint(course, prog({ last: { n: 1, l: 1 } }))).toEqual({ href: '/x/module-1-2', label: 'Resume: module 1, lesson 2' }))
  it('defaults to first lesson', () => expect(resumePoint(course, prog({ last: { n: 1 } }))?.href).toBe('/x/module-1-1'))
  it('null for out-of-range lesson', () => {
    expect(resumePoint(course, prog({ last: { n: 1, l: 3 } }))).toBeNull()
    expect(resumePoint(course, prog({ last: { n: 1, l: -1 } }))).toBeNull()
  })
  it('quiz link, or null when module has no quiz', () => {
    expect(resumePoint(course, prog({ last: { n: 1, quiz: true } }))?.href).toBe('/x/quiz-1')
    expect(resumePoint(course, prog({ last: { n: 3, quiz: true } }))).toBeNull()
  })
})

describe('useProgress', () => {
  it('markLesson is idempotent and persists', () => {
    const { result } = renderHook(() => useProgress(K))
    act(() => result.current.markLesson('m1:l1'))
    const first = result.current.p
    act(() => result.current.markLesson('m1:l1'))
    expect(result.current.p).toBe(first)
    expect(JSON.parse(localStorage.getItem(K)!).lessons).toEqual({ 'm1:l1': true })
  })
  it('recordQuiz keeps best score and clears that draft only', () => {
    const { result } = renderHook(() => useProgress(K))
    act(() => {
      result.current.saveDraft(1, { seed: 1, i: 2, answers: [0, 1] })
      result.current.saveDraft(2, { seed: 2, i: 0, answers: [] })
    })
    act(() => result.current.recordQuiz(1, 80))
    expect(result.current.p.quiz[1]).toBe(80)
    expect(result.current.p.draft).toEqual({ 2: { seed: 2, i: 0, answers: [] } })
    act(() => result.current.recordQuiz(1, 50))
    expect(result.current.p.quiz[1]).toBe(80)
    act(() => result.current.recordQuiz(1, 100))
    expect(result.current.p.quiz[1]).toBe(100)
  })
  it('saveDraft sets, clears, and no-ops when nothing to clear', () => {
    const { result } = renderHook(() => useProgress(K))
    const before = result.current.p
    act(() => result.current.saveDraft(1, null))
    expect(result.current.p).toBe(before)
    act(() => result.current.saveDraft(1, { seed: 5, i: 1, answers: [2] }))
    expect(result.current.p.draft?.[1]).toEqual({ seed: 5, i: 1, answers: [2] })
    act(() => result.current.saveDraft(1, null))
    expect(result.current.p.draft).toEqual({})
  })
  it('setLast is a no-op for equal position', () => {
    const { result } = renderHook(() => useProgress(K))
    act(() => result.current.setLast({ n: 1, l: 0 }))
    const p = result.current.p
    act(() => result.current.setLast({ n: 1, l: 0 }))
    expect(result.current.p).toBe(p)
    act(() => result.current.setLast({ n: 1, quiz: true }))
    expect(result.current.p.last).toEqual({ n: 1, quiz: true })
  })
  it('reset clears everything', () => {
    const { result } = renderHook(() => useProgress(K))
    act(() => result.current.markLesson('m1:l1'))
    act(() => result.current.reset())
    expect(result.current.p).toEqual({ lessons: {}, quiz: {} })
    expect(JSON.parse(localStorage.getItem(K)!)).toEqual({ lessons: {}, quiz: {} })
  })
  it('restores from storage and tolerates write failures', () => {
    localStorage.setItem(K, JSON.stringify(prog({ quiz: { 3: 75 } })))
    const s = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full') })
    const { result } = renderHook(() => useProgress(K))
    expect(result.current.p.quiz[3]).toBe(75)
    expect(() => act(() => result.current.markLesson('a'))).not.toThrow()
    s.mockRestore()
  })
})
