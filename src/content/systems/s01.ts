import type { Module } from '../types'

export const s01: Module = {
  n: 1,
  title: 'Bits, Bytes & Integers',
  tour: '2.1–2.3 · Representing and Manipulating Information',
  summary: 'Everything is bits: how integers are stored, unsigned and two\'s-complement arithmetic, overflow (and why signed overflow is undefined in C++), conversions that silently change values, byte order, and the bit-manipulation toolkit in <bit>.',
  topics: ['Bits & bytes', 'Unsigned & two\'s complement', 'Overflow & undefined behaviour', 'Conversions & promotions', 'Endianness', 'Bit manipulation'],
  cpp23: [
    'C++20 guarantees two\'s complement for signed integers (P1236); overflow is still undefined.',
    '`<bit>`: `std::popcount`, `std::countl_zero`, `std::bit_cast`, `std::has_single_bit` (C++20); `std::byteswap` (C++23).',
    '`std::cmp_less` and friends (C++20) compare signed and unsigned safely.',
  ],
  lessons: [
    {
      id: 'bits',
      title: 'Bits & bytes',
      blocks: [
        { kind: 'analogy', text: "Memory is a very long street of identical post boxes, each holding eight switches (a byte) and each with a numbered address. A value is just a pattern of switches across one or more neighbouring boxes. The same pattern can mean a number, a character or part of an instruction: meaning comes entirely from the type you read it as." },
        { kind: 'code', code: `#include <cstdint>
#include <cstdio>
#include <bitset>
#include <iostream>

int main() {
    std::uint8_t b = 0b1011'0010;               // binary literal with digit separator
    std::printf("%u 0x%02X\\n", b, b);          // 178 0xB2
    std::cout << std::bitset<8>(b) << '\\n';   // 10110010

    static_assert(sizeof(std::int32_t) == 4 && sizeof(std::int64_t) == 8);
    std::printf("%zu %zu %zu\\n", sizeof(int), sizeof(long), sizeof(void*));   // 4 8 8 on x86-64 Linux
}` },
        { kind: 'list', items: [
          'A hex digit is exactly 4 bits, so two hex digits describe one byte: that\'s why hex is the language of memory dumps.',
          'Use the fixed-width types (`std::int32_t`, `std::uint64_t`) whenever the size matters: file formats, network messages, hashing. `int` and `long` sizes vary by platform (`long` is 4 bytes on 64-bit Windows).',
        ] },
        { kind: 'check', q: 'How many bits does the hex value 0xFF occupy?', options: ['4', '8', '16', '255'], answer: 1, hint: 'Each hex digit is 4 bits.', explain: 'One byte, all ones: 255 unsigned.' },
      ],
    },
    {
      id: 'twos',
      title: 'Unsigned & two\'s complement',
      blocks: [
        { kind: 'analogy', text: "An unsigned integer is a car odometer: it counts up from zero and wraps back to zero after the maximum. Two's complement uses the same dial but labels the top half as negative: on an 8-bit dial, 255 is relabelled −1, 254 is −2, and 128 is −128. Addition works identically for both; only the labels differ." },
        { kind: 'code', code: `#include <cstdint>
#include <cstdio>
#include <limits>

int main() {
    std::uint8_t u = 255;
    std::int8_t  s = -1;
    std::printf("%d\\n", static_cast<std::uint8_t>(s) == u);   // 1: same bit pattern 11111111

    std::printf("%d %d\\n", std::numeric_limits<std::int8_t>::min(),
                            std::numeric_limits<std::int8_t>::max());   // -128 127: one more negative

    std::uint8_t wrap = 250;
    wrap += 10;                                               // unsigned arithmetic is modulo 2^8
    std::printf("%u\\n", wrap);                                // 4

    int x = 13;
    std::printf("%d %d\\n", -x, ~x + 1);                       // -13 -13: negate = flip bits, add one
}` },
        { kind: 'stepper', title: 'Step through: −5 in 8-bit two\'s complement', code: [
          '5        = 0000 0101',
          'flip     = 1111 1010',
          '+1       = 1111 1011   (−5)',
          '−5 + 5   = 1 0000 0000 → 0000 0000',
        ], steps: [
          { line: 1, note: 'Start from the positive value.', memory: [{ name: 'bits', value: '0000 0101' }] },
          { line: 2, note: 'Invert every bit (one\'s complement).', memory: [{ name: 'bits', value: '1111 1010' }] },
          { line: 3, note: 'Add one. The top bit is 1, so this is negative: −128 + 64 + 32 + 16 + 8 + 2 + 1 = −5.', memory: [{ name: 'bits', value: '1111 1011', note: '−5', kind: 'heap' }] },
          { line: 4, note: 'Adding 5 overflows the 8 bits and the carry falls off, leaving 0. That\'s why the CPU needs only one adder for signed and unsigned.', memory: [{ name: 'sum', value: '0000 0000', note: 'carry discarded', kind: 'ptr' }] },
        ] },
        { kind: 'check', q: 'In 8-bit two\'s complement, what does the pattern 1000 0000 represent?', options: ['0', '128', '−128', '−0'], answer: 2, hint: 'The top bit has weight −128.', explain: 'There is no −0 in two\'s complement, so the range is asymmetric.' },
      ],
    },
    {
      id: 'overflow',
      title: 'Overflow & undefined behaviour',
      blocks: [
        { kind: 'analogy', text: "Unsigned overflow is defined: the odometer wraps. Signed overflow in C++ is *undefined behaviour*: the standard makes no promise at all, and the optimiser is allowed to assume it never happens. It's like a contract clause saying \"this will never occur\": the compiler plans around it, so if it does occur the results can be bizarre, not merely wrapped." },
        { kind: 'code', code: `#include <climits>
#include <cstdio>

bool will_wrap(int x) { return x + 1 < x; }     // "check" for overflow… relying on UB

int main() {
    std::printf("%d\\n", will_wrap(INT_MAX));   // with -O2 typically prints 0: the compiler
                                               // simplified x + 1 < x to false, since it "can't" overflow
    int a = INT_MAX, r;
    if (__builtin_add_overflow(a, 1, &r))      // GCC/Clang builtin: checked arithmetic
        std::puts("overflow detected");
}
// Build with  -fsanitize=undefined  to catch signed overflow at runtime in tests.` },
        { kind: 'pitfall', text: 'Order quantities, timestamps in nanoseconds, and cumulative volumes overflow 32-bit `int` sooner than you think: 2³¹ ns is only about 2.1 seconds. Use `std::int64_t` for times and sizes, and checked arithmetic (or `-fsanitize=undefined` in tests) at boundaries.' },
        { kind: 'check', q: 'Why might `x + 1 < x` evaluate to false even when x is INT_MAX?', options: ['A CPU bug', 'Signed overflow is undefined, so the compiler may assume it never happens and fold the test to false', 'INT_MAX + 1 is 0', 'Integers saturate'], answer: 1, hint: 'The contract clause.', explain: 'Use __builtin_add_overflow or test before adding.' },
      ],
    },
    {
      id: 'conversions',
      title: 'Conversions & promotions',
      blocks: [
        { kind: 'analogy', text: "When signed and unsigned meet in an expression, C++ converts the signed one to unsigned, reading the same bits with the unsigned labels. So −1 becomes 4,294,967,295 and quietly wins every comparison. It's a translator who swaps currencies without telling you." },
        { kind: 'code', code: `#include <cstdio>
#include <utility>
#include <vector>

int main() {
    int balance = -1;
    unsigned limit = 10;
    std::printf("%d\\n", balance < limit);              // 0! -1 converted to 4294967295
    std::printf("%d\\n", std::cmp_less(balance, limit)); // 1: C++20 safe comparison

    std::vector<int> v;
    for (int i = 0; i < static_cast<int>(v.size()) - 1; ++i) {}   // OK
    // for (size_t i = 0; i < v.size() - 1; ++i)  → v.size()-1 wraps to 2^64-1 when v is empty!

    short a = 30000, b = 30000;
    auto c = a + b;                                     // promoted to int first: 60000, no overflow
    std::printf("%d %zu\\n", c, sizeof(c));             // 60000 4

    long long big = 5'000'000'000;
    int narrowed = static_cast<int>(big);              // keeps the low 32 bits: 705032704
    std::printf("%d\\n", narrowed);
}` },
        { kind: 'check', q: '`-1 < 10u` in C++ is…', options: ['true', 'false, because −1 is converted to a huge unsigned value', 'A compile error', 'Undefined'], answer: 1, hint: 'Mixed signedness.', explain: 'Compilers warn with -Wsign-compare; use std::cmp_less.' },
      ],
    },
    {
      id: 'endian',
      title: 'Endianness & bit manipulation',
      blocks: [
        { kind: 'analogy', text: "A multi-byte number has to be laid across several post boxes in some order. Little-endian (x86, ARM in practice) puts the least significant byte in the lowest address, like writing a number's digits backwards. Network protocols and many exchange feeds use big-endian. Get it wrong and a price of 1 reads as 16,777,216." },
        { kind: 'code', code: `#include <bit>
#include <cstdint>
#include <cstdio>
#include <cstring>

int main() {
    std::uint32_t x = 0x01020304;
    unsigned char bytes[4];
    std::memcpy(bytes, &x, 4);
    std::printf("%02x %02x %02x %02x\\n", bytes[0], bytes[1], bytes[2], bytes[3]);   // 04 03 02 01 on x86
    std::printf("%d\\n", std::endian::native == std::endian::little);              // 1
    std::printf("0x%08x\\n", std::byteswap(x));                                    // 0x04030201 (C++23)

    std::uint64_t flags = 0;
    flags |= 1ull << 5;                  // set bit 5
    flags &= ~(1ull << 5);               // clear it
    flags ^= 1ull << 3;                  // toggle bit 3
    bool on = (flags >> 3) & 1;          // test bit 3
    std::printf("%d %d %d\\n", on, std::popcount(0b1011u), std::countr_zero(8u));  // 1 3 3
    std::printf("%d %u\\n", std::has_single_bit(64u), std::bit_ceil(100u));        // 1 128

    float f = 1.0f;
    auto bits = std::bit_cast<std::uint32_t>(f);   // reinterpret safely (no UB, unlike pointer casts)
    std::printf("0x%08x\\n", bits);                 // 0x3f800000
}` },
        { kind: 'compare',
          python: `int.from_bytes(b"\\x00\\x00\\x00\\x01", "big")   # 1
struct.unpack("<I", data)   # explicit byte order`,
          ts: `new DataView(buf).getUint32(0, /* littleEndian */ false)`,
          go: `binary.BigEndian.Uint32(b)   // encoding/binary`,
          java: `ByteBuffer.wrap(b).order(ByteOrder.BIG_ENDIAN).getInt()`,
          cpp: `std::byteswap(x)   // C++23; or read bytes and shift explicitly`,
          note: 'Every language makes you choose byte order explicitly when parsing binary data.' },
        { kind: 'check', q: 'Why use `std::bit_cast` instead of `*reinterpret_cast<uint32_t*>(&f)`?', options: ['It\'s faster', 'Type-punning through a pointer violates strict aliasing (UB); bit_cast is defined', 'It changes the value', 'It byte-swaps'], answer: 1, hint: 'Defined vs undefined.', explain: 'memcpy is the pre-C++20 equivalent.' },
      ],
    },
  ],
  quiz: [
    { q: 'How many values can an 8-bit unsigned integer hold?', options: ['255', '256', '128', '512'], answer: 1, explain: '0 to 255.' },
    { q: 'The range of int8_t is…', options: ['−127 to 127', '−128 to 127', '0 to 255', '−256 to 255'], answer: 1, explain: 'Asymmetric two\'s complement.' },
    { q: 'Unsigned overflow in C++ is…', options: ['Undefined', 'Defined as modular wrap-around', 'An exception', 'Saturating'], answer: 1, explain: 'Signed overflow is UB.' },
    { q: 'Negating x in two\'s complement equals…', options: ['~x', '~x + 1', 'x ^ 1', '-~x'], answer: 1, explain: 'Flip and add one.' },
    { q: '`std::cmp_less(-1, 10u)` returns…', options: ['false', 'true', 'UB', 'Compile error'], answer: 1, explain: 'Safe mixed comparison.' },
    { q: 'x86-64 is…', options: ['Big-endian', 'Little-endian', 'Bi-endian at runtime', 'Middle-endian'], answer: 1, explain: 'Lowest byte first.' },
    { q: '`std::popcount(0b1011u)` is…', options: ['2', '3', '4', '11'], answer: 1, explain: 'Counts 1 bits.' },
    { q: 'The safe way to reinterpret a float\'s bits is…', options: ['reinterpret_cast pointer', 'std::bit_cast or memcpy', 'A union in C++', 'static_cast'], answer: 1, explain: 'Avoids aliasing UB.' },
  ],
}
