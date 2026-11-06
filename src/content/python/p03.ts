import type { Module } from '../types'

export const p03: Module = {
  n: 3,
  title: 'Dictionaries & Sets',
  tour: '3 · Dictionaries and Sets',
  summary: 'Modern dict syntax, handling missing keys, the dict family (defaultdict, Counter, ChainMap), immutable mappings including 3.15\'s frozendict, how hash tables work and what can be a key, and set algebra.',
  topics: ['Modern dict syntax', 'Missing keys', 'Dict variations', 'Immutable mappings', 'Hashing & keys', 'Sets'],
  cpp23: [
    '`frozendict` is a built-in: immutable, hashable, order-preserving (3.15, PEP 814).',
    'Dict and set comprehensions can unpack: `{**d for d in dicts}` (3.15, PEP 798).',
    '`Counter ^ Counter` gives a symmetric difference (3.15).',
    'Dict merge operators `|` and `|=` (3.9) are now everywhere in modern code.',
  ],
  lessons: [
    {
      id: 'syntax',
      title: 'Modern dict syntax',
      blocks: [
        { kind: 'analogy', text: "A dict is a coat check: you hand in a ticket (the key), the attendant hashes it to find the right hook instantly, and you get your coat (the value). Modern Python gives you shorthand for filling the coat check in bulk, merging two of them, and matching on what's hanging there." },
        { kind: 'code', code: `quotes = {"XAU": 2390.5, "XAG": 28.1}
fx = {"EURUSD": 1.08}

combined = quotes | fx                 # 3.9: new merged dict (right side wins on clashes)
quotes |= {"XPT": 980.0}               # in-place update
both = {**quotes, **fx}                # older unpacking spelling

inverse = {v: k for k, v in quotes.items()}       # dict comprehension
merged = {**d for d in [quotes, fx]}               # 3.15: unpacking in comprehensions

def route(msg: dict):
    match msg:                                      # mapping patterns (3.10)
        case {"type": "trade", "sym": str(sym), "qty": int(qty)}:
            return f"trade {qty} {sym}"
        case {"type": "quote", **rest}:
            return f"quote with {len(rest)} fields"
        case _:
            return "ignored"

route({"type": "trade", "sym": "XAU", "qty": 5, "venue": "LBMA"})   # extra keys are fine` },
        { kind: 'list', items: [
          'Dicts preserve **insertion order** (guaranteed since 3.7). Iteration, `.keys()` and printing follow it.',
          'Mapping patterns match if the listed keys exist, and extra keys are ignored. Use `**rest` to capture them.',
          '`.keys()`, `.values()` and `.items()` return live **views**, not copies. `keys()` views support set operations: `d1.keys() & d2.keys()`.',
        ] },
        { kind: 'check', q: 'What is `{"a": 1, "b": 2} | {"b": 3}`?', options: ["{'a': 1, 'b': 2}", "{'a': 1, 'b': 3}", 'TypeError', "{'b': 3}"], answer: 1, hint: 'Which side wins on a clash?', explain: 'The right operand wins, like `update()`.' },
      ],
    },
    {
      id: 'missing',
      title: 'Handling missing keys',
      blocks: [
        { kind: 'analogy', text: "When a ticket isn't in the coat check, you have options: ask and accept a polite \"none\" (`get`), ask the attendant to hang a default coat and give it to you (`setdefault`), or hire a coat check that automatically creates a coat for any new ticket (`defaultdict`)." },
        { kind: 'code', code: `px = quotes.get("XPD")                # None instead of KeyError
px = quotes.get("XPD", 0.0)           # with a default

# Group trades by symbol: three ways
groups = {}
for t in trades:
    groups.setdefault(t.sym, []).append(t)          # one lookup, no KeyError

from collections import defaultdict
groups = defaultdict(list)
for t in trades:
    groups[t.sym].append(t)                         # missing key → list() created automatically

# Custom behaviour for missing keys
class CaseInsensitive(dict):
    def __missing__(self, key):                     # called by d[key] when key is absent
        if isinstance(key, str) and key.upper() in self:
            return self[key.upper()]
        raise KeyError(key)` },
        { kind: 'pitfall', text: '`defaultdict` creates entries on **read** too: `if groups["XYZ"]:` silently inserts an empty list for "XYZ". Use `"XYZ" in groups` or `groups.get("XYZ")` to test without inserting.' },
        { kind: 'check', q: 'With `d = defaultdict(int)`, what is `len(d)` after `x = d["missing"]`?', options: ['0', '1', 'KeyError', 'None'], answer: 1, hint: 'Who created the coat?', explain: 'Reading a missing key through `[]` calls the factory and stores the result.' },
      ],
    },
    {
      id: 'variations',
      title: 'The dict family',
      blocks: [
        { kind: 'analogy', text: "`collections` is a shop of specialised coat checks: one that counts how many of each coat arrived (Counter), one that stacks several coat checks so lookups fall through to the next (ChainMap), and the original that remembers order with extra tricks (OrderedDict)." },
        { kind: 'code', code: `from collections import Counter, ChainMap, OrderedDict

sides = Counter(t.side for t in trades)
sides.most_common(1)                  # [('BUY', 812)]
words = Counter("the tape the bid the ask".split())
words["the"]                          # 3
words["missing"]                      # 0: no KeyError
a, b = Counter(a=3, b=1), Counter(a=1, c=2)
a + b, a - b                          # Counter({'a': 4, 'c': 2, 'b': 1}), Counter({'a': 2, 'b': 1})
a ^ b                                 # 3.15: symmetric difference

defaults = {"timeout": 30, "venue": "LBMA"}
env      = {"timeout": 5}
cli      = {}
config = ChainMap(cli, env, defaults)  # lookups fall through: cli → env → defaults
config["timeout"]                      # 5

lru = OrderedDict()
lru["a"] = 1; lru["b"] = 2
lru.move_to_end("a")                   # still useful for LRU caches
lru.popitem(last=False)                # pop the oldest` },
        { kind: 'list', items: [
          'Plain `dict` already keeps insertion order. Reach for `OrderedDict` only for `move_to_end`, `popitem(last=False)`, or order-sensitive `==`.',
          'Subclass `collections.UserDict` rather than `dict` when you override methods. The built-in `dict` ignores your overrides in methods like `update()`.',
        ] },
        { kind: 'check', q: 'What does `Counter()["never_seen"]` return?', options: ['KeyError', '0', 'None', 'It inserts and returns 0'], answer: 1, hint: 'Counting something that never appeared.', explain: 'Counter returns 0 for missing keys and, unlike defaultdict, doesn\'t insert them.' },
      ],
    },
    {
      id: 'immutable',
      title: 'Immutable mappings & frozendict',
      blocks: [
        { kind: 'analogy', text: "Sometimes you want to show people the coat check through glass: they can look up anything but change nothing. `MappingProxyType` is the glass window onto a dict that can still change behind it. Python 3.15's `frozendict` is a coat check sealed for good, so stable that it can itself be used as a key." },
        { kind: 'code', code: `from types import MappingProxyType

_venues = {"LBMA": "London", "COMEX": "New York"}
VENUES = MappingProxyType(_venues)     # read-only VIEW
# VENUES["SGE"] = "Shanghai"           # TypeError
_venues["SGE"] = "Shanghai"
VENUES["SGE"]                          # 'Shanghai': the view sees changes behind it

# Python 3.15: a real immutable mapping
spec = frozendict(sym="XAU", tick=0.01)
# spec["tick"] = 0.1                   # TypeError
cache = {spec: "gold contract"}         # hashable, so usable as a key or set member
frozendict(a=1, b=2) == frozendict(b=2, a=1)   # True: order ignored for ==` },
        { kind: 'new23', text: "`frozendict` (PEP 814, 3.15) is **not** a subclass of `dict`. Code that checks `isinstance(x, dict)` won't accept it, so check against `collections.abc.Mapping` instead. It is hashable when all its keys and values are, and it preserves insertion order for iteration." },
        { kind: 'check', q: 'What is the key difference between MappingProxyType and frozendict?', options: ['None', 'A proxy is a read-only view of a dict that can still change underneath; frozendict itself can never change', 'frozendict is a view', 'Proxies are hashable'], answer: 1, hint: 'Glass window vs sealed box.', explain: 'Only frozendict guarantees immutability, which is why only it is hashable.' },
      ],
    },
    {
      id: 'hashing',
      title: 'Hashing, keys & sets',
      blocks: [
        { kind: 'analogy', text: "A hash is the coat check's shelf number, computed from the ticket. It only works if a ticket's number never changes while the coat is hanging. That is why **mutable** things like lists can't be keys: change the list and its shelf number would change, so the coat could never be found again." },
        { kind: 'code', code: `hash("XAU"); hash((1, 2)); hash(frozenset({1}))   # fine: immutable
# hash([1, 2])                                    # TypeError: unhashable type: 'list'
# hash((1, [2]))                                  # TypeError: a tuple is hashable only if its items are

class Instrument:
    def __init__(self, venue, sym):
        self.venue, self.sym = venue, sym
    def __eq__(self, other):
        return (self.venue, self.sym) == (other.venue, other.sym)
    def __hash__(self):
        return hash((self.venue, self.sym))      # equal objects MUST have equal hashes

# Sets: unique, unordered, hashable elements, with fast membership
watch = {"XAU", "XAG", "XPT"}
held  = {"XAU", "EURUSD"}
watch & held       # {'XAU'}              intersection
watch | held       # union
watch - held       # {'XAG', 'XPT'}       difference
watch ^ held       # symmetric difference
"XAG" in watch     # O(1) average, versus O(n) for a list
dedup = list(dict.fromkeys(syms))   # remove duplicates, keep first-seen order` },
        { kind: 'list', items: [
          'If you define `__eq__` without `__hash__`, Python sets `__hash__` to None and instances become unhashable. That is deliberate.',
          'Dict and set lookups are O(1) on average, at the cost of memory: hash tables keep spare room.',
          '`frozenset` is the immutable, hashable set, usable as a dict key or inside other sets.',
          '`{}` is an empty **dict**. An empty set is `set()`.',
        ] },
        { kind: 'check', q: 'Can `(1, [2, 3])` be a dict key?', options: ['Yes: tuples are immutable', 'No: a tuple is hashable only if all its items are', 'Only in a set', 'Only with frozendict'], answer: 1, hint: 'Hash the tuple means hash each item…', explain: 'The tuple is immutable, but its list item isn\'t hashable, so `hash()` fails.' },
      ],
    },
  ],
  quiz: [
    { q: 'Since which version do dicts guarantee insertion order?', options: ['3.0', '3.7', '3.10', 'Never'], answer: 1, explain: 'It was an implementation detail in 3.6 and became guaranteed in 3.7.' },
    { q: 'What does `d.get(k)` return for a missing key?', options: ['Raises KeyError', 'None (or the given default)', 'An empty dict', '0'], answer: 1, explain: '`d[k]` would raise.' },
    { q: 'What does `defaultdict(list)` do on `d[k]` for a missing key?', options: ['KeyError', 'Inserts and returns a new empty list', 'Returns None', 'Returns [] without inserting'], answer: 1, explain: 'Even reads insert.' },
    { q: 'When is `__missing__` called?', options: ['By `d.get()`', 'By `d[key]` on a dict subclass when the key is absent', 'By `in`', 'Never'], answer: 1, explain: '`get` and `in` don\'t call it.' },
    { q: 'What is special about `frozendict` (3.15)?', options: ['It subclasses dict', 'It is immutable and hashable when its contents are', 'It is unordered', 'It is a view'], answer: 1, explain: 'It is a new built-in from PEP 814.' },
    { q: 'Why can\'t lists be dict keys?', options: ['They are too big', 'They are mutable, so their hash could change', 'Style rule', 'They can'], answer: 1, explain: 'Use a tuple instead.' },
    { q: 'Overriding `__eq__` without `__hash__` makes instances…', options: ['Hash by id', 'Unhashable', 'Hash by repr', 'Raise on ==' ], answer: 1, explain: 'Python sets `__hash__ = None` to protect you.' },
    { q: 'How do you write an empty set?', options: ['`{}`', '`set()`', '`[]`', '`{,}`'], answer: 1, explain: '`{}` is an empty dict.' },
  ],
}
