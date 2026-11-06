import type { Module } from '../types'

export const p18: Module = {
  n: 18,
  title: 'with, match & else Blocks',
  tour: '18 · with, match, and else Blocks',
  summary: 'Context managers and the with statement, the contextlib toolbox and @contextmanager, structural pattern matching in depth, and the else clause on for, while and try.',
  topics: ['Context managers', 'contextlib utilities', '@contextmanager', 'Pattern matching in depth', 'else blocks'],
  cpp23: [
    'Parenthesised context managers (3.10).',
    '`except` without parentheses for multiple types (3.14, PEP 758).',
    'Exception groups and `except*` (3.11).',
  ],
  lessons: [
    {
      id: 'with',
      title: 'Context managers',
      blocks: [
        { kind: 'analogy', text: "A context manager is a hotel key card. Entering the `with` block checks you in (`__enter__`); leaving it, however you leave (normally, by `return`, or by an exception), checks you out (`__exit__`). You can't forget to hand the card back, which is exactly what you want for files, locks, connections and timers." },
        { kind: 'code', code: `class Timer:
    def __enter__(self):
        import time
        self._t0 = time.perf_counter()
        return self                      # bound to the name after "as"
    def __exit__(self, exc_type, exc, tb):
        import time
        self.elapsed = time.perf_counter() - self._t0
        return False                     # False/None: don't swallow exceptions

with Timer() as t:
    sum(range(1_000_000))
t.elapsed                                # e.g. 0.012

with (open("in.csv") as src,             # 3.10+: parenthesised, one per line
      open("out.csv", "w") as dst):
    dst.write(src.read())` },
        { kind: 'compare',
          python: `with open(path) as f:
    data = f.read()          # closed on exit, even on error`,
          ts: `await using f = await fs.open(path)   // explicit resource management (TS 5.2+, Node 24+)`,
          go: `f, err := os.Open(path)
defer f.Close()`,
          java: `try (var f = Files.newBufferedReader(path)) { ... }   // try-with-resources`,
          cpp: `{ std::ifstream f{path}; ... }   // RAII: destructor closes at scope end`,
          note: 'Same idea everywhere: tie cleanup to leaving a scope.' },
        { kind: 'check', q: 'If `__exit__` returns True, what happens to an exception raised in the block?', options: ['It propagates', 'It is suppressed', 'It is logged', 'It is re-raised later'], answer: 1, hint: 'Return value means "handled?"', explain: 'Use this power sparingly: `contextlib.suppress` is clearer.' },
      ],
    },
    {
      id: 'contextlib',
      title: 'contextlib utilities',
      blocks: [
        { kind: 'analogy', text: "`contextlib` is a drawer of ready-made key cards: one that ignores a specific error, one that redirects printing, one that manages a variable number of resources at once (`ExitStack`), one that turns any object with `.close()` into a key card." },
        { kind: 'code', code: `from contextlib import suppress, ExitStack, closing, redirect_stdout, chdir
import os, io

with suppress(FileNotFoundError):
    os.remove("stale.lock")          # fine if it isn't there

with ExitStack() as stack:           # open an unknown number of files safely
    files = [stack.enter_context(open(f)) for f in ["a.csv", "b.csv"]]
    ...                              # all closed on exit, in reverse order

buf = io.StringIO()
with redirect_stdout(buf):
    print("captured")
buf.getvalue()                       # 'captured\\n'

with chdir("/tmp"):                  # 3.11+: temporarily change directory
    ...` },
        { kind: 'check', q: 'Which tool handles a variable number of context managers?', options: ['suppress', 'ExitStack', 'closing', 'nullcontext'], answer: 1, hint: 'A stack of cards.', explain: 'It unwinds them in reverse order.' },
      ],
    },
    {
      id: 'contextmanager',
      title: '@contextmanager',
      blocks: [
        { kind: 'analogy', text: "`@contextmanager` builds a key card from a generator: the code before `yield` is check-in, the yielded value is what `as` receives, and the code after `yield` is check-out. Wrap the `yield` in `try/finally` or check-out won't happen when the block raises." },
        { kind: 'code', code: `from contextlib import contextmanager
import time, logging

@contextmanager
def timed(label: str):
    t0 = time.perf_counter()
    try:
        yield                                        # the with-block runs here
    finally:                                         # runs even if the block raises
        logging.info("%s took %.3fs", label, time.perf_counter() - t0)

with timed("backtest"):
    run_backtest()

@contextmanager
def transaction(conn):
    cur = conn.cursor()
    try:
        yield cur
    except Exception:
        conn.rollback(); raise
    else:
        conn.commit()

@timed("nightly")                    # objects from @contextmanager also work as decorators
def nightly_job(): ...` },
        { kind: 'pitfall', text: 'A bare `yield` without `try/finally` means an exception in the `with` block is re-raised *at the yield*, so the cleanup code after it never runs.' },
        { kind: 'check', q: 'In a @contextmanager generator, what does `as` receive?', options: ['The generator', 'The value yielded', 'The return value', 'None always'], answer: 1, hint: 'Check-in hands over something.', explain: 'A bare `yield` gives None.' },
      ],
    },
    {
      id: 'match',
      title: 'Pattern matching in depth',
      blocks: [
        { kind: 'analogy', text: "`match` is a sorting office that reads the *shape* of a parcel, not just its label. It can check that something is a list of three items whose first is \"BUY\", or an `Order` object whose side is \"sell\" and quantity over 100, and pull the parts out into variables in the same move." },
        { kind: 'code', code: `from dataclasses import dataclass

@dataclass
class Order:
    side: str
    sym: str
    qty: float
    limit: float | None = None

def route(msg):
    match msg:
        case ["PING"]:
            return "pong"
        case ["BUY" | "SELL" as side, str(sym), qty] if qty > 0:     # alternatives, capture, guard
            return Order(side.lower(), sym, float(qty))
        case {"type": "cancel", "id": int(oid)}:                    # mapping pattern (extra keys OK)
            return ("cancel", oid)
        case Order(side="sell", qty=q) if q > 1_000:                  # class pattern with keywords
            return "block trade desk"
        case Order(limit=None):
            return "market order"
        case Order():
            return "limit order"
        case _:
            raise ValueError(f"unroutable: {msg!r}")

route(["BUY", "XAU", 2])               # Order(side='buy', sym='XAU', qty=2.0, limit=None)
route({"type": "cancel", "id": 7, "ts": 1})   # ('cancel', 7)
route(Order("sell", "XAG", 5_000))     # 'block trade desk'` },
        { kind: 'pitfall', text: 'A bare name in a pattern always **captures**: `case LIMIT:` matches anything and binds it to `LIMIT`. To compare against a constant, use a dotted name (`case Side.BUY:`) or a literal.' },
        { kind: 'check', q: 'Does `case {"type": "cancel"}` match a dict with extra keys?', options: ['No', 'Yes: mapping patterns ignore extra keys', 'Only with **rest', 'Only for dataclasses'], answer: 1, hint: 'Sequences are exact, mappings aren\'t.', explain: 'Use `**rest` to capture the extras.' },
      ],
    },
    {
      id: 'else',
      title: 'else blocks & exceptions',
      blocks: [
        { kind: 'analogy', text: "`else` on a loop or `try` means \"then, if nothing went wrong\". For a loop: if it finished without `break`. For `try`: if no exception was raised. Read it as `then`, and it makes sense." },
        { kind: 'code', code: `for fill in fills:
    if fill.rejected:
        alert(fill); break
else:                                   # runs only if the loop didn't break
    log("all fills accepted")

try:
    px = float(raw)                     # keep the try block minimal
except ValueError, TypeError:           # 3.14+: no parentheses needed (PEP 758)
    px = None
else:
    record(px)                          # only if no exception; errors here aren't caught above
finally:
    cleanup()

try:                                    # 3.11+: several failures at once (e.g. from a TaskGroup)
    raise ExceptionGroup("batch", [ValueError("bad px"), KeyError("XAU")])
except* ValueError as eg:
    print("value errors:", eg.exceptions)
except* KeyError as eg:
    print("key errors:", eg.exceptions)` },
        { kind: 'check', q: 'When does a `for ... else` block\'s else run?', options: ['When the loop breaks', 'When the loop finishes without break', 'Always', 'Only if the loop body never ran'], answer: 1, hint: 'Read else as "then".', explain: 'An empty loop also runs else, since it didn\'t break.' },
      ],
    },
  ],
  quiz: [
    { q: 'Which methods define a context manager?', options: ['__open__/__close__', '__enter__/__exit__', '__init__/__del__', '__call__'], answer: 1, explain: 'Async ones use __aenter__/__aexit__.' },
    { q: 'What binds to the `as` target?', options: ['The manager object always', 'The return value of __enter__', 'None', 'The exception'], answer: 1, explain: 'Often self, but not always (open returns the file).' },
    { q: 'Which suppresses one exception type cleanly?', options: ['contextlib.suppress', 'try/pass everywhere', 'ExitStack', 'closing'], answer: 0, explain: 'Clearer than an empty except.' },
    { q: 'In @contextmanager, cleanup must be in…', options: ['A separate function', 'A finally block around yield', '__del__', 'A decorator'], answer: 1, explain: 'Or it is skipped on errors.' },
    { q: 'A bare name in a case pattern…', options: ['Compares to a variable', 'Captures anything', 'Is a syntax error', 'Matches strings only'], answer: 1, explain: 'Use dotted names for constants.' },
    { q: 'Sequence patterns match strings?', options: ['Yes', 'No: str, bytes and bytearray are excluded', 'Only single characters', 'Only with *rest'], answer: 1, explain: 'To avoid surprises.' },
    { q: 'try/else runs the else when…', options: ['An exception occurred', 'No exception occurred in try', 'Always', 'After finally'], answer: 1, explain: 'Keep the try block small.' },
    { q: 'What does `except*` handle?', options: ['Any exception', 'Exceptions inside an ExceptionGroup, by type', 'Warnings', 'KeyboardInterrupt only'], answer: 1, explain: '3.11+.' },
  ],
}
