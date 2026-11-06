import type { DictEntry } from '../types'

export const SYS_DICT: DictEntry[] = [
  // ---------- Data representation ----------
  { term: 'Two\'s complement', cat: 'Data', module: 1, desc: 'Signed integers where the top bit has negative weight; negate = flip bits and add one.', syntax: `int8_t x = -5;   // 1111 1011` },
  { term: 'Signed overflow', cat: 'Data', module: 1, desc: 'Undefined behaviour in C++; the optimiser assumes it never happens. Unsigned overflow wraps.', syntax: `__builtin_add_overflow(a, b, &r)   // checked add` },
  { term: 'Endianness', cat: 'Data', module: 1, desc: 'Byte order of multi-byte values. x86 is little-endian; network order is big-endian.', syntax: `std::byteswap(x); htonl(x); std::endian::native` },
  { term: 'std::bit_cast', cat: 'Data', module: 1, desc: 'Reinterpret an object\'s bits as another trivially copyable type without UB.', syntax: `auto bits = std::bit_cast<std::uint32_t>(1.0f);`, since: 'C++20' },
  { term: 'IEEE 754', cat: 'Data', module: 2, desc: 'Floating-point format: sign, biased exponent, fraction. double ≈ 15–17 significant digits.', syntax: `std::numeric_limits<double>::epsilon()` },
  { term: 'NaN', cat: 'Data', module: 2, desc: 'Not-a-Number: propagates through arithmetic; every ordered comparison is false; NaN != NaN.', syntax: `std::isnan(x)` },
  { term: 'Fixed-point / ticks', cat: 'Data', module: 2, desc: 'Prices stored as integers (ticks or scaled units) for exact comparison and arithmetic.', syntax: `std::int64_t ticks = std::llround(px / tick);` },
  // ---------- Machine level ----------
  { term: 'Register', cat: 'Machine', module: 3, desc: 'The CPU\'s fastest storage; x86-64 has 16 general-purpose 64-bit registers.', syntax: `rax rbx rcx rdx rsi rdi rbp rsp r8–r15` },
  { term: 'Calling convention (SysV)', cat: 'Machine', module: 3, desc: 'Linux x86-64: integer args in rdi, rsi, rdx, rcx, r8, r9; return in rax; floats in xmm0–7.', syntax: `long f(long a /*rdi*/, long b /*rsi*/);` },
  { term: 'Stack frame', cat: 'Machine', module: 4, desc: 'A function\'s region of the stack: locals, saved registers and the return address. The stack grows down.', syntax: `push rbp; mov rbp, rsp; sub rsp, 16` },
  { term: 'Buffer overflow', cat: 'Machine', module: 4, desc: 'Writing past an array\'s end, corrupting neighbours such as the return address.', syntax: `g++ -fsanitize=address -fstack-protector-strong` },
  { term: 'Alignment & padding', cat: 'Machine', module: 4, desc: 'Members sit at multiples of their alignment; the compiler pads structs to keep them aligned.', syntax: `alignof(double); alignas(64) struct X {...};` },
  // ---------- Performance ----------
  { term: 'Latency vs throughput', cat: 'Performance', module: 5, desc: 'Cycles until a result is ready vs how many operations can start per cycle.', syntax: `// split dependency chains: a+=…; b+=…; c+=…; d+=…;` },
  { term: 'Branch misprediction', cat: 'Performance', module: 5, desc: 'A wrong guess about a branch flushes the pipeline (~15–20 cycles).', syntax: `perf stat -e branch-misses ./app` },
  { term: 'SIMD', cat: 'Performance', module: 5, desc: 'One instruction operating on several values (AVX2: 4 doubles). Compilers auto-vectorise simple loops.', syntax: `g++ -O3 -march=native -fopt-info-vec` },
  { term: 'Cache line', cat: 'Memory', module: 6, desc: 'The 64-byte unit in which memory moves between RAM and caches.', syntax: `getconf LEVEL1_DCACHE_LINESIZE   # 64` },
  { term: 'Locality', cat: 'Memory', module: 6, desc: 'Spatial: use nearby data next. Temporal: reuse data soon. Both keep data in cache.', syntax: `for (r) for (c) m[r*N + c]   // row-major order` },
  { term: 'False sharing', cat: 'Memory', module: 6, desc: 'Threads writing different variables on the same cache line slow each other down.', syntax: `alignas(std::hardware_destructive_interference_size) std::atomic<long> c;` },
  // ---------- OS ----------
  { term: 'ODR', cat: 'Linking', module: 7, desc: 'One-definition rule: each non-inline entity defined once program-wide; violations can be silent UB.', syntax: `namespace { struct Private {}; }` },
  { term: 'Shared library (.so)', cat: 'Linking', module: 7, desc: 'Code loaded at start-up or with dlopen; position-independent (-fPIC).', syntax: `g++ -fPIC -shared x.cpp -o libx.so; ldd app` },
  { term: 'System call', cat: 'OS', module: 8, desc: 'A request to the kernel (read, write, mmap…). Returns -1 and sets errno on failure.', syntax: `if (read(fd, buf, n) == -1) perror("read");` },
  { term: 'fork / exec', cat: 'OS', module: 8, desc: 'fork copies the process (copy-on-write); exec replaces its program; wait reaps the child.', syntax: `if (fork() == 0) execlp("ls", "ls", nullptr);` },
  { term: 'Signal', cat: 'OS', module: 8, desc: 'Asynchronous notification (SIGINT, SIGTERM, SIGSEGV). Handlers may only do async-signal-safe work.', syntax: `sigaction(SIGTERM, &sa, nullptr);` },
  { term: 'Page fault', cat: 'Memory', module: 9, desc: 'Access to a page not yet mapped; the kernel supplies it (minor) or reads it from disk (major).', syntax: `mmap(..., MAP_POPULATE, ...); mlockall(MCL_CURRENT | MCL_FUTURE);` },
  { term: 'TLB', cat: 'Memory', module: 9, desc: 'Cache of virtual-to-physical translations. Huge pages cover more memory per entry.', syntax: `madvise(p, n, MADV_HUGEPAGE);` },
  { term: 'Arena allocator', cat: 'Memory', module: 9, desc: 'Allocate by bumping a pointer; free everything at once. Predictable and fast.', syntax: `std::pmr::monotonic_buffer_resource arena(buf, size);`, since: 'C++17' },
  { term: 'File descriptor', cat: 'I/O', module: 10, desc: 'Small integer handle for files, pipes and sockets. 0/1/2 = stdin/stdout/stderr.', syntax: `int fd = open(path, O_RDONLY); close(fd);` },
  { term: 'epoll', cat: 'I/O', module: 10, desc: 'Linux readiness notification for many descriptors at once.', syntax: `epoll_wait(ep, events, 64, timeout_ms);` },
  { term: 'TCP_NODELAY', cat: 'I/O', module: 10, desc: 'Disable Nagle\'s algorithm so small messages are sent immediately.', syntax: `setsockopt(s, IPPROTO_TCP, TCP_NODELAY, &one, sizeof one);` },
  // ---------- Concurrency & latency ----------
  { term: 'Data race', cat: 'Concurrency', module: 11, desc: 'Unsynchronised concurrent access with at least one write: undefined behaviour.', syntax: `g++ -fsanitize=thread` },
  { term: 'Acquire / release', cat: 'Concurrency', module: 11, desc: 'A release store publishes prior writes to a thread whose acquire load reads it.', syntax: `flag.store(true, std::memory_order_release); flag.load(std::memory_order_acquire);` },
  { term: 'SPSC queue', cat: 'Concurrency', module: 11, desc: 'Lock-free ring buffer for exactly one producer and one consumer thread.', syntax: `head_.store(h + 1, std::memory_order_release);` },
  { term: 'Tick-to-trade', cat: 'Low latency', module: 12, desc: 'Time from receiving market data to sending the resulting order.', syntax: `// timestamp each stage; report p50/p99/p99.9` },
  { term: 'CPU pinning', cat: 'Low latency', module: 12, desc: 'Bind a thread to one core (often an isolated one) so it keeps warm caches and isn\'t preempted.', syntax: `pthread_setaffinity_np(t.native_handle(), sizeof set, &set);` },
  { term: 'Kernel bypass', cat: 'Low latency', module: 12, desc: 'Reading and writing packets from user space directly to the NIC, skipping the kernel stack.', syntax: `// DPDK, OpenOnload/ef_vi, AF_XDP` },
]
