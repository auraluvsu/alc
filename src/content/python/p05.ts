import type { Module } from '../types'

export const p05: Module = {
  n: 5,
  title: 'Data Class Builders',
  tour: '5 · Data Class Builders',
  summary: 'Three ways to build record-like classes (namedtuple, typing.NamedTuple, @dataclass), their options and trade-offs, type hints at a glance, and class patterns in match.',
  topics: ['namedtuple', 'typing.NamedTuple', '@dataclass', 'Dataclass options', 'Type hints 101', 'Class patterns'],
  cpp23: [
    '`copy.replace(obj, **changes)` works on dataclasses and named tuples (3.13).',
    'Annotations are evaluated lazily (3.14, PEP 649/749), so forward references no longer need quotes.',
    '`@dataclass(slots=True, kw_only=True)` (3.10) is now common in modern code.',
  ],
  lessons: [
    {
      id: 'why',
      title: 'Why data class builders',
      blocks: [
        { kind: 'analogy', text: "Writing a record class by hand is filling in the same form every time: an `__init__` that copies each argument, a `__repr__` that lists each field, an `__eq__` that compares each field. A class builder is a form printer: you list the fields once, and it prints all that boilerplate for you." },
        { kind: 'code', code: `# By hand: 12 lines of boilerplate, and it is easy to forget a field in __eq__
class Trade:
    def __init__(self, sym, px, qty):
        self.sym, self.px, self.qty = sym, px, qty
    def __repr__(self):
        return f"Trade(sym={self.sym!r}, px={self.px!r}, qty={self.qty!r})"
    def __eq__(self, other):
        return (self.sym, self.px, self.qty) == (other.sym, other.px, other.qty)

# With a builder: the same behaviour
from dataclasses import dataclass

@dataclass
class Trade:
    sym: str
    px: float
    qty: int = 1

Trade("XAU", 2390.5)                     # Trade(sym='XAU', px=2390.5, qty=1)
Trade("XAU", 2390.5) == Trade("XAU", 2390.5)   # True` },
        { kind: 'list', items: [
          '`collections.namedtuple`: a tuple subclass with named fields. Immutable, lightweight, works where tuples are expected.',
          '`typing.NamedTuple`: the same thing, written as a class with type annotations, and able to have methods.',
          '`@dataclasses.dataclass`: a normal class (mutable by default) with generated methods and lots of options.',
        ] },
        { kind: 'compare',
          ts: `interface Trade { sym: string; px: number; qty: number }
const t: Trade = { sym: "XAU", px: 2390.5, qty: 1 }
// no generated equality: compare field by field`,
          go: `type Trade struct {
    Sym string
    Px  float64
    Qty int
}
t := Trade{Sym: "XAU", Px: 2390.5, Qty: 1}   // == works on comparable structs`,
          java: `record Trade(String sym, double px, int qty) {}
var t = new Trade("XAU", 2390.5, 1);   // equals/hashCode/toString generated`,
          cpp: `struct Trade {
    std::string sym; double px; int qty = 1;
    auto operator<=>(const Trade&) const = default;   // generated comparisons
};`,
          python: `@dataclass(frozen=True, slots=True)
class Trade:
    sym: str
    px: float
    qty: int = 1`,
          note: 'A frozen dataclass is Python\'s closest match to a Java record or a Go struct value.' },
        { kind: 'check', q: 'Which builder produces instances that ARE tuples?', options: ['@dataclass', 'namedtuple and typing.NamedTuple', 'Only typing.NamedTuple', 'None of them'], answer: 1, hint: 'Which ones can be unpacked and indexed like (a, b, c)?', explain: 'Both named-tuple builders create tuple subclasses; dataclasses create ordinary classes.' },
      ],
    },
    {
      id: 'namedtuple',
      title: 'Named tuples',
      blocks: [
        { kind: 'analogy', text: "A named tuple is a tuple with column headers printed on it. It is still a sealed, ordered record that you can unpack and index, but you can also read fields by name, so `quote[1]` becomes `quote.px`." },
        { kind: 'code', code: `from collections import namedtuple
Quote = namedtuple("Quote", "sym bid ask")
q = Quote("XAU", 2390.3, 2390.7)
q.bid, q[1]                      # (2390.3, 2390.3)
sym, bid, ask = q                # unpack like any tuple
q._asdict()                      # {'sym': 'XAU', 'bid': 2390.3, 'ask': 2390.7}
q2 = q._replace(bid=2390.4)      # a new tuple with one field changed

from typing import NamedTuple
class Bar(NamedTuple):
    ts: int
    open: float
    high: float
    low: float
    close: float
    volume: int = 0              # defaults allowed

    @property
    def range(self) -> float:    # methods are allowed too
        return self.high - self.low

b = Bar(1730812800, 2385.0, 2396.2, 2381.4, 2390.5)
b.range                          # 14.8 (approximately: floats)` },
        { kind: 'list', items: [
          'Named tuples are as memory-cheap as tuples and immutable, which makes them good for large numbers of small records.',
          'They compare and hash like tuples, so `Quote("XAU", 1, 2) == ("XAU", 1, 2)` is True, which is sometimes surprising.',
        ] },
        { kind: 'check', q: 'How do you get a copy of a named tuple with one field changed?', options: ['`q.bid = x`', '`q._replace(bid=x)` (or `copy.replace(q, bid=x)` in 3.13+)', '`q.copy(bid=x)`', 'You can\'t'], answer: 1, hint: 'Named tuples are immutable, so the change must produce a new one.', explain: '`_replace` returns a new instance. 3.13 added the generic `copy.replace`.' },
      ],
    },
    {
      id: 'dataclass',
      title: '@dataclass in depth',
      blocks: [
        { kind: 'analogy', text: "`@dataclass` is a form printer with a settings panel: switch on `frozen` for an immutable record, `order` for sorting operators, `slots` for a leaner memory layout, `kw_only` to force named arguments. Each switch prints more (or different) boilerplate." },
        { kind: 'code', code: `from dataclasses import dataclass, field, asdict, replace
import copy

@dataclass(frozen=True, slots=True, order=True)
class Level:
    px: float
    qty: int

@dataclass(kw_only=True)
class Order:
    sym: str
    side: str
    qty: int
    tags: list[str] = field(default_factory=list)   # NEVER tags: list = []
    id: str = field(default="", compare=False, repr=False)

    def __post_init__(self):                         # validation after the generated __init__
        if self.qty <= 0:
            raise ValueError("qty must be positive")

o = Order(sym="XAU", side="BUY", qty=10)
asdict(o)                                 # nested dicts, handy for JSON
o2 = copy.replace(o, qty=5)               # 3.13+ (dataclasses.replace works on older versions)
sorted([Level(2390.5, 3), Level(2389.9, 7)])   # order=True compares as tuples of fields
# Level(1, 2).px = 3                      # FrozenInstanceError` },
        { kind: 'list', items: [
          '**`frozen=True`**: assignments raise an error, and instances become hashable (usable as dict keys).',
          '**`slots=True`**: uses `__slots__`, so it is smaller and slightly faster, but you can\'t add arbitrary attributes.',
          '**`kw_only=True`**: callers must name every argument, which avoids mixing up `px` and `qty`.',
          '**`field(default_factory=list)`**: each instance gets its own fresh list. A plain `= []` default is rejected for exactly this reason (module 6).',
        ] },
        { kind: 'pitfall', text: "`frozen=True` is shallow. A frozen dataclass holding a list still lets you `o.tags.append(...)`. Use tuples or frozensets for fields that must not change." },
        { kind: 'check', q: 'Why does `@dataclass` reject `tags: list = []`?', options: ['Lists can\'t be fields', 'A mutable default would be shared by every instance', 'It needs a type parameter', 'It doesn\'t'], answer: 1, hint: 'How many times is the default expression evaluated?', explain: 'Defaults are evaluated once, at class definition. `default_factory` creates a new list per instance.' },
      ],
    },
    {
      id: 'hints',
      title: 'Type hints 101',
      blocks: [
        { kind: 'analogy', text: "Type hints are labels on the jars, not locks. Python itself doesn't check them at runtime: a jar labelled \"sugar\" happily accepts salt. Tools like mypy, pyright and your editor read the labels and warn you before you run anything. Dataclasses read them only to find out which fields exist." },
        { kind: 'code', code: `@dataclass
class Fill:
    px: float
    qty: int

Fill("not a number", None)           # runs fine! hints aren't enforced at runtime
# mypy: error: Argument 1 to "Fill" has incompatible type "str"; expected "float"

from dataclasses import fields
[f.name for f in fields(Fill)]       # ['px', 'qty']: hints define the fields

class Node:
    next: Node | None = None          # 3.14: forward reference works without quotes
    # pre-3.14 needed: next: "Node | None" = None

import annotationlib                 # 3.14: inspect annotations without evaluating them
annotationlib.get_annotations(Node, format=annotationlib.Format.STRING)` },
        { kind: 'new23', text: 'Python 3.14 evaluates annotations **lazily** (PEP 649/749): they are computed only when something asks for them. Forward references like `next: Node` work without quotes, and `from __future__ import annotations` is no longer needed. Modules 8 and 15 cover typing properly, including the 3.12 `def f[T](x: T)` generics syntax.' },
        { kind: 'check', q: 'What does Python do at runtime with `Fill("abc", None)` when the hints say float and int?', options: ['TypeError', 'Nothing: it runs; hints are for tools', 'Converts the values', 'Warns'], answer: 1, hint: 'Labels, not locks.', explain: 'Static checkers report it; the interpreter doesn\'t. Use pydantic or `__post_init__` for runtime validation.' },
      ],
    },
    {
      id: 'patterns',
      title: 'Class patterns',
      blocks: [
        { kind: 'analogy', text: "Class patterns in `match` are a sorting machine that checks an object's type and peeks at its fields in one move: \"is it a Fill with qty over 100? put it here\". Dataclasses and named tuples define `__match_args__`, so you can even match fields by position." },
        { kind: 'code', code: `from dataclasses import dataclass

@dataclass
class Fill:   sym: str; px: float; qty: int
@dataclass
class Cancel: order_id: str
@dataclass
class Reject: order_id: str; reason: str

def handle(event):
    match event:
        case Fill(sym="XAU", qty=q) if q >= 100:     # keyword pattern + guard
            return f"big gold fill: {q}"
        case Fill(sym, px, qty):                       # positional: uses __match_args__
            return f"fill {qty} {sym} @ {px}"
        case Cancel(order_id=oid) | Reject(order_id=oid):   # alternatives
            return f"order {oid} closed"
        case _:
            raise ValueError(f"unknown event {event!r}")

Fill.__match_args__        # ('sym', 'px', 'qty')` },
        { kind: 'list', items: [
          'Built-ins work too: `case int(n)`, `case str(s)`, `case [float(a), float(b)]`.',
          'A bare name in a pattern **binds** a variable; it never compares against an existing variable. Use dotted names (`Side.BUY`) or guards for constants.',
        ] },
        { kind: 'pitfall', text: '`case BUY:` where BUY is a module-level constant does **not** compare with BUY. It captures anything into a new variable named BUY and always matches. Use `case Side.BUY:` (a dotted name) or `case x if x == BUY:`.' },
        { kind: 'check', q: 'In `match cmd: case limit:` where `limit = 10` was defined earlier, what happens?', options: ['Compares cmd == 10', 'Always matches and rebinds limit to cmd', 'SyntaxError', 'Compares identity'], answer: 1, hint: 'Bare names in patterns are capture patterns.', explain: 'It is a capture pattern: it matches anything and assigns. (Python flags it if it makes later cases unreachable.)' },
      ],
    },
  ],
  quiz: [
    { q: 'Which builder gives mutable instances by default?', options: ['namedtuple', 'typing.NamedTuple', '@dataclass', 'All'], answer: 2, explain: 'Use `frozen=True` for immutability.' },
    { q: 'What does `frozen=True` on a dataclass give you?', options: ['Faster attribute access', 'Assignment raises, and instances are hashable', 'Deep immutability', 'Slots'], answer: 1, explain: 'Immutability is shallow.' },
    { q: 'How do you give a dataclass field a list default?', options: ['`tags: list = []`', '`tags: list = field(default_factory=list)`', '`tags = list`', '`tags: list = None` only'], answer: 1, explain: 'A fresh list per instance.' },
    { q: 'Are type hints enforced at runtime?', options: ['Yes, always', 'No; they are for static checkers, tools and introspection', 'Only in dataclasses', 'Only with -O'], answer: 1, explain: 'Libraries like pydantic add runtime validation.' },
    { q: 'What does `__post_init__` do?', options: ['Runs before __init__', 'Runs after the generated __init__, for validation or derived fields', 'Replaces __init__', 'Is for slots'], answer: 1, explain: 'It is the hook dataclasses provide.' },
    { q: 'What does `copy.replace(obj, x=1)` (3.13) work on?', options: ['Only dicts', 'Dataclasses, named tuples and other types that support __replace__', 'Only lists', 'Nothing yet'], answer: 1, explain: 'It is the generic version of `_replace` / `dataclasses.replace`.' },
    { q: 'What does `case Fill(sym, px, qty)` rely on?', options: ['__slots__', '__match_args__', '__eq__', '__hash__'], answer: 1, explain: 'Dataclasses and named tuples generate it.' },
    { q: 'What changed about annotations in Python 3.14?', options: ['They are enforced', 'They are evaluated lazily, so forward references need no quotes', 'They were removed', 'They must be strings'], answer: 1, explain: 'PEP 649/749.' },
  ],
}
