import type { Module } from '../types'

export const p19: Module = {
  n: 19,
  title: 'Concurrency Models in Python',
  tour: '19 · Concurrency Models in Python',
  summary: 'Concurrency vs parallelism; threads, processes and coroutines compared on the same spinner program; what the GIL really prevents; the free-threaded build; subinterpreters; and how to pick a model for I/O-bound vs CPU-bound work.',
  topics: ['Concurrency vs parallelism', 'Threads, processes & coroutines', 'The GIL', 'Free-threaded Python', 'Choosing a model'],
  cpp23: [
    'Free-threaded (no-GIL) build officially supported (3.14, PEP 779), installed as `python3.14t` / `python3.15t`.',
    'Multiple interpreters in one process: `concurrent.interpreters` (3.14, PEP 734).',
  ],
  lessons: [
    {
      id: 'concepts',
      title: 'Concurrency vs parallelism',
      blocks: [
        { kind: 'analogy', text: "Concurrency is one chef juggling several dishes: while the pasta boils, they chop the salad. Parallelism is several chefs each cooking at the same time. Concurrency is about *dealing* with many things at once (structure); parallelism is about *doing* many things at once (execution). Waiting-heavy work (network, disk) needs concurrency; number-crunching needs parallelism." },
        { kind: 'list', items: [
          '**I/O-bound**: most time is spent waiting (HTTP requests, database queries, market-data sockets). One thread or event loop can juggle thousands of waits.',
          '**CPU-bound**: most time is spent computing (backtests, Monte Carlo, feature engineering). Only extra cores help.',
          'Python offers three units of execution: **processes** (separate memory, true parallelism), **threads** (shared memory), and **coroutines** (cooperative tasks on one thread, driven by an event loop).',
        ] },
        { kind: 'compare',
          python: `threading.Thread / multiprocessing.Process / asyncio tasks`,
          ts: `Node: one event loop (async/await) + worker_threads for CPU work`,
          go: `goroutines: cheap threads multiplexed onto all cores by the runtime`,
          java: `platform threads + virtual threads (Java 21) on all cores`,
          cpp: `std::thread / std::jthread on all cores; coroutines (C++20) need a library executor`,
          note: 'Python\'s asyncio is closest to Node; free-threaded Python moves threads closer to Java and C++.' },
        { kind: 'check', q: 'Downloading 500 price files is mostly…', options: ['CPU-bound', 'I/O-bound', 'Memory-bound', 'GPU-bound'], answer: 1, hint: 'Where is the time spent?', explain: 'Threads or asyncio can overlap the waiting.' },
      ],
    },
    {
      id: 'spinners',
      title: 'Threads, processes & coroutines',
      blocks: [
        { kind: 'analogy', text: "Ramalho's spinner program shows an animated spinner while a slow function runs. Written three ways, it shows the personalities: a thread needs an `Event` to be told to stop; a process needs the same but can't share variables; a coroutine stops when its task is cancelled, at the next `await`." },
        { kind: 'code', code: `import itertools, time, threading, asyncio

def spin(msg: str, done: threading.Event) -> None:
    for char in itertools.cycle(r"\\|/-"):
        print(f"\\r{char} {msg}", end="", flush=True)
        if done.wait(0.1):                    # sleep 0.1s, or wake early if set
            break
    print("\\r" + " " * (len(msg) + 2) + "\\r", end="")

def slow() -> int:
    time.sleep(3)                             # blocking: releases the GIL while sleeping
    return 42

def supervisor() -> int:
    done = threading.Event()
    spinner = threading.Thread(target=spin, args=("thinking!", done))
    spinner.start()
    result = slow()
    done.set(); spinner.join()
    return result

# asyncio version: the slow part MUST await, never block
async def aspin(msg: str) -> None:
    for char in itertools.cycle(r"\\|/-"):
        print(f"\\r{char} {msg}", end="", flush=True)
        try:
            await asyncio.sleep(0.1)
        except asyncio.CancelledError:
            break

async def asupervisor() -> int:
    spinner = asyncio.create_task(aspin("thinking!"))
    await asyncio.sleep(3)                    # time.sleep(3) here would freeze the spinner
    spinner.cancel()
    return 42` },
        { kind: 'pitfall', text: 'Calling a blocking function (`time.sleep`, `requests.get`, a heavy pandas job) inside a coroutine freezes the whole event loop: every other task stops. Use async libraries, or hand blocking work to a thread with `await asyncio.to_thread(func)`.' },
        { kind: 'check', q: 'In the asyncio version, what happens if you replace `await asyncio.sleep(3)` with `time.sleep(3)`?', options: ['Nothing changes', 'The spinner freezes because the event loop is blocked', 'It runs faster', 'SyntaxError'], answer: 1, hint: 'One chef, and they\'ve stopped juggling.', explain: 'Only `await` hands control back to the loop.' },
      ],
    },
    {
      id: 'gil',
      title: 'The GIL',
      blocks: [
        { kind: 'analogy', text: "In standard CPython, the Global Interpreter Lock is a single talking stick: only the thread holding it may run Python bytecode. Threads pass it around constantly, and anyone waiting on I/O puts it down, so I/O-bound threads overlap nicely. But two threads crunching numbers in pure Python just take turns, so you get no speed-up." },
        { kind: 'code', code: `import time
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

def busy(n: int) -> int:                 # pure-Python CPU work
    return sum(i * i for i in range(n))

if __name__ == "__main__":                # required for process pools on macOS/Windows
    for Pool in (ThreadPoolExecutor, ProcessPoolExecutor):
        t0 = time.perf_counter()
        with Pool(max_workers=4) as ex:
            list(ex.map(busy, [5_000_000] * 4))
        print(Pool.__name__, round(time.perf_counter() - t0, 2))
# Standard (GIL) build on 4 cores, roughly:
# ThreadPoolExecutor   ~ same as running serially
# ProcessPoolExecutor  ~ 3–4× faster` },
        { kind: 'list', items: [
          'The GIL is released during blocking I/O and by many C extensions while they compute: NumPy, pandas, PyTorch and hashlib all release it for big operations. Threads can speed those up even on the standard build.',
          'The GIL makes individual bytecodes atomic, not your code. `counter += 1` from several threads still races. Use a `Lock`.',
        ] },
        { kind: 'check', q: 'Why don\'t threads speed up pure-Python number crunching on the standard build?', options: ['Threads are slow to start', 'Only one thread can execute Python bytecode at a time (the GIL)', 'Python has no threads', 'The OS limits it'], answer: 1, hint: 'Talking stick.', explain: 'Use processes, a free-threaded build, or move the hot loop into NumPy/C++.' },
      ],
    },
    {
      id: 'freethreaded',
      title: 'Free-threaded Python & subinterpreters',
      blocks: [
        { kind: 'analogy', text: "The free-threaded build removes the talking stick: every thread can run Python at once, on its own core, like Java or Go. The price is a little single-thread speed and the need for C extensions to be rebuilt as thread-safe. Subinterpreters are a middle path: several isolated Pythons in one process, each with its own GIL, sharing nothing by default." },
        { kind: 'code', code: `import sys, sysconfig
sysconfig.get_config_var("Py_GIL_DISABLED")   # 1 on a free-threaded build (python3.15t)
sys._is_gil_enabled()                          # False when running free-threaded

# Same ThreadPoolExecutor code as before, run with python3.15t:
# ThreadPoolExecutor  ~ 3–4× faster on 4 cores: real parallel threads

from concurrent import interpreters            # 3.14+
interp = interpreters.create()
interp.exec("x = sum(range(10))")              # runs in an isolated interpreter

from concurrent.futures import InterpreterPoolExecutor   # 3.14+
with InterpreterPoolExecutor() as ex:
    list(ex.map(busy, [5_000_000] * 4))        # parallel, without separate processes` },
        { kind: 'new23', text: 'Free-threading went from experimental (3.13) to officially supported (3.14, PEP 779). Most major packages, NumPy and pandas among them, now ship free-threaded wheels, but check every C extension you depend on before switching a production system.' },
        { kind: 'check', q: 'What does the free-threaded build change?', options: ['Removes threads', 'Lets multiple threads run Python bytecode in parallel', 'Makes asyncio multithreaded', 'Removes processes'], answer: 1, hint: 'No talking stick.', explain: 'Data races in your code become real races, so locks matter more.' },
      ],
    },
    {
      id: 'choose',
      title: 'Choosing a model',
      blocks: [
        { kind: 'analogy', text: "Pick the tool by what you're waiting on. Thousands of sockets: one very good juggler (asyncio). A few blocking libraries: some assistants (threads). Heavy maths: more kitchens (processes), or a better oven (vectorise with NumPy, or move the hot loop to C++)." },
        { kind: 'list', items: [
          '**Many concurrent network connections** (websockets, market data, APIs) → `asyncio`.',
          '**Blocking I/O with libraries that aren\'t async** (requests, DB drivers, file reads) → `ThreadPoolExecutor`.',
          '**CPU-bound pure Python** → `ProcessPoolExecutor` (or free-threaded threads, or `InterpreterPoolExecutor`).',
          '**CPU-bound numerical work** → vectorise first (NumPy/pandas/PyTorch release the GIL); parallelise second.',
          '**Latency-critical paths** (order routing, feed handlers) → usually C++ or Rust, with Python for research and orchestration.',
        ] },
        { kind: 'check', q: 'A strategy subscribes to 40 websocket feeds and does light processing per message. Best fit?', options: ['ProcessPoolExecutor', 'asyncio', 'One thread per feed with no event loop', 'Free-threaded build required'], answer: 1, hint: 'Mostly waiting on sockets.', explain: 'One event loop handles many sockets efficiently.' },
      ],
    },
  ],
  quiz: [
    { q: 'Concurrency is about…', options: ['Running on many cores', 'Structuring a program to deal with many tasks at once', 'GPUs', 'Speed only'], answer: 1, explain: 'Parallelism is executing simultaneously.' },
    { q: 'What does the GIL prevent on the standard build?', options: ['Threads existing', 'More than one thread executing Python bytecode at once', 'Processes', 'async'], answer: 1, explain: 'I/O and many C extensions release it.' },
    { q: 'Is `counter += 1` thread-safe because of the GIL?', options: ['Yes', 'No: it is several bytecodes and can race', 'Only on Linux', 'Only for ints'], answer: 1, explain: 'Use a Lock.' },
    { q: 'Best tool for CPU-bound pure Python on the standard build?', options: ['ThreadPoolExecutor', 'ProcessPoolExecutor', 'asyncio', 'time.sleep'], answer: 1, explain: 'Separate processes, separate GILs.' },
    { q: 'What happens to an event loop when a coroutine calls time.sleep(5)?', options: ['Other tasks keep running', 'Everything blocks for 5 seconds', 'It is converted to asyncio.sleep', 'Error'], answer: 1, explain: 'Use `await asyncio.sleep` or `asyncio.to_thread`.' },
    { q: 'How do you stop a coroutine spinner?', options: ['Event.set', 'task.cancel()', 'kill', 'del'], answer: 1, explain: 'It raises CancelledError at the next await.' },
    { q: 'Free-threaded CPython became officially supported in…', options: ['3.12', '3.14', '3.10', 'Never'], answer: 1, explain: 'PEP 779.' },
    { q: 'What do subinterpreters provide?', options: ['GPU access', 'Isolated interpreters in one process, each with its own GIL', 'Shared global state', 'Faster imports'], answer: 1, explain: '`concurrent.interpreters` (3.14).' },
  ],
}
