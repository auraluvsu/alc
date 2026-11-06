import type { Course } from '../course'
import { JAVA_MODULES } from '../content/java'
import { JAVA_DICT } from '../content/java/dictionary'
import { JAVA_STANDARD } from '../content/java/standard'
import { JAVA_BRIDGES } from '../content/java/bridges'

export const JAVA: Course = {
  id: 'java',
  base: '/java',
  section: 'java',
  brand: 'Java in Depth',
  edition: 'Java 27 edition',
  mainLang: 'java',
  codeLabel: 'Java 27',
  newLabel: 'Modern Java',
  newHeading: 'Newer than the book (Java 22 to 27)',
  others: ['python', 'cpp', 'go', 'ts'],
  modules: JAVA_MODULES,
  dict: JAVA_DICT,
  standard: JAVA_STANDARD,
  stdName: "Java's standard library",
  bridges: JAVA_BRIDGES,
  progressKey: 'java-course-progress-v1',
  chapterLabel: 'Book ch.',
  hero: {
    eyebrow: 'For developers who already know another language',
    before: 'Learn ',
    accent: 'Java',
    after: ' properly, and object-oriented programming with it.',
    text: "Fourteen modules following Horstmann's Core Java for the Impatient (4th ed.), updated from Java 21 to Java 27, with two added modules on object-oriented design and modern concurrency. Each lesson starts with an analogy, then goes deep, with notes for Python, C++, Go and TypeScript developers. Pass each module's quiz with {pass}% to mark it complete.",
  },
  dictSearchHint: 'Search: record, sealed, HashMap, Optional…',
  stdSearchHint: 'Search: List.of, Files, Collectors, HttpClient…',
}
