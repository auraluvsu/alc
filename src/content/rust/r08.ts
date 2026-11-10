import type { Module } from '../types'

export const r08: Module = {
  n: 8,
  title: 'Writing Tests and a CLI',
  tour: '11, 12 · Writing Automated Tests; An I/O Project',
  summary: 'Unit, integration and doc tests, `cargo test` options, then putting it together in a small command-line program.',
  topics: ['Unit tests', 'Integration tests', 'Doc tests', 'Test organisation', 'A command-line tool'],
  cpp23: [
    'In the 2024 edition, rustdoc merges doc tests into fewer compiled programs per crate, which makes large doc-test suites much faster.',
    'Tests can return `Result<(), E>`, so `?` works inside them (Rust 1.28), and `#[should_panic(expected = "...")]` checks the message.',
    '`cargo test` runs unit, integration and doc tests in one command. `cargo nextest` (third-party) adds faster, isolated parallel runs.',
    'Inline format arguments make assertion messages short: `assert!(ok, "bad id {id}")`.',
  ],
  lessons: [
    {
      id: 'unit',
      title: 'Unit tests',
      blocks: [
        { kind: 'analogy', text: "A unit test is a smoke detector for one room. It sits inside the room (same module), can reach everything in there, including the private cupboards, and goes off the moment something it was told to check changes. You never ship the detectors to your customers: `#[cfg(test)]` keeps them out of release builds." },
        { kind: 'code', code: `// src/lib.rs
pub fn mid(bid: f64, ask: f64) -> f64 { (bid + ask) / 2.0 }

fn spread(bid: f64, ask: f64) -> f64 { ask - bid }       // private

pub fn parse_qty(s: &str) -> Result<u32, std::num::ParseIntError> { s.trim().parse() }

#[cfg(test)]                       // compiled only for \`cargo test\`
mod tests {
    use super::*;                  // bring the parent module's items in, private ones too

    #[test]
    fn mid_is_average() {
        assert_eq!(mid(99.0, 101.0), 100.0);
    }

    #[test]
    fn private_functions_are_testable() {
        assert!((spread(99.5, 100.0) - 0.5).abs() < 1e-9);    // compare floats with a tolerance
    }

    #[test]
    fn parse_ok_and_error() -> Result<(), std::num::ParseIntError> {
        assert_eq!(parse_qty(" 42 ")?, 42);                   // ? works in a test returning Result
        assert!(parse_qty("x").is_err());
        Ok(())
    }

    #[test]
    #[should_panic(expected = "index out of bounds")]
    fn out_of_range_panics() {
        let v = vec![1];
        let _ = v[5];
    }

    #[test]
    #[ignore = "slow: run with --ignored"]
    fn expensive() { /* ... */ }
}` },
        { kind: 'list', items: [
          'A test is any function marked `#[test]`. It **passes** if it returns normally (or `Ok(())`) and **fails** if it panics. `cargo test` runs them in parallel, each in its own thread.',
          '`assert!(cond, "message {x}")`, `assert_eq!(left, right)` and `assert_ne!` print both values on failure. The values must implement `Debug` and `PartialEq`.',
          'The `tests` module lives in the same file, so it can use **private** items. This is the main reason Rust unit tests sit next to the code they test.',
          'Floats: never `assert_eq!` computed floats. Compare `(a - b).abs() < eps`, or use the `approx` crate.',
          'Test names should say what is true: `rejects_negative_qty`, not `test1`. Failures print the name.',
          'Setup is ordinary code: build values in a helper function (`fn sample_book() -> Book`). Teardown is `Drop`, so a `TempDir` or guard cleans up even when the test panics.',
        ] },
        { kind: 'compare',
          cpp: `TEST(Mid, Average) { EXPECT_EQ(mid(99, 101), 100); }   // GoogleTest or Catch2: an external framework`,
          go: `func TestMid(t *testing.T) { if got := Mid(99, 101); got != 100 { t.Errorf("got %v", got) } }`,
          python: `def test_mid(): assert mid(99, 101) == 100   # pytest`,
          java: `@Test void midIsAverage() { assertEquals(100.0, mid(99, 101)); }   // JUnit`,
          ts: `test("mid", () => expect(mid(99, 101)).toBe(100))   // Jest or Vitest`,
          rust: `#[test] fn mid_is_average() { assert_eq!(mid(99.0, 101.0), 100.0); }   // built in: no framework`,
          note: 'Testing is part of the language and of Cargo. There is nothing to install or configure to write your first test.' },
        { kind: 'check', q: 'Why can a unit test call a private function?', options: ['`#[test]` makes everything public', 'The `tests` module is a child of the module that defines it, and children can see private parent items', 'Tests run with `unsafe`', 'It cannot'], answer: 1, hint: 'Privacy is by module, and children see their ancestors.', explain: 'Items are private to their module **and its descendants**. A `tests` submodule with `use super::*` can use everything above it.' },
      ],
    },
    {
      id: 'integration',
      title: 'Integration tests',
      blocks: [
        { kind: 'analogy', text: "A unit test checks one room from inside. An **integration test** is a customer walking up to the front door: it has no keys to the private rooms, only the public entrance (`pub` API), so it tests exactly what your users can do. Each customer comes in separately, and that is why every file in `tests/` is compiled as its own crate." },
        { kind: 'code', code: `my_lib/
├── Cargo.toml
├── src/lib.rs               # the library under test
└── tests/
    ├── pricing.rs           # each file is its own crate, run as its own test binary
    ├── ordering.rs
    └── common/
        └── mod.rs           # shared helpers (a directory, so it is not run as a test)

// tests/pricing.rs
use my_lib::{mid, Book};                 // only public items are visible
mod common;                              // include tests/common/mod.rs

#[test]
fn builds_and_prices_a_book() {
    let book = common::sample_book();
    assert_eq!(mid(book.bid(), book.ask()), 100.0);
}` },
        { kind: 'list', items: [
          'Integration tests live in a top-level `tests/` directory (next to `src/`). No `#[cfg(test)]` is needed: Cargo compiles them only for tests.',
          'Each `tests/*.rs` file is a **separate crate** that links your library, so it sees only the public API. Run one with `cargo test --test pricing`.',
          'Shared helper code goes in `tests/common/mod.rs` (not `tests/common.rs`, which would be treated as a test file).',
          'You cannot import from a **binary** crate (`main.rs`). The common structure is a thin `main.rs` calling into `lib.rs`: the logic is then reusable and testable.',
          'For tools, test the executable end to end with a crate like `assert_cmd` that runs the real binary and checks output and exit code.',
          'Cargo test order: unit tests, integration tests, then doc tests. If a stage fails, later ones are not run unless you pass `--no-fail-fast`.',
        ] },
        { kind: 'check', q: 'Where would you put a test that uses only your crate\'s public API?', options: ['In `src/main.rs`', 'In a file under `tests/`', 'In `Cargo.toml`', 'In `target/`'], answer: 1, hint: 'Each file is its own crate.', explain: 'Files in `tests/` are compiled as separate crates, so they can only use what the library exports.' },
      ],
    },
    {
      id: 'doc',
      title: 'Doc tests',
      blocks: [
        { kind: 'analogy', text: "A doc test is a recipe card that **actually cooks the dish** every time you print it. If you change the recipe and forget to change the card, the kitchen smoke alarm goes off. Because every Markdown code block in your `///` comments is compiled and run, documentation cannot quietly go stale." },
        { kind: 'code', code: `/// Splits \`"key=value"\` into its parts.
///
/// # Examples
///
/// \`\`\`
/// use my_lib::split_kv;
/// assert_eq!(split_kv("a=1"), Some(("a", "1")));
/// assert_eq!(split_kv("nothing"), None);
/// \`\`\`
///
/// Hidden lines start with \`# \` so the reader does not see setup:
///
/// \`\`\`
/// # fn main() -> Result<(), Box<dyn std::error::Error>> {
/// let (k, v) = my_lib::split_kv("x=2").ok_or("no =")?;
/// # Ok(())
/// # }
/// \`\`\`
///
/// # Panics
/// Never panics.
pub fn split_kv(s: &str) -> Option<(&str, &str)> { s.split_once('=') }` },
        { kind: 'list', items: [
          'Each fenced code block in a doc comment is a test. Rust wraps it in a `fn main` automatically unless you provide one.',
          'Attributes on the fence: `no_run` (compile only: for code that would hit the network), `ignore`, `should_panic`, `compile_fail` (the block must fail to compile: useful for showing what the type system rejects).',
          'Lines starting with `# ` are compiled but hidden from the rendered docs. Use them for boilerplate.',
          'Standard sections: `# Examples`, `# Errors` (when it returns `Err`), `# Panics`, `# Safety` (for `unsafe fn`). These are what readers expect.',
          'Run only doc tests with `cargo test --doc`. They are slower than unit tests because each is compiled, though the 2024 edition merges them to cut that cost.',
          '`//!` documents the enclosing module or crate. Put a runnable "getting started" example at the top of `lib.rs`.',
        ] },
        { kind: 'compare',
          cpp: `/** @code ... @endcode */          // Doxygen: examples are never compiled`,
          go: `func ExampleMid() { fmt.Println(Mid(99, 101)); // Output: 100 }   // testable examples: Go has this too`,
          python: `>>> mid(99, 101)
100.0                              # doctest: the same idea`,
          java: `/** {@code mid(99, 101)} */      // Javadoc examples are not executed`,
          ts: `/** @example mid(99, 101) */    // not executed`,
          rust: `/// \`\`\`
/// assert_eq!(my_lib::mid(99.0, 101.0), 100.0);
/// \`\`\``,
          note: 'Go and Python have doc tests as well. In Rust, every public example is verified by default.' },
        { kind: 'check', q: 'What does a doc-test fence marked `no_run` do?', options: ['Skips it entirely', 'Compiles it but does not execute it', 'Runs it in release mode', 'Hides it from the docs'], answer: 1, hint: 'It still has to type-check.', explain: '`no_run` is for code with side effects (network, files): it must compile, but is not run.' },
      ],
    },
    {
      id: 'organisation',
      title: 'Running and organising tests',
      blocks: [
        { kind: 'analogy', text: "A big test suite is a fire drill: you want to run the whole building sometimes, one floor often, and one door while you are fixing it. `cargo test` has switches for all three, and flags to reveal what each test printed or to line them up one at a time when they share a resource." },
        { kind: 'code', caption: 'Common ways to run tests.', code: `$ cargo test                         # everything: unit, integration, doc
$ cargo test mid                     # only tests whose name contains "mid"
$ cargo test --lib                   # unit tests only
$ cargo test --test pricing          # one integration test file
$ cargo test --doc                   # doc tests only
$ cargo test -p core                 # one crate in a workspace
$ cargo test -- --nocapture          # show println! output of passing tests
$ cargo test -- --test-threads=1     # run one at a time (shared files, ports)
$ cargo test -- --ignored            # run only #[ignore] tests
$ cargo test -- --include-ignored    # run all
$ cargo test --release               # optimised: for numeric or slow tests
$ cargo test --no-fail-fast          # do not stop at the first failing binary` },
        { kind: 'code', code: `// Property-based and snapshot testing, with crates
use proptest::prelude::*;
proptest! {
    #[test]
    fn mid_between_bid_and_ask(bid in 1.0f64..1e6, spread in 0.0f64..100.0) {
        let ask = bid + spread;
        let m = mid(bid, ask);
        prop_assert!(m >= bid && m <= ask);      // checked on hundreds of generated inputs
    }
}

// Benchmarks: criterion or divan (the built-in #[bench] is still unstable)
// fn bench(c: &mut Criterion) { c.bench_function("mid", |b| b.iter(|| mid(black_box(99.0), black_box(101.0)))); }

// Test doubles come from traits (module 7): write the code against a trait, pass a fake in tests
trait Clock { fn now(&self) -> u64; }
struct FixedClock(u64);
impl Clock for FixedClock { fn now(&self) -> u64 { self.0 } }
fn is_expired(c: &impl Clock, deadline: u64) -> bool { c.now() > deadline }
#[test] fn expires() { assert!(is_expired(&FixedClock(10), 5)); }` },
        { kind: 'list', items: [
          '**Parallelism:** tests run in parallel by default. Tests that share a file, environment variable or port must use unique names (`tempfile`), serialise (`--test-threads=1`, or the `serial_test` crate), or avoid shared state.',
          '**Output:** `println!` in a passing test is captured and hidden. A failing test prints it. Use `-- --nocapture` to see everything.',
          '**What to test:** public behaviour with unit and integration tests, tricky pure functions with property tests, and parsers with snapshot tests (`insta`). Skip testing `derive`d code.',
          '**Mocking:** Rust tests rely on traits and dependency injection more than on monkey-patching. `mockall` generates mocks from traits when you need them.',
          '`cargo test` builds with the `test` profile (`dev`-like with debug assertions on), so `debug_assert!` fires and integer overflow panics.',
          '`#[cfg(test)]` code and `[dev-dependencies]` never end up in your release binary.',
        ] },
        { kind: 'check', q: 'A test calls `println!` and passes. When do you see that output?', options: ['Always', 'Only with `-- --nocapture` (or if the test fails)', 'Never', 'Only in release mode'], answer: 1, hint: 'The harness captures output per test.', explain: 'Captured output is shown for failures. Pass `--nocapture` to see it for all tests.' },
      ],
    },
    {
      id: 'cli',
      title: 'Project: a command-line search tool',
      blocks: [
        { kind: 'analogy', text: "A command-line tool is a vending machine: coins and a button go in (arguments, environment, stdin), and a product comes out of the slot (stdout), with a separate alarm bell (stderr) and a status light (the exit code) for problems. Keeping those channels separate is what lets other tools plug yours into a pipeline." },
        { kind: 'code', code: `// src/lib.rs: the logic, testable
use std::{env, error::Error, fs};

pub struct Config { pub query: String, pub path: String, pub ignore_case: bool }

impl Config {
    pub fn build(mut args: impl Iterator<Item = String>) -> Result<Config, &'static str> {
        args.next();                                           // skip the program name
        let Some(query) = args.next() else { return Err("missing query") };
        let Some(path) = args.next() else { return Err("missing file path") };
        let ignore_case = env::var("IGNORE_CASE").is_ok();     // config from the environment
        Ok(Config { query, path, ignore_case })
    }
}

pub fn run(cfg: Config) -> Result<(), Box<dyn Error>> {
    let text = fs::read_to_string(&cfg.path)?;
    let hits = if cfg.ignore_case { search_insensitive(&cfg.query, &text) } else { search(&cfg.query, &text) };
    for line in hits { println!("{line}"); }
    Ok(())
}

pub fn search<'a>(query: &str, text: &'a str) -> Vec<&'a str> {     // lifetime: lines borrow from text
    text.lines().filter(|l| l.contains(query)).collect()
}
pub fn search_insensitive<'a>(query: &str, text: &'a str) -> Vec<&'a str> {
    let q = query.to_lowercase();
    text.lines().filter(|l| l.to_lowercase().contains(&q)).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn finds_matching_lines() {
        let text = "Rust:\\nsafe, fast.\\nPick three.";
        assert_eq!(search("fast", text), vec!["safe, fast."]);
    }
    #[test]
    fn case_insensitive() {
        assert_eq!(search_insensitive("rUsT", "Rust:\\ntrust me"), vec!["Rust:", "trust me"]);
    }
}

// src/main.rs: a thin shell around the library
use std::{env, process};
fn main() {
    let cfg = minigrep::Config::build(env::args()).unwrap_or_else(|err| {
        eprintln!("problem parsing arguments: {err}");       // errors go to stderr
        process::exit(2);
    });
    if let Err(e) = minigrep::run(cfg) {
        eprintln!("application error: {e}");
        process::exit(1);
    }
}` },
        { kind: 'code', caption: 'The same tool with clap, which handles --help, flags and errors for you.', code: `use clap::Parser;
use std::path::PathBuf;

/// Search a file for lines containing a pattern.
#[derive(Parser, Debug)]
#[command(version, about)]
struct Args {
    /// Text to look for
    query: String,
    /// File to search
    path: PathBuf,
    /// Ignore case
    #[arg(short, long)]
    ignore_case: bool,
}

fn main() -> anyhow::Result<()> {
    let args = Args::parse();                       // prints usage and exits on bad input
    let text = std::fs::read_to_string(&args.path)?;
    for line in minigrep::search(&args.query, &text) { println!("{line}"); }
    Ok(())
}` },
        { kind: 'code', caption: 'Reading standard input, and fast output.', code: `use std::io::{self, BufRead, BufWriter, Write};

fn main() -> io::Result<()> {
    let stdin = io::stdin();
    let out = io::stdout();
    let mut out = BufWriter::new(out.lock());          // lock once, buffer writes: much faster than println! in a loop
    for line in stdin.lock().lines() {
        let line = line?;
        writeln!(out, "{}", line.to_uppercase())?;
    }
    out.flush()
}` },
        { kind: 'list', items: [
          '**Separate the binary from the library**: `main` parses arguments and handles errors, and everything else lives in `lib.rs` where it is tested.',
          '**stdout for results, stderr for diagnostics**: `println!` and `eprintln!`. This keeps `tool > out.txt` and pipelines clean.',
          '**Exit codes:** 0 for success, non-zero for failure. Returning `Result` from `main` gives 1 on `Err`. `ExitCode::from(n)` or `process::exit(n)` give a specific one (`exit` skips destructors).',
          'In real tools use **`clap`** (derive) for arguments, **`anyhow`** for errors, and **`serde`** for config files. Writing a parser by hand, as above, is for learning.',
          '`BufReader` / `BufWriter` batch the system calls. Reading or writing a byte at a time without buffering is slow in every language.',
          'Test the finished binary with `assert_cmd` (run it, assert on stdout, stderr and status), and test the library with unit tests as above.',
        ] },
        { kind: 'pitfall', text: 'Calling `println!` in a tight loop over millions of lines is slow because each call locks stdout and may flush on newline. Wrap `stdout().lock()` in a `BufWriter` as above. Also `println!` panics if stdout is closed (`tool | head`): for polished tools, handle `BrokenPipe`.' },
        { kind: 'check', q: 'Why is the logic in `lib.rs` and not in `main.rs`?', options: ['`main.rs` cannot contain functions', 'Integration tests and other crates can only import library crates, so it keeps the logic testable and reusable', 'It compiles faster', 'It is required by Cargo'], answer: 1, hint: 'Remember what you cannot import from a binary crate.', explain: 'A binary crate cannot be a dependency or be imported by tests. A thin `main` plus a library solves both.' },
      ],
    },
  ],
  quiz: [
    { q: 'What makes a function a test?', options: ['Its name starts with `test_`', 'The `#[test]` attribute', 'Being in `tests/`', 'A `Test` suffix'], answer: 1, explain: 'Any function with `#[test]` is collected by the harness, wherever it lives.' },
    { q: 'What does `#[cfg(test)]` do on a module?', options: ['Makes the module public', 'Compiles it only when running `cargo test`', 'Marks tests as ignored', 'Enables debug output'], answer: 1, explain: 'The module and its `[dev-dependencies]` uses are absent from normal builds.' },
    { q: 'How does a test fail?', options: ['By returning `false`', 'By panicking (or returning `Err`)', 'By printing an error', 'By calling `exit(1)`'], answer: 1, explain: 'A panic in the test thread, or a returned `Err` from a `Result` test, marks it failed.' },
    { q: 'Which can an integration test in `tests/` use?', options: ['Private functions of the library', 'Only the library\'s public API', 'Functions from `main.rs`', 'Nothing from the library'], answer: 1, explain: 'Each file is a separate crate that depends on your library.' },
    { q: 'Where should shared integration-test helpers go?', options: ['`tests/common.rs`', '`tests/common/mod.rs`', '`src/common.rs`', '`target/common.rs`'], answer: 1, explain: 'A subdirectory module is not treated as its own test crate.' },
    { q: 'What happens to code blocks in `///` comments during `cargo test`?', options: ['Nothing', 'They are compiled and run as doc tests', 'They are linted', 'They are removed'], answer: 1, explain: 'This keeps documentation examples correct.' },
    { q: 'How do you run tests one at a time?', options: ['`cargo test --serial`', '`cargo test -- --test-threads=1`', '`cargo test --release`', '`cargo test --lib`'], answer: 1, explain: 'Useful when tests share external state. Better still, make them independent.' },
    { q: 'Why should a CLI send errors to stderr?', options: ['It is faster', 'So stdout stays clean for piping the program\'s real output', 'Because `println!` is deprecated', 'Rust requires it'], answer: 1, explain: 'Pipelines and redirections consume stdout, and diagnostics must not pollute it.' },
    { q: 'What is wrong with `assert_eq!(0.1 + 0.2, 0.3)`?', options: ['Nothing', 'Floating-point rounding makes it fail: compare with a tolerance', 'It does not compile', 'It panics at compile time'], answer: 1, explain: '0.1 + 0.2 is 0.30000000000000004. Use `(a - b).abs() < eps`.' },
    { q: 'What does `#[should_panic(expected = "...")]` check?', options: ['That the test never panics', 'That the test panics and the message contains the text', 'That the program exits with 1', 'That a `Result` is `Err`'], answer: 1, explain: 'Without `expected`, any panic passes, which can hide the wrong one.' },
  ],
}
