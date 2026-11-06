// Shuffle answer options so the correct one isn't always in the same position.
// Options like "All of them", "Both", "Neither", "None" stay last, in their original order,
// because they read oddly anywhere else.
const PINNED = /^(all|both|neither|none|nothing|it depends|depends)\b/i

/** Small seeded PRNG, so a saved quiz can rebuild the same option order. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const randomSeed = () => Math.floor(Math.random() * 2 ** 31)

export function shuffleOptions(options: string[], answer: number, rand: () => number = Math.random): { options: string[]; answer: number } {
  const idx = options.map((_, i) => i)
  const free = idx.filter((i) => !PINNED.test(options[i].replace(/[`*]/g, '')))
  const pinned = idx.filter((i) => PINNED.test(options[i].replace(/[`*]/g, '')))
  for (let i = free.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[free[i], free[j]] = [free[j], free[i]]
  }
  const order = [...free, ...pinned]
  return { options: order.map((i) => options[i]), answer: order.indexOf(answer) }
}
