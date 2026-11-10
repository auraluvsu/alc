import type { Module } from '../types'

export const r11: Module = {
  n: 11,
  title: 'Fearless Concurrency',
  tour: '16 · Fearless Concurrency',
  summary: 'Threads, message passing, shared state with Mutex and RwLock, atomics, and how `Send` and `Sync` make data races a compile error.',
  topics: ['Threads', 'Channels', 'Mutex & RwLock', 'Send & Sync', 'Atomics'],
  cpp23: [
    '`std::thread::scope` lets threads borrow local variables with no `Arc` and no `move` of owned data, and guarantees they finish before the scope ends (Rust 1.63).',
    '`Mutex::new`, `RwLock::new` and `Condvar::new` are `const`, so a `static` mutex needs no lazy wrapper (Rust 1.63). `LazyLock` and `OnceLock` cover the rest.',
    'The standard `mpsc` channel is built on the `crossbeam` implementation, with better performance (Rust 1.67), and `Sender` became `Sync` in Rust 1.72.',
    '`std::thread::available_parallelism`, `Thread::id` and `Builder::spawn_scoped` round out the thread API.',
  ],
  lessons: [
    {
      id: 'threads',
      title: 'Threads',
      blocks: [
        { kind: 'analogy', text: "Threads are **cooks in the same kitchen**. They work at the same time and can share ingredients, which is both the point and the danger: two cooks reaching for one jar of salt at the same moment is a data race. Most languages say \"be careful\". Rust's compiler is the **head chef who checks every recipe before service**: if two cooks could ever collide on the same jar without a rule, the dish is not allowed on the menu." },
        { kind: 'code', code: `use std::thread;
use std::time::Duration;

let handle = thread::spawn(|| {
    for i in 1..4 { println!("worker {i}"); thread::sleep(Duration::from_millis(10)); }
    42                                          // a thread can return a value
});
println!("main goes on");
let result = handle.join().unwrap();            // wait; Err if the thread panicked
assert_eq!(result, 42);

// A spawned thread may outlive the function: so it cannot borrow locals, only own them
let v = vec![1, 2, 3];
let h = thread::spawn(move || println!("{v:?}"));   // move: ownership goes to the thread
// println!("{v:?}");                                // error: v was moved
h.join().unwrap();

// Scoped threads: borrow locals safely, since the scope joins them all before it returns
let mut data = vec![1, 2, 3, 4, 5, 6];
let (left, right) = data.split_at_mut(3);
thread::scope(|s| {
    s.spawn(|| left.iter_mut().for_each(|x| *x *= 2));
    s.spawn(|| right.iter_mut().for_each(|x| *x += 100));
});                                              // both threads are joined here
println!("{data:?}");                            // [2, 4, 6, 104, 105, 106]

let n = thread::available_parallelism().map(|n| n.get()).unwrap_or(1);` },
        { kind: 'list', items: [
          '`thread::spawn` starts an **operating system thread**: a real 1:1 thread with its own stack (2 MiB by default), not a green thread. Threads are cheap, but not free: thousands are fine, millions are not. Use async (module 12) for huge numbers of I/O tasks.',
          'The closure must be **`\'static`**: since the thread could outlive the caller, it cannot borrow local variables. Use `move` to give it ownership, or `thread::scope` to borrow safely.',
          '`join()` returns `Result<T, Box<dyn Any + Send>>`. It is `Err` if the thread panicked, and a panic in a spawned thread does **not** take down the process or the other threads.',
          'If you drop a `JoinHandle` without joining, the thread keeps running (detached), but the process exits when `main` returns, killing it.',
          'The main strategies for splitting work: partition the data (`chunks`, `split_at_mut`) so each thread owns its part, **message passing** (next lesson), or **shared state** behind a lock (after).',
          'For data-parallel loops use **Rayon**: `v.par_iter().map(f).sum()` spreads a pipeline across a work-stealing thread pool with no manual thread code.',
        ] },
        { kind: 'compare',
          cpp: `std::thread t([&] { work(); });   // captures by reference: dangling if t outlives them
t.join();                          // forgetting this calls std::terminate; C++20 jthread joins automatically`,
          go: `go func() { work() }()             // goroutines: cheap, multiplexed over OS threads
wg.Wait()`,
          python: `t = threading.Thread(target=work); t.start(); t.join()   # the GIL stops CPU parallelism (until free-threaded builds)`,
          java: `Thread t = Thread.ofVirtual().start(() -> work());   // virtual threads (Java 21)
t.join();`,
          ts: `const w = new Worker("w.js")   // no shared memory by default: messages only`,
          rust: `let h = thread::spawn(move || work(data));   // ownership is moved: no dangling captures
h.join().unwrap();`,
          note: 'Rust threads are OS threads like C++. The difference is what the compiler checks: captured data must be owned, `\'static` or scoped, so no thread can use something that has gone away.' },
        { kind: 'check', q: 'Why does `thread::spawn(|| println!("{v:?}"))` fail to compile when `v` is a local `Vec`?', options: ['`println!` is not thread-safe', 'The closure borrows `v`, but the thread could outlive it; you need `move`', 'Vec is not `Send`', 'Threads cannot print'], answer: 1, hint: 'Think about lifetimes: how long can the thread live?', explain: 'A spawned thread must be `\'static`. Borrowing a local violates that, so use `move` (to hand over ownership) or `thread::scope`.' },
      ],
    },
    {
      id: 'channels',
      title: 'Message passing with channels',
      blocks: [
        { kind: 'analogy', text: "Instead of two cooks sharing one jar, they use a **conveyor belt between stations**. One side puts finished items on the belt (`send`), the other takes them off (`recv`). Once an item is on the belt, the sender no longer has it: ownership **moves** with the message, so nobody can touch it while it is in flight. The Go motto sums it up: *do not communicate by sharing memory; share memory by communicating*." },
        { kind: 'code', code: `use std::sync::mpsc;
use std::thread;

let (tx, rx) = mpsc::channel();                 // multiple producers, single consumer

let tx2 = tx.clone();                           // clone the sender for another producer
thread::spawn(move || { tx.send(String::from("from A")).unwrap(); });
thread::spawn(move || {
    for i in 0..3 { tx2.send(format!("B{i}")).unwrap(); }
});                                             // both senders are dropped here...

for msg in rx { println!("got {msg}"); }        // ...so the iterator ends when all senders are gone

// Other receive forms
// rx.recv()                    -> Result<T, RecvError>   blocks; Err if all senders dropped
// rx.try_recv()                -> Result<T, TryRecvError> never blocks
// rx.recv_timeout(dur)         -> wait at most dur

// A bounded channel provides back-pressure: send blocks when full
let (tx, rx) = mpsc::sync_channel::<u64>(100);

// A worker pipeline: results flow back through a channel
let (tx, rx) = mpsc::channel();
for id in 0..4 {
    let tx = tx.clone();
    thread::spawn(move || tx.send((id, expensive(id))).unwrap());
}
drop(tx);                                       // drop the original, or the loop below never ends
let results: Vec<_> = rx.iter().collect();` },
        { kind: 'stepper', title: 'Ownership moves through a channel', code: [
          'let (tx, rx) = mpsc::channel();',
          'thread::spawn(move || {',
          '    let s = String::from("hi");',
          '    tx.send(s).unwrap();',
          '    // println!("{s}");   // error',
          '});',
          'let got = rx.recv().unwrap();',
        ], steps: [
          { line: 1, note: 'A channel has two ends. `tx` can be cloned, `rx` cannot.', memory: [{ name: 'tx', value: 'Sender<String>' }, { name: 'rx', value: 'Receiver<String>' }] },
          { line: 3, note: 'The worker thread owns `tx` (moved in) and creates a `String` of its own.', memory: [{ name: 's (worker)', value: '"hi"', kind: 'heap' }] },
          { line: 4, note: '`send(s)` **moves** `s` into the channel. The worker no longer owns it.', memory: [{ name: 's (worker)', value: 'moved', kind: 'dead' }, { name: 'channel', value: '["hi"]', kind: 'heap' }] },
          { line: 5, note: 'Using `s` here would be a compile error: "borrow of moved value". The sender cannot race with the receiver on the data.', memory: [{ name: 'channel', value: '["hi"]', kind: 'heap' }] },
          { line: 7, note: '`recv` takes the message out. The main thread now owns the `String`, with no copy made.', memory: [{ name: 'got', value: '"hi"', kind: 'heap' }, { name: 'channel', value: '[]' }] },
        ] },
        { kind: 'list', items: [
          '`send` takes the value **by move**, and returns `Err` if the receiver has been dropped. `recv` blocks until a message arrives, and returns `Err` once every `Sender` is dropped and the queue is empty.',
          'Forgetting to drop the original `tx` after cloning is the classic hang: the receiving loop never ends because one sender is still alive.',
          '`mpsc` is **multi-producer, single-consumer**. For multi-consumer work queues use the `crossbeam-channel` or `flume` crates, or have one thread dispatch.',
          'Unbounded channels can grow without limit if the consumer is slower. Use `sync_channel(n)` (or a bounded crate channel) to apply **back-pressure**.',
          'Send **owned data or small commands** (enums are ideal: `enum Msg { Quote(Quote), Stop }`). It keeps threads decoupled and easy to reason about.',
          'The actor-style pattern, one thread (or task) owns the state and everybody else sends it messages, avoids locks entirely.',
        ] },
        { kind: 'compare',
          cpp: `// no standard channel; use a mutex + condition_variable + queue, or a library`,
          go: `ch := make(chan string)        // goroutines + channels: first-class
go func() { ch <- "hi" }()
msg := <-ch                    // any value can be sent, even pointers that both sides then share`,
          python: `q = queue.Queue(); q.put("hi"); q.get()   # thread-safe, but values are shared references`,
          java: `BlockingQueue<String> q = new LinkedBlockingQueue<>(); q.put("hi"); q.take();`,
          ts: `worker.postMessage("hi")   // structured clone: copies the data`,
          rust: `let (tx, rx) = mpsc::channel();
tx.send(String::from("hi"))?;   // the String moves: the sender cannot touch it again`,
          note: 'Go lets you send a pointer and keep using it on both sides, which is a data race waiting to happen. In Rust sending **moves ownership**, so the compiler rules that out.' },
        { kind: 'check', q: 'What does `for msg in rx` do when every `Sender` has been dropped?', options: ['Blocks forever', 'Ends the loop', 'Panics', 'Sends a final message'], answer: 1, hint: 'The iterator uses `recv()`.', explain: 'Once all senders are gone and the queue is drained, `recv` returns `Err` and the iterator stops. If one sender is still alive, it blocks.' },
      ],
    },
    {
      id: 'mutex',
      title: 'Shared state: Mutex and RwLock',
      blocks: [
        { kind: 'analogy', text: "A `Mutex` is the **key to a single-person bathroom**, hung on a hook, and in Rust the key is built into the room: **the data lives inside the mutex**, so you cannot touch it without taking the key (`lock()`). The key is a `MutexGuard`. While you hold it nobody else can enter, and the moment you drop the guard (even by panicking or returning early) the key goes back on the hook. A `RwLock` is a library reading room: many readers at once, or one writer." },
        { kind: 'code', code: `use std::sync::{Arc, Mutex, RwLock};
use std::thread;

let counter = Arc::new(Mutex::new(0));          // Arc: share ownership. Mutex: guard the data.
let mut handles = vec![];
for _ in 0..8 {
    let counter = Arc::clone(&counter);
    handles.push(thread::spawn(move || {
        for _ in 0..1000 {
            let mut n = counter.lock().unwrap();   // blocks until we hold the lock
            *n += 1;
        }                                          // guard dropped each iteration: lock released
    }));
}
for h in handles { h.join().unwrap(); }
println!("{}", *counter.lock().unwrap());          // 8000: always, with no data race

// Keep the critical section small
let snapshot = { let g = book.lock().unwrap(); g.clone() };   // copy out, release, then do slow work

// RwLock: many readers or one writer
let prices = Arc::new(RwLock::new(vec![100.0, 101.0]));
{ let r = prices.read().unwrap(); println!("{}", r[0]); }      // shared
{ let mut w = prices.write().unwrap(); w.push(102.0); }        // exclusive

// try_lock never blocks; a static mutex needs no wrapper
static LOG: Mutex<Vec<String>> = Mutex::new(Vec::new());
if let Ok(mut g) = LOG.try_lock() { g.push("x".into()); }` },
        { kind: 'list', items: [
          '`Arc<Mutex<T>>` is the standard pair for **shared mutable state across threads**: `Arc` for shared ownership and `Mutex` for exclusive access. (Single-threaded equivalent: `Rc<RefCell<T>>`.)',
          'The data is *inside* the lock. In C++ or Java the mutex sits beside the data and you must remember to take it. Here the type system makes it impossible to reach the data without the lock.',
          '`lock()` returns `Result<MutexGuard<T>, PoisonError<..>>`. A mutex is **poisoned** if a thread panicked while holding it. `.unwrap()` propagates that panic, and `.unwrap_or_else(|e| e.into_inner())` recovers the data. (`parking_lot` mutexes have no poisoning.)',
          '**Deadlocks are not prevented.** Two threads taking locks A then B and B then A will hang. Take locks in a consistent order, hold as few as possible, and never call unknown code (callbacks) while locked.',
          'Never hold a `std::sync::Mutex` guard across an `.await` in async code (module 12): use a short critical section or `tokio::sync::Mutex`.',
          'Prefer **fewer, simpler sharing points**: partition data per thread and combine results, or send messages, before reaching for locks. Contention on one hot mutex limits scaling.',
          '`Condvar` lets a thread wait on a mutex-protected condition, and `Barrier` makes a group of threads meet. `OnceLock` and `LazyLock` handle one-time setup.',
        ] },
        { kind: 'pitfall', text: 'A `MutexGuard` lives until the end of the **statement or block** where it is bound. `let n = *counter.lock().unwrap();` copies the value and releases the lock at the semicolon, but `let g = counter.lock().unwrap();` holds it until `g` goes out of scope. Scope guards in a small block to avoid blocking others, or accidentally deadlocking yourself with a second `lock()`.' },
        { kind: 'compare',
          cpp: `std::mutex m; int counter;                // the mutex is next to the data: nothing enforces the link
{ std::lock_guard<std::mutex> g(m); ++counter; }`,
          go: `var mu sync.Mutex; var counter int       // same: separate from the data
mu.Lock(); counter++; mu.Unlock()          // forget Unlock and you deadlock`,
          python: `with lock: counter += 1                   # lock and data are separate objects`,
          java: `synchronized (this) { counter++; }       // the monitor is the object; easy to forget on one access path`,
          ts: `// single-threaded event loop, or Atomics on SharedArrayBuffer`,
          rust: `let counter = Arc::new(Mutex::new(0));
*counter.lock().unwrap() += 1;             // the data cannot be reached without locking`,
          note: 'In every other language the lock and the data are separate and forgetting the lock compiles. In Rust the lock **owns** the data, so forgetting it is a type error.' },
        { kind: 'check', q: 'What does `Arc<Mutex<i32>>` give you?', options: ['Shared ownership with exclusive, lock-guarded mutation across threads', 'A faster `i32`', 'A lock-free counter', 'Single-threaded sharing only'], answer: 0, hint: 'Each wrapper adds one capability.', explain: '`Arc` shares ownership between threads and `Mutex` ensures one thread at a time can access the inner value.' },
      ],
    },
    {
      id: 'send-sync',
      title: 'Send and Sync',
      blocks: [
        { kind: 'analogy', text: "Two stickers on every type. **`Send`** means *this can be handed to another thread*, like a parcel you can post. **`Sync`** means *several threads can look at it at the same time through shared references*, like a sign on the wall. A diary with a cheap lock (`Rc`) can be neither posted nor displayed. The compiler reads the stickers and refuses any program that moves an unsafe item across a thread boundary." },
        { kind: 'code', code: `// Send:  T can be moved to another thread.
// Sync:  &T can be shared with other threads.  (T: Sync  <=>  &T: Send)

use std::rc::Rc;
use std::sync::Arc;
use std::thread;

let r = Rc::new(5);
// thread::spawn(move || println!("{r}"));   // error: \`Rc<i32>\` cannot be sent between threads safely
//   the trait \`Send\` is not implemented for \`Rc<i32>\`

let a = Arc::new(5);
thread::spawn(move || println!("{a}")).join().unwrap();    // fine: Arc<i32> is Send + Sync

// thread::spawn's real signature carries the requirements:
// pub fn spawn<F, T>(f: F) -> JoinHandle<T>
//     where F: FnOnce() -> T + Send + 'static, T: Send + 'static

// Auto traits: derived from the fields. A struct is Send if every field is Send.
struct Safe { n: i32, name: String }            // Send + Sync automatically
struct NotSend { r: Rc<i32> }                   // contains an Rc: not Send, so neither is the struct

// Opting out or asserting by hand is unsafe: you promise the compiler you have checked
struct Handle(*mut u8);
unsafe impl Send for Handle {}                  // "I guarantee this raw pointer is used safely across threads"` },
        { kind: 'list', items: [
          '**Send** types can be moved to another thread: almost everything. Not `Send`: `Rc`, raw pointers, `MutexGuard` (a lock must be released by the thread that took it), and some OS handles.',
          '**Sync** types can be referenced from several threads at once. `i32`, `String`, `Arc<T>` (if `T: Send + Sync`), `Mutex<T>` (if `T: Send`) and atomics are `Sync`. Not `Sync`: `Cell`, `RefCell` and `Rc` (interior mutability without locking).',
          'They are **auto traits**: the compiler derives them from a type\'s fields. You almost never write `Send` or `Sync` yourself. When you do (`unsafe impl`), you take responsibility for the proof.',
          'This is what lets the same borrow checker that prevents memory bugs also prevent **data races**: sharing a non-`Sync` type, or sending a non-`Send` one, is a compile error rather than a rare crash.',
          'Rust prevents **data races** (unsynchronised concurrent access to memory), but not other concurrency bugs: **deadlock, livelock, lost wake-ups and logical race conditions** (check-then-act with a lock released in between) still compile. Design for them.',
          'Read the compiler message: "`X` cannot be sent between threads safely" or "cannot be shared between threads safely" always names the offending field or type and the missing trait.',
        ] },
        { kind: 'compare',
          cpp: `// no thread-safety in the type system: data races are undefined behaviour. Tools: TSan, discipline.`,
          go: `// the race detector (go test -race) finds races at runtime, only if the test exercises them`,
          python: `# the GIL hides most races; free-threaded builds (3.13+) expose them again`,
          java: `// the memory model defines races, but the compiler does not prevent them; use \`@GuardedBy\` and review`,
          ts: `// no shared memory by default`,
          rust: `// error: \`Rc<i32>\` cannot be sent between threads safely   <- at compile time`,
          note: 'Everywhere else data races are found by testing (TSan, `-race`), or not at all. In safe Rust they cannot compile.' },
        { kind: 'check', q: 'Why is `RefCell<T>` not `Sync`?', options: ['It is too large', 'Its run-time borrow tracking is not thread-safe, so shared references from two threads could race', 'It uses unsafe', 'It has no `Send`'], answer: 1, hint: 'Think about what `borrow_mut` mutates behind `&self`.', explain: '`RefCell` updates its borrow flag without synchronisation. If two threads could call `borrow_mut` through `&RefCell`, the flag itself would race. Use `Mutex` or `RwLock` instead.' },
        { kind: 'check', q: 'Which statement about Rust and data races is correct?', options: ['Safe Rust prevents data races at compile time but not deadlocks', 'Safe Rust prevents all concurrency bugs', 'Data races are caught only at run time', 'Mutexes make data races impossible in C++ too'], answer: 0, hint: 'Remember the difference between a data race and a race condition.', explain: '`Send`/`Sync` plus ownership rule out data races. Deadlocks and logical race conditions are still possible.' },
      ],
    },
    {
      id: 'atomics',
      title: 'Atomics and memory ordering',
      blocks: [
        { kind: 'analogy', text: "A `Mutex` is a bathroom with a lock. An **atomic** is a **single stamp on a shared sheet**: one indivisible action that no one can interrupt halfway. For a counter or a flag, you do not need a whole room. But if a *group* of things must change together, you need the room. The **memory ordering** says how much the rest of the kitchen must tidy up (make visible) around the stamp." },
        { kind: 'code', code: `use std::sync::atomic::{AtomicBool, AtomicU64, AtomicUsize, Ordering};
use std::sync::Arc;
use std::thread;

// A shared counter with no lock
static HITS: AtomicU64 = AtomicU64::new(0);
fn record() { HITS.fetch_add(1, Ordering::Relaxed); }        // Relaxed: only the counter itself matters

// A stop flag
let running = Arc::new(AtomicBool::new(true));
let r = Arc::clone(&running);
let worker = thread::spawn(move || {
    while r.load(Ordering::Acquire) { /* work */ std::hint::spin_loop(); }
});
running.store(false, Ordering::Release);                      // Release/Acquire: publish earlier writes
worker.join().unwrap();

// Compare-and-swap: claim a slot only if it is still free
static SLOT: AtomicUsize = AtomicUsize::new(0);
let claimed = SLOT.compare_exchange(0, 1, Ordering::AcqRel, Ordering::Acquire).is_ok();

// Publishing data with a flag (Release on the store, Acquire on the load)
static READY: AtomicBool = AtomicBool::new(false);
static PAYLOAD: AtomicU64 = AtomicU64::new(0);
// producer: PAYLOAD.store(42, Ordering::Relaxed); READY.store(true, Ordering::Release);
// consumer: while !READY.load(Ordering::Acquire) {}; assert_eq!(PAYLOAD.load(Ordering::Relaxed), 42);` },
        { kind: 'list', items: [
          'Atomic types (`AtomicBool`, `AtomicUsize`, `AtomicI64`, `AtomicPtr`, ...) offer `load`, `store`, `swap`, `fetch_add`, `fetch_sub`, `fetch_max`, `compare_exchange` and friends on a single value, without a lock.',
          '**`Ordering`**: `Relaxed` (just atomicity, no ordering with other memory), `Acquire` (on a load: see everything before the matching Release), `Release` (on a store: publish everything before it), `AcqRel` (both, for read-modify-write) and `SeqCst` (one global total order, the strongest).',
          '**Start with `SeqCst`** unless you can explain why a weaker one is sufficient. Counters that no one else depends on can use `Relaxed`. A flag that publishes data uses `Release` to set and `Acquire` to read.',
          'Atomics are for **single-word state**: counters, flags, indices, sequence numbers, and building blocks of lock-free structures. For anything composite, use a `Mutex` or a channel: it is clearer and nearly as fast when uncontended.',
          '`compare_exchange` loops (`while ... { cas }`) are the building block of lock-free algorithms. Beware the **ABA problem**, and use a vetted crate (`crossbeam`, `arc-swap`) rather than writing your own.',
          'False sharing: atomics on the same 64-byte cache line hurt each other. Pad hot counters (`crossbeam_utils::CachePadded`) in latency-sensitive code.',
        ] },
        { kind: 'code', caption: 'Data-parallel code with Rayon.', code: `use rayon::prelude::*;

let prices: Vec<f64> = load_prices();
let total: f64 = prices.par_iter().sum();                         // parallel reduction
let squares: Vec<f64> = prices.par_iter().map(|p| p * p).collect();
prices.par_chunks(1024).for_each(|chunk| process(chunk));          // work-stealing pool, one per core

let (min, max) = prices.par_iter().fold(|| (f64::MAX, f64::MIN), |(lo, hi), &p| (lo.min(p), hi.max(p)))
    .reduce(|| (f64::MAX, f64::MIN), |a, b| (a.0.min(b.0), a.1.max(b.1)));` },
        { kind: 'compare',
          cpp: `std::atomic<int> n{0}; n.fetch_add(1, std::memory_order_relaxed);   // the same model: C++11 memory orderings`,
          go: `atomic.AddInt64(&n, 1)   // sequentially consistent only`,
          python: `# no atomics; the GIL and locks`,
          java: `AtomicLong n = new AtomicLong(); n.incrementAndGet();   // volatile semantics by default, with VarHandle for more`,
          ts: `Atomics.add(view, 0, 1)   // on SharedArrayBuffer`,
          rust: `n.fetch_add(1, Ordering::Relaxed);   // identical to C++20 orderings, named explicitly at every call`,
          note: 'Rust adopted the C++ memory model wholesale, so everything written about C++ atomics applies. The ordering argument is mandatory, which makes you think about it each time.' },
        { kind: 'pitfall', text: 'Using `Relaxed` for a flag that guards other data is a bug: the reader may see the flag set but stale data. If one thread writes data and then sets a flag, use `Release` for the store and `Acquire` for the load. When in doubt, `SeqCst`.' },
        { kind: 'check', q: 'Which ordering pair publishes data written before a flag store to a thread that reads the flag?', options: ['`Relaxed` store, `Relaxed` load', '`Release` store, `Acquire` load', '`Acquire` store, `Release` load', 'None: you need a mutex'], answer: 1, hint: 'Release publishes, Acquire observes.', explain: 'A `Release` store makes all prior writes visible to a thread whose `Acquire` load sees that store.' },
      ],
    },
  ],
  quiz: [
    { q: 'Why does `thread::spawn(|| println!("{v:?}"))` fail when `v` is a local?', options: ['`v` is not `Debug`', 'The closure must be `\'static`, but it borrows a local: add `move` or use `thread::scope`', 'Threads cannot print', 'It needs `Arc`'], answer: 1, explain: 'A spawned thread may outlive the function, so it cannot borrow locals.' },
    { q: 'What does `thread::scope` allow?', options: ['Threads that never end', 'Threads that borrow local data, guaranteed to be joined before the scope returns', 'Async tasks', 'Global threads'], answer: 1, explain: 'The scope joins all its threads, so borrowing is safe.' },
    { q: 'What happens to a message after `tx.send(msg)`?', options: ['It is copied', 'It is moved: the sender can no longer use it', 'It is shared by reference', 'It is serialised'], answer: 1, explain: 'Ownership moves into the channel. This is what stops sender and receiver racing on the data.' },
    { q: 'A `for msg in rx` loop never ends. A likely cause?', options: ['The channel is full', 'A `Sender` clone (often the original) was never dropped', 'The receiver is not `Send`', 'Too many threads'], answer: 1, explain: 'The loop ends only when all senders are dropped.' },
    { q: 'What is special about Rust\'s `Mutex<T>` compared with `std::mutex`?', options: ['It is faster', 'The data lives inside the mutex, so it cannot be accessed without locking', 'It cannot deadlock', 'It is lock-free'], answer: 1, explain: 'The guard from `lock()` is the only way to reach the value.' },
    { q: 'What does a poisoned mutex mean?', options: ['It is locked forever', 'A thread panicked while holding the lock, so the data may be inconsistent', 'It has too many waiters', 'It was dropped'], answer: 1, explain: '`lock()` returns `Err(PoisonError)`, from which you can still recover the data with `into_inner()`.' },
    { q: 'Which types are not `Send`?', options: ['`i32` and `String`', '`Rc<T>` and `MutexGuard<T>`', '`Arc<T>` where `T: Send + Sync`', '`Vec<u8>`'], answer: 1, explain: '`Rc` has non-atomic counts, and a `MutexGuard` must be released by the thread that locked it.' },
    { q: 'What does Rust\'s type system **not** prevent?', options: ['Data races', 'Deadlocks', 'Use-after-free', 'Dangling references'], answer: 1, explain: 'Deadlocks and logical races are still possible. Design lock order and ownership carefully.' },
    { q: 'Which `Ordering` is the safest default?', options: ['`Relaxed`', '`SeqCst`', '`Acquire`', '`Release`'], answer: 1, explain: 'It gives one global order of all `SeqCst` operations. Relax it only when you can justify the weaker guarantee.' },
    { q: 'When is an atomic better than a mutex?', options: ['For any shared struct', 'For single-word state such as counters and flags', 'When you need to block', 'When using `Rc`'], answer: 1, explain: 'Atomics operate on one word. Compound updates need a mutex or a channel.' },
  ],
}
