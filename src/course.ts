import { createContext, useContext } from 'react'
import type { DictEntry, Module } from './content/types'
import type { StdEntry } from './content/standard'

// Every language a "Coming from…" note or code comparison can use.
export type LangId = 'python' | 'ts' | 'go' | 'java' | 'cpp' | 'rust'
export const ALL_LANGS: Record<LangId, string> = { python: 'Python', ts: 'TypeScript', go: 'Go', java: 'Java', cpp: 'C++', rust: 'Rust' }

/** Everything that makes one language's course different from another. */
export type Course = {
  id: string
  base: string                 // URL prefix, e.g. '/tour' or '/go'
  section: string              // data-section value that picks the palette
  brand: string                // rail/topbar name
  edition: string              // small line under the brand
  mainLang: LangId             // the language being taught
  codeLabel: string            // label on code blocks, e.g. 'C++23'
  newLabel: string             // pill on "newer than the book" callouts
  newHeading?: string          // heading text beside that pill (default: "What's newer than the book here")
  others: LangId[]             // comparison languages, in chip order
  modules: Module[]
  dict: DictEntry[]
  standard: StdEntry[]
  stdName: string              // "the C++ standard library"
  bridges: Record<number, Partial<Record<LangId, string>>>
  progressKey: string
  /** A course with no code: the dictionary shows notation instead of a highlighted snippet. */
  noCode?: boolean
  /** Show the Design tab (default true). */
  design?: boolean
  chapterLabel: string         // 'Tour ch.' / 'Book ch.'
  hero: { eyebrow: string; before: string; accent: string; after: string; text: string }
  dictSearchHint: string
  stdSearchHint: string
}

export const CourseCtx = createContext<Course | null>(null)
export function useCourse(): Course {
  const c = useContext(CourseCtx)
  if (!c) throw new Error('useCourse outside a course')
  return c
}
