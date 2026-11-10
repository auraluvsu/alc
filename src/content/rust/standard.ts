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
]
