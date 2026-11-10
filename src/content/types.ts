// Content model for the course. Inline text supports `code` and **bold**.

export type MemCell = {
  name: string
  addr?: string
  value: string
  note?: string
  /** visual hint: 'ptr' draws as a pointer, 'ref' as an alias, 'dead' as moved-from/destroyed */
  kind?: 'val' | 'ptr' | 'ref' | 'dead' | 'heap'
}

export type Step = { line: number; note: string; memory: MemCell[] }

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'analogy'; text: string }
  | { kind: 'new23'; text: string }
  | { kind: 'pitfall'; text: string }
  | { kind: 'poly'; pseudo: string; python: string; ts: string; go: string; java: string; cpp: string; caption?: string }
  | { kind: 'code'; code: string; caption?: string; lang?: 'python' | 'ts' | 'go' | 'java' | 'cpp' | 'rust' }
  | { kind: 'compare'; python?: string; ts?: string; go?: string; java?: string; cpp?: string; rust?: string; note?: string }
  | {
      kind: 'check'
      q: string
      code?: string
      options: string[]
      answer: number
      hint: string
      explain: string
    }
  | { kind: 'stepper'; title: string; code: string[]; steps: Step[] }

export type Lesson = { id: string; title: string; blocks: Block[] }

export type QuizQ = {
  q: string
  code?: string
  options: string[]
  answer: number
  explain: string
}

export type Module = {
  n: number
  title: string
  tour: string // matching chapter in A Tour of C++ (3rd ed.)
  summary: string
  topics: string[]
  cpp23: string[] // what's newer than the book (C++23 for C++, Go 1.18–1.27 for Go)
  lessons: Lesson[] // empty = not written yet
  quiz: QuizQ[]
}

export type DictEntry = {
  term: string
  cat: string
  module: number
  syntax: string
  desc: string
  since?: string // e.g. 'C++23'
}
