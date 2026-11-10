import type { Module } from '../types'

export const r05: Module = {
  n: 5,
  title: 'Collections and Strings',
  tour: '8 · Common Collections',
  summary: 'Vec, String and HashMap in depth: growth, indexing, UTF-8, the Entry API, and choosing between collections.',
  topics: ['Vec', 'String & &str', 'HashMap & Entry', 'BTreeMap & others', 'Choosing a collection'],
  cpp23: [
    '`Vec::extract_if` and `HashMap::extract_if` remove matching items while iterating (Rust 1.87).',
    '`slice::as_chunks` and `Vec::pop_if` (Rust 1.88 and 1.86).',
  ],
  lessons: [],
  quiz: [],
}
