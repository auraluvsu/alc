import type { Module } from '../types'

export const r12: Module = {
  n: 12,
  title: 'Async Rust',
  tour: '17 · Fundamentals of Asynchronous Programming',
  summary: 'Futures, `async` and `.await`, executors and runtimes, tasks, streams, pinning, and when to use async versus threads.',
  topics: ['Futures & async/await', 'Runtimes & tasks', 'Joining & select', 'Streams', 'Pin'],
  cpp23: [
    '`Future` and `IntoFuture` are in the prelude of the 2024 edition, so you can write `impl Future<Output = T>` without an import.',
    '`async fn` in traits (Rust 1.75) and async closures with the `AsyncFn` traits (Rust 1.85) remove most uses of the `async-trait` crate and of `Box<dyn Future>`.',
    '`std::pin::pin!` pins a future on the stack, and `std::future::poll_fn` and `std::future::ready` build futures by hand (Rust 1.68 and 1.64).',
    '`std::task::Waker::noop` gives a no-op waker for tests and simple executors (Rust 1.85).',
  ],
  lessons: [
    {
      id: 'futures',
      title: 'Futures and async/await',
      blocks: [
        { kind: 'analogy', text: "A **thread** is hiring one worker per customer. If the worker has to wait for the oven, they stand there doing nothing. A **future** is a **ticket with instructions**: \"cook this, and tell me if you cannot go on because you are waiting\". One cook can hold hundreds of tickets, work on one until it must wait for the oven, put it aside, and pick up another. `.await` is the point on a ticket that says \"if you have to wait here, go and do something else, and come back when I am ready\"." },
        { kind: 'code', code: `use std::time::Duration;

async fn fetch_price(sym: &str) -> f64 {                // returns impl Future<Output = f64>
    tokio::time::sleep(Duration::from_millis(100)).await;   // yields while waiting
    sym.len() as f64 * 100.0
}

async fn report() -> String {
    let a = fetch_price("XAU").await;                   // .await: suspend until the future completes
    let b = fetch_price("EUR").await;                   // runs after a (sequential)
    format!("{a} {b}")
}

#[tokio::main]                                          // creates a runtime and runs main on it
async fn main() {
    let f = fetch_price("XAU");                         // nothing happens yet: futures are lazy
    println!("created, not run");
    let p = f.await;                                    // now it runs
    println!("{p}");
    println!("{}", report().await);

    let block = async { 1 + 1 };                        // async blocks are anonymous futures
    let owned = async move { println!("{p}") };         // move captures like closures do
    block.await; owned.await;
}` },
        { kind: 'list', items: [
          'An `async fn` returns a **future**: a value implementing the `Future` trait. Nothing runs when you call it, the work happens only when something **polls** the future, and `.await` does that and waits for the result. This is the opposite of JavaScript promises, which start eagerly.',
          'The compiler turns each `async` body into a **state machine** (an anonymous struct with one variant per `.await` point holding the live variables). There is no heap allocation by default and no stack per task, which is why tasks are so light.',
          '`.await` can only be used inside an `async` fn or block. The result of `.await` is the `Output`. Combine with `?` in fallible code: `let body = client.get(url).send().await?.text().await?;`.',
          'The standard library defines `Future`, `Poll`, `Waker` and `Context`, but **no runtime**. An executor (Tokio, smol, embassy for embedded) polls the futures, parks them when they return `Poll::Pending`, and wakes them when I/O is ready. This keeps `async` usable from servers to microcontrollers.',
          '**Dropping a future cancels it.** The work stops at the last `.await` it reached, and destructors run. This is powerful (timeouts are just "drop the future"), but means code between awaits must tolerate not running to completion.',
          '`async` is "contagious": an async function is called with `.await` from another async function, up to the runtime. Bridge with `Runtime::block_on` or `spawn_blocking` at the edges.',
        ] },
        { kind: 'code', code: `// What the compiler builds, in spirit (simplified)
pub trait Future {
    type Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
pub enum Poll<T> { Ready(T), Pending }

// async fn f() { a().await; b().await; }   becomes roughly:
enum F { Start, WaitingA(AFuture), WaitingB(BFuture), Done }
// Each poll advances the state as far as it can. If an inner future says Pending,
// this one returns Pending too, after arranging for the waker (cx) to be called when progress is possible.` },
        { kind: 'compare',
          cpp: `// C++20 coroutines: co_await; the standard gives the machinery but no task type or scheduler
task<int> f() { co_return co_await g(); }`,
          go: `// goroutines: the runtime makes everything async; no function colouring
go func() { work() }()`,
          python: `async def f(): return await g()   # coroutines are lazy too, driven by asyncio's event loop`,
          java: `CompletableFuture.supplyAsync(() -> work()).thenApply(...)   // eager promise-like; virtual threads (21) avoid it`,
          ts: `async function f() { return await g() }   // promises start eagerly and run to the first await`,
          rust: `async fn f() -> T { g().await }   // lazy state machine, polled by a runtime of your choice`,
          note: 'Rust async is lazy like Python and C++, and closer to C++ coroutines in being zero-allocation. It differs from Go and Java 21, where the runtime hides the waiting in lightweight threads.' },
        { kind: 'check', q: 'What happens when you call an `async fn` and do not `.await` the result?', options: ['It runs in the background', 'Nothing: futures are lazy and do no work until polled', 'It blocks the thread', 'It panics'], answer: 1, hint: 'Compare with JavaScript promises.', explain: 'The call just builds the state machine. It runs only when awaited, spawned or otherwise polled. The compiler warns about an unused future.' },
      ],
    },
    {
      id: 'runtimes',
      title: 'Runtimes and tasks',
      blocks: [
        { kind: 'analogy', text: "The **runtime** is the restaurant manager. Futures are the order tickets. A **task** is a ticket the manager has put on the board (`spawn`) so that it will be worked on **independently**, even while you do something else. The kitchen has a small fixed number of cooks (OS threads) that share the board: a cook who finds a ticket waiting for the oven moves on to another. A cook who gets stuck staring at the oven (a blocking call) holds up every ticket in their queue." },
        { kind: 'code', code: `use tokio::task;
use std::time::Duration;

#[tokio::main]                                         // multi-threaded runtime, one worker per core
async fn main() {
    // spawn: run a future as an independent task. Returns a JoinHandle.
    let h = tokio::spawn(async {
        tokio::time::sleep(Duration::from_millis(50)).await;
        "done"
    });
    println!("{}", h.await.unwrap());                  // Err if the task panicked or was aborted

    // Tasks run on any worker thread, so the future must be Send + 'static
    let data = vec![1, 2, 3];
    let h2 = tokio::spawn(async move { data.iter().sum::<i32>() });   // move: owned data

    // CPU-heavy or blocking work: keep it off the async workers
    let n = task::spawn_blocking(|| expensive_hash()).await.unwrap();
    // std::thread::sleep(...) or a blocking file read inside async code stalls the worker!

    // A set of tasks, awaited as they finish, cancelled when the set is dropped
    let mut set = tokio::task::JoinSet::new();
    for id in 0..5 { set.spawn(async move { (id, work(id).await) }); }
    while let Some(res) = set.join_next().await { println!("{:?}", res.unwrap()); }

    // Timeouts: just drop the future if time runs out
    match tokio::time::timeout(Duration::from_secs(1), slow()).await {
        Ok(v) => println!("{v}"),
        Err(_elapsed) => println!("timed out"),
    }
}` },
        { kind: 'list', items: [
          'A **task** is a future that has been handed to the runtime with `spawn`. Tasks are lightweight (a few hundred bytes), so spawning 100,000 is normal. OS threads cannot do that.',
          'The multi-threaded runtime moves tasks between worker threads, so a spawned future must be **`Send + \'static`**: it must not hold an `Rc`, a `MutexGuard` or a borrowed local across an `.await`. The error messages ("future cannot be sent between threads safely") point at the offending variable.',
          '**Never block a worker.** `std::thread::sleep`, `std::fs` reads, a blocking HTTP client, or a long CPU loop will stall every task that shares that thread. Use the async versions (`tokio::time::sleep`, `tokio::fs`), `spawn_blocking`, or hand CPU work to Rayon.',
          '**Runtimes**: Tokio is the de-facto standard for servers and networking (with `hyper`, `axum`, `reqwest`, `tonic`). `smol` is a small alternative, and `embassy` targets microcontrollers. Libraries should stay runtime-agnostic where they can. `async-std` is no longer maintained.',
          '`#[tokio::main(flavor = "current_thread")]` runs everything on one thread: no `Send` bound with `LocalSet`, and a good fit for simple tools and tests (`#[tokio::test]`).',
          '`JoinHandle::abort()` cancels a task at its next `.await`. A task\'s panic is caught and returned from `join` as `Err`, so one bad task does not take down the runtime.',
        ] },
        { kind: 'pitfall', text: 'The classic async bug is a blocking call inside an `async fn`: it compiles and works in a test, then freezes the whole server under load. If a function does not contain `.await` but takes more than a few microseconds, move it into `spawn_blocking`.' },
        { kind: 'compare',
          cpp: `// asio / folly / libunifex: pick your own scheduler; std::async is thread-based`,
          go: `go handle(conn)   // the runtime schedules goroutines, blocking calls are made cooperative for you`,
          python: `asyncio.create_task(handle(conn))   # one thread, one event loop; blocking calls stall everything`,
          java: `Thread.startVirtualThread(() -> handle(conn));   // blocking is fine: the JVM parks it`,
          ts: `void handle(conn)   // one event loop thread; blocking stalls everything`,
          rust: `tokio::spawn(handle(conn));   // multi-threaded; blocking stalls one worker, so use spawn_blocking`,
          note: 'Tokio resembles Go\'s scheduler, but cooperation is explicit: tasks yield at `.await`, so blocking calls must be kept out by hand.' },
        { kind: 'check', q: 'You call `std::thread::sleep(Duration::from_secs(5))` inside an async task on a runtime with 4 worker threads. What happens?', options: ['Only that task pauses; others are unaffected', 'That worker thread is blocked for 5 seconds, delaying every task on it', 'The runtime panics', 'The sleep is skipped'], answer: 1, hint: 'The sleep is a blocking call, not an `.await`.', explain: 'A blocking call holds the OS thread. Use `tokio::time::sleep(...).await` so the worker can run other tasks meanwhile.' },
      ],
    },
    {
      id: 'join-select',
      title: 'Joining, selecting and channels',
      blocks: [
        { kind: 'analogy', text: "Awaiting two futures one after the other is **boiling the pasta, then making the sauce**. `join!` is **doing both at the same time and plating when both are done**. `select!` is **a race: the first one to finish wins, and the rest are thrown away**. Cancellation is the price of the race: whatever the losers were doing is stopped mid-step." },
        { kind: 'code', code: `use std::time::Duration;
use tokio::{join, select, sync::{mpsc, oneshot, watch}, time};

async fn two() {
    // Sequential: total time = a + b
    let a = fetch("a").await;
    let b = fetch("b").await;

    // Concurrent in the SAME task: total time = max(a, b)
    let (a, b) = join!(fetch("a"), fetch("b"));
    // try_join! stops at the first Err
    let (a, b) = tokio::try_join!(try_fetch("a"), try_fetch("b"))?;
}

async fn race() {
    // select!: the first branch to complete runs; the others are dropped (cancelled)
    select! {
        v = fetch("primary") => println!("primary {v}"),
        v = fetch("backup")  => println!("backup {v}"),
        _ = time::sleep(Duration::from_secs(1)) => println!("timeout"),
    }
}

async fn channels() {
    let (tx, mut rx) = mpsc::channel::<String>(16);          // bounded: back-pressure on send().await
    tokio::spawn(async move { tx.send("tick".into()).await.unwrap(); });
    while let Some(m) = rx.recv().await { println!("{m}"); }  // ends when all senders are dropped

    let (otx, orx) = oneshot::channel::<u32>();              // exactly one value: request/response
    tokio::spawn(async move { let _ = otx.send(42); });
    println!("{}", orx.await.unwrap());

    let (wtx, mut wrx) = watch::channel(0u64);               // latest value, many watchers (config, last price)
    wtx.send(1).unwrap();
    wrx.changed().await.unwrap();
}

// Shared state in async code
use std::sync::Arc;
let state = Arc::new(tokio::sync::Mutex::new(Vec::<u64>::new()));   // may be held across .await
// With std::sync::Mutex: lock, use, and drop the guard BEFORE the next .await` },
        { kind: 'list', items: [
          '`join!` polls several futures **concurrently inside one task** (no spawn, no `Send` needed) and returns all results. `tokio::spawn` creates separate tasks that can run in parallel on different threads.',
          '`select!` waits for the first future to complete and **drops the rest**. Everything the dropped futures had in progress is cancelled, so make sure every branch is **cancel-safe** (it can be dropped at any `.await` without losing data: `mpsc::Receiver::recv` is, a half-read buffer in your own code may not be).',
          'Use `tokio::time::timeout`, `interval` and `sleep_until` for time, never `std::thread::sleep`.',
          'Channels: `mpsc` (many senders, one receiver, bounded or unbounded), `oneshot` (a single reply), `broadcast` (every receiver sees each message), `watch` (keep only the latest value). Bounded channels give **back-pressure**: a slow consumer slows the producers instead of consuming all memory.',
          'A `tokio::sync::Mutex` can be held across `.await`, but is slower. Prefer a `std::sync::Mutex` with a short critical section that never spans an `.await`, or give one task ownership of the state and talk to it via a channel (the actor pattern).',
          'Structure long-lived work with a `JoinSet` or `TaskTracker` plus a shutdown signal (`CancellationToken`, a `watch` channel), so that tasks end cleanly instead of being killed mid-operation.',
        ] },
        { kind: 'compare',
          cpp: `// asio: co_spawn, awaitable operators (|| for race, && for join)`,
          go: `select { case v := <-ch1: ...; case <-time.After(d): ... }   // channel select: the same shape`,
          python: `a, b = await asyncio.gather(fetch("a"), fetch("b"))
async with asyncio.timeout(1): ...`,
          java: `CompletableFuture.allOf(f1, f2).join()   // anyOf for the race`,
          ts: `const [a, b] = await Promise.all([fetch("a"), fetch("b")])
await Promise.race([f1, f2])   // the losing promise keeps running!`,
          rust: `let (a, b) = join!(fetch("a"), fetch("b"));
select! { v = f1 => ..., v = f2 => ... }   // the loser is dropped, which really cancels it`,
          note: 'In JavaScript the loser of a `Promise.race` keeps running. In Rust, dropping a future actually stops it, which is useful but needs cancel-safety.' },
        { kind: 'check', q: 'What happens to the branches of `select!` that did not complete first?', options: ['They keep running in the background', 'They are dropped (cancelled)', 'They are queued', 'They are awaited afterwards'], answer: 1, hint: 'Futures are values, and dropping one stops it.', explain: 'The losing futures are dropped. This is why branches should be cancel-safe.' },
        { kind: 'check', q: 'You need to wait for two independent requests and use both results. Which is best?', options: ['Await them one after the other', '`join!` (or `try_join!`)', '`select!`', '`spawn_blocking`'], answer: 1, hint: 'You want the total time to be the longer of the two.', explain: '`join!` runs them concurrently and returns both results. `select!` would discard one.' },
      ],
    },
    {
      id: 'streams',
      title: 'Streams and async iteration',
      blocks: [
        { kind: 'analogy', text: "A future is **one parcel** that arrives eventually. A **stream** is **a conveyor belt delivering parcels over time**, with `next().await` meaning \"wait here until the next parcel arrives, or the belt stops\". It is the async twin of an iterator: the same adapters (map, filter, take), but each step may have to wait." },
        { kind: 'code', code: `use futures::{stream, Stream, StreamExt};          // the futures crate (or tokio-stream)
use std::time::Duration;

async fn demo() {
    let mut s = stream::iter(1..=5)                  // a stream from an iterator
        .map(|x| x * 2)
        .filter(|x| futures::future::ready(*x > 4)); // filter's closure returns a future
    while let Some(x) = s.next().await { println!("{x}"); }

    // Process items concurrently, at most 8 at a time, in arrival order
    let results: Vec<f64> = stream::iter(["XAU", "EUR", "GBP"])
        .map(|sym| async move { fetch_price(sym).await })
        .buffer_unordered(8)                         // concurrency limit
        .collect()
        .await;

    // A periodic stream
    let mut tick = tokio::time::interval(Duration::from_secs(1));
    for _ in 0..3 { tick.tick().await; println!("tick"); }

    // Read lines from a socket or file without blocking
    // let mut lines = tokio::io::BufReader::new(sock).lines();
    // while let Some(line) = lines.next_line().await? { ... }
}

// Returning a stream: impl Stream
fn quotes() -> impl Stream<Item = f64> {
    stream::unfold(100.0, |px| async move {
        tokio::time::sleep(Duration::from_millis(10)).await;
        Some((px, px + 0.5))                         // (item, next state)
    })
}` },
        { kind: 'list', items: [
          'The `Stream` trait (from the `futures` crate) has `poll_next` returning `Poll<Option<Item>>`. A standard `AsyncIterator` is still being stabilised, so use `futures::Stream` + `StreamExt` or `tokio_stream` for now.',
          '`StreamExt::next().await` pulls one item. The combinators `map`, `filter`, `take`, `chain`, `zip`, `fold`, `collect`, `for_each` mirror `Iterator`, and `buffered(n)` / `buffer_unordered(n)` run up to `n` futures concurrently.',
          'Real-world streams: a WebSocket, lines of a log, market-data ticks, server-sent events, a database cursor, `tokio::sync::mpsc::Receiver` wrapped as `ReceiverStream`.',
          'Always **bound concurrency**. `buffer_unordered(n)` is how you scrape 10,000 URLs without opening 10,000 sockets at once.',
          'Back-pressure flows naturally: a stream is only polled when the consumer is ready, so a slow consumer slows the producer (as long as intermediate channels are bounded).',
          '`async` generators (`async gen` blocks) are not yet stable, so write streams with `stream::unfold`, `async-stream`\'s `stream!` macro, or a channel.',
        ] },
        { kind: 'compare',
          cpp: `// std::generator (C++23) is synchronous; async generators come from libraries (cppcoro, folly)`,
          go: `for v := range ch {}   // channels are the stream abstraction`,
          python: `async for x in agen(): ...   # async generators and async iterators are built in`,
          java: `Flow.Publisher / reactive streams (Reactor, RxJava): backpressure through request(n)`,
          ts: `for await (const x of stream) {}   // async iterators are built in`,
          rust: `while let Some(x) = stream.next().await {}   // Stream + StreamExt from the futures crate`,
          note: 'Python and JavaScript have `async for` in the language. Rust has the trait in a crate and `while let ... next().await`, and the language feature is still on its way.' },
        { kind: 'check', q: 'What does `buffer_unordered(8)` do on a stream of futures?', options: ['Sorts results', 'Runs up to 8 futures concurrently and yields results as each finishes', 'Allocates an 8-byte buffer', 'Runs them on 8 threads'], answer: 1, hint: 'It bounds concurrency.', explain: '`buffer_unordered(n)` keeps at most `n` futures in flight and returns outputs in completion order.' },
      ],
    },
    {
      id: 'pin',
      title: 'Pin, and async versus threads',
      blocks: [
        { kind: 'analogy', text: "Some futures are like a **house of cards in the middle of being built**: they hold references to their own parts. Move the table and the references point at nothing. **`Pin`** is a promise: \"this stays where it is until it is finished\". You rarely deal with it directly, because `.await`, `Box::pin` and the `pin!` macro handle it. But when you see `Pin<Box<dyn Future>>`, you know why it is there." },
        { kind: 'code', code: `use std::future::Future;
use std::pin::{pin, Pin};

// Box::pin: pin a future on the heap. Needed for recursion and trait objects.
fn boxed() -> Pin<Box<dyn Future<Output = u32> + Send>> {
    Box::pin(async { 7 })
}

// Recursion in async fn needs boxing, because the future would have infinite size otherwise
fn fact(n: u64) -> Pin<Box<dyn Future<Output = u64> + Send>> {
    Box::pin(async move { if n <= 1 { 1 } else { n * fact(n - 1).await } })
}

// pin!: pin on the stack, without allocating (Rust 1.68)
async fn run() {
    let fut = pin!(async { 1 + 1 });
    let v = fut.await;
}

// A hand-written future: a countdown that yields Pending twice
struct Countdown(u32);
impl Future for Countdown {
    type Output = &'static str;
    fn poll(mut self: Pin<&mut Self>, cx: &mut std::task::Context<'_>) -> std::task::Poll<&'static str> {
        if self.0 == 0 { std::task::Poll::Ready("liftoff") }
        else { self.0 -= 1; cx.waker().wake_by_ref(); std::task::Poll::Pending }   // ask to be polled again
    }
}` },
        { kind: 'list', items: [
          '`Pin<P>` wraps a pointer and guarantees the pointee **will not be moved** until it is dropped. State machines produced by `async` may contain references into themselves, so they must not move once polled.',
          'Most types are **`Unpin`** ("moving me is harmless"), so pinning them is free. Futures from `async` blocks are `!Unpin`. That is why `poll` takes `Pin<&mut Self>`.',
          'In practice: `Box::pin(fut)` when you need a `dyn Future` or recursion, `pin!(fut)` for a local one (needed for `select!` on a reused future), and everything else works by `.await`. Writing a manual `poll` (as above) is for library authors.',
          '**Async or threads?** Use **async** for lots of concurrent I/O-bound work (servers, crawlers, many connections), where tasks mostly wait. Use **threads** (or Rayon) for CPU-bound work and when you have a few long-running jobs. A mix is normal: an async server that hands heavy work to `spawn_blocking` or a Rayon pool.',
          'Async has real costs: the colour split between sync and async functions, a runtime dependency, harder errors and stack traces, and cancel-safety to reason about. If a simple threaded program meets your needs, it is the simpler choice.',
          'The ecosystem: **Tokio** (runtime), **axum** / **actix-web** (web), **reqwest** (HTTP client), **sqlx** / **tokio-postgres** (databases), **tonic** (gRPC), **tracing** (structured logs). Learn Tokio first.',
        ] },
        { kind: 'code', caption: 'A minimal executor, to demystify what the runtime does.', code: `use std::future::Future;
use std::pin::pin;
use std::task::{Context, Poll, Waker};

// Poll a future in a loop until it is ready. (A real executor parks the thread and uses the Waker.)
fn block_on<F: Future>(fut: F) -> F::Output {
    let mut fut = pin!(fut);
    let mut cx = Context::from_waker(Waker::noop());       // Waker::noop: Rust 1.85
    loop {
        if let Poll::Ready(v) = fut.as_mut().poll(&mut cx) { return v; }
        std::thread::yield_now();                          // busy-wait: fine for a demo
    }
}
let v = block_on(Countdown(3));        // "liftoff"` },
        { kind: 'pitfall', text: 'Adding `async` everywhere "just in case" makes code harder to call and test for no gain. Write plain functions for pure computation, and `async` only where there is real waiting on I/O. Keep the async layer thin: parse, validate and calculate in ordinary sync functions, and call them from async code.' },
        { kind: 'compare',
          cpp: `// thread pool + futures, or coroutines on a custom executor`,
          go: `// no choice to make: goroutines are the unit, for I/O and CPU alike`,
          python: `# asyncio for I/O concurrency; threads/processes for CPU (GIL permitting)`,
          java: `// virtual threads: write blocking code and let the JVM multiplex it (no async/await)`,
          ts: `// async/await for I/O, worker threads for CPU`,
          rust: `// async for many waiting tasks, threads/Rayon for CPU work, and you pick a runtime`,
          note: 'Rust keeps the choice explicit: async is a library-level technique with no hidden runtime, so you pay only for what you use.' },
        { kind: 'check', q: 'Which workload is the best fit for async Rust?', options: ['Multiplying large matrices', 'Handling 50,000 concurrent network connections that mostly wait on I/O', 'Hashing files on four cores', 'A short script with one HTTP call'], answer: 1, hint: 'Which one has tasks that mostly wait?', explain: 'Async tasks are cheap and cooperative, so they shine at huge numbers of mostly-idle I/O tasks. CPU-bound work wants threads or Rayon.' },
      ],
    },
  ],
  quiz: [
    { q: 'When does an `async fn` start running?', options: ['When it is called', 'When its future is polled, for example by `.await` or `spawn`', 'At program start', 'When it is imported'], answer: 1, explain: 'Futures are lazy: calling the function only builds the state machine.' },
    { q: 'What does `.await` do?', options: ['Blocks the thread until the future finishes', 'Suspends the current async function until the future is ready, letting the runtime run other tasks', 'Spawns a thread', 'Cancels the future'], answer: 1, explain: 'It yields control at that point instead of blocking the thread.' },
    { q: 'What does the standard library provide for async?', options: ['A complete runtime', 'The `Future` trait and supporting types, but no executor', 'Only `async` syntax', 'A thread pool'], answer: 1, explain: 'Runtimes such as Tokio or smol are separate crates.' },
    { q: 'What bound must a future passed to `tokio::spawn` satisfy?', options: ['`Copy`', '`Send + \'static`', '`Sync` only', 'None'], answer: 1, explain: 'The task may run on any worker thread and outlive the caller.' },
    { q: 'Why is `std::thread::sleep` inside an async fn a bug?', options: ['It does not compile', 'It blocks an executor thread and stalls other tasks on it', 'It sleeps zero seconds', 'It cancels the task'], answer: 1, explain: 'Use `tokio::time::sleep(..).await`, or `spawn_blocking` for blocking work.' },
    { q: 'What does `join!(a, b)` do?', options: ['Runs `a` then `b`', 'Runs both concurrently and returns both outputs', 'Returns the first to finish', 'Spawns two threads'], answer: 1, explain: 'It polls both futures within the current task. Total time is roughly the longer of the two.' },
    { q: 'What happens to the losing branches in `select!`?', options: ['They keep running', 'They are dropped (cancelled)', 'They are paused', 'They raise errors'], answer: 1, explain: 'Branches must therefore be cancel-safe.' },
    { q: 'Why does a recursive `async fn` need `Box::pin`?', options: ['Rust forbids recursion', 'The future would contain itself and so have infinite size', 'Recursion is unsafe', 'It needs a mutex'], answer: 1, explain: 'Boxing introduces indirection so the type has a finite size.' },
    { q: 'What does `Pin` guarantee?', options: ['The value is immutable', 'The value will not be moved in memory until dropped', 'The value is on the stack', 'The value is `Send`'], answer: 1, explain: 'Self-referential state machines must not move once polled.' },
    { q: 'What is new in the 2024 edition prelude for async?', options: ['`Future` and `IntoFuture` are now in the prelude', '`tokio` is included', '`await` is a function', 'Nothing'], answer: 0, explain: 'You can name `Future` without importing `std::future::Future`.' },
  ],
}
