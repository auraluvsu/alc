import type { Module } from '../types'
import { n01 } from './n01'
import { n02 } from './n02'
import { n03 } from './n03'
import { n04 } from './n04'
import { n05 } from './n05'
import { n06 } from './n06'
import { n07 } from './n07'
import { n08 } from './n08'
import { n09 } from './n09'
import { n10 } from './n10'
import { n11 } from './n11'
import { n12 } from './n12'

// Follows Dive into Deep Learning (Zhang, Lipton, Li & Smola; d2l.ai) with PyTorch 2.15,
// plus added modules on deep learning for financial time series and C++ deployment.
export const DL_MODULES: Module[] = [n01, n02, n03, n04, n05, n06, n07, n08, n09, n10, n11, n12]
