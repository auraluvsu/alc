import type { Module } from '../types'

export const p16: Module = {
  n: 16,
  title: 'Operator Overloading',
  tour: '16 · Operator Overloading',
  summary: 'Making + - * @ == < work on your own types the Pythonic way: unary operators, infix operators with the reflected fallback and NotImplemented, rich comparisons, and augmented assignment that respects mutability.',
  topics: ['Unary operators', 'Overloading + and *', 'Reflected operators & NotImplemented', 'Rich comparisons', 'Augmented assignment'],
  cpp23: ['Nothing major changed since the book; `@` (`__matmul__`, 3.5) is now everywhere thanks to NumPy and PyTorch.'],
  lessons: [
    {
      id: 'unary',
      title: 'Unary operators',
      blocks: [
        { kind: 'analogy', text: "Operators are just friendly shortcuts for method calls: `-v` is `v.__neg__()`, `abs(v)` is `v.__abs__()`. The ground rule is the same as for built-in numbers: never modify the operand, always return a new object." },
        { kind: 'code', code: `import math
from array import array

class Vector:
    def __init__(self, components): self._c = array("d", components)
    def __iter__(self): return iter(self._c)
    def __len__(self): return len(self._c)
    def __repr__(self): return f"Vector({list(self._c)})"
    def __abs__(self): return math.hypot(*self)
    def __neg__(self): return Vector(-x for x in self)      # new object
    def __pos__(self): return Vector(self)                  # a copy

v = Vector([3, -4])
-v, +v, abs(v)        # (Vector([-3.0, 4.0]), Vector([3.0, -4.0]), 5.0)

from decimal import Decimal, localcontext
with localcontext() as ctx:
    ctx.prec = 40
    x = Decimal("1") / 3      # 40 significant digits
    ctx.prec = 28
    x == +x          # False! +x rounds to the CURRENT context precision` },
        { kind: 'check', q: 'What should `__neg__` return?', options: ['None, after negating self in place', 'A new object', 'self', 'A bool'], answer: 1, hint: 'Like -5 for an int.', explain: 'Unary operators never mutate.' },
      ],
    },
    {
      id: 'add',
      title: 'Overloading + and *',
      blocks: [
        { kind: 'analogy', text: "Defining `__add__` is teaching your object to handle \"me + something\". Be generous about what *something* can be (any iterable of numbers), but say clearly when you can't cope, so Python can ask the other operand instead." },
        { kind: 'code', code: `import itertools, numbers

class Vector:
    ...
    def __add__(self, other):
        try:
            pairs = itertools.zip_longest(self, other, fillvalue=0.0)
            return Vector(a + b for a, b in pairs)
        except TypeError:
            return NotImplemented              # "I can't do this": let Python try other.__radd__

    def __mul__(self, scalar):
        if isinstance(scalar, numbers.Real):   # goose typing: int, float, Fraction, numpy scalars…
            return Vector(n * scalar for n in self)
        return NotImplemented

    def __matmul__(self, other):               # dot product: v @ w
        try:
            return sum(a * b for a, b in zip(self, other, strict=True))
        except TypeError:
            return NotImplemented

Vector([1, 2]) + Vector([3, 4, 5])   # Vector([4.0, 6.0, 5.0])
Vector([1, 2]) + (10, 20)            # works with any iterable
Vector([1, 2]) * 3                   # Vector([3.0, 6.0])
Vector([1, 2]) @ Vector([3, 4])      # 11.0` },
        { kind: 'check', q: 'What should `__add__` do when it can\'t handle the other operand?', options: ['Raise TypeError', 'Return NotImplemented', 'Return None', 'Return self'], answer: 1, hint: 'Give the other operand a chance.', explain: 'Python then tries the reflected method; if that also fails, it raises TypeError for you.' },
      ],
    },
    {
      id: 'reflected',
      title: 'Reflected operators & NotImplemented',
      blocks: [
        { kind: 'analogy', text: "For `a + b`, Python first asks a: \"can you add b?\". If a shrugs (returns `NotImplemented`), Python asks b: \"can you be added *to* a?\" via `b.__radd__(a)`. Only if both shrug does it give up with a TypeError. That two-step dance is how `3 * v` works even though `int` knows nothing about Vectors." },
        { kind: 'stepper', title: 'Step through: evaluating 3 * v', code: [
          'v = Vector([1, 2])',
          'result = 3 * v',
          '# 1) int.__mul__(3, v)',
          '# 2) Vector.__rmul__(v, 3)',
          '# 3) Vector.__mul__(v, 3)',
        ], steps: [
          { line: 1, note: 'A Vector with two components.', memory: [{ name: 'v', value: 'Vector([1.0, 2.0])' }] },
          { line: 3, note: 'Python first tries the left operand: `int.__mul__(3, v)`. int has no idea what a Vector is and returns NotImplemented.', memory: [{ name: 'int.__mul__', value: 'NotImplemented', kind: 'dead' }] },
          { line: 4, note: 'So Python tries the reflected method on the right operand: `v.__rmul__(3)`.', memory: [{ name: 'try', value: 'v.__rmul__(3)', kind: 'ptr' }] },
          { line: 5, note: 'Multiplication by a scalar is commutative, so `__rmul__` simply delegates: `return self * scalar`.', memory: [{ name: 'v.__mul__(3)', value: 'Vector([3.0, 6.0])', kind: 'heap' }] },
          { line: 2, note: 'The result comes back as if `int` had known how.', memory: [{ name: 'result', value: 'Vector([3.0, 6.0])', kind: 'heap' }] },
        ] },
        { kind: 'code', code: `class Vector:
    ...
    def __radd__(self, other):      # other + self
        return self + other
    def __rmul__(self, scalar):     # scalar * self
        return self * scalar

(10, 20) + Vector([1, 2])           # Vector([11.0, 22.0]): tuple.__add__ failed, then __radd__
3 * Vector([1, 2])                  # Vector([3.0, 6.0])
# Vector([1, 2]) * "x"              TypeError: no method on either side could handle it` },
        { kind: 'pitfall', text: '`NotImplemented` (a special value you **return**) is not `NotImplementedError` (an exception you **raise** for unfinished abstract methods). Raising from `__add__` stops the reflected fallback from ever being tried.' },
        { kind: 'check', q: 'For `(10, 20) + v`, which method finally does the work?', options: ['tuple.__add__', 'Vector.__radd__', 'Vector.__add__ directly', 'object.__add__'], answer: 1, hint: 'tuple.__add__ only concatenates tuples.', explain: 'tuple returns NotImplemented for a Vector, so v.__radd__ runs.' },
      ],
    },
    {
      id: 'compare',
      title: 'Rich comparisons',
      blocks: [
        { kind: 'analogy', text: "Comparisons follow the same ask-the-other-side dance, with a twist: the reflection of `a < b` is `b > a`, and for `==` the last resort is an identity check rather than an error, so `v == 'hello'` is just False." },
        { kind: 'code', code: `class Vector:
    ...
    def __eq__(self, other):
        if isinstance(other, Vector):
            return len(self) == len(other) and all(a == b for a, b in zip(self, other))
        return NotImplemented                  # so Vector([1, 2]) == (1, 2) is False, not True

Vector([1, 2]) == Vector([1, 2])     # True
Vector([1, 2]) == (1, 2)             # False: both sides returned NotImplemented → identity check
Vector([1, 2]) != Vector([1, 3])     # True: __ne__ inverts __eq__ automatically

from functools import total_ordering
@total_ordering
class Px:
    def __init__(self, v): self.v = v
    def __eq__(self, o): return self.v == o.v
    def __lt__(self, o): return self.v < o.v
Px(1) <= Px(2)                       # True: <=, >, >= derived for you` },
        { kind: 'check', q: 'You define only `__eq__`. What does `!=` do?', options: ['Raises', 'Uses identity', 'Returns the inverse of __eq__ automatically', 'Always True'], answer: 2, hint: 'Python 3 default __ne__.', explain: 'You rarely need to write `__ne__`.' },
      ],
    },
    {
      id: 'augmented',
      title: 'Augmented assignment',
      blocks: [
        { kind: 'analogy', text: "`a += b` first asks \"can you update yourself in place?\" (`__iadd__`). Mutable objects say yes and change themselves; immutable ones don't define it, so Python falls back to `a = a + b`, building a new object and rebinding the name. Same syntax, very different effect on anyone else holding a reference." },
        { kind: 'code', code: `a = [1, 2]; alias = a
a += [3]              # list.__iadd__: in place
alias                 # [1, 2, 3]: the alias sees it

t = (1, 2); alias_t = t
t += (3,)             # no __iadd__ on tuple → t = t + (3,): a NEW tuple
alias_t               # (1, 2): unchanged

class Basket:                    # a mutable class should implement __iadd__
    def __init__(self, items=()): self.items = list(items)
    def __add__(self, other):    # + must not mutate, and returns a new object
        if not isinstance(other, Basket): return NotImplemented
        return Basket(self.items + other.items)
    def __iadd__(self, other):   # += mutates and must RETURN self
        self.items.extend(other) # accept any iterable, like list.extend
        return self

b = Basket(["XAU"]); b += ["XAG", "XPT"]; b.items   # ['XAU', 'XAG', 'XPT']` },
        { kind: 'pitfall', text: '`__iadd__` must `return self`. Forget the return and `b += x` rebinds `b` to `None`.' },
        { kind: 'check', q: 'Immutable Vector has `__add__` but no `__iadd__`. What does `v += w` do?', options: ['TypeError', 'v = v + w: creates a new Vector and rebinds v', 'Mutates v', 'Nothing'], answer: 1, hint: 'Fallback.', explain: 'Any other references to the old vector are unaffected.' },
      ],
    },
  ],
  quiz: [
    { q: 'Unary operator methods should…', options: ['Mutate self', 'Return a new object', 'Return None', 'Raise'], answer: 1, explain: 'Like numbers.' },
    { q: 'If __add__ can\'t handle the operand it should…', options: ['raise NotImplementedError', 'return NotImplemented', 'return 0', 'print an error'], answer: 1, explain: 'Enables the reflected fallback.' },
    { q: '`3 * v` ends up calling…', options: ['v.__mul__(3) directly', 'v.__rmul__(3) after int.__mul__ returns NotImplemented', 'int.__rmul__', 'Nothing'], answer: 1, explain: 'The reflected dance.' },
    { q: 'Which method implements `@`?', options: ['__at__', '__matmul__', '__dot__', '__mul__'], answer: 1, explain: 'Plus __rmatmul__ and __imatmul__.' },
    { q: 'If both sides return NotImplemented for ==…', options: ['TypeError', 'Identity comparison is used', 'True', 'None'], answer: 1, explain: 'Unlike arithmetic operators.' },
    { q: 'What does @total_ordering need?', options: ['All six', '__eq__ and one of __lt__, __le__, __gt__, __ge__', '__hash__', '__cmp__'], answer: 1, explain: 'It derives the rest.' },
    { q: '`t += (3,)` on a tuple…', options: ['Mutates t', 'Creates a new tuple and rebinds t', 'Errors', 'Does nothing'], answer: 1, explain: 'No __iadd__.' },
    { q: '__iadd__ must return…', options: ['None', 'self', 'A copy', 'NotImplemented always'], answer: 1, explain: 'Or the name becomes None.' },
  ],
}
