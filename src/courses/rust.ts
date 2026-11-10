import type { Course } from '../course'
import { RUST_MODULES } from '../content/rust'
import { RUST_DICT } from '../content/rust/dictionary'
import { RUST_STANDARD } from '../content/rust/standard'
import { RUST_BRIDGES } from '../content/rust/bridges'

export const RUST: Course = {
  id: 'rust',
  base: '/rust',
  section: 'rust',
  brand: 'Rust in Depth',
  edition: 'Rust 2024 edition',
  mainLang: 'rust',
  codeLabel: 'Rust 2024',
  newLabel: 'Modern Rust',
  newHeading: 'Newer than the book (Rust 1.85 to 1.98)',
  others: ['cpp', 'go', 'python', 'java', 'ts'],
  modules: RUST_MODULES,
  dict: RUST_DICT,
  standard: RUST_STANDARD,
  stdName: "Rust's standard library",
  bridges: RUST_BRIDGES,
  progressKey: 'rust-course-progress-v1',
  chapterLabel: 'Book ch.',
  hero: {
    eyebrow: 'For developers who already know another language',
    before: 'Learn ',
    accent: 'Rust',
    after: ' properly, and why its compiler is on your side.',
    text: "Fourteen modules following Klabnik and Nichols's The Rust Programming Language, updated to the 2024 edition and Rust 1.98, with added modules on object-oriented design and advanced Rust. Each lesson starts with an analogy, then goes deep, with notes for C++, Go, Python, Java and TypeScript developers. Pass each module's quiz with {pass}% to mark it complete.",
  },
  dictSearchHint: 'Search: borrow, trait, Option, lifetime…',
  stdSearchHint: 'Search: Vec, HashMap, Result, Arc, iter…',
}
