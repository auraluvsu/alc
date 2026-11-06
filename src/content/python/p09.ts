import type { Module } from '../types'

export const p09: Module = {
  n: 9,
  title: 'Decorators & Closures',
  tour: '9 · Decorators and Closures',
  summary: 'A decorator is a function that takes a function and returns a replacement. Understanding them needs three ideas: when decorators run, how Python decides which variable a name refers to, and closures. Then functools.wraps, caching and parameterised decorators.',
  topics: ['Decorator basics', 'Import time vs runtime', 'Scope rules & closures', 'nonlocal', 'functools.cache & lru_cache', 'Parameterised decorators'],
  cpp23: ['`functools.cache` (3.9) is now everywhere in modern code.', 'Free-threaded builds (3.14+) make `lru_cache` thread-safe but not lock-free; caches shared across threads still need thought.'],
  lessons: [
    {
      id: 'basics',
      title: 'Decorator basics',
      blocks: [
        { kind: 'analogy', text: "A decorator is a gift-wrapping station on the way into the shop. You hand over a function; it hands back a wrapped version, usually the original inside some extra paper (timing, logging, retries). The `@` line is just shorthand for \"replace this name with the wrapped version\"." },
        { kind: 'code', code: `import time, functools

def timed(func):
    @functools.wraps(func)                 # copy __name__, __doc__ etc. to the wrapper
    def wrapper(*args, **kwargs):
        t0 = time.perf_counter()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {time.perf_counter() - t0:.4f}s")
        return result
    return wrapper

@timed
def backtest(days):
    return sum(range(days))

# exactly the same as:  backtest = timed(backtest)
backtest(1_000_000)       # prints "backtest took 0.01..s", returns 499999500000
backtest.__name__         # 'backtest' (thanks to wraps; otherwise 'wrapper')` },
        { kind: 'pitfall', text: 'Without `@functools.wraps`, every decorated function is called `wrapper` in tracebacks, loses its docstring and confuses tools like pytest and FastAPI that inspect signatures. Always use it.' },
        { kind: 'check', q: 'What is `@timed` above `def backtest` equivalent to?', options: ['`timed()`', '`backtest = timed(backtest)`', '`timed = backtest(timed)`', '`backtest.timed = True`'], answer: 1, hint: 'Replace the name with the wrapped version.', explain: 'The decorator receives the function object and its return value takes the name.' },
      ],
    },
    {
      id: 'when',
      title: 'Import time vs runtime',
      blocks: [
        { kind: 'analogy', text: "Decorators run when the shop is being stocked (import time), not when a customer buys something (call time). The wrapping happens once, as the module loads. That's what makes registration decorators possible: they put each function on a list the moment it's defined." },
        { kind: 'code', code: `STRATEGIES = []

def register(func):
    print(f"registering {func.__name__}")   # runs at import time
    STRATEGIES.append(func)
    return func                              # returns the original, unwrapped

@register
def momentum(prices): ...

@register
def mean_reversion(prices): ...

# On "import strategies" you see both "registering" lines immediately,
# before anything calls momentum() or mean_reversion().
[f.__name__ for f in STRATEGIES]    # ['momentum', 'mean_reversion']` },
        { kind: 'check', q: 'When does the body of `register` run?', options: ['Each time momentum() is called', 'Once, when the decorated function is defined (usually at import)', 'Never', 'At program exit'], answer: 1, hint: 'Stocking vs selling.', explain: 'The wrapper (if any) is what runs on each call.' },
      ],
    },
    {
      id: 'scope',
      title: 'Scope rules & closures',
      blocks: [
        { kind: 'analogy', text: "A closure is a function that packed a lunchbox before leaving home. When an inner function uses a variable from the function that created it, Python packs that variable along, so the inner function can still reach it long after the outer function has returned and its kitchen has closed." },
        { kind: 'code', code: `def make_averager():
    series = []                       # a "free variable" for the inner function
    def averager(x):
        series.append(x)              # mutates the list: no assignment to 'series'
        return sum(series) / len(series)
    return averager

avg = make_averager()
avg(10), avg(11), avg(12)             # (10.0, 10.5, 11.0)
avg.__code__.co_freevars              # ('series',)
avg.__closure__[0].cell_contents      # [10, 11, 12]

# The rule that bites: assignment makes a name local to the WHOLE function
b = 6
def f(a):
    print(a)
    print(b)        # UnboundLocalError: b is local because of the line below
    b = 9` },
        { kind: 'p', text: 'Python decides at **compile time** whether a name is local: if the function assigns to it anywhere, it\'s local everywhere in that function. Otherwise it\'s looked up in enclosing functions, then the module (global), then built-ins: the LEGB rule.' },
        { kind: 'check', q: 'Why does `print(b)` fail in `f` even though a global `b` exists?', options: ['Globals are read-only', 'Because `b = 9` later in the function makes b local for the whole body', 'print can\'t print ints', 'b is deleted'], answer: 1, hint: 'Decided when the function is compiled.', explain: 'Declare `global b` if you really mean the global (rarely a good idea).' },
      ],
    },
    {
      id: 'nonlocal',
      title: 'nonlocal',
      blocks: [
        { kind: 'analogy', text: "Mutating the lunchbox's contents is fine (appending to a packed list). But replacing the lunchbox itself (`count = count + 1` on a packed number) would create a fresh local lunchbox instead. `nonlocal` says: \"no, I mean the one I packed from home\"." },
        { kind: 'code', code: `def make_averager():
    count, total = 0, 0.0             # immutable numbers instead of a growing list
    def averager(x):
        nonlocal count, total         # rebind the enclosing variables
        count += 1
        total += x
        return total / count          # O(1) memory, unlike the list version
    return averager

avg = make_averager()
avg(10), avg(11), avg(12)             # (10.0, 10.5, 11.0)
# Without nonlocal: UnboundLocalError on 'count += 1'` },
        { kind: 'check', q: 'When do you need `nonlocal`?', options: ['To read an enclosing variable', 'To rebind (assign to) an enclosing function\'s variable', 'To mutate a list from an enclosing scope', 'Always in closures'], answer: 1, hint: 'Reading and mutating are fine without it.', explain: 'Assignment is what makes a name local.' },
      ],
    },
    {
      id: 'cache',
      title: 'Caching & parameterised decorators',
      blocks: [
        { kind: 'analogy', text: "`functools.cache` is a notepad stapled to a function: the first time you ask a question it does the work and writes the answer down; later it just reads the notepad. A parameterised decorator is a wrapping station you configure first (\"retry 3 times\"), so it's a factory that returns the real decorator." },
        { kind: 'code', code: `from functools import cache, lru_cache

@cache
def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)
fib(200)                              # instant; without the cache, longer than the universe

@lru_cache(maxsize=1024)              # bounded: evicts least recently used
def load_bars(sym: str, day: str): ...
load_bars.cache_info(); load_bars.cache_clear()

# A decorator with arguments = a function returning a decorator
def retry(times: int, exc: type[Exception] = ConnectionError):
    def decorate(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(times):
                try:
                    return func(*args, **kwargs)
                except exc:
                    if attempt == times - 1: raise
        return wrapper
    return decorate

@retry(times=3)
def fetch_quotes(sym): ...` },
        { kind: 'pitfall', text: 'Cached functions need hashable arguments (no lists or dicts), and `@cache` on a method keeps every `self` alive forever. Use `functools.cached_property` for per-instance caching instead.' },
        { kind: 'check', q: 'Why does `@retry(times=3)` need three nested functions?', options: ['Style only', 'retry(…) is called first and must return the actual decorator, which returns the wrapper', 'Python requires three', 'For thread safety'], answer: 1, hint: 'Evaluate `retry(times=3)` first.', explain: 'Factory → decorator → wrapper.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does a decorator receive?', options: ['The function\'s result', 'The function object', 'The arguments', 'A string'], answer: 1, explain: 'It returns a replacement.' },
    { q: 'What does `functools.wraps` do?', options: ['Caches results', 'Copies metadata like __name__ and __doc__ to the wrapper', 'Times the call', 'Makes it async'], answer: 1, explain: 'Always use it.' },
    { q: 'When do decorators run?', options: ['On every call', 'When the function is defined, usually at import', 'At exit', 'Only in tests'], answer: 1, explain: 'That enables registries.' },
    { q: 'What is a closure?', options: ['A class', 'A function that retains variables from its enclosing scope', 'A finished generator', 'A context manager'], answer: 1, explain: 'Free variables live in cells.' },
    { q: 'What decides if a name is local?', options: ['Whether it\'s read', 'Whether the function assigns to it anywhere', 'Its type', 'Indentation'], answer: 1, explain: 'Decided at compile time.' },
    { q: 'What does `nonlocal x` allow?', options: ['Reading x', 'Rebinding an enclosing function\'s x', 'Making x global', 'Deleting x'], answer: 1, explain: 'Use `global` for module scope.' },
    { q: 'What is `lru_cache(maxsize=1024)`?', options: ['Unbounded cache', 'A cache that evicts least recently used entries beyond 1024', 'A rate limiter', 'A thread pool'], answer: 1, explain: '`cache` is unbounded.' },
    { q: 'Which arguments can a cached function take?', options: ['Any', 'Hashable ones', 'Only ints', 'Only strings'], answer: 1, explain: 'They form the cache key.' },
  ],
}
