import type { Module } from '../types'

export const r06: Module = {
  n: 6,
  title: 'Error Handling',
  tour: '9 · Error Handling',
  summary: 'Recoverable and unrecoverable errors: `panic!`, `Result`, the `?` operator, custom error types, `From` conversions and when to use which crate.',
  topics: ['panic!', 'Result & ?', 'Custom errors', 'From & conversions', 'thiserror & anyhow'],
  cpp23: [
    '`core::error::Error` is available in `core` (Rust 1.81), so `no_std` libraries can define standard error types.',
    '`Option::is_none_or` and `Result::is_ok_and` / `is_err_and` express checks without unwrapping (Rust 1.82, 1.70).',
    'Format strings capture variables: `Err(format!("bad id {id}"))`, and `{e:#}` in `anyhow` prints the whole error chain on one line.',
    '`let ... else` and `?` in closures returning `Result` or `Option` reduce nesting in error paths (Rust 1.65).',
  ],
  lessons: [
    {
      id: 'panic',
      title: 'Unrecoverable errors: panic!',
      blocks: [
        { kind: 'analogy', text: "Think of a factory floor. A **panic** is the big red stop button: something has happened that the line was never designed for (a broken invariant, a bug). The line stops, workers walk out in an orderly way (unwinding, running destructors) and a report is filed. A **Result** is the reject bin on the conveyor: the part was bad, which is normal, and the line carries on." },
        { kind: 'code', code: `fn main() {
    let v = vec![1, 2, 3];
    // v[99];                      // panic: index out of bounds: the len is 3 but the index is 99
    // None::<i32>.unwrap();       // panic: called \`Option::unwrap()\` on a \`None\` value
    // let x: u8 = 256u16.try_into().expect("fits in a byte");   // panic with your message
    assert!(v.len() == 3, "expected three items, got {}", v.len());
    assert_eq!(v[0], 1);                    // shows both sides on failure
    debug_assert!(v.is_sorted());           // checked in debug builds only
    // unreachable!("state {} is impossible", 7);
    // todo!();                             // compiles, panics when reached
    // panic!("explicit failure: {}", 42);
}` },
        { kind: 'list', items: [
          'A panic **unwinds** the stack by default: it runs `Drop` for every live value on the way out, so locks release and files close. Set `RUST_BACKTRACE=1` for a stack trace.',
          'In `Cargo.toml` `panic = "abort"` ends the process immediately instead. It is smaller and faster, but destructors do not run.',
          'A panic in a **spawned thread** ends that thread only. The `JoinHandle::join` returns `Err`, which is how the parent finds out (module 11). A panic in `main` ends the program with exit code 101.',
          '`catch_unwind` exists, but it is for FFI boundaries and thread pools, **not** for exceptions. It does not work with `panic = "abort"`, and code must be unwind-safe.',
          '`unwrap()` and `expect("why")` are assertions that a value is there. Use them in tests, prototypes, and where a failure would be a bug. In production code, write the reason in `expect`: `expect("config loaded at startup")`.',
          '**Panic when a bug is found** (a violated invariant, an impossible state), and **return a `Result` when failure is a normal outcome** (bad input, missing file, network down).',
        ] },
        { kind: 'compare',
          cpp: `throw std::runtime_error("bad");        // exceptions: invisible in signatures
assert(x > 0);                           // removed with NDEBUG
v.at(99);                                // throws std::out_of_range`,
          go: `panic("bad")                             // rare; recover() in a deferred function
// normal failures return (T, error)`,
          python: `raise ValueError("bad")                  # any function may raise
assert x > 0, "msg"`,
          java: `throw new IllegalStateException("bad");  // unchecked
throw new IOException("x");              // checked: must be declared`,
          ts: `throw new Error("bad")                   // any function may throw anything`,
          rust: `panic!("bug: {x}");                         // bugs and broken invariants
return Err(MyError::Bad);                 // expected failures`,
          note: 'Rust has no exceptions for ordinary errors. Failure that callers should handle is visible in the return type, and panics are reserved for bugs.' },
        { kind: 'check', q: 'A function parses user-typed numbers. A user enters "abc". Should it panic?', options: ['Yes, it is invalid input', 'No: return a `Result`, since bad input is expected', 'Yes, with `unwrap`', 'Only in release mode'], answer: 1, hint: 'Is this a bug in the program, or a normal event?', explain: 'Bad input is expected and the caller can handle it. Panicking would let any user crash your program.' },
      ],
    },
    {
      id: 'result',
      title: 'Result and the ? operator',
      blocks: [
        { kind: 'analogy', text: "`Result<T, E>` is a sealed envelope that contains either the thing you asked for or a note explaining why you cannot have it. You can not use the contents without opening it. The `?` operator is a clerk who opens the envelope for you: if it holds the thing he hands it over, and if it holds a note he **instantly forwards the note** to whoever called you." },
        { kind: 'code', code: `use std::fs;
use std::io;
use std::num::ParseIntError;

fn read_qty(path: &str) -> Result<u32, io::Error> {
    let text = fs::read_to_string(path)?;          // Err(e) => return Err(e)
    Ok(text.trim().len() as u32)
}

// Two different error types need a common one: here, a boxed trait object
fn sum_file(path: &str) -> Result<i64, Box<dyn std::error::Error>> {
    let text = fs::read_to_string(path)?;          // io::Error -> Box<dyn Error>
    let mut total = 0i64;
    for line in text.lines() {
        total += line.trim().parse::<i64>()?;      // ParseIntError -> Box<dyn Error>
    }
    Ok(total)
}

fn main() -> Result<(), Box<dyn std::error::Error>> {   // main may return a Result
    println!("{}", sum_file("nums.txt")?);               // an Err prints "Error: ..." and exits 1
    Ok(())
}

// ? works on Option too (in a function returning Option)
fn first_char_upper(s: &str) -> Option<char> {
    let c = s.chars().next()?;                     // None => return None
    Some(c.to_ascii_uppercase())
}` },
        { kind: 'stepper', title: 'What ? does', code: [
          'fn load(p: &str) -> Result<u32, Error> {',
          '    let text = fs::read_to_string(p)?;',
          '    let n = text.trim().parse::<u32>()?;',
          '    Ok(n * 2)',
          '}',
        ], steps: [
          { line: 2, note: '`read_to_string` returns `Result<String, io::Error>`. On `Ok(s)`, `?` unwraps it and `text` is the `String`.', memory: [{ name: 'p', value: '"n.txt"' }, { name: 'text', value: '"21\\n"', kind: 'heap' }] },
          { line: 3, note: '`parse` returns `Result<u32, ParseIntError>`. On `Ok`, `n` is 21.', memory: [{ name: 'text', value: '"21\\n"', kind: 'heap' }, { name: 'n', value: '21' }] },
          { line: 4, note: 'Wrap the success value. The caller receives `Ok(42)`.', memory: [{ name: 'n', value: '21' }, { name: 'return', value: 'Ok(42)' }] },
          { line: 3, note: 'If the text were "abc", `?` would **return early** with `Err(From::from(parse_error))`. The rest of the function never runs, and the error type is converted to `Error` by `From`.', memory: [{ name: 'text', value: '"abc"', kind: 'heap' }, { name: 'return', value: 'Err(ParseIntError)', kind: 'dead' }] },
        ] },
        { kind: 'list', items: [
          '`?` on a `Result` is roughly `match r { Ok(v) => v, Err(e) => return Err(From::from(e)) }`. That `From::from` call is why one function can use `?` on several error types.',
          '`?` can only be used in a function whose return type can absorb the error: `Result` for `Result` (and `Option` for `Option`). Mixing the two needs `.ok_or(...)` or `.ok()`.',
          'Combinators when `?` is not enough: `map_err(f)` to change the error, `ok_or(e)` / `ok_or_else(f)` for `Option` to `Result`, `and_then(f)` to chain, `unwrap_or(d)` / `unwrap_or_else(f)` / `unwrap_or_default()` to recover, `ok()` to discard the error.',
          '`Result` is marked `#[must_use]`: ignoring one is a compiler **warning**, so forgotten errors are caught. Write `let _ = f();` only when ignoring is deliberate.',
          'Collecting an iterator of `Result`s into a `Result` of a collection stops at the first error: `let v: Result<Vec<i32>, _> = lines.map(|l| l.parse::<i32>()).collect();`.',
        ] },
        { kind: 'code', code: `// collect into Result: the first Err wins
let nums: Result<Vec<i32>, _> = "1,2,x,4".split(',').map(str::parse::<i32>).collect();
// Err(ParseIntError { kind: InvalidDigit })

// sum and product also work on iterators of Results
let total: Result<i32, _> = ["1", "2", "3"].iter().map(|s| s.parse::<i32>()).sum();   // Ok(6)

// transpose swaps Option<Result<T,E>> and Result<Option<T>,E>
let maybe: Option<Result<i32, ParseIntError>> = Some("5".parse());
let flipped: Result<Option<i32>, ParseIntError> = maybe.transpose();   // Ok(Some(5))

// Handling both cases explicitly
match "42".parse::<u8>() {
    Ok(n) if n > 10 => println!("big {n}"),
    Ok(n) => println!("small {n}"),
    Err(e) => eprintln!("could not parse: {e}"),
}` },
        { kind: 'compare',
          cpp: `std::expected<int, Error> f();           // C++23: similar, with and_then, but no ? operator
auto v = f();  if (!v) return std::unexpected(v.error());`,
          go: `n, err := strconv.Atoi(s)
if err != nil { return 0, fmt.Errorf("parse: %w", err) }   // the famous three lines`,
          python: `try:
    n = int(s)
except ValueError as e:
    raise MyError("parse") from e`,
          java: `try { int n = Integer.parseInt(s); } catch (NumberFormatException e) { throw new MyEx(e); }`,
          ts: `const n = Number(s); if (Number.isNaN(n)) throw new Error("parse")`,
          rust: `let n: i32 = s.parse()?;      // one character replaces the three lines`,
          note: '`?` gives Go\'s explicit error values the brevity of exceptions: the failure path stays visible in the types but costs one character at each call site.' },
        { kind: 'pitfall', text: 'Using `?` in `main` without changing its return type fails with "the `?` operator can only be used in a function that returns `Result` or `Option`". Change the signature to `fn main() -> Result<(), Box<dyn std::error::Error>>` (or `anyhow::Result<()>`).' },
        { kind: 'check', q: 'What does `?` do when the `Result` is `Err(e)`?', options: ['Panics with `e`', 'Returns `Err(From::from(e))` from the current function', 'Ignores `e` and continues', 'Retries the call'], answer: 1, hint: 'It is an early return.', explain: '`?` returns early with the error, converting it with `From`. That conversion is what lets one function mix error types.' },
        { kind: 'check', q: 'What type does `"1,2,x".split(\',\').map(str::parse::<i32>).collect::<Result<Vec<_>, _>>()` produce?', options: ['`Vec<Result<i32, _>>`', '`Result<Vec<i32>, ParseIntError>` (an `Err`)', '`Vec<i32>` with a zero', '`Option<Vec<i32>>`'], answer: 1, hint: 'Collecting into `Result` stops at the first failure.', explain: 'The first `Err` aborts the collection, so you get `Err(ParseIntError)`. With all valid numbers you would get `Ok(vec)`.' },
      ],
    },
    {
      id: 'custom',
      title: 'Custom error types',
      blocks: [
        { kind: 'analogy', text: "A generic \"something went wrong\" note is like an ambulance that only reports *emergency*. A good error type tells the dispatcher which kind: fire, flood, medical. With an **enum of error kinds**, callers can match on what went wrong and decide what to do: retry the network blip, tell the user about the typo, but give up on a corrupted file." },
        { kind: 'code', code: `use std::{fmt, io, num::ParseIntError};

#[derive(Debug)]
pub enum ConfigError {
    Io(io::Error),
    Parse { line: usize, source: ParseIntError },
    Missing(&'static str),
}

impl fmt::Display for ConfigError {                       // human-readable message
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ConfigError::Io(e) => write!(f, "could not read config: {e}"),
            ConfigError::Parse { line, source } => write!(f, "line {line}: {source}"),
            ConfigError::Missing(key) => write!(f, "missing key {key}"),
        }
    }
}

impl std::error::Error for ConfigError {                  // lets it be boxed and chained
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            ConfigError::Io(e) => Some(e),
            ConfigError::Parse { source, .. } => Some(source),
            ConfigError::Missing(_) => None,
        }
    }
}

// From impls let ? convert automatically
impl From<io::Error> for ConfigError {
    fn from(e: io::Error) -> Self { ConfigError::Io(e) }
}

pub fn load(path: &str) -> Result<u32, ConfigError> {
    let text = std::fs::read_to_string(path)?;            // io::Error -> ConfigError via From
    let first = text.lines().next().ok_or(ConfigError::Missing("depth"))?;
    first.trim().parse().map_err(|source| ConfigError::Parse { line: 1, source })
}` },
        { kind: 'list', items: [
          'An error type needs `Debug` (derive it), `Display` (a message for humans) and `impl std::error::Error` (empty is enough; `source()` links to the cause so tools can print the chain).',
          'An **enum** is the usual shape for a library: one variant per failure the caller might react to. A `struct` with a `kind` is also common (see `std::io::Error` and `ErrorKind`).',
          '**Display messages are lowercase, with no trailing period,** and do not repeat the source. The convention is to let the wrapper say what failed and the cause say why.',
          'Make the type `Send + Sync + \'static` where possible so it can cross threads and be boxed as `Box<dyn Error + Send + Sync>`.',
          '`#[non_exhaustive]` on a public error enum lets you add variants without breaking callers.',
          'Avoid `Result<T, String>` outside quick scripts: callers cannot match on it and you lose the cause chain.',
        ] },
        { kind: 'compare',
          cpp: `class ConfigError : public std::runtime_error { using runtime_error::runtime_error; };
// or std::error_code and error categories`,
          go: `type ConfigError struct { Line int; Err error }
func (e *ConfigError) Error() string { return fmt.Sprintf("line %d: %v", e.Line, e.Err) }
func (e *ConfigError) Unwrap() error { return e.Err }   // the same chain idea`,
          python: `class ConfigError(Exception): ...
class ParseError(ConfigError): ...`,
          java: `class ConfigException extends Exception { ConfigException(String m, Throwable cause) { super(m, cause); } }`,
          ts: `class ConfigError extends Error { constructor(msg: string, public line: number) { super(msg) } }`,
          rust: `#[derive(Debug)]
enum ConfigError { Io(io::Error), Missing(&'static str) }
impl fmt::Display for ConfigError { /* ... */ }
impl std::error::Error for ConfigError {}`,
          note: 'Go\'s `Unwrap` and Rust\'s `source` are the same idea: errors form a chain from the visible failure to its root cause.' },
        { kind: 'check', q: 'Which traits must a type implement to be a proper error type?', options: ['`Display` and `Clone`', '`Debug`, `Display` and `Error`', '`Error` only', '`Copy` and `Debug`'], answer: 1, hint: 'The `Error` trait requires two supertraits.', explain: '`Error` requires `Debug + Display`. The `Error` impl is usually empty or only provides `source`.' },
      ],
    },
    {
      id: 'from',
      title: 'From, boxing and error context',
      blocks: [
        { kind: 'analogy', text: "Imagine a relay of postal services: each service stamps the parcel in its own style. At each border (function boundary), a **customs officer (`From`)** repackages the error in the next country's format, keeping the original inside. At the end you can open the parcel and read the whole journey: *could not load config → could not read file → No such file or directory*." },
        { kind: 'code', code: `use std::error::Error;

// Box<dyn Error> accepts anything implementing Error, via a blanket From impl
fn run() -> Result<(), Box<dyn Error>> {
    let n: i32 = "12x".parse()?;                         // ParseIntError boxed
    if n < 0 { return Err("negative".into()); }         // &str / String also convert
    if n > 99 { return Err(Box::new(ConfigError::Missing("n"))); }
    Ok(())
}

// Walk the chain of causes
fn report(e: &dyn Error) {
    eprintln!("error: {e}");
    let mut cause = e.source();
    while let Some(c) = cause {
        eprintln!("  caused by: {c}");
        cause = c.source();
    }
}

// Downcast a boxed error back to a concrete type
if let Err(e) = run() {
    if let Some(cfg) = e.downcast_ref::<ConfigError>() { /* handle specifically */ }
}

// Adding context by hand with map_err
let n: i32 = s.parse().map_err(|e| format!("bad port {s:?}: {e}"))?;` },
        { kind: 'list', items: [
          '**`From<E> for MyError`** is what `?` calls. Implementing it for each source error gives you free conversion at every `?`. The `Into` trait is derived automatically.',
          '`Box<dyn Error>` is the "any error" type: easy for applications and examples, at the cost that callers cannot match on kinds without `downcast_ref`. Add `+ Send + Sync` for use across threads.',
          '`impl From<&str> for Box<dyn Error>` (and `String`) means `Err("text".into())` works directly.',
          '`map_err` converts the error at one call site (`.map_err(MyError::Parse)?`), which is handy when a `From` impl would be too broad, such as two `ParseIntError`s that mean different things.',
          'Context matters as much as the cause: "No such file or directory" is useless without the file name. Add context where the information is available: where you *know* what you were trying to do.',
        ] },
        { kind: 'pitfall', text: 'A blanket `impl<E: Error> From<E> for MyError` conflicts with the standard library\'s `impl<T> From<T> for T`, so it will not compile. Write one `From` impl per source type (or use `thiserror`\'s `#[from]`).' },
        { kind: 'check', q: 'Why does `?` work on a function returning `Result<T, Box<dyn Error>>` for both `io::Error` and `ParseIntError`?', options: ['Because both are strings', 'Because `Box<dyn Error>` implements `From` for any type that implements `Error`', 'Because `?` converts to `String`', 'It does not work'], answer: 1, hint: 'Look at what `?` calls on the error.', explain: 'The standard library provides `impl<E: Error> From<E> for Box<dyn Error>`, so any error type is boxed automatically by `?`.' },
      ],
    },
    {
      id: 'crates',
      title: 'thiserror, anyhow and a policy',
      blocks: [
        { kind: 'analogy', text: "Writing `Display`, `Error` and `From` impls by hand is like typing out each form's carbon copies. `thiserror` is the pre-printed form: you fill in the blanks (`#[error(\"...\")]`, `#[from]`) and it writes the boilerplate. `anyhow` is a universal luggage tag: one `Result` type for any error, with a stack of notes (`context`) about what you were doing when it went wrong." },
        { kind: 'code', code: `// Library crate: typed errors with thiserror
use thiserror::Error;

#[derive(Debug, Error)]
pub enum FeedError {
    #[error("could not read feed file")]
    Io(#[from] std::io::Error),                   // From<io::Error> generated; source() set
    #[error("line {line}: bad price {text:?}")]
    BadPrice { line: usize, text: String },
    #[error("unknown symbol {0}")]
    UnknownSymbol(String),
}

// Application crate: anyhow for convenience
use anyhow::{bail, ensure, Context, Result};

fn load(path: &str) -> Result<Vec<f64>> {          // anyhow::Result<T> = Result<T, anyhow::Error>
    let text = std::fs::read_to_string(path)
        .with_context(|| format!("reading {path}"))?;       // adds context to the chain
    ensure!(!text.is_empty(), "{path} is empty");           // return Err if the condition fails
    let mut out = Vec::new();
    for (i, line) in text.lines().enumerate() {
        let Ok(px) = line.parse::<f64>() else { bail!("line {}: not a number: {line:?}", i + 1) };
        out.push(px);
    }
    Ok(out)
}

fn main() -> Result<()> {
    let prices = load("px.txt")?;
    println!("{}", prices.len());
    Ok(())      // on Err: prints "Error: reading px.txt\\n\\nCaused by:\\n    No such file or directory (os error 2)"
}` },
        { kind: 'list', items: [
          '**Libraries** return a specific error type (usually a `thiserror` enum) so callers can match on kinds and the dependency tree is clear.',
          '**Applications** (binaries) rarely match on error kinds. They report them. `anyhow::Result` with `.context(...)` gives readable chains with almost no code.',
          '`anyhow::Error` is *not* an `Error` implementor itself (so it can be `From<E: Error>`). Convert at the boundary: libraries should not expose `anyhow` in their public API.',
          '`{e}` prints the top message, `{e:#}` prints the chain on one line, `{e:?}` prints the chain with a backtrace if `RUST_BACKTRACE=1`.',
          'Related crates: `eyre` and `color-eyre` (pretty reports), `miette` (diagnostics with source snippets), `snafu` (context selectors). The standard library only gives you the `Error` trait and `Box<dyn Error>`.',
          'Rule of thumb for any function: **can the caller do something specific about each failure?** If yes, return a precise enum. If not, return an opaque error with context, and let the caller report it.',
        ] },
        { kind: 'pitfall', text: 'Do not chain `.unwrap()` through code whose input comes from users or the network "just for now". Each one is a latent crash. `anyhow` makes the proper version nearly as short: replace `.unwrap()` with `?` and `.context("...")`.' },
        { kind: 'check', q: 'You are writing a reusable library. Which error style fits best?', options: ['`anyhow::Error` in every public function', 'A `thiserror` enum describing each failure', '`Result<T, String>`', 'Panicking'], answer: 1, hint: 'Callers need to match on what went wrong.', explain: 'Libraries should expose precise, matchable errors. `anyhow` is for the application that sits on top and just wants to report.' },
      ],
    },
  ],
  quiz: [
    { q: 'What happens by default when a panic occurs?', options: ['The process aborts immediately', 'The stack unwinds, running destructors, and the thread ends', 'The error is returned to the caller', 'Nothing: it is only a warning'], answer: 1, explain: 'Unwinding runs `Drop` for live values. With `panic = "abort"` in the profile the process aborts instead.' },
    { q: 'When should you return a `Result` rather than panic?', options: ['When failure is an expected outcome the caller can handle', 'Never', 'Only in main', 'When running in release mode'], answer: 0, explain: 'Panics are for bugs and broken invariants. Expected failures (bad input, I/O) go in the return type.' },
    { q: 'What does `?` do on `Err(e)`?', options: ['Panics', 'Returns early with `Err(From::from(e))`', 'Prints `e` and continues', 'Converts to `None`'], answer: 1, explain: 'It is an early return that also converts the error type through `From`.' },
    { q: 'Which function signature allows `?` on both `io::Error` and `ParseIntError`?', options: ['`fn f() -> Result<(), io::Error>`', '`fn f() -> Result<(), Box<dyn Error>>`', '`fn f() -> Option<()>`', '`fn f() -> ()`'], answer: 1, explain: '`Box<dyn Error>` has a `From` impl for every `Error` type.' },
    { q: 'What does collecting `Iterator<Item = Result<T, E>>` into `Result<Vec<T>, E>` do on the first `Err`?', options: ['Skips it', 'Stops and returns that `Err`', 'Panics', 'Collects errors in the Vec'], answer: 1, explain: 'It short-circuits. To keep all errors, use `partition` or collect `Vec<Result<..>>`.' },
    { q: 'Which traits does a custom error type need?', options: ['`Debug`, `Display` and an `impl Error`', '`Clone` and `Copy`', 'Only `Debug`', '`From<String>`'], answer: 0, explain: '`Error` requires `Debug + Display`. Its methods have defaults, so an empty impl works.' },
    { q: 'What is the purpose of `Error::source()`?', options: ['To print a backtrace', 'To expose the underlying cause so the chain can be walked', 'To return the file name', 'To clone the error'], answer: 1, explain: 'Wrapping errors keep the cause reachable, which tools like `anyhow` use when printing "Caused by".' },
    { q: 'What does `anyhow::Context::context` add?', options: ['A new error type', 'A message wrapping the original error', 'A retry', 'A panic'], answer: 1, explain: 'It wraps the error with extra information about what you were doing, which appears in the chain.' },
    { q: 'Why does a blanket `impl<E: Error> From<E> for MyError` fail to compile?', options: ['`Error` is private', 'It overlaps with the standard `impl<T> From<T> for T`', 'Blanket impls are forbidden', '`MyError` is too big'], answer: 1, explain: 'If `MyError` itself implements `Error`, both impls would apply to `From<MyError>`. The coherence rules reject that.' },
    { q: 'What does `Result` being `#[must_use]` do?', options: ['Forces you to handle it with a compile error', 'Warns if you ignore a returned `Result`', 'Makes it faster', 'Nothing'], answer: 1, explain: 'An unused `Result` triggers a warning, so forgotten errors are caught. Use `let _ = ...` to ignore deliberately.' },
  ],
}
