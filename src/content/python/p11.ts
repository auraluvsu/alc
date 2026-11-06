import type { Module } from '../types'

export const p11: Module = {
  n: 11,
  title: 'A Pythonic Object',
  tour: '11 · A Pythonic Object',
  summary: 'Building a class that behaves like a built-in: string representations, an alternative constructor, custom formatting, making it hashable, "private" attributes, and saving memory with __slots__.',
  topics: ['Object representations', 'classmethod vs staticmethod', 'Formatted displays', 'A hashable Vector2d', 'Private & protected attributes', '__slots__'],
  cpp23: ['`__static_attributes__` (3.13) lists the attribute names a class assigns via `self.x` in its methods.', '`@dataclass(slots=True)` (3.10) gives you slots without writing them.'],
  lessons: [
    {
      id: 'repr',
      title: 'Representations',
      blocks: [
        { kind: 'analogy', text: "An object has two name badges. `__repr__` is the one for developers: unambiguous, ideally something you could paste back into the REPL to recreate it. `__str__` is the friendly one for end users. If you only write one, write `__repr__`; `str()` falls back to it." },
        { kind: 'code', code: `import math
from array import array

class Vector2d:
    typecode = "d"

    def __init__(self, x, y):
        self.__x = float(x)        # "private" (see lesson 5)
        self.__y = float(y)

    @property
    def x(self): return self.__x
    @property
    def y(self): return self.__y

    def __iter__(self):            # enables unpacking: x, y = v
        return iter((self.x, self.y))
    def __repr__(self):
        return f"{type(self).__name__}({self.x!r}, {self.y!r})"
    def __str__(self):
        return str(tuple(self))
    def __bytes__(self):
        return bytes([ord(self.typecode)]) + bytes(array(self.typecode, self))
    def __eq__(self, other):
        return tuple(self) == tuple(other)
    def __abs__(self):
        return math.hypot(self.x, self.y)
    def __bool__(self):
        return bool(abs(self))

v = Vector2d(3, 4)
v; print(v)            # Vector2d(3.0, 4.0)  /  (3.0, 4.0)
abs(v), bool(v)        # (5.0, True)
x, y = v               # unpacking via __iter__` },
        { kind: 'check', q: 'Why use `type(self).__name__` in `__repr__` instead of hard-coding "Vector2d"?', options: ['Speed', 'So subclasses show their own name', 'Required by Python', 'For hashing'], answer: 1, hint: 'What would a subclass print?', explain: 'Hard-coding makes subclass reprs lie.' },
      ],
    },
    {
      id: 'classmethod',
      title: 'classmethod vs staticmethod',
      blocks: [
        { kind: 'analogy', text: "A `classmethod` is a second front door to the factory: it receives the class itself, so it can build instances (and builds the right subclass when called on one). A `staticmethod` is a vending machine bolted to the wall of the class: it's there for convenience but knows nothing about the class or its instances. It's just a function in the class's namespace." },
        { kind: 'code', code: `class Vector2d:
    ...
    @classmethod
    def frombytes(cls, octets):                    # alternative constructor
        typecode = chr(octets[0])
        memv = memoryview(octets[1:]).cast(typecode)
        return cls(*memv)                           # cls, not Vector2d: subclass-friendly

    @staticmethod
    def _is_finite(*xs):                            # utility; no cls or self
        return all(math.isfinite(x) for x in xs)

v2 = Vector2d.frombytes(bytes(Vector2d(3, 4)))
v2 == Vector2d(3, 4)       # True

# Familiar alternative constructors in the standard library:
# dict.fromkeys(...), datetime.fromtimestamp(...), int.from_bytes(...)` },
        { kind: 'check', q: 'What does a classmethod receive as its first argument?', options: ['The instance', 'The class', 'Nothing', 'The module'], answer: 1, hint: 'cls.', explain: 'Calling it on a subclass passes the subclass.' },
      ],
    },
    {
      id: 'format',
      title: 'Formatted displays',
      blocks: [
        { kind: 'analogy', text: "`format()` and f-strings pass the bit after the colon (the format spec) to your object's `__format__`. Your class decides what the spec means, so a vector can understand `.2f` for its components and invent a `p` suffix meaning \"show me polar coordinates\"." },
        { kind: 'code', code: `class Vector2d:
    ...
    def angle(self):
        return math.atan2(self.y, self.x)

    def __format__(self, spec=""):
        if spec.endswith("p"):                       # custom: polar
            spec = spec[:-1]
            coords, outer = (abs(self), self.angle()), "<{}, {}>"
        else:
            coords, outer = self, "({}, {})"
        return outer.format(*(format(c, spec) for c in coords))

v = Vector2d(1, 1)
f"{v}"            # '(1.0, 1.0)'
f"{v:.3f}"        # '(1.000, 1.000)'
f"{v:.3fp}"       # '<1.414, 0.785>'
f"{2385.5:,.2f}"  # '2,385.50': built-in specs for comparison` },
        { kind: 'check', q: 'In `f"{v:.3fp}"`, what is passed to `v.__format__`?', options: ['"v"', '".3fp"', '"{v}"', 'Nothing'], answer: 1, hint: 'Everything after the colon.', explain: 'Your class interprets the spec.' },
      ],
    },
    {
      id: 'hash',
      title: 'Hashable objects & private attributes',
      blocks: [
        { kind: 'analogy', text: "To be a dictionary key or set member, an object needs a fingerprint (`__hash__`) that never changes and agrees with equality: equal objects must have equal fingerprints. That only works if the object is immutable, which is why `Vector2d` hides `x` and `y` behind read-only properties." },
        { kind: 'code', code: `class Vector2d:
    ...
    def __hash__(self):
        return hash((self.x, self.y))            # hash a tuple of the same fields __eq__ uses

{Vector2d(1, 2), Vector2d(1, 2)}   # one element
# v.x = 7                          # AttributeError: property has no setter

v = Vector2d(3, 4)
v.__dict__                          # {'_Vector2d__x': 3.0, '_Vector2d__y': 4.0}
v._Vector2d__x                      # 3.0: name mangling, not real privacy` },
        { kind: 'list', items: [
          'Defining `__eq__` without `__hash__` makes instances **unhashable** (Python sets `__hash__ = None`), deliberately, to stop you breaking dict invariants.',
          '`__x` triggers **name mangling** to `_ClassName__x`. It prevents accidental clashes in subclasses; it doesn\'t stop anyone determined.',
          'A single underscore `_x` is the convention for "internal, please don\'t touch", and most Python code uses that instead.',
        ] },
        { kind: 'pitfall', text: 'Never let a mutable object\'s hash depend on mutable state. Change the field after inserting the object into a set and the set can no longer find it.' },
        { kind: 'check', q: 'You define `__eq__` but not `__hash__`. Can instances go in a set?', options: ['Yes, identity hash is used', 'No: __hash__ is set to None', 'Only if frozen', 'Only in 3.15'], answer: 1, hint: 'Equal objects must hash equally.', explain: 'Python removes the inherited identity hash to keep the contract.' },
      ],
    },
    {
      id: 'slots',
      title: '__slots__',
      blocks: [
        { kind: 'analogy', text: "Normally each instance carries a personal filing cabinet (`__dict__`) so you can add any attribute any time. `__slots__` swaps the cabinet for a fixed rack with exactly the labelled pigeonholes you declared. Far less memory per object, at the cost of not being able to add new attributes." },
        { kind: 'code', code: `import sys
from dataclasses import dataclass

class Tick:
    __slots__ = ("ts", "px", "qty")
    def __init__(self, ts, px, qty):
        self.ts, self.px, self.qty = ts, px, qty

t = Tick(0, 2385.0, 1)
# t.venue = "LBMA"     AttributeError: 'Tick' object has no attribute 'venue'
hasattr(t, "__dict__")  # False

@dataclass(slots=True, frozen=True)     # the modern way
class Quote:
    sym: str
    bid: float
    ask: float` },
        { kind: 'list', items: [
          'Worth it when you have **millions** of small objects (ticks, orders, nodes). For a handful, it\'s premature.',
          'Slots are per class: a subclass without its own `__slots__` gets a `__dict__` back.',
          'For bulk numeric data, a NumPy array or DataFrame (modules 25–26) beats millions of objects anyway.',
        ] },
        { kind: 'check', q: 'What do you lose with `__slots__`?', options: ['Methods', 'The ability to add attributes not listed in __slots__', 'Inheritance', 'Properties'], answer: 1, hint: 'Fixed pigeonholes.', explain: 'Unless you add "__dict__" to the slots, which defeats much of the point.' },
      ],
    },
  ],
  quiz: [
    { q: 'Which representation is meant for developers?', options: ['__str__', '__repr__', '__format__', '__bytes__'], answer: 1, explain: '`str()` falls back to `__repr__`.' },
    { q: 'What does `__iter__` enable for Vector2d?', options: ['Hashing', 'Unpacking and tuple(v)', 'Formatting', 'Slots'], answer: 1, explain: 'Many methods build on it.' },
    { q: 'An alternative constructor should be a…', options: ['staticmethod', 'classmethod', 'property', 'module function only'], answer: 1, explain: 'It receives `cls`.' },
    { q: 'A staticmethod receives…', options: ['cls', 'self', 'No implicit first argument', 'The module'], answer: 2, explain: 'It is a plain function in the class namespace.' },
    { q: 'What does `__format__` receive?', options: ['The whole f-string', 'The format spec', 'A dict', 'Nothing'], answer: 1, explain: 'Text after the colon.' },
    { q: 'Hashable objects need…', options: ['Mutability', '__hash__ consistent with __eq__, and immutability of the hashed fields', '__slots__', 'A repr'], answer: 1, explain: 'Equal objects must hash equally.' },
    { q: 'What does `self.__x` become?', options: ['A truly private field', '`_ClassName__x` via name mangling', 'A slot', 'A property'], answer: 1, explain: 'Avoids accidental clashes only.' },
    { q: 'Main benefit of __slots__?', options: ['Speed of method calls only', 'Lower memory per instance', 'Thread safety', 'Immutability'], answer: 1, explain: 'No per-instance `__dict__`.' },
  ],
}
