import type { Module } from '../types'

export const p07: Module = {
  n: 7,
  title: 'Functions as First-Class Objects',
  tour: '7 · Functions as First-Class Objects',
  summary: 'Functions are ordinary objects: you can store them, pass them, return them and inspect them. Higher-order functions, lambdas, the many kinds of callables, flexible parameters, and the operator and functools modules.',
  topics: ['Functions as objects', 'Higher-order functions', 'Callable types', 'Positional-only & keyword-only parameters', 'operator & functools.partial'],
  cpp23: ['`functools.Placeholder` lets `partial` leave a positional slot open (3.14).'],
  lessons: [
    {
      id: 'objects',
      title: 'Functions are objects',
      blocks: [
        { kind: 'analogy', text: "In Python a function is a recipe card, not a cook. You can photocopy the card, file it under a new name, hand it to someone else, or pin a sticky note on it, and none of that runs the recipe. Only the brackets `()` actually start cooking." },
        { kind: 'code', code: `def spread_bp(bid, ask):
    """Bid-ask spread in basis points of the mid."""
    return (ask - bid) / ((ask + bid) / 2) * 1e4

f = spread_bp                 # no call: f is the same function object
f(2385.1, 2385.5)             # 1.677...
type(spread_bp)               # <class 'function'>
spread_bp.__name__            # 'spread_bp'
spread_bp.__doc__             # 'Bid-ask spread in basis points of the mid.'
spread_bp.__defaults__        # None

metrics = {"spread": spread_bp, "mid": lambda b, a: (a + b) / 2}
metrics["mid"](2385.1, 2385.5)   # 2385.3: functions as dict values` },
        { kind: 'compare',
          python: `handlers = {"buy": on_buy, "sell": on_sell}
handlers[side](order)`,
          ts: `const handlers: Record<string, (o: Order) => void> = { buy: onBuy, sell: onSell }
handlers[side](order)`,
          go: `handlers := map[string]func(Order){"buy": onBuy, "sell": onSell}
handlers[side](order)`,
          java: `Map<String, Consumer<Order>> handlers = Map.of("buy", this::onBuy, "sell", this::onSell);
handlers.get(side).accept(order);`,
          cpp: `std::unordered_map<std::string, std::function<void(const Order&)>> handlers{
    {"buy", on_buy}, {"sell", on_sell}};
handlers.at(side)(order);`,
          note: 'TypeScript and Go also treat functions as values; Java and C++ wrap them in functional interfaces or std::function.' },
        { kind: 'check', q: 'What does `g = spread_bp` do?', options: ['Calls spread_bp and stores the result', 'Binds a second name to the same function object', 'Copies the function', 'Raises a TypeError'], answer: 1, hint: 'No brackets, no cooking.', explain: 'Assignment never copies in Python; `g is spread_bp` is True.' },
      ],
    },
    {
      id: 'higher',
      title: 'Higher-order functions & lambdas',
      blocks: [
        { kind: 'analogy', text: "A higher-order function is a manager who takes a job description as an argument: `sorted` doesn't know how you want trades ordered, so it takes a small function (the `key`) that answers \"what number should I compare for this one?\". A lambda is a job description scrawled on a sticky note: fine for one line, wrong for anything you'd want to name or test." },
        { kind: 'code', code: `trades = [("XAU", 120.0), ("XAG", -40.5), ("XPT", 15.2)]

sorted(trades, key=lambda t: t[1], reverse=True)   # by P&L, best first
max(trades, key=lambda t: abs(t[1]))               # biggest absolute move

# map/filter exist, but comprehensions usually read better
list(map(abs, [-1, 2, -3]))                        # [1, 2, 3]
[abs(x) for x in [-1, 2, -3]]                      # same, more Pythonic
[t for t in trades if t[1] > 0]                    # instead of filter(...)

from functools import reduce
from operator import mul
reduce(mul, [1.01, 0.99, 1.02])                    # 1.019898: compounded growth
# sum() for adding; math.prod() for multiplying are clearer still` },
        { kind: 'list', items: [
          'A lambda can only hold one **expression**: no statements, no assignments (except `:=`), no annotations.',
          'If a lambda is hard to read, give it a name with `def`. Named functions show up properly in tracebacks.',
          '`any`, `all`, `sum`, `min`, `max`, `sorted` and `math.prod` cover most uses of `reduce`.',
        ] },
        { kind: 'check', q: 'Which is the most Pythonic way to keep only winning trades?', options: ['`list(filter(lambda t: t[1] > 0, trades))`', '`[t for t in trades if t[1] > 0]`', '`reduce(...)`', 'A while loop'], answer: 1, hint: 'Ramalho prefers one of these strongly.', explain: 'Comprehensions replaced most uses of map and filter.' },
      ],
    },
    {
      id: 'callables',
      title: 'The kinds of callables',
      blocks: [
        { kind: 'analogy', text: "Anything you can put `()` after is a callable, the way anything with a working doorbell can receive visitors. Functions, methods, classes (calling a class builds an instance), generator functions and objects with a `__call__` method all have the doorbell. `callable(x)` asks whether one is fitted." },
        { kind: 'code', code: `class EWMA:
    """Exponentially weighted moving average that remembers its state."""
    def __init__(self, alpha: float):
        self.alpha, self.value = alpha, None

    def __call__(self, x: float) -> float:           # makes instances callable
        self.value = x if self.value is None else self.alpha * x + (1 - self.alpha) * self.value
        return self.value

smooth = EWMA(0.5)
smooth(10.0); smooth(20.0)        # 10.0, then 15.0
callable(smooth), callable(EWMA), callable(42)    # (True, True, False)` },
        { kind: 'list', items: [
          '**User-defined functions** (`def`, `lambda`), **built-in functions** (`len`), **built-in methods** (`dict.get`), **methods** (functions in a class body).',
          '**Classes**: calling one runs `__new__` then `__init__`.',
          '**Instances** whose class defines `__call__`, like `EWMA` above: functions with memory.',
          '**Generator, native coroutine and async generator functions**: calling them returns a generator or coroutine object rather than running the body.',
        ] },
        { kind: 'check', q: 'Why make `EWMA` a callable class rather than a plain function?', options: ['Classes are faster', 'It keeps state (the running average) between calls', 'Functions can\'t take floats', 'It\'s required for lambdas'], answer: 1, hint: 'What does a plain function forget between calls?', explain: 'A closure (module 9) is the other way to give a function memory.' },
      ],
    },
    {
      id: 'params',
      title: 'Flexible parameters',
      blocks: [
        { kind: 'analogy', text: "A function's parameter list is a form. Some boxes you can fill by position, some only by naming the box (keyword-only, after `*`), and some only by position (positional-only, before `/`). `*args` is a \"continue on a separate sheet\" box for extra positional values, `**kwargs` the same for extra named ones." },
        { kind: 'code', code: `def order(sym, qty, /, side="buy", *, limit=None, tif="DAY", **tags):
    return sym, qty, side, limit, tif, tags

order("XAU", 1)                                  # ('XAU', 1, 'buy', None, 'DAY', {})
order("XAU", 1, "sell", limit=2390.0, desk="metals")
# order(sym="XAU", qty=1)      TypeError: sym and qty are positional-only
# order("XAU", 1, "sell", 2390.0)  TypeError: limit is keyword-only

def log(*args, **kwargs):
    print(args, kwargs)
log(1, 2, level="info")          # (1, 2) {'level': 'info'}

params = {"limit": 2390.0, "tif": "IOC"}
order("XAU", 1, **params)        # unpack a dict into keyword arguments` },
        { kind: 'list', items: [
          '**Keyword-only** arguments (after `*`) make call sites self-explaining: `order("XAU", 1, limit=2390)` can\'t be misread.',
          '**Positional-only** arguments (before `/`) let you rename parameters later without breaking callers.',
          'Never use a mutable default like `def f(xs=[])`: the list is created once and shared by every call (module 6).',
        ] },
        { kind: 'check', q: 'In `def f(a, /, b, *, c)`, which call is valid?', options: ['`f(a=1, b=2, c=3)`', '`f(1, 2, 3)`', '`f(1, b=2, c=3)`', '`f(1, 2)`'], answer: 2, hint: '`a` positional-only, `c` keyword-only.', explain: '`b` can go either way; `c` must be named; `a` must not be.' },
      ],
    },
    {
      id: 'functools',
      title: 'operator & functools.partial',
      blocks: [
        { kind: 'analogy', text: "The `operator` module is a drawer of ready-made sticky notes for the commonest lambdas (`itemgetter(1)` is `lambda t: t[1]`). `partial` is a pre-filled form: you fill in some boxes now and hand over a new, shorter form for someone else to finish later." },
        { kind: 'code', code: `from operator import itemgetter, attrgetter, methodcaller
from functools import partial

sorted(trades, key=itemgetter(1))              # same as lambda t: t[1]
itemgetter(0, 1)(("XAU", 120.0, "x"))           # ('XAU', 120.0)
# attrgetter("pnl") for objects; methodcaller("upper")("xau") -> 'XAU'

def round_to_tick(px, tick):
    return round(px / tick) * tick

gold_tick = partial(round_to_tick, tick=0.1)
gold_tick(2385.1234)                           # 2385.1 (approximately: floats)

import functools
pow2 = functools.partial(pow, functools.Placeholder, 2)   # 3.14+: fill the 2nd slot, leave the 1st open
pow2(9)                                        # 81` },
        { kind: 'new23', text: '`functools.Placeholder` (3.14) lets `partial` fix a later positional argument while leaving an earlier one open, something previously only possible with a lambda.' },
        { kind: 'check', q: 'What is `itemgetter(1)` equivalent to?', options: ['`lambda x: x.1`', '`lambda x: x[1]`', '`lambda x: x[0]`', '`lambda x: x(1)`'], answer: 1, hint: 'item = subscript.', explain: 'With several indices it returns a tuple.' },
      ],
    },
  ],
  quiz: [
    { q: 'What makes functions "first-class" in Python?', options: ['They are compiled', 'They can be assigned, passed, returned and stored like any object', 'They run first', 'They have types'], answer: 1, explain: 'Functions are instances of `function`.' },
    { q: 'What can a lambda body contain?', options: ['Any statements', 'A single expression', 'A loop', 'A return statement'], answer: 1, explain: 'Use def for anything more.' },
    { q: 'Which makes an instance callable?', options: ['__init__', '__call__', '__repr__', '__invoke__'], answer: 1, explain: 'Then `obj()` runs `__call__`.' },
    { q: 'What does `callable(int)` return?', options: ['False', 'True', 'TypeError', 'None'], answer: 1, explain: 'Classes are callable.' },
    { q: 'Parameters after a bare `*` are…', options: ['Positional-only', 'Keyword-only', 'Optional', 'Variadic'], answer: 1, explain: 'They must be passed by name.' },
    { q: 'Parameters before `/` are…', options: ['Keyword-only', 'Positional-only', 'Required to be ints', 'Ignored'], answer: 1, explain: 'Callers can\'t name them.' },
    { q: 'What does `partial(f, tick=0.1)` return?', options: ['f(0.1)', 'A new callable with tick pre-filled', 'A lambda string', 'None'], answer: 1, explain: 'A `functools.partial` object.' },
    { q: 'Which usually replaces `map(f, xs)`?', options: ['A list comprehension', 'reduce', 'A class', 'eval'], answer: 0, explain: '`[f(x) for x in xs]`.' },
  ],
}
