import type { Module } from '../types'

export const p23: Module = {
  n: 23,
  title: 'Attribute Descriptors',
  tour: '23 · Attribute Descriptors',
  summary: 'The descriptor protocol behind properties, methods, classmethod, slots and ORM fields: a reusable validating descriptor with __set_name__, overriding vs non-overriding descriptors, why functions become bound methods, and when to reach for descriptors.',
  topics: ['A validating descriptor', '__set_name__', 'Overriding vs non-overriding', 'Methods are descriptors', 'Descriptor usage tips'],
  cpp23: ['Nothing major changed since the book; dataclass fields, pydantic and SQLAlchemy 2.x mapped columns all build on this protocol.'],
  lessons: [
    {
      id: 'validating',
      title: 'A validating descriptor',
      blocks: [
        { kind: 'analogy', text: "A descriptor is a security guard posted at one attribute of a *class*. Whenever any instance's attribute of that name is read or written, the guard intercepts it (`__get__`, `__set__`). One guard class can be hired for many posts: every positive-number field in your codebase can share the same `Positive` guard." },
        { kind: 'code', code: `class Positive:
    def __set_name__(self, owner, name):     # called once, when the owner class is created
        self.storage_name = name

    def __set__(self, instance, value):
        if value <= 0:
            raise ValueError(f"{self.storage_name} must be > 0")
        instance.__dict__[self.storage_name] = value

    # no __get__ needed: the value lives in instance.__dict__ under the same name

class LineItem:
    qty = Positive()                          # the name is no longer repeated
    px = Positive()
    def __init__(self, sym, qty, px):
        self.sym, self.qty, self.px = sym, qty, px
    def subtotal(self): return self.qty * self.px

item = LineItem("XAU", 2, 2385.0)
item.subtotal()         # 4770.0
# item.qty = 0          ValueError: qty must be > 0
LineItem.qty            # <__main__.Positive object ...>: the descriptor lives on the class` },
        { kind: 'check', q: 'Where must a descriptor instance be placed to work?', options: ['In instance.__dict__', 'As a class attribute', 'In a module', 'Anywhere'], answer: 1, hint: 'A guard posted at the class.', explain: 'Descriptors in an instance dict are just ordinary values.' },
      ],
    },
    {
      id: 'setname',
      title: '__set_name__ & a validation hierarchy',
      blocks: [
        { kind: 'analogy', text: "`__set_name__` is the guard reading the name on their own badge when they're posted. Combine it with a template method and you get a family of guards: a base `Validated` class handles storage, and subclasses only say what \"valid\" means." },
        { kind: 'code', code: `import abc

class Validated(abc.ABC):
    def __set_name__(self, owner, name):
        self.storage_name = name
    def __set__(self, instance, value):
        instance.__dict__[self.storage_name] = self.validate(self.storage_name, value)
    @abc.abstractmethod
    def validate(self, name, value): ...

class Positive(Validated):
    def validate(self, name, value):
        if value <= 0: raise ValueError(f"{name} must be > 0")
        return value

class Ticker(Validated):
    def validate(self, name, value):
        value = value.strip().upper()
        if not value.isalnum(): raise ValueError(f"{name} must be alphanumeric")
        return value                       # validators can also normalise

class LineItem:
    sym = Ticker()
    qty = Positive()
    px = Positive()
    def __init__(self, sym, qty, px):
        self.sym, self.qty, self.px = sym, qty, px

LineItem(" xau ", 1, 2385.0).sym      # 'XAU'` },
        { kind: 'check', q: 'When is `__set_name__` called?', options: ['On every assignment', 'Once, when the owning class body finishes executing', 'On first read', 'At import of the descriptor module'], answer: 1, hint: 'Posting the guard.', explain: '`type.__new__` calls it for each descriptor in the class namespace.' },
      ],
    },
    {
      id: 'overriding',
      title: 'Overriding vs non-overriding descriptors',
      blocks: [
        { kind: 'analogy', text: "Guards come in two strengths. An *overriding* (data) descriptor defines `__set__`: it outranks the instance's own dict, so even if a value sits in `instance.__dict__`, the guard handles reads and writes. A *non-overriding* descriptor has only `__get__`: if the instance has its own value under that name, the instance wins, and the guard only answers when the instance has nothing." },
        { kind: 'code', code: `class Overriding:
    def __get__(self, inst, owner): return "from descriptor"
    def __set__(self, inst, value): print("intercepted set")

class NonOverriding:
    def __get__(self, inst, owner): return "from descriptor"

class Managed:
    over = Overriding()
    non = NonOverriding()

m = Managed()
m.over = 7              # prints "intercepted set"
m.__dict__["over"] = 7  # sneak a value into the instance dict
m.over                  # 'from descriptor': data descriptors win over __dict__

m.non                   # 'from descriptor'
m.non = 7               # no __set__: stored in m.__dict__
m.non                   # 7: instance dict now shadows the descriptor

# cached_property is non-overriding: first read computes and stores in __dict__,
# later reads find the dict value and never call the descriptor again.` },
        { kind: 'check', q: 'Why does `cached_property` only compute once?', options: ['It uses a global cache', 'It is non-overriding, so the value it stores in __dict__ shadows it afterwards', 'It is a data descriptor', 'Magic'], answer: 1, hint: 'Who wins when the instance has a value?', explain: 'Delete the attribute to force recomputation.' },
      ],
    },
    {
      id: 'methods',
      title: 'Methods are descriptors',
      blocks: [
        { kind: 'analogy', text: "Every plain function is a non-overriding descriptor. Read it from the class and you get the plain function; read it from an instance and its `__get__` staples the instance on as the first argument, producing a *bound method*. That's the whole secret of `self`." },
        { kind: 'code', code: `class Order:
    def __init__(self, qty): self.qty = qty
    def double(self): return self.qty * 2

o = Order(5)
Order.double                     # <function Order.double ...>: plain function
o.double                         # <bound method Order.double of <Order ...>>
o.double.__self__ is o           # True
o.double.__func__ is Order.double   # True
Order.double.__get__(o, Order)() # 10: exactly what o.double() does

staticmethod, classmethod, property   # all three are descriptors too` },
        { kind: 'check', q: 'What turns `o.double` into a bound method?', options: ['The class constructor', 'function.__get__, because functions are descriptors', 'A metaclass', 'The interpreter special-cases methods'], answer: 1, hint: 'Read from an instance.', explain: 'classmethod\'s __get__ binds the class instead.' },
      ],
    },
    {
      id: 'tips',
      title: 'When to use descriptors',
      blocks: [
        { kind: 'analogy', text: "Descriptors are factory tooling, not hand tools. If one class needs one validated attribute, a property is simpler. When a pattern repeats across many attributes or many classes (validation, unit conversion, lazy loading, database columns), a descriptor class is worth building." },
        { kind: 'list', items: [
          'Use **property** for one-off logic on one class.',
          'Use a **descriptor class** for logic reused across attributes or classes. That\'s how Django fields, SQLAlchemy columns and pydantic fields work.',
          'Read-only descriptors still need `__set__` (raising AttributeError) to be overriding; otherwise an instance attribute can shadow them.',
          'Store per-instance values in `instance.__dict__` (or a `WeakKeyDictionary`), never on the descriptor itself: it\'s shared by all instances.',
          'For plain data classes, `@dataclass` plus `__post_init__` validation is often enough.',
        ] },
        { kind: 'pitfall', text: 'Writing `self.value = value` inside a descriptor\'s `__set__` stores the value on the descriptor, which is shared by every instance of the owner class. All instances then appear to have the same qty.' },
        { kind: 'check', q: 'Where should a descriptor store each instance\'s value?', options: ['self.value on the descriptor', 'instance.__dict__ (or a weak mapping keyed by instance)', 'A global', 'The owner class'], answer: 1, hint: 'One guard, many instances.', explain: 'The descriptor object is shared.' },
      ],
    },
  ],
  quiz: [
    { q: 'A descriptor is a class implementing…', options: ['__call__', 'any of __get__, __set__, __delete__', '__iter__', '__enter__'], answer: 1, explain: 'And used as a class attribute.' },
    { q: 'What does `__set_name__` give a descriptor?', options: ['Its value', 'The attribute name it was assigned to in the owner class', 'The instance', 'A lock'], answer: 1, explain: 'Avoids repeating names.' },
    { q: 'An overriding descriptor defines…', options: ['__get__ only', '__set__ (data descriptor)', '__delete__ only', '__init__'], answer: 1, explain: 'It wins over the instance dict.' },
    { q: 'A plain function on a class is…', options: ['An overriding descriptor', 'A non-overriding descriptor', 'Not a descriptor', 'A property'], answer: 1, explain: '`__get__` builds bound methods.' },
    { q: 'If a non-overriding descriptor and instance dict both have a name, which wins?', options: ['Descriptor', 'Instance dict', 'Error', 'The class'], answer: 1, explain: 'That\'s how cached_property caches.' },
    { q: '`o.method.__self__` is…', options: ['The class', 'The instance o', 'None', 'The function'], answer: 1, explain: 'Bound method.' },
    { q: 'When is a property simpler than a descriptor?', options: ['Never', 'For one-off logic on one class', 'For ORMs', 'For slots'], answer: 1, explain: 'Descriptors pay off with reuse.' },
    { q: 'Storing values as `self.value` in a descriptor causes…', options: ['Nothing', 'All instances sharing one value', 'Faster access', 'A TypeError'], answer: 1, explain: 'The descriptor is shared.' },
  ],
}
