import type { Module } from '../types'

export const s11: Module = {
  n: 11,
  title: 'Concurrency: Threads, Atomics & the Memory Model',
  tour: '12 · Concurrent Programming',
  summary: 'Running work in parallel safely: threads and data races, mutexes and condition variables, atomics, the C++ memory model and memory orders (acquire/release), and building a lock-free single-producer single-consumer ring buffer, the workhorse of trading systems.',
  topics: ['Threads & data races', 'Mutexes & condition variables', 'Atomics', 'The memory model', 'A lock-free SPSC queue'],
  cpp23: ['`std::jthread`, `std::latch`, `std::barrier`, `std::counting_semaphore` and `std::atomic::wait/notify` (C++20).', '`std::atomic_ref` (C++20) applies atomic operations to ordinary objects.'],
  lessons: [
    {
      id: 'races',
      title: 'Threads & data races',
      blocks: [
        { kind: 'analogy', text: "Two cashiers updating the same paper ledger: each reads the total, adds their sale and writes the new total. If both read before either writes, one sale vanishes. `counter++` is exactly that three-step read-modify-write. In C++ an unsynchronised concurrent write is a *data race*, which is undefined behaviour, not merely a wrong number." },
        { kind: 'code', code: `#include <cstdio>
#include <thread>
#include <vector>

int main() {
    long counter = 0;                               // plain long: racy
    std::vector<std::jthread> ts;
    for (int t = 0; t < 4; ++t)
        ts.emplace_back([&] { for (int i = 0; i < 1'000'000; ++i) counter++; });
    ts.clear();                                     // jthread joins on destruction
    std::printf("%ld (expected 4000000)\\n", counter);
}
// Measured while writing this, built with -O0: 2968684, then 2730442 on the next run.
// At -O2, GCC may fold each thread's loop into a single add and the total often comes out
// "right". The race is still there, and the next compiler version may expose it.
// $ g++ -O1 -g -fsanitize=thread race.cpp && ./a.out
// WARNING: ThreadSanitizer: data race ... Write of size 8 by thread T2 ...` },
        { kind: 'check', q: 'Why does `counter++` from several threads lose increments?', options: ['Threads are slow', 'It\'s a non-atomic read-modify-write, so updates overwrite each other', 'Integer overflow', 'The OS drops them'], answer: 1, hint: 'Two cashiers, one ledger.', explain: 'And it\'s formally undefined behaviour.' },
      ],
    },
    {
      id: 'mutex',
      title: 'Mutexes & condition variables',
      blocks: [
        { kind: 'analogy', text: "A mutex is the single key to the ledger room: only the holder may enter. `std::lock_guard` takes the key and guarantees it's handed back when the scope ends, even on an exception. A condition variable is a bell in the waiting room: workers sleep until someone rings it to say there's new work, rather than repeatedly checking." },
        { kind: 'code', code: `#include <condition_variable>
#include <cstdio>
#include <mutex>
#include <queue>
#include <thread>

std::mutex m;
std::condition_variable cv;
std::queue<int> orders;
bool done = false;

int main() {
    std::jthread consumer([] {
        long processed = 0;
        for (;;) {
            std::unique_lock lk(m);
            cv.wait(lk, [] { return !orders.empty() || done; });   // sleeps; handles spurious wake-ups
            if (orders.empty() && done) break;
            orders.pop(); ++processed;
        }
        std::printf("processed %ld\\n", processed);               // 1000
    });
    for (int i = 0; i < 1000; ++i) {
        { std::lock_guard lk(m); orders.push(i); }
        cv.notify_one();
    }
    { std::lock_guard lk(m); done = true; }
    cv.notify_one();
}
// Deadlock rule: when taking several mutexes, always lock in one global order, or use std::scoped_lock(a, b).` },
        { kind: 'list', items: [
          'An uncontended mutex lock/unlock costs tens of nanoseconds; under contention a thread may sleep in the kernel for microseconds.',
          'Always wait with a predicate: condition variables can wake spuriously.',
          'Keep critical sections short; never call unknown code (callbacks, I/O) while holding a lock.',
        ] },
        { kind: 'check', q: 'Why pass a predicate to `cv.wait`?', options: ['Speed', 'Waits can wake spuriously; the predicate re-checks the condition', 'Required syntax', 'To avoid locking'], answer: 1, hint: 'The bell can ring by itself.', explain: 'It also handles notifications that happened before the wait.' },
      ],
    },
    {
      id: 'atomics',
      title: 'Atomics',
      blocks: [
        { kind: 'analogy', text: "An atomic is a ledger entry the hardware updates in one indivisible step: a lock built into a single instruction (`lock xadd` on x86). No other thread can ever see it half-updated. Atomics are ideal for counters, flags and single pointers, and they're the building blocks of lock-free data structures." },
        { kind: 'code', code: `#include <atomic>
#include <cstdio>
#include <thread>
#include <vector>

int main() {
    std::atomic<long> counter{0};
    {
        std::vector<std::jthread> ts;
        for (int t = 0; t < 4; ++t)
            ts.emplace_back([&] { for (int i = 0; i < 1'000'000; ++i)
                                     counter.fetch_add(1, std::memory_order_relaxed); });
    }
    std::printf("%ld\\n", counter.load());                  // 4000000, every time

    std::atomic<int> state{0};
    int expected = 0;
    bool won = state.compare_exchange_strong(expected, 1);  // CAS: set to 1 only if still 0
    std::printf("%d %d\\n", won, state.load());              // 1 1
    std::printf("%d\\n", std::atomic<long>::is_always_lock_free);   // 1 on x86-64
}` },
        { kind: 'pitfall', text: '`volatile` is not for threads. It stops the compiler caching a value in a register (useful for memory-mapped hardware), but gives no atomicity and no ordering between threads. Use `std::atomic`.' },
        { kind: 'check', q: 'What does compare_exchange do?', options: ['Swaps two variables', 'Sets a new value only if the current value equals the expected one, atomically', 'Compares two atomics', 'Locks a mutex'], answer: 1, hint: 'CAS.', explain: 'On failure it writes the actual value into expected.' },
      ],
    },
    {
      id: 'memorder',
      title: 'The memory model',
      blocks: [
        { kind: 'analogy', text: "CPUs and compilers reorder memory operations for speed, as long as a single thread can't tell. Another thread can. Release/acquire is a handover protocol: the writer fills a box then raises a flag with *release* (\"everything I wrote before this is visible to whoever sees the flag\"); the reader checks the flag with *acquire* (\"once I see it, I see everything written before it\")." },
        { kind: 'code', code: `#include <atomic>
#include <cassert>
#include <thread>

struct Quote { double bid, ask; };
Quote q;                                    // plain, non-atomic data
std::atomic<bool> ready{false};

int main() {
    std::jthread producer([] {
        q = {2385.1, 2385.5};               // 1) write the data
        ready.store(true, std::memory_order_release);    // 2) publish
    });
    std::jthread consumer([] {
        while (!ready.load(std::memory_order_acquire)) {}   // 3) wait for the flag
        assert(q.bid == 2385.1 && q.ask == 2385.5);         // 4) guaranteed to see step 1
    });
}
// memory_order_relaxed: atomicity only, no ordering (fine for statistics counters)
// acquire / release:    one-way publication between threads (queues, flags)
// seq_cst (default):    a single global order of all seq_cst operations; simplest, slightly slower
// On x86, acquire loads and release stores are ordinary movs; seq_cst stores need an mfence/xchg.` },
        { kind: 'check', q: 'With relaxed ordering on `ready`, could the consumer see ready == true but stale quote data?', options: ['No, never', 'Yes: relaxed gives no ordering guarantee for other memory', 'Only on x86', 'Only with -O0'], answer: 1, hint: 'Relaxed = atomic, not ordered.', explain: 'x86 happens to be strongly ordered, but the compiler can still reorder; ARM really does.' },
      ],
    },
    {
      id: 'spsc',
      title: 'A lock-free SPSC ring buffer',
      blocks: [
        { kind: 'analogy', text: "A single-producer single-consumer ring is a circular conveyor belt between exactly two people. The producer only ever moves the *head* marker; the consumer only moves the *tail*. Because each marker has one writer, no locks are needed, just acquire/release on the markers. It's how a feed-handler thread hands ticks to a strategy thread in a few tens of nanoseconds." },
        { kind: 'code', code: `#include <array>
#include <atomic>
#include <cstddef>
#include <cstdio>
#include <new>
#include <optional>
#include <thread>

template <class T, std::size_t N>                     // N must be a power of two
class SpscQueue {
    static_assert((N & (N - 1)) == 0);
    std::array<T, N> buf_;
    alignas(64) std::atomic<std::size_t> head_{0};    // written by producer only
    alignas(64) std::atomic<std::size_t> tail_{0};    // written by consumer only (separate line: no false sharing)
public:
    bool push(const T& v) {
        auto h = head_.load(std::memory_order_relaxed);
        if (h - tail_.load(std::memory_order_acquire) == N) return false;   // full
        buf_[h & (N - 1)] = v;
        head_.store(h + 1, std::memory_order_release);                       // publish the slot
        return true;
    }
    std::optional<T> pop() {
        auto t = tail_.load(std::memory_order_relaxed);
        if (t == head_.load(std::memory_order_acquire)) return std::nullopt; // empty
        T v = buf_[t & (N - 1)];
        tail_.store(t + 1, std::memory_order_release);                       // free the slot
        return v;
    }
};

struct Tick { long seq; double px; };

int main() {
    static SpscQueue<Tick, 1024> q;
    const long n = 10'000'000;
    std::jthread producer([] { for (long i = 0; i < n; ++i) while (!q.push({i, 2385.0 + i % 10})) {} });
    long expected = 0, bad = 0;
    while (expected < n)
        if (auto t = q.pop()) { bad += t->seq != expected; ++expected; }
    std::printf("received %ld ticks, %ld out of order\\n", expected, bad);    // 10000000, 0
}` },
        { kind: 'list', items: [
          'Indices only ever increase; `& (N - 1)` maps them onto the ring (cheaper than `%`, module 3).',
          'Production versions cache the other side\'s index locally to avoid reading the shared cache line on every call.',
          'For many producers or consumers, prefer a proven library (e.g. a Vyukov MPMC queue, or `moodycamel::ConcurrentQueue`) over writing your own.',
        ] },
        { kind: 'check', q: 'Why can this queue work without locks?', options: ['It uses volatile', 'Each index has exactly one writer, and acquire/release orders the data hand-over', 'x86 is magic', 'It copies everything twice'], answer: 1, hint: 'Who writes head? Who writes tail?', explain: 'With two producers it would break.' },
      ],
    },
  ],
  quiz: [
    { q: 'A data race in C++ is…', options: ['Just a wrong result', 'Undefined behaviour', 'A compile error', 'Always a crash'], answer: 1, explain: 'Use atomics or locks.' },
    { q: 'Which tool detects data races?', options: ['ASan', 'ThreadSanitizer (-fsanitize=thread)', 'gdb', 'perf'], answer: 1, explain: 'TSan.' },
    { q: 'std::lock_guard releases the mutex…', options: ['Manually', 'When it goes out of scope', 'After 1 ms', 'Never'], answer: 1, explain: 'RAII.' },
    { q: 'Avoid deadlock with multiple mutexes by…', options: ['Random order', 'A consistent lock order or std::scoped_lock', 'More threads', 'volatile'], answer: 1, explain: 'scoped_lock locks several safely.' },
    { q: 'volatile provides…', options: ['Thread safety', 'No thread synchronisation guarantees', 'Atomicity', 'Ordering'], answer: 1, explain: 'Use std::atomic.' },
    { q: 'memory_order_relaxed guarantees…', options: ['Ordering', 'Atomicity only', 'Nothing', 'Sequential consistency'], answer: 1, explain: 'Fine for counters.' },
    { q: 'A release store pairs with…', options: ['A relaxed load', 'An acquire load that reads its value', 'A mutex', 'A fence only'], answer: 1, explain: 'Publication.' },
    { q: 'An SPSC queue is safe for…', options: ['Any number of threads', 'Exactly one producer and one consumer', 'Two producers', 'Processes only'], answer: 1, explain: 'Single writer per index.' },
  ],
}
