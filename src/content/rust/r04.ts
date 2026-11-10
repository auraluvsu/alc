import type { Module } from '../types'

export const r04: Module = {
  n: 4,
  title: 'Packages, Crates and Modules',
  tour: '7, 14 · Managing Growing Projects; More About Cargo',
  summary: 'How Rust code is organised: packages, crates, modules, paths and visibility, plus Cargo profiles, workspaces and publishing.',
  topics: ['Packages & crates', 'Modules & paths', 'Visibility & use', 'Workspaces', 'Profiles & publishing'],
  cpp23: [
    'Workspace-wide dependency and lint inheritance with `[workspace.dependencies]` and `[workspace.lints]` (Rust 1.64 and 1.74).',
    'The 2024 edition and `cargo fix --edition` for upgrading.',
  ],
  lessons: [],
  quiz: [],
}
