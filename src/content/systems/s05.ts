import type { Module } from '../types'

export const s05: Module = {
  n: 5,
  title: 'Optimising Program Performance',
  tour: '5 · Optimizing Program Performance',
  summary: 'How modern CPUs actually execute code: pipelines and instruction-level parallelism, latency vs throughput, breaking dependency chains, branch prediction and why sorted data can run several times faster, SIMD vectorisation, and measuring before optimising.',
  topics: ['Measure first', 'Pipelines & ILP', 'Dependency chains', 'Branch prediction', 'SIMD vectorisation'],
  cpp23: ['`[[likely]]` / `[[unlikely]]` (C++20) hint branch layout.', '`std::experimental::simd` (Parallelism TS 2, shipped with GCC 11+); `std::simd` is adopted for C++26.'],
  lessons: [
    {
      id: 'measure',
      title: 'Measure first',
      blocks: [
        { kind: 'analogy', text: "Optimising without measuring is tuning a car engine by ear in the dark. Profile first to find where the time goes (it's rarely where you'd guess), change one thing, and measure again with enough repetitions to see past the noise. And check the compiler hasn't simply deleted the code you're timing because its result was never used." },
        { kind: 'code', code: `#include <chrono>
#include <cstdio>

template <class F>
double best_ms(F&& f, int reps = 7) {
    double best = 1e300;
    for (int r = 0; r < reps; ++r) {
        auto t0 = std::chrono::steady_clock::now();
        f();
        double ms = std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - t0).count();
        if (ms < best) best = ms;
    }
    return best;                       // the minimum is least disturbed by noise
}

template <class T> inline void do_not_optimise(T const& v) { asm volatile("" : : "g"(v) : "memory"); }

// Tools: perf stat ./prog   (cycles, instructions, IPC, branch-misses, cache-misses)
//        perf record -g ./prog && perf report      (where the time goes)
//        Google Benchmark, nanobench          (micro-benchmark libraries that handle all this)

int main() {
    long s = 0;
    std::printf("%.3f ms\\n", best_ms([&] { for (long i = 0; i < 100'000'000; ++i) s += i; do_not_optimise(s); }));
}   // prints 0.000 ms at -O2: GCC replaced the whole loop with a formula (see the pitfall below)` },
        { kind: 'pitfall', text: 'At -O2 a loop whose result is never used may be deleted entirely, and you\'ll "measure" 0 ns. A loop like the one above may also be replaced by a closed-form formula. Always consume results (or use a benchmark library\'s `DoNotOptimize`) and sanity-check that timings scale with problem size.' },
        { kind: 'check', q: 'Why report the minimum of several runs for a micro-benchmark?', options: ['It flatters the code', 'Noise (interrupts, other processes) only ever adds time', 'The mean is wrong', 'Required by chrono'], answer: 1, hint: 'Noise is one-sided.', explain: 'For latency distributions, report percentiles instead (module 12).' },
      ],
    },
    {
      id: 'ilp',
      title: 'Pipelines & instruction-level parallelism',
      blocks: [
        { kind: 'analogy', text: "A modern core is an assembly line that's also several lines wide: it fetches several instructions per cycle and executes independent ones simultaneously, out of order, then puts results back in program order. An add takes about one cycle of *latency*, but the core can start several adds every cycle (*throughput*) as long as they don't depend on each other." },
        { kind: 'list', items: [
          '**Latency**: cycles from inputs ready to result ready (integer add ≈ 1, multiply ≈ 3, double add ≈ 3–4, divide ≈ 20–40, L1 load ≈ 4–5, main-memory load ≈ 200+).',
          '**Throughput**: how many such operations can start per cycle (often 2–4 for adds and loads).',
          '**IPC** (instructions per cycle) from `perf stat` tells you how well you\'re using the width: well-tuned loops hit 2–4; memory-bound code may sit below 0.5.',
          'The CPU can only overlap work that is **independent**: dependency chains are the limit (next lesson).',
        ] },
        { kind: 'check', q: 'A double-precision add has ~4 cycles latency but throughput of 2 per cycle. What limits a loop where each add needs the previous result?', options: ['Throughput', 'Latency: each add waits for the previous one', 'Memory', 'Nothing'], answer: 1, hint: 'A chain can\'t overlap.', explain: 'Split into independent chains to use the throughput.' },
      ],
    },
    {
      id: 'chains',
      title: 'Breaking dependency chains',
      blocks: [
        { kind: 'analogy', text: "Summing a column with one running total is one cashier counting every coin in sequence. Four running totals combined at the end is four cashiers counting in parallel. Same answer (up to floating-point rounding), several times faster, because the CPU can now overlap four independent chains of additions." },
        { kind: 'code', code: `#include <cstdio>
#include <vector>
// (best_ms and do_not_optimise from lesson 1)

double sum1(const std::vector<double>& v) {
    double s = 0;
    for (double x : v) s += x;                    // one chain: each add waits ~4 cycles
    return s;
}
double sum4(const std::vector<double>& v) {
    double a = 0, b = 0, c = 0, d = 0;            // four independent chains
    size_t i = 0, n = v.size();
    for (; i + 4 <= n; i += 4) { a += v[i]; b += v[i+1]; c += v[i+2]; d += v[i+3]; }
    for (; i < n; ++i) a += v[i];
    return (a + b) + (c + d);
}

int main() {
    std::vector<double> v(10'000, 1.0);           // 80 KB: stays in cache, so arithmetic is the limit
    double r1, r4;
    std::printf("sum1 %.2f ms\\n", best_ms([&] { for (int k = 0; k < 1000; ++k) { r1 = sum1(v); do_not_optimise(r1); } }));
    std::printf("sum4 %.2f ms\\n", best_ms([&] { for (int k = 0; k < 1000; ++k) { r4 = sum4(v); do_not_optimise(r4); } }));
}
// Measured while writing this (Xeon, GCC 13, -O2): sum1 6.2 ms, sum4 2.1 ms, about 3× faster.
// With a 10-million-element vector the gain shrinks to ~1.3×: then memory bandwidth is the limit (module 6).
// The compiler won't do this itself for doubles without -ffast-math: it changes rounding.` },
        { kind: 'check', q: 'Why doesn\'t the compiler split `sum1` into several accumulators automatically?', options: ['It can\'t see the loop', 'Floating-point addition isn\'t associative, so reordering changes the result', 'Too many registers', 'It always does'], answer: 1, hint: 'Module 2.', explain: 'For integers it will, since integer addition is associative.' },
      ],
    },
    {
      id: 'branches',
      title: 'Branch prediction',
      blocks: [
        { kind: 'analogy', text: "The pipeline can't wait to find out which way an `if` goes, so the CPU guesses and starts working down the guessed path. Guess right and the branch is free; guess wrong and it throws away 15–20 cycles of work. Patterns it can learn (always taken, alternating, sorted data) are cheap; random data is expensive." },
        { kind: 'code', code: `#include <algorithm>
#include <cstdio>
#include <random>
#include <vector>

long count_big(const std::vector<int>& v) {
    long total = 0;
    for (int x : v)
        if (x >= 128) total += x;          // branch depends on the data
    return total;
}

int main() {
    std::vector<int> v(10'000'000);
    std::mt19937 rng(0);
    for (int& x : v) x = rng() % 256;
    long r;
    std::printf("random %.2f ms\\n", best_ms([&] { r = count_big(v); do_not_optimise(r); }));
    std::sort(v.begin(), v.end());
    std::printf("sorted %.2f ms\\n", best_ms([&] { r = count_big(v); do_not_optimise(r); }));
}
// Measured while writing this:
//   g++ -O1 -fno-if-conversion -fno-tree-vectorize  (forces a real branch):  random 43 ms, sorted 13 ms
//   g++ -O2                                          (compiler goes branch-free): random 19 ms, sorted 19 ms
// Check the assembly before trusting any benchmark about branches.` },
        { kind: 'list', items: [
          '`perf stat -e branch-misses` shows how often the predictor is wrong.',
          'Branch-free alternatives: arithmetic (`total += (x >= 128) * x`), `std::min/max`, lookup tables.',
          '`[[likely]]` / `[[unlikely]]` only affect code layout; they can\'t fix an unpredictable branch.',
          'In trading code, keep the hot path\'s branches predictable and move rare cases (errors, reconnects) out of line.',
        ] },
        { kind: 'check', q: 'Why can the same loop run much faster on sorted data?', options: ['Sorted data is smaller', 'The branch becomes predictable: all false, then all true', 'Caching only', 'Sorting vectorises it'], answer: 1, hint: 'The CPU\'s guesses.', explain: 'Random data mispredicts about half the time.' },
      ],
    },
    {
      id: 'simd',
      title: 'SIMD vectorisation',
      blocks: [
        { kind: 'analogy', text: "SIMD (single instruction, multiple data) is a wide stamp: one instruction adds 4 doubles (AVX2) or 8 (AVX-512) at once. Compilers vectorise simple loops automatically at -O2/-O3 when they can prove it's safe: contiguous data, no aliasing, no loop-carried dependencies. Writing loops in that simple shape is usually all you need." },
        { kind: 'code', code: `#include <cstddef>

// Vectorises well: contiguous arrays, independent iterations, restrict-style promise of no aliasing
void scale_add(double* __restrict out, const double* __restrict a,
               const double* __restrict b, double k, std::size_t n) {
    for (std::size_t i = 0; i < n; ++i) out[i] = a[i] * k + b[i];
}

// Won't vectorise: each iteration depends on the previous one
void prefix(double* x, std::size_t n) { for (std::size_t i = 1; i < n; ++i) x[i] += x[i - 1]; }

// Check what the compiler did:
//   g++ -O3 -march=native -fopt-info-vec-optimized   → "loop vectorized using 32 byte vectors"
//   g++ -O3 -fopt-info-vec-missed                     → why a loop was NOT vectorised
// -march=native enables the host's widest SIMD (AVX2/AVX-512), but the binary may not run on older CPUs.`, lang: 'cpp' },
        { kind: 'pitfall', text: 'Data layout decides whether vectorisation is possible. An array of `struct Tick { double px; int qty; char side; }` (array of structs) interleaves fields, so loading 4 prices needs a gather. Separate arrays per field (struct of arrays) give the contiguous runs SIMD wants; module 6 measures the cache side of the same choice.' },
        { kind: 'check', q: 'What does `__restrict` tell the compiler?', options: ['Make it read-only', 'These pointers don\'t alias each other, so it may reorder and vectorise freely', 'Use the stack', 'Disable optimisation'], answer: 1, hint: 'Could writing out[i] change a[i+1]?', explain: 'Without it the compiler must assume they might overlap.' },
      ],
    },
  ],
  quiz: [
    { q: 'The first step in optimising should be…', options: ['Rewriting in assembly', 'Measuring and profiling', 'Adding threads', 'Using -O3'], answer: 1, explain: 'Find the real hotspot.' },
    { q: 'A benchmark reports 0 ns. Most likely…', options: ['Great code', 'The compiler removed the unused computation', 'Timer bug', 'Cache hit'], answer: 1, explain: 'Consume the result.' },
    { q: 'Instruction latency means…', options: ['Instructions per second', 'Cycles until an instruction\'s result is available', 'Pipeline width', 'Clock speed'], answer: 1, explain: 'Throughput is how many can start per cycle.' },
    { q: 'Multiple accumulators speed up a sum because…', options: ['Fewer additions', 'Independent dependency chains can execute in parallel', 'Less memory', 'Better rounding'], answer: 1, explain: 'Uses the CPU\'s width.' },
    { q: 'A branch misprediction costs roughly…', options: ['0 cycles', '15–20 cycles', '1,000 cycles', '1 ms'], answer: 1, explain: 'Pipeline flush.' },
    { q: 'perf stat\'s IPC measures…', options: ['Inputs per call', 'Instructions per cycle', 'Interrupts per core', 'I/O per cycle'], answer: 1, explain: 'How well the core\'s width is used.' },
    { q: 'SIMD stands for…', options: ['Single instruction, multiple data', 'Simple integer math division', 'Serial input multiple devices', 'Scalar instruction mode'], answer: 0, explain: 'One instruction, many lanes.' },
    { q: 'Which loop is hard to vectorise?', options: ['out[i] = a[i] + b[i]', 'x[i] += x[i-1]', 'out[i] = a[i] * 2', 'sum of a[i] with -ffast-math'], answer: 1, explain: 'Loop-carried dependency.' },
  ],
}
