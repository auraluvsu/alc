import type { Module } from './types'

export const m01: Module = {
  n: 1,
  title: 'The Basics: Pointers & References',
  tour: '1 · The Basics',
  summary: 'How a C++ program becomes a binary, how values live in memory, and the two ways to refer to a value without copying it.',
  topics: ['Compilation model', 'Types & initialisation', 'const / constexpr / consteval', 'Pointers', 'References', 'Arrays & value semantics'],
  cpp23: [
    '`import std;` imports the whole standard library as one module (the book uses `#include`).',
    '`std::println` from `<print>` replaces most `std::cout <<` chains.',
    '`uz` literal suffix for `std::size_t`, e.g. `auto n = 10uz;`.',
    '`if consteval` lets one function take a compile-time and a run-time path.',
  ],
  lessons: [
    {
      id: 'compile',
      title: 'From source to binary',
      blocks: [
        { kind: 'analogy', text: 'Most languages bring a stagehand on stage with your program: an interpreter, a virtual machine, or a runtime with a garbage collector. C++ is a screenplay sent to a factory that builds a robot to perform it. Once the robot is built, the factory is gone, and there is no stagehand to tidy up after you.' },
        { kind: 'p', text: 'C++ is compiled **ahead of time** straight to machine code. Each `.cpp` file is compiled separately into an object file, then a **linker** stitches the object files and libraries together into one executable.' },
        { kind: 'code', code: `// main.cpp
import std;                      // C++23: the whole standard library as a module

int main() {
    std::println("Hello, {}!", "world");   // C++23 <print>
    return 0;                     // 0 = success, like os.Exit(0)
}`, caption: 'Build: `g++ -std=c++23 main.cpp -o main` or `clang++ -std=c++23 …`. Run: `./main`.' },
        { kind: 'new23', text: '`import std;` is standard C++23, but compiler support is still uneven: MSVC supports it well, Clang and GCC 15 need build-system help (CMake 3.30+). If it fails for you, use `#include <print>` and friends instead. Everything else in this course works with headers too.' },
        { kind: 'p', text: 'A C++ binary carries no interpreter, virtual machine or garbage collector. You pay only for what you use. That is the "zero-overhead principle", and it is why trading systems and game engines are written in C++.' },
        { kind: 'h', text: 'Declarations and the one-definition rule' },
        { kind: 'p', text: 'The compiler reads top to bottom, and a name must be **declared** before it is used. A declaration says "this exists, here is its type". A definition provides the body. You may declare many times but define once (the One Definition Rule).' },
        { kind: 'code', code: `double square(double x);          // declaration: the promise

int main() {
    std::println("{}", square(1.5)); // fine: square was declared above
}

double square(double x) {         // definition: the body
    return x * x;
}` },
        { kind: 'p', text: 'C++ doesn\'t hoist: a function must be declared above its first use. Headers exist mostly to hand declarations to other files (module 3 covers headers vs modules).' },
        { kind: 'check', q: 'Which tool turns several compiled object files into one executable?', options: ['The preprocessor', 'The compiler', 'The linker', 'The runtime'], answer: 2, hint: 'Each `.cpp` is compiled on its own. Something has to join them together afterwards.', explain: 'The linker resolves names used in one object file but defined in another (an "undefined reference" error comes from here, not from the compiler).' },
      ],
    },
    {
      id: 'types',
      title: 'Types, variables & initialisation',
      blocks: [
        { kind: 'analogy', text: 'A type is the shape of a box: how many bytes it takes and what operations make sense on its contents. In C++ the box shape **is** the memory layout. It\'s fixed at compile time, and a plain value carries no hidden type tag or object header around with it.' },
        { kind: 'list', items: [
          '`bool`, `char` (1 byte), `int` (usually 4), `long long` (at least 8), `double` (8), `float` (4).',
          'Sizes are implementation-defined. Use `<cstdint>` types (`std::int64_t`, `std::uint8_t`) when the width matters, e.g. binary protocols or market data feeds.',
          '`unsigned` types wrap around instead of going negative. Mixing signed and unsigned is a classic bug source.',
          '`std::size_t` is the unsigned type of sizes and indices.',
        ] },
        { kind: 'h', text: 'Brace initialisation' },
        { kind: 'p', text: 'C++ has several ways to initialise. Prefer `{}`: it is uniform and refuses **narrowing** conversions that lose information.' },
        { kind: 'code', code: `int a = 7.9;       // compiles; a == 7 (silently truncated)
int b {7.9};       // error: narrowing conversion from double to int
double d {2};      // fine: int -> double doesn't lose information
auto n = 10uz;     // C++23: std::size_t literal
auto x = 1.5;      // auto deduces double` },
        { kind: 'p', text: '`auto` just means "infer the type from the initialiser". A local declared without an initialiser, e.g. `int x;`, holds **garbage**, not a zero or null default. Reading it is undefined behaviour. Always initialise.' },
        { kind: 'h', text: 'Constants: const, constexpr, consteval' },
        { kind: 'list', items: [
          '`const`: "I promise not to change this". The value can come from runtime. It is deep: a `const` object\'s members are also read-only.',
          '`constexpr`: "this must be computable at compile time" for variables. On functions it means "**can** run at compile time if given constants".',
          '`consteval` (C++20): the function **must** run at compile time.',
        ] },
        { kind: 'code', code: `constexpr double square(double x) { return x * x; }

const double r = read_radius();          // runtime value, never changes after
constexpr double area = square(2.0);     // computed by the compiler
// constexpr double bad = square(r);     // error: r isn't a compile-time constant

consteval int kib(int n) { return n * 1024; }
constexpr int buf = kib(4);              // 4096, baked into the binary` },
        { kind: 'new23', text: '`if consteval { ... } else { ... }` lets a `constexpr` function detect whether it is currently being evaluated at compile time, so it can use a fast runtime intrinsic in one branch and portable code in the other.' },
        { kind: 'check', q: 'What happens here?', code: `int price {19.99};`, options: ['`price` becomes 19', '`price` becomes 20', 'Compile error', 'Undefined behaviour'], answer: 2, hint: 'Braces have a strict opinion about losing information.', explain: 'Brace initialisation forbids narrowing, so `double` → `int` is a compile error. With `=` instead it would silently become 19.' },
      ],
    },
    {
      id: 'pointers',
      title: 'Pointers',
      blocks: [
        { kind: 'analogy', text: 'A variable is a house. A pointer is a slip of paper with the house\'s **address** written on it. You can copy the slip, change which address it says, or follow it to the house and change the furniture. The slip can also say "no address" (`nullptr`).' },
        { kind: 'list', items: [
          '`T* p` declares a pointer to a `T`.',
          '`&x` is "address of x".',
          '`*p` is "the thing p points at" (dereference).',
          '`p->member` is shorthand for `(*p).member`.',
        ] },
        { kind: 'stepper', title: 'Step through: following the address', code: [
          'int x = 10;',
          'int* p = &x;',
          '*p = 42;',
          'int y = 7;',
          'p = &y;',
          '*p += 1;',
        ], steps: [
          { line: 1, note: '`x` is a box on the stack holding 10.', memory: [{ name: 'x', addr: '0x7ffe10', value: '10' }] },
          { line: 2, note: '`p` is its own box. Its value is the **address** of `x`.', memory: [{ name: 'x', addr: '0x7ffe10', value: '10' }, { name: 'p', addr: '0x7ffe18', value: '0x7ffe10  → x', kind: 'ptr' }] },
          { line: 3, note: 'Dereferencing writes through the pointer. `x` itself changes.', memory: [{ name: 'x', addr: '0x7ffe10', value: '42', note: 'changed via *p' }, { name: 'p', addr: '0x7ffe18', value: '0x7ffe10  → x', kind: 'ptr' }] },
          { line: 4, note: 'A new variable `y`.', memory: [{ name: 'x', addr: '0x7ffe10', value: '42' }, { name: 'p', addr: '0x7ffe18', value: '0x7ffe10  → x', kind: 'ptr' }, { name: 'y', addr: '0x7ffe1c', value: '7' }] },
          { line: 5, note: 'Pointers can be **reseated**: `p` now holds `y`\'s address. `x` is untouched.', memory: [{ name: 'x', addr: '0x7ffe10', value: '42' }, { name: 'p', addr: '0x7ffe18', value: '0x7ffe1c  → y', kind: 'ptr' }, { name: 'y', addr: '0x7ffe1c', value: '7' }] },
          { line: 6, note: 'Writes go to `y` now.', memory: [{ name: 'x', addr: '0x7ffe10', value: '42' }, { name: 'p', addr: '0x7ffe18', value: '0x7ffe1c  → y', kind: 'ptr' }, { name: 'y', addr: '0x7ffe1c', value: '8', note: 'changed via *p' }] },
        ] },
        { kind: 'p', text: 'Two things to watch: C++ pointers allow **arithmetic** (`p + 1` moves one element along), and nothing stops a pointer outliving what it points to. Nothing quietly moves a variable to the heap to keep it alive for you.' },
        { kind: 'h', text: 'nullptr and dangling pointers' },
        { kind: 'code', code: `int* find_first_negative(int* begin, int* end) {
    for (int* p = begin; p != end; ++p)   // pointer arithmetic walks an array
        if (*p < 0) return p;
    return nullptr;                         // "not found"
}

int* dangling() {
    int local = 5;
    return &local;   // BUG: local dies when the function returns
}` },
        { kind: 'pitfall', text: 'Dereferencing `nullptr` or a dangling pointer is **undefined behaviour** (UB). UB doesn\'t mean "crash". It means the compiler may assume it never happens, so your program can do anything: crash, appear to work, or quietly corrupt data. Compile with `-fsanitize=address,undefined` while learning.' },
        { kind: 'p', text: 'In modern C++ you rarely use raw pointers to **own** memory (`new`/`delete`). Module 5 and module 15 cover `std::unique_ptr` and friends. Raw pointers remain fine as non-owning "I can see that thing, maybe" handles.' },
        { kind: 'check', q: 'After this runs, what is `a`?', code: `int a = 1, b = 2;
int* p = &a;
p = &b;
*p = 9;`, options: ['1', '2', '9', 'Compile error'], answer: 0, hint: 'Which house does the slip of paper point at when the write happens?', explain: '`p` was reseated to `b` before the write, so `b` becomes 9 and `a` stays 1.' },
      ],
    },
    {
      id: 'references',
      title: 'References',
      blocks: [
        { kind: 'analogy', text: 'A reference is a **nickname**. If Robert is also called Bob, there is still only one person. Whatever you do to Bob happens to Robert. Unlike the slip of paper, a nickname must refer to someone from the moment it is given, and it can\'t be moved to another person later.' },
        { kind: 'code', code: `int x = 10;
int& r = x;     // r is another name for x
r = 20;         // x is now 20
// int& bad;    // error: a reference must be bound when declared` },
        { kind: 'stepper', title: 'Step through: a reference cannot be reseated', code: [
          'int a = 1;',
          'int b = 2;',
          'int& r = a;',
          'r = b;',
          'b = 99;',
        ], steps: [
          { line: 1, note: '`a` holds 1.', memory: [{ name: 'a', addr: '0x10', value: '1' }] },
          { line: 2, note: '`b` holds 2.', memory: [{ name: 'a', addr: '0x10', value: '1' }, { name: 'b', addr: '0x14', value: '2' }] },
          { line: 3, note: '`r` is not a new box. It is another label on `a`\'s box.', memory: [{ name: 'a  (aka r)', addr: '0x10', value: '1', kind: 'ref' }, { name: 'b', addr: '0x14', value: '2' }] },
          { line: 4, note: 'This looks like "point r at b", but references can\'t be reseated. It **copies b\'s value into a**.', memory: [{ name: 'a  (aka r)', addr: '0x10', value: '2', kind: 'ref', note: 'assigned through r' }, { name: 'b', addr: '0x14', value: '2' }] },
          { line: 5, note: 'Changing `b` later doesn\'t affect `a`/`r`. They were never linked.', memory: [{ name: 'a  (aka r)', addr: '0x10', value: '2', kind: 'ref' }, { name: 'b', addr: '0x14', value: '99' }] },
        ] },
        { kind: 'h', text: 'Where references earn their keep: parameters' },
        { kind: 'compare', python: `# ints are immutable and can't be passed
# by reference, so return the new value:
def bump(n: int) -> int:
    return n + 1

count = bump(count)`, java: `// primitives are always passed by value.
// Wrap one in a mutable holder:
void bump(int[] n) {
    n[0]++;
}
bump(countHolder);`, go: `func bump(n *int) {
    *n++
}
bump(&count)`, ts: `// numbers are passed by value.
// Wrap one in an object:
function bump(box: { n: number }) {
  box.n++
}`, cpp: `void bump(int& n) {   // n aliases the caller's int
    ++n;
}
bump(count);          // no & at the call site`, note: 'A reference parameter gives pointer-like mutation without null checks or `*` noise.' },
        { kind: 'p', text: 'For read-only access to something big, pass `const T&`: no copy, and no mutation. This is the single most common parameter style in C++.' },
        { kind: 'code', code: `double average(const std::vector<double>& prices) {   // no copy of the vector
    double sum = 0;
    for (double p : prices) sum += p;
    return prices.empty() ? 0 : sum / prices.size();
}` },
        { kind: 'list', items: [
          '**Pointer**: can be null, can be reseated, needs `*` and `->`. Use for "optional, non-owning" access.',
          '**Reference**: never null, never reseated, used like the object itself. Use for parameters and aliases.',
        ] },
        { kind: 'check', q: 'Which signature should `print_report` use for a large `Report` it only reads?', options: ['`void print_report(Report r)`', '`void print_report(Report& r)`', '`void print_report(const Report& r)`', '`void print_report(Report* r)`'], answer: 2, hint: 'Two goals: avoid copying, and promise not to modify.', explain: '`const Report&` avoids the copy and documents (and enforces) read-only access. Plain `Report&` would let the function mutate it and refuses temporaries.' },
      ],
    },
    {
      id: 'arrays',
      title: 'Arrays & value semantics',
      blocks: [
        { kind: 'analogy', text: 'In most garbage-collected languages, `b = a` for a list hands someone a second key to the same flat. In C++, `auto b = a;` builds an identical flat next door. Copying a C++ object copies the **contents**, by default, for every type, including vectors and strings.' },
        { kind: 'compare', python: `a = [1, 2, 3]
b = a
b[0] = 99
print(a[0])  # 99 (shared)`, java: `int[] a = {1, 2, 3};
int[] b = a;
b[0] = 99;
System.out.println(a[0]); // 99 (shared)`, ts: `const a = [1, 2, 3]
const b = a
b[0] = 99
console.log(a[0]) // 99 (shared)`, go: `a := []int{1, 2, 3}
b := a
b[0] = 99
fmt.Println(a[0]) // 99 (slices share)`, cpp: `std::vector<int> a {1, 2, 3};
auto b = a;          // deep copy
b[0] = 99;
std::println("{}", a[0]); // 1`, note: 'This is one of the biggest mental shifts from garbage-collected languages. Module 6 shows how C++ makes copying cheap or avoids it with **moves**.' },
        { kind: 'h', text: 'Built-in arrays vs std::array vs std::vector' },
        { kind: 'code', code: `int raw[4] {1, 2, 3, 4};          // C-style: fixed size, decays to int* when passed
std::array<int, 4> fixed {1, 2, 3, 4}; // fixed size, knows its size, copies properly
std::vector<int> grow {1, 2, 3, 4};    // heap-backed, resizable: the everyday dynamic array

for (int v : grow)          // range-for: visits each element
    std::println("{}", v);

for (auto& v : grow)        // auto& = modify in place, no copies
    v *= 2;` },
        { kind: 'pitfall', text: 'Built-in arrays **decay** to a pointer to their first element when passed to a function, losing their size. `void f(int a[])` is really `void f(int* a)`. Prefer `std::array`, `std::vector`, or `std::span` (module 15) for function parameters.' },
        { kind: 'pitfall', text: '`v[i]` does no bounds checking. Out of range is UB. `v.at(i)` checks and throws. Many teams turn on hardened standard library modes in debug builds for this reason.' },
        { kind: 'h', text: 'Mapping to hardware' },
        { kind: 'p', text: 'A `std::vector<int>` with 4 elements is a small object (pointer, size, capacity) on the stack, plus 16 contiguous bytes on the heap. Contiguous memory is why `vector` beats a linked list for nearly everything: the CPU cache pulls neighbours in for free. In quant work, this layout awareness is a large part of the job.' },
        { kind: 'check', q: 'What does this print?', code: `std::vector<int> v {1, 2, 3};
for (auto x : v) x *= 10;
std::println("{}", v[0]);`, options: ['1', '10', 'Compile error', 'Undefined behaviour'], answer: 0, hint: 'Look at the loop variable\'s type. Is it a nickname or a copy?', explain: '`auto x` copies each element, so the vector is untouched. `auto& x` would modify in place and print 10.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does `int* p = nullptr; *p = 3;` do?', options: ['Throws a `std::null_pointer` exception', 'Writes 3 to address 0 and continues', 'Undefined behaviour', 'Compile error'], answer: 2, explain: 'Dereferencing a null pointer is UB. There is no automatic null-check exception in C++.' },
    { q: 'Which is true of a reference `T& r`?', options: ['It can be null', 'It must be initialised and cannot be reseated', 'It always allocates on the heap', 'It needs `*r` to read the value'], answer: 1, explain: 'A reference is an alias. It is bound once at declaration and then behaves like the object itself.' },
    { q: 'What is `y`?', code: `int x = 5;
int& r = x;
int y = r;
r = 8;`, options: ['5', '8', 'Undefined', 'Compile error'], answer: 0, explain: '`y` copied the value 5. Later changes to `x` via `r` do not affect `y`.' },
    { q: 'Which line fails to compile?', options: ['`double d {3};`', '`int i = 3.7;`', '`int j {3.7};`', '`auto k = 3.7;`'], answer: 2, explain: 'Brace initialisation rejects narrowing. `int i = 3.7;` compiles (with a warning) and truncates to 3.' },
    { q: 'What is the value of an uninitialised local `int n;`?', options: ['0', 'Indeterminate: reading it is UB', '`nullptr`', '-1'], answer: 1, explain: 'Unlike languages that zero-initialise variables, uninitialised locals hold whatever bytes were there. Always initialise.' },
    { q: 'What prints?', code: `std::vector<int> a {1, 2};
auto b = a;
b.push_back(3);
std::println("{}", a.size());`, options: ['2', '3', '0', 'It depends on capacity'], answer: 0, explain: '`auto b = a` deep-copies the vector, so `a` is unaffected. This differs from lists and arrays in most garbage-collected languages.' },
    { q: 'Which keyword forces a function to run at compile time only?', options: ['`const`', '`constexpr`', '`consteval`', '`static`'], answer: 2, explain: '`constexpr` functions *may* run at compile time; `consteval` functions *must*.' },
    { q: 'Best parameter type for a function that reads, but never modifies, a big `std::string`?', options: ['`std::string`', '`std::string&`', '`const std::string&` (or `std::string_view`)', '`std::string*`'], answer: 2, explain: 'Pass by `const&` to avoid the copy. `std::string_view` (module 10) is also a good choice for read-only text.' },
    { q: 'What does C++23\'s `import std;` do?', options: ['Imports only `<iostream>`', 'Imports the whole standard library as a named module', 'Enables the garbage collector', 'Is a Clang-only extension'], answer: 1, explain: 'It is standard C++23 and replaces dozens of `#include`s, though toolchain support still varies.' },
  ],
}
