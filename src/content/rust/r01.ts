import type { Module } from '../types'

export const r01: Module = {
  n: 1,
  title: 'Getting Started and Basic Concepts',
  tour: '1, 3 · Getting Started; Common Programming Concepts',
  summary: 'Cargo and your first program, then the building blocks: variables and mutability, scalar and compound types, functions, expressions and control flow.',
  topics: ['Cargo & rustc', 'Variables, mutability & shadowing', 'Scalar & compound types', 'Functions & expressions', 'Control flow'],
  cpp23: [
    '`let`-`else` and let chains in `if` and `while` conditions (let chains: 2024 edition, Rust 1.88).',
    'Inline `const { }` blocks and `LazyLock` for lazy statics (Rust 1.79 and 1.80).',
  ],
  lessons: [],
  quiz: [],
}
