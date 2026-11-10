# Aurora's Learning Centre

A personal school for programming, delivered as a single-page web app. Each subject is a full course: lessons written as readable prose with analogies, code examples, short knowledge checks, and a quiz at the end of every module. Alongside each course sit a searchable dictionary of terms and a guide to the most useful parts of the language's standard library.

The site is a React + TypeScript app built with Vite. All course content lives in plain TypeScript data files under `src/content/`, so lessons are easy to edit, extend, and review.

## What it teaches

| Course | Route | Modules | Based on | Covers |
| --- | --- | --- | --- | --- |
| **Foundations** | `/intro` | 12 | Written for this site | Programming for complete beginners: values and variables, decisions, loops, collections, functions, text and files, debugging, algorithms, objects. Examples are in plain-English pseudocode, with a switch to Python, TypeScript, Go, Java or C++. |
| **Systems** | `/systems` | 12 | Bryant & O'Hallaron, *Computer Systems: A Programmer's Perspective* (3rd ed.) | How programs really run in C++23 on x86-64 Linux: bits and floats, assembly, the stack, caches, linking, processes, virtual memory, I/O and concurrency, plus a module on low-latency systems. |
| **Python** | `/python` | 28 | Ramalho, *Fluent Python* (2nd ed.), updated to Python 3.15 | The Python data model, sequences, dicts, text, data classes, and how Python works underneath, plus modules on NumPy and PyTorch. |
| **Go** | `/go` | 15 | Donovan & Kernighan, *The Go Programming Language*, updated to Go 1.27 | Slices, errors, methods, interfaces, concurrency, generics and iterators. |
| **Java** | `/java` | 14 | Horstmann, *Core Java for the Impatient* (4th ed.), updated to Java 27 | Classes, interfaces, generics, collections, streams, concurrency and modules, plus added modules on object-oriented design and modern concurrency. |
| **Rust** | `/rust` | 14 | Klabnik & Nichols, *The Rust Programming Language*, updated to the 2024 edition and Rust 1.98 | Ownership and borrowing, traits and lifetimes, smart pointers, concurrency and async, plus added modules on object-oriented design and advanced Rust. |
| **C++** | `/tour` | 18 | Stroustrup, *A Tour of C++* (3rd ed.), updated to C++23 | Memory, types, templates, the standard library and concurrency. |
| **Data Analytics** | `/data` | 12 | McKinney, *Python for Data Analysis* (3rd ed.), updated to pandas 3.1 | Turning raw market data into analysis: pandas, financial data, and analysis at scale with Polars, DuckDB and Arrow. |
| **Machine Learning** | `/ml` | 12 | Géron, *Hands-On Machine Learning* (3rd ed.), Part I, updated to scikit-learn 1.9 | Modelling with scikit-learn, avoiding leakage and self-deception, validating financial models, and serving models from C++. |
| **Deep Learning** | `/dl` | 12 | *Dive into Deep Learning* (d2l.ai), in PyTorch 2.15 | Building neural networks from the first neuron up, applied to financial time series, and deploying models with `torch.export`, ONNX Runtime and LibTorch. |

The courses are meant to be read in order within each subject. The three ML & Data courses (Data Analytics → Machine Learning → Deep Learning) form a sequence. Foundations is the recommended starting point for anyone new to programming. Developers who already know another language get notes in each lesson comparing it to Python, TypeScript, Go, Java and C++.

### How each module works

- **Analogy first.** Each lesson opens with a plain-language comparison to make the idea concrete before the details arrive.
- **Depth after.** The lesson then goes into the real mechanics, with code, lists, and pitfalls.
- **Cross-language notes.** Where the language differs from what a reader might expect, a comparison block shows the same idea in other languages.
- **Quiz.** Each module ends with a quiz. Scoring 70% or more marks the module complete.
- **Progress.** Completed lessons and quiz scores are saved in your browser (`localStorage`), per course. Nothing is sent to a server.

### Reference material

- **Dictionary:** a searchable glossary of syntax and concepts for each course (for example, `unique_ptr`, `two's complement`, `pd.col`, `TimeSeriesSplit`).
- **The Standard:** a guide to the most useful standard library functions and tools for each language.
- **Design:** notes and experiments for some courses.

## Running it locally

Requires Node.js (a current LTS release is fine).

```bash
npm install
npm run dev        # start the dev server with hot reload
```

Other scripts:

```bash
npm run build          # type-check and produce a production build in dist/
npm run preview        # serve the production build locally
npm run lint           # run ESLint
npm run build:artifact # build a single self-contained HTML file (hash routing)
```

The `build:artifact` script uses `VITE_ROUTER=hash` (see `.env.artifact`) so the app works when hosted without server-side route rewrites. Normal builds use path-based routes, and `vercel.json` rewrites all paths to `index.html` for deployment.

## Project structure

```
src/
  site.ts          Site-wide catalogue of languages and the homepage cards
  courses/         One file per course: title, accent, modules, dictionary, standard, bridges
  content/         The lessons themselves
    types.ts       Types for modules, lessons, blocks, quizzes and dictionary entries
    <course>/      Module files (p01.ts, g01.ts, …), plus dictionary.ts, standard.ts, bridges.ts
  components/      Shared UI: code blocks, quizzes, the language switcher, the site bar
  home/            The homepage
  tour/            Shared course shell and the design and standard pages
  progress.ts      Per-browser progress tracking
  router.tsx       Small client-side router supporting path and hash modes
```

### Adding a lesson

Each module is a `Module` object (see `src/content/types.ts`) with a title, summary, topics, and a list of lessons. A lesson is an ordered list of blocks such as `p`, `h`, `list`, `analogy`, `code`, `compare`, `pitfall` and `check`. Add the module file under the course's `src/content/<course>/` folder, export it from that folder's `index.ts`, and it appears in the course automatically.

### Adding a course

1. Create the content folder and an `index.ts` exporting the modules.
2. Add a `Course` object in `src/courses/` (brand, accent, language labels, hero text, and the other languages to compare against).
3. Register it in `src/courses/index.ts`.
4. Add a `Language` entry in `src/site.ts` and a route in `src/router.tsx`.

## Who it's for

- Someone starting programming who wants a structured, quiz-checked path.
- A working developer picking up a new language and wanting its internals explained, not just its syntax.
- Anyone who wants to understand how computers run code, from bits and memory up to concurrency.
- Readers working through ML and data courses who want the financial and production angles that general textbooks skip.

## Tech stack

React 19, TypeScript, Vite 6, ESLint. Fonts are provided by `@fontsource` (Bodoni Moda and Young Serif). Deployable as a static site or as a single HTML file.

## License

See [LICENSE](LICENSE).

## Testing and CI

| Command | What it runs |
| --- | --- |
| `npm test` | Vitest unit + content-integrity + sitemap/SSR tests (`src/**/*.test.ts`) |
| `npm run test:coverage` | Same, with a v8 coverage report |
| `npm run verify:build` | After `npm run build`: checks every prerendered page (title, canonical, content) |
| `npm run test:e2e` | Playwright (Chromium) against `vite preview`; run `npm run build` first |
| `npm run check` | lint, typecheck, tests, build and build verification in one go |

`npm run build` runs `tsc -b`, the client build, an SSR build, then `scripts/prerender.mjs`, which renders every URL in `public/sitemap.xml` into `dist/`.
The sitemap is hand-maintained, but `src/sitemap.test.ts` fails if a module/lesson route is missing from it or if it lists a route with no content, so update it when you add content.

A pre-push git hook (installed by `npm install` via `simple-git-hooks`) runs lint, typecheck and unit tests. The full suite, including build verification and E2E, runs in GitHub Actions (`.github/workflows/ci.yml`) on every push and pull request.
