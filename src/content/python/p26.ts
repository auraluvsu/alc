import type { Module } from '../types'

export const p26: Module = {
  n: 26,
  title: 'NumPy: Vectorised Computing',
  tour: 'Added · NumPy computing',
  summary: 'Universal functions, reductions and cumulative operations, linear algebra, vectorising a loop, memory layout and strides, and when NumPy isn\'t enough.',
  topics: ['ufuncs', 'Reductions & cumulative ops', 'Linear algebra', 'Vectorising loops', 'Memory layout & strides', 'Beyond NumPy'],
  cpp23: [
    '`np.linalg` and `@` work on stacks of matrices (batched), the same convention PyTorch uses.',
    'NumPy 2 supports the Python array API standard, so code can run on CuPy, PyTorch or JAX arrays with few changes.',
    'Free-threaded Python builds of NumPy are available, so threads can run NumPy code truly in parallel.',
  ],
  lessons: [
    {
      id: 'ufuncs',
      title: 'Universal functions',
      blocks: [
        { kind: 'analogy', text: "A ufunc is a stamping machine that applies one operation to every box on the shelf in a single pass: `np.log`, `np.exp`, `+`, `>`. Arithmetic operators on arrays are ufuncs in disguise, so `a + b` and `np.add(a, b)` are the same machine." },
        { kind: 'code', code: `closes = np.array([2385.0, 2396.2, 2381.4, 2390.5, 2402.1])
log_rets = np.diff(np.log(closes))          # log returns: additive over time
np.exp(log_rets.sum()) - 1                  # total return

np.maximum(closes, 2390)                    # element-wise max (vs np.max, a reduction)
np.clip(rets, -0.02, 0.02)                  # winsorise
np.round(closes, 1); np.abs(rets); np.sqrt(var)
np.isnan(x); np.nan_to_num(x); np.isclose(a, b)   # never compare floats with ==

out = np.empty_like(closes)
np.multiply(closes, 1.001, out=out)         # write into an existing buffer: no allocation` },
        { kind: 'list', items: [
          'Element-wise ufuncs (`np.maximum`) and reductions (`np.max`) are different things; mixing them up is a common bug.',
          '`out=` and in-place operators (`a *= 2`) avoid allocating temporaries in hot loops.',
          'Log returns are additive over time (sum them), and simple returns compound (multiply `1 + r`). Both appear constantly in quant code.',
        ] },
        { kind: 'check', q: 'What is the difference between `np.max(a)` and `np.maximum(a, b)`?', options: ['None', 'np.max reduces to the largest value; np.maximum compares two arrays element-wise', 'np.maximum is faster', 'np.max works only on 1-D'], answer: 1, hint: 'One returns a scalar (or smaller array), the other returns an array the same shape.', explain: 'Reductions collapse an axis; element-wise ufuncs keep the shape.' },
      ],
    },
    {
      id: 'reductions',
      title: 'Reductions & cumulative operations',
      blocks: [
        { kind: 'analogy', text: "A reduction squashes a whole row or column into one number (sum, mean, std). A cumulative operation is a running tally that keeps every intermediate value, like a bank statement's balance column. Together they compute most backtest statistics in a few lines." },
        { kind: 'code', code: `rng = np.random.default_rng(7)
rets = rng.normal(0.0004, 0.01, size=1000)          # daily returns

equity = np.cumprod(1 + rets)                       # equity curve
peak = np.maximum.accumulate(equity)                # running maximum
drawdown = equity / peak - 1
max_dd = drawdown.min()                             # worst peak-to-trough

sharpe = rets.mean() / rets.std(ddof=1) * np.sqrt(252)

window = 20
kernel = np.ones(window) / window
sma = np.convolve(closes, kernel, mode="valid")     # simple moving average
from numpy.lib.stride_tricks import sliding_window_view
win = sliding_window_view(closes, window)           # (n-19, 20) view, no copy
rolling_std = win.std(axis=1, ddof=1)

np.percentile(rets, 5)                              # 5% VaR threshold
np.corrcoef(asset_rets)                             # correlation matrix (rows = variables)` },
        { kind: 'pitfall', text: "`np.std` defaults to `ddof=0` (population standard deviation) while pandas defaults to `ddof=1` (sample). The same data gives slightly different volatilities in the two libraries unless you set `ddof` explicitly." },
        { kind: 'check', q: 'What does `np.maximum.accumulate(equity)` give you?', options: ['The single maximum', 'The running peak at each point in time', 'The sorted equity curve', 'Daily maxima'], answer: 1, hint: 'A ufunc\'s `.accumulate` keeps every intermediate result.', explain: 'Dividing equity by its running peak gives the drawdown series.' },
      ],
    },
    {
      id: 'linalg',
      title: 'Linear algebra',
      blocks: [
        { kind: 'analogy', text: "Linear algebra is spreadsheet arithmetic done one whole table at a time. `@` multiplies matrices; a portfolio's return is just a weights vector `@` a returns vector, and its risk is `w @ Σ @ w`. NumPy hands these to BLAS and LAPACK, decades-optimised Fortran and C." },
        { kind: 'code', code: `R = rng.normal(0.0005, 0.01, size=(252, 4))   # 252 days × 4 assets
w = np.array([0.4, 0.3, 0.2, 0.1])

port = R @ w                                    # (252,4) @ (4,) → (252,) daily portfolio returns
cov = np.cov(R, rowvar=False)                   # (4, 4) covariance of the columns
port_vol = np.sqrt(w @ cov @ w) * np.sqrt(252)  # annualised portfolio volatility

# Least squares: regress an asset on the market (beta)
X = np.column_stack([np.ones(252), R[:, 0]])    # intercept + market
beta = np.linalg.lstsq(X, R[:, 1], rcond=None)[0]

# Minimum-variance weights: solve, don't invert
ones = np.ones(4)
x = np.linalg.solve(cov, ones)
w_minvar = x / x.sum()

vals, vecs = np.linalg.eigh(cov)                # eigen-decomposition (symmetric): PCA of risk` },
        { kind: 'list', items: [
          'Use `np.linalg.solve(A, b)` rather than `np.linalg.inv(A) @ b`: it is faster and more numerically stable.',
          '`@` on 1-D arrays is a dot product; on 2-D it is matrix multiplication; on 3-D+ it multiplies stacks of matrices (batched), the same convention PyTorch uses.',
          '`*` is element-wise, never matrix multiplication. That is a frequent bug when porting from MATLAB.',
        ] },
        { kind: 'check', q: 'What does `R @ w` compute for R of shape (252, 4) and w of shape (4,)?', options: ['Element-wise product', 'Daily portfolio returns, shape (252,)', 'A (4, 4) matrix', 'An error'], answer: 1, hint: 'Each row (a day) dotted with the weights.', explain: 'Matrix-vector product: one weighted sum per day.' },
      ],
    },
    {
      id: 'vectorise',
      title: 'Vectorising a loop',
      blocks: [
        { kind: 'analogy', text: "Vectorising is replacing \"for each day, do this\" with \"do this to all days at once\". You stop describing the walk and describe the result. The hardest part is thinking in whole columns. Signals become boolean arrays, and \"yesterday\" becomes a shifted copy." },
        { kind: 'code', code: `# Loop version: moving-average crossover signal
def signal_loop(closes, fast=10, slow=50):
    out = np.zeros(len(closes))
    for t in range(slow, len(closes)):
        f = closes[t - fast:t].mean()
        s = closes[t - slow:t].mean()
        out[t] = 1 if f > s else -1
    return out

# Vectorised version
def sma(x, n):
    c = np.cumsum(np.insert(x, 0, 0.0))
    return (c[n:] - c[:-n]) / n                 # O(n) rolling mean via cumulative sums

def signal_vec(closes, fast=10, slow=50):
    f = sma(closes, fast)[slow - fast:-1]       # align: both end at t-1
    s = sma(closes, slow)[:-1]
    out = np.zeros(len(closes))
    out[slow:] = np.where(f > s, 1, -1)
    return out

# np.allclose(signal_loop(c), signal_vec(c)) → True, and ~100× faster

# Strategy returns: position decided yesterday, earned today (no look-ahead)
pos = signal_vec(closes)
strat = pos[:-1] * (closes[1:] / closes[:-1] - 1)` },
        { kind: 'pitfall', text: '**Look-ahead bias** is the classic backtest bug: using today\'s close to decide a trade that earns today\'s return. In vectorised code, shift positions by one period (`pos[:-1] * rets[1:]`) so every decision only uses information available beforehand.' },
        { kind: 'check', q: 'Why multiply `pos[:-1]` by returns starting at index 1?', options: ['To drop NaNs', 'So the position decided at t earns the return from t to t+1, avoiding look-ahead', 'For speed', 'To annualise'], answer: 1, hint: 'When was the decision made, and which price move does it get?', explain: 'Aligning yesterday\'s decision with today\'s return keeps the backtest honest.' },
      ],
    },
    {
      id: 'layout',
      title: 'Memory layout & beyond NumPy',
      blocks: [
        { kind: 'analogy', text: "A 2-D array is still one flat shelf; the shape and **strides** are instructions for finding element (i, j): \"jump this many bytes per row, that many per column\". Transposing just swaps the instructions, with no copying. But walking against the grain (column by column in a row-major array) makes the CPU fetch memory inefficiently." },
        { kind: 'code', code: `m = np.zeros((1000, 1000))         # C order (row-major) by default
m.strides                          # (8000, 8): next row = 8000 bytes, next column = 8 bytes
m.T.strides                        # (8, 8000): a view, no copy
m.flags["C_CONTIGUOUS"], m.T.flags["C_CONTIGUOUS"]   # (True, False)
np.ascontiguousarray(m.T)          # make a C-ordered copy when a library needs it

# Summing rows (contiguous) vs columns (strided) differs a lot on large arrays
m.sum(axis=1)                      # walks memory in order: fast
# for very large arrays, layout decides cache behaviour, same as in C++

# When NumPy alone isn't enough:
# - Numba:  @njit compiles Python loops that can't be vectorised (path-dependent logic)
# - pandas: labelled columns, time series, groupby       (Data Analytics course)
# - PyTorch / JAX / CuPy: the same ideas on GPUs, plus autograd   (next modules)
# - C++ (Eigen, xtensor) via pybind11/nanobind for custom kernels` },
        { kind: 'list', items: [
          'Some logic is inherently sequential (e.g. trailing stops that depend on the previous state). Don\'t contort it into NumPy; compile the loop with Numba or move it to C++.',
          'NumPy releases the GIL inside many operations, so threads can help for large arrays, and free-threaded Python builds go further.',
        ] },
        { kind: 'check', q: 'What does `m.T` cost for a 1000×1000 array?', options: ['Copies 8 MB', 'Almost nothing: it returns a view with swapped strides', 'Sorts the array', 'Allocates a new buffer lazily'], answer: 1, hint: 'Only the "how to walk the shelf" instructions change.', explain: 'Transposition is a stride trick. A copy happens only if you ask for contiguity.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is a ufunc?', options: ['A user-defined function', 'A function applied element-wise in compiled code (np.add, np.log…)', 'A reduction', 'A random generator'], answer: 1, explain: 'Operators on arrays dispatch to ufuncs.' },
    { q: 'How do you compute an equity curve from simple returns r?', options: ['`np.cumsum(r)`', '`np.cumprod(1 + r)`', '`np.prod(r)`', '`np.exp(r)`'], answer: 1, explain: 'Simple returns compound multiplicatively.' },
    { q: 'What is the default `ddof` of `np.std`?', options: ['0 (population)', '1 (sample)', '2', 'It depends on size'], answer: 0, explain: 'pandas defaults to 1; set it explicitly.' },
    { q: 'Better way to solve Ax = b?', options: ['`np.linalg.inv(A) @ b`', '`np.linalg.solve(A, b)`', '`A / b`', '`b @ A`'], answer: 1, explain: 'It is faster and more stable.' },
    { q: 'What does `*` do on two 2-D arrays?', options: ['Matrix multiplication', 'Element-wise multiplication', 'Dot product', 'Kronecker product'], answer: 1, explain: 'Use `@` for matrix multiplication.' },
    { q: 'What is look-ahead bias?', options: ['A NumPy warning', 'Using information that wasn\'t available at decision time', 'Slow code', 'Overfitting only'], answer: 1, explain: 'Shift positions by one period.' },
    { q: 'What are strides?', options: ['Step sizes in loops', 'Bytes to jump per dimension to reach the next element', 'Batch sizes', 'Chunk lengths'], answer: 1, explain: 'They let transposes and slices be views.' },
    { q: 'Path-dependent logic that can\'t be vectorised is best handled with…', options: ['A slower NumPy trick', 'Numba (or C++) compiling the loop', 'Recursion', 'pandas apply'], answer: 1, explain: 'Compiled loops are fast and clear.' },
  ],
}
