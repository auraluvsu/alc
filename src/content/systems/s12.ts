import type { Module } from '../types'

export const s12: Module = {
  n: 12,
  title: 'Low-Latency Systems',
  tour: 'Added · Low latency',
  summary: 'Putting the whole course together for trading-grade latency: the anatomy of tick-to-trade, measuring with clocks and percentiles, CPU pinning and isolation, busy polling, allocation-free and branch-predictable hot paths, kernel bypass, and the operational discipline around it.',
  topics: ['Tick-to-trade', 'Measuring latency', 'Pinning & isolation', 'A hot path without surprises', 'Kernel bypass & hardware'],
  cpp23: ['Not from CS:APP: draws on common practice in electronic trading. `std::chrono::steady_clock`, `[[likely]]`, `std::pmr` and atomics from earlier modules are the core tools.'],
  lessons: [
    {
      id: 'tick',
      title: 'Tick-to-trade',
      blocks: [
        { kind: 'analogy', text: "Tick-to-trade is a relay race from the moment a market-data packet hits your network card to the moment your order leaves it. Every leg adds time: the NIC, the kernel's network stack, your feed handler parsing the message, updating the book, the strategy deciding, risk checks, building the order, and the network stack again on the way out. You can only shorten the race by knowing how long each leg takes." },
        { kind: 'list', items: [
          '**Network card → user space**: ~5–20 µs through the kernel; ~1–2 µs with kernel bypass.',
          '**Parse + book update**: tens to hundreds of ns if data is in cache and parsing is allocation-free.',
          '**Strategy decision**: from ns (a few comparisons) to µs (a model, ML module 12).',
          '**Pre-trade risk checks**: must be fast *and* never skipped.',
          '**Order encode + send**: similar to receive; plus the wire and the exchange\'s own matching latency.',
          'Software trading systems typically aim for single-digit microseconds tick-to-trade; FPGA systems go below one microsecond.',
        ] },
        { kind: 'check', q: 'Which usually dominates tick-to-trade in a well-written C++ system that uses the normal Linux network stack?', options: ['The strategy\'s arithmetic', 'Kernel network stack and system calls', 'Logging', 'Compiling'], answer: 1, hint: 'Microseconds vs nanoseconds.', explain: 'That\'s why kernel bypass exists.' },
      ],
    },
    {
      id: 'measure',
      title: 'Measuring latency',
      blocks: [
        { kind: 'analogy', text: "You can't improve what you can't see, and averages hide exactly the cases that lose money. Timestamp each leg of the relay with a cheap, monotonic clock, record every sample into a pre-allocated histogram (never allocate while measuring), and report percentiles. The clock itself has a cost: measure that first." },
        { kind: 'code', code: `#include <algorithm>
#include <chrono>
#include <cstdint>
#include <cstdio>
#include <vector>
#include <x86intrin.h>

int main() {
    const int n = 1'000'000;
    std::vector<std::int64_t> d(n);

    for (int i = 0; i < n; ++i) {                            // cost of steady_clock::now()
        auto a = std::chrono::steady_clock::now();
        auto b = std::chrono::steady_clock::now();
        d[i] = std::chrono::duration_cast<std::chrono::nanoseconds>(b - a).count();
    }
    std::ranges::sort(d);
    std::printf("steady_clock: p50 %lld ns  p99 %lld ns\\n", (long long)d[n / 2], (long long)d[n * 99 / 100]);

    for (int i = 0; i < n; ++i) {                            // raw TSC: cycles, not ns
        unsigned aux;
        auto a = __rdtscp(&aux);
        auto b = __rdtscp(&aux);
        d[i] = static_cast<std::int64_t>(b - a);
    }
    std::ranges::sort(d);
    std::printf("rdtscp:       p50 %lld cycles\\n", (long long)d[n / 2]);
}
// Measured while writing this: steady_clock p50 25 ns (p99 29 ns); rdtscp p50 38 cycles.
// rdtsc needs a constant, invariant TSC (check /proc/cpuinfo for constant_tsc) and calibration
// to convert cycles to ns. In production, hardware timestamps on the NIC measure wire-to-wire.` },
        { kind: 'check', q: 'Why record latencies into a pre-allocated buffer?', options: ['Tidiness', 'Allocating while measuring adds the very jitter you\'re trying to measure', 'Required by chrono', 'To sort faster'], answer: 1, hint: 'Module 9.', explain: 'Or an HDR histogram with fixed memory.' },
      ],
    },
    {
      id: 'pinning',
      title: 'Pinning, isolation & busy polling',
      blocks: [
        { kind: 'analogy', text: "By default the scheduler moves threads between cores and lets other work interrupt them, like a chef who keeps being moved to a different kitchen mid-order, each one with cold pans (empty caches). Pinning gives the hot thread its own kitchen; isolating the core keeps everyone else out; busy polling means the chef stands at the pass watching for orders rather than napping and waiting to be woken." },
        { kind: 'code', code: `#include <cstdio>
#include <pthread.h>
#include <sched.h>
#include <thread>

bool pin_to_core(std::thread& t, int core) {
    cpu_set_t set;
    CPU_ZERO(&set);
    CPU_SET(core, &set);
    return pthread_setaffinity_np(t.native_handle(), sizeof set, &set) == 0;
}

int main() {
    std::thread hot([] { /* busy-poll the feed: while (running) { if (auto m = q.pop()) handle(*m); } */ });
    std::printf("pinned: %d\\n", pin_to_core(hot, 1));
    hot.join();
}
// Machine set-up commonly used for low-latency hosts (kernel boot parameters and tuning):
//   isolcpus=2-7 nohz_full=2-7 rcu_nocbs=2-7     keep the scheduler and timer ticks off hot cores
//   irqaffinity=0-1                              send hardware interrupts to housekeeping cores
//   cpupower frequency-set -g performance; disable deep C-states (no sleep → no wake-up latency)
//   disable hyper-threading siblings of hot cores; keep the NIC and hot threads on the same NUMA node
//   $ taskset -c 2 ./strategy     or   numactl --cpunodebind=0 --membind=0 ./strategy`, lang: 'cpp' },
        { kind: 'list', items: [
          '**Busy polling** burns a whole core at 100% but avoids the microseconds of being woken by the kernel.',
          '**One thread per isolated core** for the hot path (feed handler, strategy, order gateway), connected by SPSC queues (module 11).',
          '**NUMA**: on multi-socket servers, memory attached to the other socket is slower; keep threads, memory and the NIC together.',
        ] },
        { kind: 'check', q: 'Why busy-poll instead of blocking in epoll_wait?', options: ['Saves power', 'Avoids the latency of the kernel waking a sleeping thread', 'Required by UDP', 'Uses fewer cores'], answer: 1, hint: 'Napping chef.', explain: 'At the cost of a fully used core.' },
      ],
    },
    {
      id: 'hotpath',
      title: 'A hot path without surprises',
      blocks: [
        { kind: 'analogy', text: "The hot path is the few hundred lines that run on every market-data update. The goal isn't just fast on average but *boringly predictable*: no system calls, no allocations, no locks, no exceptions, no virtual calls the predictor can't learn, all data already in cache, and every rare case (errors, reconnects, logging) shipped off to another thread." },
        { kind: 'code', code: `#include <array>
#include <cstdint>

// Price-level book for one instrument: arrays indexed by tick offset (module 6), not a std::map.
struct Book {
    static constexpr int kLevels = 4096;
    std::int64_t base_tick;                          // price of index 0, in integer ticks (module 2)
    std::array<std::int64_t, kLevels> bid_qty{}, ask_qty{};
    int best_bid = -1, best_ask = kLevels;

    void on_update(bool is_bid, std::int64_t tick, std::int64_t qty) {
        int i = static_cast<int>(tick - base_tick);
        if (static_cast<unsigned>(i) >= kLevels) [[unlikely]] { recentre(tick); return; }   // rare: off the hot path
        auto& side = is_bid ? bid_qty : ask_qty;
        side[i] = qty;
        if (is_bid) { if (qty && i > best_bid) best_bid = i; else if (!qty && i == best_bid) rescan_bid(); }
        else        { if (qty && i < best_ask) best_ask = i; else if (!qty && i == best_ask) rescan_ask(); }
    }
    void rescan_bid() { while (best_bid >= 0 && bid_qty[best_bid] == 0) --best_bid; }
    void rescan_ask() { while (best_ask < kLevels && ask_qty[best_ask] == 0) ++best_ask; }
    void recentre(std::int64_t) { /* cold path: rebuild around the new price, log asynchronously */ }
};

// Checklist for code on the hot path:
//  ✓ fixed-size, pre-allocated, contiguous data          ✓ integer prices
//  ✓ no new/delete, no std::string building, no std::function captures that allocate
//  ✓ no exceptions thrown; no locks; no syscalls (logging → SPSC queue → logger thread)
//  ✓ predictable branches; rare cases out of line ([[unlikely]], separate functions)
//  ✓ pre-faulted, locked memory; warm caches (keep the hot loop running even when idle)`, lang: 'cpp' },
        { kind: 'check', q: 'Why use an array indexed by tick offset rather than std::map for price levels?', options: ['Less code', 'Contiguous memory and O(1) indexing, with no pointer chasing or allocation per level', 'std::map can\'t hold integers', 'Sorting'], answer: 1, hint: 'Modules 6 and 9.', explain: 'Most updates hit levels near the touch, which stay in cache.' },
      ],
    },
    {
      id: 'bypass',
      title: 'Kernel bypass, hardware & discipline',
      blocks: [
        { kind: 'analogy', text: "The kernel's network stack is a general-purpose post office: safe, fair and full of queues. Kernel bypass gives your process a private loading bay straight off the network card, polling packets from its memory without system calls or interrupts. Beyond that, firms move parts of the race into hardware (FPGAs on the NIC) and rent rack space next to the exchange's matching engine (co-location). Speed without discipline, though, just loses money faster." },
        { kind: 'list', items: [
          '**Kernel bypass**: Solarflare/AMD OpenOnload and ef_vi, NVIDIA (Mellanox) VMA, DPDK, AF_XDP. Often the single biggest software latency win.',
          '**Hardware timestamps** on the NIC (`SO_TIMESTAMPING`, PTP-synchronised clocks) give trustworthy wire-to-wire measurements.',
          '**FPGAs** handle feed parsing, simple decisions and risk checks in hundreds of nanoseconds.',
          '**Co-location** removes most wire distance; microwave links between data centres beat fibre because light travels faster through air than glass.',
          '**Discipline**: replay production market data in tests, deterministic simulation, kill switches, pre-trade risk limits enforced outside the strategy, and change control. The 2012 Knight Capital incident (around $440 million lost in 45 minutes from a bad deployment) is the classic cautionary tale.',
        ] },
        { kind: 'compare',
          python: `# Research, analytics, orchestration and monitoring; not on the microsecond hot path`,
          ts: `// Dashboards, internal tools and monitoring UIs`,
          go: `// Infrastructure services, gateways, tooling; GC pauses make it rare on the tightest paths`,
          java: `// Widely used for low-latency trading with GC-free coding styles (e.g. LMAX Disruptor)`,
          cpp: `// The hot path itself: feed handlers, books, strategies, order gateways`,
          note: 'Most trading firms use several of these, each where it fits.' },
        { kind: 'check', q: 'What does kernel bypass remove from the receive path?', options: ['The NIC', 'System calls, interrupts and the kernel network stack', 'The CPU cache', 'TCP'], answer: 1, hint: 'A private loading bay.', explain: 'The process polls the NIC\'s rings directly.' },
      ],
    },
  ],
  quiz: [
    { q: 'Tick-to-trade measures…', options: ['Order fill time at the exchange', 'Time from receiving market data to sending the resulting order', 'Strategy P&L', 'Network bandwidth'], answer: 1, explain: 'The whole relay.' },
    { q: 'Latency should be reported as…', options: ['The mean', 'Percentiles including the tail', 'The minimum only', 'Throughput'], answer: 1, explain: 'p99/p99.9 lose the money.' },
    { q: 'rdtsc reads…', options: ['Wall-clock time', 'The CPU\'s time-stamp counter in cycles', 'The NIC clock', 'The kernel tick'], answer: 1, explain: 'Needs an invariant TSC.' },
    { q: 'isolcpus is used to…', options: ['Speed up compiling', 'Keep the scheduler from placing other tasks on chosen cores', 'Disable caches', 'Enable SMT'], answer: 1, explain: 'With pinning.' },
    { q: 'Busy polling trades…', options: ['Latency for power/CPU', 'Correctness for speed', 'Memory for speed', 'Nothing'], answer: 0, explain: 'A core at 100%.' },
    { q: 'Which belongs on the hot path?', options: ['std::string formatting for logs', 'Pre-allocated arrays and integer arithmetic', 'Exceptions', 'Mutexes'], answer: 1, explain: 'Ship logging to another thread.' },
    { q: 'Kernel bypass libraries include…', options: ['epoll', 'DPDK, OpenOnload/ef_vi, AF_XDP', 'select', 'OpenSSL'], answer: 1, explain: 'User-space packet access.' },
    { q: 'Why must risk limits sit outside the strategy?', options: ['Speed', 'A buggy or killed strategy must not be able to bypass them', 'Regulation forbids C++', 'They\'re optional'], answer: 1, explain: 'Defence in depth.' },
  ],
}
