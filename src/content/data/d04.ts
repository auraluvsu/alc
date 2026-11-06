import type { Module } from '../types'

export const d04: Module = {
  n: 4,
  title: 'Data Cleaning & Preparation',
  tour: '7 · Data Cleaning and Preparation',
  summary: 'Most analysis time is cleaning. Missing data and how to fill it without peeking into the future, duplicates and bad ticks, mapping and replacing values, outliers and winsorising, vectorised string methods, and categorical data.',
  topics: ['Handling missing data', 'Duplicates & bad ticks', 'Transforming values', 'Outliers & winsorising', 'String methods', 'Categoricals'],
  cpp23: ['The `str` dtype makes `.str` methods faster and more predictable (3.0).', '`fillna(method=...)` is gone: use `.ffill()` / `.bfill()` (3.0).'],
  lessons: [
    {
      id: 'missing',
      title: 'Handling missing data',
      blocks: [
        { kind: 'analogy', text: "Missing values are gaps in a diary. You can tear out the incomplete pages (`dropna`), copy yesterday's entry forward (`ffill`), or write a reasonable guess (`fillna`, `interpolate`). Which is right depends on *why* the page is blank: a holiday, a broken feed, or a stock that hadn't listed yet each deserve different treatment." },
        { kind: 'code', code: `import pandas as pd, numpy as np

px = pd.DataFrame({
    "XAU": [2385.0, np.nan, 2381.4, 2390.5],
    "NEW": [np.nan, np.nan, 10.0, 10.2],          # listed on day 3
}, index=pd.date_range("2026-03-02", periods=4, freq="B"))

px.isna().sum()                  # missing per column: XAU 1, NEW 2
px.dropna()                      # rows complete in every column (2 rows)
px.dropna(how="all")             # drop only fully empty rows
px.ffill()                       # carry last value forward: OK for prices
px.ffill(limit=2)                # …but not across long outages
px["XAU"].interpolate()          # linear fill: 2383.2 (uses the NEXT value!)
px.fillna({"NEW": 0})            # per-column fill values` },
        { kind: 'pitfall', text: '`bfill()` and `interpolate()` use values from *later* dates. Fine for a chart, but in anything that feeds a backtest or model they leak the future. Prefer `ffill`, or leave NaN and let the model handle it.' },
        { kind: 'check', q: 'Which fill is safe from look-ahead for a backtest?', options: ['bfill', 'interpolate', 'ffill', 'fillna(mean of whole series)'], answer: 2, hint: 'Only uses the past.', explain: 'A full-sample mean also leaks future information.' },
      ],
    },
    {
      id: 'duplicates',
      title: 'Duplicates & bad ticks',
      blocks: [
        { kind: 'analogy', text: "Raw market data arrives like post after a strike: duplicates, things out of order, and the occasional obviously wrong letter (a price of 0, or one a hundred times too large). Sort it, de-duplicate it, and filter the impossible before you trust any statistic." },
        { kind: 'code', code: `ticks = pd.DataFrame({
    "time": pd.to_datetime(["09:00:00.1", "09:00:00.1", "09:00:00.3", "09:00:00.2", "09:00:00.4"],
                           format="%H:%M:%S.%f"),
    "px": [2385.1, 2385.1, 23.85, 2385.3, 2385.2],
    "size": [5, 5, 1, 2, 3],
})
ticks.duplicated().sum()                         # 1: an exact repeat
ticks = ticks.drop_duplicates().sort_values("time")

# Bad ticks: price far from a rolling median
med = ticks["px"].rolling(3, center=False, min_periods=1).median()
bad = (ticks["px"] / med - 1).abs() > 0.05       # >5% from recent median
ticks = ticks[~bad]                              # drops the 23.85 tick

ticks.duplicated(subset=["time"], keep="last")   # same timestamp: keep the latest` },
        { kind: 'check', q: 'Why use a trailing (not centred) rolling median to flag bad ticks in a backtest?', options: ['Speed', 'A centred window uses future ticks the live system wouldn\'t have', 'Centred windows don\'t exist', 'Medians must be trailing'], answer: 1, hint: 'Could you compute it live?', explain: 'Data cleaning must follow the same no-look-ahead rule as signals.' },
      ],
    },
    {
      id: 'transform',
      title: 'Transforming values',
      blocks: [
        { kind: 'analogy', text: "Most cleaning steps are dictionary lookups and buckets: map vendor codes to your names, replace sentinel values, and drop continuous numbers into bins (\"small, mid, large cap\")." },
        { kind: 'code', code: `trades = pd.DataFrame({"venue": ["XLON", "XNYS", "XLON", "BATS"],
                       "side": ["B", "S", "B", "S"], "mcap_bn": [0.8, 45.0, 6.2, 210.0]})

trades["side"] = trades["side"].map({"B": "buy", "S": "sell"})       # unmapped → NaN
trades["venue"] = trades["venue"].replace({"BATS": "CBOE"})          # unmapped kept
trades["size_bucket"] = pd.cut(trades["mcap_bn"], bins=[0, 2, 10, np.inf],
                               labels=["small", "mid", "large"])
trades["decile"] = pd.qcut(trades["mcap_bn"], q=2, labels=False)     # equal-count buckets

pd.get_dummies(trades["side"], prefix="side", dtype=int)            # one-hot encoding
trades.rename(columns={"mcap_bn": "mcap"}).sort_index(axis=1)` },
        { kind: 'check', q: 'Difference between `pd.cut` and `pd.qcut`?', options: ['None', 'cut uses fixed bin edges; qcut uses quantiles so bins have equal counts', 'qcut is faster', 'cut works on strings'], answer: 1, hint: 'Edges vs counts.', explain: 'qcut is what you use for deciles and quintile portfolios.' },
      ],
    },
    {
      id: 'outliers',
      title: 'Outliers & winsorising',
      blocks: [
        { kind: 'analogy', text: "Financial returns have fat tails: real crashes, not errors. Deleting them hides risk; letting one 40-sigma day dominate a regression ruins the fit. Winsorising is the compromise: cap extreme values at, say, the 1st and 99th percentiles, so they still count as \"very large\" without being infinitely loud." },
        { kind: 'code', code: `rng = np.random.default_rng(0)
rets = pd.Series(rng.standard_t(df=3, size=2000) * 0.01)     # fat-tailed returns

rets.describe()[["min", "max"]]                 # a few huge values
lo, hi = rets.quantile([0.01, 0.99])
wins = rets.clip(lower=lo, upper=hi)            # winsorise at 1% / 99%

z = (rets - rets.mean()) / rets.std()
(z.abs() > 4).sum()                             # how many 4-sigma days? (normal: ~0.1)

# Cross-sectional winsorising: per date, across stocks
feat = feat.apply(lambda row: row.clip(*row.quantile([0.01, 0.99])), axis=1)` },
        { kind: 'pitfall', text: 'Computing the clip thresholds on the whole sample uses future data. In a backtest, compute them on the training window (or per date, cross-sectionally) and apply them forward.' },
        { kind: 'check', q: 'Why winsorise rather than delete outliers in returns?', options: ['It\'s faster', 'Extreme days are real and informative; capping limits their leverage without pretending they didn\'t happen', 'Deleting is illegal', 'pandas can\'t delete'], answer: 1, hint: 'Fat tails are the real world.', explain: 'Deleting crashes understates risk.' },
      ],
    },
    {
      id: 'strings',
      title: 'String methods & categoricals',
      blocks: [
        { kind: 'analogy', text: "The `.str` accessor applies a string method to every cell at once, like the vectorised maths you already know, but for text. Categoricals are the opposite trick: store each distinct label once and use small integer codes in the column, like a lookup table." },
        { kind: 'code', code: `ids = pd.Series(["  xau/usd ", "XAG/USD", "eur/gbp", None])
clean = ids.str.strip().str.upper()               # NaN stays NaN
clean.str.split("/", expand=True)                 # two columns: base, quote
clean.str.contains("USD", na=False)               # boolean mask
clean.str.extract(r"^(\\w{3})/(\\w{3})$")         # regex groups → columns
clean.str.replace("/", "", regex=False)           # 'XAUUSD', ...

sym = pd.Series(np.random.default_rng(0).choice(["XAU", "XAG", "XPT"], 1_000_000))
sym.memory_usage(deep=True) // 1e6                # ~ several MB as str
cat = sym.astype("category")
cat.memory_usage(deep=True) // 1e6                # ~ 1 MB: int8 codes + 3 labels
cat.cat.categories, cat.cat.codes[:3]` },
        { kind: 'check', q: 'When is the category dtype a big win?', options: ['Unique IDs', 'Many rows with few distinct values', 'Free text', 'Floats'], answer: 1, hint: 'Lookup table.', explain: 'Also speeds up groupby.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does `dropna(how="all")` drop?', options: ['Rows with any NaN', 'Rows where every value is NaN', 'Columns', 'Nothing'], answer: 1, explain: 'Default how="any".' },
    { q: 'Which fills leak future data?', options: ['ffill', 'bfill and interpolate', 'fillna(0)', 'dropna'], answer: 1, explain: 'They use later values.' },
    { q: 'What replaced `fillna(method="ffill")` in pandas 3?', options: ['fillna("ffill")', '.ffill()', '.forward()', 'pad()'], answer: 1, explain: 'The method argument was removed.' },
    { q: '`Series.map(dict)` does what to unmapped values?', options: ['Keeps them', 'Turns them into NaN', 'Raises', 'Drops rows'], answer: 1, explain: '`replace` keeps them.' },
    { q: 'qcut creates bins with…', options: ['Equal width', 'Roughly equal counts', 'Fixed edges', 'Random edges'], answer: 1, explain: 'Quantile-based.' },
    { q: 'Winsorising means…', options: ['Deleting outliers', 'Capping values at chosen percentiles', 'Log-transforming', 'Standardising'], answer: 1, explain: '`clip` with quantiles.' },
    { q: 'How do you apply upper() to every string in a Series?', options: ['s.upper()', 's.str.upper()', 'map(str.upper)', 'upper(s)'], answer: 1, explain: 'The .str accessor.' },
    { q: 'A category column stores…', options: ['Each string per row', 'Integer codes plus one copy of each label', 'Hashes', 'Bytes'], answer: 1, explain: 'Compact and fast.' },
  ],
}
