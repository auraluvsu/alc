import type { Course } from '../course'
import { GO_MODULES } from '../content/go'
import { GO_DICT } from '../content/go/dictionary'
import { GO_STANDARD } from '../content/go/standard'
import { GO_BRIDGES } from '../content/go/bridges'

export const GO: Course = {
  id: 'go',
  base: '/go',
  section: 'go',
  brand: 'Go in Depth',
  edition: 'Go 1.27 edition',
  mainLang: 'go',
  codeLabel: 'Go 1.27',
  newLabel: 'Modern Go',
  others: ['python', 'ts', 'java', 'cpp'],
  modules: GO_MODULES,
  dict: GO_DICT,
  standard: GO_STANDARD,
  stdName: "Go's standard library",
  bridges: GO_BRIDGES,
  progressKey: 'go-course-progress-v1',
  chapterLabel: 'Book ch.',
  hero: {
    eyebrow: 'For developers who already know another language',
    before: 'Learn ',
    accent: 'Go',
    after: ' properly, from the toolchain to the runtime.',
    text: "Fifteen modules following Donovan & Kernighan's The Go Programming Language, updated from Go 1.5 to Go 1.27 with two extra modules on generics and iterators. Each lesson starts with an analogy, then goes deep, with notes for Python, TypeScript, Java and C++ developers. Pass each module's quiz with {pass}% to mark it complete.",
  },
  dictSearchHint: 'Search: slice, defer, select, errors.Is…',
  stdSearchHint: 'Search: sort, json, time, http…',
}
