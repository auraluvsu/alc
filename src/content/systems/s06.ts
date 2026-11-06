import type { Module } from '../types'

export const s06: Module = {
  n: 6,
  title: 'The Memory Hierarchy & Caches',
  tour: '6 · The Memory Hierarchy',
  summary: 'Why memory access patterns often matter more than instruction counts: the hierarchy from registers to RAM, cache lines and locality, traversal order, pointer chasing vs contiguous data, array-of-structs vs struct-of-arrays, and false sharing between threads.',
  topics: ['The hierarchy', 'Cache lines & locality', 'Traversal order', 'Contiguous vs pointer-based', 'AoS vs SoA', 'False sharing'],
  cpp23: ['`std::hardware_destructive_interference_size` (C++17, implemented in GCC 12+) gives the padding needed to avoid false sharing.', '`std::flat_map` (C++23) stores keys and values in contiguous arrays for cache-friendly lookups.'],
  lessons: [
    {
      id: 'hierarchy',
      title: 'The hierarchy',
      blocks: [
        { kind: 'analogy', text: "Think of a chef. Registers are the knife in hand. L1 cache is the chopping board (a few nanoseconds away). L2 is the counter, L3 the kitchen shelves, and main memory is the warehouse across town: roughly 100 ns per trip, during which a modern core could have executed several hundred instructions. Most performance work is about keeping what you need on the board." },
        { kind: 'list', items: [
          '**Registers**: ~0 cycles, a few hundred bytes.',
          '**L1d cache**: ~4–5 cycles (~1 ns), 32–48 KB per core.',
          '**L2 cache**: ~12–15 cycles, 1–2 MB per core.',
          '**L3 cache**: ~40–60 cycles, tens to hundreds of MB shared.',
          '**DRAM**: ~200–300 cycles (~80–100 ns), gigabytes.',
          '**NVMe SSD**: ~10–100 µs. **Network across a data centre**: ~10–100 µs. **London → New York**: ~30 ms one way.',
        ] },
        { kind: 'code', code: `$ lscpu | grep -E "L1d|L2|L3"
L1d cache:   96 KiB (2 instances)     ← 48 KiB per core on the machine used to write this
L2 cache:    4 MiB (2 instances)
L3 cache:    260 MiB (1 instance)
$ getconf LEVEL1_DCACHE_LINESIZE
64`, lang: 'cpp', caption: 'Inspecting the cache hierarchy on Linux.' },
        { kind: 'check', q: 'Roughly how many times slower is a DRAM access than an L1 hit?', options: ['2×', '10×', '50–100×', '1,000,000×'], answer: 2, hint: '~1 ns vs ~80–100 ns.', explain: 'That gap is why cache-friendly code wins.' },
      ],
    },
    {
      id: 'lines',
      title: 'Cache lines & locality',
      blocks: [
        { kind: 'analogy', text: "Memory isn't fetched byte by byte but in 64-byte cache lines, like the warehouse only shipping whole boxes. Touch one double and its seven neighbours arrive free. *Spatial locality* (using nearby data next) gets the free neighbours; *temporal locality* (reusing data soon) finds it still on the board. Hardware prefetchers also notice steady strides and start fetching the next boxes before you ask." },
        { kind: 'code', code: `#include <chrono>
#include <cstdio>
#include <vector>

int main() {
    std::vector<long> v(64 * 1024 * 1024 / sizeof(long));      // 64 MB: bigger than L2
    for (int stride : {1, 2, 4, 8, 16, 32}) {
        auto t0 = std::chrono::steady_clock::now();
        for (size_t i = 0; i < v.size(); i += stride) v[i] *= 3;
        double ms = std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - t0).count();
        std::printf("stride %2d: %6.1f ms  (%zu updates)\\n", stride, ms, v.size() / stride);
    }
}
// Measured while writing this:
//   stride 1: 9.6 ms   stride 2: 7.7   stride 4: 6.4   stride 8: 4.8   stride 16: 3.3   stride 32: 2.7
// Stride 8 does 8× fewer updates but is only 2× faster: every 64-byte line (8 longs) is still
// fetched from memory. Time follows the number of cache lines touched, not the arithmetic.` },
        { kind: 'check', q: 'Why is stride 8 (on 8-byte longs) only about 2× faster than stride 1, despite 8× fewer updates?', options: ['Timer resolution', 'Both still fetch every 64-byte cache line, so memory traffic barely changes', 'The compiler ignores stride', 'Prefetching is disabled'], answer: 1, hint: 'Whole boxes.', explain: 'Bandwidth, not arithmetic, is the cost.' },
      ],
    },
    {
      id: 'traversal',
      title: 'Traversal order',
      blocks: [
        { kind: 'analogy', text: "A 2-D array in C++ is stored row by row. Walking along a row reads consecutive memory, one box after another. Walking down a column jumps a whole row's width every step, landing in a new box each time. Same arithmetic, very different number of trips to the warehouse." },
        { kind: 'code', code: `#include <chrono>
#include <cstdio>
#include <vector>

int main() {
    const int N = 4096;
    std::vector<double> m(static_cast<size_t>(N) * N, 1.0);   // 128 MB, row-major
    auto time = [&](auto f) {
        auto t0 = std::chrono::steady_clock::now(); double s = f();
        double ms = std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - t0).count();
        std::printf("%8.1f ms (sum %.0f)\\n", ms, s);
    };
    time([&] { double s = 0; for (int r = 0; r < N; ++r) for (int c = 0; c < N; ++c) s += m[r * N + c]; return s; });
    time([&] { double s = 0; for (int c = 0; c < N; ++c) for (int r = 0; r < N; ++r) s += m[r * N + c]; return s; });
}
// Measured while writing this: rows 18 ms, columns 184 ms. Ten times slower, same arithmetic.` },
        { kind: 'p', text: 'NumPy and pandas inherit exactly this: a C-ordered array summed along `axis=1` streams memory, while `axis=0` strides (Python module 26). For matrix multiplication, blocking (tiling) keeps sub-matrices in cache; BLAS libraries do this for you, which is one reason never to hand-write naive triple loops for big matrices.' },
        { kind: 'check', q: 'For a row-major matrix, which loop order is cache-friendly?', options: ['Outer columns, inner rows', 'Outer rows, inner columns', 'Either', 'Random'], answer: 1, hint: 'Walk along the row.', explain: 'The inner loop should move through contiguous memory.' },
      ],
    },
    {
      id: 'contiguous',
      title: 'Contiguous vs pointer-based structures',
      blocks: [
        { kind: 'analogy', text: "A `std::vector` is a row of houses on one street: visit them in order and the prefetcher brings each next box early. A `std::list` or tree is a treasure hunt where each clue (pointer) reveals the next location, possibly across town. The CPU can't fetch the next node until it has read the current one, so every step can cost a full trip to RAM." },
        { kind: 'code', code: `#include <algorithm>
#include <chrono>
#include <cstdio>
#include <list>
#include <numeric>
#include <random>
#include <vector>

int main() {
    const int n = 5'000'000;
    std::vector<long> vec(n); std::iota(vec.begin(), vec.end(), 0);
    std::list<long> lst;
    { std::vector<long> tmp(vec); std::shuffle(tmp.begin(), tmp.end(), std::mt19937{1});
      for (long x : tmp) lst.push_back(x); }                  // nodes allocated in scattered order is typical
    auto time = [](const char* name, auto& c) {
        auto t0 = std::chrono::steady_clock::now();
        long s = std::accumulate(c.begin(), c.end(), 0L);
        std::printf("%-6s %7.1f ms (%ld)\\n", name,
            std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - t0).count(), s);
    };
    time("vector", vec);
    time("list", lst);
}
// Measured while writing this: vector 5 ms, list 22 ms. Same additions; the gap is memory latency.` },
        { kind: 'list', items: [
          'Default to `std::vector`. Inserting in the middle of a vector is O(n) but often still beats a list in practice, because moving contiguous memory is fast.',
          'For small sorted maps, a sorted vector or `std::flat_map` (C++23) beats `std::map` (a node-based red-black tree).',
          'Order books in low-latency systems are typically arrays indexed by price level, not trees of pointers.',
        ] },
        { kind: 'check', q: 'Why is traversing a linked list slow even with the same number of operations?', options: ['More instructions', 'Each node\'s address is only known after loading the previous node, so cache misses can\'t overlap', 'Lists are unsorted', 'Virtual calls'], answer: 1, hint: 'Treasure hunt.', explain: 'Pointer chasing defeats the prefetcher.' },
      ],
    },
    {
      id: 'soa',
      title: 'AoS vs SoA & false sharing',
      blocks: [
        { kind: 'analogy', text: "If you only need prices, an array of whole tick structs (AoS) makes you haul every field into cache to read one: a lorry delivering full shopping trolleys when you wanted the milk. A struct of separate arrays (SoA) packs just the prices together. False sharing is the multithreaded twist: two threads writing different variables that happen to share one cache line keep stealing the line from each other, like two chefs fighting over one chopping board." },
        { kind: 'code', code: `#include <atomic>
#include <chrono>
#include <cstdio>
#include <new>
#include <thread>

struct Shared  { std::atomic<long> a{0}; std::atomic<long> b{0}; };             // same 64-byte line
struct Padded  { alignas(std::hardware_destructive_interference_size) std::atomic<long> a{0};
                 alignas(std::hardware_destructive_interference_size) std::atomic<long> b{0}; };

template <class T> double run() {
    T s;
    auto t0 = std::chrono::steady_clock::now();
    std::thread t1([&] { for (int i = 0; i < 50'000'000; ++i) s.a.fetch_add(1, std::memory_order_relaxed); });
    std::thread t2([&] { for (int i = 0; i < 50'000'000; ++i) s.b.fetch_add(1, std::memory_order_relaxed); });
    t1.join(); t2.join();
    return std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - t0).count();
}

int main() {
    std::printf("same line: %.0f ms\\npadded:    %.0f ms\\n", run<Shared>(), run<Padded>());
    std::printf("%zu\\n", std::hardware_destructive_interference_size);   // 64 on x86-64
}
// Measured while writing this: same line 1,732 ms, padded 283 ms. The threads never touch
// each other's counter, yet sharing one cache line makes them 6× slower.`, lang: 'cpp' },
        { kind: 'check', q: 'What causes false sharing?', options: ['Two threads sharing one variable', 'Two threads writing different variables on the same cache line', 'Reading shared constants', 'Too many threads'], answer: 1, hint: 'Fighting over one board.', explain: 'Pad or align hot per-thread data to separate lines.' },
      ],
    },
  ],
  quiz: [
    { q: 'A typical x86 cache line is…', options: ['8 bytes', '64 bytes', '4 KB', '1 MB'], answer: 1, explain: 'The unit of transfer.' },
    { q: 'Spatial locality means…', options: ['Reusing the same data soon', 'Using data near recently used data', 'Using threads near each other', 'Using the GPU'], answer: 1, explain: 'Temporal is reuse soon.' },
    { q: 'DRAM latency is roughly…', options: ['1 ns', '80–100 ns', '1 ms', '1 s'], answer: 1, explain: 'Hundreds of cycles.' },
    { q: 'Summing a row-major matrix column by column is slow because…', options: ['More additions', 'Each access jumps to a new cache line', 'Columns are unaligned', 'Branches'], answer: 1, explain: 'Poor spatial locality.' },
    { q: 'std::list traversal is slow mainly due to…', options: ['Virtual functions', 'Pointer chasing and cache misses', 'Exceptions', 'Bounds checks'], answer: 1, explain: 'Latency can\'t overlap.' },
    { q: 'Struct-of-arrays helps when…', options: ['You always use every field', 'Loops touch only a few fields of many records', 'Records are tiny', 'Using lists'], answer: 1, explain: 'Less wasted bandwidth, better SIMD.' },
    { q: 'False sharing is fixed by…', options: ['More threads', 'Placing per-thread hot data on separate cache lines', 'Using volatile', 'Disabling caches'], answer: 1, explain: 'alignas(64) / hardware_destructive_interference_size.' },
    { q: 'Hardware prefetchers work best with…', options: ['Random access', 'Sequential or constant-stride access', 'Linked lists', 'Hash tables'], answer: 1, explain: 'Predictable patterns.' },
  ],
}
