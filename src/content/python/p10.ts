import type { Module } from '../types'

export const p10: Module = {
  n: 10,
  title: 'Design Patterns with First-Class Functions',
  tour: '10 · Design Patterns with First-Class Functions',
  summary: 'Many classic object-oriented patterns exist to pass behaviour around. With first-class functions, Strategy and Command shrink to a function or a callable, and decorator-based registries replace hand-maintained lists.',
  topics: ['Refactoring Strategy', 'Function-oriented Strategy', 'Decorator-enhanced registries', 'Command pattern'],
  cpp23: ['`@dataclass` (3.7) and `typing.NamedTuple` make the "context" objects in these patterns one-liners.'],
  lessons: [
    {
      id: 'classic',
      title: 'Classic Strategy',
      blocks: [
        { kind: 'analogy', text: "The Strategy pattern is a satnav with a \"route preference\" setting: fastest, shortest, avoid tolls. The car (the context) doesn't change; you swap the policy object that decides the route. In Java this needs an interface and one class per policy, each with a single method." },
        { kind: 'code', code: `from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass(frozen=True)
class Order:
    sym: str
    qty: int
    px: float

class CommissionPolicy(ABC):                     # the strategy interface
    @abstractmethod
    def fee(self, order: Order) -> float: ...

class FlatFee(CommissionPolicy):
    def fee(self, order): return 1.0

class Bps(CommissionPolicy):
    def __init__(self, bps): self.bps = bps
    def fee(self, order): return order.qty * order.px * self.bps / 1e4

@dataclass
class Execution:                                  # the context
    order: Order
    policy: CommissionPolicy
    def cost(self): return self.order.qty * self.order.px + self.policy.fee(self.order)

Execution(Order("XAU", 2, 2385.0), Bps(1.5)).cost()   # 4770.0 + 0.7155` },
        { kind: 'check', q: 'In this design, what varies between strategies?', options: ['The Order class', 'The fee calculation, held in a swappable policy object', 'The Execution class', 'The symbol'], answer: 1, hint: 'Same car, different route preference.', explain: 'Each concrete strategy is a one-method class: a function in disguise.' },
      ],
    },
    {
      id: 'functions',
      title: 'Function-oriented Strategy',
      blocks: [
        { kind: 'analogy', text: "If every strategy class has exactly one method and no meaningful state, the class is wrapping paper around a function. Throw away the paper. Pass the function itself; a configurable strategy becomes a closure or `partial`." },
        { kind: 'code', code: `from typing import Callable
Fee = Callable[[Order], float]

def flat_fee(order: Order) -> float:
    return 1.0

def bps(rate: float) -> Fee:                       # factory: configured strategy as a closure
    def fee(order: Order) -> float:
        return order.qty * order.px * rate / 1e4
    return fee

@dataclass
class Execution:
    order: Order
    fee: Fee
    def cost(self): return self.order.qty * self.order.px + self.fee(self.order)

o = Order("XAU", 2, 2385.0)
Execution(o, flat_fee).cost()       # 4771.0
Execution(o, bps(1.5)).cost()       # 4770.7155
min([flat_fee, bps(1.5), bps(0.5)], key=lambda f: f(o))   # pick the cheapest policy` },
        { kind: 'compare',
          python: `Execution(order, fee=bps(1.5))   # just pass a function`,
          ts: `new Execution(order, bps(1.5))   // functions are values; same idea`,
          go: `Execution{Order: o, Fee: bps(1.5)}   // func(Order) float64 field`,
          java: `new Execution(order, o -> o.qty() * o.px() * 1.5 / 1e4);   // lambda for a functional interface`,
          cpp: `Execution{order, [](const Order& o) { return o.qty * o.px * 1.5 / 1e4; }};   // std::function member`,
          note: 'Every language here now supports function-valued strategies; the class-per-strategy version is mostly legacy Java style.' },
        { kind: 'check', q: 'When should a strategy stay a class rather than a function?', options: ['Never', 'When it needs several methods or significant internal state', 'Always in Python', 'When it uses floats'], answer: 1, hint: 'What does the function version lose?', explain: 'One method + little state → function. More → class (or Protocol).' },
      ],
    },
    {
      id: 'registry',
      title: 'Decorator-enhanced registries',
      blocks: [
        { kind: 'analogy', text: "Keeping a separate list of all strategies is a staff list someone must remember to update every time you hire. A registration decorator is a badge machine at the door: every new function gets added the moment it's defined, so the list can't drift out of date." },
        { kind: 'code', code: `SIGNALS: dict[str, Callable] = {}

def signal(name: str):
    def register(func):
        SIGNALS[name] = func
        return func
    return register

@signal("mom")
def momentum(px): return px[-1] / px[-21] - 1

@signal("rev")
def reversal(px): return -(px[-1] / px[-6] - 1)

def score(px, use=("mom", "rev")):
    return {name: SIGNALS[name](px) for name in use}

list(SIGNALS)       # ['mom', 'rev']: config files can now refer to signals by name` },
        { kind: 'check', q: 'What advantage does the registry decorator have over a hand-written list?', options: ['Speed', 'New functions are registered automatically when defined, so the list can\'t be forgotten', 'Type safety', 'It runs in parallel'], answer: 1, hint: 'Badge machine at the door.', explain: 'Registration happens at import time (module 9).' },
      ],
    },
    {
      id: 'command',
      title: 'Command',
      blocks: [
        { kind: 'analogy', text: "The Command pattern turns a request into an object you can queue, log or undo, like an order ticket rather than shouting an instruction across the trading floor. In Python a callable is already a ticket: a function, a `partial` with its arguments baked in, or a class with `__call__` if it must also support undo." },
        { kind: 'code', code: `from functools import partial

queue = [
    partial(send_order, "XAU", 2, limit=2385.0),
    partial(cancel_order, order_id=1234),
    partial(send_order, "XAG", -10),
]
for cmd in queue:
    cmd()                                # run in order

class MacroCommand:
    """A list of commands executed as one, still a single callable."""
    def __init__(self, commands): self.commands = list(commands)
    def __call__(self):
        for c in self.commands: c()

rebalance = MacroCommand(queue)
rebalance()` },
        { kind: 'check', q: 'Which turns `send_order("XAU", 2)` into a deferred command without calling it?', options: ['`send_order("XAU", 2)`', '`partial(send_order, "XAU", 2)`', '`lambda: send_order`', '`send_order.command`'], answer: 1, hint: 'Pre-filled form.', explain: '`lambda: send_order("XAU", 2)` also works.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does the Strategy pattern vary?', options: ['The data', 'An algorithm, chosen at runtime', 'The class hierarchy', 'The interface'], answer: 1, explain: 'Swap the policy, keep the context.' },
    { q: 'A one-method, stateless strategy class is best replaced by…', options: ['A metaclass', 'A plain function', 'A dict', 'A thread'], answer: 1, explain: 'Functions are first-class.' },
    { q: 'How do you make a configurable function strategy?', options: ['Global variables', 'A closure factory or functools.partial', 'eval', 'Inheritance'], answer: 1, explain: 'e.g. `bps(1.5)` returns a function.' },
    { q: 'When does a registration decorator add a function?', options: ['On first call', 'When the function is defined', 'At exit', 'Never automatically'], answer: 1, explain: 'Import time.' },
    { q: 'What must a registration decorator return?', options: ['None', 'The original function (or a replacement)', 'A string', 'The registry'], answer: 1, explain: 'Returning None would rebind the name to None.' },
    { q: 'The Command pattern represents…', options: ['A loop', 'A request as an object that can be queued or logged', 'A thread', 'An exception'], answer: 1, explain: 'In Python, any callable.' },
    { q: 'Which helps build commands with baked-in arguments?', options: ['functools.partial', 'itertools.chain', 'abc.ABC', 'copy.deepcopy'], answer: 0, explain: 'Or a lambda.' },
    { q: 'When might a command still be a class?', options: ['Never', 'When it must support undo or hold state', 'Always', 'When it is async'], answer: 1, explain: 'Give it `__call__` and `undo`.' },
  ],
}
