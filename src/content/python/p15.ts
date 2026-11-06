import type { Module } from '../types'

export const p15: Module = {
  n: 15,
  title: 'More About Type Hints',
  tour: '15 · More About Type Hints',
  summary: 'The advanced corner of typing: overloaded signatures, TypedDict for JSON-shaped data, cast, reading annotations at runtime, generic classes, variance, and generic protocols.',
  topics: ['Overloaded signatures', 'TypedDict', 'cast', 'Runtime annotations', 'Generic classes', 'Variance'],
  cpp23: [
    '`TypedDict` with typed extra items (3.15, PEP 728).',
    'PEP 695 generic classes `class Box[T]:` (3.12), with variance inferred automatically.',
    '`annotationlib` (3.14) for reading lazily evaluated annotations.',
  ],
  lessons: [
    {
      id: 'overload',
      title: 'Overloaded signatures',
      blocks: [
        { kind: 'analogy', text: "`@overload` writes several entries in the phone book for one person, each saying \"if you call with this, you'll get that\". Only the type checker reads the entries; there's still one real function that handles every case at runtime." },
        { kind: 'code', code: `from typing import overload
from collections.abc import Sequence

@overload
def mid(bid: float, ask: float) -> float: ...
@overload
def mid(bid: Sequence[float], ask: Sequence[float]) -> list[float]: ...
def mid(bid, ask):                                   # the real implementation, unannotated
    if isinstance(bid, (int, float)):
        return (bid + ask) / 2
    return [(b + a) / 2 for b, a in zip(bid, ask)]

reveal_type(mid(1.0, 2.0))            # float
reveal_type(mid([1.0], [2.0]))        # list[float]` },
        { kind: 'check', q: 'How many function bodies run at runtime with @overload?', options: ['One per overload', 'Only the final, undecorated implementation', 'None', 'The first'], answer: 1, hint: 'Phone-book entries vs the person.', explain: 'The `@overload` stubs are for the checker only.' },
      ],
    },
    {
      id: 'typeddict',
      title: 'TypedDict',
      blocks: [
        { kind: 'analogy', text: "A TypedDict is a form template for a plain dict: it tells the checker which keys exist and what goes in each box, but at runtime it's still an ordinary dict with no validation. Perfect for describing JSON you receive or send; useless as a guard against bad data." },
        { kind: 'code', code: `from typing import TypedDict, NotRequired, ReadOnly

class Fill(TypedDict):
    order_id: int
    sym: str
    px: float
    qty: float
    venue: NotRequired[str]          # may be absent
    ts: ReadOnly[str]                # checker forbids assignment (3.13)

def notional(f: Fill) -> float:
    return f["px"] * f["qty"]

msg: Fill = {"order_id": 1, "sym": "XAU", "px": 2385.0, "qty": 2.0, "ts": "2026-11-06T09:00Z"}
type(msg)                            # <class 'dict'>: no runtime class
# msg["pz"]                          checker: TypedDict "Fill" has no key "pz"

class Tags(TypedDict, extra_items=str):   # 3.15: any extra keys must have str values
    desk: str` },
        { kind: 'pitfall', text: 'TypedDict does nothing at runtime: `Fill(**json.loads(s))` accepts any garbage. Use pydantic or a hand-written check at trust boundaries, and TypedDict for the typed code behind it.' },
        { kind: 'check', q: 'What does `Fill(order_id="x")` do at runtime?', options: ['Raises TypeError', 'Returns a plain dict without validation', 'Converts to int', 'Returns None'], answer: 1, hint: 'Template, not inspector.', explain: 'Only the checker complains.' },
      ],
    },
    {
      id: 'cast',
      title: 'cast & runtime annotations',
      blocks: [
        { kind: 'analogy', text: "`cast` is a signed note to the inspector: \"I know this box says 'object', but I promise it's a float\". It does nothing at runtime and silences the checker, so every cast is a place a bug can hide. Use it where you know more than the checker can, and as rarely as possible." },
        { kind: 'code', code: `from typing import cast
import json, annotationlib

raw = json.loads('{"px": 2385.0}')
px = cast(float, raw["px"])          # no conversion, no check: just a promise

if isinstance(raw["px"], float):     # narrowing is usually better than cast
    px = raw["px"]

class Order:
    parent: Order | None             # forward reference without quotes (3.14+)
    qty: float

annotationlib.get_annotations(Order)
# {'parent': Order | None, 'qty': <class 'float'>}
annotationlib.get_annotations(Order, format=annotationlib.Format.STRING)
# {'parent': 'Order | None', 'qty': 'float'}` },
        { kind: 'new23', text: 'With PEP 649 (3.14) annotations are stored as code and evaluated on demand. Libraries that read them (dataclasses, pydantic, FastAPI) use `annotationlib`, which can return values, forward-reference proxies or plain strings.' },
        { kind: 'check', q: 'What does `cast(float, x)` do at runtime?', options: ['Converts x to float', 'Returns x unchanged', 'Raises if x isn\'t a float', 'Rounds x'], answer: 1, hint: 'A note to the inspector.', explain: 'Use `float(x)` to convert or isinstance to check.' },
      ],
    },
    {
      id: 'generic',
      title: 'Generic classes',
      blocks: [
        { kind: 'analogy', text: "A generic class is a container with a label slot: `RingBuffer[float]` and `RingBuffer[Order]` are the same machinery, but the checker tracks what goes in each one and what comes out." },
        { kind: 'code', code: `from collections import deque
from collections.abc import Iterator

class RingBuffer[T]:                              # 3.12+ syntax
    def __init__(self, size: int) -> None:
        self._items: deque[T] = deque(maxlen=size)
    def push(self, item: T) -> None:
        self._items.append(item)
    def __iter__(self) -> Iterator[T]:
        return iter(self._items)
    def last(self) -> T:
        return self._items[-1]

prices = RingBuffer[float](20)
prices.push(2385.0)
# prices.push("x")       checker: "str" is not assignable to "float"
reveal_type(prices.last())   # float

class Pair[K, V = float]: ...                     # type parameter defaults (3.13, PEP 696)` },
        { kind: 'check', q: 'What is `RingBuffer[float](20)` at runtime?', options: ['A different class', 'A RingBuffer instance; the [float] is mostly for the checker', 'An error', 'A list'], answer: 1, hint: 'Same machinery, different label.', explain: 'Type arguments are erased, much like Java generics.' },
      ],
    },
    {
      id: 'variance',
      title: 'Variance',
      blocks: [
        { kind: 'analogy', text: "Variance answers: if a gold bar is a kind of commodity, is a box of gold bars a kind of box of commodities? For a read-only crate, yes (covariant): anyone expecting commodities out will be happy with gold. For a crate you can put things into, no (invariant): someone might put oil in your box of gold. For a disposal bin that only takes things in, it flips (contravariant): a bin accepting any commodity can stand in for a bin that only needs to accept gold." },
        { kind: 'code', code: `from collections.abc import Sequence, Callable

class Commodity: ...
class Gold(Commodity): ...

def value_all(xs: Sequence[Commodity]) -> float: ...   # Sequence is read-only → covariant
value_all([Gold()])                                     # OK

def restock(xs: list[Commodity]) -> None:
    xs.append(Commodity())
golds: list[Gold] = [Gold()]
# restock(golds)        checker error: list is invariant (it could insert a non-Gold)

def apply(handler: Callable[[Gold], None]) -> None: ...
def handle_any(c: Commodity) -> None: ...
apply(handle_any)       # OK: Callable is contravariant in its argument types

class Feed[T]:          # PEP 695 classes: variance is inferred from how T is used
    def get(self) -> T: ...                              # only returned → covariant` },
        { kind: 'list', items: [
          '**Covariant**: produces T (read-only containers, return types). `Sequence`, `Iterator`, `tuple`, `frozenset`.',
          '**Invariant**: both consumes and produces T (mutable containers). `list`, `dict`, `set`.',
          '**Contravariant**: only consumes T (callables\' parameters, sinks).',
          'Rule of thumb for APIs: accept `Sequence`/`Mapping` rather than `list`/`dict` and covariance makes callers\' lives easy.',
        ] },
        { kind: 'check', q: 'Why is `list[Gold]` not accepted where `list[Commodity]` is expected?', options: ['A checker bug', 'The function could append a non-Gold Commodity into your list', 'Gold isn\'t a Commodity', 'Lists are covariant'], answer: 1, hint: 'Oil in the gold box.', explain: 'Mutable containers are invariant.' },
      ],
    },
  ],
  quiz: [
    { q: '@overload stubs are used by…', options: ['The interpreter', 'Type checkers only', 'Both', 'Neither'], answer: 1, explain: 'One implementation runs.' },
    { q: 'At runtime a TypedDict instance is…', options: ['A special class', 'A plain dict', 'A dataclass', 'A NamedTuple'], answer: 1, explain: 'No validation.' },
    { q: 'NotRequired[str] in a TypedDict means…', options: ['May be None', 'The key may be absent', 'Read-only', 'Deprecated'], answer: 1, explain: 'Different from `str | None`.' },
    { q: 'cast() at runtime…', options: ['Converts', 'Returns its argument unchanged', 'Validates', 'Copies'], answer: 1, explain: 'A checker-only promise.' },
    { q: 'Which module reads lazily evaluated annotations (3.14)?', options: ['inspect only', 'annotationlib', 'typing_extensions', 'ast'], answer: 1, explain: 'With several formats.' },
    { q: 'list[T] is…', options: ['Covariant', 'Invariant', 'Contravariant', 'Bivariant'], answer: 1, explain: 'It both accepts and returns T.' },
    { q: 'Sequence[T] is…', options: ['Covariant', 'Invariant', 'Contravariant', 'Untyped'], answer: 0, explain: 'Read-only.' },
    { q: 'How is variance determined for `class Box[T]:` (PEP 695)?', options: ['Always invariant', 'Inferred from usage', 'Must be declared', 'Always covariant'], answer: 1, explain: 'No more covariant=True TypeVars needed.' },
  ],
}
