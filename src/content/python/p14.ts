import type { Module } from '../types'

export const p14: Module = {
  n: 14,
  title: 'Inheritance: For Better or for Worse',
  tour: '14 · Inheritance: For Better or for Worse',
  summary: 'How super() really works, why subclassing dict and list surprises people, multiple inheritance and the method resolution order, mixins, and practical rules for keeping inheritance under control.',
  topics: ['super()', 'Subclassing built-ins', 'Multiple inheritance & MRO', 'Mixin classes', 'Coping with inheritance'],
  cpp23: ['`@typing.final` and `@override` let type checkers police inheritance (3.8 / 3.12).'],
  lessons: [
    {
      id: 'super',
      title: 'super()',
      blocks: [
        { kind: 'analogy', text: "`super()` doesn't mean \"my parent\". It means \"the next class in the queue\". Every class has a fixed queue of ancestors (the MRO), and `super()` hands the call to whoever is next in that queue, which with multiple inheritance may be a sibling you've never heard of." },
        { kind: 'code', code: `from collections import OrderedDict

class LastUpdatedOrderedDict(OrderedDict):
    """Store items in the order they were last updated."""
    def __setitem__(self, key, value):
        super().__setitem__(key, value)          # delegate to the next class in the MRO
        self.move_to_end(key)

d = LastUpdatedOrderedDict(a=1, b=2)
d["a"] = 3
list(d)       # ['b', 'a']

class Account:
    def __init__(self, owner): self.owner = owner
class Margin(Account):
    def __init__(self, owner, limit):
        super().__init__(owner)                  # always initialise the base
        self.limit = limit` },
        { kind: 'check', q: 'What does `super().__setitem__` call?', options: ['Always the direct parent', 'The next class after the current one in the instance\'s MRO', 'object.__setitem__', 'The same method recursively'], answer: 1, hint: 'Queue, not parent.', explain: 'With single inheritance those coincide.' },
      ],
    },
    {
      id: 'builtins',
      title: 'Subclassing built-ins is tricky',
      blocks: [
        { kind: 'analogy', text: "Built-in types like `dict` are written in C, and their methods talk to each other directly rather than through your overrides. It's like changing the front desk procedure at a hotel whose back office ignores the front desk: guests checking in via the back door skip your new rule." },
        { kind: 'code', code: `class DoppelDict(dict):
    def __setitem__(self, key, value):
        super().__setitem__(key, [value] * 2)

dd = DoppelDict(one=1)       # __init__ ignores the override
dd["two"] = 2                # [] uses it
dd.update(three=3)           # update ignores it
dd                           # {'one': 1, 'two': [2, 2], 'three': 3}

from collections import UserDict
class DoppelDict2(UserDict):
    def __setitem__(self, key, value):
        super().__setitem__(key, [value] * 2)

dd2 = DoppelDict2(one=1)     # __init__ goes through __setitem__
dd2.update(two=2)            # so does update
dict(dd2)                    # {'one': [1, 1], 'two': [2, 2]}` },
        { kind: 'pitfall', text: 'Subclass `collections.UserDict`, `UserList` or `UserString` (pure-Python wrappers) when you override methods. Subclassing `dict` or `list` directly is fine only if you add methods without overriding existing ones.' },
        { kind: 'check', q: 'Why did `DoppelDict.update` ignore the overridden `__setitem__`?', options: ['A bug', 'C-implemented built-in methods don\'t call overridden methods', 'update is deprecated', 'Because of kwargs'], answer: 1, hint: 'Back office ignores the front desk.', explain: 'Use UserDict.' },
      ],
    },
    {
      id: 'mro',
      title: 'Multiple inheritance & the MRO',
      blocks: [
        { kind: 'analogy', text: "The method resolution order is a single-file queue Python builds from a family tree (with the C3 algorithm): the class itself first, parents left to right, and no ancestor before all of its descendants. Every attribute lookup walks this queue until someone answers." },
        { kind: 'code', code: `class Root:
    def ping(self): print("Root.ping")
class A(Root):
    def ping(self): print("A.ping"); super().ping()
class B(Root):
    def ping(self): print("B.ping"); super().ping()
class Leaf(A, B):
    def ping(self): print("Leaf.ping"); super().ping()

[c.__name__ for c in Leaf.__mro__]   # ['Leaf', 'A', 'B', 'Root', 'object']
Leaf().ping()
# Leaf.ping
# A.ping
# B.ping       ← A's super() went to B, not Root
# Root.ping` },
        { kind: 'list', items: [
          'This "cooperative" style only works if **every** class in the chain calls `super()`. One class that doesn\'t breaks the chain for everything after it.',
          'Cooperative `__init__` methods should accept `**kwargs` and pass on what they don\'t use.',
          'The diamond (Leaf → A, B → Root) is resolved so Root runs once, unlike naive C++ multiple inheritance without virtual bases.',
        ] },
        { kind: 'check', q: 'In `Leaf(A, B)`, where does A\'s `super().ping()` go?', options: ['Root', 'B', 'object', 'Leaf'], answer: 1, hint: 'Look at the MRO for the instance\'s class.', explain: 'The MRO is Leaf, A, B, Root, object.' },
      ],
    },
    {
      id: 'mixins',
      title: 'Mixin classes',
      blocks: [
        { kind: 'analogy', text: "A mixin is a clip-on accessory, not a vehicle. It adds one behaviour (logging, case-insensitive keys, JSON export) to any class it's clipped onto, but you'd never instantiate it alone. It goes to the left of the main base class so its methods win." },
        { kind: 'code', code: `import collections

def _upper(key):
    return key.upper() if isinstance(key, str) else key

class UpperCaseMixin:
    """Make mapping keys case-insensitive by storing them in upper case."""
    def __setitem__(self, key, item): super().__setitem__(_upper(key), item)
    def __getitem__(self, key): return super().__getitem__(_upper(key))
    def get(self, key, default=None): return super().get(_upper(key), default)
    def __contains__(self, key): return super().__contains__(_upper(key))

class SymbolDict(UpperCaseMixin, collections.UserDict):   # mixin first
    pass

px = SymbolDict()
px["xau"] = 2385.0
px["XAU"], "Xau" in px      # (2385.0, True)` },
        { kind: 'check', q: 'Why is the mixin listed before UserDict?', options: ['Alphabetical order', 'So its methods come first in the MRO and can super() into UserDict', 'Python requires it', 'Speed'], answer: 1, hint: 'Who answers first in the queue?', explain: 'Put it last and UserDict\'s methods would answer first.' },
      ],
    },
    {
      id: 'coping',
      title: 'Coping with inheritance',
      blocks: [
        { kind: 'analogy', text: "Inheritance welds parts together; composition bolts them. Welded parts are strong but hard to change; bolted parts can be swapped. Default to bolts (hold an object and delegate to it) and weld only when the \"is-a\" relationship is real and stable." },
        { kind: 'list', items: [
          '**Favour composition** over inheritance. A `Portfolio` that *has* positions beats one that *is* a list.',
          '**Inherit interfaces, not implementations**: subclass ABCs/Protocols for "is-a", use mixins for reusable behaviour, compose for everything else.',
          '**Make mixins explicit** with a `Mixin` suffix, and don\'t give them state or `__init__` if you can help it.',
          '**Avoid deep hierarchies** and subclassing classes you don\'t control (beyond frameworks designed for it, like Django views).',
          '**Use `@final`** to mark classes or methods not meant to be extended.',
        ] },
        { kind: 'code', code: `from typing import final

class Portfolio:                               # composition: has positions
    def __init__(self):
        self._positions: dict[str, float] = {}
    def __len__(self): return len(self._positions)
    def add(self, sym, qty):
        self._positions[sym] = self._positions.get(sym, 0) + qty

@final
class RiskEngine:                              # checkers reject subclasses
    ...` },
        { kind: 'check', q: 'A `Portfolio` needs list-like storage. What\'s usually best?', options: ['Subclass list', 'Hold a dict or list internally and expose the methods you need', 'Multiple inheritance from list and dict', 'A metaclass'], answer: 1, hint: 'Bolts, not welds.', explain: 'You control the API and avoid built-in subclassing traps.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does super() follow?', options: ['The direct parent only', 'The MRO of the instance\'s class', 'Alphabetical order', 'The module'], answer: 1, explain: 'Next in line.' },
    { q: 'Why avoid overriding methods in subclasses of dict?', options: ['Slow', 'C methods like update and __init__ bypass the overrides', 'Not allowed', 'dict is final'], answer: 1, explain: 'Use UserDict.' },
    { q: 'Which class is safe to subclass for custom mappings?', options: ['dict', 'collections.UserDict', 'types.MappingProxyType', 'object'], answer: 1, explain: 'Pure Python, consistent.' },
    { q: 'What does `Cls.__mro__` show?', options: ['Instances', 'The method resolution order', 'Methods', 'Modules'], answer: 1, explain: 'Built by C3 linearisation.' },
    { q: 'Cooperative multiple inheritance requires…', options: ['Every class to call super()', 'No __init__', 'Metaclasses', 'Slots'], answer: 0, explain: 'One missing call breaks the chain.' },
    { q: 'A mixin is…', options: ['A standalone base class', 'A class providing a reusable behaviour, combined with other bases', 'A Protocol', 'A decorator'], answer: 1, explain: 'Not instantiated alone.' },
    { q: 'What is the general advice?', options: ['Inheritance first', 'Favour composition over inheritance', 'Avoid classes', 'Always use mixins'], answer: 1, explain: 'From the Gang of Four.' },
    { q: 'What does `@final` do?', options: ['Prevents runtime subclassing', 'Lets type checkers reject subclassing/overriding', 'Freezes instances', 'Makes methods static'], answer: 1, explain: 'A static check.' },
  ],
}
