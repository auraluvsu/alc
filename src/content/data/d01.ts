import type { Module } from '../types'

export const d01: Module = {
  n: 1,
  title: 'pandas Fundamentals: Series & DataFrames',
  tour: '5 · Getting Started with pandas',
  summary: 'The two core types: a Series is a labelled column, a DataFrame is a table of aligned columns sharing an index. Construction, the index, dtypes, and how pandas 3 handles copies.',
  topics: ['Series', 'DataFrame', 'The index', 'dtypes', 'Copy-on-Write'],
  cpp23: [
    'This course targets pandas 3.1. The book (3rd ed.) uses pandas 1.4.',
    'pandas 3.0: Copy-on-Write is always on, so every indexing result behaves like a copy and chained assignment never modifies the original.',
    'pandas 3.0: text columns get a dedicated `str` dtype instead of `object`, and `pd.col("x")` builds column expressions for `assign` and friends.',
  ],
  lessons: [
    {
      id: 'series',
      title: 'Series: a labelled column',
      blocks: [
        { kind: 'analogy', text: "A NumPy array is a numbered row of boxes. A Series is the same row of boxes with a name tag on each box (the index). Most of what makes pandas pandas follows from those tags: you look values up by tag, and when two Series meet, boxes with the same tag are paired up automatically, whatever position they're in." },
        { kind: 'code', code: `import pandas as pd
import numpy as np

px = pd.Series([2385.0, 2396.2, 2381.4], index=["Mon", "Tue", "Wed"], name="XAUUSD")
px["Tue"]            # 2396.2: by label
px.iloc[0]           # 2385.0: by position
px.values            # the underlying array (prefer px.to_numpy())
px.index             # Index(['Mon', 'Tue', 'Wed'], dtype='str')
px[px > 2390]        # boolean masks work as in NumPy
px.pct_change()      # NaN, 0.004696, -0.006176: returns in one call

pd.Series({"AAPL": 10, "MSFT": 5})   # a dict becomes index → value` },
        { kind: 'compare',
          python: `qty = pd.Series({"AAPL": 10, "MSFT": 5})
px  = pd.Series({"MSFT": 410.0, "AAPL": 190.0})
qty * px     # aligned by label: AAPL 1900, MSFT 2050`,
          ts: `// No built-in equivalent: you'd join two Record<string, number> objects by key yourself.
const value = Object.fromEntries(Object.keys(qty).map(k => [k, qty[k] * px[k]]))`,
          go: `// Two map[string]float64 joined by key by hand.
for k, q := range qty { value[k] = q * px[k] }`,
          java: `// Map<String, Double> joined manually, or a library like Tablesaw.
qty.forEach((k, q) -> value.put(k, q * px.get(k)));`,
          cpp: `// std::unordered_map joined by key, or a dataframe library (e.g. Arrow C++ compute).
for (auto& [k, q] : qty) value[k] = q * px.at(k);`,
          note: 'Label alignment is the thing other languages make you write by hand.' },
        { kind: 'check', q: 'You multiply two Series whose indexes contain the same labels in a different order. What happens?', options: ['Values are multiplied position by position', 'Values are matched by label before multiplying', 'A ValueError', 'The result is sorted then multiplied'], answer: 1, hint: 'The name tags, not the box numbers.', explain: 'Arithmetic aligns on the index. Labels present in only one side become NaN.' },
      ],
    },
    {
      id: 'dataframe',
      title: 'DataFrames: aligned columns',
      blocks: [
        { kind: 'analogy', text: "A DataFrame is a filing cabinet where every drawer (column) is a Series, and all the drawers share the same row labels. Each drawer can hold a different kind of thing (prices as floats, symbols as text, dates as timestamps), but row \"2026-03-02\" means the same day in every drawer." },
        { kind: 'code', code: `df = pd.DataFrame({
    "sym":   ["XAU", "XAU", "XAG", "XAG"],
    "date":  pd.to_datetime(["2026-03-02", "2026-03-03"] * 2),
    "close": [2385.0, 2396.2, 28.41, 28.77],
    "vol":   [182_000, 175_500, 51_200, 49_800],
})
df.shape                 # (4, 4)
df.dtypes                # sym: str, date: datetime64[us], close: float64, vol: int64
df.head(2); df.tail(1); df.info(); df.describe()

df["close"]              # one column → Series
df[["sym", "close"]]     # list of columns → DataFrame
df["notional"] = df["close"] * df["vol"]        # new column, vectorised
df = df.assign(ret=df.groupby("sym")["close"].pct_change())  # assign returns a new frame
df = df.set_index(["sym", "date"])              # a two-level (MultiIndex) row index` },
        { kind: 'list', items: [
          '`df[col]` selects columns. Rows are selected with `.loc` (labels) and `.iloc` (positions), which is module 2.',
          'Columns are Series, so everything from the last lesson works on each one.',
          '`describe()` and `info()` are the first two things to run on any new dataset.',
        ] },
        { kind: 'check', q: 'What does `df[["close"]]` (double brackets) return?', options: ['A Series', 'A one-column DataFrame', 'A NumPy array', 'A scalar'], answer: 1, hint: 'A list of column names.', explain: 'A list of names always returns a DataFrame, even with one name; a single name returns a Series.' },
      ],
    },
    {
      id: 'index',
      title: 'The index',
      blocks: [
        { kind: 'analogy', text: "The index is the spine of a book: it isn't the content, but it's how you find things and how two books get lined up page for page. Choosing a good index (dates for a time series, a symbol plus date for a panel) makes later lookups, joins and resampling almost free." },
        { kind: 'code', code: `prices = pd.DataFrame(
    {"XAU": [2385.0, 2396.2, 2381.4], "XAG": [28.41, 28.77, 28.30]},
    index=pd.date_range("2026-03-02", periods=3, freq="B"),   # business days
)
prices.index                       # DatetimeIndex([...], dtype='datetime64[us]', freq='B')
prices.loc["2026-03-03"]           # one row, as a Series
prices.loc["2026-03"]              # partial-string indexing: all of March
prices.reset_index()               # move the index back into a column
prices.rename_axis("date")

rets = prices.pct_change().dropna()
rets.index.is_unique, rets.index.is_monotonic_increasing   # check before time-series work` },
        { kind: 'pitfall', text: 'Duplicate index labels are allowed, and they make `.loc` return several rows where you expected one. After loading data, check `df.index.is_unique` (and sort with `sort_index()`) before doing anything time-based.' },
        { kind: 'check', q: 'Why use a DatetimeIndex for a price series rather than a date column?', options: ['It uses less memory', 'Lookups by date strings, alignment between series, and resampling all work on the index', 'Columns can\'t hold dates', 'It sorts the data'], answer: 1, hint: 'What does alignment use?', explain: 'Alignment, `.loc["2026-03"]`, `resample` and `rolling("30D")` all key off the index.' },
      ],
    },
    {
      id: 'dtypes',
      title: 'dtypes & missing values',
      blocks: [
        { kind: 'analogy', text: "Each column has a single declared type, like a typed slice in Go or a column in a SQL table. Choose well and the column is a compact block of machine numbers; let pandas fall back to generic Python objects and every operation becomes a slow walk through boxed values." },
        { kind: 'code', code: `df = pd.DataFrame({"sym": ["XAU", "XAG", None], "qty": [1, 2, 3]})
df.dtypes                         # sym: str (pandas 3), qty: int64
df["sym"].isna()                  # False, False, True

df["qty"] = df["qty"].astype("int32")
df["sym"] = df["sym"].astype("category")       # few distinct values → small integer codes
pd.Series([1, None]).dtype        # float64: an int column with a gap becomes float (NaN is a float)
pd.Series([1, None], dtype="Int64")   # nullable integer: [1, <NA>]

pd.read_csv("ticks.csv", dtype_backend="pyarrow")   # Arrow-backed dtypes throughout` },
        { kind: 'new23', text: 'pandas 3 infers a proper `str` dtype for text (Arrow-backed when pyarrow is installed) instead of the old catch-all `object`. String operations are faster and the column can only hold strings or missing values.' },
        { kind: 'pitfall', text: 'Integer columns can\'t hold `NaN` in the classic NumPy dtypes, so one missing value silently turns a whole column into floats. If exact integers matter (IDs, share counts), use the nullable `"Int64"` dtype.' },
        { kind: 'check', q: '`pd.Series([10, None, 30]).dtype` is…', options: ['int64', 'float64', 'object', 'Int64'], answer: 1, hint: 'NaN is a float value.', explain: 'Missing values force classic integer data to float64. Ask for `dtype="Int64"` to keep integers.' },
      ],
    },
    {
      id: 'cow',
      title: 'Copy-on-Write',
      blocks: [
        { kind: 'analogy', text: "Under Copy-on-Write, every selection hands you what behaves like a photocopy. pandas is lazy about it: the photocopy shares the original's pages until somebody writes on one, and only then is a real copy made. The rule for you is simple: changing a selection never changes the frame it came from." },
        { kind: 'code', code: `df = pd.DataFrame({"a": [1, 2, 3], "b": [4.0, 5.0, 6.0]})

sub = df[df["a"] > 1]
sub["b"] = 0.0                     # changes sub only; df is untouched (no warning needed)

df["a"][0] = 100                   # chained assignment: does NOTHING in pandas 3
                                   # (ChainedAssignmentError warning)
df.loc[0, "a"] = 100               # the right way: one .loc call on the frame you mean to change

col = df["b"]                      # cheap: shares memory until written to
col.iloc[0] = -1.0                 # now col copies; df["b"] is unchanged` },
        { kind: 'new23', text: 'Copy-on-Write is the default and only mode in pandas 3. The old `SettingWithCopyWarning` (and its guessing game about views and copies) is gone. Code that relied on chained assignment to modify a frame silently stops working, so search old notebooks for `df[...][...] =`.' },
        { kind: 'check', q: 'In pandas 3, what does `df["price"][df["price"] < 0] = 0` do to `df`?', options: ['Clips negative prices to 0', 'Nothing: it\'s chained assignment', 'Raises a KeyError', 'Deletes those rows'], answer: 1, hint: 'Two indexing steps, then an assignment.', explain: 'Write it as one call: `df.loc[df["price"] < 0, "price"] = 0`.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is a Series?', options: ['A 2-D table', 'A 1-D array with an index of labels', 'A Python list', 'A database cursor'], answer: 1, explain: 'A DataFrame is a set of Series sharing an index.' },
    { q: '`s + t` where t lacks some of s\'s labels gives…', options: ['An error', 'NaN for unmatched labels', 'Zeros', 'Only shared labels, dropping the rest'], answer: 1, explain: 'Use `s.add(t, fill_value=0)` to treat missing as 0.' },
    { q: 'How do you select two columns as a DataFrame?', options: ['df["a", "b"]', 'df[["a", "b"]]', 'df.a.b', 'df.cols("a", "b")'], answer: 1, explain: 'A list of names.' },
    { q: 'Which call answers "is this index safe for time-series work?"', options: ['df.describe()', 'df.index.is_unique and is_monotonic_increasing', 'df.dtypes', 'df.shape'], answer: 1, explain: 'Duplicates and disorder break lookups and resampling.' },
    { q: 'What is the default dtype for text columns in pandas 3?', options: ['object', 'str (a dedicated string dtype)', 'category', 'bytes'], answer: 1, explain: 'It replaces the catch-all `object`.' },
    { q: 'Which dtype keeps integers while allowing missing values?', options: ['int64', 'Int64 (nullable)', 'float64', 'object'], answer: 1, explain: 'Classic int64 becomes float64 when NaN appears.' },
    { q: 'Under Copy-on-Write, modifying a selection…', options: ['Modifies the original', 'Never modifies the original frame', 'Raises an error', 'Depends on whether it was a view'], answer: 1, explain: 'That uncertainty is exactly what CoW removed.' },
    { q: 'What is the right way to set values conditionally?', options: ['df["a"][mask] = 0', 'df.loc[mask, "a"] = 0', 'df.a[mask] = 0', 'df[mask]["a"] = 0'], answer: 1, explain: 'A single `.loc` call on the frame.' },
  ],
}
