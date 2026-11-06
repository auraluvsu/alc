import type { Module } from '../types'

export const p20: Module = {
  n: 20,
  title: 'Concurrent Executors',
  tour: '20 · Concurrent Executors',
  summary: 'concurrent.futures: the high-level way to run work on threads, processes or interpreters. Executor.map and submit, futures, as_completed for progress, handling errors per task, and choosing pool sizes.',
  topics: ['Downloads with executors', 'Futures', 'Process pools', 'Error handling & progress'],
  cpp23: ['`InterpreterPoolExecutor` (3.14) runs tasks in subinterpreters.', '`Executor.map(buffersize=…)` (3.14) bounds how many inputs are consumed ahead.'],
  lessons: [
    {
      id: 'map',
      title: 'Downloads with executor.map',
      blocks: [
        { kind: 'analogy', text: "An executor is a temp agency. You hand it a list of jobs and it hands them to a pool of workers, then gives you the results back in the same order you listed the jobs, however quickly each one finished. You never manage a worker directly." },
        { kind: 'code', code: `from concurrent.futures import ThreadPoolExecutor
import urllib.request, time

SYMBOLS = ["XAU", "XAG", "XPT", "XPD", "HG"]

def fetch(sym: str) -> tuple[str, int]:
    url = f"https://example.com/bars/{sym}.csv"
    with urllib.request.urlopen(url, timeout=10) as resp:     # blocking I/O releases the GIL
        return sym, len(resp.read())

t0 = time.perf_counter()
with ThreadPoolExecutor(max_workers=8) as ex:     # the with block waits for all jobs
    for sym, size in ex.map(fetch, SYMBOLS):      # results in INPUT order
        print(sym, size)
print(f"{time.perf_counter() - t0:.2f}s")         # ≈ the slowest download, not the sum` },
        { kind: 'list', items: [
          '`ThreadPoolExecutor()` with no argument uses `min(32, os.cpu_count() + 4)` workers, a sensible default for I/O.',
          '`ex.map` raises the first exception it meets *when you reach that result*, and you lose the remaining results. Use `submit` and futures (next lesson) for per-task error handling.',
        ] },
        { kind: 'check', q: 'In what order does `executor.map` yield results?', options: ['Completion order', 'The order of the inputs', 'Random', 'Alphabetical'], answer: 1, hint: 'Like the built-in map.', explain: 'It may wait on a slow early job even if later ones are done.' },
      ],
    },
    {
      id: 'futures',
      title: 'Futures',
      blocks: [
        { kind: 'analogy', text: "A future is a cloakroom ticket. `submit()` hands your coat in and gives you a ticket immediately; the coat (result) is ready at some point. You can ask the ticket whether it's ready (`done()`), wait for it (`result()`), or attach a note saying \"call me when it's ready\" (`add_done_callback`)." },
        { kind: 'code', code: `from concurrent.futures import ThreadPoolExecutor, as_completed

with ThreadPoolExecutor(max_workers=8) as ex:
    futures = {ex.submit(fetch, sym): sym for sym in SYMBOLS}   # future → sym
    for fut in as_completed(futures):                           # COMPLETION order
        sym = futures[fut]
        try:
            _, size = fut.result()
        except Exception as e:
            print(f"{sym} failed: {e!r}")                         # one failure doesn't stop the rest
        else:
            print(f"{sym}: {size} bytes")

fut = ex.submit(pow, 2, 10)       # (inside a with block)
fut.done(), fut.result(timeout=5), fut.exception()` },
        { kind: 'compare',
          python: `fut = ex.submit(fetch, "XAU"); fut.result()`,
          ts: `const p = fetch("XAU"); await p   // a Promise is a future that starts immediately`,
          go: `ch := make(chan Result, 1); go func() { ch <- fetch("XAU") }(); r := <-ch`,
          java: `Future<R> f = pool.submit(() -> fetch("XAU")); f.get();`,
          cpp: `auto f = std::async(std::launch::async, fetch, "XAU"); f.get();`,
          note: 'Java\'s Future and C++\'s std::future are direct cousins of concurrent.futures.' },
        { kind: 'check', q: 'What does `as_completed(futures)` yield?', options: ['Results in submission order', 'Futures as they finish', 'Exceptions only', 'Workers'], answer: 1, hint: 'Completion order.', explain: 'Call `.result()` on each one.' },
      ],
    },
    {
      id: 'processes',
      title: 'Process pools',
      blocks: [
        { kind: 'analogy', text: "A process pool is the same temp agency, but each worker sits in a separate building. They can all work truly in parallel, but every job and result has to be posted between buildings (pickled), so send small parcels: a parameter set, not a 2 GB DataFrame." },
        { kind: 'code', code: `from concurrent.futures import ProcessPoolExecutor
import numpy as np

def backtest(params: tuple[int, int]) -> tuple[tuple[int, int], float]:
    fast, slow = params
    prices = np.load("xau_daily.npy")             # each worker loads its own copy
    # ... run strategy, compute Sharpe ...
    return params, sharpe

grid = [(f, s) for f in range(5, 50, 5) for s in range(50, 250, 25) if f < s]

if __name__ == "__main__":                        # essential with process pools
    with ProcessPoolExecutor() as ex:             # defaults to os.process_cpu_count() workers
        results = dict(ex.map(backtest, grid, chunksize=4))   # batch small tasks
    best = max(results, key=results.get)` },
        { kind: 'list', items: [
          'Functions and arguments must be **picklable**: module-level functions, not lambdas or nested functions.',
          '`chunksize` batches many small tasks per round-trip, which cuts pickling overhead a lot.',
          'Without the `if __name__ == "__main__":` guard, spawned workers re-import your script and try to start pools of their own.',
          'Searching a grid of 72 parameter pairs and reporting the best is exactly the multiple-testing problem from the ML course. Parallelism makes overfitting faster too.',
        ] },
        { kind: 'check', q: 'Why can\'t you `ex.submit(lambda x: x * 2, 3)` to a ProcessPoolExecutor?', options: ['Lambdas are slow', 'Lambdas can\'t be pickled to send to another process', 'Processes forbid functions', 'It works fine'], answer: 1, hint: 'Posting parcels between buildings.', explain: 'Use a module-level def.' },
      ],
    },
    {
      id: 'errors',
      title: 'Errors, progress & pool sizing',
      blocks: [
        { kind: 'analogy', text: "With hundreds of jobs in flight, you want a progress bar, a failure log per job, and a polite limit so the target server doesn't ban you. Futures give you all three: iterate `as_completed`, catch per future, and cap `max_workers`." },
        { kind: 'code', code: `from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.error

def download_many(symbols, max_workers=16):
    counter = Counter()
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        todo = {ex.submit(fetch, s): s for s in symbols}
        for i, fut in enumerate(as_completed(todo), 1):
            sym = todo[fut]
            try:
                fut.result()
                counter["ok"] += 1
            except urllib.error.HTTPError as e:
                counter[f"http {e.code}"] += 1
            except TimeoutError:
                counter["timeout"] += 1
            print(f"\\r{i}/{len(todo)}", end="")       # or tqdm(as_completed(todo), total=len(todo))
    return counter

# Cancel queued work on shutdown (3.9+):
ex.shutdown(wait=False, cancel_futures=True)` },
        { kind: 'check', q: 'How do you keep going when one download raises?', options: ['Use ex.map', 'Call fut.result() inside try/except per future', 'Ignore it', 'Restart the pool'], answer: 1, hint: 'One ticket at a time.', explain: 'ex.map would raise at the failing item and lose the rest.' },
      ],
    },
  ],
  quiz: [
    { q: 'Which module provides ThreadPoolExecutor?', options: ['threading', 'concurrent.futures', 'asyncio', 'multiprocessing.pool only'], answer: 1, explain: 'Also ProcessPoolExecutor and InterpreterPoolExecutor.' },
    { q: 'executor.map returns results in…', options: ['Completion order', 'Input order', 'Random order', 'Reverse order'], answer: 1, explain: 'Use as_completed for completion order.' },
    { q: 'What does submit() return?', options: ['The result', 'A Future', 'A thread', 'None'], answer: 1, explain: 'Call .result() to wait.' },
    { q: 'What do process pool tasks need to be?', options: ['Async', 'Picklable', 'Pure', 'Typed'], answer: 1, explain: 'Data is sent between processes.' },
    { q: 'What does chunksize do in ProcessPoolExecutor.map?', options: ['Limits memory', 'Batches several tasks per IPC round-trip', 'Sets workers', 'Splits arrays'], answer: 1, explain: 'Less pickling overhead.' },
    { q: 'Why the `if __name__ == "__main__"` guard?', options: ['Style', 'So spawned worker processes don\'t re-run the pool setup on import', 'Speed', 'Typing'], answer: 1, explain: 'Required on spawn platforms.' },
    { q: 'fut.exception() returns…', options: ['Always None', 'The exception raised by the task, or None', 'A traceback string', 'True/False'], answer: 1, explain: 'Waits if not done.' },
    { q: 'Which pool runs tasks in subinterpreters?', options: ['ThreadPoolExecutor', 'InterpreterPoolExecutor (3.14)', 'AsyncPool', 'GILPool'], answer: 1, explain: 'One GIL per interpreter.' },
  ],
}
