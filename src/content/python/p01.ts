import type { Module } from '../types'

export const p01: Module = {
  n: 1,
  title: 'The Python Data Model',
  tour: '1 · The Python Data Model',
  summary: 'Special ("dunder") methods are how your objects plug into the language: len(), indexing, iteration, `in`, printing, arithmetic and truthiness all come from them.',
  topics: ['Special methods', 'A Pythonic card deck', 'Emulating numbers', 'String representation', 'Truthiness & collections'],
  cpp23: [
    'Python 3.15 is current; the book targets 3.10. Each lesson flags what changed.',
    'Free-threaded (no-GIL) CPython is officially supported since 3.14, and the JIT is faster in 3.15.',
    'Clearer error messages and a colourful new REPL (3.13+).',
  ],
  lessons: [
    {
      id: 'dunder',
      title: 'Special methods',
      blocks: [
        { kind: 'analogy', text: "Python's built-ins are a set of standard sockets in the wall: `len()`, `[]`, `for`, `in`, `+`, `print`. A special method is the plug shape your object offers for one of them. Give your class a `__len__` plug and `len(obj)` works; give it `__getitem__` and indexing, slicing and iteration all light up." },
        { kind: 'code', code: `class Basket:
    def __init__(self, items):
        self._items = list(items)

    def __len__(self):            # len(basket)
        return len(self._items)

    def __getitem__(self, i):     # basket[0], basket[1:3], for x in basket, x in basket
        return self._items[i]

b = Basket(["XAU", "XAG", "EUR"])
len(b)          # 3
b[-1]           # 'EUR'
b[:2]           # ['XAU', 'XAG']: slicing for free, because list handles slice objects
"XAG" in b      # True: falls back to iterating via __getitem__
for sym in b:   # iteration works too
    print(sym)` },
        { kind: 'list', items: [
          'You almost never call special methods yourself. You write `len(x)`, and the interpreter calls `type(x).__len__(x)`.',
          '"Dunder" means **d**ouble **under**score: `__len__` is read "dunder len".',
          'For built-in types written in C, `len()` reads a field directly, which is why `len(x)` is a function rather than a method: it is fast for built-ins and still pluggable for your types.',
        ] },
        { kind: 'compare',
          ts: `class Basket implements Iterable<string> {
  constructor(private items: string[]) {}
  get length() { return this.items.length }
  [Symbol.iterator]() { return this.items[Symbol.iterator]() }
}   // no indexing/slicing protocol for user classes`,
          go: `type Basket []string     // a named slice type
b := Basket{"XAU", "XAG"}
len(b); b[0]; b[:1]      // only because it IS a slice;
                         // Go has no operator/len overloading`,
          java: `class Basket implements Iterable<String> {
    private final List<String> items;
    public int size() { return items.size(); }
    public String get(int i) { return items.get(i); }
    public Iterator<String> iterator() { return items.iterator(); }
}`,
          cpp: `class Basket {
    std::vector<std::string> items;
public:
    std::size_t size() const { return items.size(); }
    const std::string& operator[](std::size_t i) const { return items[i]; }
    auto begin() const { return items.begin(); }
    auto end()   const { return items.end(); }
};`,
          python: `class Basket:
    def __init__(self, items): self._items = list(items)
    def __len__(self): return len(self._items)
    def __getitem__(self, i): return self._items[i]`,
          note: 'Python and C++ both let user types plug into core syntax; Python does it with named protocol methods instead of operator overloads alone.' },
        { kind: 'check', q: 'A class defines only `__getitem__`. Which of these works?', options: ['`len(obj)`', '`for x in obj`', '`obj + obj`', '`abs(obj)`'], answer: 1, hint: 'Iteration has a fallback that tries indices 0, 1, 2… until IndexError.', explain: 'Without `__iter__`, Python iterates by calling `__getitem__` with 0, 1, 2… until IndexError. `len` needs `__len__`.' },
      ],
    },
    {
      id: 'deck',
      title: 'A Pythonic card deck',
      blocks: [
        { kind: 'analogy', text: "The book's famous example is a deck of cards that is just two special methods. Because it speaks the sequence protocol, it instantly gets shuffling partners, random picks, sorting and slicing from the standard library, without inheriting from anything." },
        { kind: 'code', code: `import collections, random

Card = collections.namedtuple("Card", ["rank", "suit"])

class FrenchDeck:
    ranks = [str(n) for n in range(2, 11)] + list("JQKA")
    suits = "spades diamonds clubs hearts".split()

    def __init__(self):
        self._cards = [Card(r, s) for s in self.suits for r in self.ranks]

    def __len__(self):
        return len(self._cards)

    def __getitem__(self, position):
        return self._cards[position]

deck = FrenchDeck()
len(deck)                       # 52
deck[0]                         # Card(rank='2', suit='spades')
random.choice(deck)             # works: choice() only needs len + indexing
deck[12::13]                    # the four aces
Card("Q", "hearts") in deck     # True

suit_values = dict(spades=3, hearts=2, diamonds=1, clubs=0)
def spades_high(card):
    return FrenchDeck.ranks.index(card.rank) * len(suit_values) + suit_values[card.suit]

for card in sorted(deck, key=spades_high):   # sorting with a key function
    ...` },
        { kind: 'list', items: [
          'This is **composition**: the deck delegates to a list. It doesn\'t subclass `list`, so it exposes only what it chooses.',
          'Users of your class don\'t need to learn method names like `.size()` or `.getCard()`. Everything is standard Python.',
          'It can\'t be shuffled in place yet, because that needs `__setitem__`. Module 13 adds it.',
        ] },
        { kind: 'check', q: 'Why does `random.choice(deck)` work on FrenchDeck?', options: ['FrenchDeck inherits from list', 'choice() only needs `__len__` and `__getitem__`', 'random has special support for namedtuples', 'It doesn\'t'], answer: 1, hint: 'What does choice() actually do to pick an element?', explain: 'It picks a random index below len() and indexes into the object: duck typing via the sequence protocol.' },
      ],
    },
    {
      id: 'numbers',
      title: 'Emulating numeric types',
      blocks: [
        { kind: 'analogy', text: "Operator special methods teach your type the arithmetic rules everyone already knows. A 2-D `Vector` that knows `__add__`, `__mul__` and `__abs__` can be written into formulas just like a float, and `v1 + v2 * 3` reads like the maths on the whiteboard." },
        { kind: 'code', code: `import math

class Vector:
    def __init__(self, x=0, y=0):
        self.x, self.y = x, y

    def __repr__(self):
        return f"Vector({self.x!r}, {self.y!r})"

    def __abs__(self):                  # abs(v)
        return math.hypot(self.x, self.y)

    def __bool__(self):                 # truthiness: zero vector is falsy
        return bool(abs(self))

    def __add__(self, other):           # v1 + v2
        return Vector(self.x + other.x, self.y + other.y)

    def __mul__(self, scalar):          # v * 3
        return Vector(self.x * scalar, self.y * scalar)

v = Vector(3, 4)
abs(v)                  # 5.0
v + Vector(1, 1)        # Vector(4, 5)
v * 3                   # Vector(9, 12)
# 3 * v                 # TypeError: needs __rmul__ (module 16)
bool(Vector())          # False` },
        { kind: 'list', items: [
          'Operators **return new objects** rather than modifying operands, the same as numbers. In-place versions (`__iadd__`) are a separate choice.',
          '`3 * v` calls `int.__mul__(3, v)` first; when that returns `NotImplemented`, Python tries `v.__rmul__(3)`. Module 16 covers the full dance.',
        ] },
        { kind: 'check', q: 'What does `3 * v` do with the Vector above?', options: ['Vector(9, 12)', 'TypeError', 'Vector(3, 4) repeated', '15'], answer: 1, hint: 'Which object\'s method runs first, and which method would be the fallback?', explain: '`int.__mul__` doesn\'t know Vector and returns NotImplemented. Python then looks for `Vector.__rmul__`, which isn\'t defined, so TypeError.' },
      ],
    },
    {
      id: 'repr',
      title: 'String representation & truthiness',
      blocks: [
        { kind: 'analogy', text: "Every object has two name tags. `__repr__` is the engineer's tag: unambiguous, ideally valid code to recreate the object, shown in the REPL and debugger. `__str__` is the customer-facing tag used by `print()`. If you only write one, write `__repr__`; `str()` falls back to it." },
        { kind: 'code', code: `class Money:
    def __init__(self, pence):
        self.pence = pence
    def __repr__(self):
        return f"Money({self.pence!r})"          # for developers
    def __str__(self):
        return f"£{self.pence / 100:,.2f}"        # for users

m = Money(239050)
m                       # Money(239050)    (REPL uses repr)
print(m)                # £2,390.50        (print uses str)
f"{m!r} / {m}"          # 'Money(239050) / £2,390.50'

# Truthiness: bool(x) tries __bool__, then __len__ (0 → False), else True
bool([])                # False
bool(Money(0))          # True: no __bool__ or __len__, so any object is truthy` },
        { kind: 'list', items: [
          'Inside an f-string, `!r` calls `repr()` and `!s` calls `str()`. Using `!r` in a repr shows strings with quotes, which keeps the output unambiguous.',
          'Truthiness falls back to `__len__`: an empty container is falsy. That is why `if items:` is the idiomatic emptiness test.',
        ] },
        { kind: 'new23', text: '3.14 added **template strings**: `t"..."` looks like an f-string but produces a `Template` object holding the literal parts and the interpolated values separately, so libraries can escape them safely (SQL, HTML, shell). f-strings themselves got a formal grammar in 3.12, so nested quotes like `f"{d["key"]}"` are now legal.' },
        { kind: 'check', q: 'A class defines `__repr__` but not `__str__`. What does `print(obj)` show?', options: ['`<__main__.X object at 0x...>`', 'The `__repr__` output', 'An empty string', 'TypeError'], answer: 1, hint: 'What does `object.__str__` do by default?', explain: 'The default `__str__` calls `__repr__`, so implementing `__repr__` covers both.' },
      ],
    },
    {
      id: 'overview',
      title: 'Collections & the special method map',
      blocks: [
        { kind: 'analogy', text: "The collection ABCs are a family tree of capabilities: anything Sized has a length, anything Iterable can be looped, anything a Container answers `in`. A Sequence is all three plus indexing, and a Mapping is all three plus key lookup. Knowing the tree tells you which plugs to provide." },
        { kind: 'code', code: `from collections import abc

isinstance([], abc.Sequence)      # True
isinstance({}, abc.Mapping)       # True
isinstance(FrenchDeck(), abc.Sequence)   # False: it quacks like one but isn't registered (module 13)

# The most used special methods, by family
# conversion:   __repr__ __str__ __format__ __bytes__ __bool__ __int__ __float__ __hash__
# collections:  __len__ __getitem__ __setitem__ __delitem__ __contains__ __iter__ __reversed__
# operators:    __add__ __sub__ __mul__ __truediv__ __matmul__ __neg__ __abs__ __eq__ __lt__ ...
# reflected:    __radd__ __rmul__ ...      in-place: __iadd__ __imul__ ...
# context:      __enter__ __exit__         call: __call__
# attributes:   __getattr__ __setattr__ __getattribute__ __dir__
# creation:     __new__ __init__ __del__   class: __init_subclass__ __class_getitem__` },
        { kind: 'p', text: "The `@` operator (`__matmul__`) exists in the language for NumPy's matrix multiplication. That is a direct example of the data model serving the scientific Python ecosystem you'll meet in ML work." },
        { kind: 'check', q: 'Why is `if items:` idiomatic for "items is not empty"?', options: ['It is faster than len', 'Truthiness falls back to `__len__`, so empty containers are falsy', 'It checks for None', 'It is required by PEP 8 only'], answer: 1, hint: 'What does bool() try after __bool__?', explain: 'Empty sequences and mappings have length 0, so they are falsy. PEP 8 recommends this form too.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does `len(x)` call for a user-defined class?', options: ['`x.length()`', '`type(x).__len__(x)`', '`x.size`', '`x.__length__`'], answer: 1, explain: 'Special methods are looked up on the type, not the instance.' },
    { q: 'Implementing `__getitem__` alone gives you…', options: ['Only indexing', 'Indexing, slicing (if delegated to a list), iteration and `in`', 'len()', 'Sorting in place'], answer: 1, explain: 'Iteration and `in` fall back to sequential indexing.' },
    { q: 'Which should every class define first, `__repr__` or `__str__`?', options: ['`__str__`', '`__repr__`', 'Both always', 'Neither'], answer: 1, explain: '`__str__` falls back to `__repr__`, but not the other way round.' },
    { q: 'What does `bool(obj)` use if there is no `__bool__`?', options: ['Always True', '`__len__`, with 0 meaning False', 'Raises TypeError', '`__eq__`'], answer: 1, explain: 'With neither method, instances are truthy.' },
    { q: 'What does `NotImplemented` (returned from `__add__`) mean?', options: ['Raise an error now', 'Let Python try the other operand\'s reflected method', 'Return None', 'The method is abstract'], answer: 1, explain: 'It is a signal value, not the NotImplementedError exception.' },
    { q: 'What do `t"..."` strings (Python 3.14) produce?', options: ['A str, like f-strings', 'A Template object with separated literal and interpolated parts', 'Translated text', 'Bytes'], answer: 1, explain: 'That lets libraries process the values safely.' },
    { q: 'What does FrenchDeck use to get its card storage?', options: ['Inheritance from list', 'Composition: it wraps a list', 'A metaclass', 'A C extension'], answer: 1, explain: 'It delegates `__len__` and `__getitem__` to the list.' },
    { q: 'Which operator was added to the language for NumPy matrix multiplication?', options: ['`**`', '`@`', '`%`', '`^`'], answer: 1, explain: '`__matmul__`, added in Python 3.5.' },
  ],
}
