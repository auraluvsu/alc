import type { Module } from '../types'

export const r07: Module = {
  n: 7,
  title: 'Generics, Traits and Lifetimes',
  tour: '10 · Generic Types, Traits, and Lifetimes',
  summary: 'Writing code once for many types: generics, traits, trait bounds, `impl Trait`, trait objects, and lifetime annotations.',
  topics: ['Generics', 'Traits & bounds', 'impl Trait & dyn', 'Lifetimes', 'Elision rules'],
  cpp23: [
    '`async fn` and return-position `impl Trait` in traits (Rust 1.75).',
    'Trait upcasting: coerce `&dyn Sub` to `&dyn Super` (Rust 1.86).',
  ],
  lessons: [],
  quiz: [],
}
