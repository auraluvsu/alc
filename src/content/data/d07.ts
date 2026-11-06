import type { Module } from '../types'

export const d07: Module = {
  n: 7,
  title: 'Group Operations',
  tour: '10 · Data Aggregation and Group Operations',
  summary: 'Split-apply-combine with groupby: how grouping works, aggregation with named outputs, transform for group-wise features, apply and filter, pivot tables and cross-tabs, and the cross-sectional operations at the heart of factor investing.',
  topics: ['groupby mechanics', 'agg & named aggregation', 'transform vs apply', 'Pivot tables & crosstab', 'Cross-sectional ops'],
  cpp23: ['`groupby(observed=True)` is the default for categoricals since pandas 3.0.', 'groupby `apply` no longer passes the grouping columns to your function (3.0).'],
  lessons: [
    {
      id: 'mechanics',
      title: 'groupby mechanics',
      blocks: [
        { kind: 'analogy', text: "Split-apply-combine is sorting the post into pigeonholes by postcode (split), doing the same job on each pile (apply), and stacking the results back into one report (combine). `groupby` does the first step lazily: nothing is computed until you say what to do with each pile." },
        { kind: 'code', code: `import pandas as pd, numpy as np

fills = pd.DataFrame({
    "desk": ["metals", "metals", "fx", "fx", "metals"],
    "sym":  ["XAU", "XAG", "EURUSD", "GBPUSD", "XAU"],
    "qty":  [2, 100, 1_000_000, 500_000, 1],
    "pnl":  [1200.0, -350.0, 800.0, -150.0, 400.0],
})
g = fills.groupby("desk")         # a DataFrameGroupBy: nothing computed yet
g.ngroups, g.size().to_dict()     # (2, {'fx': 2, 'metals': 3})
g["pnl"].sum()                    # fx 650.0, metals 1250.0
fills.groupby(["desk", "sym"])["pnl"].sum()   # MultiIndex result
fills.groupby("desk", as_index=False)["pnl"].sum()   # keys as a column instead

for desk, frame in g:             # iterate over (key, sub-frame) pairs
    print(desk, len(frame))` },
        { kind: 'check', q: 'When does `df.groupby("desk")` compute anything?', options: ['Immediately', 'Only when you call an aggregation or iterate', 'At import', 'Never'], answer: 1, hint: 'Pigeonholes first, work later.', explain: 'The GroupBy object just records how to split.' },
      ],
    },
    {
      id: 'agg',
      title: 'agg & named aggregation',
      blocks: [
        { kind: 'analogy', text: "Named aggregation is filling in a report template: for each output column you say which input column to read and how to summarise it. The result has exactly the columns you named, ready to print." },
        { kind: 'code', code: `summary = fills.groupby("desk").agg(
    trades=("pnl", "size"),
    total_pnl=("pnl", "sum"),
    hit_rate=("pnl", lambda s: (s > 0).mean()),
    worst=("pnl", "min"),
)
#         trades  total_pnl  hit_rate   worst
# desk
# fx           2      650.0  0.500000  -150.0
# metals       3     1250.0  0.666667  -350.0

fills.groupby("desk")["pnl"].agg(["mean", "std", "count"])
fills.groupby("desk").agg({"qty": "sum", "pnl": ["sum", "max"]})` },
        { kind: 'p', text: 'Built-in aggregations given as strings (`"sum"`, `"mean"`, `"std"`, `"size"`, `"nunique"`, `"first"`) run in optimised compiled code. Lambdas work but call Python once per group, so use the string forms where they exist.' },
        { kind: 'check', q: 'What does `("pnl", "size")` count in named aggregation?', options: ['Non-null pnl values', 'Rows in each group, including NaN', 'Unique values', 'The sum'], answer: 1, hint: '"count" excludes NaN.', explain: 'Use "count" for non-null values only.' },
      ],
    },
    {
      id: 'transform',
      title: 'transform vs apply',
      blocks: [
        { kind: 'analogy', text: "`agg` returns one row per group: a summary. `transform` returns one value per original row: each row gets its group's statistic stamped on it, or its own value adjusted relative to its group. That's the shape you need to add a feature column, like \"this trade's P&L minus its desk average\"." },
        { kind: 'code', code: `fills["desk_avg"] = fills.groupby("desk")["pnl"].transform("mean")
fills["pnl_vs_desk"] = fills["pnl"] - fills["desk_avg"]
fills["pnl_rank"] = fills.groupby("desk")["pnl"].rank(ascending=False)

# Per-symbol time-series ops on a long panel: always grouped
panel["ret"] = panel.groupby("sym")["close"].pct_change()
panel["vol20"] = panel.groupby("sym")["ret"].transform(lambda r: r.rolling(20).std())

# apply: arbitrary function per group, any output shape
def top_n(df, n=1): return df.nlargest(n, "pnl")
fills.groupby("desk").apply(top_n)            # biggest winner per desk

fills.groupby("desk").filter(lambda d: d["pnl"].sum() > 1000)   # keep whole groups that pass` },
        { kind: 'check', q: 'You want a column with each trade\'s desk average P&L. Which method?', options: ['agg', 'transform', 'filter', 'size'], answer: 1, hint: 'One value per original row.', explain: 'agg would return one row per desk.' },
      ],
    },
    {
      id: 'pivot',
      title: 'Pivot tables & crosstab',
      blocks: [
        { kind: 'analogy', text: "A pivot table is a groupby by two keys at once, laid out as a grid: one key down the side, the other across the top. `crosstab` is the special case of counting how often each pair occurs, like a contingency table." },
        { kind: 'code', code: `fills["month"] = ["Jan", "Jan", "Feb", "Feb", "Feb"]
fills.pivot_table(index="desk", columns="month", values="pnl", aggfunc="sum",
                  fill_value=0, margins=True)       # margins adds an "All" row and column
# month    Feb    Jan     All
# desk
# fx       650.0    0.0   650.0
# metals   400.0  850.0  1250.0
# All     1050.0  850.0  1900.0

pd.crosstab(fills["desk"], fills["pnl"] > 0, normalize="index")   # win/loss share per desk` },
        { kind: 'check', q: 'What does `margins=True` add to a pivot table?', options: ['Padding', 'Row and column totals ("All")', 'Percentages', 'Sorting'], answer: 1, hint: 'Like totals in a spreadsheet.', explain: 'Computed with the same aggfunc.' },
      ],
    },
    {
      id: 'crosssection',
      title: 'Cross-sectional operations',
      blocks: [
        { kind: 'analogy', text: "Time-series thinking asks \"how is this stock doing versus its own past?\". Cross-sectional thinking asks \"how is this stock doing versus every other stock *today*?\". Factor investing lives on the second question: each day, rank or z-score a signal across the universe, then buy the top and sell the bottom." },
        { kind: 'code', code: `rng = np.random.default_rng(1)
dates = pd.bdate_range("2026-01-01", periods=60)
syms = [f"S{i:02d}" for i in range(50)]
panel = pd.DataFrame({
    "date": np.repeat(dates, len(syms)), "sym": np.tile(syms, len(dates)),
    "mom": rng.normal(size=len(dates) * len(syms)),
    "fwd_ret": rng.normal(0, 0.02, size=len(dates) * len(syms)),
})

by_date = panel.groupby("date")
panel["mom_z"] = by_date["mom"].transform(lambda x: (x - x.mean()) / x.std())   # z-score per day
panel["mom_q"] = by_date["mom"].transform(lambda x: pd.qcut(x, 5, labels=False))   # quintile 0–4

# Long the top quintile, short the bottom, equal-weight: one return per day
spread = (panel.groupby(["date", "mom_q"])["fwd_ret"].mean()
               .unstack("mom_q").pipe(lambda q: q[4] - q[0]))
spread.mean() / spread.std() * np.sqrt(252)     # annualised Sharpe: random data, so whatever
                                                # this prints is luck. 60 days is far too short to judge

# Information coefficient: rank correlation of signal with forward return, per day
ic = by_date.apply(lambda d: d["mom"].corr(d["fwd_ret"], method="spearman"))` },
        { kind: 'check', q: 'Why z-score a signal per date rather than over the whole sample?', options: ['Speed', 'It compares stocks to each other on the same day and avoids using future data for the mean/std', 'pandas requires it', 'It removes NaN'], answer: 1, hint: 'Cross-section vs time series.', explain: 'Whole-sample statistics also leak the future.' },
      ],
    },
  ],
  quiz: [
    { q: 'Split-apply-combine describes…', options: ['merge', 'groupby', 'concat', 'pivot only'], answer: 1, explain: 'Hadley Wickham\'s term.' },
    { q: 'What does `as_index=False` do?', options: ['Drops the index', 'Keeps group keys as columns instead of the index', 'Sorts', 'Resets dtypes'], answer: 1, explain: 'Handy for further merges.' },
    { q: 'Named aggregation syntax is…', options: ['agg(new=("col", "func"))', 'agg("col"="func")', 'agg([col, func])', 'agg(col.func)'], answer: 0, explain: 'Output name = (column, function).' },
    { q: 'transform returns…', options: ['One row per group', 'A result aligned to the original rows', 'A scalar', 'A list'], answer: 1, explain: 'For feature columns.' },
    { q: 'groupby().filter(f) keeps…', options: ['Rows where f is True', 'Whole groups for which f returns True', 'Columns', 'The first group'], answer: 1, explain: 'f receives each group.' },
    { q: 'crosstab computes…', options: ['Correlations', 'Frequency tables of factor combinations', 'Sums only', 'Returns'], answer: 1, explain: '`normalize=` gives shares.' },
    { q: 'A cross-sectional z-score is computed…', options: ['Per stock over time', 'Per date across stocks', 'Once over everything', 'Per month'], answer: 1, explain: 'groupby("date").transform.' },
    { q: 'The information coefficient is…', options: ['Sharpe ratio', 'Correlation between a signal and forward returns', 'Hit rate', 'Turnover'], answer: 1, explain: 'Usually Spearman, per date.' },
  ],
}
