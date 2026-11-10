import type { StdEntry } from '../standard'

// The most useful types and methods in Rust's standard library.
export const RUST_STANDARD: StdEntry[] = [
  // ---------------- Text and formatting ----------------
  {
    name: 'format! / println! / write!', header: 'std::fmt', cat: 'Text', module: 1,
    summary: 'Build or print formatted text with {} placeholders.',
    what: '`format!` returns a `String`, `println!` prints with a newline to stdout, `eprintln!` to stderr, and `write!` writes to anything implementing `fmt::Write` or `io::Write`. `{}` uses `Display`, `{:?}` uses `Debug` and `{:#?}` pretty-prints. Specs: `{:>8}` right-align, `{:08.3}` zero-pad, `{:x}` hex, `{:e}` scientific. Variables can be inlined: `{px:.2}`.',
    code: `let px = 2390.5;
let sym = "XAU";
println!("{sym:<6}|{px:>10.2}");
let s = format!("{:?} {:#x}", vec![1, 2], 255);   // "[1, 2] 0xff"
eprintln!("warning: {}", 42);`,
    when: 'All text output, logging and building strings. For hot loops that build lots of text, `write!` into a reused `String` avoids allocating one per line.',
  },
  {
    name: 'str::parse', header: 'core::str', cat: 'Text', module: 1,
    summary: 'Convert text to a number (or any FromStr type).',
    what: '`s.parse::<T>()` returns `Result<T, T::Err>`. It works for all integer and float types, `bool`, `char`, `IpAddr` and any type implementing `FromStr`. It does not trim whitespace, so call `trim()` first.',
    code: `let n: i32 = "42".parse().unwrap();
let f = " 3.5 ".trim().parse::<f64>();      // Ok(3.5)
let bad = "x".parse::<u8>();                // Err(ParseIntError)`,
    when: 'Reading numbers from args, files, environment variables or user input. Always handle the `Err`: input is untrusted.',
  },
  // ---------------- Numbers ----------------
  {
    name: 'Integer checked / wrapping / saturating ops', header: 'core::num', cat: 'Numbers', module: 1,
    summary: 'Say what overflow should do instead of hoping.',
    what: 'Every integer type has `checked_add/sub/mul/div` returning `Option`, `wrapping_*` for modular arithmetic, `saturating_*` to clamp at the limits, and `overflowing_*` returning `(value, overflowed)`. Plain `+` panics in debug builds and wraps in release unless `overflow-checks` is on.',
    code: `let a = u8::MAX;
assert_eq!(a.checked_add(1), None);
assert_eq!(a.wrapping_add(1), 0);
assert_eq!(a.saturating_add(1), 255);
assert_eq!(a.overflowing_add(1), (0, true));`,
    when: 'Hashing and checksums want `wrapping_*`. Money, sizes and counters from outside input want `checked_*`. Gauges and progress bars want `saturating_*`.',
  },
  {
    name: 'min / max / clamp / abs / pow', header: 'core::cmp, core::num', cat: 'Numbers', module: 1,
    summary: 'Everyday numeric helpers, as methods.',
    what: '`a.min(b)`, `a.max(b)` and `x.clamp(lo, hi)` work on any `Ord` type (floats have their own inherent versions, since `f64` is not `Ord`). Integers have `abs`, `pow`, `rem_euclid`, `signum`, `leading_zeros` and `count_ones`. Floats have `sqrt`, `powi`, `powf`, `floor`, `round` and `total_cmp`.',
    code: `let x = 15.clamp(0, 10);            // 10
let m = (-7i32).rem_euclid(3);      // 2, never negative
let r = 2.0_f64.sqrt().round();
let hi = [1.5, 0.2].iter().cloned().fold(f64::MIN, f64::max);`,
    when: 'Bounding values, cycling indices and basic maths. Use `rem_euclid` instead of `%` when the left side may be negative.',
  },
  // ---------------- Ownership helpers ----------------
  {
    name: 'mem::take / replace / swap', header: 'std::mem', cat: 'Ownership', module: 2,
    summary: 'Move a value out of a &mut by leaving something valid behind.',
    what: 'You cannot move out of a `&mut` and leave a hole, so these functions swap in a replacement. `take(&mut x)` leaves `Default::default()` and returns the old value, `replace(&mut x, v)` leaves `v`, and `swap(&mut a, &mut b)` exchanges two places. `Option::take` is the same idea for `Option`.',
    code: `let mut buf = vec![1, 2, 3];
let old = std::mem::take(&mut buf);          // old = [1,2,3], buf = []
let prev = std::mem::replace(&mut buf, vec![9]);
let mut a = 1; let mut b = 2;
std::mem::swap(&mut a, &mut b);              // a = 2, b = 1`,
    when: 'State machines (`self.state = next(take(&mut self.state))`), draining a buffer you own through `&mut self`, and any time the borrow checker says "cannot move out of borrowed content".',
  },
  {
    name: 'Clone and Copy derives', header: 'core::clone, core::marker', cat: 'Ownership', module: 2,
    summary: 'Opt a type in to explicit copies or implicit bitwise copies.',
    what: '`#[derive(Clone)]` generates `.clone()` by cloning each field. `#[derive(Clone, Copy)]` also makes assignment copy instead of move. Every field must itself be `Clone` / `Copy`. `Copy` is for small plain-data types (coordinates, ids, flags) and is a promise that duplicating is trivial.',
    code: `#[derive(Debug, Clone, Copy, PartialEq)]
struct Point { x: f64, y: f64 }

let a = Point { x: 1.0, y: 2.0 };
let b = a;                 // copy: a is still usable
println!("{a:?} {b:?}");`,
    when: 'Derive `Copy` on small value types, because it removes friction. Leave it off for anything large or resource-owning, and for types where an accidental copy would be a bug.',
  },
  // ---------------- Slices ----------------
  {
    name: 'slice::split_at / chunks / windows', header: 'core::slice', cat: 'Slices', module: 2,
    summary: 'Cut a slice into borrowed pieces without copying.',
    what: '`split_at(i)` gives two sub-slices. `chunks(n)` yields non-overlapping pieces (the last may be shorter), `chunks_exact(n)` only full ones, and `windows(n)` yields every overlapping run of `n`. `split_at_mut` and `chunks_mut` give mutable, non-overlapping pieces. All return borrowed views.',
    code: `let v = [1, 2, 3, 4, 5];
let (l, r) = v.split_at(2);                       // [1,2] and [3,4,5]
let sums: Vec<i32> = v.chunks(2).map(|c| c.iter().sum()).collect();
let diffs: Vec<i32> = v.windows(2).map(|w| w[1] - w[0]).collect();`,
    when: 'Batching work, moving averages, returns from consecutive prices, parsing fixed-size records and splitting a buffer to process halves in parallel.',
  },
  {
    name: 'slice::get_disjoint_mut', header: 'core::slice', cat: 'Slices', module: 2, since: 'Rust 1.86',
    summary: 'Several &mut references into one slice, checked for overlap.',
    what: 'Takes an array of indices and returns `Result<[&mut T; N], GetDisjointMutError>`. It fails if two indices are equal or any is out of range. `HashMap::get_disjoint_mut` does the same by key.',
    code: `let mut v = vec![10, 20, 30];
if let Ok([a, b]) = v.get_disjoint_mut([0, 2]) {
    std::mem::swap(a, b);
}`,
    when: 'Updating two elements of one collection together (transferring between two accounts held in a Vec) without `split_at_mut` index arithmetic.',
  },
  {
    name: 'str::get / is_char_boundary / char_indices', header: 'core::str', cat: 'Text', module: 2,
    summary: 'Slice strings safely when input may not be ASCII.',
    what: '`s.get(a..b)` returns `None` instead of panicking when an offset is out of range or not on a UTF-8 boundary. `is_char_boundary(i)` tests an offset and `char_indices()` yields `(byte_offset, char)` pairs so you can find real boundaries.',
    code: `let s = "h\u{e9}llo";
assert_eq!(s.get(0..2), None);              // splits the two-byte e-acute
assert_eq!(s.get(0..3), Some("h\u{e9}"));
let pos = s.char_indices().nth(2).map(|(i, _)| i);   // byte offset of 3rd char`,
    when: 'Truncating or slicing text from users, files or the network. Direct `&s[a..b]` is fine for ASCII you control.',
  },
]
