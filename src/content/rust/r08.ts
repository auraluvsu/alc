import type { Module } from '../types'

export const r08: Module = {
  n: 8,
  title: 'Writing Tests and a CLI',
  tour: '11, 12 · Writing Automated Tests; An I/O Project',
  summary: 'Unit, integration and doc tests, `cargo test` options, then putting it together in a small command-line program.',
  topics: ['Unit tests', 'Integration tests', 'Doc tests', 'Test organisation', 'A command-line tool'],
  cpp23: [
    'Doc tests are compiled per crate rather than per snippet in the 2024 edition, which makes them much faster.',
    '`cargo test` can run a single `--doc` pass or `--lib` pass; use `cargo nextest` for parallel, isolated runs.',
  ],
  lessons: [],
  quiz: [],
}
