import type { Module } from '../types'

export const s09: Module = {
  n: 9,
  title: 'Virtual Memory & Allocation',
  tour: '9 · Virtual Memory',
  summary: 'Every process thinks it owns all of memory. How virtual addresses map to physical pages, page faults and the TLB, copy-on-write, mmap for files and shared memory, huge pages, and how allocators like malloc work, plus arenas and pmr for allocation-free hot paths.',
  topics: ['Address spaces & pages', 'Page faults & the TLB', 'mmap & shared memory', 'How malloc works', 'Arenas & std::pmr'],
  cpp23: ['`std::pmr` memory resources (C++17) let containers use arenas without changing their types much.', '`std::allocate_at_least` (C++23) lets allocators report the real size they returned.'],
  lessons: [
    {
      id: 'pages',
      title: 'Address spaces & pages',
      blocks: [
        { kind: 'analogy', text: "Each process gets its own map of a vast imaginary city (a 2⁴⁸-byte virtual address space). Only the streets it actually uses are linked to real buildings (physical memory), in 4 KB blocks called pages. The kernel keeps the map (the page table) and the CPU's memory unit translates every address on every access. Two processes can both use address 0x7fff… and mean completely different buildings." },
        { kind: 'code', code: `#include <cstdio>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <string>
#include <unistd.h>

int global = 1;

int main() {
    int local = 2;
    int* heap = static_cast<int*>(std::malloc(sizeof(int)));
    std::printf("page size %ld\\n", sysconf(_SC_PAGESIZE));                      // 4096
    std::printf("code %p\\nglobal %p\\nheap %p\\nstack %p\\n",
                (void*)&main, (void*)&global, (void*)heap, (void*)&local);
    std::ifstream maps("/proc/self/maps");                                     // this process's map
    for (std::string line; std::getline(maps, line);) std::cout << line << '\\n';
    std::free(heap);
}
// Typical layout, low → high: code (.text) | data/bss | heap ↑ … shared libraries … stack ↓` },
        { kind: 'check', q: 'Can two processes have valid pointers with the same numeric value pointing at different data?', options: ['No', 'Yes: each has its own virtual address space', 'Only threads', 'Only with mmap'], answer: 1, hint: 'Separate city maps.', explain: 'Threads in one process share an address space.' },
      ],
    },
    {
      id: 'faults',
      title: 'Page faults & the TLB',
      blocks: [
        { kind: 'analogy', text: "Allocating memory only reserves streets on the map; the buildings appear the first time you knock on a door. That first touch triggers a page fault: the kernel finds a free physical page, zeroes it and wires it in, costing roughly a microsecond or more. The TLB is the CPU's small cache of recent street-to-building translations; missing it means walking the page table." },
        { kind: 'code', code: `#include <chrono>
#include <cstdio>
#include <cstring>
#include <sys/mman.h>
#include <sys/resource.h>

long minor_faults() { rusage u{}; getrusage(RUSAGE_SELF, &u); return u.ru_minflt; }

int main() {
    const size_t n = 256ul << 20;                                   // 256 MB
    char* p = static_cast<char*>(mmap(nullptr, n, PROT_READ | PROT_WRITE,
                                      MAP_PRIVATE | MAP_ANONYMOUS, -1, 0));
    long f0 = minor_faults();
    auto t0 = std::chrono::steady_clock::now();
    std::memset(p, 1, n);                                           // first touch: fault per page
    double first = std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - t0).count();
    long f1 = minor_faults();
    t0 = std::chrono::steady_clock::now();
    std::memset(p, 2, n);                                           // pages already present
    double second = std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - t0).count();
    std::printf("first touch %.0f ms (%ld faults), second %.0f ms\\n", first, f1 - f0, second);
    munmap(p, n);
}
// Measured while writing this: first touch 137 ms (65,540 faults: one per 4 KB page), second 32 ms.` },
        { kind: 'list', items: [
          'Low-latency systems **pre-fault** memory at start-up (touch every page, or `mmap(..., MAP_POPULATE)`) and **lock** it (`mlockall(MCL_CURRENT | MCL_FUTURE)`) so no fault or swap ever hits the hot path.',
          '**Huge pages** (2 MB or 1 GB instead of 4 KB) cover far more memory per TLB entry, reducing TLB misses for large arrays and order books (`madvise(MADV_HUGEPAGE)` or hugetlbfs).',
        ] },
        { kind: 'check', q: 'Why is the first write to freshly allocated memory slower than the second?', options: ['Caches are cold only', 'Each first touch of a page triggers a page fault so the kernel can supply a physical page', 'malloc is slow', 'The TLB is disabled'], answer: 1, hint: 'Buildings appear on the first knock.', explain: 'Pre-fault at start-up to avoid this on the hot path.' },
      ],
    },
    {
      id: 'mmap',
      title: 'mmap & shared memory',
      blocks: [
        { kind: 'analogy', text: "`mmap` lets you treat a file as if it were an array in memory: the kernel loads pages on demand when you touch them and writes dirty ones back. Map the same region into two processes and they share one set of buildings, the fastest way for a market-data process to hand ticks to a strategy process on the same machine." },
        { kind: 'code', code: `#include <cstdio>
#include <cstring>
#include <fcntl.h>
#include <sys/mman.h>
#include <unistd.h>

struct Tick { long ts; double px; long qty; };

int main() {
    const char* name = "/ticks_demo";
    int fd = shm_open(name, O_CREAT | O_RDWR, 0600);     // POSIX shared memory object
    ftruncate(fd, sizeof(Tick) * 1024);
    auto* ring = static_cast<Tick*>(mmap(nullptr, sizeof(Tick) * 1024,
                                         PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0));
    ring[0] = {1, 2385.1, 5};                             // another process mapping /ticks_demo sees this
    std::printf("%.1f\\n", ring[0].px);
    munmap(ring, sizeof(Tick) * 1024);
    close(fd);
    shm_unlink(name);
}
// Reading a big file: mmap it and access like an array; the OS page cache does the buffering.
// Synchronising readers and writers across processes needs atomics in the shared region (module 11).` },
        { kind: 'check', q: 'What makes MAP_SHARED different from MAP_PRIVATE?', options: ['Speed', 'Writes are visible to other mappings (and the file); private writes are copy-on-write', 'Shared is read-only', 'Private uses huge pages'], answer: 1, hint: 'One set of buildings, or your own copies?', explain: 'fork uses copy-on-write for the same reason.' },
      ],
    },
    {
      id: 'malloc',
      title: 'How malloc works',
      blocks: [
        { kind: 'analogy', text: "`malloc` is a warehouse manager. Small requests are served from shelves of pre-cut boxes grouped by size, with per-thread caches so threads don't queue. Big requests get a fresh `mmap` straight from the kernel. `free` puts boxes back on the shelf rather than returning them to the kernel. It's well optimised, but its time per call varies, and occasionally it has to go to the kernel: a disaster on a microsecond budget." },
        { kind: 'code', code: `#include <algorithm>
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <vector>

int main() {
    std::vector<long long> ns;
    ns.reserve(1'000'000);
    for (int i = 0; i < 1'000'000; ++i) {
        auto t0 = std::chrono::steady_clock::now();
        void* p = std::malloc(64 + (i % 7) * 32);
        std::free(p);
        ns.push_back(std::chrono::duration_cast<std::chrono::nanoseconds>(
                         std::chrono::steady_clock::now() - t0).count());
    }
    std::sort(ns.begin(), ns.end());
    std::printf("p50 %lld ns  p99.99 %lld ns  max %lld ns\\n",
                ns[ns.size() / 2], ns[ns.size() * 9999 / 10000], ns.back());
}
// Measured while writing this: p50 26 ns, p99.99 186 ns, max 106,804 ns.
// The median is tiny; the worst call was 4,000× slower.` },
        { kind: 'list', items: [
          'Alternatives tuned for multithreaded servers: jemalloc, tcmalloc, mimalloc (often via `LD_PRELOAD`).',
          'Fragmentation: many sizes allocated and freed over days can leave memory full of unusable gaps.',
          'In C++, hidden allocations hide in `std::string` copies, `std::function`, `std::vector::push_back` growth and exceptions. Reserve capacity up front.',
        ] },
        { kind: 'check', q: 'Why avoid malloc on a latency-critical path?', options: ['It\'s always slow', 'Its time per call is unpredictable, with a long tail and occasional kernel calls', 'It leaks', 'It isn\'t thread-safe'], answer: 1, hint: 'Median vs tail.', explain: 'Allocate up front, reuse objects.' },
      ],
    },
    {
      id: 'arena',
      title: 'Arenas & std::pmr',
      blocks: [
        { kind: 'analogy', text: "An arena is a notepad: allocations are just \"use the next few lines\", and you never erase individual lines; you tear off the whole page at the end of a request or trading cycle. It's very fast and completely predictable. C++17's `std::pmr` lets standard containers use such a notepad by swapping in a different memory resource." },
        { kind: 'code', code: `#include <array>
#include <cstddef>
#include <cstdio>
#include <memory_resource>
#include <vector>

int main() {
    alignas(std::max_align_t) std::array<std::byte, 64 * 1024> buffer;    // 64 KB on the stack
    std::pmr::monotonic_buffer_resource arena(buffer.data(), buffer.size(),
                                              std::pmr::null_memory_resource());   // never fall back to malloc
    std::pmr::vector<double> px(&arena);
    px.reserve(1000);                       // carved from the buffer: no malloc
    for (int i = 0; i < 1000; ++i) px.push_back(2385.0 + i * 0.1);
    std::pmr::vector<int> qty({1, 2, 3}, &arena);
    std::printf("%zu %zu %.1f\\n", px.size(), qty.size(), px.back());   // 1000 3 2484.9
}   // the whole arena is released at once; individual deallocations are no-ops

// Object pools: pre-allocate N orders, hand them out and return them to a free list,
// so the hot path never allocates.` },
        { kind: 'check', q: 'Why pass `null_memory_resource()` as the upstream?', options: ['Speed', 'So exceeding the buffer throws instead of silently falling back to malloc', 'It zeroes memory', 'Required'], answer: 1, hint: 'What happens when the notepad runs out?', explain: 'A loud failure in testing beats a hidden malloc in production.' },
      ],
    },
  ],
  quiz: [
    { q: 'The usual page size on x86-64 Linux is…', options: ['512 bytes', '4 KB', '64 KB', '1 MB'], answer: 1, explain: 'Huge pages are 2 MB or 1 GB.' },
    { q: 'The TLB caches…', options: ['Data', 'Virtual-to-physical address translations', 'Instructions', 'Files'], answer: 1, explain: 'Huge pages reduce TLB misses.' },
    { q: 'A minor page fault occurs when…', options: ['A program crashes', 'A page is first touched and the kernel maps a physical page', 'The disk fails', 'A signal arrives'], answer: 1, explain: 'Major faults need disk I/O.' },
    { q: 'mlockall is used to…', options: ['Lock mutexes', 'Prevent pages from being swapped out', 'Speed up malloc', 'Share memory'], answer: 1, explain: 'With pre-faulting.' },
    { q: 'MAP_SHARED mappings…', options: ['Are private', 'Share writes between processes mapping the same object', 'Can\'t be written', 'Use the stack'], answer: 1, explain: 'Basis of shared-memory IPC.' },
    { q: 'fork is cheap for large processes because of…', options: ['Compression', 'Copy-on-write pages', 'Huge pages', 'Swap'], answer: 1, explain: 'Pages are copied only when written.' },
    { q: 'A monotonic buffer resource frees memory…', options: ['On each deallocate', 'All at once when the resource is released', 'Never', 'Randomly'], answer: 1, explain: 'Arena semantics.' },
    { q: 'The main problem with malloc in hot paths is…', options: ['Correctness', 'Unpredictable latency tail', 'Thread safety', 'Size limits'], answer: 1, explain: 'Pre-allocate and reuse.' },
  ],
}
