import type { StdEntry } from '../standard'

// The functions, APIs and tools a systems programmer reaches for most.
export const SYS_STANDARD: StdEntry[] = [
  {
    name: 'std::bit_cast / <bit>', header: '<bit>', cat: 'Bits & numbers', module: 1, since: 'C++20',
    summary: 'Reinterpret bits safely and manipulate them efficiently.',
    what: '`bit_cast` copies an object\'s representation into another type of the same size. `popcount`, `countl_zero`, `countr_zero`, `has_single_bit`, `bit_ceil`, `rotl` compile to single instructions; `byteswap` is C++23.',
    code: `auto u = std::bit_cast<std::uint64_t>(3.14);
std::popcount(0b1011u);          // 3
std::bit_ceil(100u);             // 128: next power of two for ring buffers
std::byteswap(0x01020304u);      // 0x04030201`,
    when: 'Parsing binary protocols, hashing, ring-buffer sizing, inspecting floats.',
  },
  {
    name: 'std::numeric_limits / std::cmp_*', header: '<limits> <utility>', cat: 'Bits & numbers', module: 1,
    summary: 'Know the range of a type; compare mixed signedness safely.',
    what: '`numeric_limits<T>::min/max/epsilon/digits10` describe a type. `std::cmp_less(a, b)` and friends compare signed and unsigned integers by value (C++20).',
    code: `std::numeric_limits<std::int32_t>::max();   // 2147483647
std::cmp_less(-1, 10u);                     // true (plain -1 < 10u is false)`,
    when: 'Bounds checks, overflow guards, loops mixing size_t and int.',
  },
  {
    name: '__builtin_*_overflow', header: 'GCC/Clang builtin', cat: 'Bits & numbers', module: 1,
    summary: 'Checked integer arithmetic.',
    what: 'Computes the result and returns true if it overflowed, without undefined behaviour. C++26 adds `std::add_sat`/`mul_sat` for saturating arithmetic.',
    code: `std::int64_t r;
if (__builtin_mul_overflow(qty, px_ticks, &r)) reject("notional overflow");`,
    when: 'Order validation and any arithmetic on untrusted sizes.',
  },
  {
    name: 'std::chrono::steady_clock', header: '<chrono>', cat: 'Measurement', module: 5,
    summary: 'A monotonic clock for measuring intervals.',
    what: 'Never jumps backwards (unlike `system_clock`, which follows NTP adjustments). About 20–30 ns per call on Linux via vDSO. Use `system_clock` only for wall-clock timestamps.',
    code: `auto t0 = std::chrono::steady_clock::now();
work();
auto ns = std::chrono::duration_cast<std::chrono::nanoseconds>(
              std::chrono::steady_clock::now() - t0).count();`,
    when: 'Benchmarks and latency histograms.',
  },
  {
    name: 'perf', header: 'Linux tool', cat: 'Measurement', module: 5,
    summary: 'Hardware-counter profiling.',
    what: '`perf stat` reports cycles, instructions (IPC), cache and branch misses; `perf record -g` samples where time goes; `perf report` shows the hottest functions and lines.',
    code: `perf stat -e cycles,instructions,cache-misses,branch-misses ./app
perf record -g ./app && perf report`,
    when: 'Before and after every optimisation.',
  },
  {
    name: 'alignas / hardware_destructive_interference_size', header: '<new>', cat: 'Memory layout', module: 6,
    summary: 'Control alignment; keep hot data on separate cache lines.',
    what: '`alignas(N)` aligns a type or member to N bytes. `std::hardware_destructive_interference_size` (64 on x86) is the spacing needed to avoid false sharing.',
    code: `struct Counters {
    alignas(std::hardware_destructive_interference_size) std::atomic<long> produced;
    alignas(std::hardware_destructive_interference_size) std::atomic<long> consumed;
};`,
    when: 'Per-thread counters, queue head/tail indices.',
  },
  {
    name: 'std::span', header: '<span>', cat: 'Memory layout', module: 4, since: 'C++20',
    summary: 'A non-owning view of contiguous memory with its length.',
    what: 'Replaces pointer + length pairs. Works with arrays, vectors and raw buffers; fixed-extent spans carry the size in the type.',
    code: `double mean(std::span<const double> xs) {
    double s = 0; for (double x : xs) s += x; return s / xs.size();
}
mean(prices);  mean({buf, n});`,
    when: 'Function parameters taking buffers; parsing packets in place.',
  },
  {
    name: 'mmap / munmap', header: '<sys/mman.h>', cat: 'Virtual memory', module: 9,
    summary: 'Map files or anonymous memory into the address space.',
    what: 'Anonymous mappings give large page-aligned buffers; file mappings let you access files as arrays; `MAP_SHARED` with `shm_open` shares memory between processes. `MAP_POPULATE` pre-faults.',
    code: `void* p = mmap(nullptr, size, PROT_READ | PROT_WRITE,
               MAP_PRIVATE | MAP_ANONYMOUS | MAP_POPULATE, -1, 0);
munmap(p, size);`,
    when: 'Big buffers, shared-memory IPC, reading huge files.',
  },
  {
    name: 'mlockall', header: '<sys/mman.h>', cat: 'Virtual memory', module: 9,
    summary: 'Keep memory resident: no swapping, no surprise faults.',
    what: 'Locks current (and optionally future) pages in RAM. Combine with pre-touching memory at start-up. Needs a sufficient `ulimit -l` or CAP_IPC_LOCK.',
    code: `if (mlockall(MCL_CURRENT | MCL_FUTURE) != 0) perror("mlockall");`,
    when: 'Low-latency processes at start-up.',
  },
  {
    name: 'std::pmr::monotonic_buffer_resource', header: '<memory_resource>', cat: 'Allocation', module: 9, since: 'C++17',
    summary: 'Arena allocation for standard containers.',
    what: 'Hands out memory by bumping a pointer through a buffer; deallocation is a no-op; everything is released together. Chain to `null_memory_resource()` to forbid hidden heap use.',
    code: `std::array<std::byte, 1 << 16> buf;
std::pmr::monotonic_buffer_resource arena(buf.data(), buf.size(), std::pmr::null_memory_resource());
std::pmr::vector<Order> orders(&arena);`,
    when: 'Per-message or per-cycle scratch memory on hot paths.',
  },
  {
    name: 'fork / execvp / waitpid', header: '<unistd.h> <sys/wait.h>', cat: 'Processes', module: 8,
    summary: 'Create, replace and reap processes.',
    what: '`fork` duplicates the process (copy-on-write); `exec*` replaces its program; `waitpid` collects the exit status. Flush stdio before exec. `posix_spawn` combines them efficiently.',
    code: `pid_t pid = fork();
if (pid == 0) { execlp("gzip", "gzip", "fills.log", nullptr); _exit(127); }
int st; waitpid(pid, &st, 0);`,
    when: 'Running helper programs; supervising worker processes.',
  },
  {
    name: 'sigaction', header: '<csignal>', cat: 'Processes', module: 8,
    summary: 'Install signal handlers reliably.',
    what: 'Preferred over `signal()`: defined semantics, masks and flags. Handlers should only set a lock-free atomic flag.',
    code: `struct sigaction sa{}; sa.sa_handler = on_term; sigemptyset(&sa.sa_mask);
sigaction(SIGTERM, &sa, nullptr);`,
    when: 'Graceful shutdown of services.',
  },
  {
    name: 'socket / setsockopt', header: '<sys/socket.h>', cat: 'Networking', module: 10,
    summary: 'Create and tune TCP and UDP endpoints.',
    what: '`socket(AF_INET, SOCK_STREAM|SOCK_DGRAM, 0)`, then `bind`/`listen`/`accept` or `connect`. Key options: `TCP_NODELAY`, `SO_REUSEADDR`, `SO_RCVBUF`, `IP_ADD_MEMBERSHIP` (multicast).',
    code: `int s = socket(AF_INET, SOCK_STREAM, 0);
int one = 1;
setsockopt(s, IPPROTO_TCP, TCP_NODELAY, &one, sizeof one);`,
    when: 'Order gateways (TCP), market-data feeds (UDP multicast).',
  },
  {
    name: 'epoll', header: '<sys/epoll.h>', cat: 'Networking', module: 10,
    summary: 'Wait on many descriptors at once.',
    what: 'Register descriptors with `epoll_ctl`; `epoll_wait` returns only those ready. Use non-blocking sockets and read until EAGAIN. A timeout of 0 makes it a busy-poll.',
    code: `int ep = epoll_create1(0);
epoll_event ev{.events = EPOLLIN, .data = {.fd = s}};
epoll_ctl(ep, EPOLL_CTL_ADD, s, &ev);
int n = epoll_wait(ep, events, 64, -1);`,
    when: 'Servers and feed handlers with many connections.',
  },
  {
    name: 'std::atomic', header: '<atomic>', cat: 'Concurrency', module: 11,
    summary: 'Lock-free shared variables with explicit ordering.',
    what: '`load`, `store`, `fetch_add`, `exchange`, `compare_exchange_*`, plus `wait`/`notify_one` (C++20). Choose `memory_order_relaxed` for counters and acquire/release for hand-overs.',
    code: `std::atomic<std::uint64_t> seq{0};
seq.fetch_add(1, std::memory_order_relaxed);
ready.store(true, std::memory_order_release);`,
    when: 'Flags, counters, sequence numbers, lock-free queues.',
  },
  {
    name: 'std::jthread / std::stop_token', header: '<thread> <stop_token>', cat: 'Concurrency', module: 8, since: 'C++20',
    summary: 'Threads that join automatically and can be asked to stop.',
    what: 'A `jthread` passes a `stop_token` to its function if it accepts one, calls `request_stop()` then `join()` in its destructor.',
    code: `std::jthread worker([](std::stop_token st) {
    while (!st.stop_requested()) poll();
});
worker.request_stop();`,
    when: 'Every long-running worker thread.',
  },
  {
    name: 'pthread_setaffinity_np', header: '<pthread.h>', cat: 'Low latency', module: 12,
    summary: 'Pin a thread to specific CPU cores.',
    what: 'Restricts a thread to a CPU set. Combine with isolated cores (`isolcpus`, `nohz_full`) so the hot thread keeps a warm cache and isn\'t preempted. `taskset` does the same from the shell.',
    code: `cpu_set_t set; CPU_ZERO(&set); CPU_SET(3, &set);
pthread_setaffinity_np(t.native_handle(), sizeof set, &set);`,
    when: 'Feed-handler, strategy and gateway threads.',
  },
  {
    name: 'Sanitizers', header: '-fsanitize=…', cat: 'Correctness', module: 4,
    summary: 'Catch memory errors, UB and data races in tests.',
    what: '`address` (out-of-bounds, use-after-free, leaks), `undefined` (overflow, bad shifts, misalignment), `thread` (data races). TSan can\'t be combined with ASan; run them as separate CI jobs.',
    code: `g++ -g -O1 -fsanitize=address,undefined app.cpp
g++ -g -O1 -fsanitize=thread app.cpp`,
    when: 'Every test run in CI.',
  },
]
