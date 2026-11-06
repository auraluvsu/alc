import type { Module } from './types'

export const m18: Module = {
  n: 18,
  title: 'Concurrency',
  tour: '18 · Concurrency',
  summary: 'Running work on several threads, sharing data without races, waiting for events, passing results between tasks, and coroutines.',
  topics: ['Tasks and threads', 'Sharing data', 'Waiting for events', 'Communicating tasks', 'Coroutines'],
  cpp23: [
    '`std::generator` is the first ready-made coroutine type in the library.',
    '`std::jthread` and stop tokens (C++20) are the default way to run and cancel threads.',
    '`<stdatomic.h>` compatibility, so C and C++ can share atomic code.',
    '`std::move_only_function` for queues of tasks that own resources.',
  ],
  lessons: [
    {
      id: 'threads',
      title: 'Tasks and threads',
      blocks: [
        { kind: 'analogy', text: "A thread is an extra cook in the same kitchen. Several cooks get more done, but they share the counters and the fridge (memory). Nothing stops two of them grabbing the same knife at once unless you set rules, and in C++ a collision isn't just a spilled sauce: it is undefined behaviour." },
        { kind: 'code', code: `void price_book(std::span<const Order> orders, double& out);

std::vector<Order> a = load("A"), b = load("B");
double ra = 0, rb = 0;
{
    std::jthread t1 {price_book, std::span{a}, std::ref(ra)};   // starts immediately
    std::jthread t2 {price_book, std::span{b}, std::ref(rb)};
}   // jthread joins automatically here: both are finished after this brace
std::println("{} {}", ra, rb);

std::thread::hardware_concurrency();    // how many hardware threads (a hint)` },
        { kind: 'list', items: [
          '`std::jthread` (C++20) **joins on destruction** and supports cancellation. Prefer it to `std::thread`, which calls `std::terminate` if destroyed while still joinable.',
          'Arguments are **copied** into the thread. Wrap them in `std::ref` to pass by reference, and make sure the referenced object outlives the thread.',
          'C++ threads are OS threads: real parallelism on multiple cores, but each costs memory and creation time. For many small jobs, use a thread pool.',
        ] },
        { kind: 'h', text: 'Cooperative cancellation' },
        { kind: 'code', code: `std::jthread feed {[](std::stop_token st) {     // jthread passes a stop token if you ask for one
    while (!st.stop_requested()) {
        poll_market_data();
    }
}};
// ... later
feed.request_stop();     // also done automatically by the destructor` },
        { kind: 'check', q: 'A `std::thread` (not `jthread`) object is destroyed while its thread is still running and was never joined. What happens?', options: ['It is joined automatically', 'It is detached automatically', '`std::terminate` is called', 'Nothing'], answer: 2, hint: 'This is the problem `jthread` was created to fix.', explain: 'A joinable `std::thread` in its destructor calls `std::terminate`. `jthread` requests stop and joins instead.' },
      ],
    },
    {
      id: 'sharing',
      title: 'Sharing data',
      blocks: [
        { kind: 'analogy', text: "A mutex is the single key to the spice cupboard. Whoever holds the key may use the cupboard; everyone else waits. A lock guard is a rule that the key returns itself to the hook when you leave the room, so nobody can walk off with it." },
        { kind: 'stepper', title: 'Step through: a data race on ++count', code: [
          'int count = 0;',
          '// thread A: ++count;    thread B: ++count;',
          'A: load count (0)',
          'B: load count (0)',
          'A: store 0 + 1',
          'B: store 0 + 1',
        ], steps: [
          { line: 1, note: '`++count` looks like one step, but the CPU does three: load, add, store.', memory: [{ name: 'count', value: '0' }] },
          { line: 3, note: 'Thread A loads 0 into its register.', memory: [{ name: 'count', value: '0' }, { name: 'A register', value: '0' }] },
          { line: 4, note: 'Before A stores, thread B also loads 0.', memory: [{ name: 'count', value: '0' }, { name: 'A register', value: '0' }, { name: 'B register', value: '0' }] },
          { line: 5, note: 'A stores 1.', memory: [{ name: 'count', value: '1' }, { name: 'B register', value: '0' }] },
          { line: 6, note: 'B stores 1 too. Two increments, final value **1**. And because this is a data race, the standard calls it undefined behaviour, so the optimiser may do even stranger things.', memory: [{ name: 'count', value: '1', note: 'expected 2' }] },
        ] },
        { kind: 'code', code: `std::mutex m;
std::vector<Fill> fills;               // shared, protected by m

void on_fill(Fill f) {
    std::scoped_lock lock {m};         // locks; unlocks at the end of scope, even on exceptions
    fills.push_back(f);
}

std::scoped_lock both {m_book, m_risk};      // lock several mutexes without deadlock

std::atomic<long> volume {0};               // for single counters/flags: no mutex needed
volume.fetch_add(qty);                      // indivisible
volume += qty;                               // same thing

std::shared_mutex sm;                        // many readers OR one writer
{ std::shared_lock r {sm}; read_config(); }
{ std::unique_lock w {sm}; reload_config(); }` },
        { kind: 'list', items: [
          '**Data race** = two threads access the same memory, at least one writes, and nothing orders them. It is UB.',
          '**Deadlock** = A holds mutex 1 and waits for 2 while B holds 2 and waits for 1. Fix it by always taking locks in one order, or by locking them together with `std::scoped_lock`.',
          'Keep critical sections short. Never call unknown code (callbacks) while holding a lock.',
          'The best shared state is none: give each thread its own data and combine the results at the end.',
        ] },
        { kind: 'check', q: 'Which is the simplest correct way to count events from many threads?', options: ['A plain `int` with `++`', '`volatile int`', '`std::atomic<int>`', 'A `static int`'], answer: 2, hint: '`volatile` is about hardware registers, not threads.', explain: '`std::atomic` makes the increment indivisible. `volatile` gives no thread-safety guarantees in C++.' },
      ],
    },
    {
      id: 'waiting',
      title: 'Waiting for events',
      blocks: [
        { kind: 'analogy', text: "A condition variable is a pager at a restaurant. Instead of standing at the counter asking \"is it ready?\" every second (busy-waiting), you sit down and the kitchen buzzes you. When the pager goes, you still check it really is your order, because pagers sometimes buzz by mistake (spurious wakeups)." },
        { kind: 'code', code: `std::queue<Order> q;
std::mutex m;
std::condition_variable cv;

void producer(Order o) {
    { std::scoped_lock lk {m}; q.push(std::move(o)); }
    cv.notify_one();                                   // buzz one waiter
}

void consumer(std::stop_token st) {
    while (!st.stop_requested()) {
        std::unique_lock lk {m};                       // cv needs a unique_lock
        cv.wait(lk, [&] { return !q.empty(); });       // sleeps; re-checks the condition on wake
        Order o = std::move(q.front()); q.pop();
        lk.unlock();                                   // don't process while holding the lock
        execute(o);
    }
}` },
        { kind: 'p', text: "This mutex + condition variable + queue trio is a **channel**. The standard library doesn't ship one, so this is the pattern to recognise and wrap in a small class. Prefer `std::condition_variable_any` with a `std::stop_token` overload of `wait` when consumers must be cancellable while asleep." },
        { kind: 'list', items: [
          'Always use the **predicate** form of `wait`. It handles spurious wakeups and notifications that arrived before you started waiting.',
          'Other C++20 primitives: `std::latch` (wait until N things are done, once), `std::barrier` (reusable rendezvous per phase), `std::counting_semaphore` (limit concurrent access).',
        ] },
        { kind: 'check', q: 'Why use `cv.wait(lk, pred)` rather than `cv.wait(lk)`?', options: ['It is faster', 'It handles spurious wakeups and missed notifications by re-checking the condition', 'It doesn\'t need a mutex', 'It can\'t deadlock'], answer: 1, hint: 'What if the pager buzzes but your food isn\'t there?', explain: 'The predicate version loops until the condition really holds, and returns immediately if it already does.' },
      ],
    },
    {
      id: 'tasks',
      title: 'Communicating tasks',
      blocks: [
        { kind: 'analogy', text: "A future is a claim ticket at a dry cleaner. You drop off the work (start a task) and get a ticket back immediately. Later you hand in the ticket (`get()`) and either collect your clothes (the value) or are told what went wrong (the exception)." },
        { kind: 'code', code: `// std::async: simplest "run this, give me a future"
auto f1 = std::async(std::launch::async, [] { return price(book_a); });
auto f2 = std::async(std::launch::async, [] { return price(book_b); });
double total = f1.get() + f2.get();          // waits; rethrows any exception from the task

// promise/future: produce the value from wherever you like
std::promise<double> p;
std::future<double> fut = p.get_future();
std::jthread worker {[&p] {
    try { p.set_value(compute()); }
    catch (...) { p.set_exception(std::current_exception()); }
}};
double v = fut.get();

// packaged_task: wrap a function so its result lands in a future (handy for task queues)
std::packaged_task<double(int)> job {simulate};
auto res = job.get_future();
std::jthread runner {std::move(job), 10'000};` },
        { kind: 'list', items: [
          'Always pass `std::launch::async` to `std::async` if you want a new thread. The default may run the task lazily on the calling thread.',
          '`get()` can be called **once**. For several consumers, use `std::shared_future`.',
          'Exceptions travel through the future automatically, so `get()` rethrows on the waiting side.',
        ] },
        { kind: 'pitfall', text: "The future returned by `std::async` **blocks in its destructor** until the task finishes. `std::async(std::launch::async, f);` without keeping the result runs `f` synchronously in effect. Store the future." },
        { kind: 'check', q: 'A task run with `std::async` throws. What happens when you call `get()` on its future?', options: ['Returns a default value', 'The exception is rethrown in the calling thread', 'The program terminates', 'The exception is lost'], answer: 1, hint: 'The claim ticket carries either the value or the bad news.', explain: 'The future stores the exception, and `get()` rethrows it where you wait.' },
      ],
    },
    {
      id: 'coroutines',
      title: 'Coroutines',
      blocks: [
        { kind: 'analogy', text: "A coroutine is a function with bookmarks. It can stop part-way (`co_await` / `co_yield`), hand control back, and later continue from exactly that line with its local variables intact, without needing its own thread. One thread can juggle thousands of them." },
        { kind: 'code', code: `// 1. Generators: the easy, standard case (C++23)
std::generator<Tick> replay(std::span<const Tick> ticks) {
    for (const Tick& t : ticks) co_yield t;
}
for (const Tick& t : replay(history)) strategy.on_tick(t);

// 2. Async tasks: you need a library type (e.g. from Asio, cppcoro, folly, libunifex)
asio::awaitable<void> session(tcp::socket s) {
    char buf[1024];
    for (;;) {
        auto n = co_await s.async_read_some(asio::buffer(buf), asio::use_awaitable);   // suspends, no thread blocked
        co_await asio::async_write(s, asio::buffer(buf, n), asio::use_awaitable);
    }
}` },
        { kind: 'list', items: [
          'A function is a coroutine if it uses `co_await`, `co_yield` or `co_return`. Its return type decides how it behaves.',
          'C++20 gave the **machinery**, not the types. C++23 adds `std::generator`. For async I/O you use a library, typically Asio.',
          'Coroutines are not threads: they don\'t run in parallel by themselves. They make waiting cheap, while threads make computing parallel.',
        ] },
        { kind: 'pitfall', text: "A coroutine that takes parameters **by reference** can outlive them: the caller returns, the referenced objects die, and the coroutine resumes later into dangling memory. Pass by value into coroutines unless the lifetime is certain." },
        { kind: 'check', q: 'What does the standard library itself provide for coroutines in C++23?', options: ['A full async runtime and event loop', 'The language machinery plus `std::generator`', 'Nothing at all', 'Green threads'], answer: 1, hint: 'Think about what you still need Asio for.', explain: 'There is no standard event loop or task type yet; `std::execution` (senders/receivers) is coming in C++26.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does `std::jthread` do on destruction?', options: ['Detaches', 'Requests stop and joins', 'Calls terminate', 'Nothing'], answer: 1, explain: 'That is the "j": it joins automatically.' },
    { q: 'What is a data race in C++?', options: ['Slow code', 'Undefined behaviour', 'A compile error', 'A deadlock'], answer: 1, explain: 'Unsynchronised concurrent access where at least one access is a write.' },
    { q: 'How do you lock two mutexes without risking deadlock?', options: ['Lock them one at a time in any order', '`std::scoped_lock lk{m1, m2};`', 'Use `volatile`', 'Use `std::atomic<std::mutex>`'], answer: 1, explain: '`scoped_lock` uses a deadlock-avoidance algorithm for multiple mutexes.' },
    { q: 'What does `std::ref(x)` do when passed to a thread constructor?', options: ['Copies x', 'Passes x by reference instead of copying', 'Moves x', 'Makes x atomic'], answer: 1, explain: 'Thread arguments are copied by default.' },
    { q: 'Why use the predicate overload of `condition_variable::wait`?', options: ['Required syntax', 'It protects against spurious wakeups and lost notifications', 'It is lock-free', 'It is faster'], answer: 1, explain: 'It re-checks the condition in a loop.' },
    { q: 'How many times can you call `get()` on a `std::future`?', options: ['Any number', 'Once', 'Twice', 'Until it throws'], answer: 1, explain: 'Use `std::shared_future` for multiple readers.' },
    { q: 'Which keyword makes a function a coroutine?', options: ['`async`', '`co_await` / `co_yield` / `co_return`', '`yield`', '`coroutine`'], answer: 1, explain: 'Any of the three in the body makes it a coroutine.' },
    { q: 'Coroutines vs threads:', options: ['Coroutines run in parallel automatically', 'Coroutines make waiting cheap; threads give parallel computation', 'They are identical', 'Threads are always cheaper'], answer: 1, explain: 'They are complementary; async servers often run many coroutines on a few threads.' },
  ],
}
