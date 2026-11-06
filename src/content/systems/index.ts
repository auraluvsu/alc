import type { Module } from '../types'
import { s01 } from './s01'
import { s02 } from './s02'
import { s03 } from './s03'
import { s04 } from './s04'
import { s05 } from './s05'
import { s06 } from './s06'
import { s07 } from './s07'
import { s08 } from './s08'
import { s09 } from './s09'
import { s10 } from './s10'
import { s11 } from './s11'
import { s12 } from './s12'

// Follows Computer Systems: A Programmer's Perspective (3rd ed., Bryant & O'Hallaron),
// taught in C++23 on x86-64 Linux, plus an added module on low-latency trading systems.
export const SYS_MODULES: Module[] = [s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12]
