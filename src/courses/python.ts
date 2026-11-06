import type { Course } from '../course'
import { PY_MODULES } from '../content/python'
import { PY_DICT } from '../content/python/dictionary'
import { PY_STANDARD } from '../content/python/standard'
import { PY_BRIDGES } from '../content/python/bridges'

export const PYTHON: Course = {
  id: 'python',
  base: '/python',
  section: 'python',
  brand: 'Fluent Python',
  edition: 'Python 3.15 edition',
  mainLang: 'python',
  codeLabel: 'Python 3.15',
  newLabel: 'Modern Python',
  others: ['ts', 'go', 'java', 'cpp'],
  modules: PY_MODULES,
  dict: PY_DICT,
  standard: PY_STANDARD,
  stdName: "Python's standard library",
  bridges: PY_BRIDGES,
  progressKey: 'python-course-progress-v1',
  chapterLabel: 'Book ch.',
  hero: {
    eyebrow: 'For developers who want to write Python like Python',
    before: 'Learn ',
    accent: 'Python',
    after: ' from the inside: the data model, not just the syntax.',
    text: "Twenty-eight modules: Luciano Ramalho's Fluent Python (2nd ed.) updated from Python 3.10 to 3.15, plus four added modules on NumPy and PyTorch. Each lesson starts with an analogy, then goes deep, with notes for TypeScript, Go, Java and C++ developers. Pass each module's quiz with {pass}% to mark it complete.",
  },
  dictSearchHint: 'Search: dataclass, slicing, match, frozendict…',
  stdSearchHint: 'Search: Counter, csv, pathlib, asyncio…',
}
