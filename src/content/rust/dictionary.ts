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
]
