import type { Module } from '../types'

export const r12: Module = {
  n: 12,
  title: 'Async Rust',
  tour: '17 · Fundamentals of Asynchronous Programming',
  summary: 'Futures, `async` and `.await`, executors and runtimes, tasks, streams, pinning, and when to use async versus threads.',
  topics: ['Futures & async/await', 'Runtimes & tasks', 'Joining & select', 'Streams', 'Pin'],
  cpp23: [
    'Async closures and the `AsyncFn*` traits (Rust 1.85).',
    '`async fn` in traits without the `async-trait` crate (Rust 1.75).',
  ],
  lessons: [],
  quiz: [],
}
