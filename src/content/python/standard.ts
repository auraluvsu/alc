import type { StdEntry } from '../standard'

// The most useful functions and methods in Python's standard library.
export const PY_STANDARD: StdEntry[] = [
  // ---------------- Built-ins ----------------
  {
    name: 'enumerate / zip', header: 'built-in', cat: 'Built-ins', module: 2,
    summary: 'Loop with an index, or over several iterables in step.',
    what: '`enumerate(it, start=0)` yields `(index, item)`. `zip(a, b, ...)` yields tuples of corresponding items and stops at the shortest; `strict=True` raises if the lengths differ.',
    code: `for i, sym in enumerate(watchlist, start=1):
    print(i, sym)

for sym, px in zip(symbols, prices, strict=True):
    print(sym, px)

rets = [b / a - 1 for a, b in zip(closes, closes[1:])]   # pairwise`,
    when: 'Any loop that needs an index or walks parallel lists. Never write `for i in range(len(x))` just to index.',
  },
  {
    name: 'sorted / min / max (key=)', header: 'built-in', cat: 'Built-ins', module: 2,
    summary: 'Sort or find extremes by any criterion.',
    what: 'All three accept `key=`, a function giving the value to compare. `sorted` returns a new list; `min`/`max` accept `default=` for empty inputs.',
    code: `top5 = sorted(trades, key=lambda t: t.pnl, reverse=True)[:5]
best = max(trades, key=lambda t: t.pnl)
cheapest = min(quotes, key=lambda q: q.ask, default=None)

from operator import attrgetter
by_sym_px = sorted(trades, key=attrgetter("sym", "px"))`,
    when: 'Ranking, choosing the best or worst item, multi-key ordering.',
  },
  {
    name: 'sum / any / all', header: 'built-in', cat: 'Built-ins', module: 2,
    summary: 'Reduce an iterable to a total or a yes/no answer.',
    what: '`sum(it, start=0)` adds; `any`/`all` short-circuit. They pair naturally with generator expressions, so no list is built.',
    code: `total_pnl = sum(t.pnl for t in trades)
has_gap   = any(b.volume == 0 for b in bars)
all_pos   = all(p > 0 for p in prices)
import math
math.fsum([0.1] * 10)        # 1.0: accurate float summation`,
    when: 'Totals and validation checks. Use `math.fsum` when float precision matters.',
  },
  {
    name: 'isinstance', header: 'built-in', cat: 'Built-ins', module: 13,
    summary: 'Check an object\'s type (including ABCs and unions).',
    what: 'Returns True if the object is an instance of the class (or a subclass). Accepts tuples, `X | Y` unions and ABCs like `collections.abc.Mapping`.',
    code: `if isinstance(x, (int, float)): ...
if isinstance(x, int | float): ...
from collections.abc import Mapping
if isinstance(cfg, Mapping): ...     # dict, frozendict, MappingProxyType...`,
    when: 'Input validation and dispatch at boundaries. Inside your own code, prefer duck typing or `match`.',
  },

  // ---------------- Collections ----------------
  {
    name: 'collections.defaultdict', header: 'collections', cat: 'Collections', module: 3,
    summary: 'A dict that creates missing values automatically.',
    what: 'Calls the factory (e.g. `list`, `int`, `set`) when a missing key is accessed with `[]`, and stores the result.',
    code: `from collections import defaultdict
by_sym = defaultdict(list)
for t in trades:
    by_sym[t.sym].append(t)

volume = defaultdict(int)
for t in trades:
    volume[t.sym] += t.qty`,
    when: 'Grouping and accumulating. Remember that reads create entries too.',
  },
  {
    name: 'collections.Counter', header: 'collections', cat: 'Collections', module: 3,
    summary: 'Count things in one line.',
    what: 'A dict subclass mapping items to counts. `most_common(n)` ranks them, missing keys read as 0, and counters support `+ - & |` (and `^` in 3.15).',
    code: `from collections import Counter
sides = Counter(t.side for t in trades)
sides.most_common(1)            # [('BUY', 812)]
errors = Counter(line.split()[2] for line in log if "ERROR" in line)`,
    when: 'Frequencies, histograms and tallies.',
  },
  {
    name: 'collections.deque', header: 'collections', cat: 'Collections', module: 2,
    summary: 'Fast queue and fixed-size rolling window.',
    what: 'O(1) `append`/`appendleft`/`pop`/`popleft`. With `maxlen`, adding to a full deque drops items from the other end.',
    code: `from collections import deque
window = deque(maxlen=20)
for px in feed:
    window.append(px)
    if len(window) == 20:
        sma = sum(window) / 20

queue = deque(); queue.append(job); job = queue.popleft()`,
    when: 'FIFO queues, rolling windows, BFS. Use `list` only for stack-like (end-only) access.',
  },
  {
    name: 'heapq', header: 'heapq', cat: 'Collections', module: 2,
    summary: 'A priority queue on a plain list.',
    what: '`heappush` and `heappop` keep the smallest item at index 0 in O(log n). `nlargest`/`nsmallest` find top-k efficiently.',
    code: `import heapq
asks = []
heapq.heappush(asks, (2390.7, "o1"))
heapq.heappush(asks, (2390.5, "o2"))
best_px, oid = asks[0]                      # lowest ask
heapq.heappop(asks)
top = heapq.nlargest(5, trades, key=lambda t: t.pnl)`,
    when: 'Order books, schedulers, top-k queries over big streams. It is a min-heap; negate keys for a max-heap.',
  },
  {
    name: 'bisect', header: 'bisect', cat: 'Collections', module: 2,
    summary: 'Binary search and sorted insertion.',
    what: '`bisect_left` and `bisect_right` find insertion points in O(log n); `insort` inserts keeping the list sorted. Both accept `key=` (3.10).',
    code: `import bisect
levels = [2380, 2385, 2390, 2395]
i = bisect.bisect_left(levels, 2391)     # 3
bisect.insort(levels, 2391)
idx = bisect.bisect_right(times, t) - 1  # last bar at or before t`,
    when: 'Lookups in sorted lists such as time series, price ladders and grade bands.',
  },
  {
    name: 'itertools.groupby / chain / islice', header: 'itertools', cat: 'Collections', module: 17,
    summary: 'Lazy building blocks for iteration.',
    what: '`chain` concatenates iterables, `islice` slices any iterator lazily, `groupby` groups **consecutive** equal keys (sort first), `pairwise` yields neighbours, `batched` chunks.',
    code: `from itertools import chain, islice, groupby, pairwise, batched
for t in chain(trades_a, trades_b): ...
first_100 = list(islice(stream, 100))
for day, bars in groupby(sorted(bars, key=day_of), key=day_of): ...
rets = [b / a - 1 for a, b in pairwise(closes)]`,
    when: 'Streaming data without building intermediate lists.',
  },

  // ---------------- Text & data ----------------
  {
    name: 'str.split / join / strip', header: 'str', cat: 'Text & data', module: 4,
    summary: 'The everyday string toolkit.',
    what: '`split()` (on whitespace) or `split(sep)`, `"sep".join(items)`, `strip()` and friends, `partition(sep)` for a single split, `startswith`/`endswith` (accepting tuples).',
    code: `parts = line.strip().split(",")
base, _, quote = "XAU/USD".partition("/")
", ".join(syms)
if sym.startswith(("XA", "XP")): ...
s.removeprefix("PRICE ")`,
    when: 'Parsing simple formats and cleaning input. Use `csv` for real CSV.',
  },
  {
    name: 'csv.DictReader / writer', header: 'csv', cat: 'Text & data', module: 4,
    summary: 'Read and write CSV correctly (quotes, commas inside fields).',
    what: '`DictReader` yields one dict per row keyed by the header; `writer`/`DictWriter` write rows. Open files with `newline=""`.',
    code: `import csv
with open("trades.csv", newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        px = float(row["price"])

with open("out.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["sym", "px"])
    w.writerows((t.sym, t.px) for t in trades)`,
    when: 'Any CSV. Splitting on commas yourself breaks on quoted fields.',
  },
  {
    name: 'json.loads / dumps', header: 'json', cat: 'Text & data', module: 3,
    summary: 'Convert between JSON text and Python objects.',
    what: '`loads`/`load` parse to dicts, lists, strs, numbers, bools and None. `dumps`/`dump` serialise. `indent=` pretty-prints and `default=` handles extra types.',
    code: `import json
data = json.loads(resp_text)
text = json.dumps(payload, indent=2, sort_keys=True)
with open("cfg.json", encoding="utf-8") as f:
    cfg = json.load(f)
json.dumps(obj, default=str)          # fallback for dates, Decimals...`,
    when: 'APIs, configs, logs. For dataclasses, convert with `dataclasses.asdict` first.',
  },
  {
    name: 'pathlib.Path', header: 'pathlib', cat: 'Text & data', module: 4,
    summary: 'Object-oriented file paths and file I/O.',
    what: '`/` joins paths. Methods cover reading and writing, globbing, stats and directory creation, and they work cross-platform.',
    code: `from pathlib import Path
data = Path("data")
data.mkdir(parents=True, exist_ok=True)
for csv_file in sorted(data.glob("**/*.csv")):
    print(csv_file.stem, csv_file.stat().st_size)
text = (data / "notes.md").read_text(encoding="utf-8")`,
    when: 'Everything path-related. It replaces most of `os.path`.',
  },
  {
    name: 're.search / findall / compile', header: 're', cat: 'Text & data', module: 4,
    summary: 'Regular expressions.',
    what: '`search` finds the first match anywhere, `fullmatch` requires the whole string, `findall`/`finditer` find all matches, `sub` replaces. Compile patterns you reuse, and use raw strings `r"..."`.',
    code: `import re
PAIR = re.compile(r"(?P<base>[A-Z]{3})/(?P<quote>[A-Z]{3})")
if m := PAIR.search(line):
    print(m["base"], m["quote"])
re.findall(r"\\d+\\.\\d+", text)
re.sub(r"\\s+", " ", messy)`,
    when: 'Pattern extraction and validation. For fixed substrings, plain str methods are faster and clearer.',
  },
  {
    name: 'datetime & zoneinfo', header: 'datetime, zoneinfo', cat: 'Text & data', module: 4,
    summary: 'Timestamps, time zones and date arithmetic.',
    what: 'Use timezone-aware datetimes. `ZoneInfo("Europe/London")` handles DST. `fromisoformat` / `isoformat` round-trip ISO 8601, and `timedelta` does arithmetic.',
    code: `from datetime import datetime, timedelta, UTC
from zoneinfo import ZoneInfo
now = datetime.now(UTC)
london = now.astimezone(ZoneInfo("Europe/London"))
t = datetime.fromisoformat("2026-11-05T14:30:00+00:00")
week_ago = now - timedelta(days=7)
f"{london:%Y-%m-%d %H:%M}"`,
    when: 'Anything with times. Naive datetimes (no tzinfo) are the root of many trading-session bugs.',
  },
  {
    name: 'decimal.Decimal', header: 'decimal', cat: 'Text & data', module: 4,
    summary: 'Exact decimal arithmetic for money.',
    what: 'Base-10 numbers with configurable precision and rounding, so 0.1 + 0.2 == 0.3. Construct from strings, not floats.',
    code: `from decimal import Decimal, ROUND_HALF_UP
px = Decimal("2390.55")
fee = (px * Decimal("0.001")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
Decimal("0.1") + Decimal("0.2") == Decimal("0.3")   # True`,
    when: 'Money, invoices, P&L reporting. Use floats (or NumPy) for statistics and simulation.',
  },

  // ---------------- Functions & classes ----------------
  {
    name: 'functools.cache / lru_cache', header: 'functools', cat: 'Functions & classes', module: 9,
    summary: 'Memoise expensive pure functions.',
    what: 'Stores results keyed by arguments (which must be hashable). `lru_cache(maxsize=n)` bounds memory; `.cache_info()` shows hit rates.',
    code: `from functools import cache, lru_cache
@cache
def contract_spec(sym: str) -> dict: ...

@lru_cache(maxsize=1024)
def implied_vol(price, strike, expiry): ...
implied_vol.cache_info()`,
    when: 'Pure, repeated computations: lookups, recursive maths, parsing reference data.',
  },
  {
    name: 'functools.partial', header: 'functools', cat: 'Functions & classes', module: 7,
    summary: 'Pre-fill some arguments of a function.',
    what: 'Returns a new callable with some positional and keyword arguments fixed. `functools.Placeholder` (3.14) lets you skip positions.',
    code: `from functools import partial
fee = partial(round, ndigits=2)
fee(12.3456)                   # 12.35
fetch_gold = partial(fetch_bars, "XAU", timeframe="1h")
fetch_gold(days=30)`,
    when: 'Callbacks, configuring functions once, adapting signatures.',
  },
  {
    name: 'dataclasses.dataclass', header: 'dataclasses', cat: 'Functions & classes', module: 5,
    summary: 'Record classes without boilerplate.',
    what: 'Generates `__init__`, `__repr__`, `__eq__` (and more with options). Use `field(default_factory=…)` for mutable defaults.',
    code: `from dataclasses import dataclass, field, asdict
@dataclass(slots=True, kw_only=True)
class Order:
    sym: str
    qty: int
    tags: list[str] = field(default_factory=list)
asdict(Order(sym="XAU", qty=1))`,
    when: 'Any class that is mainly data.',
  },
  {
    name: 'contextlib.contextmanager / suppress', header: 'contextlib', cat: 'Functions & classes', module: 18,
    summary: 'Write `with` blocks from a generator; ignore specific errors.',
    what: '`@contextmanager` turns a generator with one `yield` into a context manager. `suppress(Exc)` swallows that exception type. `ExitStack` manages a dynamic number of contexts.',
    code: `from contextlib import contextmanager, suppress
import time
@contextmanager
def timer(label):
    t0 = time.perf_counter()
    try:
        yield
    finally:
        print(f"{label}: {time.perf_counter() - t0:.3f}s")

with timer("backtest"):
    run()
with suppress(FileNotFoundError):
    Path("tmp.lock").unlink()`,
    when: 'Timing, temporary state, resource cleanup. Cleaner than try/finally scattered around.',
  },

  // ---------------- Concurrency & system ----------------
  {
    name: 'concurrent.futures executors', header: 'concurrent.futures', cat: 'Concurrency & system', module: 20,
    summary: 'Run work in a thread or process pool.',
    what: '`ThreadPoolExecutor` for I/O-bound work, `ProcessPoolExecutor` for CPU-bound work (until free-threading is your default). `map` keeps order; `as_completed` yields results as they finish.',
    code: `from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed
with ThreadPoolExecutor(max_workers=16) as ex:
    bodies = list(ex.map(fetch, urls))

with ProcessPoolExecutor() as ex:
    futs = {ex.submit(backtest, sym): sym for sym in symbols}
    for fut in as_completed(futs):
        print(futs[fut], fut.result())`,
    when: 'Parallel downloads, per-symbol backtests, batch processing.',
  },
  {
    name: 'asyncio.run / TaskGroup', header: 'asyncio', cat: 'Concurrency & system', module: 21,
    summary: 'Structured async concurrency.',
    what: '`asyncio.run(main())` starts the event loop. `TaskGroup` (3.11) runs tasks together and cancels the rest if one fails. `asyncio.timeout` bounds waits.',
    code: `import asyncio
async def main(urls):
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(fetch(u)) for u in urls]
    return [t.result() for t in tasks]

async def with_deadline():
    async with asyncio.timeout(5):
        await slow_call()

asyncio.run(main(urls))`,
    when: 'Many concurrent network operations: websockets, API polling, async clients.',
  },
  {
    name: 'logging', header: 'logging', cat: 'Concurrency & system', module: 18,
    summary: 'Levels, handlers and formatting for application logs.',
    what: 'Configure once with `basicConfig`, then use per-module loggers. Pass values as arguments so formatting is lazy.',
    code: `import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger(__name__)
log.info("filled %s x %d @ %.2f", sym, qty, px)
log.exception("order failed")      # inside except: includes the traceback`,
    when: 'Anything beyond a quick script. Replace stray `print`s.',
  },
  {
    name: 'time.perf_counter', header: 'time', cat: 'Concurrency & system', module: 18,
    summary: 'Measure elapsed time precisely.',
    what: 'A monotonic, high-resolution clock for intervals. Use `timeit` for micro-benchmarks and `cProfile` (or the new 3.15 profiling package) for finding hotspots.',
    code: `import time
t0 = time.perf_counter()
run_backtest()
print(f"{time.perf_counter() - t0:.3f}s")

# python -m timeit -s "xs = list(range(1000))" "sum(xs)"
# python -m cProfile -s cumtime backtest.py`,
    when: 'Timing code. `time.time()` is wall-clock and can jump.',
  },
  {
    name: 'argparse', header: 'argparse', cat: 'Concurrency & system', module: 7,
    summary: 'Command-line arguments with help text and validation.',
    what: 'Declare arguments and get parsing, type conversion, defaults and `--help` for free.',
    code: `import argparse
p = argparse.ArgumentParser(description="Run a backtest")
p.add_argument("symbol")
p.add_argument("--days", type=int, default=30)
p.add_argument("-v", "--verbose", action="store_true")
args = p.parse_args()
print(args.symbol, args.days)`,
    when: 'Any script others (or future you) will run.',
  },
]
