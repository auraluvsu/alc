import type { Module } from '../types'

export const p12: Module = {
  n: 12,
  title: 'Special Methods for Sequences',
  tour: '12 · Special Methods for Sequences',
  summary: 'Building an n-dimensional Vector that behaves like a real sequence: the sequence protocol and duck typing, slicing that returns the right type, dynamic attribute access with __getattr__, efficient hashing with reduce, and formatting.',
  topics: ['Protocols & duck typing', 'Sliceable sequences', 'Dynamic attribute access', 'Hashing & faster ==', 'Formatting'],
  cpp23: ['`itertools.batched` (3.12) and `zip(strict=True)` (3.10) are handy when implementing sequence methods.'],
  lessons: [
    {
      id: 'protocol',
      title: 'Protocols & duck typing',
      blocks: [
        { kind: 'analogy', text: "A protocol is an informal job description. Python's sequence protocol is just two skills: `__len__` and `__getitem__`. Anything that has both gets treated as a sequence by `for`, `in`, `reversed`, slicing and many library functions, without registering or inheriting anything. If it walks like a duck…" },
        { kind: 'code', code: `from array import array
import reprlib, math

class Vector:
    typecode = "d"

    def __init__(self, components):
        self._components = array(self.typecode, components)

    def __len__(self):
        return len(self._components)
    def __getitem__(self, index):
        return self._components[index]       # first version: slicing returns an array
    def __iter__(self):
        return iter(self._components)
    def __repr__(self):
        components = reprlib.repr(self._components)   # abbreviates long arrays with ...
        components = components[components.find("["):-1]
        return f"Vector({components})"

v = Vector(range(10))
v                 # Vector([0.0, 1.0, 2.0, 3.0, 4.0, ...])
len(v), v[0], 3.0 in v       # (10, 0.0, True)
v[1:4]            # array('d', [1.0, 2.0, 3.0]): not a Vector yet` },
        { kind: 'check', q: 'Which two methods make an object usable as a basic sequence?', options: ['__iter__ and __next__', '__len__ and __getitem__', '__contains__ and __add__', '__init__ and __repr__'], answer: 1, hint: 'Count and index.', explain: '`for` and `in` even fall back to `__getitem__` when `__iter__` is missing.' },
      ],
    },
    {
      id: 'slicing',
      title: 'Slicing that returns the right type',
      blocks: [
        { kind: 'analogy', text: "Asking a deck for `deck[1:4]` should give you a smaller deck, not a loose pile of cards. When `__getitem__` receives a `slice` object instead of an integer, it should build a new instance of its own class; for an integer it returns one component." },
        { kind: 'code', code: `import operator

class Vector:
    ...
    def __getitem__(self, key):
        if isinstance(key, slice):
            cls = type(self)
            return cls(self._components[key])          # a new Vector
        index = operator.index(key)                     # accepts ints and int-likes, rejects floats
        return self._components[index]

v = Vector(range(7))
v[1:4]          # Vector([1.0, 2.0, 3.0])
v[-1]           # 6.0
# v[1.5]        TypeError: 'float' object cannot be interpreted as an integer

slice(1, 10, 2).indices(5)    # (1, 5, 2): how a slice clips to a length` },
        { kind: 'check', q: 'What does `v[1:4]` pass to `__getitem__`?', options: ['A tuple (1, 4)', 'A slice object slice(1, 4, None)', 'Two arguments', 'A range'], answer: 1, hint: 'Print `key` inside `__getitem__`.', explain: '`v[1:4, 2]` would pass a tuple containing a slice and an int.' },
      ],
    },
    {
      id: 'getattr',
      title: 'Dynamic attribute access',
      blocks: [
        { kind: 'analogy', text: "`__getattr__` is the receptionist who handles requests for people not on the staff list. Python only calls it after normal lookup fails, so it's perfect for shortcuts: `v.x` can mean \"component 0\" without storing an `x` attribute at all." },
        { kind: 'code', code: `class Vector:
    ...
    __match_args__ = ("x", "y", "z", "t")

    def __getattr__(self, name):
        cls = type(self)
        try:
            pos = cls.__match_args__.index(name)
        except ValueError:
            pos = -1
        if 0 <= pos < len(self._components):
            return self._components[pos]
        raise AttributeError(f"{cls.__name__!r} object has no attribute {name!r}")

    def __setattr__(self, name, value):           # stop v.x = 10 silently creating an attribute
        if len(name) == 1 and name.islower():
            raise AttributeError(f"can't set attribute {name!r}")
        super().__setattr__(name, value)

v = Vector(range(5))
v.x, v.z          # (0.0, 2.0)
# v.x = 10        AttributeError: can't set attribute 'x'` },
        { kind: 'pitfall', text: 'Without the `__setattr__` guard, `v.x = 10` would create a real instance attribute. From then on `v.x` returns 10 (normal lookup succeeds, so `__getattr__` is never called) while `v[0]` is still 0.0: two answers to the same question.' },
        { kind: 'check', q: 'When is `__getattr__` called?', options: ['On every attribute access', 'Only when normal attribute lookup fails', 'Only for methods', 'On assignment'], answer: 1, hint: 'The receptionist for missing names.', explain: '`__getattribute__` is the one called on every access (module 22).' },
      ],
    },
    {
      id: 'hash',
      title: 'Hashing & a faster ==',
      blocks: [
        { kind: 'analogy', text: "To fingerprint a long vector, combine each component's hash with XOR, folded left to right, like a running checksum. For equality, compare lengths first (instant), then walk pairs with `zip` and stop at the first difference, instead of copying everything into tuples." },
        { kind: 'code', code: `import functools, operator

class Vector:
    ...
    def __eq__(self, other):
        return len(self) == len(other) and all(a == b for a, b in zip(self, other))

    def __hash__(self):
        hashes = (hash(x) for x in self._components)       # lazy generator
        return functools.reduce(operator.xor, hashes, 0)    # 0 = initial value for empty vectors

Vector([1, 2, 3]) == Vector([1, 2, 3])       # True
Vector([1, 2]) == Vector([1, 2, 3])          # False: length check short-circuits
len({Vector([1, 2]), Vector([1, 2])})        # 1` },
        { kind: 'p', text: 'This is the **map-reduce** shape: map each item to a value, then reduce with a combining operator. `sum`, `all`, `any` and `functools.reduce` are all reductions. The `0` initial value matters: `reduce` on an empty iterable without one raises `TypeError`.' },
        { kind: 'check', q: 'Why check `len(self) == len(other)` before zipping?', options: ['zip requires it', 'zip stops at the shorter input, so unequal lengths could otherwise compare equal', 'Speed only', 'For hashing'], answer: 1, hint: 'Vector([1,2]) vs Vector([1,2,3]).', explain: '`zip(strict=True)` would raise instead, which isn\'t what == should do.' },
      ],
    },
    {
      id: 'format',
      title: 'Formatting',
      blocks: [
        { kind: 'analogy', text: "A custom format spec is a small language your object understands. Vector's `h` suffix asks for hyperspherical coordinates (the n-dimensional cousin of polar), the same trick as Vector2d's `p`, scaled up. It shows how `__format__` lets a class extend the f-string mini-language without breaking the standard specs." },
        { kind: 'code', code: `import itertools

class Vector:
    ...
    def __abs__(self):
        return math.hypot(*self)

    def angle(self, n):                         # one of the n-1 hyperspherical angles
        r = math.hypot(*self[n:])
        a = math.atan2(r, self[n - 1])
        if (n == len(self) - 1) and (self[-1] < 0):
            return math.pi * 2 - a
        return a

    def angles(self):
        return (self.angle(n) for n in range(1, len(self)))

    def __format__(self, fmt_spec=""):
        if fmt_spec.endswith("h"):
            fmt_spec = fmt_spec[:-1]
            coords = itertools.chain([abs(self)], self.angles())
            outer = "<{}>"
        else:
            coords, outer = self, "({})"
        return outer.format(", ".join(format(c, fmt_spec) for c in coords))

format(Vector([1, 1]), ".3fh")     # '<1.414, 0.785>'
format(Vector([2, 2, 2]), ".2f")   # '(2.00, 2.00, 2.00)'` },
        { kind: 'check', q: 'What does `itertools.chain` do in `__format__`?', options: ['Sorts values', 'Joins the magnitude and the angle generator into one iterable', 'Formats numbers', 'Copies the vector'], answer: 1, hint: 'Two iterables, one stream.', explain: 'No intermediate list is built.' },
      ],
    },
  ],
  quiz: [
    { q: 'Python\'s sequence protocol is…', options: ['A formal interface you must inherit', 'An informal convention: implement __len__ and __getitem__', 'A decorator', 'A metaclass'], answer: 1, explain: 'Duck typing.' },
    { q: 'What does `reprlib.repr` do?', options: ['Formats floats', 'Produces an abbreviated repr for large structures', 'Removes reprs', 'Serialises to JSON'], answer: 1, explain: 'Keeps logs readable.' },
    { q: 'How should `__getitem__` detect slicing?', options: ['`isinstance(key, slice)`', '`key == ":"`', '`type(key) is int`', '`hasattr(key, "start")`'], answer: 0, explain: 'Then return a new instance.' },
    { q: 'Why use `operator.index(key)`?', options: ['Speed', 'To accept int-like values and reject floats', 'To support slices', 'To hash'], answer: 1, explain: 'It calls `__index__`.' },
    { q: 'When is `__getattr__` invoked?', options: ['Always', 'After normal lookup fails', 'On setattr', 'On import'], answer: 1, explain: '`__getattribute__` runs always.' },
    { q: 'Why add `__setattr__` to Vector?', options: ['Speed', 'To stop `v.x = …` creating attributes that shadow the computed ones', 'For hashing', 'For pickling'], answer: 1, explain: 'Avoids inconsistent state.' },
    { q: '`functools.reduce(operator.xor, hashes, 0)` computes…', options: ['The sum', 'An XOR of all hashes, 0 for empty input', 'The max', 'A list'], answer: 1, explain: 'A map-reduce.' },
    { q: 'Why not `tuple(self) == tuple(other)` for long vectors?', options: ['It\'s wrong', 'It copies everything; zip + all short-circuits without copying', 'tuples are unhashable', 'It fails for floats'], answer: 1, explain: 'Matters for large vectors.' },
  ],
}
