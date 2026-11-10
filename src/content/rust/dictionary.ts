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
  // ---------- Errors ----------
  { term: 'panic!', cat: 'Errors', module: 6, desc: 'Reports an unrecoverable bug and unwinds the stack (or aborts). The thread ends, and a panic in `main` exits with code 101.', syntax: `panic!("invariant broken: {x}");
RUST_BACKTRACE=1 cargo run` },
  { term: 'unwrap / expect', cat: 'Errors', module: 6, desc: 'Return the value or panic. `expect` takes a message that should say why failure is impossible.', syntax: `let n = s.parse::<i32>().expect("validated earlier");` },
  { term: 'assert! / assert_eq! / debug_assert!', cat: 'Errors', module: 6, desc: 'Panic if a condition is false. `debug_assert!` is compiled out of release builds.', syntax: `assert_eq!(a, b, "mismatch for {id}");` },
  { term: 'unreachable! / todo! / unimplemented!', cat: 'Errors', module: 6, desc: 'Panics that document intent: this cannot happen, this is not written yet, this is deliberately missing.', syntax: `_ => unreachable!("validated")
todo!()` },
  { term: 'Result<T, E>', cat: 'Errors', module: 6, desc: 'Success (`Ok(T)`) or failure (`Err(E)`). `#[must_use]`, so ignoring one warns.', syntax: `fn parse(s: &str) -> Result<u32, ParseIntError> { s.parse() }` },
  { term: '? operator', cat: 'Errors', module: 6, desc: 'On `Err`, returns early with `Err(From::from(e))`. On `Ok`, unwraps. Also works on `Option`.', syntax: `let text = fs::read_to_string(p)?;
let c = s.chars().next()?;` },
  { term: 'map_err / ok_or', cat: 'Errors', module: 6, desc: '`map_err` converts the error of a `Result`. `ok_or` and `ok_or_else` turn `None` into an `Err`.', syntax: `s.parse::<u8>().map_err(MyError::Parse)?;
opt.ok_or(MyError::Missing)?` },
  { term: 'collect into Result', cat: 'Errors', module: 6, desc: 'Gathers an iterator of `Result<T, E>` into `Result<Vec<T>, E>`, stopping at the first `Err`.', syntax: `let v: Result<Vec<i32>, _> = it.map(|s| s.parse::<i32>()).collect();` },
  { term: 'std::error::Error', cat: 'Errors', module: 6, desc: 'The standard error trait. Requires `Debug + Display`, and optionally provides `source()` for the cause. Available in `core` since 1.81.', since: 'Rust 1.81', syntax: `impl std::error::Error for MyError {}` },
  { term: 'Box<dyn Error>', cat: 'Errors', module: 6, desc: 'A boxed trait object that can hold any error. `?` converts into it automatically.', syntax: `fn run() -> Result<(), Box<dyn std::error::Error>> { Ok(()) }` },
  { term: 'From (for errors)', cat: 'Errors', module: 6, desc: 'Conversion trait used by `?`. Implement `From<SourceError> for MyError` so `?` converts for you.', syntax: `impl From<io::Error> for MyError {
    fn from(e: io::Error) -> Self { MyError::Io(e) }
}` },
  { term: 'thiserror', cat: 'Errors', module: 6, desc: 'A derive macro for error enums: `#[error("...")]` writes `Display`, and `#[from]` writes `From` and `source`. For libraries.', syntax: `#[derive(Debug, thiserror::Error)]
enum E { #[error("io: {0}")] Io(#[from] std::io::Error) }` },
  { term: 'anyhow', cat: 'Errors', module: 6, desc: 'A single catch-all error type with context for applications: `anyhow::Result`, `.context()`, `bail!` and `ensure!`.', syntax: `let t = fs::read_to_string(p).with_context(|| format!("reading {p}"))?;
bail!("bad line {n}");` },
  { term: 'catch_unwind', cat: 'Errors', module: 6, desc: 'Catches a panic at a boundary (FFI, thread pools). Not a general exception mechanism.', syntax: `let r = std::panic::catch_unwind(|| risky());` },
  { term: 'ExitCode / Termination', cat: 'Errors', module: 6, desc: '`main` may return `()`, `Result<(), E: Debug>` or `ExitCode`. An `Err` prints `Error: {e:?}` and exits with status 1.', syntax: `fn main() -> ExitCode { ExitCode::from(2) }` },
  { term: 'is_ok_and / is_err_and', cat: 'Errors', module: 6, desc: 'Test the contents of a `Result` as a bool without unwrapping.', since: 'Rust 1.70', syntax: `res.is_ok_and(|n| n > 0)` },
  // ---------- Generics and traits ----------
  { term: 'Generics', cat: 'Generics & traits', module: 7, desc: 'Type parameters let one definition work for many types. The compiler generates a specialised copy per concrete type (monomorphisation).', syntax: `fn largest<T: PartialOrd>(v: &[T]) -> &T { /* ... */ }
struct Point<T> { x: T, y: T }` },
  { term: 'Turbofish ::<>', cat: 'Generics & traits', module: 7, desc: 'Supplies generic arguments explicitly when inference cannot decide.', syntax: `let n = "5".parse::<i32>()?;
let v = Vec::<u8>::new();
iter.collect::<Vec<_>>()` },
  { term: 'Const generics', cat: 'Generics & traits', module: 7, desc: 'Generic parameters that are values, such as array lengths.', syntax: `fn sum<const N: usize>(a: [i32; N]) -> i32 { a.iter().sum() }
struct Buf<const N: usize>([u8; N]);` },
  { term: 'trait', cat: 'Generics & traits', module: 7, desc: 'A set of methods a type can implement. May include default methods, associated types and constants.', syntax: `trait Summary {
    fn author(&self) -> String;
    fn summarise(&self) -> String { format!("by {}", self.author()) }
}` },
  { term: 'impl Trait for Type', cat: 'Generics & traits', module: 7, desc: 'Implements a trait for a type. Allowed if your crate defines the trait or the type (orphan rule).', syntax: `impl Summary for Tweet { fn author(&self) -> String { /* ... */ } }` },
  { term: 'Trait bound / where', cat: 'Generics & traits', module: 7, desc: 'Constrains what a type parameter must implement. `where` clauses keep long bounds readable.', syntax: `fn f<T: Clone + Debug>(x: T) {}
fn g<T>(x: T) where T: Clone + Debug {}` },
  { term: 'Associated type', cat: 'Generics & traits', module: 7, desc: 'A type member of a trait chosen by each implementor, such as `Iterator::Item`.', syntax: `trait Container { type Item; fn first(&self) -> Option<&Self::Item>; }` },
  { term: 'Supertrait', cat: 'Generics & traits', module: 7, desc: 'A trait that requires another: implementors must implement both.', syntax: `trait Pretty: Display { fn pretty(&self) -> String; }` },
  { term: 'Blanket impl', cat: 'Generics & traits', module: 7, desc: 'An implementation for every type satisfying a bound, such as `impl<T: Display> ToString for T`.', syntax: `impl<T: Display> Pretty for T {}` },
  { term: 'Orphan rule', cat: 'Generics & traits', module: 7, desc: 'You may implement a trait for a type only if the trait or the type is local to your crate. Newtypes work around it.', syntax: `struct W(Vec<String>);
impl fmt::Display for W { /* ... */ }` },
  { term: 'impl Trait', cat: 'Generics & traits', module: 7, desc: 'In argument position: shorthand for a generic. In return position: an opaque concrete type. Static dispatch both ways.', syntax: `fn f(x: impl Display) {}
fn g() -> impl Iterator<Item = u32> { 0..3 }` },
  { term: 'dyn Trait', cat: 'Generics & traits', module: 7, desc: 'A trait object: dynamic dispatch through a vtable, always behind a pointer.', syntax: `let v: Vec<Box<dyn Shape>> = vec![Box::new(Circle), Box::new(Square)];` },
  { term: 'Dyn compatibility', cat: 'Generics & traits', module: 7, desc: 'Whether a trait can be made into a `dyn` object (formerly "object safety"). Methods must not return `Self` or have unconstrained generics.', syntax: `// Clone is not dyn-compatible
// trait Shape { fn area(&self) -> f64; } is` },
  { term: 'Trait upcasting', cat: 'Generics & traits', module: 7, desc: 'Coerce `&dyn Sub` to `&dyn Super` when `Sub: Super`.', since: 'Rust 1.86', syntax: `fn f(d: &dyn Dog) { greet(d) }   // greet takes &dyn Animal` },
  { term: 'async fn in traits', cat: 'Generics & traits', module: 7, desc: 'Traits may declare `async fn` and return-position `impl Trait` directly. Such traits are not dyn-compatible by default.', since: 'Rust 1.75', syntax: `trait Feed { async fn latest(&self) -> f64; }` },
  { term: 'GAT', cat: 'Generics & traits', module: 7, desc: 'Generic associated types: an associated type that takes its own parameters, such as a lifetime, enabling lending iterators.', since: 'Rust 1.65', syntax: `trait Lending { type Item<'a> where Self: 'a; }` },
  { term: 'Operator traits', cat: 'Generics & traits', module: 7, desc: 'Operators are trait methods in `std::ops`: `Add`, `Sub`, `Mul`, `Neg`, `Index`, `AddAssign`, and so on.', syntax: `impl Add for V2 { type Output = V2; fn add(self, o: V2) -> V2 { /* ... */ } }` },
  { term: 'PartialEq / Eq / PartialOrd / Ord / Hash', cat: 'Generics & traits', module: 7, desc: 'Comparison and hashing traits, derivable. `f64` has the partial forms only because of NaN.', syntax: `#[derive(PartialEq, Eq, PartialOrd, Ord, Hash)]
struct Id(u64);` },
  { term: 'AsRef / Into', cat: 'Generics & traits', module: 7, desc: 'Flexible argument conversions: `AsRef<str>` borrows, `Into<String>` converts and may allocate.', syntax: `fn f(s: impl AsRef<str>) { s.as_ref(); }
fn g(s: impl Into<String>) { let o: String = s.into(); }` },
  // ---------- Lifetimes ----------
  { term: 'Lifetime \'a', cat: 'Lifetimes', module: 7, desc: 'A label for how long a reference is valid. Annotations describe relationships between borrows and never extend a lifetime.', syntax: `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str` },
  { term: 'Lifetime elision', cat: 'Lifetimes', module: 7, desc: 'Rules that let you omit lifetimes: each input gets its own; one input lifetime goes to all outputs; `&self` goes to all outputs.', syntax: `fn first(s: &str) -> &str        // fn first<'a>(s: &'a str) -> &'a str` },
  { term: '\'static', cat: 'Lifetimes', module: 7, desc: 'A reference valid for the whole program (like string literals). As a bound `T: \'static`, it means the type holds no short-lived borrows.', syntax: `let s: &'static str = "hi";
fn spawn<T: Send + 'static>(t: T) {}` },
  { term: 'Struct lifetime parameter', cat: 'Lifetimes', module: 7, desc: 'A struct holding a reference declares the lifetime, and cannot outlive the borrowed data.', syntax: `struct Parser<'a> { input: &'a str }
impl<'a> Parser<'a> {}` },
  { term: '\'_ (anonymous lifetime)', cat: 'Lifetimes', module: 7, desc: 'A placeholder for an elided lifetime, showing there is a borrow without naming it.', syntax: `impl Parser<'_> {}
fn f(p: &Parser<'_>) {}` },
  { term: 'Precise capturing use<..>', cat: 'Lifetimes', module: 7, desc: 'Lists exactly which generic parameters and lifetimes a returned `impl Trait` captures.', since: 'Rust 1.82', syntax: `fn f<'a>(x: &'a str) -> impl Iterator<Item = u8> + use<> { /* owned */ }` },
  { term: 'Higher-ranked bound for<\'a>', cat: 'Lifetimes', module: 7, desc: 'A bound that must hold for every lifetime. `Fn(&str) -> &str` is sugar for it.', syntax: `F: for<'x> Fn(&'x str) -> &'x str` },
  // ---------- Testing ----------
  { term: '#[test]', cat: 'Testing', module: 8, desc: 'Marks a function as a test. It passes if it returns normally (or `Ok`) and fails if it panics.', syntax: `#[test]
fn adds() { assert_eq!(2 + 2, 4); }` },
  { term: '#[cfg(test)]', cat: 'Testing', module: 8, desc: 'Compiles the item only when testing. Unit tests live in a `tests` module with this attribute.', syntax: `#[cfg(test)]
mod tests { use super::*; }` },
  { term: 'assert! / assert_eq! / assert_ne!', cat: 'Testing', module: 8, desc: 'Panic with a message when a condition fails. The equality forms print both sides and need `Debug + PartialEq`.', syntax: `assert!(x > 0, "bad {x}");
assert_eq!(a, b);` },
  { term: '#[should_panic]', cat: 'Testing', module: 8, desc: 'The test passes only if it panics. `expected` checks the message.', syntax: `#[test]
#[should_panic(expected = "overflow")]
fn t() { /* ... */ }` },
  { term: '#[ignore]', cat: 'Testing', module: 8, desc: 'Skips a test unless run with `-- --ignored`.', syntax: `#[test] #[ignore = "slow"] fn big() {}` },
  { term: 'Integration test', cat: 'Testing', module: 8, desc: 'A file in `tests/`, compiled as a separate crate that sees only the public API.', syntax: `// tests/api.rs
use my_lib::mid;` },
  { term: 'Doc test', cat: 'Testing', module: 8, desc: 'A code block in a `///` comment, compiled and run by `cargo test`. Fence attributes: `no_run`, `ignore`, `should_panic`, `compile_fail`.', syntax: `/// \`\`\`
/// assert_eq!(my_lib::mid(1.0, 3.0), 2.0);
/// \`\`\`` },
  { term: 'cargo test flags', cat: 'Testing', module: 8, desc: 'Filter by name, select `--lib`, `--doc` or `--test name`, and pass harness flags after `--`.', syntax: `cargo test mid
cargo test -- --nocapture --test-threads=1` },
  { term: 'proptest / criterion / insta', cat: 'Testing', module: 8, desc: 'Popular testing crates: property-based testing, statistical benchmarks and snapshot testing.', syntax: `proptest! { #[test] fn p(x in 0..100) { /* ... */ } }` },
  // ---------- Command-line programs ----------
  { term: 'env::args', cat: 'Command line', module: 8, desc: 'Iterator over command-line arguments. The first item is the program name.', syntax: `let args: Vec<String> = std::env::args().collect();` },
  { term: 'clap', cat: 'Command line', module: 8, desc: 'The standard argument-parsing crate. A derive on a struct gives flags, subcommands, `--help` and validation.', syntax: `#[derive(clap::Parser)]
struct Args { #[arg(short, long)] verbose: bool, path: PathBuf }` },
  { term: 'stdout vs stderr', cat: 'Command line', module: 8, desc: '`println!` writes results to stdout and `eprintln!` writes diagnostics to stderr, so pipelines stay clean.', syntax: `eprintln!("error: {e}");` },
  { term: 'BufReader / BufWriter', cat: 'Command line', module: 8, desc: 'Wrap a reader or writer to batch system calls. Essential for line-by-line I/O.', syntax: `let out = BufWriter::new(io::stdout().lock());` },
  { term: 'Thin main', cat: 'Command line', module: 8, desc: 'A pattern: `main.rs` parses arguments and reports errors, and `lib.rs` holds the logic so it can be tested.', syntax: `fn main() { if let Err(e) = app::run() { eprintln!("{e}"); std::process::exit(1) } }` },
  // ---------- Closures ----------
  { term: 'Closure', cat: 'Closures', module: 9, desc: 'An anonymous function that captures variables from its environment. Each closure has its own unique type.', syntax: `let add = |a, b| a + b;
let tax = 0.2; let f = |p: f64| p * (1.0 + tax);` },
  { term: 'move closure', cat: 'Closures', module: 9, desc: 'Forces a closure to take ownership of the variables it uses. Required for threads and for returning closures.', syntax: `let s = String::new();
thread::spawn(move || println!("{s}"));` },
  { term: 'Fn / FnMut / FnOnce', cat: 'Closures', module: 9, desc: 'The closure traits: callable repeatedly by shared reference, repeatedly with mutation, or exactly once. `Fn` implies `FnMut`, which implies `FnOnce`.', syntax: `fn run<F: FnMut()>(mut f: F) { f(); f(); }` },
  { term: 'impl Fn / Box<dyn Fn>', cat: 'Closures', module: 9, desc: '`impl Fn` returns or accepts one closure type statically. `Box<dyn Fn>` erases the type for heterogeneous or stored callbacks.', syntax: `fn adder(n: i32) -> impl Fn(i32) -> i32 { move |x| x + n }
let cbs: Vec<Box<dyn Fn(i32) -> i32>> = vec![];` },
  { term: 'Function pointer fn', cat: 'Closures', module: 9, desc: 'A pointer to a function. Non-capturing closures and named functions coerce to it. It implements all `Fn*` traits.', syntax: `let f: fn(i32) -> i32 = |x| x + 1;` },
  { term: 'Async closure', cat: 'Closures', module: 9, desc: 'A closure that returns a future, and can borrow its captures across `.await`. Bounded with `AsyncFn`, `AsyncFnMut`, `AsyncFnOnce`.', since: 'Rust 1.85', syntax: `let f = async |x: u32| x + 1;` },
  // ---------- Iterators ----------
  { term: 'Iterator', cat: 'Iterators', module: 9, desc: 'A trait with `type Item` and `fn next(&mut self) -> Option<Item>`. All the adapters are provided methods.', syntax: `impl Iterator for Countdown {
    type Item = u32;
    fn next(&mut self) -> Option<u32> { /* ... */ }
}` },
  { term: 'iter / iter_mut / into_iter', cat: 'Iterators', module: 9, desc: 'Borrow items (`&T`), borrow mutably (`&mut T`), or take ownership (`T`).', syntax: `for x in &v {}
for x in &mut v {}
for x in v {}` },
  { term: 'IntoIterator / FromIterator', cat: 'Iterators', module: 9, desc: '`IntoIterator` powers `for` loops. `FromIterator` powers `collect`. Implement them for your own collections.', syntax: `impl FromIterator<i32> for MyColl { /* ... */ }` },
  { term: 'map / filter / filter_map', cat: 'Iterators', module: 9, desc: 'Transform items, keep items, or do both when the closure returns `Option`.', syntax: `it.map(|x| x * 2).filter(|x| *x > 3)
it.filter_map(|s| s.parse().ok())` },
  { term: 'enumerate / zip / chain', cat: 'Iterators', module: 9, desc: 'Attach indices, pair two iterators, or concatenate them.', syntax: `for (i, x) in v.iter().enumerate() {}
a.iter().zip(b.iter())` },
  { term: 'take / skip / step_by / rev', cat: 'Iterators', module: 9, desc: 'Limit, skip, stride and reverse an iterator.', syntax: `(0..100).step_by(10).take(3)
v.iter().rev()` },
  { term: 'flat_map / flatten', cat: 'Iterators', module: 9, desc: 'Map each item to an iterator and join them, or flatten nested iterables (including `Option`).', syntax: `words.iter().flat_map(|w| w.chars())` },
  { term: 'peekable / scan / take_while', cat: 'Iterators', module: 9, desc: '`peekable` looks ahead, `scan` threads state (running totals), `take_while` stops at the first failure.', syntax: `let mut it = s.chars().peekable();
while let Some(c) = it.next_if(|c| c.is_ascii_digit()) {}` },
  { term: 'collect', cat: 'Iterators', module: 9, desc: 'Builds a collection from an iterator: `Vec`, `String`, `HashMap`, `Result<Vec<_>, _>` and more.', syntax: `let v: Vec<_> = it.collect();
let m: HashMap<_, _> = pairs.into_iter().collect();` },
  { term: 'sum / product / count / min / max', cat: 'Iterators', module: 9, desc: 'Reduce an iterator to one value. `sum` and `product` need a result type.', syntax: `let s: f64 = xs.iter().sum();
let m = v.iter().max_by_key(|t| t.px);` },
  { term: 'fold / reduce / try_fold', cat: 'Iterators', module: 9, desc: 'General reductions. `fold` takes an initial value, `reduce` uses the first item, `try_fold` can stop early with an error.', syntax: `let t = v.iter().fold(0, |a, x| a + x);` },
  { term: 'find / position / any / all', cat: 'Iterators', module: 9, desc: 'Short-circuiting searches and tests.', syntax: `v.iter().find(|x| **x > 3)
v.iter().position(|x| *x == 3)
v.iter().any(|x| *x > 0)` },
  { term: 'partition / unzip', cat: 'Iterators', module: 9, desc: 'Split an iterator into two collections by a predicate, or split pairs.', syntax: `let (even, odd): (Vec<_>, Vec<_>) = v.into_iter().partition(|x| x % 2 == 0);` },
  { term: 'windows / chunks / chunk_by', cat: 'Iterators', module: 9, desc: 'Slice methods that yield overlapping windows, disjoint chunks, or runs of consecutive equal items.', syntax: `v.windows(2).map(|w| w[1] - w[0])
v.chunks(4)
v.chunk_by(|a, b| a == b)` },
  { term: 'repeat_n / from_fn / successors', cat: 'Iterators', module: 9, desc: 'Create iterators from nothing: `repeat_n(x, n)`, `from_fn(|| ...)`, `successors(first, |prev| next)`.', syntax: `let it = std::iter::successors(Some(1), |&x| (x < 100).then_some(x * 2));` },
  { term: 'Lazy evaluation', cat: 'Iterators', module: 9, desc: 'Adapters do nothing until a consumer pulls items. This enables early exit and streaming.', syntax: `let first = huge.iter().map(f).find(p);   // stops at the first match` },
  { term: 'Zero-cost abstraction', cat: 'Iterators', module: 9, desc: 'High-level code (iterator chains, generics) compiles to the same machine code as a hand-written loop.', syntax: `v.iter().filter(p).map(f).sum::<i32>()` },
  // ---------- Smart pointers ----------
  { term: 'Box<T>', cat: 'Smart pointers', module: 10, desc: 'A single-owner pointer to a heap value, freed when dropped. For recursive types, trait objects and moving large values cheaply.', syntax: `enum List { Cons(i32, Box<List>), Nil }
let s: Box<dyn Shape> = Box::new(Circle(1.0));` },
  { term: 'Deref / DerefMut', cat: 'Smart pointers', module: 10, desc: 'Traits that make a wrapper act like a reference to its contents, enabling `*x` and deref coercion.', syntax: `impl<T> Deref for MyBox<T> { type Target = T; fn deref(&self) -> &T { &self.0 } }` },
  { term: 'RAII', cat: 'Smart pointers', module: 10, desc: 'Resource Acquisition Is Initialisation: owning a value owns the resource (file, lock, memory), and dropping releases it on every path.', syntax: `{ let guard = mutex.lock().unwrap(); }   // unlocked here` },
  { term: 'mem::forget / ManuallyDrop', cat: 'Smart pointers', module: 10, desc: 'Skip a destructor. Safe, but leaks. Used with FFI and low-level code.', syntax: `std::mem::forget(handle);` },
  { term: 'Rc<T>', cat: 'Smart pointers', module: 10, desc: 'Single-threaded reference-counted shared ownership. Cloning copies the pointer and increments the count.', syntax: `let a = Rc::new(5);
let b = Rc::clone(&a);
Rc::strong_count(&a)   // 2` },
  { term: 'Arc<T>', cat: 'Smart pointers', module: 10, desc: 'Atomically reference-counted `Rc`, safe to share across threads when `T: Send + Sync`.', syntax: `let d = Arc::new(vec![1]);
let d2 = Arc::clone(&d);
thread::spawn(move || d2.len());` },
  { term: 'make_mut / get_mut / try_unwrap', cat: 'Smart pointers', module: 10, desc: 'Mutable access to `Rc`/`Arc` contents: clone-on-write, only if unique, or extract the value if last owner.', syntax: `Arc::make_mut(&mut a).push(1);
Rc::try_unwrap(rc)` },
  { term: 'Weak<T>', cat: 'Smart pointers', module: 10, desc: 'A non-owning pointer to an `Rc`/`Arc` allocation. `upgrade()` returns `Option` and is `None` once the value is gone.', syntax: `let w = Rc::downgrade(&rc);
if let Some(r) = w.upgrade() {}` },
  { term: 'Reference cycle', cat: 'Smart pointers', module: 10, desc: 'Strong `Rc` references that form a loop never reach zero and leak. Break them with `Weak` or avoid pointers using indices.', syntax: `// parent: Weak<Node>, children: Vec<Rc<Node>>` },
  { term: 'Cell<T>', cat: 'Interior mutability', module: 10, desc: 'Interior mutability for simple values: `get`, `set`, `replace`, `take`, `update`. Never hands out references.', syntax: `let c = Cell::new(1);
c.set(c.get() + 1);` },
  { term: 'RefCell<T>', cat: 'Interior mutability', module: 10, desc: 'Borrow rules checked at run time: `borrow()` and `borrow_mut()` panic on conflict. Single-threaded.', syntax: `let r = RefCell::new(vec![]);
r.borrow_mut().push(1);` },
  { term: 'Rc<RefCell<T>>', cat: 'Interior mutability', module: 10, desc: 'The pattern for shared, mutable data on one thread. The multi-threaded form is `Arc<Mutex<T>>`.', syntax: `let s = Rc::new(RefCell::new(0));
*s.borrow_mut() += 1;` },
  { term: 'OnceCell / OnceLock', cat: 'Interior mutability', module: 10, desc: 'A cell that can be set once. `OnceLock` is thread-safe and suitable for statics.', since: 'Rust 1.70', syntax: `static CFG: OnceLock<String> = OnceLock::new();
CFG.set("x".into()).ok();` },
  { term: 'LazyCell / LazyLock', cat: 'Interior mutability', module: 10, desc: 'A value computed on first access. `LazyLock` is for `static` items.', since: 'Rust 1.80', syntax: `static T: LazyLock<Vec<u8>> = LazyLock::new(|| build());` },
  { term: 'Cow<\'a, B>', cat: 'Smart pointers', module: 10, desc: 'Clone-on-write: either a borrowed value or an owned one, allocating only when modification is needed.', syntax: `fn clean(s: &str) -> Cow<'_, str> {
    if s.contains(' ') { Cow::Owned(s.replace(' ', "_")) } else { Cow::Borrowed(s) }
}` },
  // ---------- Concurrency ----------
  { term: 'thread::spawn', cat: 'Concurrency', module: 11, desc: 'Starts an OS thread running a closure that must be `Send + \'static`. Returns a `JoinHandle` whose `join()` yields the result or the panic.', syntax: `let h = thread::spawn(move || work(data));
let r = h.join().unwrap();` },
  { term: 'thread::scope', cat: 'Concurrency', module: 11, desc: 'Spawns threads that may borrow local variables, all joined before the scope returns.', since: 'Rust 1.63', syntax: `thread::scope(|s| {
    s.spawn(|| left.iter().sum::<i32>());
});` },
  { term: 'JoinHandle', cat: 'Concurrency', module: 11, desc: 'A handle to a running thread. `join()` waits and returns `Result<T, Box<dyn Any + Send>>`.', syntax: `if let Err(e) = h.join() { /* thread panicked */ }` },
  { term: 'mpsc::channel', cat: 'Concurrency', module: 11, desc: 'A multi-producer, single-consumer channel. `send` moves the value, `recv` blocks, and iteration ends when all senders are dropped.', syntax: `let (tx, rx) = mpsc::channel();
tx.send(msg)?;
for m in rx {}` },
  { term: 'sync_channel', cat: 'Concurrency', module: 11, desc: 'A bounded channel: `send` blocks when the buffer is full, giving back-pressure.', syntax: `let (tx, rx) = mpsc::sync_channel::<u64>(100);` },
  { term: 'Mutex<T>', cat: 'Concurrency', module: 11, desc: 'Mutual exclusion that owns its data. `lock()` returns a guard that releases the lock when dropped.', syntax: `let m = Mutex::new(0);
*m.lock().unwrap() += 1;` },
  { term: 'Lock poisoning', cat: 'Concurrency', module: 11, desc: 'A mutex becomes poisoned if a thread panics while holding it. `lock()` then returns `Err`, and `into_inner()` recovers the guard.', syntax: `let g = m.lock().unwrap_or_else(|e| e.into_inner());` },
  { term: 'RwLock<T>', cat: 'Concurrency', module: 11, desc: 'Many readers or one writer. `read()` and `write()` return guards.', syntax: `let r = lock.read().unwrap();
let mut w = lock.write().unwrap();` },
  { term: 'Arc<Mutex<T>>', cat: 'Concurrency', module: 11, desc: 'The standard pair for shared, mutable state across threads.', syntax: `let c = Arc::new(Mutex::new(0));
let c2 = Arc::clone(&c);` },
  { term: 'Condvar', cat: 'Concurrency', module: 11, desc: 'Lets a thread wait until another signals that a mutex-protected condition changed.', syntax: `let g = cv.wait_while(m.lock().unwrap(), |ready| !*ready).unwrap();` },
  { term: 'Send', cat: 'Concurrency', module: 11, desc: 'Auto trait: a value of this type can be moved to another thread. `Rc` and `MutexGuard` are not `Send`.', syntax: `fn spawn<F: FnOnce() + Send + 'static>(f: F) {}` },
  { term: 'Sync', cat: 'Concurrency', module: 11, desc: 'Auto trait: `&T` can be shared between threads. `Cell` and `RefCell` are not `Sync`.', syntax: `// T: Sync  <=>  &T: Send` },
  { term: 'Data race', cat: 'Concurrency', module: 11, desc: 'Unsynchronised concurrent access where at least one is a write. Impossible in safe Rust. Deadlocks and logical races still are.', syntax: `// two threads, one &mut, one &: rejected at compile time` },
  { term: 'Atomic types', cat: 'Concurrency', module: 11, desc: 'Lock-free single-value operations: `AtomicBool`, `AtomicUsize`, `AtomicU64`, `AtomicPtr` and more.', syntax: `COUNT.fetch_add(1, Ordering::Relaxed);
flag.store(true, Ordering::Release);` },
  { term: 'Ordering', cat: 'Concurrency', module: 11, desc: 'Memory ordering for atomics: `Relaxed`, `Acquire`, `Release`, `AcqRel`, `SeqCst`. Use `SeqCst` unless you can justify a weaker one.', syntax: `x.compare_exchange(0, 1, Ordering::AcqRel, Ordering::Acquire)` },
  { term: 'Rayon', cat: 'Concurrency', module: 11, desc: 'A data-parallelism crate: `par_iter()` and `par_chunks()` run iterator pipelines on a work-stealing thread pool.', syntax: `use rayon::prelude::*;
let s: f64 = v.par_iter().sum();` },
  { term: 'Deadlock', cat: 'Concurrency', module: 11, desc: 'Threads waiting on each other\'s locks forever. Not prevented by the compiler: take locks in a consistent order and keep critical sections short.', syntax: `// A: lock(a) then lock(b)   B: lock(b) then lock(a)` },
  // ---------- Async ----------
  { term: 'async fn', cat: 'Async', module: 12, desc: 'Declares a function whose body is a state machine. Calling it returns a lazy future and does no work until polled.', syntax: `async fn fetch(sym: &str) -> f64 { 1.0 }` },
  { term: '.await', cat: 'Async', module: 12, desc: 'Suspends the current async function until a future is ready, yielding to the runtime meanwhile. Only valid in async contexts.', syntax: `let px = fetch("XAU").await;
let body = client.get(u).send().await?.text().await?;` },
  { term: 'async block', cat: 'Async', module: 12, desc: 'An anonymous future. `async move { }` takes ownership of captures.', syntax: `let f = async move { n + 1 };` },
  { term: 'Future', cat: 'Async', module: 12, desc: 'A trait with `poll(Pin<&mut Self>, &mut Context) -> Poll<Output>`. In the prelude since the 2024 edition.', since: 'Rust 2024', syntax: `fn work() -> impl Future<Output = u32> { async { 1 } }` },
  { term: 'Poll / Waker / Context', cat: 'Async', module: 12, desc: '`Poll::Ready(v)` or `Pending`. The `Waker` in the `Context` tells the executor when a pending future can make progress.', syntax: `cx.waker().wake_by_ref();
Poll::Pending` },
  { term: 'Runtime / executor', cat: 'Async', module: 12, desc: 'Code that polls futures and handles I/O readiness and timers. The standard library has none: use Tokio, smol or embassy.', syntax: `#[tokio::main]
async fn main() {}` },
  { term: 'tokio::spawn', cat: 'Async', module: 12, desc: 'Runs a future as an independent task. The future must be `Send + \'static` on the multi-threaded runtime. Returns a `JoinHandle`.', syntax: `let h = tokio::spawn(async move { work(data).await });
h.await?;` },
  { term: 'spawn_blocking', cat: 'Async', module: 12, desc: 'Runs blocking or CPU-heavy code on a dedicated thread pool so it does not stall async workers.', syntax: `let h = tokio::task::spawn_blocking(|| hash_file(p)).await?;` },
  { term: 'join! / try_join!', cat: 'Async', module: 12, desc: 'Poll several futures concurrently within one task and return all results. `try_join!` stops at the first error.', syntax: `let (a, b) = tokio::join!(f1(), f2());` },
  { term: 'select!', cat: 'Async', module: 12, desc: 'Waits for the first of several futures and drops the others. Branches must be cancel-safe.', syntax: `select! { v = rx.recv() => {}, _ = sleep(d) => {} }` },
  { term: 'timeout', cat: 'Async', module: 12, desc: 'Wraps a future with a deadline. Returns `Err(Elapsed)` if it takes too long, dropping the future.', syntax: `time::timeout(Duration::from_secs(1), fut).await` },
  { term: 'Cancellation', cat: 'Async', module: 12, desc: 'Dropping a future stops it at its last `.await`. Code between awaits must tolerate being abandoned.', syntax: `drop(fut);
handle.abort();` },
  { term: 'Stream', cat: 'Async', module: 12, desc: 'The async counterpart of `Iterator`, from the `futures` crate. Consume with `StreamExt::next().await`.', syntax: `while let Some(x) = s.next().await {}` },
  { term: 'buffer_unordered', cat: 'Async', module: 12, desc: 'Runs up to N futures from a stream concurrently, yielding results as they finish.', syntax: `stream::iter(urls).map(fetch).buffer_unordered(8)` },
  { term: 'Pin / pin!', cat: 'Async', module: 12, desc: 'Guarantees a value will not move. Needed for self-referential state machines. `Box::pin` and `pin!` create pinned futures.', syntax: `let f = pin!(async { 1 });
let b: Pin<Box<dyn Future<Output = u32>>> = Box::pin(async { 1 });` },
  { term: 'Unpin', cat: 'Async', module: 12, desc: 'Marker for types that are safe to move even when pinned. Most types are `Unpin`, but `async` blocks are not.', syntax: `fn f<F: Future + Unpin>(f: F) {}` },
  { term: 'Async channels', cat: 'Async', module: 12, desc: '`tokio::sync`: `mpsc` (bounded queue), `oneshot` (one reply), `broadcast` (fan-out) and `watch` (latest value).', syntax: `let (tx, mut rx) = mpsc::channel(16);
tx.send(x).await?;` },
  { term: 'tokio::sync::Mutex', cat: 'Async', module: 12, desc: 'A mutex whose `lock().await` can be held across awaits. Prefer a std mutex with a short, await-free critical section.', syntax: `let g = m.lock().await;` },
  { term: 'JoinSet', cat: 'Async', module: 12, desc: 'A collection of spawned tasks awaited as they complete, and aborted when dropped.', syntax: `let mut set = JoinSet::new();
set.spawn(work());
while let Some(r) = set.join_next().await {}` },
  // ---------- Object-oriented design ----------
  { term: 'Encapsulation', cat: 'OO design', module: 13, desc: 'Hiding fields behind a small public API so invariants always hold. In Rust, privacy is per module.', syntax: `pub struct Account { balance: i64 }
impl Account { pub fn balance(&self) -> i64 { self.balance } }` },
  { term: 'Composition over inheritance', cat: 'OO design', module: 13, desc: 'Rust has no struct inheritance: share state by embedding structs, and behaviour with traits and default methods.', syntax: `struct Car { engine: Engine }
impl Car { fn start(&self) { self.engine.start() } }` },
  { term: 'Delegation', cat: 'OO design', module: 13, desc: 'Forwarding a call to an embedded field by writing the method. Crates like `delegate` generate it.', syntax: `fn len(&self) -> usize { self.items.len() }` },
  { term: 'Default method', cat: 'OO design', module: 13, desc: 'A trait method with a body that implementors may override. The Rust way of sharing behaviour.', syntax: `trait Describe { fn name(&self) -> String; fn describe(&self) -> String { self.name() } }` },
  { term: 'Supertrait (interface inheritance)', cat: 'OO design', module: 13, desc: '`trait B: A` requires every implementor of `B` to implement `A` too.', syntax: `trait Vehicle: Describe { fn wheels(&self) -> u32; }` },
  { term: 'Sealed trait', cat: 'OO design', module: 13, desc: 'A public trait that only your crate can implement, via a private supertrait. Lets you add methods without breaking changes.', syntax: `mod private { pub trait Sealed {} }
pub trait Format: private::Sealed {}` },
  { term: 'Expression problem', cat: 'OO design', module: 13, desc: 'Traits make adding types easy and operations hard. Enums make adding operations easy and variants hard.', syntax: `// trait: new type = new impl
// enum: new operation = new match` },
  { term: 'Trait object vs enum', cat: 'OO design', module: 13, desc: 'Use `dyn Trait` for open sets (plugins) and `enum` for closed sets known at compile time.', syntax: `Vec<Box<dyn Shape>>   // open
enum Shape { Circle(f64), Rect(f64, f64) }   // closed` },
  { term: 'dyn Any / downcast', cat: 'OO design', module: 13, desc: 'Recover a concrete type from a trait object with `downcast_ref`. Trait upcasting to `dyn Any` works when the trait extends `Any`.', since: 'Rust 1.86', syntax: `(x as &dyn Any).downcast_ref::<Circle>()` },
  { term: 'self: Box<Self>', cat: 'OO design', module: 13, desc: 'A method receiver that consumes a boxed value, used for state transitions in trait objects.', syntax: `fn approve(self: Box<Self>) -> Box<dyn State>` },
  { term: 'State pattern', cat: 'OO design', module: 13, desc: 'An object delegates to a current state object that returns the next state. Rust stores it as `Option<Box<dyn State>>` and uses `take()`.', syntax: `if let Some(s) = self.state.take() { self.state = Some(s.approve()); }` },
  { term: 'Type-state pattern', cat: 'OO design', module: 13, desc: 'Encode the state in the type so each transition consumes one type and returns another. Invalid sequences do not compile.', syntax: `impl DraftPost { fn request_review(self) -> PendingPost { /* ... */ } }` },
  { term: 'Builder pattern', cat: 'OO design', module: 13, desc: 'Construct a value step by step with chained methods, then `build()`. Rust has no default arguments or overloading.', syntax: `Order::builder().symbol("XAU").qty(10).build()` },
  { term: 'PhantomData', cat: 'OO design', module: 13, desc: 'A zero-sized marker that lets a type carry a generic parameter it does not store, as in type-state APIs.', syntax: `struct Handle<S> { id: u32, _s: PhantomData<S> }` },
  { term: '#[must_use]', cat: 'OO design', module: 13, desc: 'Warns when a value or function result is ignored. Useful on builders, guards and `Result`-like types.', syntax: `#[must_use = "call build()"]
struct Builder;` },
  { term: 'Newtype pattern', cat: 'OO design', module: 13, desc: 'A single-field tuple struct that creates a distinct, validated type at no runtime cost.', syntax: `struct Email(String);
struct UserId(u64);` },
  { term: 'Strategy / Observer via closures', cat: 'OO design', module: 13, desc: 'Closures and `Vec<Box<dyn Fn>>` replace many class-based patterns.', syntax: `handlers: Vec<Box<dyn Fn(&Event)>>` },
  // ---------- Unsafe ----------
  { term: 'unsafe', cat: 'Unsafe', module: 14, desc: 'Unlocks five operations the compiler cannot check: dereferencing raw pointers, calling unsafe functions, accessing mutable statics, implementing unsafe traits and reading union fields. It does not disable borrow checking.', syntax: `unsafe { *ptr = 1; }
unsafe fn f() {}
unsafe impl Send for T {}` },
  { term: 'Raw pointer', cat: 'Unsafe', module: 14, desc: '`*const T` and `*mut T`: pointers with no lifetime or aliasing guarantees. Create with `&raw const`, `&raw mut`, `as`, or `as_ptr()`.', since: 'Rust 1.82', syntax: `let p = &raw const x;
let q = v.as_mut_ptr();` },
  { term: 'Undefined behaviour (UB)', cat: 'Unsafe', module: 14, desc: 'What happens when unsafe code breaks the rules: dangling or misaligned pointers, data races, invalid values, aliasing violations. The compiler may assume it never occurs.', syntax: `// detect with: cargo +nightly miri test` },
  { term: 'Safe abstraction', cat: 'Unsafe', module: 14, desc: 'A safe function or type whose implementation uses `unsafe` but whose interface cannot be misused. The goal of all unsafe code.', syntax: `// SAFETY: halves are disjoint and in bounds
unsafe { from_raw_parts_mut(ptr, mid) }` },
  { term: 'unsafe extern / FFI', cat: 'Unsafe', module: 14, desc: 'Declares foreign functions. In the 2024 edition the block is `unsafe extern`, and individual items may be marked `safe`.', since: 'Rust 2024', syntax: `unsafe extern "C" {
    pub safe fn abs(x: i32) -> i32;
    pub unsafe fn strlen(s: *const c_char) -> usize;
}` },
  { term: '#[repr(C)]', cat: 'Unsafe', module: 14, desc: 'Fixes a C-compatible memory layout. Also `repr(u8)`, `repr(transparent)` and `repr(align(N))`. Rust\'s default layout is unspecified.', syntax: `#[repr(C)] struct Header { tag: u8, len: u32 }` },
  { term: '#[unsafe(no_mangle)]', cat: 'Unsafe', module: 14, desc: 'Exports a function under its plain name for C. In the 2024 edition the attribute must be wrapped in `unsafe(...)`.', since: 'Rust 2024', syntax: `#[unsafe(no_mangle)]
pub extern "C" fn add(a: i32, b: i32) -> i32 { a + b }` },
  { term: 'static mut', cat: 'Unsafe', module: 14, desc: 'A mutable global. Access needs `unsafe`, and taking a reference to it is denied by default in the 2024 edition. Prefer atomics, `Mutex` or `OnceLock`.', syntax: `static mut N: u32 = 0;
unsafe { N += 1; }` },
  { term: 'union', cat: 'Unsafe', module: 14, desc: 'Fields share memory, as in C. Reading a field is unsafe because you must know which one is valid.', syntax: `union U { i: u32, f: f32 }
let x = unsafe { U { i: 1 }.f };` },
  { term: 'MaybeUninit', cat: 'Unsafe', module: 14, desc: 'A wrapper for memory that may not be initialised yet, the safe way to handle uninitialised buffers.', syntax: `let mut b = MaybeUninit::<[u8; 4]>::uninit();` },
  { term: 'transmute', cat: 'Unsafe', module: 14, desc: 'Reinterprets the bits of one type as another. Almost always avoidable: use `from_le_bytes`, `as` casts or `bytemuck`.', syntax: `let f: f32 = unsafe { mem::transmute(0x3f800000u32) };` },
  // ---------- Advanced traits and types ----------
  { term: 'Associated type vs generic parameter', cat: 'Advanced types', module: 14, desc: 'Use an associated type when each implementor has one natural choice (`Iterator::Item`) and a generic parameter when several are possible (`From<T>`).', syntax: `trait Iterator { type Item; }
trait From<T> { fn from(t: T) -> Self; }` },
  { term: 'Default type parameter', cat: 'Advanced types', module: 14, desc: 'A generic parameter with a default, such as `Add<Rhs = Self>`, so the common case stays short.', syntax: `trait Add<Rhs = Self> { type Output; fn add(self, r: Rhs) -> Self::Output; }` },
  { term: 'Fully qualified syntax', cat: 'Advanced types', module: 14, desc: '`<Type as Trait>::item` chooses a specific trait\'s item when names clash or there is no `self` to infer from.', syntax: `<Dog as Animal>::baby_name()
Pilot::fly(&person);` },
  { term: 'Type alias', cat: 'Advanced types', module: 14, desc: 'Another name for an existing type. It is not a new type.', syntax: `type Result<T> = std::result::Result<T, MyError>;` },
  { term: 'DST and fat pointer', cat: 'Advanced types', module: 14, desc: 'Dynamically sized types (`str`, `[T]`, `dyn Trait`) can only be used behind a pointer that also carries a length or vtable.', syntax: `&str      // pointer + length
&dyn T    // pointer + vtable` },
  { term: 'Sized / ?Sized', cat: 'Advanced types', module: 14, desc: 'Every generic parameter is `Sized` by default. `T: ?Sized` also accepts `str`, `[T]` and `dyn Trait` behind a reference.', syntax: `fn show<T: ?Sized + Display>(t: &T) {}` },
  { term: 'Niche optimisation', cat: 'Advanced types', module: 14, desc: 'Types with unused bit patterns let `Option` reuse them, so `Option<Box<T>>` and `Option<&T>` are pointer-sized.', syntax: `size_of::<Option<Box<i32>>>() == size_of::<Box<i32>>()` },
  { term: 'Zero-sized type', cat: 'Advanced types', module: 14, desc: 'A type with no data: `()`, unit structs, `PhantomData`. It takes no space and its operations cost nothing.', syntax: `struct Marker;   // size_of == 0` },
  // ---------- Function pointers and macros ----------
  { term: 'fn pointer type', cat: 'Functions & macros', module: 14, desc: 'The type `fn(i32) -> i32`, a pointer to a function. Non-capturing closures coerce to it, and it implements all `Fn*` traits.', syntax: `let f: fn(i32) -> i32 = |x| x + 1;` },
  { term: 'Constructor as function', cat: 'Functions & macros', module: 14, desc: 'Tuple-struct and enum-variant constructors are functions, so they can be passed to `map`.', syntax: `(0..3).map(Status::Value).collect::<Vec<_>>()
strs.iter().map(ToString::to_string)` },
  { term: 'macro_rules!', cat: 'Functions & macros', module: 14, desc: 'Declarative macros: pattern arms that expand into code at compile time. Hygienic, and operating on token trees.', syntax: `macro_rules! sq { ($x:expr) => { $x * $x }; }` },
  { term: 'Macro fragment specifiers', cat: 'Functions & macros', module: 14, desc: 'What a `$name:kind` can capture: `expr`, `ident`, `ty`, `pat`, `stmt`, `block`, `item`, `path`, `tt`, `literal`, `lifetime`, `vis`, `meta`.', syntax: `($name:ident : $t:ty) => { /* ... */ }` },
  { term: 'Macro repetition', cat: 'Functions & macros', module: 14, desc: '`$( ... ),*` and `$( ... );+` match or emit a group repeatedly, with a separator and a count of `*`, `+` or `?`.', syntax: `$( m.insert($k, $v); )*` },
  { term: 'Procedural macro', cat: 'Functions & macros', module: 14, desc: 'Rust code that transforms tokens at compile time: custom derive, attribute-like and function-like. Built with `syn` and `quote`.', syntax: `#[proc_macro_derive(Describe)]
pub fn derive(input: TokenStream) -> TokenStream { /* ... */ }` },
  { term: 'cargo expand', cat: 'Functions & macros', module: 14, desc: 'Shows the code after macro expansion. The main tool for understanding and debugging macros.', syntax: `cargo install cargo-expand
cargo expand module::path` },
]
