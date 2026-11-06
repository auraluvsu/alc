import type { Course } from '../course'
import { SYS_MODULES } from '../content/systems'
import { SYS_DICT } from '../content/systems/dictionary'
import { SYS_STANDARD } from '../content/systems/standard'
import { SYS_BRIDGES } from '../content/systems/bridges'

export const SYSTEMS: Course = {
  id: 'systems',
  base: '/systems',
  section: 'systems',
  brand: 'Systems Programming',
  edition: 'C++23 · x86-64 Linux edition',
  mainLang: 'cpp',
  codeLabel: 'C++23',
  newLabel: 'Modern C++ & Linux',
  others: ['python', 'ts', 'go', 'java'],
  modules: SYS_MODULES,
  dict: SYS_DICT,
  standard: SYS_STANDARD,
  stdName: 'the systems toolkit',
  bridges: SYS_BRIDGES,
  progressKey: 'systems-course-progress-v1',
  design: false,
  chapterLabel: 'CS:APP ch.',
  hero: {
    eyebrow: 'Low-level & systems programming',
    before: 'See what your code ',
    accent: 'really does',
    after: ' on the machine.',
    text: "Twelve modules following Bryant & O'Hallaron's Computer Systems: A Programmer's Perspective (3rd ed.), taught in C++23 on x86-64 Linux: bits and floats, assembly, the stack, caches, linking, processes, virtual memory, I/O and concurrency, plus an added module on low-latency systems for trading. Pass each module's quiz with {pass}% to mark it complete.",
  },
  dictSearchHint: 'Search: cache line, two\'s complement, mmap, memory_order…',
  stdSearchHint: 'Search: std::bit_cast, std::atomic, epoll, perf…',
}
