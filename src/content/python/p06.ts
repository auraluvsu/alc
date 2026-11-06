import type { Module } from '../types'

export const p06: Module = {
  n: 6,
  title: 'References, Mutability & Recycling',
  tour: '6 · Object References, Mutability, and Recycling',
  summary: 'Variables are labels, not boxes. Identity vs equality, the relative immutability of tuples, shallow and deep copies, how arguments are passed, the mutable-default trap, and how CPython frees objects.',
  topics: ['Variables are labels', 'Identity vs equality', 'Copies: shallow & deep', 'Function parameters', 'Mutable defaults', 'del & garbage collection'],
  cpp23: [
    'Free-threaded CPython (no GIL) is officially supported (3.14, PEP 779); reference counting had to be redesigned for it.',
    'Immortal objects (3.12, PEP 683): None, True, small ints and other singletons are never deallocated.',
    '`copy.replace()` (3.13) for "copy with changes" of immutable records.',
  ],
  lessons: [
    {
      id: 'labels',
      title: 'Variables are labels, not boxes',
      blocks: [
        { kind: 'analogy', text: "In C, a variable is a box with a value inside. In Python, a variable is a **sticky label** stuck onto an object that lives elsewhere. `b = a` doesn't copy anything; it sticks a second label on the same object. Change the object through either label, and both see it." },
        { kind: 'stepper', title: 'Step through: two labels, one list', code: [
          'a = [1, 2, 3]',
          'b = a',
          'b.append(4)',
          'print(a)',
          'b = [9]',
          'print(a, b)',
        ], steps: [
          { line: 1, note: 'A list object is created, and the label `a` is stuck on it.', memory: [{ name: 'a', value: '→ list#1', kind: 'ptr' }, { name: 'list#1', value: '[1, 2, 3]', kind: 'heap' }] },
          { line: 2, note: 'No copy: `b` is a second label on the **same** object.', memory: [{ name: 'a', value: '→ list#1', kind: 'ptr' }, { name: 'b', value: '→ list#1', kind: 'ptr' }, { name: 'list#1', value: '[1, 2, 3]', kind: 'heap' }] },
          { line: 3, note: 'Mutating through `b` changes the one object.', memory: [{ name: 'a', value: '→ list#1', kind: 'ptr' }, { name: 'b', value: '→ list#1', kind: 'ptr' }, { name: 'list#1', value: '[1, 2, 3, 4]', kind: 'heap' }] },
          { line: 4, note: 'Prints `[1, 2, 3, 4]`.', memory: [{ name: 'output', value: '[1, 2, 3, 4]' }] },
          { line: 5, note: '**Assignment** moves the `b` label to a new object. It never changes the object `b` used to label.', memory: [{ name: 'a', value: '→ list#1', kind: 'ptr' }, { name: 'list#1', value: '[1, 2, 3, 4]', kind: 'heap' }, { name: 'b', value: '→ list#2', kind: 'ptr' }, { name: 'list#2', value: '[9]', kind: 'heap' }] },
          { line: 6, note: 'Prints `[1, 2, 3, 4] [9]`.', memory: [{ name: 'output', value: '[1, 2, 3, 4] [9]' }] },
        ] },
        { kind: 'list', items: [
          'Every name, list element, dict value and attribute in Python is a reference.',
          '**Mutation** (`append`, `x[i] = …`, `obj.attr = …`) changes an object. **Rebinding** (`name = …`) moves a label. Telling them apart explains most "why did my data change?" bugs.',
        ] },
        { kind: 'compare',
          ts: `const a = [1, 2, 3]
const b = a          // same array (reference)
b.push(4)            // a sees it
// primitives (numbers, strings) behave like values`,
          go: `a := []int{1, 2, 3}
b := a               // shares the backing array
b[0] = 9             // a sees it
// but structs and arrays are copied on assignment`,
          java: `List<Integer> a = new ArrayList<>(List.of(1, 2, 3));
List<Integer> b = a;     // same object
b.add(4);                // a sees it
// primitives (int, double) are copied`,
          cpp: `std::vector<int> a {1, 2, 3};
auto b = a;          // DEEP COPY: b is independent
auto& c = a;         // a reference: c aliases a`,
          python: `a = [1, 2, 3]
b = a                # same object, always
b.append(4)          # a sees it
# even ints and strs are objects; they are just immutable`,
          note: 'Python has no value types: everything is a reference to an object, and immutability is what makes some objects feel like values.' },
        { kind: 'check', q: 'After `x = [1]; y = x; x = x + [2]`, what is y?', options: ['[1, 2]', '[1]', '[2]', 'Error'], answer: 1, hint: 'Does `x + [2]` mutate, or build something new?', explain: '`x + [2]` builds a new list and rebinds x. y still labels the original [1]. (With `x += [2]`, a list would be mutated in place and y would see [1, 2].)' },
      ],
    },
    {
      id: 'identity',
      title: 'Identity, equality & tuples',
      blocks: [
        { kind: 'analogy', text: "`==` asks \"do these two have the same contents?\", like two identical twenty-pound notes. `is` asks \"is this the very same note?\" (same serial number, i.e. same `id()`). You almost always want `==`; use `is` for singletons like `None`." },
        { kind: 'code', code: `a = [1, 2]
b = [1, 2]
a == b          # True: equal contents
a is b          # False: two different objects
id(a) == id(b)  # False

x = None
if x is None: ...          # correct: None is a singleton
# if x == None: ...        # works, but can be fooled by a custom __eq__

t1 = (1, 2, [30, 40])
t2 = (1, 2, [30, 40])
t1 == t2                   # True
t1[-1].append(99)          # the tuple can't change which objects it holds...
t1 == t2                   # False: ...but those objects can change` },
        { kind: 'list', items: [
          '`is` is fast (compares addresses) and can\'t be overridden. `==` calls `__eq__`, which may do anything.',
          'Tuples are **relatively** immutable: the references are fixed, the referenced objects may still be mutable. A tuple containing a list is unhashable.',
          'Don\'t use `is` to compare ints or strings. Small values are cached and interned, so `is` "works" sometimes and fails at other times.',
        ] },
        { kind: 'check', q: 'Which is the correct way to test for None?', options: ['`x == None`', '`x is None`', '`not x`', '`x.isNone()`'], answer: 1, hint: 'None is a singleton.', explain: '`is None` is unambiguous and can\'t be fooled by `__eq__`. `not x` is also true for 0, "", [] and others.' },
      ],
    },
    {
      id: 'copies',
      title: 'Shallow & deep copies',
      blocks: [
        { kind: 'analogy', text: "A **shallow** copy photocopies the top-level list of labels, so the new list's labels still point at the same inner objects. A **deep** copy photocopies everything recursively, so nothing is shared. Shallow copies are fast and usually right, until there is a mutable object nested inside." },
        { kind: 'stepper', title: 'Step through: shallow vs deep copy', code: [
          'import copy',
          'book = {"bids": [2390, 2389], "sym": "XAU"}',
          'shallow = copy.copy(book)',
          'shallow["bids"].append(2388)',
          'deep = copy.deepcopy(book)',
          'deep["bids"].append(1)',
        ], steps: [
          { line: 2, note: 'The dict holds references to a list and a str.', memory: [{ name: 'book', value: '{bids: →L1, sym: →"XAU"}', kind: 'ptr' }, { name: 'L1', value: '[2390, 2389]', kind: 'heap' }] },
          { line: 3, note: 'A new dict, but its `bids` value points to the **same** list L1.', memory: [{ name: 'book', value: '{bids: →L1, …}', kind: 'ptr' }, { name: 'shallow', value: '{bids: →L1, …}', kind: 'ptr' }, { name: 'L1', value: '[2390, 2389]', kind: 'heap', note: 'shared' }] },
          { line: 4, note: 'Appending through `shallow` changes `book["bids"]` too.', memory: [{ name: 'book', value: '{bids: →L1, …}', kind: 'ptr' }, { name: 'shallow', value: '{bids: →L1, …}', kind: 'ptr' }, { name: 'L1', value: '[2390, 2389, 2388]', kind: 'heap', note: 'both see this' }] },
          { line: 5, note: '`deepcopy` copies the dict **and** the list inside it.', memory: [{ name: 'book', value: '{bids: →L1, …}', kind: 'ptr' }, { name: 'L1', value: '[2390, 2389, 2388]', kind: 'heap' }, { name: 'deep', value: '{bids: →L2, …}', kind: 'ptr' }, { name: 'L2', value: '[2390, 2389, 2388]', kind: 'heap' }] },
          { line: 6, note: 'Independent: only L2 changes.', memory: [{ name: 'L1', value: '[2390, 2389, 2388]', kind: 'heap', note: 'book: unchanged' }, { name: 'L2', value: '[2390, 2389, 2388, 1]', kind: 'heap', note: 'deep only' }] },
        ] },
        { kind: 'code', code: `l2 = list(l1); l3 = l1[:]; l4 = l1.copy()     # all shallow copies of a list
d2 = dict(d1); d3 = {**d1}; d4 = d1.copy()     # shallow copies of a dict
import copy
copy.deepcopy(obj)                              # handles cycles; customise with __deepcopy__` },
        { kind: 'check', q: 'After `b = list(a)` where `a = [[1], [2]]`, does `b[0].append(9)` affect a?', options: ['No', 'Yes: the inner lists are shared', 'Only a[0] is copied', 'TypeError'], answer: 1, hint: 'list(a) photocopies the top level only.', explain: 'Shallow copies share nested objects. Use `copy.deepcopy(a)` for full independence.' },
      ],
    },
    {
      id: 'params',
      title: 'Parameters & the mutable default trap',
      blocks: [
        { kind: 'analogy', text: "Calling a function hands it a label on your object (\"call by sharing\"). If the function mutates the object, you see the change. If it just re-sticks its own label elsewhere, you don't. A mutable default argument is a single shared notebook left in the function's drawer: every caller who doesn't bring their own writes in the same one." },
        { kind: 'code', code: `def add_fill(fills, f):
    fills.append(f)          # mutates the caller's list: caller sees it
def reset(fills):
    fills = []               # rebinds the local label only: caller sees nothing

# THE TRAP: the default list is created ONCE, when def runs
def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags

add_tag("a")                 # ['a']
add_tag("b")                 # ['a', 'b']  !!! same list as last time

# The fix: None as a sentinel
def add_tag(tag, tags=None):
    if tags is None:
        tags = []
    tags.append(tag)
    return tags

# Defensive copy: don't let callers' later changes leak into your object
class Basket:
    def __init__(self, items=None):
        self.items = list(items) if items is not None else []` },
        { kind: 'pitfall', text: 'Linters flag mutable defaults (`B006` in Ruff/flake8-bugbear) because this bug is so common. `@dataclass` refuses them outright and makes you use `default_factory`.' },
        { kind: 'check', q: 'Why does `def f(x, acc=[])` accumulate across calls?', options: ['Python caches return values', 'The default list is evaluated once at def time and shared by every call', 'acc is global', 'It doesn\'t'], answer: 1, hint: 'When does the expression `[]` in the def line run?', explain: 'Default values are evaluated once, when the function is defined, and stored on the function object (`f.__defaults__`).' },
      ],
    },
    {
      id: 'gc',
      title: 'del & garbage collection',
      blocks: [
        { kind: 'analogy', text: "`del x` peels a label off; it doesn't destroy the object. CPython keeps a count of labels on each object, and when the count reaches zero the object is recycled immediately. Objects that only label each other in a circle (cycles) are found later by a separate cycle detector." },
        { kind: 'code', code: `import sys, weakref, gc

a = [1, 2, 3]
b = a
sys.getrefcount(a)        # e.g. 3: a, b and the call's own argument (exact counts vary by version)
del a                     # removes the name 'a'; the list lives on via b
b = None                  # now unreachable: freed immediately (refcount 0)

class Node:
    def __init__(self): self.other = None
n1, n2 = Node(), Node()
n1.other, n2.other = n2, n1    # a reference cycle
del n1, n2                     # refcounts never reach 0...
gc.collect()                   # ...the cyclic GC finds and frees them

cache = weakref.WeakValueDictionary()   # references that don't keep objects alive
obj = Node(); cache["k"] = obj
del obj                                  # entry disappears once the object is freed` },
        { kind: 'list', items: [
          '`__del__` is called when an object is about to be destroyed, but **when** that happens isn\'t guaranteed (cycles, other implementations). For cleanup use `with` (module 18) or `weakref.finalize`.',
          'Small ints (−5…256), `None`, `True` and `False` are **immortal** since 3.12: their refcount never changes, which matters for performance and for the free-threaded build.',
          'PyPy, GraalPy and others don\'t use reference counting, so never rely on immediate freeing for correctness.',
        ] },
        { kind: 'new23', text: "Free-threaded CPython (the `python3.14t` build, officially supported since 3.14) runs threads truly in parallel. It replaces plain reference counting with biased and deferred reference counting so threads don't fight over the same counters. Your code doesn't change, but it is why concurrent mutation of shared lists and dicts needs care (module 19)." },
        { kind: 'check', q: 'What does `del x` do?', options: ['Destroys the object x refers to', 'Removes the name x; the object is freed only if nothing else references it', 'Calls __del__ immediately', 'Sets x to None'], answer: 1, hint: 'Peel off a label.', explain: '`del` deletes references, never objects directly. Freeing happens when the refcount drops to zero (or the cycle GC runs).' },
      ],
    },
  ],
  quiz: [
    { q: 'What does `b = a` do for a list a?', options: ['Copies the list', 'Makes b refer to the same list object', 'Creates a view', 'Freezes a'], answer: 1, explain: 'Assignment never copies in Python.' },
    { q: '`a == b` vs `a is b`:', options: ['Identical', '== compares values (via __eq__); is compares identity', 'is compares values', '== compares ids'], answer: 1, explain: 'Use `is` for None and other singletons.' },
    { q: 'Can a tuple\'s contents change?', options: ['Never', 'The references can\'t, but mutable objects inside can', 'Yes, always', 'Only with del'], answer: 1, explain: 'That is "relative immutability".' },
    { q: 'What does `copy.copy` produce for a dict of lists?', options: ['A deep copy', 'A new dict sharing the same inner lists', 'A view', 'A frozen dict'], answer: 1, explain: 'Use deepcopy for nested independence.' },
    { q: 'Python passes arguments by…', options: ['Value (copy)', 'Reference to the variable', 'Sharing: the function gets references to the same objects', 'Name'], answer: 2, explain: 'Mutation is visible to the caller; rebinding isn\'t.' },
    { q: 'What is the fix for a mutable default argument?', options: ['Use a tuple', 'Default to None and create the list inside the function', 'Use global', 'Use copy()'], answer: 1, explain: 'In dataclasses, use `field(default_factory=list)`.' },
    { q: 'When does CPython free an object without cycles?', options: ['At program exit', 'Immediately when its reference count reaches zero', 'When gc.collect() runs', 'Every few seconds'], answer: 1, explain: 'The cyclic GC handles the rest.' },
    { q: 'What is a weak reference for?', options: ['Faster access', 'Referring to an object without keeping it alive', 'Thread safety', 'Copying'], answer: 1, explain: 'It is used for caches and observers.' },
  ],
}
