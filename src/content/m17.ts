import type { Module } from './types'

export const m17: Module = {
  n: 17,
  title: 'Numerics',
  tour: '17 · Numerics',
  summary: 'Maths functions, numerical algorithms, complex numbers, proper random number generation, vector arithmetic, the limits of numeric types, and mathematical constants.',
  topics: ['Mathematical functions', 'Numerical algorithms', 'Complex numbers', 'Random numbers', 'Vector arithmetic', 'Numeric limits & type aliases', 'Mathematical constants'],
  cpp23: [
    'Many `<cmath>` functions (`abs`, `fmin`, `floor`, `trunc`, `fma`…) are now `constexpr`.',
    '`<stdfloat>`: fixed-format float types `std::float16_t`, `std::float32_t`, `std::float64_t`, `std::float128_t`, `std::bfloat16_t` (where the platform supports them).',
    '`std::ranges::fold_left` for reductions over ranges.',
  ],
  lessons: [
    {
      id: 'math',
      title: 'Maths functions & numerical algorithms',
      blocks: [
        { kind: 'analogy', text: "`<cmath>` is the scientific calculator: `sqrt`, `exp`, `log`, trig. `<numeric>` is the spreadsheet's formula bar: running totals, dot products and differences over whole columns, written once and optimised by people who obsess over such things." },
        { kind: 'code', code: `double vol = std::sqrt(variance);
double cont = std::log(px1 / px0);              // log return
double y = std::fma(a, b, c);                   // a*b + c with one rounding: more accurate
std::isnan(x); std::isfinite(x);
std::hypot(dx, dy);                             // sqrt(dx² + dy²) without overflow
std::lerp(a, b, 0.25);                          // linear interpolation (C++20)

#include <numeric>
std::vector<double> r = returns();
double sum  = std::accumulate(r.begin(), r.end(), 0.0);         // left to right, in order
double sum2 = std::reduce(r.begin(), r.end(), 0.0);             // may reorder: parallel-friendly
double dot  = std::inner_product(w.begin(), w.end(), r.begin(), 0.0);   // portfolio return
double var  = std::transform_reduce(r.begin(), r.end(), 0.0, std::plus{},
                  [m = sum / r.size()](double x) { return (x - m) * (x - m); }) / (r.size() - 1);

std::vector<double> equity(r.size());
std::partial_sum(r.begin(), r.end(), equity.begin());           // cumulative sum
std::vector<int> idx(10);
std::iota(idx.begin(), idx.end(), 0);                            // 0, 1, 2, ... 9
std::gcd(12, 18); std::lcm(4, 6); std::midpoint(a, b);` },
        { kind: 'pitfall', text: "`std::accumulate(v.begin(), v.end(), 0)` with doubles returns an **int**: the initial value's type is the accumulator's type, so every partial sum is truncated. Always write `0.0` for doubles." },
        { kind: 'check', q: 'What is `std::accumulate(v.begin(), v.end(), 0)` for `v = {0.5, 0.5, 0.5}`?', options: ['1.5', '1', '0', '2'], answer: 2, hint: 'The accumulator is an `int` starting at 0. What is `int(0 + 0.5)`?', explain: 'Each step converts back to `int`: 0+0.5 → 0, three times. The result is 0. Use `0.0`.' },
      ],
    },
    {
      id: 'complex',
      title: 'Complex numbers & vector arithmetic',
      blocks: [
        { kind: 'analogy', text: "`std::complex` is a number with a second dial (the imaginary part), and all the usual operators know how to turn both dials. `std::valarray` is an old, half-forgotten calculator that does maths on a whole column at once: `a * b + c` element by element." },
        { kind: 'code', code: `using namespace std::complex_literals;
std::complex<double> z = 1.0 + 2.0i;
auto w = z * std::conj(z);                  // (5, 0)
std::abs(z); std::arg(z); std::exp(1i * std::numbers::pi);   // ≈ -1 (Euler)

std::valarray<double> a {1, 2, 3}, b {4, 5, 6};
std::valarray<double> c = a * b + 1.0;     // {5, 11, 19}: element-wise, no loop
c.sum(); c.max(); std::sqrt(c);` },
        { kind: 'p', text: "`valarray` was designed for vector maths but was never widely optimised, and it doesn't fit the rest of the library well. For real linear algebra, people use **Eigen** (or BLAS/LAPACK bindings) and `std::mdspan` to pass matrices between libraries. Python developers: there is no NumPy in the standard library." },
        { kind: 'check', q: 'What is `std::complex<double>{0, 1} * std::complex<double>{0, 1}`?', options: ['(0, 1)', '(1, 0)', '(-1, 0)', '(0, -1)'], answer: 2, hint: 'i × i = ?', explain: 'i² = −1, so the result is (−1, 0).' },
      ],
    },
    {
      id: 'random',
      title: 'Random numbers',
      blocks: [
        { kind: 'analogy', text: "C++ splits randomness into two parts: an **engine** (a machine that produces raw random bits, like a well-shuffled deck) and a **distribution** (the rules of the game that turn cards into the numbers you want, such as a fair die, a bell curve or a coin weighted 70/30)." },
        { kind: 'code', code: `std::random_device rd;                                // non-deterministic seed source
std::mt19937_64 rng {rd()};                           // Mersenne Twister engine: create ONCE
// std::mt19937_64 rng {42};                          // fixed seed: reproducible backtests

std::uniform_int_distribution<int>  die {1, 6};
std::uniform_real_distribution<>    u   {0.0, 1.0};
std::normal_distribution<>          ret {0.0005, 0.01};   // mean, std dev
std::bernoulli_distribution         fill {0.7};

int roll = die(rng);
double r = ret(rng);

// Monte Carlo: one simulated year of daily returns (repeat for many paths)
double final_px = 100;
for (int d = 0; d < 252; ++d) final_px *= 1 + ret(rng);

std::ranges::shuffle(deck, rng);                      // shuffle uses an engine too` },
        { kind: 'list', items: [
          'Create the engine **once** and pass it by reference. Re-creating and re-seeding it in a loop ruins the randomness.',
          'Seed with a fixed number for reproducible simulations and tests. Seed from `random_device` when you want variety.',
          '`std::rand()` and `rand() % n` are low quality and biased. Don\'t use them.',
          'None of these engines are cryptographically secure. Use an OS or crypto library for keys and tokens.',
        ] },
        { kind: 'compare',
          python: `rng = random.Random(42)            # seeded
roll = rng.randint(1, 6)
r = rng.gauss(0.0005, 0.01)
# NumPy: np.random.default_rng(42).normal(...)`,
          ts: `// Math.random() can't be seeded:
const roll = 1 + Math.floor(Math.random() * 6)
// normal distribution: write Box-Muller
// yourself or use a library`,
          go: `rng := rand.New(rand.NewPCG(42, 0))   // math/rand/v2
roll := 1 + rng.IntN(6)
r := 0.0005 + 0.01*rng.NormFloat64()`,
          java: `var rng = new SplittableRandom(42);
int roll = rng.nextInt(1, 7);
double r = 0.0005 + 0.01 * new Random(42).nextGaussian();`,
          cpp: `std::mt19937_64 rng {42};               // seeded engine
std::uniform_int_distribution die {1, 6};
std::normal_distribution<> ret {0.0005, 0.01};
int roll = die(rng);
double r = ret(rng);`,
          note: 'Engines and distributions are separate, so any distribution works with any engine.' },
        { kind: 'check', q: 'Why is this bad?', code: `for (int i = 0; i < n; ++i) {
    std::mt19937 rng {std::random_device{}()};
    xs.push_back(dist(rng));
}`, options: ['`mt19937` is too slow', 'It re-creates and re-seeds the engine every iteration: slow and statistically poor', '`random_device` is deprecated', 'Nothing'], answer: 1, hint: 'How many times is the deck shuffled from scratch?', explain: 'Seeding is expensive, and a fresh engine per draw loses the engine\'s statistical guarantees. Create it once outside the loop.' },
      ],
    },
    {
      id: 'limits',
      title: 'Limits, type aliases & constants',
      blocks: [
        { kind: 'analogy', text: "`numeric_limits` is the spec sheet stamped on each numeric type: how big, how small, how precise. The type aliases are labels that promise an exact size, and `std::numbers` is the reference card of constants, typed and precise." },
        { kind: 'code', code: `std::numeric_limits<int>::max();            // 2147483647 (typically)
std::numeric_limits<std::int64_t>::min();
std::numeric_limits<double>::epsilon();     // ~2.2e-16: gap between 1.0 and the next double
std::numeric_limits<double>::infinity();
std::numeric_limits<double>::quiet_NaN();
std::numeric_limits<float>::digits10;       // 6 reliable decimal digits

std::int32_t a; std::uint64_t b;            // exact widths (<cstdint>)
std::size_t n; std::ptrdiff_t d;            // sizes and pointer differences
std::float64_t e;                           // C++23 <stdfloat>, if supported

double area = std::numbers::pi * r * r;     // also e, sqrt2, ln2, phi, inv_sqrtpi...
float  pf   = std::numbers::pi_v<float>;    // the variable template for other types` },
        { kind: 'pitfall', text: "Never compare floating-point results with `==`: `0.1 + 0.2 == 0.3` is false. Compare with a tolerance scaled to the magnitude. For money, use integer minor units (pence, or ticks for prices) rather than `double`." },
        { kind: 'pitfall', text: '`std::numeric_limits<int>::max() + 1` is signed overflow, which is **UB**, not a wrap-around. Unsigned types do wrap (modulo 2ⁿ). Use `std::int64_t` for volumes and quantities that can get large.' },
        { kind: 'check', q: 'What does `0.1 + 0.2 == 0.3` evaluate to in C++?', options: ['`true`', '`false`', 'Compile error', 'UB'], answer: 1, hint: 'Can 0.1 be represented exactly in binary?', explain: 'None of the three values is exact in binary floating point; the sum is 0.30000000000000004.' },
      ],
    },
  ],
  quiz: [
    { q: 'Why prefer `std::reduce` over `std::accumulate` for big data?', options: ['More accurate', 'It may reorder and parallelise', 'It handles strings', 'It sorts first'], answer: 1, explain: 'It requires an associative, commutative operation and allows parallel execution.' },
    { q: 'What does `std::fma(a, b, c)` compute?', options: ['a + b + c', 'a * b + c with a single rounding', 'max of a, b, c', 'a / b * c'], answer: 1, explain: 'Fused multiply-add: more accurate, and one CPU instruction on modern hardware.' },
    { q: 'What are the two parts of C++ random generation?', options: ['Seed and salt', 'Engine and distribution', 'Device and stream', 'Generator and iterator'], answer: 1, explain: 'Engines make raw bits; distributions shape them.' },
    { q: 'How do you get reproducible random numbers for a backtest?', options: ['`std::random_device`', 'Seed the engine with a fixed value', '`std::rand()`', 'It isn\'t possible'], answer: 1, explain: 'The same seed and engine give the same sequence.' },
    { q: 'What is `std::numeric_limits<double>::epsilon()`?', options: ['The smallest positive double', 'The gap between 1.0 and the next representable double', 'Zero', 'The precision in decimal digits'], answer: 1, explain: 'The smallest positive normal value is `min()`; `denorm_min()` is smaller still.' },
    { q: 'What does `INT_MAX + 1` do?', options: ['Wraps to INT_MIN', 'Undefined behaviour', 'Throws `overflow_error`', 'Saturates'], answer: 1, explain: 'Signed overflow is UB; unsigned arithmetic wraps.' },
    { q: 'Where is π defined in standard C++?', options: ['`M_PI` in `<cmath>`', '`std::numbers::pi` in `<numbers>`', '`std::pi()`', 'Nowhere'], answer: 1, explain: '`M_PI` is a non-standard POSIX extension.' },
    { q: 'For serious matrix maths, C++ developers usually use…', options: ['`std::valarray`', 'A library such as Eigen', '`std::vector<std::vector<double>>`', '`std::complex`'], answer: 1, explain: 'Eigen (or BLAS) gives optimised linear algebra; `mdspan` helps pass data between libraries.' },
  ],
}
