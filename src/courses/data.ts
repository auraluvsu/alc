import type { Course } from '../course'
import { DATA_MODULES } from '../content/data'
import { DATA_DICT } from '../content/data/dictionary'
import { DATA_STANDARD } from '../content/data/standard'
import { DATA_BRIDGES } from '../content/data/bridges'

export const DATA: Course = {
  id: 'data',
  base: '/data',
  section: 'data',
  brand: 'Data Analytics',
  edition: 'pandas 3.1 edition',
  mainLang: 'python',
  codeLabel: 'Python · pandas 3.1',
  newLabel: 'Modern pandas',
  others: ['cpp', 'ts', 'go', 'java'],
  modules: DATA_MODULES,
  dict: DATA_DICT,
  standard: DATA_STANDARD,
  stdName: 'pandas',
  bridges: DATA_BRIDGES,
  progressKey: 'data-course-progress-v1',
  chapterLabel: 'McKinney ch.',
  hero: {
    eyebrow: 'Machine learning & data · part 1 of 3',
    before: 'Turn raw market data into ',
    accent: 'analysis',
    after: ' you can trust.',
    text: "Twelve modules following Wes McKinney's Python for Data Analysis (3rd ed.), updated to pandas 3.1, plus added modules on financial data and analysis at scale with Polars, DuckDB and Arrow. Examples use prices, returns and trades throughout. Pass each module's quiz with {pass}% to mark it complete.",
  },
  dictSearchHint: 'Search: loc, reindex, pd.col, rank…',
  stdSearchHint: 'Search: merge_asof, resample, rolling…',
}
