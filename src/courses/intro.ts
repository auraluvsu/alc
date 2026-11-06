import type { Course } from '../course'
import { INTRO_MODULES } from '../content/intro'
import { INTRO_DICT } from '../content/intro/dictionary'
import { INTRO_STANDARD } from '../content/intro/standard'
import { INTRO_BRIDGES } from '../content/intro/bridges'

export const INTRO: Course = {
  id: 'intro',
  base: '/intro',
  section: 'intro',
  brand: 'Foundations',
  edition: 'Start here · any language',
  mainLang: 'python',
  codeLabel: 'Example',
  newLabel: 'Good to know',
  newHeading: 'Across the languages',
  others: [],
  modules: INTRO_MODULES,
  dict: INTRO_DICT,
  standard: INTRO_STANDARD,
  stdName: 'the basics',
  bridges: INTRO_BRIDGES,
  progressKey: 'intro-course-progress-v1',
  design: false,
  chapterLabel: '',
  hero: {
    eyebrow: 'Introduction to programming',
    before: 'Learn to ',
    accent: 'think in code',
    after: ', in any language.',
    text: 'Twelve modules for complete beginners: what a program is, values and variables, decisions, loops, collections, functions, text and files, debugging, algorithms, objects and the everyday tools. Every example starts in plain-English pseudocode; switch any code box to Python, TypeScript, Go, Java or C++ when you\'re ready for the real thing. Pass each module\'s quiz with {pass}% to mark it complete.',
  },
  dictSearchHint: 'Search: variable, loop, function, boolean…',
  stdSearchHint: '',
}
