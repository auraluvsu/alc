import type { Module } from '../types'

export const r13: Module = {
  n: 13,
  title: 'Object-Oriented Design in Rust',
  tour: '18 · Object-Oriented Programming Features',
  summary: 'What Rust takes from object orientation and leaves behind: encapsulation, traits as interfaces, trait objects, composition over inheritance, state and type-state patterns.',
  topics: ['Encapsulation', 'Traits vs. inheritance', 'Trait objects', 'State pattern', 'Type-state & builders'],
  cpp23: [
    'Trait upcasting makes `dyn` hierarchies easier to work with (Rust 1.86).',
    '`impl Trait` in more positions and precise capturing reduce the need for boxing (Rust 1.75 to 1.82).',
  ],
  lessons: [],
  quiz: [],
}
