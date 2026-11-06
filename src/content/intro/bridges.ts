import type { LangId } from '../../course'

// Foundations assumes no prior language, so there are no "coming from" notes.
export const INTRO_BRIDGES: Record<number, Partial<Record<LangId, string>>> = {}
