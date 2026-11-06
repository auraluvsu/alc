import type { Module } from '../types'

export const d02: Module = {
  n: 2,
  title: 'Essential Functionality',
  tour: '5 · Essential Functionality',
  summary: 'Selecting with .loc and .iloc, reindexing and dropping, arithmetic between frames, applying functions, sorting and ranking, and the summary statistics you\'ll use daily: returns, volatility and correlation.',
  topics: ['loc & iloc', 'Reindexing & dropping', 'Arithmetic & alignment', 'apply, map & pd.col', 'Sorting & ranking', 'Summary statistics'],
  cpp23: [
    '`pd.col("name")` (pandas 3.0) builds deferred column expressions, so `df.assign(x=pd.col("a") * 2)` needs no lambda.',
    '`DataFrame.applymap` was renamed `DataFrame.map` (2.1); the old name is gone in 3.0.',
  ],
  lessons: [
    {
      id: 'select',
      title: 'Selecting with .loc and .iloc',
      blocks: [
        { kind: 'analogy', text: "`.loc` is asking a librarian for books by title; `.iloc` is counting shelves from the left. Both take `[rows, columns]`. The difference matters most at the edges: label slices include the end label (you asked for \"Monday to Wednesday\", you get Wednesday too), while position slices stop before the end, as everywhere else in Python." },
        { kind: 'code', code: `prices = pd.DataFrame(
    {"XAU": [2385.0, 2396.2, 2381.4, 2390.5], "XAG": [28.41, 28.77, 28.30, 28.52]},
    index=pd.date_range("2026-03-02", periods=4, freq="B"),
)
prices.loc["2026-03-03", "XAU"]                 # 2396.2: one cell
prices.loc["2026-03-03":"2026-03-04"]           # 2 rows: label slices INCLUDE the end
prices.iloc[1:3]                                # also 2 rows: position slices exclude the end
prices.iloc[-1]                                 # last row
prices.loc[prices["XAU"] > 2390, ["XAU"]]       # mask for rows, list for columns
prices.at["2026-03-02", "XAG"]                  # fast scalar access

prices.loc[prices["XAG"] < 28.5, "flag"] = True     # set with one .loc call` },
        { kind: 'pitfall', text: '`s[0]` on a Series with an integer-like or date index is ambiguous: label or position? pandas now treats `[]` with integers as labels for Series. Be explicit: `.iloc[0]` for "the first one", `.loc[label]` for a label.' },
        { kind: 'check', q: 'With a 4-row DataFrame indexed by labels a–d, how many rows does `df.loc["a":"c"]` return?', options: ['2', '3', '4', 'It raises an error'], answer: 1, hint: 'Label slices are inclusive.', explain: 'a, b and c. `df.iloc[0:2]` would return 2.' },
      ],
    },
    {
      id: 'reindex',
      title: 'Reindexing, dropping & alignment',
      blocks: [
        { kind: 'analogy', text: "Reindexing is laying your data onto a new calendar. Days you have data for are copied across; new days start empty unless you tell pandas how to fill them (carry yesterday's close forward, say). It's how you put two markets with different holidays onto one timeline." },
        { kind: 'code', code: `uk = pd.Series([100.0, 101.0, 102.0], index=pd.to_datetime(["2026-04-02", "2026-04-07", "2026-04-08"]))
us = pd.Series([50.0, 50.5, 51.0, 51.2],
               index=pd.to_datetime(["2026-04-02", "2026-04-06", "2026-04-07", "2026-04-08"]))

uk + us                              # 2026-04-06 is NaN: London shut for Easter Monday
uk.reindex(us.index)                 # put UK onto the US calendar: NaN on the 6th
uk.reindex(us.index, method="ffill") # carry the last UK price forward
uk.add(us, fill_value=0)             # treat the missing side as 0 (rarely right for prices!)

both = pd.concat({"uk": uk, "us": us}, axis=1, sort=True)   # outer-join on the index
both.dropna()                        # keep only days both traded
both.drop(columns="uk"); both.drop(index=both.index[0])` },
        { kind: 'pitfall', text: 'Forward-filling a closed market\'s price makes its return that day exactly zero, which understates volatility and distorts correlations. For multi-market analysis, either keep only common days or be explicit about how holidays are treated.' },
        { kind: 'check', q: '`uk.reindex(us.index, method="ffill")` fills a missing day with…', options: ['0', 'The most recent earlier value', 'The next value', 'The mean'], answer: 1, hint: 'f for forward.', explain: '`bfill` uses the next value, which leaks the future in a time series.' },
      ],
    },
    {
      id: 'apply',
      title: 'Vectorised ops, apply, map & pd.col',
      blocks: [
        { kind: 'analogy', text: "There are three speeds of doing work on a column. Whole-column operations (`df.a * 2`, `np.log(df.a)`) run in compiled code: a conveyor belt. `.map` and `.apply` call your Python function once per item or row: a person carrying boxes by hand. Reach for the conveyor first and only carry by hand when there's no belt." },
        { kind: 'code', code: `df = pd.DataFrame({"sym": ["XAU", "XAG", "XPT"], "bid": [2385.1, 28.40, 981.0], "ask": [2385.5, 28.43, 982.6]})

df["mid"] = (df["bid"] + df["ask"]) / 2          # vectorised: fast
df["spread_bp"] = (df["ask"] - df["bid"]) / df["mid"] * 1e4

df["name"] = df["sym"].map({"XAU": "gold", "XAG": "silver", "XPT": "platinum"})   # lookup per value
df["sym"].str.lower()                           # vectorised string methods
df[["bid", "ask"]].apply(lambda col: col.max() - col.min())       # per column
df.apply(lambda r: r.ask - r.bid, axis=1)        # per row: slow, avoid in big frames

df = df.assign(mid=(pd.col("bid") + pd.col("ask")) / 2)          # pandas 3 expressions
(df.loc[lambda d: d.spread_bp < 5]               # method chaining with callables
   .sort_values("spread_bp"))` },
        { kind: 'new23', text: '`pd.col("bid")` (pandas 3.0) refers to a column of whatever frame the expression is evaluated on. It replaces the `lambda d: d["bid"]` idiom in method chains and reads like Polars expressions.' },
        { kind: 'check', q: 'Which is fastest for a million-row frame?', options: ['`df.apply(lambda r: r.a * r.b, axis=1)`', '`df["a"] * df["b"]`', 'A for loop with `.iloc`', '`df.itertuples()`'], answer: 1, hint: 'Conveyor belt or hand-carrying?', explain: 'Column arithmetic runs in compiled code; row-wise apply calls Python a million times.' },
      ],
    },
    {
      id: 'sort',
      title: 'Sorting & ranking',
      blocks: [
        { kind: 'analogy', text: "Sorting rearranges the queue; ranking hands everyone a numbered ticket without moving them. Cross-sectional strategies (\"buy the top decile of momentum\") are built on ranks, because a rank of 0.9 means the same thing whatever the raw values were that day." },
        { kind: 'code', code: `mom = pd.Series({"AAPL": 0.12, "MSFT": 0.08, "NVDA": 0.35, "XOM": -0.04, "JPM": 0.08})
mom.sort_values(ascending=False)               # NVDA, AAPL, MSFT, JPM, XOM
mom.nlargest(2)                                # NVDA, AAPL (faster than a full sort)
mom.rank()                                     # XOM 1, MSFT 2.5, JPM 2.5, AAPL 4, NVDA 5 (ties averaged)
mom.rank(pct=True)                             # 0.2 … 1.0: percentile ranks
df.sort_values(["sym", "date"]); df.sort_index()

# Cross-sectional rank across assets, each day (rows = dates, columns = assets)
signal = returns_12m.rank(axis=1, pct=True)` },
        { kind: 'check', q: 'Two values tie for 2nd and 3rd place. What does `rank()` give them by default?', options: ['2 and 3', '2.5 each', '2 each', '3 each'], answer: 1, hint: 'The default method is "average".', explain: 'Use `method="min"`, `"first"` or `"dense"` for other tie rules.' },
      ],
    },
    {
      id: 'stats',
      title: 'Summary statistics',
      blocks: [
        { kind: 'analogy', text: "Reductions squash a column (or row) down to one number, and they skip missing values by default, like a teacher averaging only the tests a student actually sat. That's usually what you want, but you should know it's happening." },
        { kind: 'code', code: `rets = prices.pct_change().dropna()          # simple daily returns
rets.mean() * 252                            # annualised mean (rough)
rets.std() * np.sqrt(252)                    # annualised vol: pandas std uses ddof=1
rets.corr()                                  # correlation matrix
rets["XAU"].corr(rets["XAG"])                # one pair
rets.cov() * 252                             # annualised covariance
rets.describe(); rets.skew(); rets.kurt()    # fat tails show up in kurt()
rets.idxmax(), rets.cummax(), rets.quantile(0.05)   # worst 5% day: historical VaR
np.log1p(rets)                               # log returns: add up over time

pd.Series([1.0, np.nan]).mean()              # 1.0: NaN skipped
pd.Series([1.0, np.nan]).mean(skipna=False)  # nan` },
        { kind: 'pitfall', text: 'pandas `std()` uses `ddof=1` (sample) while NumPy\'s `np.std` uses `ddof=0`. Moving a calculation between the two changes your volatility slightly. State the ddof explicitly in anything that gets compared.' },
        { kind: 'check', q: 'What does `rets.quantile(0.05)` estimate?', options: ['Average return', 'The return exceeded on 95% of days: one-day historical VaR at 95%', 'Volatility', 'The best day'], answer: 1, hint: 'The 5th percentile of the distribution.', explain: 'It\'s the simplest Value-at-Risk estimate (as a negative return).' },
      ],
    },
  ],
  quiz: [
    { q: '`.loc` selects by…', options: ['Position', 'Label (and boolean masks)', 'dtype', 'Memory address'], answer: 1, explain: '`.iloc` is positional.' },
    { q: 'Do label slices with `.loc` include the end label?', options: ['Yes', 'No', 'Only for dates', 'Only with step'], answer: 0, explain: 'Unlike positional slices.' },
    { q: 'Which fill method risks look-ahead bias in time series?', options: ['ffill', 'bfill', 'dropna', 'fillna(0)'], answer: 1, explain: 'Back-filling copies future values into the past.' },
    { q: 'What is the pandas 3 replacement for `lambda d: d["x"]` in chains?', options: ['pd.field("x")', 'pd.col("x")', 'd.x', 'pd.expr("x")'], answer: 1, explain: 'Deferred column expressions.' },
    { q: '`DataFrame.applymap` is now…', options: ['DataFrame.apply', 'DataFrame.map', 'DataFrame.transform', 'Gone with no replacement'], answer: 1, explain: 'Renamed in 2.1, removed in 3.0.' },
    { q: '`rank(pct=True)` returns…', options: ['Sorted values', 'Percentile ranks between 0 and 1', 'Percent changes', 'Integer ranks'], answer: 1, explain: 'Useful for cross-sectional signals.' },
    { q: 'What ddof does pandas `.std()` use by default?', options: ['0', '1', '2', 'None'], answer: 1, explain: 'NumPy uses 0.' },
    { q: 'How do reductions like `.mean()` treat NaN by default?', options: ['Return NaN', 'Skip it', 'Treat as 0', 'Raise'], answer: 1, explain: '`skipna=True` is the default.' },
  ],
}
