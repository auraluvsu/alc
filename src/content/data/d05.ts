import type { Module } from '../types'

export const d05: Module = {
  n: 5,
  title: 'Data Wrangling: Join, Combine & Reshape',
  tour: '8 · Data Wrangling: Join, Combine, and Reshape',
  summary: 'Hierarchical indexes for panel data, SQL-style merges and their pitfalls, concatenation, as-of joins for matching trades to quotes, and reshaping between long and wide with pivot, melt, stack and unstack.',
  topics: ['MultiIndex', 'merge & join', 'concat', 'merge_asof for market data', 'pivot, melt & stack'],
  cpp23: ['`concat` no longer silently sorts mixed indexes by default; pass `sort=` explicitly (3.x deprecation).'],
  lessons: [
    {
      id: 'multiindex',
      title: 'MultiIndex: panel data',
      blocks: [
        { kind: 'analogy', text: "A MultiIndex is an address with several lines: symbol, then date. Each row has a full address, and you can ask for everything on one street (all dates for XAU) or one house number across streets (one date for every symbol). It's how a 2-D table holds 3-D data (assets × dates × fields)." },
        { kind: 'code', code: `import pandas as pd, numpy as np

idx = pd.MultiIndex.from_product(
    [["XAU", "XAG"], pd.date_range("2026-03-02", periods=3, freq="B")], names=["sym", "date"])
panel = pd.DataFrame({"close": [2385.0, 2396.2, 2381.4, 28.41, 28.77, 28.30]}, index=idx)

panel.loc["XAU"]                              # one symbol, indexed by date
panel.xs("2026-03-03", level="date")          # one date, all symbols
panel.loc[("XAG", "2026-03-04"), "close"]     # 28.3
panel.groupby(level="sym")["close"].pct_change()   # returns per symbol, never across symbols

wide = panel["close"].unstack("sym")          # dates × symbols
wide.stack()                                   # back to long (a Series with a MultiIndex)` },
        { kind: 'pitfall', text: '`panel["close"].pct_change()` on a long panel without grouping computes XAG\'s first return from XAU\'s last price: a nonsense number that looks like a real return. Always `groupby(level="sym")` before any time-series operation on a panel.' },
        { kind: 'check', q: 'What does `unstack("sym")` produce from a (sym, date) Series?', options: ['A list', 'A wide frame: dates as rows, symbols as columns', 'A long frame', 'An error'], answer: 1, hint: 'Moves an index level to the columns.', explain: 'stack() moves it back.' },
      ],
    },
    {
      id: 'merge',
      title: 'merge & join',
      blocks: [
        { kind: 'analogy', text: "`merge` is a SQL join with Python syntax. Inner keeps matches only; left keeps every row of the left table; outer keeps everything. The danger is silent row multiplication: if a key appears twice on both sides, you get four rows, and your total P&L quietly doubles." },
        { kind: 'code', code: `fills = pd.DataFrame({"order_id": [1, 2, 2, 3], "qty": [5, 2, 3, 1]})
orders = pd.DataFrame({"order_id": [1, 2, 4], "sym": ["XAU", "XAG", "XPT"]})

pd.merge(fills, orders, on="order_id")                   # inner: ids 1, 2, 2
pd.merge(fills, orders, on="order_id", how="left")       # id 3 kept, sym NaN
pd.merge(fills, orders, on="order_id", how="outer", indicator=True)   # _merge column says where each row came from

pd.merge(fills, orders, on="order_id", validate="many_to_one")   # raises if orders has duplicate ids
pd.merge(a, b, left_on="sym", right_on="ticker", suffixes=("_mkt", "_ref"))
prices.join(volumes, how="inner")                        # join on the index` },
        { kind: 'check', q: 'What does `validate="many_to_one"` protect against?', options: ['Slow merges', 'Duplicate keys on the right side silently multiplying rows', 'NaN keys', 'Type mismatches'], answer: 1, hint: 'Doubling P&L.', explain: 'It raises MergeError instead.' },
      ],
    },
    {
      id: 'concat',
      title: 'concat',
      blocks: [
        { kind: 'analogy', text: "`concat` staples sheets together: vertically (more rows, same columns) or side by side (more columns, aligned on the index). A dict of frames adds a label for which sheet each row came from." },
        { kind: 'code', code: `jan = pd.DataFrame({"close": [1.0, 2.0]}, index=pd.to_datetime(["2026-01-02", "2026-01-05"]))
feb = pd.DataFrame({"close": [3.0]}, index=pd.to_datetime(["2026-02-02"]))
pd.concat([jan, feb])                                   # 3 rows

files = {"XAU": jan, "XAG": feb}
pd.concat(files, names=["sym", "date"])                 # MultiIndex (sym, date)

a = pd.Series([1, 2], index=["x", "y"], name="a")
b = pd.Series([3], index=["y"], name="b")
pd.concat([a, b], axis=1, sort=False)                    # outer-aligned columns, NaN for x/b
pd.concat([a, b], axis=1, join="inner")                  # only y

# Building from many pieces: collect in a list, concat ONCE
frames = [load(f) for f in paths]
df = pd.concat(frames, ignore_index=True)` },
        { kind: 'pitfall', text: 'Calling `pd.concat` inside a loop (`df = pd.concat([df, new])`) copies everything each time, so it\'s quadratic. Collect pieces in a list and concat once at the end.' },
        { kind: 'check', q: 'What does `pd.concat({"XAU": a, "XAG": b})` add?', options: ['Nothing', 'An outer index level with the dict keys', 'A column named keys', 'Sorting'], answer: 1, hint: 'Label each sheet.', explain: 'Use names= to name the levels.' },
      ],
    },
    {
      id: 'asof',
      title: 'merge_asof for market data',
      blocks: [
        { kind: 'analogy', text: "Trades and quotes arrive at different moments. To know the spread when a trade happened, you want \"the most recent quote at or before this trade\", not an exact timestamp match, which almost never exists. `merge_asof` is a sorted, as-of lookup: the standard tool for trades vs quotes, and for joining any slowly updated data (fundamentals, ratings) as it was known at the time." },
        { kind: 'code', code: `quotes = pd.DataFrame({
    "time": pd.to_datetime(["09:00:00.000", "09:00:00.300", "09:00:00.700"], format="%H:%M:%S.%f"),
    "sym": ["XAU"] * 3, "bid": [2385.0, 2385.2, 2385.1], "ask": [2385.4, 2385.5, 2385.6]})
trades = pd.DataFrame({
    "time": pd.to_datetime(["09:00:00.250", "09:00:00.800"], format="%H:%M:%S.%f"),
    "sym": ["XAU", "XAU"], "px": [2385.4, 2385.1]})

tq = pd.merge_asof(trades, quotes, on="time", by="sym",      # both must be sorted by "time"
                   direction="backward", tolerance=pd.Timedelta("1s"))
tq["side"] = np.where(tq["px"] >= tq["ask"], "buy", np.where(tq["px"] <= tq["bid"], "sell", "mid"))
#                 time sym      px     bid     ask  side
# 0 ...00:00:00.250  XAU  2385.4  2385.0  2385.4   buy
# 1 ...00:00:00.800  XAU  2385.1  2385.1  2385.6  sell` },
        { kind: 'check', q: 'Why `direction="backward"` when attaching quotes to trades?', options: ['Speed', 'Only quotes at or before the trade were known at trade time', 'It\'s the only option', 'To sort the result'], answer: 1, hint: 'What did the trader see?', explain: '"forward" or "nearest" can match a quote from after the trade.' },
      ],
    },
    {
      id: 'reshape',
      title: 'pivot, melt & stack',
      blocks: [
        { kind: 'analogy', text: "Long format is a ledger: one row per (date, symbol, value). Wide format is a grid: dates down the side, symbols across the top. Storage and groupby prefer the ledger; matrix maths (correlations, portfolio returns) prefers the grid. You'll convert between them constantly." },
        { kind: 'code', code: `long = pd.DataFrame({
    "date": pd.to_datetime(["2026-03-02", "2026-03-02", "2026-03-03", "2026-03-03"]),
    "sym": ["XAU", "XAG", "XAU", "XAG"], "close": [2385.0, 28.41, 2396.2, 28.77]})

wide = long.pivot(index="date", columns="sym", values="close")
#  sym           XAG     XAU
#  2026-03-02  28.41  2385.0
#  2026-03-03  28.77  2396.2
rets = wide.pct_change()                         # per column: correct by construction
rets.corr()

back = wide.reset_index().melt(id_vars="date", var_name="sym", value_name="close")

# Duplicates? pivot raises; pivot_table aggregates
fills.pivot_table(index="date", columns="sym", values="qty", aggfunc="sum", fill_value=0)` },
        { kind: 'check', q: 'You have duplicate (date, sym) rows. Which call works?', options: ['pivot', 'pivot_table with an aggfunc', 'melt', 'stack'], answer: 1, hint: 'Something must decide how to combine duplicates.', explain: 'pivot raises "Index contains duplicate entries".' },
      ],
    },
  ],
  quiz: [
    { q: 'How do you select one level value from a MultiIndex across the other level?', options: ['df.loc[...] only', 'df.xs(key, level=...)', 'df.iloc', 'df.filter'], answer: 1, explain: 'Cross-section.' },
    { q: 'Time-series ops on a long panel need…', options: ['Nothing', 'groupby on the symbol level first', 'Sorting by price', 'A pivot'], answer: 1, explain: 'Or pivot to wide.' },
    { q: 'A left merge keeps…', options: ['Only matches', 'All left rows', 'All right rows', 'Everything'], answer: 1, explain: 'Unmatched right columns are NaN.' },
    { q: 'What does indicator=True add?', options: ['Row numbers', 'A _merge column showing each row\'s source', 'Validation', 'Sorting'], answer: 1, explain: 'left_only / right_only / both.' },
    { q: 'Why not concat inside a loop?', options: ['Not allowed', 'Quadratic copying', 'Loses index', 'Changes dtypes'], answer: 1, explain: 'Concat once.' },
    { q: 'merge_asof requires…', options: ['Equal timestamps', 'Both frames sorted by the on key', 'A MultiIndex', 'No by'], answer: 1, explain: 'It is a sorted as-of join.' },
    { q: 'Which converts wide to long?', options: ['pivot', 'melt', 'unstack', 'join'], answer: 1, explain: 'Or stack.' },
    { q: 'Correlation matrices need which layout?', options: ['Long', 'Wide (dates × assets)', 'Either', 'MultiIndex rows'], answer: 1, explain: 'One column per asset.' },
  ],
}
