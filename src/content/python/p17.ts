import type { Module } from '../types'

export const p17: Module = {
  n: 17,
  title: 'Iterators, Generators & Classic Coroutines',
  tour: '17 · Iterators, Generators, and Classic Coroutines',
  summary: 'The iteration protocol behind every for loop, generator functions and expressions as lazy iterators, the itertools toolbox, delegating with yield from, and the older generator-based coroutines.',
  topics: ['Iterables vs iterators', 'Generator functions', 'Lazy evaluation & itertools', 'yield from', 'Classic coroutines'],
  cpp23: ['`itertools.batched` (3.12) and its `strict` flag (3.13).', '`itertools.pairwise` (3.10).'],
  lessons: [
    {
      id: 'protocol',
      title: 'Iterables vs iterators',
      blocks: [
        { kind: 'analogy', text: "An iterable is a book; an iterator is a bookmark in it. `iter(book)` hands you a fresh bookmark; `next(bookmark)` reads the next page and moves the bookmark along. Many readers can each have their own bookmark in the same book, but a bookmark only ever moves forwards, and once it reaches the end it's done for good." },
        { kind: 'code', code: `px = [2385.0, 2390.5, 2381.4]      # iterable (has __iter__)
it = iter(px)                      # iterator (has __next__ and __iter__ returning itself)
next(it), next(it), next(it)       # (2385.0, 2390.5, 2381.4)
# next(it)                         StopIteration

# What "for x in px:" really does:
it = iter(px)
while True:
    try:
        x = next(it)
    except StopIteration:
        break
    ...

it = iter(px)
list(it); list(it)                 # [2385.0, 2390.5, 2381.4], then []: exhausted` },
        { kind: 'pitfall', text: 'Iterators are single-use. A function that loops over its argument twice (say, to compute a mean then a variance) works with a list but silently gets nothing the second time from a generator. Make an iterable\'s `__iter__` return a *new* iterator each time, and never make a container its own iterator.' },
        { kind: 'check', q: 'What does `iter()` called on an iterator return?', options: ['A copy', 'The same iterator', 'A list', 'StopIteration'], answer: 1, hint: 'A bookmark\'s bookmark is itself.', explain: 'That\'s why iterators can be used in for loops.' },
      ],
    },
    {
      id: 'generators',
      title: 'Generator functions',
      blocks: [
        { kind: 'analogy', text: "A generator function is a recipe with pause buttons. Each `yield` hands one result over and freezes the kitchen exactly as it is; the next `next()` unfreezes it and carries on from that line. Nothing is cooked until someone asks, and only one dish exists at a time." },
        { kind: 'code', code: `def returns(prices):
    prev = None
    for p in prices:
        if prev is not None:
            yield p / prev - 1          # pause here, hand out one value
        prev = p

g = returns([100, 102, 99.96])
g                                   # <generator object returns at 0x...>: nothing ran yet
next(g)                             # ≈ 0.02
list(g)                             # [≈ -0.02]: the rest

# Generator expression: same laziness, comprehension syntax
squares = (r * r for r in returns(px))
sum(r * r for r in returns(px))     # brackets can be dropped as the sole argument

class Prices:
    def __init__(self, xs): self._xs = list(xs)
    def __iter__(self):             # a generator function as __iter__: a fresh iterator each time
        yield from self._xs` },
        { kind: 'check', q: 'When does the body of a generator function start running?', options: ['When the function is called', 'On the first next()', 'At import', 'When the generator is garbage-collected'], answer: 1, hint: 'Calling it only builds the paused kitchen.', explain: 'Calling returns a generator object immediately.' },
      ],
    },
    {
      id: 'itertools',
      title: 'Lazy evaluation & itertools',
      blocks: [
        { kind: 'analogy', text: "Laziness is a conveyor belt instead of a warehouse. Each stage (filter, transform, window) takes one item, processes it and passes it on. A ten-gigabyte tick file flows through in constant memory because no stage ever holds the whole thing." },
        { kind: 'code', code: `import itertools as it

ticks = (parse(line) for line in open("ticks.csv"))     # lazy: one line in memory at a time
big = (t for t in ticks if t.qty >= 100)
first10 = list(it.islice(big, 10))                       # stop after 10, read no further

list(it.pairwise([1, 2, 4]))           # [(1, 2), (2, 4)]: consecutive pairs
list(it.batched("ABCDEFG", 3))         # [('A','B','C'), ('D','E','F'), ('G',)]
list(it.accumulate([1, 2, 3]))         # [1, 3, 6]: running totals
list(it.accumulate([3, 1, 4], max))    # [3, 3, 4]: running max (drawdown peaks)
list(it.chain([1, 2], (3,)))           # [1, 2, 3]
list(it.takewhile(lambda x: x < 3, [1, 2, 5, 1]))   # [1, 2]
[(k, len(list(g))) for k, g in it.groupby("AAABBA")]  # [('A', 3), ('B', 2), ('A', 1)]
it.count(start=0, step=0.5)            # infinite: always pair with islice/zip/takewhile` },
        { kind: 'pitfall', text: '`itertools.groupby` only groups **consecutive** equal keys (like Unix `uniq`). Sort by the key first if you want one group per key.' },
        { kind: 'check', q: 'Why use `islice(gen, 10)` instead of `list(gen)[:10]`?', options: ['Style', 'It stops after 10 items instead of consuming the whole generator', 'It sorts', 'It caches'], answer: 1, hint: 'Conveyor belt.', explain: 'With an infinite or huge source, list() never finishes.' },
      ],
    },
    {
      id: 'yieldfrom',
      title: 'yield from',
      blocks: [
        { kind: 'analogy', text: "`yield from sub` is a manager handing the microphone to a colleague: everything the colleague says goes straight to the audience until they're done, and then the manager gets the mic back, along with whatever the colleague `return`ed." },
        { kind: 'code', code: `def chain(*iterables):
    for i in iterables:
        yield from i                  # instead of: for x in i: yield x

list(chain("AB", range(2)))           # ['A', 'B', 0, 1]

def walk(tree):                       # recursive generators read naturally
    yield tree["name"]
    for child in tree.get("children", []):
        yield from walk(child)

book = {"name": "desk", "children": [{"name": "metals", "children": [{"name": "XAU"}]}]}
list(walk(book))                      # ['desk', 'metals', 'XAU']

def sub():
    yield 1
    return "done"                     # becomes the value of the yield from expression
def outer():
    result = yield from sub()
    yield result
list(outer())                         # [1, 'done']` },
        { kind: 'check', q: 'What is the value of the expression `yield from sub()`?', options: ['None always', 'The value sub() returns', 'The last yielded value', 'A list'], answer: 1, hint: 'The colleague\'s closing remark.', explain: 'Carried by StopIteration.value under the hood.' },
      ],
    },
    {
      id: 'coroutines',
      title: 'Classic coroutines',
      blocks: [
        { kind: 'analogy', text: "A generator can also *receive*. `send(x)` passes a value in at the paused `yield`, turning the generator into a little machine that consumes a stream and keeps state between items, like a running-average box that you feed one price at a time." },
        { kind: 'code', code: `from collections.abc import Generator

def averager() -> Generator[float, float, None]:   # Generator[YieldType, SendType, ReturnType]
    total, count, average = 0.0, 0, 0.0
    while True:
        term = yield average          # hand out the average, wait to receive a term
        total += term; count += 1
        average = total / count

coro = averager()
next(coro)                            # "prime" it: run to the first yield → 0.0
coro.send(10), coro.send(30), coro.send(5)   # (10.0, 20.0, 15.0)
coro.close()` },
        { kind: 'p', text: 'Generator-based coroutines were how `asyncio` started. Since Python 3.5 native coroutines (`async def` / `await`, module 21) replaced them for concurrency. You\'ll still meet `send()` in older libraries and in streaming designs, but for new async code use `async def`.' },
        { kind: 'check', q: 'Why must you call `next(coro)` before the first `send(x)`?', options: ['To reset it', 'A just-created generator hasn\'t reached a yield, so there\'s nowhere to receive x', 'Python bug', 'To close it'], answer: 1, hint: 'Priming.', explain: '`coro.send(None)` works as priming too.' },
      ],
    },
  ],
  quiz: [
    { q: 'An iterator must implement…', options: ['__getitem__', '__next__ and __iter__', '__len__', '__contains__'], answer: 1, explain: '__iter__ returns self.' },
    { q: 'What signals the end of iteration?', options: ['Returning None', 'Raising StopIteration', 'Returning False', 'IndexError'], answer: 1, explain: 'for loops catch it.' },
    { q: 'Calling a generator function…', options: ['Runs it fully', 'Returns a generator object without running the body', 'Returns a list', 'Raises'], answer: 1, explain: 'Body runs on next().' },
    { q: 'itertools.groupby groups…', options: ['All equal keys', 'Consecutive equal keys', 'Sorted output', 'By hash'], answer: 1, explain: 'Sort first.' },
    { q: '`itertools.pairwise([1,2,3])` yields…', options: ['(1,2),(2,3)', '(1,2),(3,)', '[1,2,3]', '(1,3)'], answer: 0, explain: 'Overlapping pairs.' },
    { q: 'What does `yield from it` replace?', options: ['return it', 'for x in it: yield x (plus send/return plumbing)', 'list(it)', 'next(it)'], answer: 1, explain: 'Delegation.' },
    { q: 'Generator[Y, S, R]: S is…', options: ['Yield type', 'Send type', 'Return type', 'Size'], answer: 1, explain: 'What send() passes in.' },
    { q: 'For new concurrent code use…', options: ['Classic coroutines with send', 'async def / await', 'Threads only', 'yield from'], answer: 1, explain: 'Native coroutines.' },
  ],
}
