import type { Module } from '../types'

export const r09: Module = {
  n: 9,
  title: 'Closures and Iterators',
  tour: '13 · Functional Language Features',
  summary: 'Closures and how they capture, the `Fn` traits, the `Iterator` trait, adapters and consumers, and zero-cost abstraction.',
  topics: ['Closures', 'Fn, FnMut & FnOnce', 'Iterator trait', 'Adapters & consumers', 'Zero-cost abstraction'],
  cpp23: [
    'Async closures: `async |x| { ... }` and the `AsyncFn` traits (Rust 1.85).',
    '`std::iter::repeat_n` and `Iterator::is_sorted` (Rust 1.82 and 1.82).',
  ],
  lessons: [],
  quiz: [],
}
