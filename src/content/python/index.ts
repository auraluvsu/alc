import type { Module } from '../types'
import { p01 } from './p01'
import { p02 } from './p02'
import { p03 } from './p03'
import { p04 } from './p04'
import { p05 } from './p05'
import { p06 } from './p06'
import { p07 } from './p07'
import { p08 } from './p08'
import { p09 } from './p09'
import { p10 } from './p10'
import { p11 } from './p11'
import { p12 } from './p12'
import { p13 } from './p13'
import { p14 } from './p14'
import { p15 } from './p15'
import { p16 } from './p16'
import { p17 } from './p17'
import { p18 } from './p18'
import { p19 } from './p19'
import { p20 } from './p20'
import { p21 } from './p21'
import { p22 } from './p22'
import { p23 } from './p23'
import { p24 } from './p24'
import { p25 } from './p25'
import { p26 } from './p26'
import { p27 } from './p27'
import { p28 } from './p28'

// Follows Fluent Python (2nd ed., Ramalho), one module per chapter, updated to Python 3.15,
// plus four added modules on NumPy and PyTorch.
export const PY_MODULES: Module[] = [
  p01, p02, p03, p04, p05, p06, p07, p08, p09, p10, p11, p12,
  p13, p14, p15, p16, p17, p18, p19, p20, p21, p22, p23, p24,
  // Added: the numerical stack, as a bridge into the Data, ML and Deep Learning courses.
  p25, p26, p27, p28,
]
