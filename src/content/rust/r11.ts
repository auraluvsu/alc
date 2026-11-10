import type { Module } from '../types'

export const r11: Module = {
  n: 11,
  title: 'Fearless Concurrency',
  tour: '16 · Fearless Concurrency',
  summary: 'Threads, message passing, shared state with Mutex and RwLock, atomics, and how `Send` and `Sync` make data races a compile error.',
  topics: ['Threads', 'Channels', 'Mutex & RwLock', 'Send & Sync', 'Atomics'],
  cpp23: [
    '`std::thread::scope` borrows locals in threads without `Arc` (Rust 1.63).',
    '`std::sync::Once`/`OnceLock`, and `LazyLock` for global state (Rust 1.70 and 1.80).',
  ],
  lessons: [],
  quiz: [],
}
