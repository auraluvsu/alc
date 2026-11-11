import type { Course } from '../course'
import { MATHS_MODULES } from '../content/maths'
import { MATHS_DICT } from '../content/maths/dictionary'

export const MATHS: Course = {
  id: 'maths',
  base: '/maths',
  section: 'maths',
  brand: 'Advanced Maths',
  edition: 'Maths for machine learning',
  mainLang: 'python',   // unused: the course has no code
  noCode: true,
  codeLabel: '',
  newLabel: 'Going further',
  newHeading: 'Beyond the core: where this leads',
  others: [],
  modules: MATHS_MODULES,
  dict: MATHS_DICT,
  standard: [],
  stdName: '',
  bridges: {},
  design: false,
  progressKey: 'maths-course-progress-v1',
  chapterLabel: '',
  hero: {
    eyebrow: 'No code, just the ideas',
    before: 'Learn the ',
    accent: 'maths',
    after: ' behind machine learning, properly.',
    text: 'Nine modules from functions and logarithms through probability, statistics, linear algebra and calculus, ending in a capstone that builds linear regression from scratch in plain words. Each lesson starts with an analogy, then goes deep, with checks along the way and links to learn more. Pass each module\'s quiz with {pass}% to mark it complete.',
  },
  dictSearchHint: 'Search: eigenvalue, Bayes, gradient, variance…',
  stdSearchHint: '',
}
