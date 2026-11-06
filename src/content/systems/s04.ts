import type { Module } from '../types'

export const s04: Module = {
  n: 4,
  title: 'Procedures, the Stack & Memory Safety',
  tour: '3.7–3.10 · Procedures · Arrays · Structures · Buffer Overflow',
  summary: 'What really happens on a function call: the call stack and stack frames, passing arguments and returning values, how arrays and structs are laid out (alignment and padding), how buffer overflows corrupt a program, and the tools that catch memory errors before they ship.',
  topics: ['The call stack', 'Stack frames & locals', 'Arrays, structs & alignment', 'Buffer overflows', 'Sanitizers & hardening'],
  cpp23: ['`std::span` (C++20) carries a pointer and a length together, so bounds can be checked.', 'Hardened standard library modes (`-D_GLIBCXX_ASSERTIONS`, libc++ hardening) add cheap bounds checks to `operator[]`.'],
  lessons: [
    {
      id: 'stack',
      title: 'The call stack',
      blocks: [
        { kind: 'analogy', text: "The stack is a pile of plates in a canteen. Each function call puts a new plate on top holding its local variables and the address to return to; returning takes the plate off. It's extremely fast, because allocating is just moving a pointer (the stack pointer, `rsp`), but it's small (8 MB by default on Linux) and everything on a plate vanishes when the plate is removed." },
        { kind: 'code', code: `#include <cstdio>

[[gnu::noinline]] void show(int depth) {      // stop the optimiser merging the frames
    int local = depth;
    std::printf("depth %d: local at %p\\n", depth, (void*)&local);
    if (depth < 3) show(depth + 1);
    asm volatile("" ::: "memory");               // and from turning the call into a jump
}

int main() { show(0); }
// depth 0: local at 0x7fffc99461d4
// depth 1: local at 0x7fffc99461b4     ← 32 bytes LOWER: the stack grows down on x86-64
// depth 2: local at 0x7fffc9946194
// depth 3: local at 0x7fffc9946174     (exact addresses change every run: ASLR)` },
        { kind: 'stepper', title: 'Step through: calling f(7) from main', code: [
          'main:  mov  edi, 7',
          '       call f            ; push return address, jump',
          'f:     push rbp          ; save caller\'s frame pointer',
          '       sub  rsp, 16      ; room for locals',
          '       …',
          '       leave             ; rsp = rbp; pop rbp',
          '       ret               ; pop return address, jump back',
        ], steps: [
          { line: 1, note: 'The argument goes in rdi (first integer argument).', memory: [{ name: 'rdi', value: '7' }] },
          { line: 2, note: '`call` pushes the address of the next instruction in main onto the stack, then jumps to f.', memory: [{ name: '[rsp]', value: 'return addr → main', kind: 'ptr' }] },
          { line: 3, note: 'f saves the caller\'s base pointer so it can restore it later.', memory: [{ name: '[rsp]', value: 'saved rbp' }, { name: '[rsp+8]', value: 'return addr', kind: 'ptr' }] },
          { line: 4, note: 'Moving rsp down reserves space for f\'s locals. Allocation = one subtraction.', memory: [{ name: 'locals', value: '16 bytes', kind: 'heap' }] },
          { line: 6, note: 'On exit, rsp jumps back past the locals and rbp is restored. The locals are gone; their bytes remain until overwritten.', memory: [{ name: 'locals', value: '(dead)', kind: 'dead' }] },
          { line: 7, note: '`ret` pops the return address and jumps to it. If anything had overwritten that address, execution would jump somewhere else: the root of stack-smashing attacks.', memory: [{ name: 'rip', value: '→ main', kind: 'ptr' }] },
        ] },
        { kind: 'check', q: 'Why is stack allocation so fast?', options: ['It uses the GPU', 'Allocating is just adjusting the stack pointer', 'It is cached on disk', 'It\'s garbage collected'], answer: 1, hint: 'One subtraction.', explain: 'No search for free space, unlike malloc.' },
      ],
    },
    {
      id: 'frames',
      title: 'Dangling references & large locals',
      blocks: [
        { kind: 'analogy', text: "Returning a pointer to a local is handing someone the location of a plate that's about to be washed and reused. The address is still valid memory, so the bug often appears to work, until the next function call puts its own plate there." },
        { kind: 'code', code: `#include <array>
#include <cstdio>
#include <string_view>
#include <string>

int* bad() { int x = 42; return &x; }          // warning: address of local returned
std::string_view worse() {
    std::string s = "temporary";
    return s;                                   // view into a destroyed string: dangling
}

void big_frame() {
    std::array<double, 2'000'000> a{};          // 16 MB on an 8 MB stack: segfault (stack overflow)
    std::printf("%f\\n", a[0]);
}
// Fix: std::vector<double> a(2'000'000);  → the data lives on the heap

int main() { std::printf("%zu\\n", worse().size()); }   // "works" by luck; ASan reports it` },
        { kind: 'pitfall', text: 'Deep recursion (a recursive tree walk over a 10-million-node order book, say) can overflow the 8 MB stack just as surely as a huge local array. Convert to an explicit stack (`std::vector` used as a stack) or raise the thread\'s stack size deliberately.' },
        { kind: 'check', q: 'What\'s wrong with returning `std::string_view` to a local `std::string`?', options: ['Nothing', 'The view points into memory freed when the function returns', 'string_view can\'t be returned', 'It copies'], answer: 1, hint: 'A washed plate.', explain: 'Return std::string by value instead.' },
      ],
    },
    {
      id: 'layout',
      title: 'Arrays, structs & alignment',
      blocks: [
        { kind: 'analogy', text: "The CPU likes each value to sit at an address that's a multiple of its size, like parking cars only in bays that fit them. The compiler inserts padding between struct members to keep them aligned. Ordering members from largest to smallest usually removes most of the wasted space." },
        { kind: 'code', code: `#include <cstddef>
#include <cstdint>
#include <cstdio>

struct Bad  { char side; double px; char flag; std::int32_t qty; };   // 1+7 pad, 8, 1+3 pad, 4 = 24
struct Good { double px; std::int32_t qty; char side; char flag; };   // 8, 4, 1, 1, +2 pad    = 16

int main() {
    std::printf("%zu %zu\\n", sizeof(Bad), sizeof(Good));                // 24 16
    std::printf("%zu %zu\\n", offsetof(Bad, px), alignof(double));       // 8 8

    int grid[3][4];                                                       // row-major: rows are contiguous
    std::printf("%td\\n", &grid[1][0] - &grid[0][0]);                     // 4

    struct alignas(64) CacheLine { std::int64_t counter; };              // force 64-byte alignment
    std::printf("%zu\\n", sizeof(CacheLine));                             // 64 (module 6: false sharing)
}` },
        { kind: 'check', q: 'Why is `Bad` 24 bytes while its members total 14?', options: ['Debug info', 'Padding inserted to keep double and int32 aligned', 'vtable', 'Compiler bug'], answer: 1, hint: 'Parking bays.', explain: 'Reorder large-to-small to shrink it.' },
      ],
    },
    {
      id: 'overflow',
      title: 'Buffer overflows',
      blocks: [
        { kind: 'analogy', text: "C arrays have no fence at the end. Writing past the last element simply carries on into whatever lives next door on the stack: other locals, the saved frame pointer, and the return address. An attacker who controls the overflowing data can rewrite where the function returns to. This single class of bug has caused decades of security holes." },
        { kind: 'code', code: `#include <cstdio>
#include <cstring>

void vulnerable(const char* input) {
    char buf[16];
    std::strcpy(buf, input);          // no length check: input longer than 15 chars overflows
    std::printf("%s\\n", buf);
}

#include <span>
#include <string_view>
void safe(std::string_view input) {
    char buf[16];
    auto n = input.copy(buf, sizeof(buf) - 1);    // bounded copy
    buf[n] = '\\0';
    std::printf("%s\\n", buf);
}

int main() {
    safe("this string is definitely longer than sixteen bytes");   // truncated, safe
    // vulnerable(same string) → "*** stack smashing detected ***: terminated" (stack protector)
}` },
        { kind: 'list', items: [
          'Prefer `std::string`, `std::vector`, `std::array` and `std::span` to raw arrays: they know their size.',
          '`.at(i)` is bounds-checked; `operator[]` isn\'t, unless you build with a hardened standard library.',
          'Never use `gets`, `strcpy`, `sprintf` on untrusted input; use bounded versions or C++ strings.',
        ] },
        { kind: 'check', q: 'What does a stack buffer overflow ultimately threaten?', options: ['Only the buffer', 'Neighbouring locals, the saved frame pointer and the return address', 'The heap only', 'Nothing in C++'], answer: 1, hint: 'No fence at the end.', explain: 'Overwriting the return address hijacks control flow.' },
      ],
    },
    {
      id: 'sanitizers',
      title: 'Sanitizers & hardening',
      blocks: [
        { kind: 'analogy', text: "Sanitizers are smoke detectors you install while testing. AddressSanitizer puts tripwires around every allocation and reports the exact line that stepped out of bounds or used freed memory. UndefinedBehaviorSanitizer catches signed overflow, bad shifts and misaligned access. They slow the program down a few times, so they belong in tests and CI, not in production." },
        { kind: 'code', code: `// overflow.cpp
#include <vector>
int main() {
    std::vector<int> v(4);
    int* p = v.data();
    return p[4];                     // one past the end: silent at -O2
}
// $ g++ -g -fsanitize=address,undefined overflow.cpp && ./a.out
// ==12345==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x… READ of size 4
//     #0 0x… in main overflow.cpp:6
//
// Production hardening flags commonly used:
//   -D_FORTIFY_SOURCE=3 -fstack-protector-strong -fstack-clash-protection
//   -D_GLIBCXX_ASSERTIONS   (bounds checks in std::vector::operator[] etc.)
//   -Wl,-z,relro,-z,now -fPIE -pie` },
        { kind: 'check', q: 'Where should AddressSanitizer usually run?', options: ['In production only', 'In tests and CI builds', 'Never', 'Only on Windows'], answer: 1, hint: 'Smoke detectors while testing.', explain: 'It costs roughly 2× time and extra memory.' },
      ],
    },
  ],
  quiz: [
    { q: 'On x86-64 the stack grows towards…', options: ['Higher addresses', 'Lower addresses', 'Both', 'The heap only'], answer: 1, explain: 'rsp decreases on push.' },
    { q: '`call` pushes…', options: ['All registers', 'The return address', 'The arguments', 'Nothing'], answer: 1, explain: 'ret pops it.' },
    { q: 'Default main-thread stack size on Linux is typically…', options: ['64 KB', '8 MB', '1 GB', 'Unlimited'], answer: 1, explain: 'ulimit -s.' },
    { q: 'Returning a pointer to a local variable…', options: ['Is safe', 'Creates a dangling pointer', 'Copies it', 'Moves it to the heap'], answer: 1, explain: 'The frame is gone.' },
    { q: 'Struct padding exists to…', options: ['Waste memory', 'Keep members aligned', 'Store vtables', 'Speed compilation'], answer: 1, explain: 'Reorder to reduce it.' },
    { q: 'C++ multi-dimensional arrays are stored…', options: ['Column-major', 'Row-major', 'Randomly', 'As pointers to rows'], answer: 1, explain: 'Rows are contiguous.' },
    { q: 'Which is bounds-checked?', options: ['vector::operator[] (default build)', 'vector::at()', 'raw arrays', 'pointer arithmetic'], answer: 1, explain: 'Or use a hardened library.' },
    { q: 'AddressSanitizer detects…', options: ['Logic errors', 'Out-of-bounds and use-after-free accesses', 'Slow code', 'Type errors'], answer: 1, explain: '-fsanitize=address.' },
  ],
}
