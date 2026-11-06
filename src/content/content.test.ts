import { describe, expect, it } from 'vitest'
import { COURSES } from '../courses'
import type { Block, QuizQ } from './types'

const courses = Object.values(COURSES)

function checkQ(where: string, q: Pick<QuizQ, 'q' | 'options' | 'answer'> & { explain: string }) {
  expect(q.q.trim(), `${where}: empty question`).not.toBe('')
  expect(q.options.length, `${where}: needs >=2 options`).toBeGreaterThanOrEqual(2)
  expect(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, `${where}: answer ${q.answer} out of range`).toBe(true)
  expect(new Set(q.options).size, `${where}: duplicate options`).toBe(q.options.length)
  expect(q.options.every((o) => o.trim() !== ''), `${where}: blank option`).toBe(true)
  expect(q.explain.trim(), `${where}: empty explain`).not.toBe('')
}

describe('course registry', () => {
  it('has unique ids, sections, bases and progress keys', () => {
    for (const f of ['id', 'section', 'base', 'progressKey'] as const) {
      const vals = courses.map((c) => c[f])
      expect(new Set(vals).size, `duplicate ${f}`).toBe(vals.length)
    }
  })
  it('registry key matches course id', () => {
    for (const [k, c] of Object.entries(COURSES)) expect(c.id).toBe(k)
  })
  it.each(courses.map((c) => [c.id, c] as const))('%s has required fields', (_id, c) => {
    expect(c.base.startsWith('/')).toBe(true)
    expect(c.base.endsWith('/')).toBe(false)
    for (const f of ['brand', 'edition', 'codeLabel', 'newLabel', 'stdName', 'dictSearchHint'] as const)
      expect(c[f], f).toBeTruthy()
    expect(c.modules.length).toBeGreaterThan(0)
    expect(c.others).not.toContain(c.mainLang)
  })
})

describe.each(courses.map((c) => [c.id, c] as const))('content: %s', (_id, c) => {
  it('module numbers are unique and ascending', () => {
    const ns = c.modules.map((m) => m.n)
    expect(new Set(ns).size).toBe(ns.length)
    expect([...ns].sort((a, b) => a - b)).toEqual(ns)
  })
  it('lesson ids are unique within each module', () => {
    for (const m of c.modules) {
      const ids = m.lessons.map((l) => l.id)
      expect(new Set(ids).size, `duplicate lesson id in m${m.n}`).toBe(ids.length)
    }
  })
  it('every module has title and summary; written lessons have titles and blocks', () => {
    for (const m of c.modules) {
      expect(m.title.trim(), `m${m.n} title`).not.toBe('')
      expect(m.summary.trim(), `m${m.n} summary`).not.toBe('')
      for (const l of m.lessons) {
        expect(l.title.trim(), `m${m.n}/${l.id} title`).not.toBe('')
        expect(l.blocks.length, `m${m.n}/${l.id} blocks`).toBeGreaterThan(0)
      }
    }
  })
  it('quiz questions are well-formed', () => {
    for (const m of c.modules) m.quiz.forEach((q, i) => checkQ(`${c.id} m${m.n} quiz[${i}]`, q))
  })
  it('inline check blocks and steppers are well-formed', () => {
    for (const m of c.modules)
      for (const l of m.lessons)
        l.blocks.forEach((b: Block, i) => {
          const where = `${c.id} m${m.n}/${l.id} block[${i}]`
          if (b.kind === 'check') {
            checkQ(where, b)
            expect(b.hint.trim(), `${where}: hint`).not.toBe('')
          }
          if (b.kind === 'stepper') {
            expect(b.steps.length, `${where}: no steps`).toBeGreaterThan(0)
            for (const s of b.steps) {
              expect(s.line >= 1 && s.line <= b.code.length, `${where}: step line ${s.line} out of range`).toBe(true)
              expect(s.note.trim()).not.toBe('')
            }
          }
        })
  })
  it('dictionary entries reference real modules and have unique terms', () => {
    const ns = new Set(c.modules.map((m) => m.n))
    const seen = new Set<string>()
    for (const d of c.dict) {
      expect(ns.has(d.module), `dict "${d.term}" -> module ${d.module}`).toBe(true)
      const k = d.term.toLowerCase()
      expect(seen.has(k), `duplicate dict term "${d.term}"`).toBe(false)
      seen.add(k)
      expect(d.desc.trim(), `dict "${d.term}" desc`).not.toBe('')
    }
  })
  it('bridges reference real modules', () => {
    const ns = new Set(c.modules.map((m) => m.n))
    for (const k of Object.keys(c.bridges)) expect(ns.has(Number(k)), `bridge for module ${k}`).toBe(true)
  })
})
