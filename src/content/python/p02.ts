import type { Module } from '../types'

export const p02: Module = {
  n: 2,
  title: 'An Array of Sequences',
  tour: '2 · An Array of Sequences',
  summary: 'The built-in sequences, comprehensions and generator expressions, tuples as records, unpacking and sequence pattern matching, slicing, the + and * traps, sorting, and when a list is the wrong tool.',
  topics: ['Built-in sequences', 'Comprehensions & genexps', 'Tuples & unpacking', 'Pattern matching sequences', 'Slicing', 'Sorting & alternatives'],
  cpp23: [
    'Unpacking in comprehensions: `[*row for row in rows]` flattens (3.15, PEP 798).',
    '`itertools.batched(it, n)` (3.12) splits an iterable into tuples of n.',
    'Comprehensions are inlined (3.12, PEP 709), making them faster.',
  ],
  lessons: [
    {
      id: 'overview',
      title: 'Built-in sequences',
      blocks: [
        { kind: 'analogy', text: "Python's sequences sort along two lines. **Container** sequences (list, tuple, deque) are shelves of labels pointing at objects stored elsewhere, so they can hold anything. **Flat** sequences (str, bytes, array) pack the raw values into one contiguous block, which is compact and fast, but only for one primitive type." },
        { kind: 'code', code: `# container vs flat
mixed = [1, "XAU", 2390.5, None]          # list: references to any objects
import array
px = array.array("d", [2390.5, 2391.0])   # flat: raw C doubles, 8 bytes each

# mutable vs immutable
lst = [1, 2, 3]; lst[0] = 9               # list, bytearray, array, deque: mutable
tup = (1, 2, 3)                           # tuple, str, bytes, range: immutable
# tup[0] = 9                              # TypeError` },
        { kind: 'list', items: [
          'A list of a million floats stores a million pointers to a million float objects (~32 MB). `array("d")` or a NumPy array stores 8 MB of raw doubles.',
          'Every sequence supports `len`, indexing, slicing, `in`, iteration, `+` and `*`. That shared protocol is `collections.abc.Sequence`.',
        ] },
        { kind: 'check', q: 'Which is a flat sequence?', options: ['list', 'tuple', 'array.array', 'collections.deque'], answer: 2, hint: 'Which stores the values themselves rather than references?', explain: 'array, str, bytes, bytearray and memoryview store raw values contiguously.' },
      ],
    },
    {
      id: 'comprehensions',
      title: 'Comprehensions & generator expressions',
      blocks: [
        { kind: 'analogy', text: "A list comprehension is a one-line recipe: \"for each X in this, if it qualifies, put f(X) on the tray\". A generator expression is the same recipe given to a waiter who brings one plate at a time when asked, rather than cooking the whole tray up front." },
        { kind: 'code', code: `closes = [2385.0, 2396.2, 2381.4, 2390.5]

rets = [b / a - 1 for a, b in zip(closes, closes[1:])]          # list comprehension
ups  = [r for r in rets if r > 0]                                # with a filter
grid = [(sym, tf) for sym in ("XAU", "XAG") for tf in ("1h", "1d")]   # nested loops, left to right

total = sum(r * r for r in rets)                                 # genexp: no list built
by_sym = {t.sym: t.px for t in trades}                           # dict comprehension
venues = {t.venue for t in trades}                               # set comprehension

rows = [[1, 2], [3, 4], [5]]
flat = [*row for row in rows]           # 3.15: [1, 2, 3, 4, 5]
flat = [x for row in rows for x in row] # the pre-3.15 spelling` },
        { kind: 'list', items: [
          'Use a comprehension when you are **building a collection**. Use a plain `for` loop when you are running code for its side effects.',
          'Generator expressions are lazy. Pass them straight to `sum`, `max`, `any`, `"".join(...)` and so on, with no extra parentheses needed.',
          'Comprehension variables don\'t leak into the enclosing scope (since Python 3).',
        ] },
        { kind: 'compare',
          ts: `const rets = closes.slice(1).map((b, i) => b / closes[i] - 1)
const ups = rets.filter(r => r > 0)
const flat = rows.flat()`,
          go: `rets := make([]float64, 0, len(closes)-1)
for i := 1; i < len(closes); i++ {
    rets = append(rets, closes[i]/closes[i-1]-1)
}`,
          java: `var rets = IntStream.range(1, closes.length)
    .mapToDouble(i -> closes[i] / closes[i - 1] - 1)
    .toArray();`,
          cpp: `auto rets = std::views::zip(closes, closes | std::views::drop(1))
    | std::views::transform([](auto p) { auto [a, b] = p; return b / a - 1; })
    | std::ranges::to<std::vector>();`,
          python: `rets = [b / a - 1 for a, b in zip(closes, closes[1:])]
ups  = [r for r in rets if r > 0]
flat = [*row for row in rows]        # 3.15`,
          note: 'Comprehensions read as set-builder notation, and genexps give C++-ranges-style laziness with no extra syntax.' },
        { kind: 'check', q: 'What does `sum(x * x for x in range(1_000_000))` avoid compared with `sum([x * x for x in ...])`?', options: ['Nothing', 'Building a million-element list in memory', 'Integer overflow', 'Type checking'], answer: 1, hint: 'Tray vs one plate at a time.', explain: 'The genexp yields values one by one to `sum`, so memory stays constant.' },
      ],
    },
    {
      id: 'tuples',
      title: 'Tuples, unpacking & pattern matching',
      blocks: [
        { kind: 'analogy', text: "A tuple plays two roles. As a **record**, each position means something: (symbol, price, qty), like a row in a spreadsheet. As an **immutable list**, it is a list you've promised not to change. Unpacking is reading the record back into named variables in one go." },
        { kind: 'code', code: `trade = ("XAU", 2390.5, 10)              # record: position = meaning
sym, px, qty = trade                      # unpacking
a, b = b, a                               # swap via tuple packing/unpacking
first, *rest = [1, 2, 3, 4]               # first=1, rest=[2, 3, 4]
*_, last = closes                         # just the last one
q, r = divmod(17, 5)                      # functions "return several values" as a tuple

def describe(cmd):
    match cmd:                            # structural pattern matching (3.10)
        case ["buy", sym, qty]:
            return f"buy {qty} {sym}"
        case ["sell", sym, *_]:
            return f"sell {sym}"
        case ["cancel", str(order_id)] if order_id.startswith("ORD"):
            return f"cancel {order_id}"
        case _:
            return "unknown"

describe("buy XAU 10".split())            # 'buy 10 XAU'` },
        { kind: 'list', items: [
          'A one-element tuple needs a comma: `(1,)`. `(1)` is just the number 1 in parentheses.',
          'Sequence patterns match lists and tuples, but deliberately **not** `str`, `bytes` or `bytearray`, so `"buy"` isn\'t treated as `["b", "u", "y"]`.',
          '`case [x, y]` both checks the shape and binds variables, replacing chains of `len()` checks and indexing.',
        ] },
        { kind: 'check', q: 'What is `type((1))` and `type((1,))`?', options: ['tuple, tuple', 'int, tuple', 'tuple, int', 'int, int'], answer: 1, hint: 'What actually makes a tuple: the parentheses or the comma?', explain: 'The comma makes the tuple; parentheses only group.' },
      ],
    },
    {
      id: 'slicing',
      title: 'Slicing & the + / * traps',
      blocks: [
        { kind: 'analogy', text: "Slicing is cutting a ribbon between numbered marks: `s[1:4]` is the ribbon between mark 1 and mark 4. The end mark is excluded, so `s[:n]` and `s[n:]` split the ribbon cleanly, and `len(s[a:b])` is `b - a`. A slice of a list is always a **new list**, not a window." },
        { kind: 'code', code: `s = "XAUUSD-SPOT"
s[:3], s[3:6], s[-4:]       # ('XAU', 'USD', 'SPOT')
s[::2]                      # every second character
s[::-1]                     # reversed

closes = [1, 2, 3, 4, 5]
closes[1:3] = [20, 30, 40]  # slice assignment can change the length: [1, 20, 30, 40, 4, 5]
del closes[::2]             # delete every second element

LAST_WEEK = slice(-5, None) # name a slice
closes[LAST_WEEK]` },
        { kind: 'stepper', title: 'Step through: a board made with *', code: [
          'board = [["_"] * 3] * 3',
          'board[1][2] = "X"',
          'print(board)',
          'board = [["_"] * 3 for _ in range(3)]',
          'board[1][2] = "X"',
        ], steps: [
          { line: 1, note: '`["_"] * 3` makes one row. Then `* 3` makes a list with **three references to that same row**.', memory: [{ name: 'board', value: '[ref→row, ref→row, ref→row]', kind: 'ptr' }, { name: 'row (one object)', value: "['_', '_', '_']", kind: 'heap' }] },
          { line: 2, note: 'Writing through `board[1]` writes to the one shared row.', memory: [{ name: 'board', value: '[ref→row, ref→row, ref→row]', kind: 'ptr' }, { name: 'row (one object)', value: "['_', '_', 'X']", kind: 'heap' }] },
          { line: 3, note: "Prints `[['_', '_', 'X'], ['_', '_', 'X'], ['_', '_', 'X']]`. Every row \"changed\".", memory: [{ name: 'output', value: "[['_','_','X'], ['_','_','X'], ['_','_','X']]" }] },
          { line: 4, note: 'A comprehension runs the expression **three times**, building three separate rows.', memory: [{ name: 'board', value: '[ref→r0, ref→r1, ref→r2]', kind: 'ptr' }, { name: 'r0', value: "['_','_','_']", kind: 'heap' }, { name: 'r1', value: "['_','_','_']", kind: 'heap' }, { name: 'r2', value: "['_','_','_']", kind: 'heap' }] },
          { line: 5, note: 'Only row 1 changes. Correct.', memory: [{ name: 'r0', value: "['_','_','_']", kind: 'heap' }, { name: 'r1', value: "['_','_','X']", kind: 'heap' }, { name: 'r2', value: "['_','_','_']", kind: 'heap' }] },
        ] },
        { kind: 'pitfall', text: 'The famous puzzle `t = (1, 2, [30, 40]); t[2] += [50, 60]` both **raises** TypeError (tuples don\'t support item assignment) **and** changes the list to `[30, 40, 50, 60]`. The `+=` extends the list in place, then the assignment back into the tuple fails. Avoid putting mutable items in tuples you treat as values.' },
        { kind: 'check', q: 'What does `[[0] * 2] * 2` produce after `m[0][0] = 1`?', options: ['[[1, 0], [0, 0]]', '[[1, 0], [1, 0]]', '[[1, 1], [0, 0]]', 'TypeError'], answer: 1, hint: 'How many inner lists exist?', explain: 'The outer `* 2` copies the reference, so both rows are the same list.' },
      ],
    },
    {
      id: 'sorting',
      title: 'Sorting & when a list is wrong',
      blocks: [
        { kind: 'analogy', text: "`list.sort()` tidies your own drawer in place and hands back nothing (None), so you can't mistake it for a new drawer. `sorted()` photocopies the contents and gives you a tidy copy. For other jobs, use another container: a deque for queues, an array for numbers, NumPy for maths." },
        { kind: 'code', code: `trades.sort(key=lambda t: t.px)            # in place, returns None
top = sorted(trades, key=lambda t: t.px, reverse=True)[:5]   # new list
by_sym_px = sorted(trades, key=lambda t: (t.sym, -t.px))   # multi-key via tuples

import bisect
levels = [2380, 2385, 2390, 2395]
bisect.bisect_left(levels, 2391)            # 3: insertion point, O(log n)
bisect.insort(levels, 2391)                 # insert keeping order

from collections import deque
window = deque(maxlen=20)                   # rolling window: appends drop the oldest
for px in feed: window.append(px)

from itertools import batched
for batch in batched(orders, 100): send(batch)    # 3.12: tuples of up to 100` },
        { kind: 'list', items: [
          'Python\'s sort (Timsort, using Powersort\'s merge policy since 3.11) is **stable**, so you can sort by secondary key first, then primary.',
          'A list is fast at the end (append/pop) but O(n) at the front. Use `deque` for FIFO queues.',
          'For numeric work at scale, NumPy arrays beat lists by orders of magnitude: contiguous memory and vectorised C loops.',
          '`memoryview` gives zero-copy slices of bytes-like data, which is useful for binary protocols.',
        ] },
        { kind: 'check', q: 'What does `x = mylist.sort()` leave in x?', options: ['The sorted list', 'None', 'A copy', 'An iterator'], answer: 1, hint: 'In-place operations deliberately return…', explain: 'Methods that change an object in place return None by convention. Use `sorted()` for a new list.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is the difference between list and array.array("d")?', options: ['None', 'list holds references to objects; array stores raw doubles contiguously', 'array is immutable', 'list is faster for maths'], answer: 1, explain: 'array is much more compact for homogeneous numbers.' },
    { q: 'What does a generator expression do?', options: ['Builds a list immediately', 'Produces values lazily, one at a time', 'Runs in parallel', 'Caches results'], answer: 1, explain: 'Use it when you only iterate once.' },
    { q: 'What makes `(42,)` a tuple?', options: ['The parentheses', 'The trailing comma', 'The integer', 'Nothing: it is a syntax error'], answer: 1, explain: '`(42)` is just 42.' },
    { q: 'What does `first, *rest = "abc"` give?', options: ['first="a", rest="bc"', "first='a', rest=['b', 'c']", 'Error', "first='abc'"], answer: 1, explain: 'Starred targets always collect into a list.' },
    { q: 'Do sequence patterns in `match` match strings?', options: ['Yes', 'No: str, bytes and bytearray are excluded', 'Only single characters', 'Only with `str(...)`'], answer: 1, explain: 'That avoids accidentally matching characters.' },
    { q: 'What is wrong with `[[]] * 3`?', options: ['Syntax error', 'All three elements are the same list object', 'It creates 9 lists', 'Nothing'], answer: 1, explain: 'Use `[[] for _ in range(3)]`.' },
    { q: 'What does `list.sort()` return?', options: ['The sorted list', 'None', 'A new list', 'True'], answer: 1, explain: 'It sorts in place.' },
    { q: 'Which container is best for a FIFO queue?', options: ['list with pop(0)', 'collections.deque', 'tuple', 'array'], answer: 1, explain: '`deque.popleft()` is O(1); `list.pop(0)` is O(n).' },
  ],
}
