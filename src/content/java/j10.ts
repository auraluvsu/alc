import type { Module } from '../types'

export const j10: Module = {
  n: 10,
  title: 'Concurrent Programming',
  tour: '10 · Concurrent Programming',
  summary: 'Tasks and executors, why shared state goes wrong, threadsafe collections, CompletableFuture, atomics, locks and conditions, threads, and running other processes.',
  topics: ['Tasks & executors', 'Thread safety', 'Threadsafe data structures', 'Asynchronous computations', 'Atomics, locks & conditions', 'Threads & processes'],
  cpp23: [
    'Blocking inside `synchronized` no longer pins a virtual thread to its carrier (Java 24).',
    'Module 14 covers virtual threads in depth, plus scoped values (final in Java 25) and structured concurrency (preview in Java 27).',
  ],
  lessons: [
    {
      id: 'tasks',
      title: 'Tasks & executors',
      blocks: [
        { kind: 'analogy', text: "Don't hire a new employee for every parcel. An executor is a dispatch office: you drop off jobs (tasks) and get a receipt (a `Future`) for each, and the office decides who does what. Separating **what** to do from **who** does it means you can change the staffing without touching the jobs." },
        { kind: 'code', code: `Runnable log = () -> System.out.println("no result");
Callable<Integer> count = () -> 42;              // returns a result, may throw

try (ExecutorService pool = Executors.newFixedThreadPool(4)) {  // AutoCloseable (Java 19+)
    pool.execute(log);                           // fire and forget

    Future<Integer> f = pool.submit(count);      // a receipt
    int n = f.get();                             // blocks until the result is ready
    int m = f.get(1, TimeUnit.SECONDS) + n;      // gives up with a TimeoutException

    List<Callable<Integer>> jobs = List.of(() -> 1, () -> 2, () -> 3);
    for (Future<Integer> r : pool.invokeAll(jobs)) {   // waits for all
        System.out.println(r.get());
    }
}   // close() waits for submitted tasks to finish, then shuts the pool down` },
        { kind: 'list', items: [
          '`newFixedThreadPool(n)`: for CPU work, size it near the CPU count, from `availableProcessors()` on `Runtime.getRuntime()`.',
          '`newVirtualThreadPerTaskExecutor()`: for many blocking tasks (module 14).',
          '`newScheduledThreadPool(n)`: for delayed and periodic work.',
          'An exception inside a task is stored in its `Future`. `get` rethrows it wrapped in `ExecutionException`.',
          'Cancellation is cooperative. `future.cancel(true)` sets the thread\'s interrupt flag, and the task must check it, or be in a blocking call that responds.',
        ] },
        { kind: 'pitfall', text: 'A task submitted with `execute` that throws dies quietly as far as your code is concerned, and with `submit`, the exception sits in the `Future` until somebody calls `get`. If nobody ever does, you never find out about the failure.' },
        { kind: 'check', q: 'How do you get the exception thrown inside a task submitted with `submit`?', options: ['It crashes the program', '`future.get()` throws an `ExecutionException` wrapping it', 'A global handler gets it', 'It is lost by design'], answer: 1, hint: 'Who holds the outcome of the task?', explain: 'The `Future` holds either the result or the exception. `getCause()` on the `ExecutionException` gives you the original.' },
      ],
    },
    {
      id: 'safety',
      title: 'Thread safety',
      blocks: [
        { kind: 'analogy', text: "`count++` looks like one step but is three: read the whiteboard, add one, write back. If two people do it at once, both read 5, both write 6, and an update has vanished. That's a **race condition**. A second problem is visibility: one colleague writes on their private notepad, and the other keeps looking at the whiteboard and never sees it." },
        { kind: 'code', code: `class Counter {
    private int n;
    void increment() { n++; }                // read, add, write: three steps
    int get() { return n; }
}
// Two threads doing 100,000 increments each can easily total less than 200,000.

// 1. Lock it: only one thread at a time
class SyncCounter {
    private int n;
    synchronized void increment() { n++; }   // locks on this object
    synchronized int get() { return n; }     // reads need it too
}

// 2. An atomic variable (a lock-free compare-and-swap)
class AtomicCounter {
    private final AtomicInteger n = new AtomicInteger();
    void increment() { n.incrementAndGet(); }
    int get() { return n.get(); }
}

// 3. Don't share anything mutable at all
record Snapshot(long total, Instant at) {}    // immutable: share it freely

// volatile: visibility, without atomicity
class Worker implements Runnable {
    private volatile boolean stop;            // writes are seen by other threads at once
    public void requestStop() { stop = true; }
    @Override public void run() {
        while (!stop) doWork();               // without volatile, this might never stop
    }
    private void doWork() { }
}` },
        { kind: 'list', items: [
          '**Atomicity**: a compound action happens as one. **Visibility**: a write is seen by other threads. **Ordering**: compilers and CPUs may reorder what isn\'t synchronised.',
          '`volatile` gives visibility and ordering. It does **not** make `n++` safe.',
          'Exiting a `synchronized` block, writing a `volatile`, and finishing a thread all establish **happens-before**, the rule that guarantees another thread sees your writes.',
          'Safest options, best first: don\'t share data, share only immutable data, use a concurrent library class, and only then write your own locking.',
          'A `final` field correctly set by a constructor is safely visible to all threads, which is one reason immutable objects are so useful.',
        ] },
        { kind: 'pitfall', text: '**Deadlock**: thread A holds lock 1 and waits for lock 2, while thread B holds lock 2 and waits for lock 1. Neither can ever proceed. Always acquire multiple locks in the same global order, and keep what you do while holding a lock short.' },
        { kind: 'compare',
          python: `lock = threading.Lock()
with lock:
    count += 1
# The GIL protected the interpreter, not your compound operations.`,
          cpp: `std::atomic<int> n{0};
n.fetch_add(1);

std::mutex m;
{ std::lock_guard g{m}; ++other; }`,
          go: `var mu sync.Mutex
mu.Lock(); n++; mu.Unlock()

var a atomic.Int64
a.Add(1)`,
          ts: `// Single-threaded event loop: one callback runs at a time.
// But state can still change across an await.`,
          java: `private final AtomicInteger n = new AtomicInteger();
n.incrementAndGet();

synchronized (this) { other++; }`,
          note: 'Java\'s memory model was the first widely used one for a mainstream language, and it influenced the C++ and Go models.' },
        { kind: 'check', q: 'Is `volatile int n; n++;` safe across threads?', options: ['Yes, `volatile` makes it atomic', 'No: `volatile` gives visibility, but `n++` is still read, add, write', 'Yes, on 64-bit machines', 'Only with one writer per CPU'], answer: 1, hint: 'How many steps is `n++`?', explain: 'Two threads can still read the same value. Use `AtomicInteger`, or a lock.' },
      ],
    },
    {
      id: 'structures',
      title: 'Threadsafe data structures',
      blocks: [
        { kind: 'analogy', text: "A `ConcurrentHashMap` is a supermarket with many checkouts rather than one locked door: shoppers at different tills don't get in each other's way. A `BlockingQueue` is a conveyor belt between kitchen and waiters: if the belt is full the cook waits, if it's empty the waiter waits, and nobody has to write the coordination themselves." },
        { kind: 'code', code: `var totals = new ConcurrentHashMap<String, Long>();

// Wrong: two steps, with a gap between them
// if (!totals.containsKey(k)) totals.put(k, 0L);

// Right: atomic compound operations
totals.merge("XAU", 10L, Long::sum);
totals.computeIfAbsent("XAG", _ -> 0L);
totals.compute("EUR", (_, v) -> v == null ? 1L : v + 1);

// Producer and consumer, with built-in backpressure
BlockingQueue<String> q = new ArrayBlockingQueue<>(100);

Thread producer = Thread.startVirtualThread(() -> {
    try {
        q.put("order-1");                     // waits if the queue is full
        q.put("STOP");
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();   // restore the flag
    }
});

Thread consumer = Thread.startVirtualThread(() -> {
    try {
        String item;
        while (!(item = q.take()).equals("STOP")) {   // waits if empty
            System.out.println(item);
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
});

// Parallel algorithms
int[] data = new int[1_000_000];
Arrays.parallelSetAll(data, i -> i * 2);
Arrays.parallelSort(data);` },
        { kind: 'list', items: [
          '`ConcurrentHashMap`: scales well, and iterators never throw `ConcurrentModificationException`. No `null` keys or values.',
          '`CopyOnWriteArrayList`: each write copies the whole array. Excellent for rarely changing lists, such as listeners.',
          '`ConcurrentLinkedQueue`, `ConcurrentSkipListMap`: non-blocking queue, and sorted map.',
          '`ArrayBlockingQueue`, `LinkedBlockingQueue`, `SynchronousQueue`: producer and consumer hand-offs.',
          'A sequence of thread-safe calls isn\'t thread-safe as a whole. That is why the atomic `merge` and `compute` methods exist.',
        ] },
        { kind: 'pitfall', text: 'Catching `InterruptedException` and doing nothing hides a request to stop. Either let it propagate, or call `Thread.currentThread().interrupt()` to put the flag back for code further up.' },
        { kind: 'check', q: 'Why use `map.merge(k, 1, Integer::sum)` over `map.put(k, map.get(k) + 1)` on a `ConcurrentHashMap`?', options: ['It is shorter, and that is the only difference', 'It updates atomically; the other form can lose an update between `get` and `put`', 'The `put` is not thread-safe', '`get` can deadlock'], answer: 1, hint: 'What might happen between the two calls?', explain: 'Each individual call is safe, but the pair isn\'t: another thread may write in between.' },
      ],
    },
    {
      id: 'async',
      title: 'Asynchronous computations',
      blocks: [
        { kind: 'analogy', text: "Blocking on a `Future` is standing at the counter until your food is ready. `CompletableFuture` is a pager: you leave instructions (\"when it's ready, plate it, then bring it to table 5\") and go. Each step fires when the previous one finishes." },
        { kind: 'code', code: `CompletableFuture<Double> px = CompletableFuture
    .supplyAsync(() -> fetchPrice("XAU"));          // runs on a shared pool

CompletableFuture<String> report = px
    .thenApply(p -> p * 10)                         // transform (like map)
    .thenCompose(total -> saveAsync(total))         // chain another future (like flatMap)
    .exceptionally(ex -> "failed: " + ex.getMessage())   // recover
    .whenComplete((res, ex) -> System.out.println("done"));

// Waiting for two
var combined = px.thenCombine(
    CompletableFuture.supplyAsync(() -> fetchPrice("XAG")),
    (a, b) -> a / b);

// Waiting for many
var futures = List.of("XAU", "XAG", "EUR").stream()
    .map(s -> CompletableFuture.supplyAsync(() -> fetchPrice(s)))
    .toList();
CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();
List<Double> prices = futures.stream().map(CompletableFuture::join).toList();

// Your own executor, and a timeout
var ex = Executors.newFixedThreadPool(4);
var slow = CompletableFuture.supplyAsync(() -> fetchPrice("XAU"), ex)
    .orTimeout(2, TimeUnit.SECONDS)
    .completeOnTimeout(0.0, 1, TimeUnit.SECONDS);
ex.close();` },
        { kind: 'list', items: [
          '`thenApply` is `map`, and `thenCompose` is `flatMap`. `thenAccept` takes the value and returns nothing.',
          '`join` is `get` with unchecked exceptions, wrapping failures in `CompletionException`.',
          'By default, tasks run on `ForkJoinPool.commonPool()`. Pass your own executor for blocking work.',
          'With virtual threads (module 14), plain blocking code is often simpler than these chains: you only need asynchronous style when you truly want it.',
        ] },
        { kind: 'compare',
          python: `async def report():
    px = await fetch_price("XAU")
    return await save(px * 10)`,
          cpp: `auto f = std::async(std::launch::async, fetchPrice, "XAU");
double px = f.get();`,
          go: `ch := make(chan float64)
go func() { ch <- fetchPrice("XAU") }()
px := <-ch`,
          ts: `const report = fetchPrice("XAU")
  .then(p => save(p * 10))
  .catch(e => \`failed: \${e}\`)`,
          java: `var report = CompletableFuture.supplyAsync(() -> fetchPrice("XAU"))
    .thenCompose(p -> saveAsync(p * 10))
    .exceptionally(e -> "failed: " + e);`,
          note: '`CompletableFuture` is close to a JavaScript `Promise`: `then` covers both `thenApply` and `thenCompose`.' },
        { kind: 'check', q: 'What is `thenCompose` for?', options: ['Combining two strings', 'Chaining a step that itself returns a `CompletableFuture`', 'Waiting for all futures', 'Handling exceptions'], answer: 1, hint: 'Think of `map` vs `flatMap`.', explain: '`thenApply` with a future-returning function gives a nested future. `thenCompose` flattens it.' },
      ],
    },
    {
      id: 'locks',
      title: 'Atomics, locks & conditions',
      blocks: [
        { kind: 'analogy', text: "`synchronized` is a simple door lock: the key is on the door, and you can only queue. `ReentrantLock` is a smart lock: you can try it and walk away, wait with a timeout, or see who is queuing. A `Condition` is a waiting room attached to the lock: \"wake me when there's room\"." },
        { kind: 'code', code: `class BoundedBuffer<T> {
    private final Deque<T> items = new ArrayDeque<>();
    private final int capacity;
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    BoundedBuffer(int capacity) { this.capacity = capacity; }

    public void put(T x) throws InterruptedException {
        lock.lock();
        try {
            while (items.size() == capacity) notFull.await();   // releases the lock while waiting
            items.addLast(x);
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (items.isEmpty()) notEmpty.await();           // a loop, not an if
            T x = items.removeFirst();
            notFull.signal();
            return x;
        } finally {
            lock.unlock();
        }
    }
}

// Atomics
AtomicLong hits = new AtomicLong();
hits.incrementAndGet();
hits.updateAndGet(v -> Math.max(v, 100));
hits.compareAndSet(100, 0);

LongAdder fast = new LongAdder();     // cheaper when many threads update and few read
fast.increment();
long total = fast.sum();

// Coordination helpers
CountDownLatch ready = new CountDownLatch(3);   // wait for 3 events
Semaphore limit = new Semaphore(10);            // at most 10 at a time
ReadWriteLock rw = new ReentrantReadWriteLock();` },
        { kind: 'list', items: [
          '`synchronized` is simpler, and can\'t be left locked by mistake. Use `ReentrantLock` when you need `tryLock`, timeouts, several conditions, or fairness.',
          'Both are **reentrant**: a thread holding a lock can acquire it again.',
          'Always call `await` in a `while` loop. Threads may wake spuriously, or the condition may be false by the time they get the lock back.',
          'Every object has an intrinsic lock with `wait`, `notify` and `notifyAll`. It works the same way, but only offers one condition per lock. Prefer higher-level tools.',
          'In most programs, `BlockingQueue` and `Semaphore` are all you need, and you\'ll never write the class above.',
        ] },
        { kind: 'pitfall', text: 'With `ReentrantLock`, the `unlock` must go in `finally`. If the code between throws, the lock is held forever, and every other thread waits forever.' },
        { kind: 'check', q: 'Why is `await` called in a `while` loop rather than an `if`?', options: ['For speed', 'The condition may no longer hold when the thread wakes', 'The compiler requires it', 'To avoid the lock'], answer: 1, hint: 'What could happen between being signalled and getting the lock back?', explain: 'Another thread may have taken the item first, and spurious wakeups are allowed too. Always re-check.' },
      ],
    },
    {
      id: 'threads-processes',
      title: 'Threads & processes',
      blocks: [
        { kind: 'analogy', text: "A thread is a worker inside your company, sharing the same offices and filing cabinets. A process is a separate company: its own building, and it can only communicate by phone or letter. The `Thread` class is the low-level hiring paperwork. You'll normally let an executor handle it." },
        { kind: 'code', code: `Thread t = new Thread(() -> System.out.println("work"), "worker-1");
t.setDaemon(true);                 // doesn't keep the JVM alive
t.start();                         // start, not run: run() would stay on this thread
t.join();                          // wait for it to finish

Thread v = Thread.ofVirtual().name("v-1").start(() -> System.out.println("light"));

// Interruption: a polite request to stop
Thread loop = new Thread(() -> {
    while (!Thread.currentThread().isInterrupted()) {
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();     // keep the flag, and exit the loop
        }
    }
});
loop.start();
loop.interrupt();

// Per-thread values (see scoped values in module 14 for a newer option)
ThreadLocal<StringBuilder> buffer = ThreadLocal.withInitial(StringBuilder::new);

// Running other programs
Process p = new ProcessBuilder("git", "--version")
    .redirectErrorStream(true)
    .start();
try (var out = p.inputReader()) {
    out.lines().forEach(System.out::println);
}
int exit = p.waitFor();` },
        { kind: 'list', items: [
          'The JVM exits once all non-daemon threads finish.',
          'Calling `t.run()` directly just runs the code on the current thread, with no concurrency: a very common mistake.',
          'Thread states: new, runnable, blocked, waiting, timed waiting, terminated.',
          '`Thread.stop` is gone. Stopping is cooperative, through interruption.',
          'For `ProcessBuilder`, read the output or redirect it. If the pipe\'s buffer fills up, the child process blocks.',
        ] },
        { kind: 'check', q: 'What is wrong with `new Thread(task).run();`?', options: ['It will not compile', 'It runs `task` on the current thread, so no new thread starts', 'It runs twice', 'It leaks a thread'], answer: 1, hint: 'Which method creates the new thread?', explain: '`start()` begins a new thread, which then calls `run()`. Calling `run()` yourself is an ordinary method call.' },
      ],
    },
  ],
  quiz: [
    { q: 'Which is the difference between `Runnable` and `Callable`?', options: ['None', '`Callable` returns a result and may throw checked exceptions', '`Runnable` is newer', '`Callable` runs faster'], answer: 1, explain: '`Runnable.run` returns nothing. `Callable.call` returns a value.' },
    { q: 'What does `volatile` guarantee?', options: ['Atomic `++`', 'Visibility and ordering of reads and writes to that field', 'Mutual exclusion', 'Immutability'], answer: 1, explain: 'It does not make compound operations atomic.' },
    { q: 'Why are immutable objects good for concurrency?', options: ['They use less memory', 'They can be shared without any synchronisation', 'They run on special threads', 'They avoid garbage collection'], answer: 1, explain: 'No writes after construction means no races, and final fields are published safely.' },
    { q: 'Which is an atomic update on `ConcurrentHashMap`?', options: ['`get` followed by `put`', '`merge`', '`containsKey` followed by `put`', '`size` followed by `put`'], answer: 1, explain: '`merge`, `compute` and `computeIfAbsent` run as a single atomic step for each key.' },
    { q: 'What does `CompletableFuture.thenApply` correspond to?', options: ['`map`', '`flatMap`', '`filter`', '`reduce`'], answer: 0, explain: '`thenCompose` is the `flatMap`.' },
    { q: 'Where must `unlock()` go?', options: ['At the end of the method', 'In a `finally` block', 'In the constructor', 'Anywhere after `lock()`'], answer: 1, explain: 'It must run even if an exception occurs while the lock is held.' },
    { q: 'What should you do when catching `InterruptedException` if you cannot rethrow it?', options: ['Ignore it', 'Call `Thread.currentThread().interrupt()`', 'Call `System.exit`', 'Sleep and retry'], answer: 1, explain: 'That restores the interrupt status, so code further up can respond.' },
    { q: 'What causes deadlock?', options: ['Too many threads', 'Threads waiting on each other\'s locks in a cycle', 'Using `AtomicInteger`', 'Using immutable objects'], answer: 1, explain: 'Acquiring locks in one consistent global order prevents these cycles.' },
  ],
}
