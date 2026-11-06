import type { DictEntry } from '../types'

export const DATA_DICT: DictEntry[] = [
  // ---------- Core types ----------
  { term: 'Series', cat: 'Core types', module: 1, desc: 'A 1-D labelled array: values plus an index. Arithmetic aligns on labels.', syntax: `s = pd.Series([1.0, 2.0], index=["a", "b"], name="px")` },
  { term: 'DataFrame', cat: 'Core types', module: 1, desc: 'A table of columns (each a Series) sharing one row index.', syntax: `df = pd.DataFrame({"sym": ["XAU"], "close": [2385.0]})` },
  { term: 'Index / DatetimeIndex', cat: 'Core types', module: 1, desc: 'Row labels. A DatetimeIndex enables date-string lookups, resampling and time-based rolling.', syntax: `df.index = pd.to_datetime(df["date"]); df = df.set_index("date")` },
  { term: 'MultiIndex', cat: 'Core types', module: 1, desc: 'Several index levels, e.g. (symbol, date) for a panel.', syntax: `df.set_index(["sym", "date"]); df.xs("XAU", level="sym")` },
  { term: 'Nullable dtypes', cat: 'Core types', module: 1, desc: '`Int64`, `boolean`, `Float64`: hold `pd.NA` without converting integers to floats.', syntax: `pd.Series([1, None], dtype="Int64")` },
  { term: 'str dtype', cat: 'Core types', module: 1, desc: 'The default dtype for text in pandas 3, Arrow-backed when pyarrow is installed.', syntax: `df["sym"].dtype   # str`, since: 'pandas 3.0' },
  { term: 'category', cat: 'Core types', module: 1, desc: 'Few distinct values stored as small integer codes: less memory, faster groupby.', syntax: `df["sym"] = df["sym"].astype("category")` },
  // ---------- Selection ----------
  { term: '.loc', cat: 'Selection', module: 2, desc: 'Select by label or boolean mask. Label slices include the end.', syntax: `df.loc["2026-03", ["close"]]
df.loc[df.close > 0, "flag"] = True` },
  { term: '.iloc', cat: 'Selection', module: 2, desc: 'Select by integer position. Slices exclude the end.', syntax: `df.iloc[-1]; df.iloc[:5, :2]` },
  { term: '.at / .iat', cat: 'Selection', module: 2, desc: 'Fast single-cell access by label or position.', syntax: `df.at[ts, "close"]` },
  { term: 'Boolean masks', cat: 'Selection', module: 2, desc: 'Combine with `&`, `|`, `~` and parentheses, never `and`/`or`.', syntax: `df[(df.ret > 0) & (df.vol > 1e5)]` },
  { term: 'query', cat: 'Selection', module: 2, desc: 'Filter with a string expression; `@name` refers to a Python variable.', syntax: `df.query("ret > @thresh and sym == 'XAU'")` },
  // ---------- Operations ----------
  { term: 'Alignment', cat: 'Operations', module: 2, desc: 'Binary operations match labels first; unmatched labels give NaN unless `fill_value=` is used.', syntax: `s.add(t, fill_value=0)` },
  { term: 'reindex', cat: 'Operations', module: 2, desc: 'Conform to a new index, optionally filling gaps.', syntax: `s.reindex(calendar, method="ffill")` },
  { term: 'assign', cat: 'Operations', module: 2, desc: 'Return a new frame with added/replaced columns; ideal in method chains.', syntax: `df.assign(mid=(pd.col("bid") + pd.col("ask")) / 2)` },
  { term: 'pd.col', cat: 'Operations', module: 2, desc: 'A deferred reference to a column, evaluated against the frame it\'s used on.', syntax: `df.assign(x=pd.col("a") * 2)`, since: 'pandas 3.0' },
  { term: 'map / apply', cat: 'Operations', module: 2, desc: '`Series.map` maps values (dict or function). `apply` runs a function per column or row (axis=1, slow).', syntax: `s.map({"XAU": "gold"}); df.apply(f, axis=1)` },
  { term: 'rank', cat: 'Operations', module: 2, desc: 'Ranks values; `pct=True` gives 0–1 percentiles; `axis=1` ranks across columns.', syntax: `mom.rank(axis=1, pct=True)` },
  // ---------- Statistics ----------
  { term: 'pct_change', cat: 'Statistics', module: 2, desc: 'Simple returns: x[t]/x[t-1] − 1.', syntax: `rets = prices.pct_change().dropna()` },
  { term: 'std / var (ddof)', cat: 'Statistics', module: 2, desc: 'pandas defaults to ddof=1 (sample); NumPy defaults to ddof=0.', syntax: `rets.std() * np.sqrt(252)` },
  { term: 'corr / cov', cat: 'Statistics', module: 2, desc: 'Pairwise correlation/covariance matrices, or one pair via `s.corr(t)`.', syntax: `rets.corr(method="spearman")` },
  { term: 'Copy-on-Write', cat: 'Behaviour', module: 1, desc: 'Every selection behaves as a copy; chained assignment never modifies the original.', syntax: `df.loc[mask, "a"] = 0   # not df["a"][mask] = 0`, since: 'pandas 3.0' },
  // ---------- I/O, cleaning & wrangling ----------
  { term: 'read_parquet / to_parquet', cat: 'Input & output', module: 3, desc: 'Typed, compressed, columnar storage; read only the columns you need.', syntax: `pd.read_parquet("bars/", columns=["close"], filters=[("sym", "==", "XAU")])` },
  { term: 'ffill / bfill', cat: 'Cleaning', module: 4, desc: 'Fill gaps from the previous / next value. bfill leaks the future in backtests.', syntax: `px.ffill(limit=2)` },
  { term: 'clip (winsorise)', cat: 'Cleaning', module: 4, desc: 'Cap values at bounds, e.g. the 1st/99th percentiles.', syntax: `r.clip(*r.quantile([0.01, 0.99]))` },
  { term: 'merge (validate=)', cat: 'Combining', module: 5, desc: 'SQL-style join; `validate=` raises if keys aren\'t unique as expected.', syntax: `pd.merge(fills, orders, on="order_id", how="left", validate="many_to_one")` },
  { term: 'merge_asof', cat: 'Combining', module: 5, desc: 'Match each row to the latest row at or before its key on the other side.', syntax: `pd.merge_asof(trades, quotes, on="time", by="sym", direction="backward")` },
  { term: 'pivot / melt', cat: 'Reshaping', module: 5, desc: 'Long ↔ wide. pivot_table aggregates duplicates.', syntax: `long.pivot(index="date", columns="sym", values="close")` },
  // ---------- Groups & time ----------
  { term: 'groupby().transform', cat: 'Groups', module: 7, desc: 'Group statistic broadcast back to each row; for features.', syntax: `df.groupby("date")["mom"].transform(lambda x: (x - x.mean()) / x.std())` },
  { term: 'Named aggregation', cat: 'Groups', module: 7, desc: 'Output column = (input column, function).', syntax: `g.agg(n=("pnl", "size"), total=("pnl", "sum"))` },
  { term: 'resample', cat: 'Time series', module: 8, desc: 'Change frequency on a DatetimeIndex: ticks → bars, daily → monthly ("ME").', syntax: `ticks["px"].resample("1min").ohlc()` },
  { term: 'rolling / ewm', cat: 'Time series', module: 8, desc: 'Backward-looking windows and exponential decay.', syntax: `r.rolling(20).std(); r.ewm(halflife=10).std()` },
  { term: 'shift', cat: 'Time series', module: 8, desc: 'Lag (positive) or lead (negative) by n rows. Shift signals before multiplying by returns.', syntax: `strat = signal.shift(1) * ret` },
  { term: 'tz_localize / tz_convert', cat: 'Time series', module: 8, desc: 'Attach a time zone to naive times / convert aware times between zones.', syntax: `idx.tz_localize("UTC").tz_convert("Europe/London")` },
  // ---------- Finance & scale ----------
  { term: 'HAC standard errors', cat: 'Modelling', module: 9, desc: 'Newey–West errors robust to autocorrelation, essential with overlapping returns.', syntax: `smf.ols("y ~ x", d).fit(cov_type="HAC", cov_kwds={"maxlags": 20})` },
  { term: 'Max drawdown', cat: 'Finance', module: 10, desc: 'Largest fall from a running peak of the equity curve.', syntax: `eq = (1 + r).cumprod(); (eq / eq.cummax() - 1).min()` },
  { term: 'Survivorship bias', cat: 'Finance', module: 12, desc: 'Inflated results from testing only on assets that survived to today.', syntax: `# use point-in-time index membership with entry/exit dates` },
  { term: 'Point-in-time data', cat: 'Finance', module: 12, desc: 'Values keyed by when they became known, joined as-of to avoid look-ahead.', syntax: `pd.merge_asof(px, fundamentals, left_on="date", right_on="published", by="sym")` },
  { term: 'Polars LazyFrame', cat: 'Scale', module: 11, desc: 'A query plan optimised before execution; collect() runs it, optionally streaming.', syntax: `pl.scan_parquet("ticks/*.parquet").filter(...).collect(engine="streaming")` },
  { term: 'DuckDB', cat: 'Scale', module: 11, desc: 'In-process analytical SQL over Parquet files and DataFrames.', syntax: `duckdb.sql("SELECT sym, avg(px) FROM 'ticks/*.parquet' GROUP BY sym").df()` },
]
