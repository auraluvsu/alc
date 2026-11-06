import type { Course } from '../course'
import { MODULES } from '../content'
import { DICT } from '../content/dictionary'
import { STANDARD } from '../content/standard'
import { BRIDGES } from '../content/bridges'

export const CPP: Course = {
  id: 'cpp',
  base: '/tour',
  section: 'tour',
  brand: 'Tour of C++',
  edition: '4th edition · C++23',
  mainLang: 'cpp',
  codeLabel: 'C++23',
  newLabel: 'C++23',
  others: ['python', 'ts', 'go', 'java'],
  modules: MODULES,
  dict: DICT,
  standard: STANDARD,
  stdName: 'the C++ standard library',
  bridges: BRIDGES,
  progressKey: 'cpp-tour-progress-v1', // unchanged so existing progress carries over
  chapterLabel: 'Tour ch.',
  hero: {
    eyebrow: 'For developers who already know another language',
    before: 'Learn ',
    accent: 'C++23',
    after: ', the parts your other languages hid from you.',
    text: "Eighteen modules following Stroustrup's A Tour of C++ (3rd ed.), updated from C++20 to C++23. Each lesson starts with an analogy, then goes deep. Anything you already know from another language gets one line, not a chapter, and every module has notes for Python, TypeScript, Go and Java developers. Pass each module's quiz with {pass}% to mark it complete.",
  },
  dictSearchHint: 'Search: unique_ptr, move, concept, println…',
  stdSearchHint: 'Search: sort, map, parse, thread…',
}
