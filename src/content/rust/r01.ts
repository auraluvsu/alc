import type { Module } from '../types'

export const r01: Module = {
  n: 1,
  title: 'Getting Started and Basic Concepts',
  tour: '1, 3 · Getting Started; Common Programming Concepts',
  summary: 'Cargo and your first program, then the building blocks: variables and mutability, scalar and compound types, functions, expressions and control flow.',
  topics: ['Cargo & rustc', 'Variables, mutability & shadowing', 'Scalar & compound types', 'Functions & expressions', 'Control flow'],
  cpp23: [
    'Let chains: `if let Some(x) = a && x > 0 { }` work in the 2024 edition (Rust 1.88).',
    '`let`-`else` binds a pattern or diverges, which keeps the happy path unindented (Rust 1.65).',
    'Inline `const { ... }` blocks and `LazyLock` for lazily built statics (Rust 1.79 and 1.80).',
    'Format strings capture variables directly: `println!("{price:.2}")` (Rust 1.58).',
  ],
  lessons: [
    {
      id: 'cargo',
      title: 'Cargo and your first program',
      blocks: [
        { kind: 'analogy', text: "`rustc` is a single machine in a workshop. **Cargo** is the foreman: it fetches the raw materials (dependencies), tells each machine what to do and in what order, checks the finished work, and keeps the whole shop tidy. You rarely talk to the machines directly." },
        { kind: 'code', code: `// src/main.rs
fn main() {
    let name = "Aurora";
    println!("Hello, {name}!");           // a macro: note the !
    println!("2 + 2 = {}", 2 + 2);        // {} takes the next argument
}` },
        { kind: 'code', caption: 'Run these in a terminal.', code: `$ cargo new hello          # creates hello/Cargo.toml and hello/src/main.rs
$ cd hello
$ cargo run                # compile (debug) and run
$ cargo check              # type-check only: fast, produces no binary
$ cargo build --release    # optimised build in target/release/
$ cargo fmt                # format the code
$ cargo clippy             # lints: common mistakes and unidiomatic code` },
        { kind: 'list', items: [
          '`Cargo.toml` describes the package: name, version, **edition** and dependencies. `Cargo.lock` pins the exact versions that were built. Commit the lock file for applications.',
          'Debug builds (`cargo run`) compile fast and run slowly, with overflow checks on. Release builds (`--release`) optimise heavily. **Always benchmark release builds.**',
          '`println!` ends in `!` because it is a **macro**, not a function. Macros can take a variable number of arguments and check the format string at compile time.',
          'An **edition** (2015, 2018, 2021, 2024) is an opt-in set of language changes that never breaks old code: crates of different editions link together happily. New projects get the 2024 edition.',
          '`cargo check` is the command you will run most. It reports every error without paying for code generation.',
        ] },
        { kind: 'compare',
          cpp: `// CMakeLists.txt + a package manager of your choice
// g++ -std=c++23 -O2 main.cpp -o hello
#include <print>
int main() { std::println("Hello"); }`,
          go: `// go mod init hello; go run .
package main
import "fmt"
func main() { fmt.Println("Hello") }`,
          python: `# python main.py   (pip / uv for packages)
print("Hello")`,
          java: `// javac Hello.java && java Hello  (Maven or Gradle for builds)
void main() { System.out.println("Hello"); }`,
          ts: `// npm init; npx tsx main.ts
console.log("Hello")`,
          rust: `// cargo run
fn main() { println!("Hello"); }`,
          note: 'Rust ships build tool, package manager, formatter, linter, test runner and doc generator in one `cargo` command. That is the biggest day-to-day difference from C++.' },
        { kind: 'check', q: 'Which command type-checks your project without producing an executable?', options: ['`cargo run`', '`cargo check`', '`cargo build --release`', '`cargo fmt`'], answer: 1, hint: 'It is the fast feedback loop.', explain: '`cargo check` runs the front end of the compiler only. It finds every type and borrow error in a fraction of the time a full build takes.' },
      ],
    },
    {
      id: 'variables',
      title: 'Variables, mutability and shadowing',
      blocks: [
        { kind: 'analogy', text: "A normal Rust variable is a label stuck on a sealed jar: you can read what is inside but not change it. `mut` is the lid you can open. **Shadowing** is peeling off the old label and sticking a new one on a new jar with the same name: the old jar is out of sight, and the new jar may even hold a different kind of thing." },
        { kind: 'code', code: `let x = 5;              // immutable: x = 6 would not compile
let mut count = 0;      // mutable
count += 1;

const MAX_LOTS: u32 = 1_000;     // compile-time constant, type is required
static BANNER: &str = "ALC";     // one fixed address for the whole program

let spaces = "   ";              // &str
let spaces = spaces.len();       // shadowing: now a usize, a new variable
let spaces = spaces * 2;         // and again

let guess: i32 = "42".parse().expect("not a number");   // annotation guides parse` },
        { kind: 'stepper', title: 'Mutation versus shadowing', code: [
          'let x = 5;',
          'let x = x + 1;',
          '{ let x = x * 2; }',
          'let mut y = 1;',
          'y += 1;',
        ], steps: [
          { line: 1, note: 'The first binding. It cannot be changed.', memory: [{ name: 'x', value: '5' }] },
          { line: 2, note: 'A **new** variable named `x` shadows the old one. The old 5 is no longer reachable by name.', memory: [{ name: 'x (old)', value: '5', kind: 'dead' }, { name: 'x', value: '6' }] },
          { line: 3, note: 'Inside the block a third `x` is 12. When the block ends it vanishes and the outer `x` is visible again.', memory: [{ name: 'x (outer)', value: '6' }, { name: 'x (inner)', value: '12' }] },
          { line: 4, note: '`mut` makes the binding assignable.', memory: [{ name: 'x', value: '6' }, { name: 'y', value: '1' }] },
          { line: 5, note: 'Mutation changes the value in place. No new variable is created.', memory: [{ name: 'x', value: '6' }, { name: 'y', value: '2' }] },
        ] },
        { kind: 'list', items: [
          'Immutable by default is a design statement: when you read code, anything not marked `mut` cannot change under you.',
          '`const` values are inlined at compile time and need a type. `static` items have one address and live for the whole program. A `static mut` needs `unsafe` and is almost never what you want.',
          'Shadowing lets you **change type** (`let n = n.trim().parse::<i32>()?`) which `mut` never can. It also lets you refine a value and make it immutable again.',
          'Rust warns about unused variables. Prefix the name with `_` to say it is intentional, or use `_` alone to discard a value at once.',
          'Variables must be initialised before use. The compiler proves this for every path, so there is no "uninitialised read" bug class.',
        ] },
        { kind: 'pitfall', text: '`let mut v = 1;` followed by never mutating `v` produces a compiler warning, not an error. Treat the warning as a signal to drop the `mut`: fewer mutable variables means less to hold in your head.' },
        { kind: 'compare',
          cpp: `const int x = 5;        // const is opt-in
int count = 0;          // mutable by default
auto n = s.size();      // no shadowing in the same scope`,
          go: `x := 5                  // mutable by default
const Max = 1000        // untyped constant
x := x + 1              // error: no new variables (same scope)`,
          python: `x = 5          # rebinding is just assignment
MAX = 1000     # constant by convention only`,
          java: `final int x = 5;        // final is opt-in
var count = 0;          // mutable by default`,
          ts: `const x = 5        // binding cannot be reassigned
let count = 0      // mutable`,
          rust: `let x = 5;              // immutable by default
let mut count = 0;      // opt in to mutation
let x = x + 1;          // shadowing is allowed`,
          note: 'Rust flips the C-family default: you opt in to mutability, not out of it.' },
        { kind: 'check', q: 'What does this print?', code: 'let x = 5;\nlet x = x + 1;\n{\n    let x = x * 2;\n    println!("{x}");\n}\nprintln!("{x}");', options: ['12 then 6', '12 then 12', '6 then 6', 'It does not compile: x is immutable'], answer: 0, hint: 'Each `let` makes a new variable. The inner one lasts only to the closing brace.', explain: 'Shadowing creates new variables, so no mutation is involved. The inner `x` is 12 within the block, and the outer `x` is 6 afterwards.' },
      ],
    },
    {
      id: 'types',
      title: 'Scalar and compound types',
      blocks: [
        { kind: 'analogy', text: "Think of integer types as different sizes of shipping container. Each is the right size for its job and the label says exactly how big it is: `u8` holds 0 to 255, `i64` holds about nine quintillion either way. Rust never quietly squeezes a big load into a small container, so you must say `as` or `try_into` yourself." },
        { kind: 'code', code: `// Integers: i8 i16 i32 i64 i128 isize | u8 u16 u32 u64 u128 usize
let a: i32 = -42;             // i32 is the default integer
let b = 0xff_u8;              // suffix sets the type; _ is a separator
let n: usize = v.len();       // sizes and indices are usize

// Floats: f32, f64 (default)
let px = 2390.5;              // f64
// Other scalars
let ok: bool = true;
let c: char = 'z';            // 4 bytes: any Unicode scalar value, not a byte

// Compound types
let pair: (i32, f64) = (500, 6.4);
let (q, p) = pair;            // destructuring
let first = pair.0;           // tuple fields by position
let unit = ();                // the empty tuple: "nothing"

let days = [31, 28, 31];      // [i32; 3]: length is part of the type
let zeros = [0u8; 16];        // sixteen zeros
let second = days[1];         // index is bounds-checked at runtime` },
        { kind: 'list', items: [
          '**Overflow**: in a debug build `255u8 + 1` panics. In release it wraps unless the profile enables overflow checks. Be explicit: `checked_add` returns an `Option`, `wrapping_add` wraps, `saturating_add` clamps and `overflowing_add` returns the wrapped value and a flag.',
          '**No implicit conversions.** `let x: i64 = some_i32;` is an error. Use `i64::from(some_i32)` for lossless widening, `try_from` / `try_into` for checked narrowing, and `as` only when you want truncation or saturation.',
          '`as` casts never fail: `300_i32 as u8` is 44 (truncation), and `f64 as i32` saturates (NaN becomes 0). That predictability is why `as` is fine for deliberate bit-twiddling and risky anywhere else.',
          '`char` is a Unicode scalar value, not a byte. A `&str` is UTF-8 bytes, so `"é".len()` is 2 but `"é".chars().count()` is 1 (module 5).',
          '**Arrays** have a compile-time length and live on the stack. A **Vec** (module 5) grows. Indexing past the end panics with a clear message instead of reading garbage, as in C++.',
          'Floats follow IEEE 754. `f64` is not `Ord` because of NaN, so sort floats with `sort_by(|a, b| a.total_cmp(b))`.',
        ] },
        { kind: 'code', code: `let big: i64 = 5_000_000_000;
let small = i32::try_from(big);          // Err(TryFromIntError): does not fit
let wrapped = 200u8.wrapping_add(100);   // 44
let none = 200u8.checked_add(100);       // None
let capped = 200u8.saturating_add(100);  // 255

match "42".parse::<u16>() {
    Ok(n) => println!("got {n}"),
    Err(e) => println!("bad input: {e}"),
}` },
        { kind: 'compare',
          cpp: `int32_t a = -42;            // implicit narrowing allowed (with warnings)
uint8_t b = 300;            // silently 44
int x = days[10];           // undefined behaviour`,
          go: `var a int32 = -42
var b uint8 = uint8(300)    // compile error for constants; wraps at runtime
x := days[10]               // runtime panic`,
          python: `a = -42          # arbitrary precision: no overflow
x = days[10]     # IndexError`,
          java: `int a = -42;
byte b = (byte) 300;        // 44, silently
int x = days[10];           // ArrayIndexOutOfBoundsException`,
          ts: `let a = -42              // every number is a double
const x = days[10]          // undefined, no error`,
          rust: `let a: i32 = -42;
let b = 300_i32 as u8;      // 44, but you wrote "as"
let x = days[10];           // panic: index out of bounds`,
          note: 'Rust makes every narrowing, widening and out-of-range access visible in the source, and turns out-of-range access into a defined panic instead of undefined behaviour.' },
        { kind: 'check', q: 'Which expression converts an `i32` named `n` to `u8` and tells you if it did not fit?', options: ['`n as u8`', '`u8::try_from(n)`', '`n.into()`', '`u8::from(n)`'], answer: 1, hint: 'You want a `Result`.', explain: '`as` truncates silently, and `From` only exists for lossless conversions. `try_from` returns `Err` when the value is out of range.' },
      ],
    },
    {
      id: 'functions',
      title: 'Functions and expressions',
      blocks: [
        { kind: 'analogy', text: "Most languages split the world into statements (do something) and expressions (be something). Rust is expression-oriented: nearly everything is a small calculator that produces a value, including `if`, `match` and plain `{ }` blocks. A statement is just an expression with a semicolon that throws the value away." },
        { kind: 'code', code: `fn add(a: i32, b: i32) -> i32 {
    a + b                         // no semicolon: this is the return value
}

fn early(a: i32) -> i32 {
    if a < 0 { return 0; }        // explicit return for early exit
    a * 2
}

fn log(msg: &str) {               // no -> means it returns ()
    println!("{msg}");
}

let y = {
    let base = 3;
    base * base                   // the block evaluates to 9
};

let label = if y > 5 { "big" } else { "small" };    // if is an expression` },
        { kind: 'list', items: [
          'Parameter and return **types are always written** on functions. Inside a function body, types are inferred.',
          'Adding a semicolon to the last line turns the value into `()`, and the compiler says "expected `i32`, found `()`". That message almost always means a stray `;`.',
          'Rust has **no default arguments, no overloading and no keyword arguments**. Use different names, an options struct, or the builder pattern (module 13).',
          '`fn` items can appear in any order in a file and can be nested inside other functions.',
          'Functions that never return have the type `!`, as with `panic!()` or `std::process::exit`. It coerces to any type, which is why `let n = match x { Some(v) => v, None => panic!() };` type-checks.',
          'Doc comments `///` document the item below them and `//!` the enclosing item. They are Markdown and are compiled into HTML by `cargo doc` (module 8).',
        ] },
        { kind: 'pitfall', text: 'In `fn f() -> i32 { 5; }` the semicolon makes the body evaluate to `()`, so it fails to compile. When you see "mismatched types, expected i32, found ()", look at the last line of the function.' },
        { kind: 'compare',
          cpp: `int add(int a, int b) { return a + b; }
auto label = y > 5 ? "big" : "small";   // ?: because if is a statement`,
          go: `func add(a, b int) int { return a + b }
// no ternary; if is a statement`,
          python: `def add(a: int, b: int) -> int:
    return a + b
label = "big" if y > 5 else "small"`,
          java: `static int add(int a, int b) { return a + b; }
var label = y > 5 ? "big" : "small";`,
          ts: `const add = (a: number, b: number): number => a + b
const label = y > 5 ? "big" : "small"`,
          rust: `fn add(a: i32, b: i32) -> i32 { a + b }
let label = if y > 5 { "big" } else { "small" };`,
          note: 'Because `if`, `match` and blocks are expressions, Rust has no ternary operator and no need for one.' },
        { kind: 'check', q: 'What is wrong with `fn sq(x: i32) -> i32 { x * x; }`?', options: ['Nothing, it compiles', 'The semicolon makes the body return `()`, not `i32`', 'Functions must use `return`', 'Parameter types are missing'], answer: 1, hint: 'Look at the very last character of the body.', explain: 'Without the semicolon, `x * x` is the block\'s value. With it, the block ends in a statement and has type `()`.' },
      ],
    },
    {
      id: 'control-flow',
      title: 'Control flow',
      blocks: [
        { kind: 'analogy', text: "Control flow in Rust is a railway with strict signals. `if` insists on a real yes/no signal (a `bool`, never a number or a string). `match` is a junction that makes you wire up every possible track, so a train can never run off the end. Loops are circuits, and `break` can hand the driver a parcel on the way out." },
        { kind: 'code', code: `let n = 7;
if n % 2 == 0 { println!("even"); }
else if n % 3 == 0 { println!("three"); }
else { println!("other"); }              // the condition must be a bool

let mut tries = 0;
let found = loop {                        // loop is an expression
    tries += 1;
    if tries == 3 { break tries * 10; }   // break with a value
};                                        // found == 30

while tries > 0 { tries -= 1; }

for i in 0..3 { print!("{i} "); }         // 0 1 2   (exclusive end)
for i in (1..=3).rev() { print!("{i} "); }// 3 2 1   (inclusive range, reversed)
for (i, ch) in "abc".chars().enumerate() { println!("{i}:{ch}"); }

'outer: for a in 0..5 {                   // labels name loops
    for b in 0..5 {
        if a * b == 6 { break 'outer; }
    }
}` },
        { kind: 'list', items: [
          '`for x in iterable` is the workhorse. There is **no C-style `for (;;)`**. Iterating over a collection by index is rarely needed, and iterators make bounds errors impossible (module 9).',
          'Ranges: `a..b` excludes `b`, `a..=b` includes it. `(a..b).step_by(2)` and `.rev()` adapt them.',
          '`if let` runs a block when a pattern matches. **Let chains** (2024 edition, Rust 1.88) combine patterns and conditions with `&&`, so you no longer need nested `if`s.',
          '`let ... else` handles the failure path first and keeps the rest of the function flat.',
          'Loop labels like `\'outer` let `break` and `continue` target an outer loop.',
        ] },
        { kind: 'new23', text: 'Let chains and let-else are Rust\'s answer to "pyramid of doom" nesting:' },
        { kind: 'code', code: `fn first_even_over(v: &[i32], min: i32) -> Option<i32> {
    // let-else: bail out early, keep the main path unindented
    let Some(&first) = v.first() else { return None };

    // let chain (edition 2024): pattern and conditions in one if
    if let Some(&last) = v.last() && last > min && first % 2 == 0 {
        return Some(last);
    }
    None
}` },
        { kind: 'compare',
          cpp: `for (int i = 0; i < 3; ++i) {}           // C-style for
for (auto& x : xs) {}                     // range-for
if (auto it = m.find(k); it != m.end()) {}`,
          go: `for i := 0; i < 3; i++ {}
for _, x := range xs {}
if v, ok := m[k]; ok {}`,
          python: `for i in range(3): ...
for x in xs: ...
if (v := m.get(k)) is not None: ...`,
          java: `for (int i = 0; i < 3; i++) {}
for (var x : xs) {}
if (m.get(k) instanceof Integer v) {}`,
          ts: `for (let i = 0; i < 3; i++) {}
for (const x of xs) {}
const v = m.get(k); if (v !== undefined) {}`,
          rust: `for i in 0..3 {}
for x in &xs {}
if let Some(v) = m.get(&k) {}`,
          note: 'Rust has one `for` form, over iterators. The `if let` family merges "test" and "bind" into one step, and the compiler checks you cannot use the value on the failure path.' },
        { kind: 'check', q: 'What does `for i in 0..3` iterate over?', options: ['0, 1, 2, 3', '0, 1, 2', '1, 2, 3', 'It does not compile: C-style loops are required'], answer: 1, hint: 'Compare `0..3` with `0..=3`.', explain: '`..` is a half-open range: the end is excluded. Use `0..=3` to include 3.' },
        { kind: 'check', q: 'Which loop form can evaluate to a value?', options: ['`while`', '`for`', '`loop` with `break value`', 'All of them'], answer: 2, hint: 'Only one of them is guaranteed to run at least once until a break.', explain: '`loop` only exits through `break`, so `break value` can supply its result. `while` and `for` may finish without breaking, so their value is always `()`.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does the `!` in `println!` mean?', options: ['The call may fail', 'It is a macro invocation', 'It negates the output', 'It is an unsafe function'], answer: 1, explain: 'Macros are expanded at compile time and can take variable argument lists and check format strings.' },
    { q: 'Which statement about `let x = 5; x = 6;` is true?', options: ['It compiles and x is 6', 'It fails: x is immutable', 'It compiles with a warning', 'It shadows x'], answer: 1, explain: 'Bindings are immutable unless declared `mut`. Assignment to an immutable binding is a compile error.' },
    { q: 'What is the difference between shadowing and `mut`?', options: ['None', 'Shadowing creates a new variable and may change its type, `mut` changes one variable in place', '`mut` is only for numbers', 'Shadowing is only allowed in loops'], answer: 1, explain: '`let x = x.len();` makes a brand new `x` that can have a different type. `mut` keeps the same variable and the same type.' },
    { q: 'What is `200u8.checked_add(100)`?', options: ['44', '255', '`None`', 'It panics'], answer: 2, explain: '`checked_add` returns an `Option` and gives `None` on overflow. `wrapping_add` would give 44 and `saturating_add` 255.' },
    { q: 'What does `300_i32 as u8` produce?', options: ['A compile error', '255', '44', 'A panic'], answer: 2, explain: '`as` truncates to the low 8 bits: 300 mod 256 = 44. It never fails, which is why `try_from` is better when the range matters.' },
    { q: 'Which of these is true of Rust arrays like `[i32; 4]`?', options: ['The length is part of the type', 'They grow when you push', 'Out-of-range indexing is undefined behaviour', 'They are always heap allocated'], answer: 0, explain: 'The length is a compile-time constant in the type. Out-of-range indexing panics. Use `Vec` for a growable sequence.' },
    { q: 'What does `fn f(x: i32) -> i32 { x + 1; }` do?', options: ['Returns x + 1', 'Fails to compile because the body evaluates to `()`', 'Returns 0', 'Compiles with a warning'], answer: 1, explain: 'The trailing semicolon turns the expression into a statement, so the block\'s value is `()`.' },
    { q: 'Which is a valid way to pick between two values?', options: ['`let a = x > 0 ? 1 : 2;`', '`let a = if x > 0 { 1 } else { 2 };`', '`let a = x > 0 and 1 or 2;`', '`let a = switch x > 0 { }`'], answer: 1, explain: '`if` is an expression, so no ternary operator exists. Both branches must have the same type.' },
    { q: 'What prints?', code: 'for i in (1..=3).rev() { print!("{i} "); }', options: ['1 2 3', '3 2 1', '2 1 0', '3 2'], answer: 1, explain: '`1..=3` includes 3, and `.rev()` walks it backwards.' },
    { q: 'What does `let Some(x) = opt else { return };` do?', options: ['Panics if `opt` is `None`', 'Binds `x` when the pattern matches, otherwise runs the diverging else block', 'Always returns', 'Is a compile error: `let` cannot have an else'], answer: 1, explain: 'let-else binds when the pattern matches. Otherwise the else block must diverge (return, break, continue or panic), so `x` is always valid afterwards.' },
  ],
}
