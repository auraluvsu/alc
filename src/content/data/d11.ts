import type { Module } from '../types'

export const d11: Module = {
  n: 11,
  title: 'Analysis at Scale: Polars, DuckDB & Arrow',
  tour: 'Added · Scale',
  summary: 'What to reach for when pandas runs out of memory or speed: Polars expressions and lazy queries, DuckDB running SQL directly over Parquet files, Apache Arrow as the shared columnar format underneath, and how C++ fits in.',
  topics: ['Polars expressions', 'Lazy frames & streaming', 'DuckDB over Parquet', 'Apache Arrow', 'Where C++ fits'],
  cpp23: ['Not from the book: Polars 1.x and DuckDB 1.x are the mainstream "beyond pandas" tools.'],
  lessons: [
    {
      id: 'polars',
      title: 'Polars expressions',
      blocks: [
        { kind: 'analogy', text: "pandas is a skilled clerk who does each instruction the moment you give it. Polars is a project manager: you describe the whole job as expressions (\"take close, divide by its previous value, minus one, per symbol\"), and it plans the work across all your CPU cores. No index, no chained assignment, no surprises about copies." },
        { kind: 'code', code: `import polars as pl
import numpy as np

rng = np.random.default_rng(0)
df = pl.DataFrame({
    "sym": np.repeat(["XAU", "XAG"], 500),
    "date": np.tile(np.arange(np.datetime64("2024-01-01"), np.datetime64("2024-01-01") + 500), 2),
    "close": np.r_[2000 * np.exp(rng.normal(0, 0.01, 500).cumsum()), 25 * np.exp(rng.normal(0, 0.02, 500).cumsum())],
})

out = (df
    .sort("sym", "date")
    .with_columns(ret=pl.col("close").pct_change().over("sym"))          # per-symbol returns
    .with_columns(vol20=pl.col("ret").rolling_std(20).over("sym") * np.sqrt(252))
    .filter(pl.col("date") >= pl.date(2024, 6, 1))
    .group_by("sym").agg(pl.col("vol20").mean().alias("avg_vol"), pl.len().alias("n")))` },
        { kind: 'compare',
          python: `df.with_columns(ret=pl.col("close").pct_change().over("sym"))`,
          ts: `// Arquero (JS): table.groupby("sym").derive({ ret: d => op.lag(d.close) ... })`,
          go: `// No mainstream equivalent; Go services usually query DuckDB or read Arrow`,
          java: `// Spark: df.withColumn("ret", col("close").divide(lag("close", 1).over(w)).minus(1))`,
          cpp: `// Arrow C++ compute kernels, or DuckDB's C++ API with SQL window functions`,
          note: 'pandas 3\'s pd.col borrows this expression style.' },
        { kind: 'check', q: 'What does `.over("sym")` do in Polars?', options: ['Sorts by sym', 'Evaluates the expression separately within each sym group, keeping row count', 'Filters sym', 'Joins'], answer: 1, hint: 'Like groupby().transform in pandas.', explain: 'A window function.' },
      ],
    },
    {
      id: 'lazy',
      title: 'Lazy frames & streaming',
      blocks: [
        { kind: 'analogy', text: "A lazy query is a written order handed to the kitchen before anything is cooked. Because the kitchen sees the whole order, it can skip ingredients you never use (column pruning), filter before chopping (predicate pushdown), and cook in batches when the order is bigger than the fridge (streaming)." },
        { kind: 'code', code: `q = (pl.scan_parquet("ticks/*.parquet")             # nothing is read yet
      .filter(pl.col("sym") == "XAU")
      .group_by_dynamic("ts", every="1m")              # 1-minute bars
      .agg(open=pl.col("px").first(), high=pl.col("px").max(),
           low=pl.col("px").min(), close=pl.col("px").last(), volume=pl.col("size").sum()))

print(q.explain())                 # the optimised plan: only sym, ts, px, size are read
bars = q.collect(engine="streaming")   # process in batches: works for data larger than RAM

pdf = bars.to_pandas()             # hand off to pandas, via Arrow` },
        { kind: 'check', q: 'Why is `scan_parquet` + `collect` often much faster than `read_parquet` + filter?', options: ['Different file format', 'The optimiser reads only needed columns and pushes filters into the scan', 'It caches', 'It samples'], answer: 1, hint: 'The kitchen sees the whole order.', explain: 'Eager reads load everything first.' },
      ],
    },
    {
      id: 'duckdb',
      title: 'DuckDB over Parquet',
      blocks: [
        { kind: 'analogy', text: "DuckDB is SQLite for analytics: an in-process database with no server to run, built for scanning millions of rows. Point plain SQL straight at a folder of Parquet files, or at a pandas DataFrame in memory, and get a DataFrame back." },
        { kind: 'code', code: `import duckdb, pandas as pd

trades = pd.DataFrame({"sym": ["XAU", "XAU", "XAG"], "px": [2385.0, 2386.0, 28.4], "qty": [2, 1, 100]})
duckdb.sql("""
    SELECT sym, SUM(px * qty) / SUM(qty) AS vwap, COUNT(*) AS n
    FROM trades GROUP BY sym ORDER BY sym
""").df()                          # queries the pandas variable by name
#    sym         vwap  n
# 0  XAG    28.400000  1
# 1  XAU  2385.333333  2

duckdb.sql("""
    SELECT sym, date_trunc('minute', ts) AS minute,
           arg_min(px, ts) AS open, max(px) AS high, min(px) AS low, arg_max(px, ts) AS close
    FROM read_parquet('ticks/*.parquet')
    WHERE ts >= TIMESTAMP '2026-03-02'
    GROUP BY ALL
""").pl()                          # .df() for pandas, .pl() for Polars, .arrow() for Arrow` },
        { kind: 'check', q: 'What does DuckDB need to query a Parquet folder?', options: ['A database server', 'Nothing: SQL over read_parquet(\'path/*.parquet\') in-process', 'An import step', 'Spark'], answer: 1, hint: 'SQLite for analytics.', explain: 'It streams the files directly.' },
      ],
    },
    {
      id: 'arrow',
      title: 'Apache Arrow',
      blocks: [
        { kind: 'analogy', text: "Arrow is a shipping-container standard for columnar data in memory. pandas (with Arrow dtypes), Polars, DuckDB, Spark, and C++, Rust, Go and Java programs all agree on the container's exact layout, so data can move between them without unpacking and repacking, often without copying a single byte." },
        { kind: 'code', code: `import pyarrow as pa, pyarrow.parquet as pq, pyarrow.compute as pc

tbl = pa.table({"sym": ["XAU", "XAG"], "close": [2385.0, 28.4]})
tbl.schema                         # sym: string, close: double
pc.multiply(tbl["close"], 2)       # Arrow compute kernels (written in C++)

pq.write_table(tbl, "closes.parquet")
pl.from_arrow(tbl)                 # → Polars, zero-copy
tbl.to_pandas(types_mapper=pd.ArrowDtype)   # → pandas with Arrow-backed columns
duckdb.sql("SELECT * FROM tbl")    # DuckDB reads Arrow tables directly` },
        { kind: 'check', q: 'Why does Arrow make moving data between tools cheap?', options: ['Compression', 'Every tool uses the same in-memory columnar layout, so no conversion is needed', 'It uses JSON', 'It caches on disk'], answer: 1, hint: 'Shipping containers.', explain: 'Often zero-copy.' },
      ],
    },
    {
      id: 'cpp',
      title: 'Where C++ fits',
      blocks: [
        { kind: 'analogy', text: "The research kitchen (Python) and the production line (C++) should use the same pantry. Write research datasets as Parquet or Arrow IPC files, and the C++ backtester, risk engine or feature service reads exactly the same bytes, with the same types, without a hand-written CSV parser to get wrong." },
        { kind: 'code', code: `#include <arrow/api.h>
#include <arrow/io/api.h>
#include <parquet/arrow/reader.h>

arrow::Status ReadCloses() {
    ARROW_ASSIGN_OR_RAISE(auto infile, arrow::io::ReadableFile::Open("closes.parquet"));
    ARROW_ASSIGN_OR_RAISE(auto reader, parquet::arrow::OpenFile(infile, arrow::default_memory_pool()));
    std::shared_ptr<arrow::Table> table;
    ARROW_RETURN_NOT_OK(reader->ReadTable(&table));
    auto close = std::static_pointer_cast<arrow::DoubleArray>(table->GetColumnByName("close")->chunk(0));
    for (int64_t i = 0; i < close->length(); ++i) { /* close->Value(i) */ }
    return arrow::Status::OK();
}
// DuckDB also has a C++ API: duckdb::DuckDB db; duckdb::Connection con(db); con.Query("SELECT ...");`, lang: 'cpp', caption: 'Reading the same Parquet file from C++ with Apache Arrow.' },
        { kind: 'list', items: [
          '**Polars** is written in Rust and **DuckDB** in C++; both are libraries you can embed in native programs too.',
          'Use Python for research and orchestration; move a hot path to C++ only when profiling says so, and keep the data contract (schema) identical on both sides.',
        ] },
        { kind: 'check', q: 'What\'s the cleanest hand-off format from Python research to a C++ engine?', options: ['CSV', 'Parquet or Arrow IPC with a fixed schema', 'Pickle', 'Excel'], answer: 1, hint: 'Same pantry.', explain: 'Typed, columnar and readable natively in C++.' },
      ],
    },
  ],
  quiz: [
    { q: 'Polars is written in…', options: ['C++', 'Rust', 'Go', 'Java'], answer: 1, explain: 'With a Python API.' },
    { q: 'Polars equivalent of groupby().transform()?', options: ['.agg', '.over(...)', '.pivot', '.explode'], answer: 1, explain: 'Window expressions.' },
    { q: 'What does `scan_parquet` return?', options: ['A DataFrame', 'A LazyFrame (query plan)', 'A list', 'An Arrow table'], answer: 1, explain: 'Call .collect().' },
    { q: 'Predicate pushdown means…', options: ['Sorting first', 'Applying filters while reading, skipping unneeded data', 'Pushing to a server', 'Caching'], answer: 1, explain: 'Less I/O.' },
    { q: 'DuckDB runs…', options: ['As a separate server', 'In-process', 'Only on GPUs', 'Only in the cloud'], answer: 1, explain: 'Like SQLite.' },
    { q: 'Can DuckDB query a pandas DataFrame by variable name?', options: ['No', 'Yes', 'Only after export', 'Only with Spark'], answer: 1, explain: 'Replacement scans.' },
    { q: 'Apache Arrow is…', options: ['A file compressor', 'A standard in-memory columnar format', 'A database', 'A plotting library'], answer: 1, explain: 'Parquet is its on-disk cousin.' },
    { q: 'Best hand-off from Python to C++?', options: ['CSV', 'Parquet/Arrow', 'Pickle', 'JSON'], answer: 1, explain: 'Typed and native in both.' },
  ],
}
