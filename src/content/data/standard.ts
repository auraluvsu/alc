import type { StdEntry } from '../standard'

// The pandas functions and methods worth knowing by heart.
export const DATA_STANDARD: StdEntry[] = [
  // ---------------- I/O ----------------
  {
    name: 'pd.read_csv', header: 'pandas', cat: 'Input & output', module: 3,
    summary: 'Load a CSV with the right types, dates and index in one call.',
    what: 'Parses delimited text into a DataFrame. The arguments that matter: `parse_dates`, `index_col`, `dtype`, `usecols` (load fewer columns) and `dtype_backend="pyarrow"`.',
    code: `df = pd.read_csv("xauusd_1m.csv",
                 parse_dates=["time"], index_col="time",
                 usecols=["time", "open", "high", "low", "close", "volume"],
                 dtype={"volume": "int64"})`,
    when: 'Any vendor download or export. Convert to Parquet afterwards if you\'ll read it again.',
  },
  {
    name: 'read_parquet / to_parquet', header: 'pandas + pyarrow', cat: 'Input & output', module: 3,
    summary: 'Fast, typed, compressed columnar storage.',
    what: 'Parquet keeps dtypes (including timestamps and categoricals), compresses well and lets you read only some columns. Much faster than CSV.',
    code: `df.to_parquet("bars.parquet")
bars = pd.read_parquet("bars.parquet", columns=["close", "volume"])`,
    when: 'The default storage for research datasets.',
  },
  // ---------------- Selection & shaping ----------------
  {
    name: '.loc / .iloc', header: 'DataFrame', cat: 'Selection', module: 2,
    summary: 'Select rows and columns by label or by position.',
    what: '`.loc[rows, cols]` uses labels, boolean masks or callables (end-inclusive slices). `.iloc[rows, cols]` uses integer positions.',
    code: `df.loc["2026-03-02":"2026-03-06", ["close"]]
df.loc[df["ret"] < -0.02, "flag"] = "shock"
df.iloc[-20:]`,
    when: 'Every selection or conditional assignment.',
  },
  {
    name: 'assign + pd.col', header: 'DataFrame', cat: 'Selection', module: 2, since: 'pandas 3.0',
    summary: 'Add columns inside a method chain without lambdas.',
    what: '`assign` returns a new frame with extra columns. `pd.col("x")` refers to column x of that frame, so expressions can use columns created earlier in the chain.',
    code: `out = (df
       .assign(mid=(pd.col("bid") + pd.col("ask")) / 2)
       .assign(spread_bp=(pd.col("ask") - pd.col("bid")) / pd.col("mid") * 1e4)
       .query("spread_bp < 5"))`,
    when: 'Readable, step-by-step feature pipelines.',
  },
  {
    name: 'merge / merge_asof', header: 'pandas', cat: 'Combining', module: 5,
    summary: 'SQL-style joins, and as-of joins for time-stamped data.',
    what: '`merge` joins on keys (inner/left/right/outer). `merge_asof` matches each row to the most recent row on the other side at or before its timestamp, optionally per key.',
    code: `trades_q = pd.merge_asof(trades.sort_values("time"), quotes.sort_values("time"),
                         on="time", by="sym", direction="backward")`,
    when: 'Attaching the prevailing quote to each trade; joining fundamentals as known at the time.',
  },
  {
    name: 'concat', header: 'pandas', cat: 'Combining', module: 5,
    summary: 'Stack frames vertically or side by side.',
    what: 'Concatenates along an axis, aligning on the other axis. A dict of frames gives an outer key level.',
    code: `panel = pd.concat({s: load(s) for s in syms}, names=["sym", "date"])
wide  = pd.concat({"uk": uk, "us": us}, axis=1, sort=True)`,
    when: 'Combining files, symbols or periods.',
  },
  {
    name: 'pivot / melt', header: 'DataFrame', cat: 'Reshaping', module: 5,
    summary: 'Long ↔ wide.',
    what: '`pivot(index, columns, values)` turns long rows into a grid. `melt` does the reverse. `pivot_table` also aggregates duplicates.',
    code: `wide = long.pivot(index="date", columns="sym", values="close")
long = wide.reset_index().melt(id_vars="date", var_name="sym", value_name="close")`,
    when: 'Wide (dates × assets) for maths; long for storage and groupby.',
  },
  // ---------------- Groups ----------------
  {
    name: 'groupby + agg', header: 'DataFrame', cat: 'Groups', module: 7,
    summary: 'Split-apply-combine.',
    what: 'Groups rows by keys, then aggregates. Named aggregation gives tidy output column names.',
    code: `daily = trades.groupby("sym").agg(
    n=("qty", "size"), volume=("qty", "sum"), vwap=("notional", "sum"))
daily["vwap"] /= daily["volume"]`,
    when: 'Per-symbol, per-day or per-strategy summaries.',
  },
  {
    name: 'groupby + transform', header: 'DataFrame', cat: 'Groups', module: 7,
    summary: 'Group statistics broadcast back to every row.',
    what: 'Like `agg`, but returns a result the same length as the input, so you can use it as a column.',
    code: `df["z"] = df.groupby("date")["mom"].transform(lambda x: (x - x.mean()) / x.std())`,
    when: 'Cross-sectional z-scores, demeaning within groups.',
  },
  // ---------------- Time series ----------------
  {
    name: 'resample', header: 'DataFrame', cat: 'Time series', module: 8,
    summary: 'Change frequency: ticks → bars, daily → monthly.',
    what: 'Groups by time buckets on a DatetimeIndex. Combine with `ohlc()`, `last()`, `sum()` and so on.',
    code: `bars = ticks["price"].resample("5min").ohlc()
bars["volume"] = ticks["size"].resample("5min").sum()
monthly = prices.resample("ME").last().pct_change()`,
    when: 'Building bars, changing analysis frequency.',
  },
  {
    name: 'rolling / ewm', header: 'Series / DataFrame', cat: 'Time series', module: 8,
    summary: 'Moving windows and exponentially weighted statistics.',
    what: '`rolling(n)` or `rolling("30D")` gives windowed statistics; `ewm(halflife=…)` weights recent data more.',
    code: `vol20 = rets.rolling(20).std() * np.sqrt(252)
ewvol = rets.ewm(halflife=10).std() * np.sqrt(252)
sma50 = px.rolling(50, min_periods=50).mean()`,
    when: 'Volatility estimates, moving averages, rolling betas.',
  },
  {
    name: 'shift', header: 'Series / DataFrame', cat: 'Time series', module: 8,
    summary: 'Lag or lead a series by n rows.',
    what: '`shift(1)` moves values down one row, so each row sees the previous value. Negative shifts look into the future.',
    code: `signal = (sma10 > sma50).astype(int)
strat = signal.shift(1) * rets        # trade on yesterday's signal`,
    when: 'Every backtest: always shift signals before multiplying by returns.',
  },
  {
    name: 'pct_change / cumprod', header: 'Series / DataFrame', cat: 'Statistics', module: 2,
    summary: 'Returns, and compounding them back into an equity curve.',
    what: '`pct_change()` gives simple returns; `(1 + r).cumprod()` compounds them; `cummax()` gives the running peak.',
    code: `equity = (1 + rets).cumprod()
drawdown = equity / equity.cummax() - 1
max_dd = drawdown.min()`,
    when: 'Performance analysis of any strategy or asset.',
  },
  {
    name: 'describe / corr', header: 'DataFrame', cat: 'Statistics', module: 2,
    summary: 'First look at distributions and relationships.',
    what: '`describe()` gives count, mean, std, min, quartiles and max per column. `corr()` gives the correlation matrix (Pearson, Spearman or Kendall).',
    code: `rets.describe(percentiles=[.01, .05, .5, .95, .99])
rets.corr(method="spearman")`,
    when: 'The first two calls on any new dataset.',
  },
]
