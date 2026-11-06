import type { Module } from '../types'

export const p25: Module = {
  n: 25,
  title: 'NumPy: Arrays & Broadcasting',
  tour: 'Added · NumPy arrays',
  summary: 'The ndarray: one block of typed memory with a shape. Creating arrays, dtypes, indexing and slicing (views!), boolean masks, broadcasting, and reshaping.',
  topics: ['Why NumPy', 'Creating arrays & dtypes', 'Indexing, slicing & views', 'Boolean masks & fancy indexing', 'Broadcasting', 'Reshaping & axes'],
  cpp23: [
    'This module targets NumPy 2.5. NumPy 2.0 (2024) was the first major version in 18 years.',
    'NumPy 2 type promotion (NEP 50): `np.float32(3) + 3.0` stays float32; Python scalars no longer upcast arrays.',
    'Cleaned-up namespace: many aliases (`np.float_`, `np.NaN`…) were removed in 2.0. Use `np.float64`, `np.nan`.',
    'A new `StringDType` for variable-length strings (2.0).',
  ],
  lessons: [
    {
      id: 'why',
      title: 'Why NumPy',
      blocks: [
        { kind: 'analogy', text: "A Python list of a million prices is a million separate parcels scattered around a warehouse, each with its own label and wrapping. A NumPy array is one long shelf of identical, unlabelled boxes packed side by side. The shelf takes a fraction of the space, and a forklift (a C loop, often SIMD) can sweep the whole shelf in one pass." },
        { kind: 'code', code: `import numpy as np

closes = np.array([2385.0, 2396.2, 2381.4, 2390.5, 2402.1])
rets = closes[1:] / closes[:-1] - 1          # whole-array maths: no Python loop
vol = rets.std(ddof=1) * np.sqrt(252)        # annualised volatility

# The same with lists needs an explicit loop:
rets_list = [b / a - 1 for a, b in zip(closes_list, closes_list[1:])]

# Speed (1,000,000 elements, typical laptop):
#   sum(list_of_floats)     ~ 5 ms
#   np_array.sum()          ~ 0.3 ms` },
        { kind: 'list', items: [
          '**One dtype, contiguous memory**: every element has the same type and size, stored back to back, like a C array or `std::vector<double>`.',
          '**Vectorisation**: operations run in compiled C loops over the whole array instead of the Python interpreter stepping through elements.',
          'NumPy is the foundation of pandas, scikit-learn, SciPy and (conceptually) PyTorch tensors. Everything in the ML courses builds on this module.',
        ] },
        { kind: 'compare',
          ts: `// No standard numeric array type with vector maths;
// Float64Array gives the memory layout, not the operations
const closes = Float64Array.from([2385, 2396.2, 2381.4])
const rets = closes.slice(1).map((b, i) => b / closes[i] - 1)`,
          go: `closes := []float64{2385, 2396.2, 2381.4}
rets := make([]float64, len(closes)-1)
for i := 1; i < len(closes); i++ {
    rets[i-1] = closes[i]/closes[i-1] - 1    // explicit loop (gonum for more)
}`,
          java: `double[] closes = {2385, 2396.2, 2381.4};
double[] rets = IntStream.range(1, closes.length)
    .mapToDouble(i -> closes[i] / closes[i - 1] - 1).toArray();`,
          cpp: `Eigen::ArrayXd closes(3);
closes << 2385, 2396.2, 2381.4;
Eigen::ArrayXd rets = closes.tail(2) / closes.head(2) - 1;   // vectorised, like NumPy`,
          python: `closes = np.array([2385, 2396.2, 2381.4])
rets = closes[1:] / closes[:-1] - 1`,
          note: 'NumPy is Python\'s answer to Eigen: array expressions that compile down to tight loops, written at the level of the maths.' },
        { kind: 'check', q: 'Why is `arr.sum()` so much faster than `sum(list)` for a million floats?', options: ['NumPy caches results', 'The loop runs in compiled C over contiguous typed memory, not in the Python interpreter over boxed objects', 'NumPy uses the GPU', 'Lists are sorted first'], answer: 1, hint: 'One shelf of identical boxes vs a million wrapped parcels.', explain: 'No per-element interpreter overhead, no pointer chasing, and the CPU can use SIMD.' },
      ],
    },
    {
      id: 'create',
      title: 'Creating arrays & dtypes',
      blocks: [
        { kind: 'analogy', text: "The dtype is the size and shape of every box on the shelf: 8-byte floats, 4-byte ints, 1-byte booleans. Choose the box once, when you build the shelf. Putting a value that doesn't fit into a box silently converts it, which is fast but can quietly lose information." },
        { kind: 'code', code: `np.array([1, 2, 3])                 # int64
np.array([1, 2, 3.5])                # float64: upcast to fit all
np.zeros((3, 4)); np.ones(5); np.full((2, 2), np.nan)
np.arange(0, 1, 0.25)                # [0.   0.25 0.5  0.75]
np.linspace(0, 1, 5)                 # [0.   0.25 0.5  0.75 1.  ] (includes the end)
np.eye(3)                            # identity matrix

a = np.zeros((3, 4), dtype=np.float32)
a.shape, a.ndim, a.size, a.dtype, a.nbytes   # ((3, 4), 2, 12, dtype('float32'), 48)

prices = np.array([2390.5, 2391.0])
prices.astype(np.int32)              # array([2390, 2391]): truncates, no warning

rng = np.random.default_rng(42)      # the modern random API (seeded, reproducible)
rng.normal(0, 0.01, size=(252,))     # a year of daily returns
rng.integers(1, 7, size=10)          # dice rolls` },
        { kind: 'list', items: [
          'Prefer `np.random.default_rng(seed)` over the legacy `np.random.seed` / `np.random.rand`. Each generator is independent and reproducible.',
          '`float32` halves memory and is what GPUs and deep learning prefer; `float64` is the default for numerical accuracy.',
          '`np.nan` only exists for floats. An integer array can\'t hold a missing value, which is why pandas converts int columns with gaps to float.',
        ] },
        { kind: 'new23', text: 'NumPy 2\'s type promotion rules (NEP 50) mean Python scalars no longer upcast arrays: `np.array([1, 2], dtype=np.float32) * 2.5` stays float32, and `np.uint8(250) + 10` now overflows to 4 with a warning instead of silently becoming a bigger int. Code written for NumPy 1.x can change results subtly here.' },
        { kind: 'check', q: 'What is `np.array([1, 2, 3.5]).dtype`?', options: ['int64', 'float64', 'object', 'mixed'], answer: 1, hint: 'One box size must fit every value.', explain: 'NumPy picks a common dtype that can hold all elements, so the ints are upcast to float64.' },
      ],
    },
    {
      id: 'views',
      title: 'Indexing, slicing & views',
      blocks: [
        { kind: 'analogy', text: "Slicing a NumPy array doesn't copy the shelf. It hands you a **window** onto part of it: a view. Paint through the window and the original shelf changes. That is the opposite of Python lists, where slices are copies, and it is the single most common NumPy surprise." },
        { kind: 'stepper', title: 'Step through: a slice is a view', code: [
          'a = np.arange(6)            # [0 1 2 3 4 5]',
          'w = a[1:4]                  # a view',
          'w[0] = 99',
          'print(a)',
          'c = a[1:4].copy()           # an independent copy',
          'c[0] = -1',
        ], steps: [
          { line: 1, note: 'One block of six int64s.', memory: [{ name: 'a', value: 'view → buf, offset 0, shape (6,)', kind: 'ptr' }, { name: 'buf', value: '[0 1 2 3 4 5]', kind: 'heap' }] },
          { line: 2, note: '`w` is a new array **object** pointing into the **same buffer**, starting at element 1.', memory: [{ name: 'a', value: 'view → buf, offset 0, shape (6,)', kind: 'ptr' }, { name: 'w', value: 'view → buf, offset 1, shape (3,)', kind: 'ptr' }, { name: 'buf', value: '[0 1 2 3 4 5]', kind: 'heap' }] },
          { line: 3, note: 'Writing through `w` writes into the shared buffer.', memory: [{ name: 'buf', value: '[0 99 2 3 4 5]', kind: 'heap', note: 'a sees this' }] },
          { line: 4, note: 'Prints `[ 0 99  2  3  4  5]`.', memory: [{ name: 'output', value: '[ 0 99  2  3  4  5]' }] },
          { line: 5, note: '`.copy()` allocates a new buffer.', memory: [{ name: 'buf', value: '[0 99 2 3 4 5]', kind: 'heap' }, { name: 'c', value: 'owns buf2', kind: 'ptr' }, { name: 'buf2', value: '[99 2 3]', kind: 'heap' }] },
          { line: 6, note: 'Only the copy changes.', memory: [{ name: 'buf', value: '[0 99 2 3 4 5]', kind: 'heap', note: 'a: unchanged' }, { name: 'buf2', value: '[-1 2 3]', kind: 'heap' }] },
        ] },
        { kind: 'code', code: `m = np.arange(12).reshape(3, 4)
m[1, 2]            # 6: row 1, column 2 (one index tuple, not m[1][2])
m[:, 0]            # first column: [0 4 8]
m[-1]              # last row
m[::2, ::2]        # every other row and column (still a view)
np.shares_memory(m, m[:, 0])   # True` },
        { kind: 'check', q: 'After `b = a[2:5]; b[:] = 0`, what happens to a?', options: ['Nothing: b is a copy', 'a[2:5] becomes 0', 'a is entirely zeroed', 'Error'], answer: 1, hint: 'Window or photocopy?', explain: 'Basic slices are views; writing through them modifies the original array.' },
      ],
    },
    {
      id: 'masks',
      title: 'Boolean masks & fancy indexing',
      blocks: [
        { kind: 'analogy', text: "A boolean mask is a stencil of True/False holes laid over the shelf: only the boxes under the holes come through. You build the stencil with a comparison (`rets > 0`) and use it to select, count or overwrite, with no loop in sight." },
        { kind: 'code', code: `rets = np.array([0.012, -0.004, 0.0, 0.021, -0.017])
up = rets > 0                    # array([ True, False, False,  True, False])
rets[up]                         # array([0.012, 0.021]): a COPY
up.sum(), up.mean()              # (2, 0.4): count and win rate
rets[rets < -0.01] = -0.01       # clip losses in place via a mask

both = (rets > 0) & (np.abs(rets) < 0.02)   # use & | ~ with parentheses, not and/or
np.where(rets > 0, 1, -1)        # element-wise if/else: [ 1 -1 -1  1 -1]

idx = np.array([4, 0, 2])
rets[idx]                        # fancy indexing with an index array: a COPY
order = np.argsort(rets)         # indices that would sort the array
rets[order[-3:]]                 # three largest returns` },
        { kind: 'pitfall', text: '`if rets > 0:` raises "The truth value of an array with more than one element is ambiguous". Python\'s `and`, `or` and `not` need a single bool. Use `&`, `|`, `~` element-wise (with parentheses, because they bind tightly) or `.any()` / `.all()` to reduce.' },
        { kind: 'check', q: 'Is `rets[rets > 0]` a view or a copy?', options: ['View', 'Copy', 'Depends on dtype', 'Neither: it is a mask'], answer: 1, hint: 'Can the selected elements be described as one regular stride over the buffer?', explain: 'Boolean and integer-array ("fancy") indexing produce copies. Only basic slices are views. Assignment through a mask (`a[mask] = x`) still writes to the original.' },
      ],
    },
    {
      id: 'broadcasting',
      title: 'Broadcasting & reshaping',
      blocks: [
        { kind: 'analogy', text: "Broadcasting is how NumPy combines arrays of different shapes without copying: a single row is \"stretched\" down every row of a matrix, as if you'd photocopied it, but nothing is actually copied. The rule: compare shapes from the right; each pair of dimensions must be equal, or one of them must be 1." },
        { kind: 'code', code: `prices = np.array([[2390.5, 28.1, 980.0],      # 2 days × 3 assets
                   [2401.0, 28.4, 975.5]])
qty = np.array([10, 500, 3])                   # shape (3,)
value = prices * qty                           # (2,3) * (3,) → (2,3): qty broadcast per row
value.sum(axis=1)                              # portfolio value per day: shape (2,)

# Demean each column (asset): subtract a (3,) row of means from every row
centred = prices - prices.mean(axis=0)

# Normalise each row: needs a column vector of shape (2, 1)
row_tot = prices.sum(axis=1, keepdims=True)    # (2, 1)
weights = prices / row_tot

x = np.arange(6)
x.reshape(2, 3); x.reshape(-1, 1)              # -1 = "work it out"
x[:, None]                                     # same as reshape(-1, 1): add an axis
x[None, :] - x[:, None]                        # (1,6) - (6,1) → (6,6) pairwise differences
m.T; m.ravel(); np.stack([a, b]); np.concatenate([a, b])` },
        { kind: 'list', items: [
          '`axis=0` means "down the rows" (collapse rows, one result per column); `axis=1` means "across columns" (one result per row).',
          '`keepdims=True` keeps the reduced axis with length 1, so the result broadcasts straight back against the original.',
          'Broadcasting `(n,1)` against `(1,n)` builds an n×n grid. That is powerful (distance matrices) but watch memory for large n.',
        ] },
        { kind: 'check', q: 'Do shapes (4, 3) and (4,) broadcast together?', options: ['Yes, to (4, 3)', 'No: trailing dimensions 3 and 4 don\'t match', 'Yes, to (4, 4)', 'Only with keepdims'], answer: 1, hint: 'Line the shapes up from the right.', explain: 'Compare 3 with 4: neither is 1, so it fails. Reshape to (4, 1) to broadcast down the rows.' },
      ],
    },
  ],
  quiz: [
    { q: 'What makes a NumPy array fast?', options: ['It uses Python lists internally', 'One dtype in contiguous memory, processed by compiled loops', 'Multithreading always', 'Lazy evaluation'], answer: 1, explain: 'That is vectorisation.' },
    { q: 'Basic slicing `a[1:4]` returns…', options: ['A copy', 'A view sharing memory', 'A list', 'A mask'], answer: 1, explain: 'Use `.copy()` for independence.' },
    { q: 'Boolean indexing `a[a > 0]` returns…', options: ['A view', 'A copy', 'A boolean array', 'The count'], answer: 1, explain: 'Fancy and boolean indexing copy.' },
    { q: 'How do you combine two element-wise conditions?', options: ['`a > 0 and a < 5`', '`(a > 0) & (a < 5)`', '`a > 0 && a < 5`', '`all(a > 0, a < 5)`'], answer: 1, explain: 'Python\'s `and` needs single booleans.' },
    { q: 'What does `prices.mean(axis=0)` compute for a (days × assets) array?', options: ['Mean per day', 'Mean per asset (down the rows)', 'Overall mean', 'Rolling mean'], answer: 1, explain: 'axis=0 collapses the rows.' },
    { q: 'Which shapes broadcast?', options: ['(5, 3) and (5,)', '(5, 3) and (3,)', '(5, 3) and (2,)', '(5, 3) and (3, 5)'], answer: 1, explain: 'Trailing dims must match or be 1.' },
    { q: 'What is the modern way to generate random numbers?', options: ['`np.random.seed(0); np.random.rand()`', '`rng = np.random.default_rng(0); rng.random()`', '`random.random()`', '`np.rand()`'], answer: 1, explain: 'Independent, reproducible generators.' },
    { q: 'In NumPy 2, what is `(np.array([1.0], dtype=np.float32) * 2.5).dtype`?', options: ['float64', 'float32', 'object', 'float16'], answer: 1, explain: 'NEP 50: Python scalars don\'t upcast arrays.' },
  ],
}
