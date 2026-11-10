import type { Course } from '../course'
import { CPP } from './cpp'
import { GO } from './go'
import { JAVA } from './java'
import { RUST } from './rust'
import { PYTHON } from './python'
import { DATA } from './data'
import { ML } from './ml'
import { DL } from './dl'
import { SYSTEMS } from './systems'
import { INTRO } from './intro'

/** All courses, keyed by id (the same id site.ts uses for a language, or lists in `courses`). */
export const COURSES: Record<string, Course> = { cpp: CPP, go: GO, java: JAVA, rust: RUST, python: PYTHON, data: DATA, ml: ML, dl: DL, systems: SYSTEMS, intro: INTRO }

/** Courses keyed by their URL section ('tour', 'go', …). */
export const BY_SECTION: Record<string, Course> = Object.fromEntries(Object.values(COURSES).map((c) => [c.section, c]))
