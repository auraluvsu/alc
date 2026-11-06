import type { Course } from '../course'
import { DL_MODULES } from '../content/dl'
import { DL_DICT } from '../content/dl/dictionary'
import { DL_STANDARD } from '../content/dl/standard'
import { DL_BRIDGES } from '../content/dl/bridges'

export const DL: Course = {
  id: 'dl',
  base: '/dl',
  section: 'dl',
  brand: 'Deep Learning',
  edition: 'PyTorch 2.15 edition',
  mainLang: 'python',
  codeLabel: 'Python · PyTorch 2.15',
  newLabel: 'Modern PyTorch',
  others: ['cpp', 'ts', 'go', 'java'],
  modules: DL_MODULES,
  dict: DL_DICT,
  standard: DL_STANDARD,
  stdName: 'PyTorch',
  bridges: DL_BRIDGES,
  progressKey: 'dl-course-progress-v1',
  chapterLabel: 'd2l ch.',
  hero: {
    eyebrow: 'Machine learning & data · part 3 of 3',
    before: 'Build ',
    accent: 'deep learning',
    after: ' models from the first neuron up.',
    text: "Twelve modules following Dive into Deep Learning (d2l.ai) in PyTorch 2.15, plus added modules on deep learning for financial time series and deploying models to C++ with torch.export, ONNX Runtime and LibTorch. Pass each module's quiz with {pass}% to mark it complete.",
  },
  dictSearchHint: 'Search: logits, dropout, AdamW, ReLU…',
  stdSearchHint: 'Search: DataLoader, clip_grad_norm_, export…',
}
