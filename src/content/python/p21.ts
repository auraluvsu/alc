import type { Module } from '../types'

export const p21: Module = {
  n: 21,
  title: 'Asynchronous Programming',
  tour: '21 · Asynchronous Programming',
  summary: 'Native coroutines with async/await, how the event loop schedules them, gathering and TaskGroups for structured concurrency, timeouts and semaphores, async context managers and iterators, and mixing in blocking code safely.',
  topics: ['async def & await', 'The event loop', 'TaskGroup & structured concurrency', 'Timeouts, semaphores & queues', 'Async context managers & iterators'],
  cpp23: [
    '`asyncio.TaskGroup` and `asyncio.timeout` (3.11).',
    '`asyncio.to_thread` (3.9) for blocking calls.',
    'asyncio introspection tools: `python -m asyncio ps` / `pstree` (3.14).',
  ],
  lessons: [
    {
      id: 'await',
      title: 'async def & await',
      blocks: [
        { kind: 'analogy', text: "A coroutine is a waiter who never stands idle at a table. When an order goes to the kitchen (`await` on I/O), the waiter goes to serve another table and comes back when the dish is ready. One waiter, many tables, no one waiting for the waiter to stop staring at the kitchen door." },
        { kind: 'code', code: `import asyncio

async def fetch_quote(sym: str) -> float:          # calling this returns a coroutine object
    await asyncio.sleep(0.5)                        # stand-in for network I/O
    return {"XAU": 2385.0, "XAG": 28.4}.get(sym, 0.0)

async def main():
    q = await fetch_quote("XAU")                    # sequential: 0.5s
    quotes = await asyncio.gather(                  # concurrent: ~0.5s total, not 1.0s
        fetch_quote("XAU"), fetch_quote("XAG"))
    return q, quotes

asyncio.run(main())        # (2385.0, [2385.0, 28.4]): one entry point starts the loop

fetch_quote("XAU")         # <coroutine object ...> plus "never awaited" warning: nothing ran` },
        { kind: 'compare',
          python: `async def f(): x = await g()
asyncio.run(main())`,
          ts: `async function f() { const x = await g() }   // the event loop is always running`,
          go: `go f()   // no colouring: any function can block; the runtime schedules goroutines`,
          java: `CompletableFuture.supplyAsync(...).thenApply(...)   // or virtual threads with plain blocking code`,
          cpp: `co_await g();   // C++20 coroutines; needs an executor library (asio, cppcoro)`,
          note: 'Python and TypeScript have "coloured" functions: async code must be awaited by async code.' },
        { kind: 'check', q: 'What does calling an `async def` function do?', options: ['Runs it immediately', 'Returns a coroutine object; nothing runs until it\'s awaited or scheduled', 'Starts a thread', 'Raises'], answer: 1, hint: 'Like a generator function.', explain: 'Await it, or wrap it in a task.' },
      ],
    },
    {
      id: 'loop',
      title: 'The event loop',
      blocks: [
        { kind: 'analogy', text: "The event loop is the restaurant's pass: a list of tables that are ready for attention. It picks the next ready coroutine, runs it until it hits an `await` on something not yet ready, parks it, and moves on. A coroutine that never awaits never lets go of the pass." },
        { kind: 'code', code: `async def ticker(name, n, delay):
    for i in range(n):
        print(name, i)
        await asyncio.sleep(delay)          # hand control back to the loop

async def main():
    t1 = asyncio.create_task(ticker("A", 3, 0.1))   # scheduled now, runs at the next await
    t2 = asyncio.create_task(ticker("B", 3, 0.15))
    await t1; await t2

asyncio.run(main())
# A 0, B 0, A 1, B 1, A 2, B 2   (interleaved by their sleeps)

# Blocking work must leave the loop:
async def load():
    df = await asyncio.to_thread(pd.read_parquet, "bars.parquet")   # runs in a thread
    return df` },
        { kind: 'pitfall', text: 'Keep a reference to tasks you create. The event loop only holds weak references, so a fire-and-forget `asyncio.create_task(job())` with no variable can be garbage-collected mid-flight. TaskGroups (next lesson) solve this.' },
        { kind: 'check', q: 'When does a task created with `create_task` first run?', options: ['Immediately, synchronously', 'When the current coroutine next yields control to the loop', 'Never, unless gathered', 'At asyncio.run exit'], answer: 1, hint: 'The pass only moves on at an await.', explain: 'Creating a task schedules it; the current code keeps running until it awaits.' },
      ],
    },
    {
      id: 'taskgroup',
      title: 'TaskGroup & structured concurrency',
      blocks: [
        { kind: 'analogy', text: "A TaskGroup is a school trip with a register. Every child (task) started inside the `async with` block is on the register, the coach doesn't leave until all are back, and if one child gets into trouble (raises), the teacher calls everyone else back (cancels them) and reports every problem together as an ExceptionGroup." },
        { kind: 'code', code: `async def main(symbols):
    async with asyncio.TaskGroup() as tg:
        tasks = {s: tg.create_task(fetch_quote(s)) for s in symbols}
    # here every task has finished (or all were cancelled after a failure)
    return {s: t.result() for s, t in tasks.items()}

try:
    asyncio.run(main(["XAU", "XAG"]))
except* ConnectionError as eg:                 # failures arrive as an ExceptionGroup
    for e in eg.exceptions: print("failed:", e)

# gather is still useful when you want partial results despite failures:
results = await asyncio.gather(*coros, return_exceptions=True)` },
        { kind: 'check', q: 'One task in a TaskGroup raises. What happens to the others?', options: ['They keep running', 'They are cancelled, and errors are raised together as an ExceptionGroup', 'They are restarted', 'Nothing is reported'], answer: 1, hint: 'The teacher calls everyone back.', explain: 'Use `gather(return_exceptions=True)` if you want the survivors\' results.' },
      ],
    },
    {
      id: 'limits',
      title: 'Timeouts, semaphores & queues',
      blocks: [
        { kind: 'analogy', text: "A timeout is a kitchen timer on a table: if the dish isn't ready, cancel it. A semaphore is a bouncer letting only N requests into the API at once. A queue is the ticket rail between the waiters taking orders (producers) and the chefs preparing them (consumers)." },
        { kind: 'code', code: `sem = asyncio.Semaphore(5)                 # at most 5 concurrent requests

async def polite_fetch(sym):
    async with sem:
        async with asyncio.timeout(2.0):   # 3.11+: raises TimeoutError after 2s
            return await fetch_quote(sym)

async def producer(q: asyncio.Queue, feed):
    async for msg in feed:                 # e.g. websocket messages
        await q.put(msg)

async def consumer(q: asyncio.Queue):
    while True:
        msg = await q.get()
        handle(msg)
        q.task_done()

async def main(feed):
    q = asyncio.Queue(maxsize=10_000)      # bounded: back-pressure on the producer
    async with asyncio.TaskGroup() as tg:
        tg.create_task(producer(q, feed))
        for _ in range(4):
            tg.create_task(consumer(q))` },
        { kind: 'check', q: 'Why give the queue a `maxsize`?', options: ['Speed', 'Back-pressure: a fast producer waits instead of filling memory', 'Required', 'For ordering'], answer: 1, hint: 'What if consumers fall behind?', explain: '`put` awaits when the queue is full.' },
      ],
    },
    {
      id: 'asyncwith',
      title: 'Async context managers & iterators',
      blocks: [
        { kind: 'analogy', text: "Some check-ins and check-outs involve waiting themselves (opening a network connection, flushing to a database), so they get async versions: `async with` calls `__aenter__`/`__aexit__`, and `async for` pulls items that may need to be awaited, like messages arriving on a socket." },
        { kind: 'code', code: `from contextlib import asynccontextmanager

@asynccontextmanager
async def connection(url):
    conn = await open_connection(url)
    try:
        yield conn
    finally:
        await conn.close()

async def ticks(conn):                 # async generator
    while (msg := await conn.recv()) is not None:
        yield parse(msg)

async def main():
    async with connection("wss://feed.example/xau") as conn:
        async for tick in ticks(conn):
            if tick.px > 2400: break

# async comprehensions too:
prices = [t.px async for t in ticks(conn) if t.qty > 1]` },
        { kind: 'p', text: 'Production async stacks: `aiohttp` or `httpx` for HTTP, `websockets` for streaming feeds, `asyncpg` for PostgreSQL, and FastAPI on top of it all for services. Debug with `python -m asyncio ps <pid>` (3.14+), which lists every live task in a running process.' },
        { kind: 'check', q: '`async for` calls which method to get the next item?', options: ['__next__', '__anext__', '__await__', '__aiter__ only'], answer: 1, hint: 'a for async.', explain: '`__aiter__` returns the async iterator.' },
      ],
    },
  ],
  quiz: [
    { q: 'What runs the event loop from synchronous code?', options: ['asyncio.start()', 'asyncio.run(main())', 'await main()', 'loop.go()'], answer: 1, explain: 'One entry point per program.' },
    { q: 'asyncio.gather(a(), b())…', options: ['Runs them sequentially', 'Runs them concurrently and returns results in argument order', 'Runs in threads', 'Returns the first'], answer: 1, explain: 'Like Promise.all.' },
    { q: 'How do you call blocking code from a coroutine?', options: ['Just call it', 'await asyncio.to_thread(func, ...)', 'yield from', 'time.sleep(0)'], answer: 1, explain: 'Keeps the loop responsive.' },
    { q: 'Why keep references to created tasks?', options: ['Style', 'The loop holds weak references; unreferenced tasks may be garbage-collected', 'Speed', 'Typing'], answer: 1, explain: 'TaskGroup keeps them for you.' },
    { q: 'A failing task in a TaskGroup causes…', options: ['Silent loss', 'Cancellation of siblings and an ExceptionGroup', 'A restart', 'A warning only'], answer: 1, explain: 'Structured concurrency.' },
    { q: 'Which limits concurrent requests?', options: ['asyncio.Lock', 'asyncio.Semaphore', 'asyncio.Event', 'asyncio.sleep'], answer: 1, explain: 'N permits.' },
    { q: 'asyncio.timeout (3.11) raises…', options: ['CancelledError to the caller', 'TimeoutError', 'ValueError', 'Nothing'], answer: 1, explain: 'Inner work is cancelled.' },
    { q: 'Which decorator builds an async context manager from a generator?', options: ['@contextmanager', '@asynccontextmanager', '@async_with', '@coroutine'], answer: 1, explain: 'From contextlib.' },
  ],
}
