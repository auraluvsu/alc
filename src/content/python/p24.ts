import type { Module } from '../types'

export const p24: Module = {
  n: 24,
  title: 'Class Metaprogramming',
  tour: '24 · Class Metaprogramming',
  summary: 'Classes are objects created at runtime: building classes with type(), customising subclasses with __init_subclass__, class decorators, metaclasses and when they\'re actually needed, and what happens at import time vs runtime.',
  topics: ['Classes as objects', 'type as a class factory', '__init_subclass__', 'Class decorators', 'Metaclasses', 'Import time vs runtime'],
  cpp23: ['Lazy imports with the `lazy` keyword (3.15, PEP 810) defer module loading until first use.'],
  lessons: [
    {
      id: 'objects',
      title: 'Classes as objects & type()',
      blocks: [
        { kind: 'analogy', text: "A class is itself an object, produced by a factory called `type`. The `class` statement is just friendly syntax for asking that factory to build one: here's a name, here are the parents, here's a dict of what goes inside. You can call the factory directly and get a class out." },
        { kind: 'code', code: `class Order:
    side = "buy"
    def notional(self): return self.qty * self.px

type(Order)                 # <class 'type'>: classes are instances of type
type(type)                  # <class 'type'>

# The same class built by calling type(name, bases, namespace):
def notional(self): return self.qty * self.px
Order2 = type("Order2", (object,), {"side": "buy", "notional": notional})
Order2.__name__, Order2.side      # ('Order2', 'buy')

def record_factory(cls_name: str, field_names: str):
    """A tiny namedtuple: builds a class with __slots__, __init__ and __repr__."""
    slots = tuple(field_names.replace(",", " ").split())
    def __init__(self, *args):
        for name, value in zip(slots, args, strict=True):
            setattr(self, name, value)
    def __repr__(self):
        values = ", ".join(f"{n}={getattr(self, n)!r}" for n in slots)
        return f"{cls_name}({values})"
    return type(cls_name, (object,), {"__slots__": slots, "__init__": __init__, "__repr__": __repr__})

Tick = record_factory("Tick", "ts px qty")
Tick(0, 2385.0, 1)                # Tick(ts=0, px=2385.0, qty=1)` },
        { kind: 'check', q: 'What is `type(SomeClass)` for an ordinary class?', options: ['object', 'type', 'class', 'SomeClass'], answer: 1, hint: 'Who manufactured it?', explain: 'type is the default metaclass.' },
      ],
    },
    {
      id: 'initsubclass',
      title: '__init_subclass__',
      blocks: [
        { kind: 'analogy', text: "`__init_subclass__` is a parent class's welcome pack for every new subclass. Whenever someone subclasses it, the parent gets a call with the new class in hand and can inspect it, register it, or reject it. It covers most of what people used to write metaclasses for." },
        { kind: 'code', code: `class Strategy:
    registry: dict[str, type["Strategy"]] = {}

    def __init_subclass__(cls, /, key: str, **kwargs):      # class keyword arguments arrive here
        super().__init_subclass__(**kwargs)
        if not hasattr(cls, "signal"):
            raise TypeError(f"{cls.__name__} must define signal()")
        Strategy.registry[key] = cls

class Momentum(Strategy, key="mom"):
    def signal(self, px): return px[-1] / px[-21] - 1

class MeanRev(Strategy, key="rev"):
    def signal(self, px): return -(px[-1] / px[-6] - 1)

Strategy.registry               # {'mom': <class 'Momentum'>, 'rev': <class 'MeanRev'>}
# class Broken(Strategy, key="x"): pass     TypeError: Broken must define signal()` },
        { kind: 'check', q: 'When does `__init_subclass__` run?', options: ['When an instance is created', 'When a subclass is defined', 'On import of the base', 'Never automatically'], answer: 1, hint: 'Welcome pack for new subclasses.', explain: 'It receives the new subclass as cls.' },
      ],
    },
    {
      id: 'decorators',
      title: 'Class decorators',
      blocks: [
        { kind: 'analogy', text: "A class decorator is the same gift-wrapping station as a function decorator (module 9), but the parcel is a whole class. It receives the finished class, can add or rewrite methods, and returns it. `@dataclass` is the famous one: it reads your annotations and writes `__init__`, `__repr__` and `__eq__` for you." },
        { kind: 'code', code: `def add_describe(cls):
    """Add a describe() method listing annotated fields."""
    fields = list(cls.__annotations__)
    def describe(self):
        return ", ".join(f"{f}={getattr(self, f)!r}" for f in fields)
    cls.describe = describe
    return cls

@add_describe
class Quote:
    sym: str
    bid: float
    ask: float
    def __init__(self, sym, bid, ask): self.sym, self.bid, self.ask = sym, bid, ask

Quote("XAU", 2385.1, 2385.5).describe()     # "sym='XAU', bid=2385.1, ask=2385.5"

from dataclasses import dataclass
@dataclass(frozen=True, slots=True)          # the class decorator you'll use most
class Fill:
    sym: str
    px: float` },
        { kind: 'check', q: 'What\'s the main limitation of a class decorator compared to __init_subclass__?', options: ['None', 'It only affects the decorated class, not its future subclasses', 'It can\'t add methods', 'It runs at runtime'], answer: 1, hint: 'Subclasses aren\'t decorated automatically.', explain: '__init_subclass__ is inherited.' },
      ],
    },
    {
      id: 'metaclasses',
      title: 'Metaclasses',
      blocks: [
        { kind: 'analogy', text: "If classes are made in the `type` factory, a metaclass is a custom factory. It controls how classes are built from the very start: it can prepare the namespace before the class body runs, and every subclass is made in the same factory. Powerful, but nearly always more than you need; Tim Peters' line is that if you wonder whether you need them, you don't." },
        { kind: 'code', code: `class Final(type):
    """A metaclass that forbids subclassing classes marked final=True."""
    def __new__(mcls, name, bases, ns, final=False, **kw):
        for b in bases:
            if getattr(b, "__final__", False):
                raise TypeError(f"{b.__name__} is final")
        cls = super().__new__(mcls, name, bases, ns, **kw)
        cls.__final__ = final
        return cls

class RiskLimits(metaclass=Final, final=True): ...
# class Looser(RiskLimits): ...     TypeError: RiskLimits is final

type(RiskLimits)        # <class 'Final'>

# Real metaclasses you already use: abc.ABCMeta (behind ABC), enum.EnumMeta,
# and the ones inside Django models and SQLAlchemy declarative bases.` },
        { kind: 'list', items: [
          'Prefer, in order: plain code → class decorator → `__init_subclass__` → metaclass.',
          'A class can only have one metaclass, so combining two libraries that each use one can fail with a "metaclass conflict".',
          '`__prepare__` on a metaclass can supply a custom namespace mapping for the class body, which is the one thing nothing else can do.',
        ] },
        { kind: 'check', q: 'Which job genuinely needs a metaclass?', options: ['Registering subclasses', 'Adding a method to one class', 'Customising the namespace used while the class body executes (__prepare__)', 'Validating attributes'], answer: 2, hint: 'What happens before the body even runs?', explain: 'The others are covered by __init_subclass__, decorators or descriptors.' },
      ],
    },
    {
      id: 'importtime',
      title: 'Import time vs runtime',
      blocks: [
        { kind: 'analogy', text: "Importing a module is building the set before the play. Top-level code runs, class bodies execute, decorators wrap, descriptors get `__set_name__`, `__init_subclass__` fires, all before a single function is called. Knowing what happens during set-building explains most metaprogramming surprises." },
        { kind: 'code', code: `# Order of events when "import strategies" runs, for a class with all the hooks:
# 1. Class body executes top to bottom (attributes, nested functions defined)
# 2. Metaclass __new__ builds the class object
# 3. Descriptors' __set_name__ are called
# 4. Parent's __init_subclass__ is called
# 5. Class decorators are applied, bottom-most first
# Only later, at runtime: __init__, methods, properties, __get__/__set__ on instances.

lazy import pandas as pd          # 3.15+ (PEP 810): bound now, actually imported on first use
def load(path):
    return pd.read_parquet(path)  # pandas loads here, the first time load() runs` },
        { kind: 'new23', text: 'The `lazy` soft keyword (3.15, PEP 810) defers a module\'s import until the name is first used, cutting start-up time for CLIs and scripts that import heavy libraries but don\'t always need them.' },
        { kind: 'check', q: 'Which runs first when a class statement executes?', options: ['Class decorators', 'The class body', '__init_subclass__', '__init__'], answer: 1, hint: 'The namespace has to exist first.', explain: 'Decorators apply last, to the finished class.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is the default metaclass?', options: ['object', 'type', 'ABCMeta', 'class'], answer: 1, explain: 'type builds classes.' },
    { q: 'type(name, bases, ns) returns…', options: ['An instance', 'A new class', 'A string', 'A module'], answer: 1, explain: 'The three-argument form.' },
    { q: '__init_subclass__ receives…', options: ['Each new instance', 'Each new subclass', 'The metaclass', 'Modules'], answer: 1, explain: 'Plus class keyword arguments.' },
    { q: '@dataclass is a…', options: ['Metaclass', 'Class decorator', 'Descriptor', 'Protocol'], answer: 1, explain: 'It writes methods from annotations.' },
    { q: 'Do class decorators affect subclasses?', options: ['Yes', 'No, only the decorated class', 'Only with slots', 'Only with ABC'], answer: 1, explain: 'Use __init_subclass__ for inheritance.' },
    { q: 'A metaclass conflict happens when…', options: ['Two methods share a name', 'Bases have incompatible metaclasses', 'You use slots', 'You import twice'], answer: 1, explain: 'One metaclass per class.' },
    { q: 'What does the `lazy` keyword (3.15) do?', options: ['Makes functions async', 'Defers a module import until first use', 'Caches classes', 'Skips type checking'], answer: 1, explain: 'PEP 810.' },
    { q: 'Rough order of preference for customising classes?', options: ['Metaclass first', 'Plain code, class decorator, __init_subclass__, then metaclass', 'Always __prepare__', 'eval'], answer: 1, explain: 'Simplest tool first.' },
  ],
}
