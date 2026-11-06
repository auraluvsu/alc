// Site-wide catalogue of languages. Each one becomes a top-bar menu and a homepage card.
// Add a language by adding an entry here (and its routes in App.tsx / router.tsx).
export type LangLink = { label: string; desc: string; to: string }
export type Language = {
  id: string
  name: string
  /** CSS class that sets the language's accent, e.g. 'accent-rose' */
  accent: string
  tagline: string
  links: LangLink[]
  /** Course ids whose progress this card shows; defaults to [id]. */
  courses?: string[]
}

export const SITE_NAME = "Aurora's Learning Centre"

export const LANGUAGES: Language[] = [
  {
    id: 'intro',
    name: 'Foundations',
    accent: 'accent-intro',
    tagline: 'Start here if you\'ve never programmed: the ideas every language shares, shown in plain-English pseudocode with a switch to see the same code in Python, TypeScript, Go, Java or C++.',
    links: [
      { label: 'Course', desc: '12 beginner modules with quizzes', to: '/intro' },
      { label: 'Dictionary', desc: 'Programming words, explained plainly', to: '/intro/reference' },
    ],
  },
  {
    id: 'systems',
    name: 'Systems',
    accent: 'accent-sys',
    tagline: 'How programs really run: bits, assembly, caches, memory, processes, I/O and concurrency, in C++23 on Linux, finishing with the engineering behind low-latency trading systems.',
    links: [
      { label: 'Course', desc: '12 modules after CS:APP, plus low latency', to: '/systems' },
      { label: 'Dictionary', desc: 'Systems terms at a glance', to: '/systems/reference' },
      { label: 'The Standard', desc: 'Key tools and APIs', to: '/systems/standard' },
    ],
  },
  {
    id: 'python',
    name: 'Python',
    accent: 'accent-python',
    tagline: 'Python 3.15, following Ramalho\'s Fluent Python: the data model, sequences, dicts, text, data classes and how Python really works.',
    links: [
      { label: 'Course', desc: 'The 28-module course with quizzes', to: '/python' },
      { label: 'Dictionary', desc: 'Searchable syntax and concepts', to: '/python/reference' },
      { label: 'The Standard', desc: 'The most useful standard library functions', to: '/python/standard' },
      { label: 'Design', desc: 'Design notes and experiments', to: '/python/design' },
    ],
  },
  {
    id: 'go',
    name: 'Go',
    accent: 'accent-gopher',
    tagline: 'Go 1.27, following Donovan & Kernighan\'s The Go Programming Language: slices, errors, methods, interfaces, concurrency and more.',
    links: [
      { label: 'Course', desc: 'The 15-module course with quizzes', to: '/go' },
      { label: 'Dictionary', desc: 'Searchable syntax and concepts', to: '/go/reference' },
      { label: 'The Standard', desc: 'The most useful standard library functions', to: '/go/standard' },
      { label: 'Design', desc: 'Design notes and experiments', to: '/go/design' },
    ],
  },
  {
    id: 'cpp',
    name: 'C++',
    accent: 'accent-rose',
    tagline: 'Modern C++23, following Stroustrup\'s A Tour of C++: memory, types, templates, the standard library and concurrency.',
    links: [
      { label: 'Tour', desc: 'The 18-module course with quizzes', to: '/tour' },
      { label: 'Dictionary', desc: 'Searchable syntax and concepts', to: '/tour/reference' },
      { label: 'The Standard', desc: 'The most useful library functions, explained', to: '/tour/standard' },
      { label: 'Design', desc: 'Design notes and experiments', to: '/tour/design' },
    ],
  },
  {
    id: 'ai',
    name: 'ML & Data',
    accent: 'accent-ml',
    tagline: 'Three linked courses in Python, with C++ for production: data analytics with pandas, machine learning with scikit-learn, and deep learning with PyTorch, all aimed at quant research.',
    courses: ['data', 'ml', 'dl'],
    links: [
      { label: 'Data Analytics', desc: 'pandas 3.1, after McKinney · 12 modules', to: '/data' },
      { label: 'Machine Learning', desc: 'scikit-learn 1.9, after Géron · 12 modules', to: '/ml' },
      { label: 'Deep Learning', desc: 'PyTorch 2.15, after d2l.ai · 12 modules', to: '/dl' },
    ],
  },
]
