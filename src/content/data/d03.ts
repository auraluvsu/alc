import type { Module } from '../types'

export const d03: Module = {
  n: 3,
  title: 'Loading, Storage & File Formats',
  tour: '6 · Data Loading, Storage & File Formats',
  summary: 'Getting data in and out correctly: CSV with the right types and dates, Parquet and Arrow for anything you\'ll read twice, SQL databases, JSON from web APIs, and processing files too big for memory.',
  topics: ['CSV done properly', 'Parquet & Arrow', 'SQL databases', 'JSON & web APIs', 'Chunking big files'],
  cpp23: [
    '`dtype_backend="pyarrow"` gives Arrow-backed columns throughout (2.0).',
    'pandas 3 parses datetimes at microsecond resolution by default rather than nanoseconds.',
  ],
  lessons: [
    {
      id: 'csv',
      title: 'CSV done properly',
      blocks: [
        { kind: 'analogy', text: "A CSV file is a letter written without punctuation rules: is `01/02/2026` the 1st of February or the 2nd of January? Is `NA` a ticker or a missing value? `read_csv` guesses, and its guesses are usually right. Your job is to remove the guessing for anything that matters: dates, types, missing markers and which column is the index." },
        { kind: 'code', code: `import pandas as pd
from io import StringIO

raw = StringIO("""time,sym,price,size,venue
2026-03-02 08:00:00.125,XAU,2385.10,5,LBMA
2026-03-02 08:00:00.410,XAU,2385.30,2,
2026-03-02 08:00:01.002,XAG,28.41,100,COMEX
""")
ticks = pd.read_csv(
    raw,
    parse_dates=["time"],                 # → datetime64[us]
    index_col="time",
    dtype={"sym": "category", "size": "int32"},
    na_values=["", "N/A"],               # what counts as missing
    usecols=["time", "sym", "price", "size", "venue"],
)
ticks.dtypes        # sym: category, price: float64, size: int32, venue: str

pd.read_csv("eu.csv", sep=";", decimal=",", thousands=".")   # European number formats
pd.read_csv("big.csv", nrows=1000)                           # peek before a full load
pd.read_csv("dates.csv", parse_dates=["d"], date_format="%d/%m/%Y")   # explicit, unambiguous

ticks.to_csv("out.csv", index=True, float_format="%.4f")` },
        { kind: 'pitfall', text: 'Ticker "NA" (Nasdaq-listed) and the ISO country code for Namibia both get read as missing by default, because `"NA"` is in pandas\' default missing-value list. For symbol columns, pass `keep_default_na=False` and list your own `na_values`.' },
        { kind: 'check', q: 'A vendor sends dates like 03/04/2026 meaning 3 April. What should you do?', options: ['Trust the default parser', 'Pass an explicit date_format="%d/%m/%Y"', 'Parse as strings forever', 'Use dayfirst=False'], answer: 1, hint: 'Remove the guessing.', explain: 'Explicit formats are faster and unambiguous.' },
      ],
    },
    {
      id: 'parquet',
      title: 'Parquet & Arrow',
      blocks: [
        { kind: 'analogy', text: "CSV is a handwritten ledger: anyone can read it, but every read means interpreting every character again. Parquet is a well-indexed filing cabinet: columns stored separately, compressed, with their types written on the drawer. You can pull out just the `close` drawer without touching the others." },
        { kind: 'code', code: `bars.to_parquet("xau_1m.parquet", compression="zstd")
bars = pd.read_parquet("xau_1m.parquet", columns=["close", "volume"])   # only what you need

# Partitioned datasets: one folder per value, read with filters (predicate pushdown)
bars.to_parquet("bars/", partition_cols=["sym"])
gold = pd.read_parquet("bars/", filters=[("sym", "==", "XAU")])

# Arrow-backed dtypes: faster strings, real nullable ints, zero-copy to other tools
df = pd.read_parquet("bars/", dtype_backend="pyarrow")
df.dtypes            # close: double[pyarrow], volume: int64[pyarrow], ...

df.to_feather("bars.feather")    # Arrow IPC: fastest round-trip, larger files` },
        { kind: 'list', items: [
          'Parquet keeps dtypes (timestamps with time zones, categoricals, nullable ints), so a round-trip is lossless, unlike CSV.',
          'Typical sizes: a CSV of minute bars shrinks 5–10× as zstd Parquet and loads many times faster.',
          'Parquet and Arrow are readable from C++, Rust, Go, Java and DuckDB without conversion (module 11).',
        ] },
        { kind: 'check', q: 'Why does `read_parquet(columns=["close"])` save work?', options: ['It caches', 'Parquet stores columns separately, so other columns are never read', 'It samples rows', 'It skips the index'], answer: 1, hint: 'Separate drawers.', explain: 'Columnar formats make column selection almost free.' },
      ],
    },
    {
      id: 'sql',
      title: 'SQL databases',
      blocks: [
        { kind: 'analogy', text: "pandas and a database are a warehouse and a delivery van. Let the warehouse (SQL) do the filtering and joining it's built for, and only load the van with the rows you'll actually analyse." },
        { kind: 'code', code: `import sqlite3
from sqlalchemy import create_engine

con = sqlite3.connect(":memory:")
pd.DataFrame({"sym": ["XAU", "XAG"], "close": [2385.0, 28.4]}).to_sql("prices", con, index=False)
pd.read_sql("SELECT sym, close FROM prices WHERE close > ?", con, params=(100,))
#   sym   close
# 0  XAU  2385.0

engine = create_engine("postgresql+psycopg://user@host/markets")   # any SQLAlchemy URL
fills = pd.read_sql(
    "SELECT * FROM fills WHERE trade_date >= %(start)s",
    engine, params={"start": "2026-01-01"}, parse_dates=["ts"],
)
fills.to_sql("fills_clean", engine, if_exists="append", index=False, chunksize=10_000)` },
        { kind: 'pitfall', text: 'Never build SQL by f-string with values (`f"... WHERE sym = \'{sym}\'"`). Pass parameters with `params=` so the driver escapes them. It\'s both safer and faster.' },
        { kind: 'check', q: 'Where should a filter on 500 million rows run?', options: ['In pandas after loading', 'In the SQL query', 'In a Python loop', 'In Excel'], answer: 1, hint: 'Warehouse vs van.', explain: 'Only transfer what you need.' },
      ],
    },
    {
      id: 'json',
      title: 'JSON & web APIs',
      blocks: [
        { kind: 'analogy', text: "API responses are parcels of nested boxes: a list of trades, each with a nested instrument, each with a nested exchange. `json_normalize` unpacks the boxes into a flat table, turning nested keys into dotted column names." },
        { kind: 'code', code: `import json

payload = json.loads("""{"trades": [
  {"id": 1, "px": 2385.1, "qty": 2, "inst": {"sym": "XAU", "venue": "LBMA"}},
  {"id": 2, "px": 28.41, "qty": 100, "inst": {"sym": "XAG", "venue": "COMEX"}}
]}""")
trades = pd.json_normalize(payload["trades"])
trades.columns.tolist()     # ['id', 'px', 'qty', 'inst.sym', 'inst.venue']

pd.read_json("ticks.jsonl", lines=True)   # newline-delimited JSON, common for logs and streams
trades.to_json("trades.json", orient="records", date_format="iso")

# From an HTTP API (requests/httpx), then normalise:
# r = httpx.get(url, params={"symbol": "XAU"}, timeout=10); r.raise_for_status()
# df = pd.json_normalize(r.json()["data"])` },
        { kind: 'check', q: 'What does json_normalize do with `{"inst": {"sym": "XAU"}}`?', options: ['Drops it', 'Creates an inst.sym column', 'Stores a dict in one column', 'Raises'], answer: 1, hint: 'Unpacking the nested box.', explain: '`sep="_"` changes the separator.' },
      ],
    },
    {
      id: 'chunks',
      title: 'Files bigger than memory',
      blocks: [
        { kind: 'analogy', text: "Eating an elephant one bite at a time. `chunksize` turns a huge CSV into an iterator of manageable DataFrames, and you fold each bite into a running result, keeping only the summary in memory." },
        { kind: 'code', code: `from collections import defaultdict

volume = defaultdict(int)
for chunk in pd.read_csv("ticks_2025.csv", usecols=["sym", "size"],
                         dtype={"sym": "category"}, chunksize=1_000_000):
    for sym, v in chunk.groupby("sym", observed=True)["size"].sum().items():
        volume[sym] += v

pd.Series(volume).sort_values(ascending=False).head()

# Better still: convert once to Parquet, then use DuckDB or Polars (module 11),
# which stream through files far larger than RAM with plain SQL or expressions.` },
        { kind: 'list', items: [
          'Shrink before you scale: `usecols`, `category` for repeated strings, `float32` where precision allows.',
          '`df.memory_usage(deep=True).sum()` tells you what a frame really costs.',
          'Aggregations that combine (sum, count, min, max) chunk easily; medians and exact quantiles don\'t.',
        ] },
        { kind: 'check', q: 'Which statistic can\'t be combined exactly from per-chunk results?', options: ['Sum', 'Count', 'Median', 'Max'], answer: 2, hint: 'Can you merge two medians into one?', explain: 'Means work if you keep sums and counts.' },
      ],
    },
  ],
  quiz: [
    { q: 'Which read_csv argument makes a column a DatetimeIndex?', options: ['dtype', 'parse_dates + index_col', 'usecols', 'sep'], answer: 1, explain: 'Parse it, then index by it.' },
    { q: 'Why may the ticker "NA" disappear?', options: ['Bug', '"NA" is a default missing-value marker', 'Encoding', 'It is reserved'], answer: 1, explain: 'Use keep_default_na=False.' },
    { q: 'Main advantages of Parquet over CSV?', options: ['Human-readable', 'Typed, compressed, columnar and fast', 'Smaller code', 'Works in Excel'], answer: 1, explain: 'The default for research data.' },
    { q: 'What does `filters=` do in read_parquet?', options: ['Sorts', 'Skips partitions/row groups that can\'t match', 'Drops NaN', 'Renames'], answer: 1, explain: 'Predicate pushdown.' },
    { q: 'How should values be passed to SQL queries?', options: ['f-strings', 'params=', 'concatenation', 'format()'], answer: 1, explain: 'Avoids injection.' },
    { q: 'What reads newline-delimited JSON?', options: ['read_json(lines=True)', 'read_csv', 'json.load', 'read_table'], answer: 0, explain: 'JSONL.' },
    { q: 'chunksize in read_csv returns…', options: ['A DataFrame', 'An iterator of DataFrames', 'A list of strings', 'A generator of rows'], answer: 1, explain: 'Process each chunk.' },
    { q: 'What reports real memory use including strings?', options: ['df.size', 'df.memory_usage(deep=True)', 'df.info() only', 'sys.getsizeof'], answer: 1, explain: 'deep=True counts objects.' },
  ],
}
