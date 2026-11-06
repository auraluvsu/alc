// Shuffle answer options so the correct one isn't always in the same position.
// Options like "All of them", "Both", "Neither", "None" stay last, in their original order,
// because they read oddly anywhere else.
const PINNED = /^(all|both|neither|none|nothing|it depends|depends)\b/i

export function shuffleOptions(options: string[], answer: number): { options: string[]; answer: number } {
  const idx = options.map((_, i) => i)
  const free = idx.filter((i) => !PINNED.test(options[i].replace(/[`*]/g, '')))
  const pinned = idx.filter((i) => PINNED.test(options[i].replace(/[`*]/g, '')))
  for (let i = free.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[free[i], free[j]] = [free[j], free[i]]
  }
  const order = [...free, ...pinned]
  return { options: order.map((i) => options[i]), answer: order.indexOf(answer) }
}
