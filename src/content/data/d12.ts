import type { Module } from '../types'

export const d12: Module = {
  n: 12,
  title: 'Case Study: A Research Dataset',
  tour: '13 · Data Analysis Examples',
  summary: 'Building a clean daily equity panel end to end, the way a quant research team would: ingestion with validation, corporate-action adjustments, survivorship-free universes, point-in-time joins, feature panels, and versioned storage.',
  topics: ['Ingestion & validation', 'Corporate actions', 'Survivorship bias', 'Point-in-time data', 'Feature panels & storage'],
  cpp23: ['The book ends with worked examples on public datasets; this module applies the same approach to market data.'],
  lessons: [
    {
      id: 'ingest',
      title: 'Ingestion & validation',
      blocks: [
        { kind: 'analogy', text: "Treat every vendor file like a delivery at a loading bay: check it against the manifest before it goes on the shelf. Expected columns and types, no duplicate (date, symbol) pairs, prices positive, highs above lows. A failed check stops the line; a bad file silently shelved poisons every study that touches it." },
        { kind: 'code', code: `import pandas as pd, numpy as np

SCHEMA = {"date": "datetime64[us]", "sym": "str", "open": "float64", "high": "float64",
          "low": "float64", "close": "float64", "volume": "int64"}

def validate(df: pd.DataFrame) -> pd.DataFrame:
    missing = set(SCHEMA) - set(df.columns)
    assert not missing, f"missing columns: {missing}"
    df = df.astype(SCHEMA)
    problems = {
        "duplicate keys": df.duplicated(["date", "sym"]).sum(),
        "non-positive prices": (df[["open", "high", "low", "close"]] <= 0).any(axis=1).sum(),
        "high < low": (df["high"] < df["low"]).sum(),
        "close outside range": ((df["close"] > df["high"]) | (df["close"] < df["low"])).sum(),
        "negative volume": (df["volume"] < 0).sum(),
    }
    bad = {k: int(v) for k, v in problems.items() if v}
    if bad:
        raise ValueError(f"validation failed: {bad}")
    return df.sort_values(["sym", "date"]).reset_index(drop=True)` },
        { kind: 'check', q: 'Why fail loudly instead of silently dropping bad rows?', options: ['Speed', 'Silent fixes hide vendor problems that may affect many other rows and studies', 'pandas requires it', 'To save disk'], answer: 1, hint: 'What else came in that delivery?', explain: 'Investigate, then decide on an explicit, logged fix.' },
      ],
    },
    {
      id: 'corporate',
      title: 'Corporate actions',
      blocks: [
        { kind: 'analogy', text: "A 4-for-1 split turns one £400 share into four £100 shares. Nothing of value happened, but the raw price chart shows a 75% crash. Adjusted prices rewrite history in today's units so returns are continuous. Dividends work the same way: the price drops by the dividend on the ex-date, but holders didn't lose anything." },
        { kind: 'code', code: `raw = pd.DataFrame({
    "date": pd.bdate_range("2026-06-01", periods=6),
    "close": [400.0, 404.0, 408.0, 102.5, 103.0, 102.0],    # 4:1 split effective day 4
})
splits = pd.Series({pd.Timestamp("2026-06-04"): 4.0})

def adjustment_factor(dates, splits):
    f = pd.Series(1.0, index=dates)
    for d, ratio in splits.items():
        f[f.index < d] /= ratio                        # scale history BEFORE the split
    return f

raw["adj_close"] = raw["close"] * adjustment_factor(raw["date"], splits).to_numpy()
raw["ret_raw"] = raw["close"].pct_change()             # -74.9% on the split day: fake
raw["ret_adj"] = raw["adj_close"].pct_change()         # +0.49%: the real move` },
        { kind: 'pitfall', text: 'Backward-adjusted prices change every time a new split or dividend happens, so yesterday\'s file and today\'s disagree about 2019. Store raw prices plus an adjustment-factor table, and compute adjusted series on demand. Also, don\'t use adjusted prices for anything that depends on the real price level (tick sizes, "price < $5" filters).' },
        { kind: 'check', q: 'Why does the raw return show −75% on the split day?', options: ['A crash', 'The share count quadrupled and the price quartered; no value changed', 'A data error', 'A dividend'], answer: 1, hint: 'Same pizza, more slices.', explain: 'Adjusted prices fix the discontinuity.' },
      ],
    },
    {
      id: 'survivorship',
      title: 'Survivorship bias',
      blocks: [
        { kind: 'analogy', text: "Judging a strategy on today's index members is like studying successful restaurants by visiting only the ones still open: every failure has been removed from the sample. A universe must be reconstructed as it was on each historical date, including companies that later went bust, were acquired or were delisted." },
        { kind: 'code', code: `# Index membership with entry and exit dates (exit NaT = still a member)
members = pd.DataFrame({
    "sym":   ["AAA", "BBB", "CCC", "DDD"],
    "start": pd.to_datetime(["2015-01-02", "2015-01-02", "2018-03-01", "2015-01-02"]),
    "end":   pd.to_datetime([None, "2020-06-30", None, "2022-11-15"]),   # BBB, DDD left
})

def universe_on(date: pd.Timestamp) -> list[str]:
    alive = (members["start"] <= date) & (members["end"].isna() | (members["end"] > date))
    return members.loc[alive, "sym"].tolist()

universe_on(pd.Timestamp("2019-01-02"))    # ['AAA', 'BBB', 'CCC', 'DDD']
universe_on(pd.Timestamp("2026-01-02"))    # ['AAA', 'CCC']

# Delisting returns matter too: a stock delisted for bankruptcy has a final return near −100%,
# which disappears if you simply stop at its last traded price.` },
        { kind: 'check', q: 'Backtesting on today\'s S&P 500 members over 2010–2026 tends to…', options: ['Understate returns', 'Overstate returns, because losers that left the index are excluded', 'Have no effect', 'Only affect volatility'], answer: 1, hint: 'Visiting only restaurants still open.', explain: 'Use point-in-time membership.' },
      ],
    },
    {
      id: 'pit',
      title: 'Point-in-time data',
      blocks: [
        { kind: 'analogy', text: "Quarterly earnings for the period ending 31 March aren't known on 31 March; they're published weeks later and sometimes revised later still. Point-in-time data stores *when each value became known*, so on any historical date you can see exactly what an investor could have seen then, and nothing more." },
        { kind: 'code', code: `fundamentals = pd.DataFrame({
    "sym": ["AAA", "AAA", "AAA"],
    "period_end": pd.to_datetime(["2025-12-31", "2026-03-31", "2026-03-31"]),
    "published": pd.to_datetime(["2026-02-20", "2026-05-08", "2026-06-15"]),   # last row = restatement
    "eps": [1.10, 1.25, 1.18],
}).sort_values("published")

prices = pd.DataFrame({"sym": "AAA", "date": pd.bdate_range("2026-05-01", "2026-06-30")})

pit = pd.merge_asof(prices.sort_values("date"), fundamentals,
                    left_on="date", right_on="published", by="sym", direction="backward")
pit.loc[pit["date"] == "2026-05-05", "eps"].item()   # 1.10: Q1 not yet published
pit.loc[pit["date"] == "2026-05-11", "eps"].item()   # 1.25: original Q1 figure
pit.loc[pit["date"] == "2026-06-16", "eps"].item()   # 1.18: after the restatement` },
        { kind: 'check', q: 'Which date should fundamentals be joined on?', options: ['Period end', 'The date the figure was published (or restated)', 'Today', 'Fiscal year start'], answer: 1, hint: 'What could an investor see then?', explain: 'Joining on period end leaks weeks of future information.' },
      ],
    },
    {
      id: 'features',
      title: 'Feature panels & storage',
      blocks: [
        { kind: 'analogy', text: "The finished dataset is a well-labelled pantry: one long table keyed by (date, symbol), each feature a column computed only from information available on that date, the target computed separately and clearly marked as the future. Version it, so a result from last month can be reproduced exactly." },
        { kind: 'code', code: `def build_features(panel: pd.DataFrame) -> pd.DataFrame:
    g = panel.groupby("sym", group_keys=False)
    out = panel.assign(
        ret_1d=g["adj_close"].pct_change(),
        mom_12_1=g["adj_close"].transform(lambda s: s.shift(21) / s.shift(252) - 1),   # skip the last month
        vol_60d=g["adj_close"].transform(lambda s: s.pct_change().rolling(60).std()),
        dollar_vol_20d=g.apply(lambda d: (d["close"] * d["volume"]).rolling(20).mean()),
    )
    out["fwd_ret_21d"] = g["adj_close"].transform(lambda s: s.shift(-21) / s - 1)   # TARGET only
    return out

# feats = build_features(panel)
# feats.to_parquet(f"features/v{VERSION}/", partition_cols=["year"])
# Record alongside it: code commit, source file hashes, build date, and the universe definition.` },
        { kind: 'list', items: [
          'Keep **raw**, **cleaned** and **feature** layers separate; never overwrite raw data.',
          'Name forward-looking columns unmistakably (`fwd_`) and keep them out of feature lists by construction.',
          'Re-run the whole pipeline from raw files in CI: if it isn\'t reproducible, it isn\'t research.',
        ] },
        { kind: 'check', q: 'Why does `mom_12_1` use `s.shift(21) / s.shift(252)`?', options: ['Typo', 'Classic 12-month momentum skipping the most recent month (short-term reversal)', 'To include the future', 'For speed'], answer: 1, hint: 'Months 2–12.', explain: 'The most recent month tends to reverse, so it\'s excluded.' },
      ],
    },
  ],
  quiz: [
    { q: 'What should happen when a vendor file fails validation?', options: ['Drop bad rows silently', 'Stop and investigate, then apply an explicit fix', 'Ignore it', 'Fill with zeros'], answer: 1, explain: 'Loud failures protect every downstream study.' },
    { q: 'A 2:1 split without adjustment shows…', options: ['No change', 'A fake −50% return', 'A +100% return', 'NaN'], answer: 1, explain: 'Use adjustment factors.' },
    { q: 'Why store raw prices plus factors rather than adjusted prices only?', options: ['Smaller', 'Adjusted history changes with each new corporate action', 'Faster', 'Legal'], answer: 1, explain: 'Reproducibility.' },
    { q: 'Survivorship bias comes from…', options: ['Using adjusted prices', 'Excluding firms that later disappeared', 'Using log returns', 'Time zones'], answer: 1, explain: 'Rebuild historical universes.' },
    { q: 'Point-in-time joins use…', options: ['Period end dates', 'Publication (knowledge) dates with an as-of join', 'Random dates', 'Fiscal years'], answer: 1, explain: 'merge_asof backward.' },
    { q: 'A restated earnings figure should…', options: ['Overwrite history', 'Apply only from its publication date', 'Be ignored', 'Apply to all dates'], answer: 1, explain: 'Earlier dates saw the original.' },
    { q: 'Forward-return columns are for…', options: ['Features', 'Targets/labels only', 'Plotting only', 'Nothing'], answer: 1, explain: 'Keep them out of features.' },
    { q: 'What makes research reproducible?', options: ['Screenshots', 'Versioned data, code commits and a pipeline re-runnable from raw files', 'Excel', 'Memory'], answer: 1, explain: 'Rebuild from scratch.' },
  ],
}
