import type { Module } from '../types'

export const r06: Module = {
  n: 6,
  title: 'Error Handling',
  tour: '9 · Error Handling',
  summary: 'Recoverable and unrecoverable errors: `panic!`, `Result`, the `?` operator, custom error types, `From` conversions and when to use which crate.',
  topics: ['panic!', 'Result & ?', 'Custom errors', 'From & conversions', 'thiserror & anyhow'],
  cpp23: [
    '`Option::is_none_or` and `Result::is_ok_and` helpers (Rust 1.82 and 1.70).',
    '`std::error::Error` moved into `core` (Rust 1.81), so `no_std` code can use it.',
  ],
  lessons: [],
  quiz: [],
}
