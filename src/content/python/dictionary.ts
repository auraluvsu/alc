import type { DictEntry } from '../types'

export const PY_DICT: DictEntry[] = [
  // ---------- Data model ----------
  { term: '__repr__ / __str__', cat: 'Data model', module: 1, desc: 'Developer vs user string forms. `str()` falls back to `__repr__`, so write that first.', syntax: `def __repr__(self): return f"Money({self.pence!r})"
def __str__(self):  return f"£{self.pence/100:,.2f}"` },
  { term: '__len__ / __getitem__', cat: 'Data model', module: 1, desc: 'The sequence protocol: gives `len()`, indexing, slicing (if delegated), iteration and `in`.', syntax: `def __len__(self): return len(self._items)
def __getitem__(self, i): return self._items[i]` },
  { term: '__bool__', cat: 'Data model', module: 1, desc: 'Truthiness. Without it Python uses `__len__` (0 = False); with neither, objects are truthy.', syntax: `def __bool__(self): return self.qty != 0
if basket: ...` },
  { term: 'Operator methods', cat: 'Data model', module: 1, desc: '`__add__`, `__mul__`, `__matmul__`, `__eq__`, `__lt__`… Return `NotImplemented` for unsupported operands.', syntax: `def __add__(self, other):
    if not isinstance(other, Vector): return NotImplemented
    return Vector(self.x + other.x, self.y + other.y)` },
  { term: 'f-strings', cat: 'Strings', module: 1, desc: 'Inline formatting with expressions and format specs. `!r` uses repr; `=` shows the expression too.', syntax: `f"{sym} {px:,.2f} {qty:>6}"
f"{price=}"            # 'price=2390.5'
f"{d["key"]}"          # nested quotes OK (3.12+)` },
  { term: 't-strings', cat: 'Strings', module: 1, since: '3.14', desc: 'Template strings: like f-strings but produce a `Template` with literal parts and values kept separate, for safe processing.', syntax: `from string.templatelib import Template
tmpl = t"SELECT * FROM trades WHERE sym = {sym}"
isinstance(tmpl, Template)   # True` },
  // ---------- Sequences ----------
  { term: 'List comprehension', cat: 'Sequences', module: 2, desc: 'Build a list from an iterable with optional filters and nested loops.', syntax: `[r for r in rets if r > 0]
[(s, tf) for s in syms for tf in tfs]
[*row for row in rows]     # flatten (3.15)` },
  { term: 'Generator expression', cat: 'Sequences', module: 2, desc: 'A lazy version of a comprehension: yields values one at a time.', syntax: `total = sum(x * x for x in xs)
any(t.qty > 100 for t in trades)` },
  { term: 'Slicing', cat: 'Sequences', module: 2, desc: '`s[start:stop:step]`, with stop excluded. On lists, slicing returns a new list. Slice assignment can resize.', syntax: `s[:3]; s[-4:]; s[::-1]
lst[1:3] = [9, 9, 9]
WEEK = slice(-5, None); closes[WEEK]` },
  { term: 'Unpacking', cat: 'Sequences', module: 2, desc: 'Assign sequence items to names; `*` collects the rest into a list.', syntax: `sym, px, qty = trade
first, *rest = items
a, b = b, a` },
  { term: 'match / case', cat: 'Sequences', module: 2, desc: 'Structural pattern matching on sequences, mappings and classes, with guards and alternatives.', syntax: `match cmd:
    case ["buy", sym, qty]: ...
    case {"type": "quote", **rest}: ...
    case Fill(sym=s) if s == "XAU": ...
    case _: ...` },
  { term: 'sorted / list.sort', cat: 'Sequences', module: 2, desc: '`sorted` returns a new list; `.sort()` sorts in place and returns None. Both are stable, with `key=` and `reverse=`.', syntax: `top = sorted(trades, key=lambda t: t.px, reverse=True)
trades.sort(key=lambda t: (t.sym, -t.px))` },
  { term: 'collections.deque', cat: 'Sequences', module: 2, desc: 'A double-ended queue with O(1) appends and pops at both ends; `maxlen` makes a rolling window.', syntax: `from collections import deque
window = deque(maxlen=20)
window.append(px); window.popleft()` },
  { term: 'itertools.batched', cat: 'Sequences', module: 2, since: '3.12', desc: 'Split an iterable into tuples of n (the last may be shorter; `strict=True` (3.13) errors instead).', syntax: `from itertools import batched
for batch in batched(orders, 100): send(batch)` },
  // ---------- Dicts & sets ----------
  { term: 'dict | merge', cat: 'Dicts & sets', module: 3, desc: 'Merge dicts into a new one (right side wins); `|=` updates in place.', syntax: `merged = defaults | overrides
config |= {"timeout": 5}` },
  { term: 'dict.get / setdefault', cat: 'Dicts & sets', module: 3, desc: '`get` reads with a default and no KeyError; `setdefault` inserts the default if missing and returns the value.', syntax: `d.get("XPD", 0.0)
groups.setdefault(t.sym, []).append(t)` },
  { term: 'defaultdict', cat: 'Dicts & sets', module: 3, desc: 'A dict that calls a factory for missing keys, including on read.', syntax: `from collections import defaultdict
groups = defaultdict(list)
groups[t.sym].append(t)` },
  { term: 'Counter', cat: 'Dicts & sets', module: 3, desc: 'A dict of counts with `most_common`, arithmetic, and 0 for missing keys.', syntax: `from collections import Counter
c = Counter(t.side for t in trades)
c.most_common(3)` },
  { term: 'frozendict', cat: 'Dicts & sets', module: 3, since: '3.15', desc: 'Immutable, hashable (if contents are), order-preserving mapping. It is not a dict subclass.', syntax: `spec = frozendict(sym="XAU", tick=0.01)
cache = {spec: "gold"}` },
  { term: 'set operations', cat: 'Dicts & sets', module: 3, desc: 'Fast membership plus algebra: union, intersection, difference, symmetric difference.', syntax: `a | b; a & b; a - b; a ^ b
"XAU" in watchlist
frozenset({1, 2})` },
  { term: '__hash__ / __eq__', cat: 'Dicts & sets', module: 3, desc: 'Objects that compare equal must hash equal. Defining `__eq__` alone makes instances unhashable.', syntax: `def __eq__(self, o): return (self.a, self.b) == (o.a, o.b)
def __hash__(self): return hash((self.a, self.b))` },
  // ---------- Text ----------
  { term: 'encode / decode', cat: 'Strings', module: 4, desc: 'str → bytes and bytes → str with an explicit codec. Choose an error handler for bad data.', syntax: `b = s.encode("utf-8")
s = b.decode("utf-8", errors="replace")` },
  { term: 'bytes / bytearray / memoryview', cat: 'Strings', module: 4, desc: 'Immutable bytes, mutable bytes, and zero-copy views of them.', syntax: `b = b"XAU"; b[0]   # 88
ba = bytearray(b); ba += b"!"
mv = memoryview(packet)[:3]` },
  { term: 'open() & encodings', cat: 'Strings', module: 4, desc: 'Text mode decodes and encodes. UTF-8 is the default from 3.15; `encoding="locale"` gives the old behaviour.', syntax: `with open("t.csv", encoding="utf-8") as f:
    for line in f: ...
Path("x.txt").read_text(encoding="utf-8")` },
  { term: 'unicodedata.normalize', cat: 'Strings', module: 4, desc: 'Canonicalise text before comparing (NFC), and `casefold` for case-insensitive matching.', syntax: `import unicodedata
unicodedata.normalize("NFC", s).casefold()` },
  // ---------- Data classes ----------
  { term: '@dataclass', cat: 'Classes', module: 5, desc: 'Generates `__init__`, `__repr__` and `__eq__`, plus options: frozen, slots, order, kw_only.', syntax: `@dataclass(frozen=True, slots=True)
class Trade:
    sym: str
    px: float
    qty: int = 1` },
  { term: 'field(default_factory=…)', cat: 'Classes', module: 5, desc: 'A per-instance mutable default, plus per-field options (repr, compare…).', syntax: `tags: list[str] = field(default_factory=list)
id: str = field(default="", compare=False)` },
  { term: 'typing.NamedTuple', cat: 'Classes', module: 5, desc: 'An immutable tuple subclass with named, typed fields; can have methods.', syntax: `class Bar(NamedTuple):
    ts: int
    close: float
    volume: int = 0` },
  { term: 'copy.replace', cat: 'Classes', module: 5, since: '3.13', desc: 'Copy an immutable record with some fields changed (dataclasses, named tuples, …).', syntax: `import copy
o2 = copy.replace(order, qty=5)` },
  // ---------- References ----------
  { term: 'is vs ==', cat: 'References', module: 6, desc: '`is` compares identity (same object); `==` compares values via `__eq__`. Use `is` only for singletons such as None.', syntax: `if x is None: ...
a == b      # same contents
a is b      # same object` },
  { term: 'copy / deepcopy', cat: 'References', module: 6, desc: 'Shallow copies share nested objects; deep copies duplicate everything (and handle cycles).', syntax: `import copy
shallow = copy.copy(book)
deep = copy.deepcopy(book)` },
  { term: 'Mutable default argument', cat: 'References', module: 6, desc: 'Defaults are evaluated once at def time. Use None as a sentinel.', syntax: `def add(tag, tags=None):
    if tags is None:
        tags = []
    tags.append(tag)` },
  { term: 'weakref', cat: 'References', module: 6, desc: 'References that don\'t keep objects alive, for caches and observers.', syntax: `import weakref
cache = weakref.WeakValueDictionary()` },
  // ---------- Functions & typing ----------
  { term: '*args / **kwargs', cat: 'Functions', module: 7, desc: 'Collect extra positional and keyword arguments; `/` and `*` mark positional-only and keyword-only parameters.', syntax: `def f(a, b, /, c, *, d, **opts): ...
f(1, 2, 3, d=4, x=5)` },
  { term: 'lambda', cat: 'Functions', module: 7, desc: 'An anonymous single-expression function, typically used as a `key=`.', syntax: `sorted(trades, key=lambda t: t.px)` },
  { term: 'Type hints', cat: 'Typing', module: 8, desc: 'Annotations checked by mypy or pyright, not at runtime. `X | None` replaces Optional[X].', syntax: `def price(sym: str, *, venue: str | None = None) -> float: ...
prices: dict[str, float] = {}` },
  { term: 'Generics (PEP 695)', cat: 'Typing', module: 8, since: '3.12', desc: 'Type parameters in brackets on functions, classes and `type` aliases.', syntax: `def first[T](xs: list[T]) -> T: return xs[0]
class Box[T]: ...
type Pair[T] = tuple[T, T]` },
  { term: 'Protocol', cat: 'Typing', module: 13, desc: 'Structural interface for the type checker: any class with the methods matches.', syntax: `from typing import Protocol
class PriceSource(Protocol):
    def price(self, sym: str) -> float: ...` },
  { term: 'Decorators', cat: 'Functions', module: 9, desc: 'Functions that wrap functions, applied with `@` at definition time.', syntax: `import functools
def timed(fn):
    @functools.wraps(fn)
    def wrapper(*a, **kw): ...
    return wrapper` },
  { term: 'functools.cache', cat: 'Functions', module: 9, desc: 'Memoise a function\'s results by its arguments.', syntax: `from functools import cache
@cache
def fib(n): return n if n < 2 else fib(n-1) + fib(n-2)` },
  { term: 'Generators', cat: 'Iteration', module: 17, desc: 'Functions with `yield` produce lazy iterators that pause and resume.', syntax: `def countdown(n):
    while n > 0:
        yield n
        n -= 1` },
  { term: 'with / context managers', cat: 'Control flow', module: 18, desc: 'Guaranteed setup and cleanup via `__enter__`/`__exit__` or `@contextmanager`.', syntax: `with open(p) as f, lock: ...
from contextlib import contextmanager
@contextmanager
def timer(): ...` },
  { term: 'except*', cat: 'Control flow', module: 18, since: '3.11', desc: 'Handle parts of an ExceptionGroup, such as errors raised by several tasks at once.', syntax: `try:
    async with asyncio.TaskGroup() as tg: ...
except* ValueError as eg:
    ...` },
  { term: 'async / await', cat: 'Concurrency', module: 21, desc: 'Coroutines run by an event loop. TaskGroup gives structured concurrency.', syntax: `async def main():
    async with asyncio.TaskGroup() as tg:
        tg.create_task(fetch(u))
asyncio.run(main())` },
  { term: 'lazy import', cat: 'Modules', module: 24, since: '3.15', desc: 'Defer loading a module until a name from it is first used, for faster start-up. Module scope only.', syntax: `lazy import json
lazy from pathlib import Path` },
  { term: '@property', cat: 'Classes', module: 22, desc: 'A computed or validated attribute with attribute syntax.', syntax: `@property
def mid(self): return (self.bid + self.ask) / 2` },
]
