import type { LangId } from '../../course'

// "Coming from another language" notes for the Data Analytics course.
export const DATA_BRIDGES: Record<number, Partial<Record<LangId, string>>> = {
  1: {
    cpp: 'Closest relatives are Arrow C++ tables and DataFrame libraries like DataFrame (hosseinmoein); pandas is built on NumPy\'s C arrays, with Arrow increasingly underneath. Think of a DataFrame as a struct-of-arrays plus a hash index.',
    ts: 'Like an array of objects pivoted into one typed array per field, plus a key column used to line rows up automatically. Danfo.js and Arquero are the JS takes on it.',
    go: 'Like a struct of []float64 slices that share a key slice. Go has gota and the Arrow Go module, but nothing as central as pandas.',
    java: 'Tablesaw and Joinery are pandas-like libraries for Java; Spark DataFrames are the big-data cousin.',
  },
  2: {
    cpp: '`.loc` is a hash lookup; `.iloc` is `operator[]`. Vectorised column maths compiles to the same tight loops you\'d write by hand, which is why `apply(axis=1)` (a Python call per row) is so much slower.',
    ts: 'Label-inclusive slicing and automatic alignment have no JS analogue. Vectorised ops are like calling `.map` on a typed array, but executed in C.',
    go: 'No equivalent for alignment: in Go you would join maps by key manually. Ranking is `sort.Slice` plus a pass to assign ranks.',
    java: 'Like Streams with `Collectors.groupingBy`, but over whole columns at once and without boxing.',
  },
  3: { cpp: 'Parquet and Arrow IPC files are readable from Arrow C++ with zero-copy, the usual hand-off from Python research to C++ systems.', ts: 'Like `fs` + a CSV parser, but typed columns come back ready; apache-arrow (JS) reads the same Parquet/Arrow data.', go: 'Similar to encoding/csv plus database/sql, with types inferred; Arrow Go reads Parquet.', java: 'Like JDBC ResultSets loaded into columns; Parquet is native to the JVM big-data stack.' },
  4: { cpp: 'Cleaning is where pandas shines over C++: missing values (NaN/NA) are first-class rather than sentinel values you have to agree on.', ts: 'Like optional chaining and `?? default`, but for whole columns.', go: 'Like replacing zero values and sentinel checks with a proper missing marker.', java: 'Like Optional across a whole column, without the boxing.' },
  5: { cpp: '`merge` is a hash join, `merge_asof` is a sorted two-pointer sweep: the same algorithm you\'d write in C++ to match trades to quotes.', ts: 'Like SQL joins on arrays of objects, which in JS you\'d write with Maps.', go: 'Hash joins on map[key] by hand; merge_asof is a two-pointer merge of sorted slices.', java: 'Like SQL JOINs, or Streams with groupingBy and lookups.' },
  6: { cpp: 'No standard plotting in C++; many quant shops write results to Parquet and plot in Python.', ts: 'Like Chart.js or D3, but static by default; Plotly gives interactive charts in both.', go: 'gonum/plot exists; most Go users export and plot elsewhere.', java: 'Like JFreeChart or XChart.' },
  7: { cpp: 'groupby is sort- or hash-based aggregation, an unordered_map<key, accumulator> written for you.', ts: 'Like `Object.groupBy` (ES2024) followed by a reduce per group, but vectorised.', go: 'Like building map[key][]row then reducing each slice.', java: 'Like `Collectors.groupingBy(…, Collectors.summingDouble(…))`.' },
  8: { cpp: 'std::chrono covers time points and zones (C++20); rolling windows are ring buffers you\'d write yourself.', ts: 'Temporal (and libraries like Luxon) handle dates; nothing like resample or rolling exists built in.', go: 'time.Time and time.Location; windows and resampling are hand-written.', java: 'java.time covers the calendar; windowed stats are hand-written or from a library.' },
  9: { cpp: 'statsmodels and scikit-learn sit on BLAS/LAPACK, the same libraries Eigen can call into.', ts: 'No mainstream equivalent of statsmodels in JS.', go: 'gonum/stat covers basic regression.', java: 'Apache Commons Math and Smile cover regression and ML.' },
  10: { cpp: 'The analytics here are typically prototyped in pandas, then reimplemented in C++ for low-latency risk or execution.', ts: 'Financial maths in JS is usually done server-side in Python.', go: 'Go is common for trading infrastructure; analytics usually stay in Python.', java: 'Java dominates many bank risk systems; research usually happens in Python first.' },
  11: { cpp: 'Polars (Rust) and DuckDB (C++) are both native engines; Arrow C++ is the shared memory format, so data moves between them without copying.', ts: 'DuckDB-WASM and Arrow JS bring the same engine to the browser.', go: 'DuckDB and Arrow both have Go bindings.', java: 'DuckDB has a JDBC driver; Arrow Java shares the same format.' },
  12: { cpp: 'Research datasets built here are the inputs C++ backtesters and production systems consume, usually as Parquet.', ts: 'The pipeline is like an ETL job; JS is rarely used for this.', go: 'Go is a good choice for the ingestion services feeding a dataset like this.', java: 'Like a batch ETL pipeline in Spark or Flink, at a smaller scale.' },
}
