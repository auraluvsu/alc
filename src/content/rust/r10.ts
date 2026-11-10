import type { Module } from '../types'

export const r10: Module = {
  n: 10,
  title: 'Smart Pointers',
  tour: '15 · Smart Pointers',
  summary: 'Box, Deref and Drop, reference counting with Rc and Arc, interior mutability with Cell and RefCell, and reference cycles.',
  topics: ['Box<T>', 'Deref & Drop', 'Rc & Arc', 'Cell & RefCell', 'Reference cycles & Weak'],
  cpp23: [
    '`LazyCell` and `LazyLock` replace most uses of `once_cell` and `lazy_static` (Rust 1.80).',
    '`Cell::update` (Rust 1.88) and `Rc::new_cyclic`-style constructors for self-referential graphs.',
  ],
  lessons: [],
  quiz: [],
}
