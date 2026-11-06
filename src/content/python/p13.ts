import type { Module } from '../types'

export const p13: Module = {
  n: 13,
  title: 'Interfaces, Protocols & ABCs',
  tour: '13 · Interfaces, Protocols, and ABCs',
  summary: 'Python has four ways to say "this object can do X": duck typing, goose typing with abstract base classes, static duck typing with Protocols, and plain static typing. When to use each, how ABCs and virtual subclasses work, and how to design small protocols.',
  topics: ['The typing map', 'Dynamic protocols', 'Goose typing & ABCs', 'Static protocols', 'Designing protocols'],
  cpp23: ['`@typing.override` (3.12) marks methods that must override a base method; checkers flag typos.', 'Disjoint bases in the type system (3.15, PEP 800).'],
  lessons: [
    {
      id: 'map',
      title: 'The typing map',
      blocks: [
        { kind: 'analogy', text: "Think of four ways to check a contractor. **Duck typing**: just let them start and see if they can do it. **Goose typing**: check they hold a certificate from a recognised body (an ABC), checked at runtime with `isinstance`. **Static duck typing**: check their CV lists the right skills before the job (a Protocol, checked by mypy). **Static typing**: check they belong to the right firm (a concrete class)." },
        { kind: 'list', items: [
          '**Duck typing** (runtime, structural): call the method; handle `AttributeError`/`TypeError` if needed. Python\'s default since the beginning.',
          '**Goose typing** (runtime, nominal-ish): `isinstance(x, collections.abc.Mapping)`. ABCs can recognise classes that never inherited from them.',
          '**Static duck typing** (static, structural): `typing.Protocol`, like Go interfaces and TypeScript.',
          '**Static typing** (static, nominal): annotate with concrete classes or ABCs, like Java.',
        ] },
        { kind: 'compare',
          python: `def total(xs: Iterable[float]) -> float: ...   # ABC used as a static type
isinstance(x, Mapping)                          # goose typing at runtime`,
          ts: `function total(xs: Iterable<number>): number   // structural, compile time only`,
          go: `func Total(xs interface{ Values() []float64 }) float64   // implicit, structural`,
          java: `double total(Iterable<Double> xs)   // nominal: classes declare implements`,
          cpp: `double total(std::ranges::input_range auto&& xs);   // concept: structural, compile time`,
          note: 'Python is unusual in offering all four styles at once.' },
        { kind: 'check', q: 'Which style is `typing.Protocol`?', options: ['Duck typing', 'Goose typing', 'Static duck typing', 'Nominal static typing'], answer: 2, hint: 'Structural, checked before running.', explain: 'Like a Go interface.' },
      ],
    },
    {
      id: 'dynamic',
      title: 'Dynamic protocols',
      blocks: [
        { kind: 'analogy', text: "Python's interpreter is generous about partial protocols. Give a class only `__getitem__` and it will still try to iterate it (calling `obj[0]`, `obj[1]`… until `IndexError`) and answer `in`. It's like a shop that accepts a library card as ID because it has a photo: not the official document, but good enough for the job." },
        { kind: 'code', code: `class Ladder:
    def __init__(self, rungs): self._rungs = list(rungs)
    def __getitem__(self, i): return self._rungs[i]

lad = Ladder([2380, 2385, 2390])
for px in lad: print(px)        # works: falls back to __getitem__ from 0 until IndexError
2385 in lad                     # True: also via iteration
# len(lad)                      TypeError: no __len__

import random
class Deck:
    def __init__(self): self._cards = list(range(52))
    def __len__(self): return len(self._cards)
    def __getitem__(self, i): return self._cards[i]

random.shuffle(Deck())          # TypeError: 'Deck' object does not support item assignment
Deck.__setitem__ = lambda self, i, v: self._cards.__setitem__(i, v)   # monkey-patch the protocol
random.shuffle(d := Deck())     # works now: shuffle only needed __len__, __getitem__, __setitem__` },
        { kind: 'check', q: 'Why could `random.shuffle` work after adding `__setitem__`?', options: ['It checks inheritance from list', 'It only uses the methods it needs: duck typing', 'It copies to a list', 'It uses __iter__'], answer: 1, hint: 'Mutable sequence protocol.', explain: 'Monkey-patching is a demo trick; define the method in the class normally.' },
      ],
    },
    {
      id: 'goose',
      title: 'Goose typing with ABCs',
      blocks: [
        { kind: 'analogy', text: "An abstract base class is a professional body that issues certificates. Subclass it and it checks you implemented the required methods before letting you be instantiated. It can also recognise members who never applied: `Sized` accepts anything with a `__len__`, and `register()` lets you vouch for a class explicitly." },
        { kind: 'code', code: `from abc import ABC, abstractmethod
from collections.abc import Sized, Mapping

class DataFeed(ABC):
    @abstractmethod
    def bars(self, sym: str) -> list[float]: ...

    def last(self, sym: str) -> float:          # concrete method built on the abstract one
        return self.bars(sym)[-1]

class CsvFeed(DataFeed):
    def bars(self, sym): return [2385.0, 2390.5]

# DataFeed()            TypeError: Can't instantiate abstract class DataFeed ...
CsvFeed().last("XAU")   # 2390.5

class Book:
    def __len__(self): return 3
isinstance(Book(), Sized)          # True: __subclasshook__ checks for __len__
isinstance({}, Mapping)            # True

@DataFeed.register                 # a "virtual subclass": trusted, not checked
class LegacyFeed:
    def bars(self, sym): return []
isinstance(LegacyFeed(), DataFeed) # True` },
        { kind: 'list', items: [
          'Prefer `isinstance(x, collections.abc.Mapping)` over `isinstance(x, dict)`: it accepts any mapping, including ones you haven\'t met.',
          'Don\'t write your own ABCs casually. They\'re for frameworks with many implementers; most code is better served by Protocols or plain duck typing.',
        ] },
        { kind: 'check', q: 'What happens if a subclass of an ABC fails to implement an abstract method?', options: ['Nothing until the method is called', 'Instantiating the subclass raises TypeError', 'A warning at import', 'The base method runs'], answer: 1, hint: 'The certificate check happens at instantiation.', explain: 'Defining the class is fine; creating an instance fails.' },
      ],
    },
    {
      id: 'static',
      title: 'Static protocols',
      blocks: [
        { kind: 'analogy', text: "A Protocol is a CV filter run before the interview. Anything listing the right skills gets through, with no paperwork. Add `@runtime_checkable` and the same filter can also be used at the door with `isinstance`, though at runtime it only checks that the methods exist, not their signatures." },
        { kind: 'code', code: `from typing import Protocol, runtime_checkable, SupportsFloat, override

@runtime_checkable
class Closeable(Protocol):
    def close(self) -> None: ...

def shutdown(*things: Closeable) -> None:
    for t in things: t.close()

import io
isinstance(io.StringIO(), Closeable)       # True: has close()
isinstance(42, SupportsFloat)              # True: has __float__ (typing's built-in protocols)

class Base:
    def fee(self) -> float: return 0.0
class Child(Base):
    @override
    def fee(self) -> float: return 1.0      # checker errors if Base has no fee()` },
        { kind: 'pitfall', text: '`isinstance` with a runtime-checkable Protocol only checks that the attribute names exist. A `close` that takes three required arguments still passes. Static checkers are the real enforcement.' },
        { kind: 'check', q: 'What does `@runtime_checkable` add to a Protocol?', options: ['Static checking', 'The ability to use it with isinstance (name-only check)', 'Automatic implementation', 'Speed'], answer: 1, hint: 'Runtime vs static.', explain: 'Without it, isinstance raises TypeError.' },
      ],
    },
    {
      id: 'design',
      title: 'Designing protocols',
      blocks: [
        { kind: 'analogy', text: "Good protocols are narrow, like single-purpose power sockets. A one-method protocol (\"can be closed\", \"can give me a price\") is easy to satisfy, easy to fake in tests and easy to combine. A twelve-method protocol is a bespoke socket nobody else's plug fits." },
        { kind: 'code', code: `class SupportsPrice(Protocol):
    def price(self) -> float: ...

class SupportsGreeks(Protocol):
    def delta(self) -> float: ...
    def gamma(self) -> float: ...

class OptionLike(SupportsPrice, SupportsGreeks, Protocol):   # compose small protocols
    ...

# In tests, any tiny class works as a fake:
class FakeInstrument:
    def price(self) -> float: return 100.0

def mark_to_market(pos: dict[str, SupportsPrice]) -> float:
    return sum(i.price() for i in pos.values())

mark_to_market({"x": FakeInstrument()})   # 100.0` },
        { kind: 'list', items: [
          'Define protocols where they\'re **used** (the consumer), not where they\'re implemented. This is Go\'s advice too.',
          'Name them by capability: `SupportsX`, `Closeable`, `Priceable`.',
          'Composite protocols must list `Protocol` among their bases again.',
        ] },
        { kind: 'check', q: 'Where should a protocol usually be defined?', options: ['With each implementation', 'Near the code that consumes it', 'In a global types module only', 'In tests'], answer: 1, hint: 'Who needs the capability?', explain: 'The consumer knows exactly which methods it requires.' },
      ],
    },
  ],
  quiz: [
    { q: 'Goose typing means…', options: ['No checks', 'Runtime checks against ABCs with isinstance', 'Static protocols', 'Type hints only'], answer: 1, explain: 'Ramalho\'s term (from Alex Martelli).' },
    { q: 'Can a class with only __getitem__ be iterated?', options: ['No', 'Yes: Python falls back to indexing from 0', 'Only with __len__', 'Only if it subclasses Sequence'], answer: 1, explain: 'A legacy fallback.' },
    { q: 'Why prefer `isinstance(x, Mapping)` over `isinstance(x, dict)`?', options: ['Speed', 'It accepts any mapping implementation', 'dict is deprecated', 'Mapping is faster to import'], answer: 1, explain: 'Less restrictive.' },
    { q: 'What does `ABC.register(cls)` create?', options: ['A real subclass', 'A virtual subclass recognised by isinstance', 'A Protocol', 'An instance'], answer: 1, explain: 'No checks are done.' },
    { q: 'Instantiating an ABC subclass missing an abstract method…', options: ['Works', 'Raises TypeError', 'Warns', 'Calls the base'], answer: 1, explain: 'Checked at instantiation.' },
    { q: 'Runtime isinstance with a Protocol checks…', options: ['Full signatures', 'Only that the attributes exist', 'Return types', 'Nothing'], answer: 1, explain: 'And requires @runtime_checkable.' },
    { q: 'What does `@override` (3.12) do?', options: ['Changes behaviour at runtime', 'Lets type checkers verify a method really overrides a base method', 'Makes methods final', 'Nothing'], answer: 1, explain: 'Catches typos and stale overrides.' },
    { q: 'Good protocols are usually…', options: ['Large', 'Narrow, with one or a few methods', 'Abstract classes', 'Generic only'], answer: 1, explain: 'Compose them when needed.' },
  ],
}
