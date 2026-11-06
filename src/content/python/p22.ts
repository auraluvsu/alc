import type { Module } from '../types'

export const p22: Module = {
  n: 22,
  title: 'Dynamic Attributes & Properties',
  tour: '22 · Dynamic Attributes and Properties',
  summary: 'Exploring JSON-like data with dynamic attributes, the difference between __getattr__ and __getattribute__, properties for validation and computed values, property factories, cached_property, and the built-ins for attribute handling.',
  topics: ['Dynamic attributes', '__getattr__ & __getattribute__', 'Properties', 'Property factories', 'Attribute handling built-ins'],
  cpp23: ['`functools.cached_property` (3.8) no longer takes a lock (3.12), so concurrent first access can compute twice.'],
  lessons: [
    {
      id: 'dynamic',
      title: 'Dynamic attributes over JSON',
      blocks: [
        { kind: 'analogy', text: "Typing `feed['instruments'][0]['ticker']` is reading a filing system by drawer number. A wrapper with `__getattr__` turns it into `feed.instruments[0].ticker`: same filing system, but you can walk through it by name, like JavaScript object access." },
        { kind: 'code', code: `import keyword
from collections import abc

class FrozenJSON:
    """Read-only facade for navigating JSON-like objects with attribute notation."""
    def __new__(cls, arg):                       # build the right thing for each node
        if isinstance(arg, abc.Mapping):
            return super().__new__(cls)
        if isinstance(arg, abc.MutableSequence):
            return [cls(item) for item in arg]
        return arg

    def __init__(self, mapping):
        self.__data = {}
        for key, value in mapping.items():
            if keyword.iskeyword(key):           # "class" → "class_" so it can be an attribute
                key += "_"
            self.__data[key] = value

    def __getattr__(self, name):                 # only called when normal lookup fails
        try:
            return getattr(self.__data, name)    # dict methods: keys(), items()…
        except AttributeError:
            return FrozenJSON(self.__data[name]) # KeyError → AttributeError would be nicer

feed = FrozenJSON({"venue": "LBMA", "instruments": [{"ticker": "XAU", "class": "metal"}]})
feed.instruments[0].ticker, feed.instruments[0].class_    # ('XAU', 'metal')` },
        { kind: 'check', q: 'Why does `__new__` sometimes return a list or a plain value?', options: ['A bug', 'So each JSON node gets the right wrapper: dicts wrapped, lists mapped, scalars returned as-is', 'For speed', 'For pickling'], answer: 1, hint: 'What should FrozenJSON(42) be?', explain: 'When __new__ returns a non-instance, __init__ isn\'t called.' },
      ],
    },
    {
      id: 'getattribute',
      title: '__getattr__ vs __getattribute__',
      blocks: [
        { kind: 'analogy', text: "`__getattribute__` is the front door every visitor goes through; `__getattr__` is the lost-property office you're sent to only when the front desk can't find what you asked for. Overriding the front door is powerful and dangerous: every single attribute access, including your own `self.x`, now goes through your code." },
        { kind: 'code', code: `class Audited:
    def __init__(self): self.qty = 10
    def __getattribute__(self, name):
        print(f"get {name}")
        return super().__getattribute__(name)   # NEVER self.name here: infinite recursion
    def __getattr__(self, name):
        return f"<no {name}>"

a = Audited()
a.qty         # prints "get qty", returns 10
a.price       # prints "get price", then falls back to __getattr__ → '<no price>'

# Lookup order for obj.attr (simplified):
# 1. data descriptors on the class (e.g. properties)
# 2. obj.__dict__
# 3. non-data descriptors and plain class attributes (e.g. methods)
# 4. __getattr__, if defined` },
        { kind: 'check', q: 'Which is called for every attribute access?', options: ['__getattr__', '__getattribute__', '__get__', '__dict__'], answer: 1, hint: 'The front door.', explain: '`__getattr__` only on failure.' },
      ],
    },
    {
      id: 'properties',
      title: 'Properties',
      blocks: [
        { kind: 'analogy', text: "A property is a vending machine disguised as a shelf. Callers write `order.qty` and `order.qty = 5` as if it were a plain attribute, but behind the shelf a getter and setter run, so you can validate, convert or compute. You can start with a plain attribute and swap in a property later without changing any calling code: no Java-style getters and setters up front." },
        { kind: 'code', code: `class Order:
    def __init__(self, sym: str, qty: float, px: float):
        self.sym = sym
        self.qty = qty                 # goes through the setter below
        self.px = px

    @property
    def qty(self) -> float:
        return self._qty

    @qty.setter
    def qty(self, value: float) -> None:
        if value <= 0:
            raise ValueError("qty must be positive")
        self._qty = value

    @property
    def notional(self) -> float:      # computed, read-only
        return self.qty * self.px

o = Order("XAU", 2, 2385.0)
o.notional            # 4770.0
# o.qty = -1          ValueError: qty must be positive
# o.notional = 1      AttributeError: property 'notional' of 'Order' object has no setter

from functools import cached_property
class Instrument:
    @cached_property
    def history(self):             # computed on first access, then stored in __dict__
        return load_history(self)` },
        { kind: 'check', q: 'Why does Python not need getters and setters written up front?', options: ['It does need them', 'A public attribute can later become a property without changing callers', 'Attributes are always private', 'Setters are automatic'], answer: 1, hint: 'Shelf vs vending machine.', explain: 'The calling syntax stays the same.' },
      ],
    },
    {
      id: 'factory',
      title: 'Property factories',
      blocks: [
        { kind: 'analogy', text: "When five attributes need the same validation, writing five getter/setter pairs is a copy-and-paste trap. A property factory is a small machine that stamps out identical validated properties: `qty = positive('qty')`." },
        { kind: 'code', code: `def positive(storage_name: str) -> property:
    def getter(instance):
        return instance.__dict__[storage_name]
    def setter(instance, value):
        if value <= 0:
            raise ValueError(f"{storage_name} must be > 0")
        instance.__dict__[storage_name] = value
    return property(getter, setter)

class LineItem:
    qty = positive("qty")
    px = positive("px")
    def __init__(self, qty, px):
        self.qty, self.px = qty, px

item = LineItem(3, 2385.0)
item.__dict__          # {'qty': 3, 'px': 2385.0}
# LineItem(0, 1)       ValueError: qty must be > 0` },
        { kind: 'p', text: 'Note `"qty"` written twice: once as the class attribute name, once as the storage name. The next module\'s descriptors with `__set_name__` remove that repetition, which is how dataclass fields and ORM columns know their own names.' },
        { kind: 'check', q: 'Why can the getter read `instance.__dict__["qty"]` without recursion?', options: ['It can\'t', 'Reading __dict__ directly bypasses the property', 'Properties are disabled in getters', 'Because of slots'], answer: 1, hint: '`instance.qty` would call the property again.', explain: 'Properties are class attributes; the instance dict is separate storage.' },
      ],
    },
    {
      id: 'builtins',
      title: 'Attribute-handling built-ins',
      blocks: [
        { kind: 'analogy', text: "These built-ins are the reflection toolkit: they let code work with attribute names as strings, which is how serialisers, ORMs and config loaders turn data into objects and back." },
        { kind: 'code', code: `o = Order("XAU", 2, 2385.0)

getattr(o, "px")                 # 2385.0
getattr(o, "venue", "LBMA")      # default when missing
setattr(o, "px", 2390.0)         # same as o.px = 2390.0
hasattr(o, "notional")           # True (computed by calling the property!)
delattr(o, "sym")                # same as del o.sym
vars(o)                          # o.__dict__: {'_qty': 2, 'px': 2390.0}
dir(o)                           # every name, including inherited and dunder

# Apply a config dict onto an object:
for k, v in {"px": 2391.0, "qty": 3}.items():
    setattr(o, k, v)             # goes through the qty setter, so validation still applies` },
        { kind: 'check', q: 'What does `getattr(o, "venue", "LBMA")` return if `o` has no venue?', options: ['AttributeError', '"LBMA"', 'None', '""'], answer: 1, hint: 'Third argument.', explain: 'Without a default it raises AttributeError.' },
      ],
    },
  ],
  quiz: [
    { q: 'When is __getattr__ called?', options: ['Always', 'Only when normal lookup fails', 'On assignment', 'On deletion'], answer: 1, explain: 'A fallback.' },
    { q: 'Inside __getattribute__, how do you get the real value safely?', options: ['self.name', 'super().__getattribute__(name)', 'getattr(self, name)', 'self.__dict__ only'], answer: 1, explain: 'Avoid infinite recursion.' },
    { q: 'What makes a property read-only?', options: ['A decorator', 'Not defining a setter', '__slots__', 'Underscore name'], answer: 1, explain: 'Assignment raises AttributeError.' },
    { q: 'Main advantage of properties in Python?', options: ['Speed', 'Start with plain attributes and add logic later without changing callers', 'Privacy', 'Typing'], answer: 1, explain: 'No up-front getters.' },
    { q: 'cached_property stores its value where?', options: ['A class cache', 'The instance __dict__', 'A global dict', 'Nowhere'], answer: 1, explain: 'Deleting the attribute resets it.' },
    { q: 'A property factory returns…', options: ['A function', 'A property object', 'A class', 'A descriptor class'], answer: 1, explain: 'Assigned as a class attribute.' },
    { q: 'What does vars(obj) return?', options: ['All attributes including methods', 'obj.__dict__', 'A list of names', 'The class'], answer: 1, explain: 'dir() lists names.' },
    { q: 'Keys like "class" in JSON need…', options: ['Nothing', 'Renaming (e.g. class_) to be valid attribute names', 'Quoting', 'Deletion'], answer: 1, explain: 'Keywords can\'t be identifiers.' },
  ],
}
