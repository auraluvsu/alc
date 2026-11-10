import type { Module } from '../types'

export const r03: Module = {
  n: 3,
  title: 'Structs, Enums and Pattern Matching',
  tour: '5, 6, 19 · Structs; Enums and Pattern Matching; Patterns',
  summary: 'Modelling data with structs and enums, methods, `Option`, `match`, `if let`, and the full pattern syntax.',
  topics: ['Structs & methods', 'Enums & Option', 'match & exhaustiveness', 'if let, let else & let chains', 'Pattern syntax'],
  cpp23: [
    'Let chains: `if let Some(x) = a && x > 0` (Rust 1.88, 2024 edition).',
    'Exclusive range patterns `0..10` in `match` (Rust 1.80).',
  ],
  lessons: [],
  quiz: [],
}
