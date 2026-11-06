import type { Module } from '../types'

export const s02: Module = {
  n: 2,
  title: 'Floating Point',
  tour: '2.4 · Floating Point',
  summary: 'How IEEE 754 stores real numbers, why 0.1 + 0.2 ≠ 0.3, rounding and the loss of precision when adding numbers of different sizes, special values (infinity, NaN, −0), comparing floats sensibly, and why prices and money are usually stored as integers.',
  topics: ['IEEE 754 layout', 'Rounding & representation error', 'Special values', 'Accumulation & cancellation', 'Money as integers'],
  cpp23: ['`std::float16_t`, `std::bfloat16_t`, `std::float32_t` etc. in `<stdfloat>` (C++23, compiler support varies).', '`std::bit_cast` makes inspecting float bits well defined (C++20).'],
  lessons: [
    {
      id: 'layout',
      title: 'IEEE 754 layout',
      blocks: [
        { kind: 'analogy', text: "A float is scientific notation in binary: a sign, an exponent saying where the binary point goes, and a fraction holding the significant digits. Like writing 6.022 × 10²³, it trades exactness for range: a double can hold 10⁻³⁰⁸ to 10³⁰⁸, but only about 15–17 significant decimal digits of any of them." },
        { kind: 'code', code: `#include <bit>
#include <cstdint>
#include <cstdio>
#include <limits>

void dissect(double d) {
    auto b = std::bit_cast<std::uint64_t>(d);
    unsigned sign = b >> 63;
    int exp = static_cast<int>((b >> 52) & 0x7FF) - 1023;      // 11-bit exponent, biased by 1023
    std::uint64_t frac = b & ((1ull << 52) - 1);              // 52-bit fraction
    std::printf("%-8g sign=%u exp=%5d frac=0x%013llx\\n", d, sign, exp, (unsigned long long)frac);
}

int main() {
    dissect(1.0);       // sign=0 exp=0  frac=0: 1.0 × 2^0
    dissect(-2.0);      // sign=1 exp=1
    dissect(0.1);       // frac=0x999999999999a: a repeating pattern, rounded
    std::printf("%d %g\\n", std::numeric_limits<double>::digits10,   // 15
                std::numeric_limits<double>::epsilon());              // 2.22045e-16
}` },
        { kind: 'check', q: 'Roughly how many significant decimal digits does a double hold?', options: ['7', '15–17', '32', 'Unlimited'], answer: 1, hint: '53 bits of precision.', explain: 'float holds about 7.' },
      ],
    },
    {
      id: 'rounding',
      title: 'Rounding & representation error',
      blocks: [
        { kind: 'analogy', text: "1/3 can't be written exactly in decimal: 0.3333… goes on for ever. 0.1 can't be written exactly in binary for the same reason. So the value stored is the nearest representable number, a tiny bit off, and those tiny errors show up when you compare for exact equality." },
        { kind: 'code', code: `#include <cmath>
#include <cstdio>

bool nearly_equal(double a, double b, double rel = 1e-12, double abs = 1e-15) {
    return std::fabs(a - b) <= std::fmax(abs, rel * std::fmax(std::fabs(a), std::fabs(b)));
}

int main() {
    double s = 0.1 + 0.2;
    std::printf("%.17g %d\\n", s, s == 0.3);          // 0.30000000000000004 0
    std::printf("%d\\n", nearly_equal(s, 0.3));       // 1

    std::printf("%.17g\\n", 2385.1);                  // 2385.0999999999999: the nearest double
    float f = 16777216.0f;                            // 2^24
    std::printf("%.1f\\n", f + 1.0f);                 // 16777216.0: float can't represent 2^24 + 1
}` },
        { kind: 'pitfall', text: 'Never test computed prices with `==`. A limit price of 2385.1 computed as `2385.0 + 0.1` may not equal the literal 2385.1. Round to the instrument\'s tick size, or better, work in integer ticks (lesson 5).' },
        { kind: 'check', q: 'Why does `0.1 + 0.2 == 0.3` evaluate to false?', options: ['A compiler bug', 'None of the three values is exactly representable in binary, and the rounding errors don\'t cancel', 'Floats are random', 'Integer promotion'], answer: 1, hint: '1/3 in decimal.', explain: 'Compare with a tolerance instead.' },
      ],
    },
    {
      id: 'special',
      title: 'Infinity, NaN & −0',
      blocks: [
        { kind: 'analogy', text: "IEEE 754 reserves a few bit patterns for situations ordinary numbers can't describe. Infinity is \"too big to hold\". NaN, \"not a number\", is the result of a meaningless calculation like 0/0, and it poisons everything it touches: any arithmetic with NaN gives NaN, and NaN is not even equal to itself." },
        { kind: 'code', code: `#include <cmath>
#include <cstdio>
#include <limits>

int main() {
    double inf = 1.0 / 0.0;                          // +inf (defined for floats, unlike ints)
    double nan = 0.0 / 0.0;
    std::printf("%g %g\\n", inf, -inf);              // inf -inf
    std::printf("%d %d\\n", nan == nan, std::isnan(nan));   // 0 1: NaN != NaN
    std::printf("%g\\n", nan + 1.0);                 // -nan on x86 (NaN's sign is meaningless): it propagates
    std::printf("%d\\n", nan < 1.0 || nan >= 1.0);   // 0: every ordered comparison is false

    double nz = -0.0;
    std::printf("%d %g\\n", nz == 0.0, 1.0 / nz);    // 1 -inf: equal to 0, but not identical
    std::printf("%g\\n", std::numeric_limits<double>::denorm_min());   // 4.94066e-324: subnormals
}` },
        { kind: 'pitfall', text: 'Because every comparison with NaN is false, `std::sort` on a vector containing NaN breaks its strict-weak-ordering requirement: undefined behaviour, often a crash or garbage order. Filter NaNs out before sorting, or use a comparator that orders them explicitly.' },
        { kind: 'check', q: 'How do you test whether x is NaN?', options: ['x == NaN', 'std::isnan(x) (or x != x)', 'x < 0', 'x == 0/0'], answer: 1, hint: 'NaN is not equal to itself.', explain: 'Fast-math flags can break x != x, so prefer std::isnan.' },
      ],
    },
    {
      id: 'accumulate',
      title: 'Accumulation & cancellation',
      blocks: [
        { kind: 'analogy', text: "Adding a tiny number to a huge one is like weighing a feather on a lorry scale: the scale only shows so many digits, so the feather disappears. Summing millions of small P&L values into a large running total loses accuracy steadily. Subtracting two nearly equal numbers has the opposite problem: the shared leading digits cancel and only the noisy tail is left." },
        { kind: 'code', code: `#include <cstdio>
#include <vector>

double naive_sum(const std::vector<double>& xs) {
    double s = 0; for (double x : xs) s += x; return s;
}
double kahan_sum(const std::vector<double>& xs) {        // compensated summation
    double s = 0, c = 0;
    for (double x : xs) {
        double y = x - c;
        double t = s + y;
        c = (t - s) - y;                                 // the low-order bits lost in s + y
        s = t;
    }
    return s;
}

int main() {
    std::vector<double> xs(10'000'000, 0.1);            // exact answer: 1,000,000
    std::printf("%.10f\\n%.10f\\n", naive_sum(xs), kahan_sum(xs));
    // 999999.9998389754   (naive: error builds up)
    // 1000000.0000000000  (Kahan)

    double a = 1.0000001, b = 1.0;
    std::printf("%.17g\\n", a - b);                      // 1.0000000005838672e-07: noisy digits
}` },
        { kind: 'p', text: 'Compiler flags like `-ffast-math` let the compiler reorder floating-point operations (treating them as associative), which breaks Kahan summation and NaN checks and makes results depend on optimisation level. Avoid it in numerical and financial code unless you\'ve measured that it\'s safe.' },
        { kind: 'check', q: 'Why does naively summing ten million 0.1s drift from 1,000,000?', options: ['0.1 is negative', 'Each addition rounds, and errors accumulate as the total grows relative to each term', 'Overflow', 'NaN'], answer: 1, hint: 'Feather on a lorry scale.', explain: 'Kahan or pairwise summation fixes most of it.' },
      ],
    },
    {
      id: 'money',
      title: 'Money as integers',
      blocks: [
        { kind: 'analogy', text: "Exchanges don't trade continuous prices; they trade in ticks, the minimum price step (0.1 for gold futures, 0.01 for many stocks). Store prices as an integer count of ticks, or as fixed-point integers (price × 10⁸), and every comparison, sum and order-book lookup is exact. Convert to double only for analytics." },
        { kind: 'code', code: `#include <cmath>
#include <cstdint>
#include <cstdio>

struct Price {                                 // fixed-point: 1e-8 units, like many exchanges
    static constexpr std::int64_t scale = 100'000'000;
    std::int64_t raw;
    static Price from_double(double d) { return {std::llround(d * scale)}; }
    double to_double() const { return static_cast<double>(raw) / scale; }
    auto operator<=>(const Price&) const = default;   // exact comparisons
    Price operator+(Price o) const { return {raw + o.raw}; }
};

int main() {
    Price a = Price::from_double(0.1), b = Price::from_double(0.2), c = Price::from_double(0.3);
    std::printf("%d\\n", a + b == c);                  // 1: exact

    const double tick = 0.1;
    std::int64_t ticks = std::llround(2385.1 / tick);  // 23851 ticks
    std::printf("%lld %.1f\\n", (long long)ticks, ticks * tick);
}` },
        { kind: 'check', q: 'Why store order-book prices as integer ticks?', options: ['Smaller memory only', 'Exact comparison, hashing and arithmetic, with no rounding surprises', 'Required by C++', 'Faster division'], answer: 1, hint: 'Price levels must match exactly.', explain: 'A map keyed by double is asking for trouble.' },
      ],
    },
  ],
  quiz: [
    { q: 'An IEEE double has how many exponent bits?', options: ['8', '11', '23', '52'], answer: 1, explain: '1 sign, 11 exponent, 52 fraction.' },
    { q: '0.1 in binary floating point is…', options: ['Exact', 'Rounded to the nearest representable value', 'NaN', 'Zero'], answer: 1, explain: 'It repeats in binary.' },
    { q: 'NaN == NaN is…', options: ['true', 'false', 'UB', 'An exception'], answer: 1, explain: 'Use std::isnan.' },
    { q: '1.0 / 0.0 for doubles gives…', options: ['UB', '+inf', 'NaN', '0'], answer: 1, explain: 'Integer division by zero is UB.' },
    { q: 'Kahan summation…', options: ['Is faster', 'Tracks lost low-order bits to reduce accumulated error', 'Uses integers', 'Sorts first'], answer: 1, explain: 'Compensated summation.' },
    { q: '-ffast-math may…', options: ['Only speed things up', 'Reorder operations and break NaN checks and compensated sums', 'Make floats exact', 'Use 128-bit floats'], answer: 1, explain: 'Avoid in numerical code.' },
    { q: 'Sorting a vector containing NaN with std::sort and operator< is…', options: ['Fine', 'Undefined behaviour', 'Puts NaN first', 'An exception'], answer: 1, explain: 'Breaks strict weak ordering.' },
    { q: 'Best representation for exchange prices in an order book?', options: ['float', 'double', 'Integer ticks or fixed-point', 'String'], answer: 2, explain: 'Exact arithmetic.' },
  ],
}
