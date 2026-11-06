import type { Module } from '../types'

export const j14: Module = {
  n: 14,
  title: 'Modern Concurrency',
  tour: 'Added · Virtual threads & beyond',
  summary: 'Virtual threads and how they work, writing simple blocking code at huge scale, scoped values, structured concurrency, and how to pick between all the concurrency tools.',
  topics: ['Virtual threads', 'How they work', 'Scoped values', 'Structured concurrency', 'Choosing a tool'],
  cpp23: [
    'Virtual threads no longer pin to a carrier when blocking inside `synchronized` (Java 24).',
    'Scoped values are final (Java 25).',
    'Structured concurrency is in its seventh preview (Java 27), so the API may still change.',
    'Lazy constants (formerly stable values) are in their third preview (Java 27).',
  ],
  lessons: [
    {
      id: 'virtual',
      title: 'Virtual threads',
      blocks: [
        { kind: 'analogy', text: "A platform thread is a full-time employee with a desk: expensive, so you hire a few and make them share. A virtual thread is a task card on a board. A few workers (carrier threads) take cards, and when a card says \"waiting for a reply\", the worker pins it back on the board and takes another. A million cards cost little, because waiting no longer takes up a person." },
        { kind: 'code', code: `// One new virtual thread per task. Don't pool them: they are cheap and disposable.
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<String>> pages = new ArrayList<>();
    for (int i = 0; i < 10_000; i++) {
        int id = i;
        pages.add(ex.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1));   // simulated blocking I/O
            return "page " + id;
        }));
    }
    for (var p : pages) p.get();
}   // about 1 second in total, not 10,000

Thread t = Thread.startVirtualThread(() -> System.out.println("hi"));
Thread named = Thread.ofVirtual().name("worker-", 0).start(() -> { });
t.join();
System.out.println(named.isVirtual());            // true` },
        { kind: 'list', items: [
          'A virtual thread is a real `java.lang.Thread`, and works with existing APIs, debuggers and profilers.',
          'Stacks start small and grow on the heap. You can run millions in a single JVM.',
          'They help with **waiting**, not with computation: no CPU-bound work gets faster, as the carrier count is near the number of cores.',
          'Plain blocking code scales: `client.send(...)`, `Thread.sleep`, reading a socket and so on. You don\'t need callback chains.',
          'Never pool virtual threads. A pool exists to reuse something expensive, and these aren\'t. To limit concurrency, use a `Semaphore`.',
        ] },
        { kind: 'code', code: `// Limit access to a scarce resource with a Semaphore, not a small pool
private static final Semaphore DB = new Semaphore(20);

static String query(String sql) throws InterruptedException {
    DB.acquire();
    try {
        return run(sql);
    } finally {
        DB.release();
    }
}` },
        { kind: 'compare',
          python: `async def fetch(url):       # function coloring: async spreads through callers
    async with client.get(url) as r:
        return await r.text()`,
          cpp: `// Coroutines need co_await at each suspension point, plus a runtime.
task<std::string> fetch(std::string url) {
    co_return co_await client.get(url);
}`,
          go: `// Goroutines: the same design, and Go has had it since day one.
go func() { results <- fetch(url) }()`,
          ts: `// async/await: suspension is explicit, and the event loop is single-threaded.
const text = await (await fetch(url)).text()`,
          java: `// No new syntax: ordinary blocking code on a cheap thread.
Thread.startVirtualThread(() -> results.add(fetch(url)));`,
          note: 'If you know goroutines, you already understand these. There are no colored functions: any method may block.' },
        { kind: 'check', q: 'Which workload benefits most from virtual threads?', options: ['Calculating primes on all cores', 'A server handling thousands of requests that mostly wait on I/O', 'A tight numerical loop', 'Sorting an array'], answer: 1, hint: 'What is it that they make cheap?', explain: 'They make waiting cheap. CPU-bound work is still limited by the number of cores.' },
      ],
    },
    {
      id: 'how',
      title: 'How virtual threads work',
      blocks: [
        { kind: 'analogy', text: "When a virtual thread blocks, the JVM copies its stack frames to the heap, like a clerk filing an open case in a folder, and the carrier picks up the next folder. When the reply arrives, any free clerk can pull the folder out and continue from the exact line. Your code never knows it was put away." },
        { kind: 'list', items: [
          'Virtual threads are scheduled by the JVM on a small `ForkJoinPool` of **carrier** threads.',
          'Blocking calls in the JDK (sockets, locks, queues, `sleep`) were rewritten to **unmount** the virtual thread instead of blocking the carrier.',
          'The stack is held in growable chunks on the heap, so it costs only what it actually uses.',
          'A thread becomes **pinned** to its carrier when it blocks in a way the JVM can\'t unmount, most often inside native code.',
          'Scheduling is not time-sliced: a virtual thread running a long loop without blocking keeps its carrier until it blocks or finishes.',
        ] },
        { kind: 'new23', text: "In Java 21, blocking inside a `synchronized` block pinned the carrier, so many libraries switched to `ReentrantLock`. **Java 24** removed that limitation. You can now use `synchronized` with virtual threads without that penalty, and `-Djdk.tracePinnedThreads` was removed: use the JFR event `jdk.VirtualThreadPinned` to find the rare remaining cases." },
        { kind: 'code', code: `// Run CPU-heavy work on a platform pool, not on carriers
try (var cpu = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());
     var io = Executors.newVirtualThreadPerTaskExecutor()) {

    Future<Integer> result = io.submit(() -> {
        String body = download();                    // blocking I/O on a virtual thread
        return cpu.submit(() -> parse(body)).get();  // heavy parsing on the CPU pool
    });
}

// A ThreadLocal per virtual thread can multiply: a million threads, a million copies.
// Before: a single expensive per-thread cache was reused across a pooled thread's tasks.
private static final ThreadLocal<java.text.SimpleDateFormat> FMT =
    ThreadLocal.withInitial(() -> new java.text.SimpleDateFormat("yyyy-MM-dd"));
// Better: use an immutable, thread-safe object.
private static final java.time.format.DateTimeFormatter ISO =
    java.time.format.DateTimeFormatter.ISO_LOCAL_DATE;` },
        { kind: 'pitfall', text: 'When moving to virtual threads, thread-pool sizes used to throttle your load on other services. A pool of 50 threads limited a database to 50 calls. With virtual threads there is no such natural limit, so you might suddenly overwhelm the database. Add an explicit `Semaphore` or connection pool limit.' },
        { kind: 'check', q: 'A virtual thread runs a long, tight loop with no blocking. What happens to its carrier?', options: ['It is released every few milliseconds', 'It stays occupied until the thread blocks or ends', 'A new carrier replaces it', 'The JVM throws'], answer: 1, hint: 'When do virtual threads give up their carrier?', explain: 'Unmounting happens at blocking operations. There is no time-slicing, which is why CPU-bound tasks belong on a platform pool.' },
      ],
    },
    {
      id: 'scoped',
      title: 'Scoped values',
      blocks: [
        { kind: 'analogy', text: "A `ThreadLocal` is a whiteboard in a worker's office: anybody can rewrite it at any time, and someone has to remember to wipe it. A scoped value is a visitor badge valid for one trip: it's handed over on the way in, it can't be altered, and it's automatically gone when you leave. The subtasks you bring with you get to see the same badge." },
        { kind: 'new23', text: "Scoped values became final in **Java 25**. They suit one-way, read-only context such as the current user or request ID, and they're much cheaper than `ThreadLocal` when you have huge numbers of threads." },
        { kind: 'code', code: `private static final ScopedValue<String> USER = ScopedValue.newInstance();

void handle(String user) {
    ScopedValue.where(USER, user).run(() -> {       // bound only for this call
        audit("handling");
        serve();
    });
    // USER isn't bound here any more
}

void audit(String msg) {
    System.out.println(USER.get() + ": " + msg);    // no parameter threaded through
}

void serve() {
    ScopedValue.where(USER, "system").run(() -> audit("nested"));   // rebinding for a sub-call
    audit("after");                                 // back to the original value
}

// Returning a value and allowing checked exceptions: call, with a CallableOp
String result = ScopedValue.where(USER, "nas").call(() -> USER.get().toUpperCase());

boolean bound = USER.isBound();
String orDefault = USER.orElse("anonymous");` },
        { kind: 'list', items: [
          'Values are **immutable** within a scope. To use a new value for a nested call, rebind it.',
          'The binding ends automatically on exit, even with an exception. There is no `remove` to forget.',
          'Child threads in a `StructuredTaskScope` inherit the bindings at low cost.',
          'Use `ThreadLocal` when you need something mutable for each thread, or a per-thread cache on a pooled thread.',
        ] },
        { kind: 'compare',
          python: `from contextvars import ContextVar

USER = ContextVar("user")
token = USER.set("nas")
try:
    audit()
finally:
    USER.reset(token)`,
          cpp: `thread_local std::string user;  // no scoping, no inheritance`,
          go: `// An explicit parameter, by convention the first one
ctx := context.WithValue(ctx, userKey, "nas")
audit(ctx)`,
          ts: `const store = new AsyncLocalStorage<string>()
store.run("nas", () => audit())`,
          java: `ScopedValue.where(USER, "nas").run(() -> audit());`,
          note: 'Node\'s `AsyncLocalStorage` is the closest match. Go prefers to pass a `context.Context` explicitly.' },
        { kind: 'check', q: 'How do you remove a scoped value when finished?', options: ['Call `USER.remove()`', 'Nothing: the binding ends when the `run` block ends', 'Set it to `null`', 'Wait for garbage collection'], answer: 1, hint: 'What are the bounds of a binding?', explain: 'The binding exists only for the dynamic scope of `run` or `call`, so nothing can leak.' },
      ],
    },
    {
      id: 'structured',
      title: 'Structured concurrency',
      blocks: [
        { kind: 'analogy', text: "Unstructured concurrency is sending out errand runners with no list: if one fails, the others keep running, and nobody's sure when it's safe to leave. Structured concurrency treats them like one team on one job: they leave together, and return together. If one calls in with a failure, the others are told to stop, and the block doesn't finish until everyone's back." },
        { kind: 'pitfall', text: 'This API is a **preview** in Java 27 (seventh preview), and its shape has changed between releases. It needs `--enable-preview`, so don\'t build a production system on the exact method names. The idea, however, is here to stay.' },
        { kind: 'code', code: `import java.util.concurrent.StructuredTaskScope;
import java.util.concurrent.StructuredTaskScope.Subtask;

record Quote(double px, int qty) {}

// javac --enable-preview --release 27 Prices.java
Quote load(String sym) throws InterruptedException, ExecutionException {
    try (var scope = StructuredTaskScope.open()) {         // all must succeed
        Subtask<Double> px = scope.fork(() -> fetchPx(sym));
        Subtask<Integer> qty = scope.fork(() -> fetchQty(sym));

        scope.join();                                      // ExecutionException if one failed

        return new Quote(px.get(), qty.get());             // both are done
    }   // no thread outlives this block
}

// Race: the first success wins, and the others are cancelled
double fastest(String sym) throws InterruptedException, ExecutionException {
    try (var scope = StructuredTaskScope.open(
            StructuredTaskScope.Joiner.<Double>anySuccessfulOrThrow())) {
        scope.fork(() -> fromPrimary(sym));
        scope.fork(() -> fromBackup(sym));
        return scope.join();
    }
}` },
        { kind: 'list', items: [
          'A concurrent subtask\'s lifetime is confined to a block, as local variables are confined to a scope.',
          'When one subtask fails, the scope cancels the others automatically, so you don\'t waste work or leak threads.',
          'If the parent is interrupted, cancellation flows to all its subtasks.',
          'Thread dumps show the parent and child relationship, so concurrent programs are easier to diagnose.',
          'Scoped values bound before `open` are visible in all forked subtasks.',
        ] },
        { kind: 'compare',
          python: `async with asyncio.TaskGroup() as tg:
    px = tg.create_task(fetch_px(sym))
    qty = tg.create_task(fetch_qty(sym))
# both are done here; one failure cancels the other`,
          cpp: `// No standard equivalent. std::jthread joins on destruction,
// but offers no group cancellation or error propagation.`,
          go: `g, ctx := errgroup.WithContext(ctx)
g.Go(func() error { return fetchPx(ctx, sym) })
g.Go(func() error { return fetchQty(ctx, sym) })
err := g.Wait()`,
          ts: `// Promise.all rejects early but doesn't cancel the others.
const [px, qty] = await Promise.all([fetchPx(sym), fetchQty(sym)])`,
          java: `try (var scope = StructuredTaskScope.open()) {
    var px = scope.fork(() -> fetchPx(sym));
    var qty = scope.fork(() -> fetchQty(sym));
    scope.join();
    return new Quote(px.get(), qty.get());
}`,
          note: 'Python\'s `TaskGroup` and Go\'s `errgroup` are the closest cousins.' },
        { kind: 'check', q: 'In a default `StructuredTaskScope`, one of two subtasks fails. What happens to the other?', options: ['It keeps running in the background', 'It is cancelled, and `join` reports the failure', 'The JVM exits', 'It is restarted'], answer: 1, hint: 'The team goes home together.', explain: 'By default the scope needs all to succeed. A failure cancels the remaining subtasks, and `join` throws.' },
      ],
    },
    {
      id: 'choosing',
      title: 'Choosing a tool',
      blocks: [
        { kind: 'analogy', text: "Java has accumulated three decades of concurrency tools, like a garage with a saw for every era. You don't need all of them. Most jobs need one of a handful, and the older ones still have a use, even if you don't reach for them first." },
        { kind: 'list', items: [
          '**Lots of tasks that mostly wait on I/O:** virtual threads, using `newVirtualThreadPerTaskExecutor`, and plain blocking code.',
          '**CPU-bound parallel work:** a fixed pool sized to your cores, or a parallel stream over a large array.',
          '**A few subtasks of one request:** structured concurrency once it is final. Today, `invokeAll` or `CompletableFuture`.',
          '**Reactive, non-blocking composition or callbacks required by a library:** `CompletableFuture`.',
          '**Hand-off between producers and consumers:** a `BlockingQueue`.',
          '**A shared counter:** `AtomicLong` or `LongAdder`.',
          '**A shared map:** `ConcurrentHashMap`, with `merge` or `compute`.',
          '**Protecting several fields together:** `synchronized` or `ReentrantLock`.',
          '**Limiting concurrent access to a resource:** a `Semaphore`.',
          '**Passing read-only context down a call tree:** `ScopedValue`.',
          '**One-time lazy initialisation of a constant:** a holder class today, and lazy constants when final.',
        ] },
        { kind: 'code', code: `// Lazy init that's thread-safe with no locks in your code: the holder idiom.
// The JVM initialises a class exactly once, and only when it's first used.
final class Config {
    private static final class Holder {
        static final Config INSTANCE = new Config();
    }
    static Config get() { return Holder.INSTANCE; }
    private Config() { }
}` },
        { kind: 'new23', text: "**Lazy constants** are in their third preview in **Java 27**: a value computed once on first use, and then treated like a true constant by the JIT. They were first previewed in Java 25 as stable values, and renamed in Java 26. Since it's a preview, check the current API before you use it." },
        { kind: 'p', text: 'The most useful concurrency habit remains the simplest: reduce what is shared and mutable. A pipeline of immutable records passed through queues rarely needs a lock at all. When a program has no shared mutable state, entire categories of bugs cannot happen.' },
        { kind: 'pitfall', text: 'Concurrency bugs often don\'t show up in tests, and they vary with timing. Reasoning and simple designs are your main defence. To test, use tools such as `jcstress`, repeat stress tests with many threads, and use Java Flight Recorder in production.' },
        { kind: 'check', q: 'A web handler makes three blocking HTTP calls and combines the results. What is the simplest modern design?', options: ['A thread pool of 10,000 platform threads', 'Run each on a virtual thread, and wait for all three', 'A busy-wait loop', 'A parallel stream on the common pool'], answer: 1, hint: 'These tasks mostly wait.', explain: 'Virtual threads are made for this. A parallel stream would tie up the shared CPU pool with blocking calls.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is a virtual thread?', options: ['A process', 'A lightweight `Thread` scheduled by the JVM on carrier threads', 'A green-screen thread with no stack', 'A coroutine requiring `await`'], answer: 1, explain: 'It is an ordinary `java.lang.Thread`, cheap enough to create one per task.' },
    { q: 'Should you pool virtual threads?', options: ['Yes, always', 'No: create one per task', 'Only for I/O', 'Only over 1000'], answer: 1, explain: 'Pools exist to share expensive resources. To limit concurrency, use a `Semaphore`.' },
    { q: 'What do virtual threads not speed up?', options: ['Handling many blocking calls', 'CPU-bound computation', 'Server throughput on I/O workloads', 'Readable blocking code'], answer: 1, explain: 'The number of carriers tracks the number of cores, so computation doesn\'t gain.' },
    { q: 'What changed about `synchronized` and virtual threads in Java 24?', options: ['`synchronized` was removed', 'Blocking inside it no longer pins the carrier', 'It became faster than atomics', 'It now requires `--enable-preview`'], answer: 1, explain: 'JEP 491 removed this limitation from Java 21.' },
    { q: 'What makes a `ScopedValue` different from `ThreadLocal`?', options: ['It is mutable', 'It is immutable and bound only for a defined dynamic scope', 'It is global', 'It is slower'], answer: 1, explain: 'No `set`, no `remove`, and so no leaks.' },
    { q: 'What guarantee does a structured scope give at the end of its block?', options: ['All subtasks succeeded', 'No subtask is still running', 'Results are sorted', 'Results are cached'], answer: 1, explain: 'Subtasks can\'t outlive the block, whether they succeeded or failed.' },
    { q: 'What is the status of structured concurrency in Java 27?', options: ['Final', 'Preview', 'Removed', 'Incubator only'], answer: 1, explain: 'It is in its seventh preview under JEP 533, so use `--enable-preview`.' },
    { q: 'Which danger appears when moving a service from a small thread pool to virtual threads?', options: ['Less throughput', 'Downstream systems can be overwhelmed, as the pool no longer throttles load', 'No more exceptions', 'Slower startup'], answer: 1, explain: 'Put explicit limits on scarce resources, such as with a `Semaphore`.' },
  ],
}
