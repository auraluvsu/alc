import type { Course } from '../course'
import { ML_MODULES } from '../content/ml'
import { ML_DICT } from '../content/ml/dictionary'
import { ML_STANDARD } from '../content/ml/standard'
import { ML_BRIDGES } from '../content/ml/bridges'

export const ML: Course = {
  id: 'ml',
  base: '/ml',
  section: 'ml',
  brand: 'Machine Learning',
  edition: 'scikit-learn 1.9 edition',
  mainLang: 'python',
  codeLabel: 'Python · scikit-learn 1.9',
  newLabel: 'Modern scikit-learn',
  others: ['cpp', 'ts', 'go', 'java'],
  modules: ML_MODULES,
  dict: ML_DICT,
  standard: ML_STANDARD,
  stdName: 'scikit-learn',
  bridges: ML_BRIDGES,
  progressKey: 'ml-course-progress-v1',
  chapterLabel: 'Géron ch.',
  hero: {
    eyebrow: 'Machine learning & data · part 2 of 3',
    before: 'Learn ',
    accent: 'machine learning',
    after: ' without fooling yourself.',
    text: "Twelve modules following Part I of Aurélien Géron's Hands-On Machine Learning (3rd ed.), updated to scikit-learn 1.9, plus added modules on validating financial models, ML for trading and serving models from C++. Pass each module's quiz with {pass}% to mark it complete.",
  },
  dictSearchHint: 'Search: Pipeline, leakage, RMSE, TimeSeriesSplit…',
  stdSearchHint: 'Search: ColumnTransformer, HistGradientBoosting…',
}
