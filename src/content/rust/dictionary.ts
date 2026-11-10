import type { DictEntry } from '../types'

export const RUST_DICT: DictEntry[] = [
  // ---------- Tooling ----------
  { term: 'cargo', cat: 'Tooling', module: 1, desc: 'Rust\'s build tool and package manager. It builds, runs, tests, formats, lints and documents a project.', syntax: `cargo new app
cargo run
cargo check        # type-check only
cargo build --release
cargo test` },
  { term: 'rustc', cat: 'Tooling', module: 1, desc: 'The Rust compiler. You normally invoke it through `cargo`.', syntax: `rustc main.rs && ./main` },
  { term: 'Cargo.toml', cat: 'Tooling', module: 1, desc: 'The package manifest: name, version, edition, dependencies and profiles. `Cargo.lock` records the exact resolved versions.', syntax: `[package]
name = "app"
version = "0.1.0"
edition = "2024"

[dependencies]
serde = "1"` },
  { term: 'Edition', cat: 'Tooling', module: 1, desc: 'An opt-in, backwards-compatible set of language changes, released every few years (2015, 2018, 2021, 2024). Crates of different editions work together.', since: 'Rust 2024', syntax: `edition = "2024"
$ cargo fix --edition` },
  { term: 'clippy / rustfmt', cat: 'Tooling', module: 1, desc: '`cargo clippy` runs hundreds of lints for correctness and style. `cargo fmt` formats code to the standard style.', syntax: `cargo clippy -- -D warnings
cargo fmt --check` },
  // ---------- Basics ----------
  { term: 'println! / format!', cat: 'Basics', module: 1, desc: 'Formatting macros. `{}` uses `Display`, `{:?}` uses `Debug`, and variables can be named inline.', syntax: `let px = 2390.5;
println!("{px:.2} {:?} {:>8}", vec![1], "x");
let s = format!("{}-{}", 1, 2);` },
  { term: 'let', cat: 'Basics', module: 1, desc: 'Binds a name to a value. Bindings are immutable unless marked `mut`.', syntax: `let x = 5;
let mut n: u64 = 0;` },
  { term: 'mut', cat: 'Basics', module: 1, desc: 'Allows a binding to be reassigned or a value to be modified through it.', syntax: `let mut v = Vec::new();
v.push(1);` },
  { term: 'Shadowing', cat: 'Basics', module: 1, desc: 'Declaring a new variable with the same name. The new one hides the old, and may have a different type.', syntax: `let x = "5";
let x: i32 = x.parse().unwrap();` },
  { term: 'const / static', cat: 'Basics', module: 1, desc: '`const` is a compile-time value that is inlined where used. `static` is a single object with a fixed address for the whole program.', syntax: `const MAX: u32 = 1_000;
static NAME: &str = "alc";` },
  { term: 'let else', cat: 'Basics', module: 1, desc: 'Binds with a refutable pattern. If the pattern does not match, the else block must diverge.', since: 'Rust 1.65', syntax: `let Some(x) = opt else { return };` },
  { term: 'Let chains', cat: 'Basics', module: 1, desc: 'Combine `let` patterns and boolean conditions with `&&` in `if` and `while`.', since: 'Rust 1.88 (2024 edition)', syntax: `if let Some(x) = a && x > 0 && b { }` },
  // ---------- Types ----------
  { term: 'Integer types', cat: 'Types', module: 1, desc: '`i8` to `i128` and `u8` to `u128` for fixed widths, `isize` and `usize` for pointer-sized values. `usize` is used for lengths and indices. The default is `i32`.', syntax: `let a: u8 = 255;
let n: usize = v.len();
let big = 1_000_000_i64;` },
  { term: 'Overflow methods', cat: 'Types', module: 1, desc: 'Explicit overflow behaviour: `checked_*` gives `Option`, `wrapping_*` wraps, `saturating_*` clamps, `overflowing_*` returns a flag.', syntax: `200u8.checked_add(100)     // None
200u8.wrapping_add(100)    // 44
200u8.saturating_add(100)  // 255` },
  { term: 'as', cat: 'Types', module: 1, desc: 'Primitive cast. It truncates integers and saturates floats and never fails. Prefer `From` and `try_from` when range matters.', syntax: `let b = 300_i32 as u8;   // 44
let n = 3.9_f64 as i32;  // 3` },
  { term: 'char', cat: 'Types', module: 1, desc: 'A single Unicode scalar value (4 bytes), written in single quotes. Not the same as a byte.', syntax: `let c = 'z';
let e: char = '\u{e9}';` },
  { term: 'Tuple', cat: 'Types', module: 1, desc: 'A fixed-size group of values of possibly different types. `()` is the unit type.', syntax: `let t: (i32, &str) = (1, "a");
let (n, s) = t;
let first = t.0;` },
  { term: 'Array', cat: 'Types', module: 1, desc: 'A fixed-length sequence `[T; N]`, stored inline. The length is part of the type, and indexing is bounds-checked.', syntax: `let a = [1, 2, 3];
let z = [0u8; 16];
let x = a[1];` },
  { term: 'Unit type ()', cat: 'Types', module: 1, desc: 'The type with a single value, returned by functions that return nothing, and by blocks ending in a statement.', syntax: `fn log() {}        // returns ()` },
  { term: 'Never type !', cat: 'Types', module: 1, desc: 'The type of expressions that never produce a value, such as `panic!()` or `loop {}`. It converts to any type.', syntax: `let n: i32 = match o { Some(v) => v, None => panic!("no") };` },
  // ---------- Control flow ----------
  { term: 'if / else', cat: 'Control flow', module: 1, desc: 'A conditional **expression**. The condition must be `bool`, and both branches must have the same type when the value is used.', syntax: `let s = if n > 0 { "pos" } else { "non-pos" };` },
  { term: 'loop / while / for', cat: 'Control flow', module: 1, desc: '`loop` repeats until `break` and can return a value. `while` tests a condition. `for` iterates over anything implementing `IntoIterator`.', syntax: `let v = loop { break 5; };
for i in 0..3 {}
while n > 0 { n -= 1; }` },
  { term: 'Range', cat: 'Control flow', module: 1, desc: '`a..b` excludes the end and `a..=b` includes it. Ranges are iterators when the elements can be stepped.', syntax: `for i in (1..=3).rev() {}
let s = &v[1..3];` },
  { term: 'Loop label', cat: 'Control flow', module: 1, desc: 'Names a loop so `break` and `continue` can target an outer one.', syntax: `'outer: for a in 0..9 {
    for b in 0..9 { if a * b > 20 { break 'outer; } }
}` },
  { term: 'fn', cat: 'Functions', module: 1, desc: 'Declares a function. Parameter and return types are mandatory, and the last expression without a semicolon is the result.', syntax: `fn add(a: i32, b: i32) -> i32 { a + b }` },
  { term: 'Doc comment', cat: 'Functions', module: 1, desc: '`///` documents the next item, `//!` the enclosing one. Markdown, rendered by `cargo doc`.', syntax: `/// Adds two numbers.
fn add(a: i32, b: i32) -> i32 { a + b }` },
  // ---------- Ownership ----------
  { term: 'Ownership', cat: 'Ownership', module: 2, desc: 'Every value has exactly one owner. When the owner goes out of scope the value is dropped and its resources freed.', syntax: `{
    let s = String::from("x");
}   // s dropped here` },
  { term: 'Move', cat: 'Ownership', module: 2, desc: 'Transfers ownership. Assignment, passing and returning move non-`Copy` values, and the old name becomes unusable.', syntax: `let a = String::new();
let b = a;     // a moved
takes(b);      // b moved` },
  { term: 'Copy', cat: 'Ownership', module: 2, desc: 'A marker trait for types duplicated bit for bit on assignment instead of moved. Cannot be implemented by types that own resources.', syntax: `#[derive(Clone, Copy)]
struct P { x: f64, y: f64 }` },
  { term: 'Clone', cat: 'Ownership', module: 2, desc: 'Explicit duplication with `.clone()`. For `String` and `Vec` it is a deep copy, for `Rc` and `Arc` a reference-count bump.', syntax: `let b = a.clone();` },
  { term: 'Drop', cat: 'Ownership', module: 2, desc: 'The destructor trait. `drop` runs when an owner goes out of scope, in reverse declaration order. Call `std::mem::drop(x)` to drop early.', syntax: `impl Drop for Guard {
    fn drop(&mut self) { println!("bye"); }
}` },
  { term: 'mem::take / replace / swap', cat: 'Ownership', module: 2, desc: 'Move a value out of a `&mut` by leaving something valid behind. `take` leaves `Default`, `replace` leaves what you give, `swap` exchanges two places.', syntax: `let old = std::mem::take(&mut self.buf);
let prev = std::mem::replace(&mut x, 5);
std::mem::swap(&mut a, &mut b);` },
  { term: 'Partial move', cat: 'Ownership', module: 2, desc: 'Moving one field out of a struct. The remaining fields stay usable, but the struct as a whole does not.', syntax: `let name = person.name;   // moves one field
println!("{}", person.age);` },
  // ---------- Borrowing ----------
  { term: '&T (shared reference)', cat: 'Borrowing', module: 2, desc: 'A read-only borrow. Any number can exist at once, and they are `Copy`.', syntax: `fn len(s: &String) -> usize { s.len() }` },
  { term: '&mut T (exclusive reference)', cat: 'Borrowing', module: 2, desc: 'A unique read-write borrow. While it lives, no other reference to the value may be used.', syntax: `fn add(v: &mut Vec<i32>) { v.push(1); }
add(&mut v);` },
  { term: 'Borrow checker', cat: 'Borrowing', module: 2, desc: 'The compiler pass that enforces: one `&mut` xor many `&`, and references must not outlive their owner.', syntax: `error[E0502]: cannot borrow \`v\` as mutable
                because it is also borrowed as immutable` },
  { term: 'Dereference *', cat: 'Borrowing', module: 2, desc: 'Follows a reference to its value. Needed for assignment through `&mut` or to copy out a `Copy` value. Method calls auto-dereference.', syntax: `*count += 1;
let n = *r;` },
  { term: 'NLL (non-lexical lifetimes)', cat: 'Borrowing', module: 2, desc: 'A borrow lasts until its last use, not to the end of its block.', syntax: `let r = &s;
println!("{r}");
s.push('x');       // fine: r is no longer used` },
  { term: 'Two-phase borrow', cat: 'Borrowing', module: 2, desc: 'Lets `v.push(v.len())` compile: the mutable borrow is reserved first and only activated after the arguments are evaluated.', syntax: `v.push(v.len());` },
  { term: 'Dangling reference', cat: 'Borrowing', module: 2, desc: 'A reference to freed data. Impossible in safe Rust, since the compiler rejects any reference that would outlive its owner.', syntax: `fn f() -> &String { let s = String::new(); &s }  // error` },
  // ---------- Slices ----------
  { term: 'Slice', cat: 'Slices', module: 2, desc: 'A borrowed view of contiguous elements: a pointer and a length. `&[T]` for sequences and `&str` for text.', syntax: `let mid: &[i32] = &a[1..4];
let w: &str = &s[0..5];` },
  { term: '&str', cat: 'Slices', module: 2, desc: 'A borrowed UTF-8 string slice. String literals are `&\'static str`. Prefer it over `&String` in parameters.', syntax: `fn greet(name: &str) {}
greet("Ada"); greet(&owned);` },
  { term: 'Deref coercion', cat: 'Slices', module: 2, desc: 'The compiler turns `&String` into `&str`, `&Vec<T>` into `&[T]` and `&Box<T>` into `&T` automatically where a reference is expected.', syntax: `let s = String::from("x");
greet(&s);          // &String -> &str` },
  { term: 'split_at_mut / get_disjoint_mut', cat: 'Slices', module: 2, desc: 'Get several non-overlapping `&mut` references into one slice. `get_disjoint_mut` checks distinct indices at runtime.', since: 'Rust 1.86', syntax: `let (a, b) = v.split_at_mut(2);
let [x, y] = v.get_disjoint_mut([0, 3]).unwrap();` },
  { term: 'char boundary', cat: 'Slices', module: 2, desc: 'Byte offsets in a `&str` must fall on UTF-8 character boundaries, or slicing panics. `str::get` returns `None` instead.', syntax: `s.get(0..2)            // Option<&str>
s.is_char_boundary(2)` },
  // ---------- Structs and enums ----------
  { term: 'struct', cat: 'Structs & enums', module: 3, desc: 'A product type: a group of named fields. Variants are named, tuple and unit structs.', syntax: `struct Trade { sym: String, px: f64 }
struct Meters(f64);
struct Marker;` },
  { term: 'impl', cat: 'Structs & enums', module: 3, desc: 'Attaches methods and associated functions to a type. A type can have several `impl` blocks.', syntax: `impl Trade {
    fn new(sym: &str) -> Self { /* ... */ }
    fn px(&self) -> f64 { self.px }
}` },
  { term: 'self / &self / &mut self', cat: 'Structs & enums', module: 3, desc: 'The receiver: consume, read or modify. `Self` (capital) is the implementing type.', syntax: `fn into_sym(self) -> String
fn notional(&self) -> f64
fn scale(&mut self, k: u32)` },
  { term: 'Associated function', cat: 'Structs & enums', module: 3, desc: 'A function in an `impl` without a receiver, called with `::`. Used for constructors such as `new`.', syntax: `let t = Trade::new("XAU");` },
  { term: 'Struct update syntax', cat: 'Structs & enums', module: 3, desc: '`..other` fills the remaining fields from another value, moving non-`Copy` ones.', syntax: `let t2 = Trade { px: 1.0, ..t1 };` },
  { term: 'Newtype', cat: 'Structs & enums', module: 3, desc: 'A tuple struct wrapping one value to create a distinct type with no runtime cost.', syntax: `struct UserId(u64);` },
  { term: 'enum', cat: 'Structs & enums', module: 3, desc: 'A sum type: a value is exactly one of several variants, each of which may carry data.', syntax: `enum Order { Market { qty: u32 }, Cancel(u64), CancelAll }` },
  { term: 'Option<T>', cat: 'Structs & enums', module: 3, desc: 'Optional value: `Some(T)` or `None`. Replaces null.', syntax: `let x: Option<i32> = Some(3);
x.map(|v| v + 1).unwrap_or(0)` },
  { term: 'derive', cat: 'Structs & enums', module: 3, desc: 'Generates trait implementations: `Debug`, `Clone`, `Copy`, `PartialEq`, `Eq`, `Hash`, `PartialOrd`, `Ord`, `Default`.', syntax: `#[derive(Debug, Clone, PartialEq, Default)]
struct S { n: i32 }` },
  { term: 'dbg!', cat: 'Structs & enums', module: 3, desc: 'Prints file, line, expression and value to stderr, then returns the value. Good for temporary debugging.', syntax: `let y = dbg!(x * 2) + 1;` },
  { term: 'Default', cat: 'Structs & enums', module: 3, desc: 'A trait providing a default value, with `..Default::default()` filling unspecified fields.', syntax: `#[derive(Default)] struct Cfg { depth: u8, name: String }
let c = Cfg { depth: 3, ..Default::default() };` },
  // ---------- Pattern matching ----------
  { term: 'match', cat: 'Pattern matching', module: 3, desc: 'Compares a value against patterns in order. It must be exhaustive, and it is an expression.', syntax: `match n { 0 => "zero", 1..=9 => "small", _ => "big" }` },
  { term: 'Match guard', cat: 'Pattern matching', module: 3, desc: 'An `if` after a pattern adds a boolean condition to the arm.', syntax: `Some(x) if x > 0 => {}` },
  { term: '@ binding', cat: 'Pattern matching', module: 3, desc: 'Binds a name to a value while also testing it against a sub-pattern.', syntax: `n @ 1..=9 => println!("{n}")` },
  { term: 'Or-pattern |', cat: 'Pattern matching', module: 3, desc: 'Matches any one of several patterns. Can be nested inside other patterns.', syntax: `Some(1 | 2) | None => {}` },
  { term: 'Wildcard _ and ..', cat: 'Pattern matching', module: 3, desc: '`_` ignores one value without binding it, and `..` ignores the remaining fields or elements.', syntax: `Order::Limit { qty, .. } => {}
let [first, .., last] = a;` },
  { term: 'Exclusive range pattern', cat: 'Pattern matching', module: 3, desc: '`a..b` in a pattern, matching `a <= x < b`.', since: 'Rust 1.80', syntax: `match n { 0..10 => "digit", _ => "more" }` },
  { term: 'if let / while let', cat: 'Pattern matching', module: 3, desc: 'Run a block when a single pattern matches, once (`if let`) or repeatedly (`while let`).', syntax: `if let Some(x) = opt { }
while let Some(t) = stack.pop() { }` },
  { term: 'Slice pattern', cat: 'Pattern matching', module: 3, desc: 'Matches slices and arrays by shape. `rest @ ..` binds the remaining elements.', syntax: `match v { [] => 0, [x] => *x, [first, rest @ ..] => *first }` },
  { term: 'matches!', cat: 'Pattern matching', module: 3, desc: 'A macro that returns whether a value matches a pattern (with an optional guard).', syntax: `matches!(order, Order::Cancel(_) | Order::CancelAll)` },
  { term: 'Refutable / irrefutable', cat: 'Pattern matching', module: 3, desc: 'An irrefutable pattern always matches and may be used in `let`, `for` and parameters. A refutable one may fail and needs `match`, `if let`, `while let` or `let else`.', syntax: `let (a, b) = pair;          // irrefutable
let Some(x) = o else { return };` },
  { term: '#[non_exhaustive]', cat: 'Pattern matching', module: 3, desc: 'Marks a public enum or struct as extensible, so other crates must use a wildcard arm. Lets library authors add variants without a breaking change.', syntax: `#[non_exhaustive]
pub enum Error { Io, Parse }` },
  // ---------- Modules and crates ----------
  { term: 'Package', cat: 'Modules & crates', module: 4, desc: 'What Cargo builds and publishes, described by one `Cargo.toml`. It has at most one library crate and any number of binary crates.', syntax: `[package]
name = "app"` },
  { term: 'Crate', cat: 'Modules & crates', module: 4, desc: 'The unit of compilation: a library (`src/lib.rs`) or a binary (`src/main.rs`, `src/bin/*.rs`).', syntax: `use serde::Serialize;   // an external crate` },
  { term: 'mod', cat: 'Modules & crates', module: 4, desc: 'Declares a module, inline or by loading `name.rs`. The module tree is declared in code, not implied by files.', syntax: `mod book;                 // src/book.rs
mod util { pub fn f() {} }` },
  { term: 'use', cat: 'Modules & crates', module: 4, desc: 'Brings a path into scope. Supports nesting, `as` renames and globs.', syntax: `use std::collections::{HashMap, HashSet};
use std::fmt::Result as FmtResult;` },
  { term: 'crate / self / super', cat: 'Modules & crates', module: 4, desc: 'Path prefixes: the crate root, the current module and the parent module.', syntax: `crate::exchange::book::Order
super::helper()` },
  { term: 'pub', cat: 'Modules & crates', module: 4, desc: 'Makes an item visible outside its module. Restrict it with `pub(crate)`, `pub(super)` or `pub(in path)`.', syntax: `pub struct S { pub a: i32, b: i32 }
pub(crate) fn internal() {}` },
  { term: 'pub use', cat: 'Modules & crates', module: 4, desc: 'Re-exports an item under this module\'s path, so the internal layout can differ from the public API.', syntax: `pub use self::book::Order;` },
  { term: 'Prelude', cat: 'Modules & crates', module: 4, desc: 'Names imported into every module automatically: `Vec`, `String`, `Option`, `Result`, `Box`, `Some`, `None`, `Clone`, `Iterator` and more.', syntax: `// no import needed:
let v: Vec<Option<String>> = Vec::new();` },
  { term: 'Smart constructor', cat: 'Modules & crates', module: 4, desc: 'A private field plus a public `new` that validates input, so every value of the type is guaranteed valid.', syntax: `pub struct Cents(i64);
impl Cents { pub fn new(v: i64) -> Option<Self> { /* ... */ } }` },
  // ---------- Cargo ----------
  { term: 'Workspace', cat: 'Cargo', module: 4, desc: 'A set of crates sharing one `target/` directory and `Cargo.lock`, with shared dependency and lint definitions.', syntax: `[workspace]
members = ["crates/*"]
resolver = "3"` },
  { term: 'Feature', cat: 'Cargo', module: 4, desc: 'An optional, additive switch that compiles extra code or enables optional dependencies.', syntax: `[features]
default = []
json = ["dep:serde_json"]
$ cargo build --features json` },
  { term: 'cfg', cat: 'Cargo', module: 4, desc: 'Conditional compilation on features, OS, architecture or build mode. `cfg!` gives the same test as a `bool`.', syntax: `#[cfg(feature = "json")]
#[cfg(target_os = "linux")]
#[cfg(test)]` },
  { term: 'Profile', cat: 'Cargo', module: 4, desc: 'Compiler settings for a build mode: `dev`, `release`, `test`, `bench` or a custom one.', syntax: `[profile.release]
lto = "fat"
codegen-units = 1
panic = "abort"` },
  { term: 'Semver', cat: 'Cargo', module: 4, desc: 'Version requirements are ranges. `"1.2"` means `>=1.2.0, <2.0.0`, and `"0.3"` means `>=0.3.0, <0.4.0`.', syntax: `serde = "1.0.200"
rand = ">=0.9, <0.11"` },
  { term: 'Cargo.lock', cat: 'Cargo', module: 4, desc: 'Records the exact version of every dependency. Commit it for applications and leave it out for libraries (optional).', syntax: `cargo update -p serde     # refresh one dependency` },
  { term: 'dev-dependencies', cat: 'Cargo', module: 4, desc: 'Dependencies used only by tests, examples and benchmarks. They are not part of the published crate\'s requirements.', syntax: `[dev-dependencies]
proptest = "1"` },
  { term: 'cargo doc / test --doc', cat: 'Cargo', module: 4, desc: '`cargo doc` renders `///` Markdown to HTML. Code blocks in doc comments run as tests with `cargo test`.', syntax: `cargo doc --open
cargo test --doc` },
  { term: 'rust-version (MSRV)', cat: 'Cargo', module: 4, desc: 'The minimum Rust version a crate promises to support. In the 2024 edition the resolver takes it into account.', since: 'Rust 1.84', syntax: `rust-version = "1.85"` },
  { term: 'Edition migration', cat: 'Cargo', module: 4, desc: '`cargo fix --edition` rewrites code to compile under the next edition, after which you bump the edition in `Cargo.toml`.', since: 'Rust 2024', syntax: `cargo fix --edition
# then: edition = "2024"` },
  // ---------- Collections ----------
  { term: 'Vec<T>', cat: 'Collections', module: 5, desc: 'A growable, contiguous, heap-allocated array. Length is the element count and capacity is the allocated room.', syntax: `let mut v = vec![1, 2, 3];
v.push(4);
let x = v.get(10);     // None` },
  { term: 'vec!', cat: 'Collections', module: 5, desc: 'Macro that builds a `Vec` from a list or a repeated value.', syntax: `let a = vec![1, 2, 3];
let z = vec![0u8; 1024];` },
  { term: 'with_capacity / reserve', cat: 'Collections', module: 5, desc: 'Pre-allocate room so later pushes do not reallocate.', syntax: `let mut v = Vec::with_capacity(n);
v.reserve(100);` },
  { term: 'retain / drain / dedup', cat: 'Collections', module: 5, desc: '`retain` keeps matching elements, `drain(range)` removes and yields a range, `dedup` removes adjacent duplicates.', syntax: `v.retain(|x| *x > 0);
let gone: Vec<_> = v.drain(..2).collect();
v.sort(); v.dedup();` },
  { term: 'extract_if', cat: 'Collections', module: 5, desc: 'Removes the elements matching a predicate and yields them lazily.', since: 'Rust 1.87', syntax: `let evens: Vec<_> = v.extract_if(.., |x| *x % 2 == 0).collect();` },
  { term: 'sort / sort_by / sort_by_key', cat: 'Collections', module: 5, desc: '`sort` is stable and needs `Ord`. `sort_unstable` is usually faster. Floats need `sort_by(f64::total_cmp)`.', syntax: `v.sort();
v.sort_by_key(|t| t.px_ticks);
fs.sort_by(f64::total_cmp);` },
  { term: 'VecDeque', cat: 'Collections', module: 5, desc: 'A growable ring buffer with O(1) push and pop at both ends.', syntax: `let mut q = VecDeque::new();
q.push_back(1); q.pop_front();` },
  { term: 'BinaryHeap', cat: 'Collections', module: 5, desc: 'A max-heap priority queue. Wrap items in `Reverse` for a min-heap.', syntax: `heap.push(3);
heap.pop();       // Some(3)` },
  { term: 'HashSet / BTreeSet', cat: 'Collections', module: 5, desc: 'Sets of unique values: hashed (unordered) or sorted. Support union, intersection and difference.', syntax: `let fresh = seen.insert(x);   // bool
a.intersection(&b)` },
  { term: 'BTreeMap', cat: 'Collections', module: 5, desc: 'A sorted map with range queries and ordered iteration. O(log n).', syntax: `m.range(10..20);
m.first_key_value();
m.pop_first();` },
  // ---------- Strings ----------
  { term: 'String', cat: 'Strings', module: 5, desc: 'An owned, growable, UTF-8 string. Internally a `Vec<u8>` that is always valid UTF-8.', syntax: `let mut s = String::from("hi");
s.push_str(" there");` },
  { term: 'str::chars / bytes / char_indices', cat: 'Strings', module: 5, desc: 'Iterate a string as Unicode scalar values, raw bytes, or `(byte offset, char)` pairs.', syntax: `for c in s.chars() {}
for (i, c) in s.char_indices() {}` },
  { term: 'to_string / to_owned / into', cat: 'Strings', module: 5, desc: 'Ways to make a `String` from a `&str`. They all allocate and copy.', syntax: `let a = "x".to_string();
let b: String = "x".into();` },
  { term: 'format!', cat: 'Strings', module: 5, desc: 'Builds a `String` without taking ownership of its arguments.', syntax: `let s = format!("{a}-{}", b);` },
  { term: 'split / trim / lines / parse', cat: 'Strings', module: 5, desc: 'Common text operations. `split` returns an iterator of borrowed slices.', syntax: `let v: Vec<&str> = s.split(',').collect();
let n: i32 = s.trim().parse()?;` },
  { term: 'Grapheme cluster', cat: 'Strings', module: 5, desc: 'What a reader perceives as one character, which may span several scalar values. The `unicode-segmentation` crate iterates them.', syntax: `// "e\u{301}" is two chars, one grapheme` },
  { term: 'OsString / Path', cat: 'Strings', module: 5, desc: 'File-system strings that may not be valid UTF-8, with `PathBuf` as the owned path type.', syntax: `let p = Path::new("a/b.txt");
p.extension()` },
  // ---------- Maps ----------
  { term: 'HashMap<K, V>', cat: 'Maps', module: 5, desc: 'An unordered hash map, O(1) average. Keys must implement `Eq` and `Hash`.', syntax: `let mut m = HashMap::new();
m.insert("a", 1);
m.get("a");` },
  { term: 'Entry API', cat: 'Maps', module: 5, desc: '`entry(k)` finds a slot once. `or_insert`, `or_insert_with`, `or_default` and `and_modify` insert or update in one lookup.', syntax: `*m.entry(k).or_insert(0) += 1;
m.entry(k).or_default().push(x);` },
  { term: 'get vs index', cat: 'Maps', module: 5, desc: '`m.get(&k)` returns an `Option`. `m[&k]` panics when the key is missing and never inserts.', syntax: `if let Some(v) = m.get("a") {}` },
  { term: 'Hasher', cat: 'Maps', module: 5, desc: 'The default hasher resists hash-flooding. For trusted keys, faster ones (FxHash, ahash) are common.', syntax: `use rustc_hash::FxHashMap;
let m: FxHashMap<u64, f64> = FxHashMap::default();` },
]
