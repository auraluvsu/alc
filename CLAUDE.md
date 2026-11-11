# CLAUDE.md

## What this is

**Aurora's Learning Centre (ALC)**: a personal programming school. A static React 19 + Vite 6 + TypeScript 5.8 single-page app, prerendered per route for SEO, deployed on Vercel (`https://alc-orcin.vercel.app`). Each subject is a full course: prose lessons with analogies, code and inline knowledge checks; a quiz per module; a searchable dictionary ("reference"); a library guide ("The Standard"); optionally a Design page. Progress lives in the browser's `localStorage` only; there is no backend.

The npm package is still named `cpp-tour` because the project began as a C++ course. Several names are legacy and now generic (see Gotchas).

### Courses

| Course (`id`) | Route | Modules | Content dir | File prefix |
|---|---|---|---|---|
| Foundations (`intro`) | `/intro` | 12 | `src/content/intro` | `f01..` |
| Systems (CS:APP, C++23) | `/systems` | 12 | `src/content/systems` | `s01..` |
| Python | `/python` | 28 | `src/content/python` | `p01..` |
| Go | `/go` | 15 | `src/content/go` | `g01..` |
| Java (Core Java for the Impatient) | `/java` | 14 | `src/content/java` | `j01..` |
| Rust (TRPL, 2024 edition) | `/rust` | 14 | `src/content/rust` | `r01..` |
| C++ (Tour of C++) | `/tour` | 18 | `src/content/` (flat, legacy) | `m01..m18` |
| Data Analytics | `/data` | 12 | `src/content/data` | `d01..` |
| Machine Learning | `/ml` | 12 | `src/content/ml` | `l01..` |
| Deep Learning | `/dl` | 12 | `src/content/dl` | `n01..` |
| Advanced Maths (no code) | `/maths` | 9 | `src/content/maths` | `a01..` |

Counts are as of writing; `src/courses/*.ts` is the source of truth.

## Commands

```
npm run dev            # Vite dev server
npm run build          # tsc -b → vite build → SSR build → scripts/prerender.mjs  (output: dist/)
npm run preview        # serve dist/
npm run lint           # eslint .
npm run typecheck      # tsc -b
npm test               # vitest run
npm run test:watch
npm run test:coverage
npm run test:e2e       # Playwright; needs `npm run build` first and `npx playwright install chromium` once
npm run verify:build   # checks dist/ against public/sitemap.xml (run after build)
npm run build:artifact # single-file, hash-routed build → dist-artifact/
npm run check          # lint + typecheck + test + build + verify:build (everything CI does except e2e)
```

- Single test file: `npx vitest run src/progress.test.ts` (add `-t "name"` to filter).
- `npm install` installs a **pre-push hook** (simple-git-hooks) running lint, typecheck and unit tests. It does not run build or e2e.
- CI (`.github/workflows/ci.yml`, Node 22): `static-and-unit` (lint, typecheck, coverage) → `build` (build, verify:build, build:artifact) → `e2e` (Playwright on the built `dist`). Vercel handles deploys; CI doesn't deploy.

## Architecture

### Content model (`src/content/types.ts`)
- `Module { n, title, tour, summary, topics[], cpp23[], lessons[], quiz[] }`. `tour` = matching book-chapter label; `cpp23` = "newer than the book" bullets (the course's `newLabel`/`newHeading` rename it, e.g. Go 1.18–1.27). Empty `lessons` means "not written yet" (shown as "soon", excluded from the sitemap).
- `Lesson { id, title, blocks[] }`. `Block` union: `p`, `h`, `list`, `analogy`, `new23`, `pitfall`, `code` (optional `lang`), `compare` and `poly` (fixed per-language keys), `check` (inline question: `q, code?, options, answer, hint, explain`), `stepper` (line-by-line code walkthrough with memory cells).
- `QuizQ { q, code?, options, answer (index), explain }`, `DictEntry`, `StdEntry`.
- Inline text supports `` `code` `` and `**bold**` (rendered by `Inline` in `src/components/highlight.tsx`).
- Content is plain TypeScript data; code samples are template literals.

### Course config (`src/course.ts`, `src/courses/<id>.ts`)
A `Course` object holds `id, base, section, brand, edition, mainLang, codeLabel, newLabel, newHeading?, others[], modules, dict, standard, stdName, bridges, progressKey, design?, chapterLabel, hero{…}, dictSearchHint, stdSearchHint`. `hero.text` may contain `{pass}`. `bridges` maps module number → "Coming from X" notes per `LangId`. `design: false` hides the Design tab; `standard: []` hides The Standard. `src/courses/index.ts` exports `COURSES` (by id) and `BY_SECTION` (by URL section). Homepage cards and top-bar menus come from `LANGUAGES` in `src/site.ts`.

### Routing (`src/router.tsx`, `src/App.tsx`, `src/tour/CourseShell.tsx`)
- Custom router, no library. `VITE_ROUTER` selects the mode: `path` (default, History API, real URLs) or `hash` (artifact build, `.env.artifact`).
- App code works in paths: build links with `to(path)`, navigate with `navigate(path, replace?)`. Only the router knows the mode. Internal `<a href="/…">` clicks are intercepted.
- `SECTIONS` (`src/router.tsx:13`) must list every course section; hash mode only recognises these.
- `App.tsx` splits `/<section>/<sub>`: empty → `Home`, known course → `CourseShell`, `/design` → redirect to `/tour/design`, else NotFound. It sets `document.documentElement.dataset.section`, which drives the per-section CSS palette in `src/index.css`.
- `CourseShell` sub-paths: (empty) course home, `module-N` (lesson 1), `module-N-L` (lesson L, 1-based), `quiz-N`, `reference`, `standard`, `design`.

### Progress (`src/progress.ts`, `useProgress(key)`)
- Shape: `{ lessons: {"m1:l2": true}, quiz: {moduleN: bestPercent}, last?, draft? }`. Lesson ids are **positional** (`m${n}:l${index}`, 0-based), not `Lesson.id`.
- `PASS_MARK = 70`; a module is complete when its best quiz score ≥ 70 (`passed`). `resumePoint(course, p)` builds the "Resume" link.
- One `localStorage` key per course (`progressKey`, e.g. `cpp-tour-progress-v1`, `go-course-progress-v1`). Theme is stored under `cpp-tour-theme` (`src/theme.ts`). All storage access is try/catch-guarded, and corrupt data falls back to empty.

### Prerender / SEO
`public/sitemap.xml` is hand-maintained and **drives** the prerender: `scripts/prerender.mjs` calls `render(path)` from `src/entry-server.tsx` for each `<loc>` and writes `dist/<path>/index.html` with title and canonical link. The client uses `createRoot` (not `hydrateRoot`) and replaces the prerendered HTML. `pageTitle(path)` (`src/pageTitle.ts`) is shared by client and SSR. `vercel.json` rewrites everything to `/index.html`.

### Artifact build
`build:artifact` produces one self-contained HTML file (`vite-plugin-singlefile`, hash routing). `scripts/postbuild.mjs` strips the document wrapper and hoists `<title>` to the top, since the host reads titles from the first 8KB.

## Directory map

```
index.html, vite.config.ts (also vitest config), playwright.config.ts, eslint.config.js, vercel.json, .env.artifact
public/       robots.txt, sitemap.xml (hand-maintained)
scripts/      prerender.mjs, verify-build.mjs, postbuild.mjs
e2e/          app.spec.ts (Playwright)
src/
  main.tsx, entry-server.tsx, App.tsx, router.tsx
  site.ts            LANGUAGES catalogue, SITE_NAME
  course.ts          Course type, LangId, ALL_LANGS, CourseCtx/useCourse
  courses/           one Course object per course + index.ts registry
  content/           types.ts, content.test.ts, per-course dirs (index.ts, dictionary.ts, standard.ts, bridges.ts, module files)
  components/        Blocks, Quiz, Bridge, SiteBar, Logo, highlight, reveal, shuffle
  home/Home.tsx
  tour/              CourseShell.tsx (generic shell for ALL courses), Standard.tsx, DesignPage.tsx
  progress.ts, theme.ts, pageTitle.ts, index.css, test/setup.ts
```
Generated and gitignored: `dist/`, `dist-ssr/`, `dist-artifact/`, `coverage/`, `playwright-report/`, `test-results/`.

## Recipes

**Add a lesson or module**
1. Add/extend the module file under `src/content/<course>/`.
2. Export it from that folder's `index.ts`.
3. Add its routes to `public/sitemap.xml` (`module-N`, and `module-N-L` for L ≥ 2; quiz pages are excluded).
4. Add dictionary / standard / bridges entries where relevant.

**Add a course**
1. Create `src/content/<id>/` with `index.ts`, `dictionary.ts`, `standard.ts`, `bridges.ts` and module files.
2. Create `src/courses/<id>.ts` and register it in `src/courses/index.ts`.
3. Add a `Language` entry in `src/site.ts` (or add the id to an existing entry's `courses`).
4. Add the section to `SECTIONS` in `src/router.tsx`. (The README says to add a route there, but `App.tsx` actually routes via `BY_SECTION`.)
5. Add the accent class and `data-section` palette in `src/index.css`.
6. Add all routes to `public/sitemap.xml`.
7. Add the new base to the home-page list in `e2e/app.spec.ts`.

If the course teaches a language not yet in `LangId` (`python|ts|go|java|cpp`), also extend `LangId`/`ALL_LANGS` (`src/course.ts:6-7`), the `lang`/`compare`/`poly` keys in `src/content/types.ts`, `CodeLang` (`src/components/Blocks.tsx:33`), and highlighting in `src/components/highlight.tsx`.

## Conventions

- **TypeScript** (strict): `verbatimModuleSyntax` (use `import type`), `erasableSyntaxOnly` (no enums/namespaces), `noUnusedLocals/Parameters`, `jsx: react-jsx`, ESM.
- **ESLint** flat config: `js.recommended` + `typescript-eslint` + `react-hooks` + `react-refresh`. `no-useless-escape` is enforced, which matters in content strings. `scripts/*.mjs` are not linted.
- **Style** (no Prettier config): single quotes, no semicolons, 2-space indent, trailing commas in multiline literals. Content is long one-line objects like `{ kind: 'p', text: '…' }`. Use ASCII quotes.
- **Naming**: module files are `<prefix><NN>.ts` exporting the lowercase id (`g01`); arrays are `GO_MODULES`, `GO_DICT`, `GO_STANDARD`, `GO_BRIDGES`; lesson `id`s are short slugs; module `n` is 1-based.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `test:`, `ci:`, `docs:`, `chore:`), feature branches merged by PR.
- **Lesson shape**: open with an `analogy`, go deep with `code` / `list` / `compare` / `pitfall`, mark post-book features with `new23`, end with at least one `check`. Each module has a quiz and a `cpp23`-style "newer than the book" list.

## Testing

- **Vitest** (jsdom; config in `vite.config.ts`; setup `src/test/setup.ts` clears `localStorage` and polyfills `matchMedia`/`IntersectionObserver`). Coverage excludes `src/content/**`.
  - `src/content/content.test.ts`: course registry (unique `id`/`section`/`base`/`progressKey`, `others` excludes `mainLang`) and content validity (ascending unique module numbers, unique lesson ids, well-formed quiz/`check` questions with in-range `answer`, non-empty `explain`/`hint`, stepper `line` in range, dictionary and bridge entries pointing at real modules, no duplicate terms).
  - `src/sitemap.test.ts`: sitemap matches the routes the registry implies (fails on **missing and stale** entries), correct origin, `robots.txt` references it, SSR renders every path with a unique title.
  - `src/progress.test.ts`: read/validate, `passed`, `resumePoint`, `useProgress`.
- **Playwright** (`e2e/app.spec.ts`, Chromium, runs against `vite preview` on port 4173): home links every course, prerendered deep link, progress survives reload, corrupt/unavailable storage doesn't break the app, no horizontal overflow at 390px.

## Gotchas

- **Sitemap is manual.** Adding or removing a lesson without editing `public/sitemap.xml` fails `sitemap.test.ts`; prerender and `verify:build` depend on it too.
- **Production origin is hardcoded** in `scripts/prerender.mjs`, `scripts/verify-build.mjs`, `src/sitemap.test.ts`, the sitemap and `robots.txt`.
- **Saved progress is fragile.** Changing a `progressKey` resets everyone's progress; reordering lessons shifts positional ids. The C++ key is deliberately left as `cpp-tour-progress-v1`, and e2e hardcodes it with lesson id `m1:l0`.
- **Misleading legacy names**: package `cpp-tour`, dir `src/tour/` (the shared shell), `Module.tour`, `Module.cpp23`. They apply to every course; don't "fix" them casually.
- **Template-literal code samples**: escape `\\n`, `` \` `` and `${` correctly.
- **Docs drift**: the README partly disagrees with the code (C++ edition, router instructions). Trust the code.
- `e2e` needs a fresh `npm run build` first. `.env.artifact` is committed; `*.local` is ignored.

## Current work

The Rust course (`src/content/rust`, `src/courses/rust.ts`) is written: modules 1 to 12 follow The Rust Programming Language, and 13 to 14 are added (OO design, advanced Rust). `LangId` includes `rust`, and `highlight()` has a Rust tokenizer (lifetimes, attributes, raw strings, macro calls). The palette is rust orange with verdigris green. `poly` blocks and `CodeLang` deliberately have no Rust key, so Foundations is unchanged. `Inline` supports only backticks and `**bold**`, so avoid `*italics*` in content.

The Java course (`src/content/java`, `src/courses/java.ts`) is written. Modules 1 to 12 follow the book's chapters, and 13 to 14 are added (OO design, modern concurrency). `java` is both the course's `mainLang` and a comparison language in other courses. `highlight()` has a Java-specific keyword list, and the palette is Java red with the logo's blue. A C course would need a new `LangId` and the plumbing listed under "Add a course".

The Advanced Maths course (`src/content/maths`, `src/courses/maths.ts`) is written and has **no code**. It sets `noCode: true` on the `Course`, which changes three things: the dictionary shows `syntax` as plain notation (a serif `.notation` box, not a highlighted snippet), the Reference title reads "Concepts & notation", and `content.test.ts` skips the code-label and `stdName` requirements and fails if a lesson uses a `code`, `compare`, `poly` or `stepper` block. Two block kinds were added for it: `eq` (display equation, `lines[]` plus optional `caption`) and `links` ("Learn more" list of `{ label, url, note? }`, https only, opens in a new tab). Every lesson ends with a `links` block. There is no Standard (`standard: []`) and no Design tab (`design: false`); `mainLang: 'python'` is a placeholder that is never rendered. `cpp23` holds the "Going further" list and `tour` holds the part label ("Part III · Linear algebra"). Write formulas with Unicode (`²`, `√`, `Σ`, `∇`, `ᵀ`) and avoid `*` for multiplication, since `Inline` treats it as emphasis. The source outline is `MATHS.md`.
