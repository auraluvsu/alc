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
  // ---------------- Option ----------------
  {
    name: 'Option combinators', header: 'core::option', cat: 'Option & Result', module: 3,
    summary: 'map, and_then, unwrap_or, ok_or, filter, take: work with Option without matching.',
    what: '`map(f)` transforms the inside, `and_then(f)` chains a step that itself returns an `Option`, `filter(p)` keeps it only if `p` holds, `unwrap_or(d)` / `unwrap_or_else(f)` / `unwrap_or_default()` provide a fallback, `ok_or(err)` turns it into a `Result`, `take()` leaves `None` behind and returns the old value, and `is_some_and(f)` / `is_none_or(f)` test it as a `bool`.',
    code: `let s: Option<&str> = Some("42");
let n: Option<i32> = s.and_then(|t| t.parse().ok());           // Some(42)
let d = n.map(|x| x * 2).filter(|x| *x > 50).unwrap_or(0);     // 84
let r: Result<i32, &str> = n.ok_or("missing");
let big = n.is_some_and(|x| x > 40);`,
    when: 'Any time you would write a one-arm `match` on an `Option`. Avoid `unwrap` and `expect` outside tests and genuinely impossible cases.',
  },
  {
    name: 'Option::unwrap / expect', header: 'core::option', cat: 'Option & Result', module: 3,
    summary: 'Assert that a value is present, or panic.',
    what: '`unwrap()` panics with a generic message on `None` (or `Err`). `expect("msg")` panics with your message, which should say why it cannot happen. They are assertions, not error handling.',
    code: `let first = v.first().expect("config always has one entry");
let n: i32 = "12".parse().unwrap();            // fine in a quick script`,
    when: 'Tests, examples, prototypes, and invariants you have already established. In library code and anything that handles input, return a `Result` instead (module 6).',
  },
  {
    name: 'Default', header: 'core::default', cat: 'Traits', module: 3,
    summary: 'A standard way to build a "zero" value, derivable for structs.',
    what: '`#[derive(Default)]` fills each field with its own default (`0`, `false`, empty `String`, `None`). Combined with struct update syntax it gives named-argument-like construction.',
    code: `#[derive(Debug, Default)]
struct Config { depth: u8, verbose: bool, name: String }
let c = Config { depth: 5, ..Default::default() };
let empty: Vec<i32> = Default::default();`,
    when: 'Types with many optional settings, and in generic code that needs "an empty one" (`mem::take`, `unwrap_or_default`).',
  },
  {
    name: 'matches!', header: 'core::macros', cat: 'Macros', module: 3,
    summary: 'Test a value against a pattern as a boolean.',
    what: '`matches!(expr, pattern if guard)` expands to a `match` returning `true` or `false`. It works with or-patterns, ranges, nested enums and guards.',
    code: `let ok = matches!(order, Order::Limit { qty, .. } if qty > 0);
let is_digit = matches!(c, '0'..='9');
let v: Vec<_> = orders.iter().filter(|o| matches!(o, Order::Cancel(_))).collect();`,
    when: 'Filters and assertions over enum variants where a full `match` is noise.',
  },
  // ---------------- Environment and process ----------------
  {
    name: 'env::args / env::var', header: 'std::env', cat: 'Environment', module: 4,
    summary: 'Read command-line arguments and environment variables.',
    what: '`env::args()` is an iterator over `String` arguments, where the first is the program name. `env::var("NAME")` returns `Result<String, VarError>`. `args_os` and `var_os` return `OsString` and never panic on invalid Unicode. For real CLIs prefer a parser such as `clap`.',
    code: `use std::env;
let mut args = env::args().skip(1);                 // skip the program name
let path = args.next().unwrap_or_else(|| "data.csv".into());
let level = env::var("LOG").unwrap_or_else(|_| "info".to_string());`,
    when: 'Quick scripts and configuration through the environment. `env::args()` panics on non-Unicode arguments, so use `args_os` when that matters.',
  },
  {
    name: 'process::exit / ExitCode', header: 'std::process', cat: 'Environment', module: 4,
    summary: 'End the program with a status code.',
    what: '`process::exit(code)` ends immediately, **without running destructors** of live values. Returning an `ExitCode` (or `Result` from `main`) is the cleaner way: it lets everything drop first.',
    code: `use std::process::ExitCode;
fn main() -> ExitCode {
    if run().is_err() { return ExitCode::from(2); }
    ExitCode::SUCCESS
}`,
    when: 'Command-line tools that report success or failure to a shell or CI. Avoid `exit` deep inside libraries.',
  },
  {
    name: 'bool::then / then_some', header: 'core::bool', cat: 'Option & Result', module: 4,
    summary: 'Turn a condition into an Option.',
    what: '`cond.then_some(value)` gives `Some(value)` if true else `None` (the value is always evaluated). `cond.then(|| value)` evaluates the closure only if true.',
    code: `let cents = (v >= 0).then_some(Cents(v));          // Option<Cents>
let big = (n > 100).then(|| expensive(n));         // lazily computed`,
    when: 'Smart constructors, validations and optional fields: it replaces `if cond { Some(x) } else { None }`.',
  },
  // ---------------- Containers ----------------
  {
    name: 'Vec::push / pop / insert / remove', header: 'std::vec', cat: 'Containers', module: 5,
    summary: 'Add and remove elements of a Vec.',
    what: '`push` and `pop` work at the end in amortised O(1). `insert(i, x)` and `remove(i)` shift later elements (O(n)). `swap_remove(i)` is O(1) but moves the last element into the gap. `truncate(n)` and `clear()` drop elements, and `extend` appends many.',
    code: `let mut v = vec![1, 2, 3];
v.push(4);
let last = v.pop();            // Some(4)
v.insert(0, 9);                // [9, 1, 2, 3]
let gone = v.swap_remove(0);   // 9, v = [3, 1, 2]
v.extend([7, 8]);`,
    when: 'Building and editing sequences. When removal order does not matter, prefer `swap_remove`. If you remove from the front often, use a `VecDeque`.',
  },
  {
    name: 'Vec::retain / drain / dedup / extract_if', header: 'std::vec', cat: 'Containers', module: 5,
    summary: 'Filter a Vec in place.',
    what: '`retain(pred)` keeps matching elements. `drain(range)` removes a range and yields its elements. `dedup` removes consecutive equal elements, `dedup_by_key` by a key. `extract_if(range, pred)` yields (and removes) matching elements.',
    code: `let mut v = vec![1, 1, 2, 3, 3, 4];
v.dedup();                                       // [1, 2, 3, 4]
v.retain(|x| x % 2 == 0);                        // [2, 4]
let head: Vec<_> = v.drain(..1).collect();       // head = [2], v = [4]`,
    when: 'Cleaning data, expiring old orders, processing and removing done items. `retain` is the replacement for the C++ erase-remove idiom.',
  },
  {
    name: 'slice::sort / sort_by / sort_unstable', header: 'core::slice', cat: 'Containers', module: 5,
    summary: 'Sort a slice in place.',
    what: '`sort` is stable and requires `Ord`. `sort_unstable` is faster and may reorder equal elements. `sort_by(cmp)` takes a comparator, `sort_by_key(f)` a key function, and `sort_by_cached_key` computes each key once. `f64` is not `Ord`, so use `sort_by(f64::total_cmp)` or `sort_by(|a, b| a.partial_cmp(b).unwrap())`.',
    code: `let mut v = vec![("b", 2.5), ("a", 2.5), ("c", 1.0)];
v.sort_by(|x, y| x.1.total_cmp(&y.1).then(x.0.cmp(y.0)));
let mut ids = vec![3, 1, 2];  ids.sort_unstable();`,
    when: 'Always. Use `binary_search` and `partition_point` afterwards for fast lookup in the sorted slice.',
  },
  {
    name: 'slice::binary_search / partition_point', header: 'core::slice', cat: 'Containers', module: 5,
    summary: 'Find a position in a sorted slice in O(log n).',
    what: '`binary_search(&x)` returns `Ok(index)` if found, otherwise `Err(insertion_point)`. `partition_point(pred)` returns the first index where the predicate turns false, which is often what you really want.',
    code: `let v = [10, 20, 30, 40];
assert_eq!(v.binary_search(&30), Ok(2));
assert_eq!(v.binary_search(&25), Err(2));
let first_ge_25 = v.partition_point(|&x| x < 25);   // 2`,
    when: 'Time-series lookups, sorted price ladders, and insertion in sorted order: `v.insert(v.partition_point(|&x| x < n), n)`.',
  },
  {
    name: 'VecDeque / BinaryHeap', header: 'std::collections', cat: 'Containers', module: 5,
    summary: 'A queue with O(1) at both ends, and a priority queue.',
    what: '`VecDeque` has `push_back`, `push_front`, `pop_front`, `pop_back`, indexing and iteration. `BinaryHeap` has `push`, `pop` (the largest), `peek`, and `into_sorted_vec`. Use `Reverse` for a min-heap.',
    code: `let mut q = VecDeque::from([1, 2, 3]);
q.push_front(0);
let a = q.pop_back();                 // Some(3)

let mut h = BinaryHeap::new();
h.push((2, "b")); h.push((9, "z"));
let top = h.pop();                    // Some((9, "z"))`,
    when: 'BFS, schedulers, rolling windows (queue), and top-k or event-time ordering (heap).',
  },
  // ---------------- Maps ----------------
  {
    name: 'HashMap::entry', header: 'std::collections::hash_map', cat: 'Maps', module: 5,
    summary: 'Insert-or-update with a single lookup.',
    what: '`entry(key)` returns an `Entry`. `.or_insert(v)`, `.or_insert_with(f)` and `.or_default()` insert if absent and return `&mut V`. `.and_modify(f)` runs only if present, and chains before `or_insert`.',
    code: `let mut qty: HashMap<String, i64> = HashMap::new();
for (sym, q) in fills {
    *qty.entry(sym).or_default() += q;
}
qty.entry("XAU".into()).and_modify(|v| *v *= 2).or_insert(1);`,
    when: 'Counting, grouping, caching and accumulating by key. It replaces "if contains then get else insert" in every language.',
  },
  {
    name: 'HashMap::get / get_mut / remove / contains_key', header: 'std::collections', cat: 'Maps', module: 5,
    summary: 'Look up, modify and delete by key.',
    what: '`get(&k)` gives `Option<&V>` and `get_mut` gives `Option<&mut V>`. Keys can be queried by a borrowed form (`&str` for `String` keys). `remove(&k)` returns the old value. `m[&k]` panics if the key is missing.',
    code: `let mut m: HashMap<String, f64> = HashMap::new();
m.insert("a".into(), 1.0);
if let Some(v) = m.get_mut("a") { *v += 1.0; }
let old = m.remove("a");                  // Some(2.0)`,
    when: 'Any keyed lookup. Prefer `get` to indexing when the key may be missing.',
  },
  {
    name: 'BTreeMap::range / first_key_value / pop_first', header: 'std::collections', cat: 'Maps', module: 5, since: 'Rust 1.66',
    summary: 'Ordered map operations: nearest key, range scan, pop smallest.',
    what: '`range(a..b)` iterates keys in order within bounds, in either direction (`.rev()`). `first_key_value` and `last_key_value` peek at the ends, and `pop_first` and `pop_last` remove them.',
    code: `let mut m = BTreeMap::new();
m.insert(10, "a"); m.insert(20, "b"); m.insert(30, "c");
let below = m.range(..25).next_back();     // Some((&20, &"b")): the greatest key < 25
let low = m.pop_first();                   // Some((10, "a"))`,
    when: 'Order books, time-indexed data ("latest value at or before t"), interval lookups and priority queues with updates.',
  },
  {
    name: 'HashSet operations', header: 'std::collections', cat: 'Maps', module: 5,
    summary: 'Uniqueness, membership and set algebra.',
    what: '`insert` returns `true` if the value is new. `contains`, `remove`, and the lazy iterators `union`, `intersection`, `difference` and `symmetric_difference`. `BTreeSet` gives the same with sorted iteration.',
    code: `let a: HashSet<i32> = [1, 2, 3].into();
let b: HashSet<i32> = [2, 3, 4].into();
let common: HashSet<_> = a.intersection(&b).copied().collect();
let fresh = seen.insert(id);          // false if already present`,
    when: 'De-duplication, "have I seen this?", and comparing two groups of ids.',
  },
  // ---------------- Strings ----------------
  {
    name: 'String / &str methods', header: 'alloc::string, core::str', cat: 'Text', module: 5,
    summary: 'The everyday toolkit: push_str, split, trim, replace, contains, find.',
    what: '`push_str`, `push`, `insert`, `clear` modify a `String`. `split`, `split_once`, `splitn`, `lines`, `split_whitespace` return borrowed pieces. `trim`, `strip_prefix`, `strip_suffix`, `starts_with`, `contains`, `find`, `replace`, `to_uppercase`, `repeat` and `parse` work on any `&str`.',
    code: `let line = "key=value";
if let Some((k, v)) = line.split_once('=') { println!("{k} -> {v}"); }
let path = "/a/b".strip_prefix('/').unwrap_or("/a/b");
let pos = line.find('=');                       // Option<usize>: a byte offset
let s = "ab".repeat(3);                         // "ababab"`,
    when: 'Parsing and formatting text. Prefer methods that return borrowed slices (`split_once`) to ones that allocate.',
  },
  // ---------------- Option & Result ----------------
  {
    name: 'Result combinators', header: 'core::result', cat: 'Option & Result', module: 6,
    summary: 'map, map_err, and_then, or_else, unwrap_or*, ok, is_ok_and.',
    what: '`map(f)` transforms `Ok`, `map_err(f)` transforms `Err`, `and_then(f)` chains a fallible step, `or_else(f)` recovers, `unwrap_or(d)`, `unwrap_or_else(f)` and `unwrap_or_default()` supply a fallback, `ok()` and `err()` convert to `Option`, and `is_ok_and(f)` tests the success value.',
    code: `let n: Result<u32, String> = "7".parse::<u32>()
    .map_err(|e| format!("bad number: {e}"))
    .and_then(|n| if n < 100 { Ok(n) } else { Err("too big".into()) });
let safe = n.clone().unwrap_or(0);
let ok = n.is_ok_and(|v| v > 5);`,
    when: 'Short pipelines where `?` would need an extra helper function. For longer logic, early returns with `?` read better.',
  },
  {
    name: 'Iterator collect into Result / Option', header: 'core::iter', cat: 'Option & Result', module: 6,
    summary: 'Turn many fallible steps into one outcome.',
    what: '`collect::<Result<Vec<T>, E>>()` gathers `Ok` values and stops at the first `Err`. `collect::<Option<Vec<T>>>()` stops at the first `None`. `sum` and `product` also work over `Result` and `Option`. `partition(Result::is_ok)` splits successes from failures when you need both.',
    code: `let ids: Result<Vec<u32>, _> = ["1", "2", "3"].iter().map(|s| s.parse::<u32>()).collect();
let (good, bad): (Vec<_>, Vec<_>) = ["1", "x"].iter().map(|s| s.parse::<u32>()).partition(Result::is_ok);`,
    when: 'Parsing a whole file or request. Either you have every row or you report the first failure.',
  },
  {
    name: 'std::error::Error / Box<dyn Error>', header: 'std::error', cat: 'Errors', module: 6,
    summary: 'The standard interface for error values.',
    what: 'Implement `Error` (with `Debug + Display`) for your error types. `source()` returns the underlying cause. `Box<dyn Error + Send + Sync>` holds any error and is built by `?` or `.into()`. `downcast_ref::<T>()` recovers a concrete type.',
    code: `use std::error::Error;
fn describe(e: &dyn Error) -> String {
    let mut s = e.to_string();
    let mut cur = e.source();
    while let Some(c) = cur { s.push_str(&format!(": {c}")); cur = c.source(); }
    s
}`,
    when: 'Function signatures in applications and examples, and as the trait to implement for library error types.',
  },
  {
    name: 'io::Result / io::Error', header: 'std::io', cat: 'I/O', module: 6,
    summary: 'The standard result type for I/O, with error kinds.',
    what: '`io::Result<T>` is `Result<T, io::Error>`. `e.kind()` returns an `ErrorKind` such as `NotFound`, `PermissionDenied` or `UnexpectedEof` that you can match on. `io::Error::other("msg")` builds a custom one.',
    code: `use std::io::{self, ErrorKind};
match std::fs::read_to_string("cfg.toml") {
    Ok(t) => println!("{}", t.len()),
    Err(e) if e.kind() == ErrorKind::NotFound => println!("using defaults"),
    Err(e) => return Err(e),
}`,
    when: 'Any file, socket or pipe operation. Match on kinds for expected conditions such as "file not found".',
  },
  // ---------------- Traits ----------------
  {
    name: 'From / Into / TryFrom / TryInto', header: 'core::convert', cat: 'Traits', module: 7,
    summary: 'Standard conversions between types.',
    what: '`From<T> for U` defines a lossless conversion, and `Into` comes for free. `TryFrom` / `TryInto` return a `Result` when conversion can fail. Accept `impl Into<String>` to take both `&str` and `String`. `FromStr` powers `parse`.',
    code: `struct Meters(f64);
impl From<f64> for Meters { fn from(v: f64) -> Self { Meters(v) } }
let m: Meters = 3.5.into();
let n = u8::try_from(300_i32);              // Err
fn name(s: impl Into<String>) -> String { s.into() }`,
    when: 'Public APIs that should accept several input forms, and error conversion with `?`.',
  },
  {
    name: 'AsRef / Borrow / Deref', header: 'core::convert, core::ops', cat: 'Traits', module: 7,
    summary: 'Cheap reference conversions.',
    what: '`AsRef<T>` converts `&self` to `&T` cheaply (`String` to `&str`, `PathBuf` to `&Path`). `Borrow<T>` is stricter (hashing and equality must agree) and is what lets `HashMap<String, V>` be queried with `&str`. `Deref` powers smart pointers and auto-deref.',
    code: `fn len(p: impl AsRef<std::path::Path>) -> usize { p.as_ref().as_os_str().len() }
len("a/b"); len(String::from("a/b")); len(std::path::PathBuf::from("x"));`,
    when: 'Function parameters that take "anything string-like" or "anything path-like".',
  },
  {
    name: 'Debug / Display', header: 'core::fmt', cat: 'Traits', module: 7,
    summary: 'Formatting traits for {:?} and {}.',
    what: '`Debug` is derivable and intended for programmers. `Display` is hand-written and meant for users, and gives `to_string()` for free. Implement `fmt(&self, f: &mut Formatter) -> fmt::Result` with `write!`. `f.width()`, `f.alternate()` and `f.pad` support format specs.',
    code: `use std::fmt;
struct Px(f64);
impl fmt::Display for Px {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { write!(f, "{:.2}", self.0) }
}
println!("{} {}", Px(1.234), Px(2.0).to_string());`,
    when: 'Every type you print. Always derive `Debug`, and implement `Display` for anything shown to users or used in error messages.',
  },
  {
    name: 'PartialOrd / Ord / Ordering', header: 'core::cmp', cat: 'Traits', module: 7,
    summary: 'Compare and order values.',
    what: '`Ord` is a total order (`cmp` returns `Ordering::Less | Equal | Greater`), and `PartialOrd` allows incomparable values (NaN). `Ordering::then` and `then_with` chain comparisons, `max_by` / `min_by_key` use them, and `Reverse` flips an order. Derived `Ord` compares fields in order.',
    code: `use std::cmp::{Ordering, Reverse};
#[derive(PartialEq, Eq, PartialOrd, Ord)]
struct Ver(u32, u32);
let o = Ver(1, 2).cmp(&Ver(1, 10));          // Less
v.sort_by(|a, b| b.score.total_cmp(&a.score).then_with(|| a.name.cmp(&b.name)));
v.sort_by_key(|x| Reverse(x.len()));`,
    when: 'Sorting, BTree keys, heaps and `max`/`min`. For floats, use `total_cmp`.',
  },
  {
    name: 'Iterator::Item and impl Trait returns', header: 'core::iter', cat: 'Traits', module: 7,
    summary: 'Return iterators without naming their type.',
    what: 'A function can return `impl Iterator<Item = T>` and hide a long adapter chain. Add `+ \'_` (or `use<..>`) as needed to state what it borrows. Use `Box<dyn Iterator<Item = T> + \'_>` when different branches return different iterators.',
    code: `fn big_evens<'a>(v: &'a [i32]) -> impl Iterator<Item = &'a i32> + 'a {
    v.iter().filter(|x| **x % 2 == 0 && **x > 10)
}
fn pick(flag: bool) -> Box<dyn Iterator<Item = u32>> {
    if flag { Box::new(0..3) } else { Box::new(vec![9, 8].into_iter()) }
}`,
    when: 'Library functions that produce sequences lazily and should not allocate a `Vec`.',
  },
  // ---------------- I/O ----------------
  {
    name: 'fs::read_to_string / write / read_dir', header: 'std::fs', cat: 'I/O', module: 8,
    summary: 'Read and write whole files in one call.',
    what: '`fs::read_to_string(path)` returns the file as a `String` (error if it is not UTF-8), `fs::read` gives `Vec<u8>`, `fs::write(path, data)` creates or truncates, `fs::read_dir` lists entries, and `create_dir_all`, `remove_file`, `rename`, `copy`, `metadata` do what they say. Paths can be `&str`, `String`, `Path` or `PathBuf`.',
    code: `use std::fs;
let text = fs::read_to_string("config.toml")?;
fs::write("out.txt", format!("{} bytes", text.len()))?;
for entry in fs::read_dir(".")? {
    let e = entry?;
    println!("{}", e.file_name().to_string_lossy());
}`,
    when: 'Small files. For large files or streaming, use `File` with `BufReader` and read line by line.',
  },
  {
    name: 'BufRead::lines / BufReader', header: 'std::io', cat: 'I/O', module: 8,
    summary: 'Read text line by line without loading everything.',
    what: '`BufReader::new(File::open(p)?)` buffers reads. `.lines()` yields `io::Result<String>` for each line (without the newline). `read_line(&mut buf)` reuses one `String`, which is faster. `stdin().lock().lines()` reads standard input.',
    code: `use std::{fs::File, io::{BufRead, BufReader}};
let f = BufReader::new(File::open("ticks.csv")?);
let mut n = 0;
for line in f.lines() {
    let line = line?;
    if line.starts_with('#') { continue; }
    n += 1;
}`,
    when: 'Logs, CSV and any file that may be larger than memory.',
  },
  {
    name: 'Path / PathBuf', header: 'std::path', cat: 'I/O', module: 8,
    summary: 'Cross-platform file paths, as borrowed and owned types.',
    what: '`Path` is the borrowed form (like `&str`), `PathBuf` the owned one (like `String`). `join`, `parent`, `file_name`, `extension`, `with_extension`, `exists`, `is_dir` and `components` work without string manipulation. Convert to text with `display()` or `to_str()` (which may fail for non-UTF-8 names).',
    code: `use std::path::{Path, PathBuf};
let mut p = PathBuf::from("/data");
p.push("2026"); p.push("trades.csv");
assert_eq!(p.extension().and_then(|e| e.to_str()), Some("csv"));
let out = p.with_extension("parquet");
println!("{}", out.display());`,
    when: 'Any file system code. Never build paths by concatenating strings with `/`.',
  },
  {
    name: 'io::stdin / stdout / Write', header: 'std::io', cat: 'I/O', module: 8,
    summary: 'Standard streams and the Read / Write traits.',
    what: '`io::stdin().read_line(&mut s)` reads one line. `io::stdout().lock()` gives a handle for fast repeated writes, and `writeln!` writes to any `Write`. `flush()` forces buffered output out, which matters for prompts printed with `print!`.',
    code: `use std::io::{self, Write};
print!("name> ");
io::stdout().flush()?;
let mut name = String::new();
io::stdin().read_line(&mut name)?;
let name = name.trim();`,
    when: 'Interactive tools and pipelines. Wrap in `BufWriter` for large output.',
  },
  // ---------------- Iterators ----------------
  {
    name: 'Iterator adapters: map / filter / enumerate / zip / take / skip', header: 'core::iter', cat: 'Iterators', module: 9,
    summary: 'Lazy transformations that return another iterator.',
    what: '`map(f)` transforms, `filter(p)` keeps, `filter_map(f)` does both with `Option`, `enumerate()` adds an index, `zip(other)` pairs items, `take(n)` / `skip(n)` / `step_by(n)` slice by position, `chain(other)` concatenates, `rev()` reverses double-ended iterators, `flat_map` and `flatten` unnest, `peekable()` allows `peek()`. They run only when consumed.',
    code: `let names = ["a", "b", "c"]; let px = [1.0, 2.5, 3.0];
let rows: Vec<String> = names.iter().zip(px.iter()).enumerate()
    .filter(|(_, (_, p))| **p > 1.5)
    .map(|(i, (n, p))| format!("{i}:{n}={p}"))
    .collect();`,
    when: 'Any data processing over a sequence. Chain them instead of writing index loops with temporary Vecs.',
  },
  {
    name: 'Iterator consumers: collect / sum / count / fold / min / max', header: 'core::iter', cat: 'Iterators', module: 9,
    summary: 'Run the pipeline and produce one result.',
    what: '`collect` builds a collection (type needed). `sum` / `product` need a numeric type. `count` is the number of items, `min` / `max` / `min_by_key` / `max_by` / `min_by` pick extremes, `fold(init, f)` accumulates, `reduce(f)` uses the first item, `last`, `nth`, `for_each` and `try_for_each` exist as well.',
    code: `let v = [3, 1, 4, 1, 5];
let total: i32 = v.iter().sum();
let m = v.iter().copied().max();                     // Some(5)
let longest = ["a", "bcd", "ef"].iter().max_by_key(|s| s.len());
let fmax = [1.5, 0.2].iter().copied().max_by(|a, b| a.total_cmp(b));
let csv = v.iter().map(|n| n.to_string()).collect::<Vec<_>>().join(",");`,
    when: 'The last step of any pipeline. Annotate the type for `collect`, `sum` and `product`.',
  },
  {
    name: 'Iterator::find / position / any / all', header: 'core::iter', cat: 'Iterators', module: 9,
    summary: 'Search and test, stopping at the first answer.',
    what: '`find(p)` returns the first matching item as `Option`. `position(p)` returns its index. `any(p)` and `all(p)` return a `bool` and short-circuit. `find_map(f)` returns the first `Some` the closure produces.',
    code: `let first_big = v.iter().find(|x| **x > 3);          // Option<&i32>
let idx = v.iter().position(|&x| x == 4);             // Option<usize>
let ok = v.iter().all(|x| *x > 0);
let n = words.iter().find_map(|w| w.parse::<i32>().ok());`,
    when: 'Lookups in a Vec you do not want to index, and validation checks. For many lookups, build a `HashMap`.',
  },
  {
    name: 'iter::repeat_n / from_fn / successors / once', header: 'core::iter', cat: 'Iterators', module: 9,
    summary: 'Build iterators from nothing.',
    what: '`repeat_n(x, n)` yields a clone `n` times. `from_fn(f)` calls a closure returning `Option` until `None`. `successors(first, f)` iterates a recurrence. `once(x)` yields one item, `empty()` none. `std::array::from_fn(|i| ...)` builds a fixed array.',
    code: `use std::iter;
let pow2: Vec<u32> = iter::successors(Some(1u32), |&x| x.checked_mul(2)).take(5).collect();   // 1,2,4,8,16
let grid: [[u8; 3]; 2] = std::array::from_fn(|r| std::array::from_fn(|c| (r * 3 + c) as u8));
let pad: String = iter::repeat_n('-', 10).collect();`,
    when: 'Generators for tests, geometric sequences, tokenisers, and padding.',
  },
  // ---------------- Closures ----------------
  {
    name: 'Closure-taking methods: sort_by_key / retain / map_or / unwrap_or_else', header: 'core', cat: 'Closures', module: 9,
    summary: 'Where closures commonly appear in the standard library.',
    what: '`sort_by_key(|x| key)` and `sort_by(|a, b| ...)` sort with a closure. `retain(|x| keep)` filters in place. `Option::map_or(default, f)` and `map_or_else`, `unwrap_or_else(|| ...)`, `or_else` compute lazily. `entry().or_insert_with(|| ...)` builds a value only when missing. `thread::spawn(move || ...)` takes `FnOnce`.',
    code: `v.sort_by_key(|t| std::cmp::Reverse(t.qty));
let label = opt.map_or("none".to_string(), |x| format!("#{x}"));
let cfg = map.entry(key).or_insert_with(|| Config::load());
let n = opt.unwrap_or_else(|| expensive_default());`,
    when: 'Use the lazy forms (`_else`, `_with`) whenever the default is costly to compute or allocates.',
  },
  // ---------------- Smart pointers ----------------
  {
    name: 'Rc / Arc', header: 'std::rc, std::sync', cat: 'Smart pointers', module: 10,
    summary: 'Shared ownership by reference counting.',
    what: '`Rc::new(v)` and `Arc::new(v)` allocate with a count. `Rc::clone(&a)` bumps it. `strong_count` and `weak_count` report counts, `ptr_eq` compares addresses, `try_unwrap` yields the inner value if unique, `get_mut` borrows mutably if unique and `make_mut` clones the data only when shared. Contents are read-only without interior mutability. `Arc` is the thread-safe version.',
    code: `use std::sync::Arc;
let cfg = Arc::new(Config::load());
let handles: Vec<_> = (0..4).map(|_| {
    let cfg = Arc::clone(&cfg);
    std::thread::spawn(move || cfg.depth)
}).collect();`,
    when: 'Data genuinely owned by several parts: configuration, caches, graphs, shared read-only tables. Not a way to dodge the borrow checker in ordinary code.',
  },
  {
    name: 'RefCell / Cell', header: 'std::cell', cat: 'Smart pointers', module: 10,
    summary: 'Mutation through a shared reference, checked at run time.',
    what: '`Cell<T>` replaces its value (`set`, `replace`, `take`, `update`) and reads it for `Copy` types with `get`. `RefCell<T>` gives guards: `borrow()` (shared) and `borrow_mut()` (exclusive), panicking on conflicts. `try_borrow` and `try_borrow_mut` return a `Result`. Neither is thread-safe.',
    code: `use std::{cell::RefCell, rc::Rc};
let log = Rc::new(RefCell::new(Vec::<String>::new()));
let l2 = Rc::clone(&log);
l2.borrow_mut().push("event".into());
assert_eq!(log.borrow().len(), 1);`,
    when: 'Single-threaded shared mutable state (observers, trees with parent links, caches behind a `&self` API). On several threads use `Mutex`/`RwLock` instead.',
  },
  {
    name: 'LazyLock / OnceLock / OnceCell', header: 'std::sync, std::cell', cat: 'Smart pointers', module: 10, since: 'Rust 1.80',
    summary: 'Initialise a global or field exactly once.',
    what: '`LazyLock::new(|| value)` in a `static` runs the closure on first access, thread-safely. `OnceLock::set` / `get_or_init` initialise from runtime data. `LazyCell` and `OnceCell` are the single-threaded forms usable in fields and locals.',
    code: `use std::sync::LazyLock;
static LEVELS: LazyLock<Vec<f64>> = LazyLock::new(|| (1..=10).map(|n| n as f64 * 0.5).collect());
fn level(i: usize) -> f64 { LEVELS[i] }`,
    when: 'Lookup tables, compiled regexes, parsed configuration. These replace the `lazy_static!` macro and `once_cell` crate.',
  },
  {
    name: 'Cow', header: 'std::borrow', cat: 'Smart pointers', module: 10,
    summary: 'Borrow when possible, own when needed.',
    what: '`Cow<\'a, B>` is either `Borrowed(&B)` or `Owned(B::Owned)`. `to_mut()` clones into an owned value on first write, `into_owned()` always yields an owned value, and it derefs to `&B`. `String::from_utf8_lossy` and many parsing helpers return one.',
    code: `use std::borrow::Cow;
fn trim_prefix<'a>(s: &'a str) -> Cow<'a, str> {
    match s.strip_prefix("0x") { Some(r) => Cow::Borrowed(r), None => Cow::Owned(format!("{s}")) }
}
let mut c = Cow::Borrowed("abc");
c.to_mut().push('d');            // clones now, becomes Owned("abcd")`,
    when: 'Functions that usually return their input unchanged but occasionally need a modified copy, which avoids allocating in the common case.',
  },
  {
    name: 'Box<dyn Trait> and Box::leak', header: 'std::boxed', cat: 'Smart pointers', module: 10,
    summary: 'Heap-allocate a value, erase its type, or leak it for \'static.',
    what: '`Box::new(v)` allocates. `Box<dyn Trait>` erases the concrete type for heterogeneous collections. `Box::leak(b)` gives a `&\'static mut T` (and never frees it), useful for config you create once. `Box<str>` and `Box<[T]>` are compact, fixed-size owned slices.',
    code: `let animals: Vec<Box<dyn Speak>> = vec![Box::new(Dog), Box::new(Cat)];
let cfg: &'static Config = Box::leak(Box::new(Config::load()));
let name: Box<str> = "alc".into();`,
    when: 'Plugins, recursive data and one-time globals. Prefer `enum` for a closed set of types.',
  },
  // ---------------- Concurrency ----------------
  {
    name: 'thread::spawn / scope / sleep', header: 'std::thread', cat: 'Concurrency', module: 11,
    summary: 'Start threads, borrow locals safely, and wait.',
    what: '`spawn(f)` starts a thread (`f: FnOnce + Send + \'static`) and returns a `JoinHandle`. `scope(|s| { s.spawn(...); })` runs threads that may borrow locals and joins them all before returning. `thread::Builder` sets name and stack size. `sleep`, `yield_now`, `current().id()` and `available_parallelism()` round out the API.',
    code: `use std::thread;
let data = vec![1u64, 2, 3, 4];
let total: u64 = thread::scope(|s| {
    let (a, b) = data.split_at(2);
    let h1 = s.spawn(|| a.iter().sum::<u64>());
    let h2 = s.spawn(|| b.iter().sum::<u64>());
    h1.join().unwrap() + h2.join().unwrap()
});`,
    when: 'CPU-bound work divided over a few threads. For many parallel iterator operations use Rayon, and for huge numbers of I/O waits use async.',
  },
  {
    name: 'mpsc::channel', header: 'std::sync::mpsc', cat: 'Concurrency', module: 11,
    summary: 'Send owned messages between threads.',
    what: '`channel()` returns `(Sender<T>, Receiver<T>)` (unbounded) and `sync_channel(n)` a bounded one. `Sender` is `Clone`. `send` returns `Err` if the receiver is gone. `recv` blocks, `try_recv` does not, `recv_timeout` waits up to a duration, and `rx.iter()` / `for m in rx` run until all senders are dropped.',
    code: `use std::sync::mpsc;
let (tx, rx) = mpsc::channel::<(u32, f64)>();
for id in 0..3 {
    let tx = tx.clone();
    std::thread::spawn(move || tx.send((id, id as f64 * 1.5)).unwrap());
}
drop(tx);
let mut out: Vec<_> = rx.iter().collect();`,
    when: 'Pipelines, worker results and event streams. For MPMC or `select!`, use `crossbeam-channel` or `flume`.',
  },
  {
    name: 'Mutex / RwLock', header: 'std::sync', cat: 'Concurrency', module: 11,
    summary: 'Guard shared data with a lock that owns it.',
    what: '`Mutex::new(v)`, `.lock()` (blocking), `.try_lock()`, `.into_inner()`, `.get_mut()` (no lock needed with `&mut`). `RwLock` has `.read()` and `.write()`. Guards deref to the data and unlock on drop. Both are `const`-constructible, so `static M: Mutex<T> = Mutex::new(..)` works. Poisoned locks return `Err` from `lock()`.',
    code: `use std::sync::{Arc, Mutex};
let book = Arc::new(Mutex::new(Vec::<u64>::new()));
{
    let mut g = book.lock().unwrap();
    g.push(99);
}                                   // guard dropped: unlocked
let n = book.lock().unwrap().len(); // temporary guard: unlocked at the semicolon`,
    when: 'State that several threads read and write. Keep critical sections tiny, and avoid holding a std mutex across `.await`.',
  },
  {
    name: 'Atomic types', header: 'std::sync::atomic', cat: 'Concurrency', module: 11,
    summary: 'Lock-free operations on single values.',
    what: '`AtomicBool`, `AtomicU32`, `AtomicU64`, `AtomicUsize`, `AtomicI*` and `AtomicPtr` provide `load`, `store`, `swap`, `fetch_add`, `fetch_sub`, `fetch_and`, `fetch_or`, `fetch_max`, `compare_exchange` and `fetch_update`, each taking an `Ordering`.',
    code: `use std::sync::atomic::{AtomicU64, AtomicBool, Ordering::*};
static SEQ: AtomicU64 = AtomicU64::new(0);
fn next_id() -> u64 { SEQ.fetch_add(1, Relaxed) }
static STOP: AtomicBool = AtomicBool::new(false);
fn should_stop() -> bool { STOP.load(Acquire) }`,
    when: 'Counters, sequence numbers, stop flags and statistics. Anything wider than one word wants a lock.',
  },
  {
    name: 'Condvar / Barrier', header: 'std::sync', cat: 'Concurrency', module: 11,
    summary: 'Wait for a condition, or for all threads to arrive.',
    what: '`Condvar::wait(guard)` or `wait_while(guard, pred)` releases the mutex and sleeps until `notify_one` / `notify_all`. Always re-check the condition in a loop (or use `wait_while`) because of spurious wake-ups. `Barrier::new(n).wait()` blocks until `n` threads arrive.',
    code: `use std::sync::{Arc, Condvar, Mutex};
let pair = Arc::new((Mutex::new(false), Condvar::new()));
let p2 = Arc::clone(&pair);
std::thread::spawn(move || { *p2.0.lock().unwrap() = true; p2.1.notify_one(); });
let (m, cv) = &*pair;
let _ready = cv.wait_while(m.lock().unwrap(), |ready| !*ready).unwrap();`,
    when: 'Hand-written blocking queues and start-up synchronisation. In most programs a channel is simpler.',
  },
]
