import type { Module } from '../types'

export const p08: Module = {
  n: 8,
  title: 'Type Hints in Functions',
  tour: '8 · Type Hints in Functions',
  summary: 'Gradual typing: annotations that the interpreter ignores and a type checker enforces. The types you\'ll use most, unions and Optional, generics with the modern syntax, protocols for static duck typing, and running mypy or pyright.',
  topics: ['Gradual typing', 'Types usable in annotations', 'Optional & union syntax', 'Protocols', 'Annotating parameters', 'Running a type checker'],
  cpp23: [
    '`def f[T](x: T)` type parameter syntax (3.12, PEP 695).',
    '`type` aliases (3.12).',
    'Lazily evaluated annotations (3.14, PEP 649): forward references just work, no quotes needed.',
    '`TypeForm` (3.15, PEP 747) for functions that take a type expression as a value.',
  ],
  lessons: [
    {
      id: 'gradual',
      title: 'Gradual typing',
      blocks: [
        { kind: 'analogy', text: "Type hints are labels on boxes in a warehouse. The forklift (the interpreter) never reads them; it'll happily put a fridge in a box labelled \"cutlery\". The inspector (mypy, pyright, your editor) reads every label before shipping and flags mismatches. You can label as many or as few boxes as you like; unlabelled boxes are waved through as `Any`." },
        { kind: 'code', code: `def notional(qty: int, px: float) -> float:
    return qty * px

notional("3", 2.0)        # runs! returns '3' * 2.0 → TypeError only because str * float fails
notional(3, "2")          # returns '222': no runtime check at all
notional.__annotations__  # {'qty': <class 'int'>, 'px': <class 'float'>, 'return': <class 'float'>}

# $ mypy trade.py
# error: Argument 2 to "notional" has incompatible type "str"; expected "float"` },
        { kind: 'compare',
          python: `def notional(qty: int, px: float) -> float: ...   # checked by a separate tool`,
          ts: `function notional(qty: number, px: number): number { ... }   // checked by tsc, erased at runtime`,
          go: `func notional(qty int, px float64) float64 { ... }   // enforced by the compiler`,
          java: `double notional(int qty, double px) { ... }   // enforced by javac and the JVM`,
          cpp: `double notional(int qty, double px);   // enforced by the compiler (with implicit conversions)`,
          note: 'Python hints work like TypeScript\'s: a static check, erased at runtime.' },
        { kind: 'list', items: [
          '`int` is accepted where `float` is expected, and `float` where `complex` is: a special "numeric tower" rule.',
          'Unannotated functions aren\'t checked by mypy by default. Turn on `--strict` (or pyright\'s strict mode) once a codebase is fully typed.',
        ] },
        { kind: 'check', q: 'What happens at runtime when you pass a str to a parameter annotated `float`?', options: ['TypeError immediately', 'Nothing special: annotations aren\'t enforced at runtime', 'It is converted to float', 'A warning'], answer: 1, hint: 'Who reads the labels?', explain: 'Only the type checker (or a library like pydantic) acts on hints.' },
      ],
    },
    {
      id: 'types',
      title: 'Types you\'ll use daily',
      blocks: [
        { kind: 'analogy', text: "Annotating parameters is choosing how fussy to be about what you accept. Ask for the loosest thing you actually need (\"anything I can loop over\", an `Iterable`) and promise the most specific thing you return (\"a `list[float]`\"). Be liberal in what you accept, conservative in what you send." },
        { kind: 'code', code: `from collections.abc import Iterable, Sequence, Mapping, Callable

def total(xs: Iterable[float]) -> float:          # accepts lists, tuples, generators…
    return sum(xs)

def last_n(xs: Sequence[float], n: int) -> list[float]:   # needs len() and slicing
    return list(xs[-n:])

def lookup(prices: Mapping[str, float], sym: str) -> float | None:
    return prices.get(sym)                          # X | None means "may be None"

def apply(f: Callable[[float], float], xs: list[float]) -> list[float]:
    return [f(x) for x in xs]

Quote = tuple[str, float, float]                    # fixed-length tuple
Prices = dict[str, list[float]]
type Signal = Callable[[Sequence[float]], int]      # 3.12+ type alias statement` },
        { kind: 'list', items: [
          'Use built-in generics (`list[int]`, `dict[str, float]`) and `collections.abc` ABCs; `typing.List` and friends are deprecated aliases.',
          '`X | None` (3.10+) replaces `Optional[X]`; `int | str` replaces `Union[int, str]`.',
          '`Any` switches checking off for a value. `object` accepts anything but lets you do almost nothing with it until you narrow it.',
        ] },
        { kind: 'check', q: 'A function only loops over its input once. Which annotation is best?', options: ['list[float]', 'Iterable[float]', 'Sequence[float]', 'Any'], answer: 1, hint: 'Accept the loosest thing you need.', explain: 'Then callers can pass a generator, tuple, set or list.' },
      ],
    },
    {
      id: 'generics',
      title: 'Generic functions',
      blocks: [
        { kind: 'analogy', text: "A type parameter is a blank on the form that gets filled in once per call and must match everywhere it appears. `first[T](xs: Sequence[T]) -> T` says: whatever type the items are, that's the type you get back. The checker fills in the blank from the argument." },
        { kind: 'code', code: `from collections.abc import Sequence, Hashable

def first[T](xs: Sequence[T]) -> T:          # 3.12+ syntax
    return xs[0]

first([1, 2, 3])          # checker infers int
first(["XAU", "XAG"])     # checker infers str

def mode[T: Hashable](xs: Sequence[T]) -> T:          # bound: T must be hashable
    from collections import Counter
    return Counter(xs).most_common(1)[0][0]

def clamp[N: (int, float)](x: N, lo: N, hi: N) -> N:  # constrained: exactly int or float
    return max(lo, min(x, hi))

# Pre-3.12 equivalent:
from typing import TypeVar
T = TypeVar("T")
def first_old(xs: Sequence[T]) -> T: return xs[0]` },
        { kind: 'new23', text: 'PEP 695 (3.12) gives Python the bracket syntax familiar from TypeScript, Go and Java: `def f[T](...)`, `class Box[T]:`, `type Alias[T] = ...`. No more module-level `TypeVar` declarations.' },
        { kind: 'check', q: 'What does `[T: Hashable]` express?', options: ['T must be exactly Hashable', 'T can be any type that is a subtype of Hashable (an upper bound)', 'T is optional', 'T defaults to Hashable'], answer: 1, hint: 'Like `T extends Hashable` in TypeScript.', explain: '`[N: (int, float)]` (a tuple) means "one of exactly these".' },
      ],
    },
    {
      id: 'protocols',
      title: 'Static protocols',
      blocks: [
        { kind: 'analogy', text: "A Protocol is a job advert listing skills, not a family tree. \"Must have a `price()` method returning float.\" Any class with that method qualifies, whether or not it has heard of the advert. That's duck typing, checked statically: exactly how Go interfaces and TypeScript structural types work." },
        { kind: 'code', code: `from typing import Protocol

class Priceable(Protocol):
    def price(self) -> float: ...

class Bond:
    def price(self) -> float: return 98.75

class Option:
    def price(self) -> float: return 4.20

def book_value(items: list[Priceable]) -> float:
    return sum(i.price() for i in items)

book_value([Bond(), Option()])    # OK for the checker: no inheritance needed` },
        { kind: 'compare',
          python: `class Priceable(Protocol):
    def price(self) -> float: ...`,
          ts: `interface Priceable { price(): number }   // structural, like Protocol`,
          go: `type Priceable interface { Price() float64 }   // satisfied implicitly`,
          java: `interface Priceable { double price(); }   // classes must declare "implements"`,
          cpp: `template <class T> concept Priceable = requires(T t) { { t.price() } -> std::convertible_to<double>; };`,
          note: 'Protocols are structural (Go/TS/C++ concepts); Java interfaces are nominal.' },
        { kind: 'check', q: 'Does `Bond` need to inherit from `Priceable` to be accepted?', options: ['Yes', 'No: matching methods are enough', 'Only at runtime', 'Only if decorated'], answer: 1, hint: 'Job advert, not family tree.', explain: 'Add `@runtime_checkable` if you also want `isinstance` checks (module 13).' },
      ],
    },
    {
      id: 'checker',
      title: 'Running a type checker',
      blocks: [
        { kind: 'analogy', text: "Turning on a type checker in an existing codebase is like a first MOT on an old car: expect a long list. Start lenient, fix the important failures, and tighten the rules over time instead of trying to pass everything on day one." },
        { kind: 'code', code: `# pyproject.toml
[tool.mypy]
python_version = "3.15"
strict = true                # enable once the codebase is mostly annotated
warn_unused_ignores = true

# Escape hatches, used sparingly:
x = cast(float, json_value)          # "trust me"
result = legacy_call()  # type: ignore[no-untyped-call]

reveal_type(first([1.0]))            # mypy prints: Revealed type is "float"` },
        { kind: 'new23', text: 'Since 3.14 (PEP 649) annotations are evaluated lazily, only when something asks for them. A method can refer to its own class (`def merge(self, other: Order) -> Order`) without quotes or `from __future__ import annotations`. Use `annotationlib.get_annotations()` to read them at runtime.' },
        { kind: 'list', items: [
          '**mypy** is the reference checker; **pyright** (and Pylance in VS Code) is faster and stricter by default; newer Rust-based checkers are also appearing.',
          'Runtime validation is a different job: libraries like pydantic read annotations to validate and parse untrusted data (API payloads, config).',
        ] },
        { kind: 'check', q: 'Which tool would validate a JSON order payload at runtime using your type hints?', options: ['mypy', 'pydantic', 'pyright', 'The interpreter itself'], answer: 1, hint: 'Static checkers never see runtime data.', explain: 'Static checkers analyse code; pydantic validates values.' },
      ],
    },
  ],
  quiz: [
    { q: 'Are type hints enforced by CPython at runtime?', options: ['Yes', 'No', 'Only in strict mode', 'Only for int'], answer: 1, explain: 'A separate tool checks them.' },
    { q: 'Modern spelling of `Optional[str]`?', options: ['str?', 'str | None', 'Maybe[str]', 'str or None'], answer: 1, explain: '3.10+.' },
    { q: 'Where should Iterable and Mapping be imported from?', options: ['typing', 'collections.abc', 'builtins', 'abc'], answer: 1, explain: 'The typing aliases are deprecated.' },
    { q: 'Which is the 3.12+ generic function syntax?', options: ['def f<T>(x: T)', 'def f[T](x: T) -> T', 'def f(x: T) where T', 'generic def f'], answer: 1, explain: 'PEP 695.' },
    { q: 'What does `Any` do to type checking?', options: ['Accepts only objects', 'Turns checking off for that value', 'Requires a cast', 'Means None'], answer: 1, explain: 'Prefer `object` when you want safety.' },
    { q: 'A Protocol is matched by…', options: ['Inheritance', 'Having the required methods and attributes', 'A decorator', 'Name'], answer: 1, explain: 'Structural typing.' },
    { q: 'What changed in 3.14 for annotations?', options: ['They are enforced', 'They are evaluated lazily', 'They were removed', 'They must be strings'], answer: 1, explain: 'PEP 649.' },
    { q: 'Which declares a type alias in 3.12+?', options: ['alias X = int', 'type X = int', 'X: TypeAlias', 'typedef X int'], answer: 1, explain: 'The `type` statement.' },
  ],
}
