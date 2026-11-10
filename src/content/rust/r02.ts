import type { Module } from '../types'

export const r02: Module = {
  n: 2,
  title: 'Ownership and Borrowing',
  tour: '4 · Understanding Ownership',
  summary: 'The idea that sets Rust apart: ownership, moves, clones, references, borrowing rules, slices, and how the compiler uses them to remove whole classes of bugs.',
  topics: ['Stack & heap', 'Ownership & moves', 'References & borrowing', 'Slices', 'Non-lexical lifetimes'],
  cpp23: [
    '`get_disjoint_mut` borrows several elements of a slice or map mutably at once (Rust 1.86).',
    'Precise capturing with `use<..>` in `impl Trait` return types (Rust 1.82).',
  ],
  lessons: [],
  quiz: [],
}
