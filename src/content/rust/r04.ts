import type { Module } from '../types'

export const r04: Module = {
  n: 4,
  title: 'Packages, Crates and Modules',
  tour: '7, 14 · Managing Growing Projects; More About Cargo',
  summary: 'How Rust code is organised: packages, crates, modules, paths and visibility, plus Cargo profiles, workspaces and publishing.',
  topics: ['Packages & crates', 'Modules & paths', 'Visibility & use', 'Workspaces', 'Profiles & publishing'],
  cpp23: [
    'Workspace-wide inheritance of dependencies, package metadata and lints: `[workspace.dependencies]`, `[workspace.package]` and `[workspace.lints]` (Rust 1.64 and 1.74).',
    'The 2024 edition turns on the MSRV-aware dependency resolver (`resolver = "3"`), which prefers versions compatible with your `rust-version`.',
    'In the 2024 edition `gen` is a reserved keyword, `extern` blocks must be written `unsafe extern`, and `unsafe_op_in_unsafe_fn` warns by default. `cargo fix --edition` handles most of the migration.',
  ],
  lessons: [
    {
      id: 'packages-crates',
      title: 'Packages and crates',
      blocks: [
        { kind: 'analogy', text: "A **package** is a shipping box with a packing slip (`Cargo.toml`). Inside are one or more **crates**: each crate is one finished product built from many parts. A crate is either a **library** (a toolkit others can use) or a **binary** (a machine you switch on). Cargo reads the slip, builds every product and fetches the parts you ordered." },
        { kind: 'code', code: `my_app/
├── Cargo.toml          # the package manifest
├── Cargo.lock          # exact versions used (commit it for applications)
├── src/
│   ├── main.rs         # crate root of the default binary crate
│   ├── lib.rs          # crate root of the library crate (optional)
│   └── bin/
│       └── tool.rs     # extra binary crates: one file each
├── tests/              # integration tests (module 8)
├── examples/
└── benches/` },
        { kind: 'code', code: `# Cargo.toml
[package]
name = "my_app"
version = "0.3.0"
edition = "2024"
rust-version = "1.85"           # minimum supported Rust version (MSRV)
description = "A small tool"
license = "MIT OR Apache-2.0"

[dependencies]
serde = { version = "1", features = ["derive"] }
rand = "0.9"                    # semver: ^0.9, compatible updates only

[dev-dependencies]              # only for tests, examples and benches
tempfile = "3"` },
        { kind: 'list', items: [
          'A **crate** is the unit of compilation and of dependency. The **crate root** (`main.rs` or `lib.rs`) is where the compiler starts.',
          'A **package** has at most one library crate and any number of binary crates. A common layout is a thin `main.rs` that calls into `lib.rs`, so the logic can be tested and reused.',
          'Versions follow **semver**: `"1.2"` means `>=1.2.0, <2.0.0`. `cargo update` moves `Cargo.lock` within those bounds. `cargo add serde`, `cargo remove serde` and `cargo tree` manage and inspect the graph.',
          'Dependencies come from crates.io by default, or `git = "..."` or `path = "../other"`. Fetching and building happen automatically on the first `cargo build`.',
          'All dependencies are **compiled from source** and statically linked into your binary. There is no DLL hell, and no system package needed, but build times grow with the dependency tree.',
        ] },
        { kind: 'new23', text: 'A new project gets `edition = "2024"`. The 2024 edition also selects resolver 3, which is aware of each dependency\'s `rust-version` and avoids picking a release your declared MSRV cannot compile. Upgrading older code is `cargo fix --edition`, then change the edition line.' },
        { kind: 'compare',
          cpp: `# CMakeLists.txt + a package manager (vcpkg, Conan) + headers and a separate build per dependency
add_executable(app main.cpp)
target_link_libraries(app PRIVATE fmt::fmt)`,
          go: `// go.mod: module path, go version, require lines. Packages are directories.
go get github.com/foo/bar@v1.2.3`,
          python: `# pyproject.toml + a lock file (uv, poetry); packages are installed, not compiled
dependencies = ["requests>=2"]`,
          java: `<!-- pom.xml or build.gradle; JARs are downloaded, not compiled -->
<dependency><groupId>org</groupId><artifactId>lib</artifactId></dependency>`,
          ts: `// package.json + package-lock.json; node_modules holds the sources
"dependencies": { "zod": "^3.0.0" }`,
          rust: `# Cargo.toml: one manifest for build, deps, tests, features
[dependencies]
serde = "1"`,
          note: 'Cargo gives every Rust project the same layout and commands, so you can build and test an unfamiliar crate on the first try.' },
        { kind: 'check', q: 'How many library crates can a single package contain?', options: ['None', 'At most one', 'Any number', 'Exactly one per binary'], answer: 1, hint: 'There is one `lib.rs`.', explain: 'A package has at most one library crate (`src/lib.rs`) and any number of binary crates (`src/main.rs` and `src/bin/*.rs`).' },
      ],
    },
    {
      id: 'modules',
      title: 'Modules and paths',
      blocks: [
        { kind: 'analogy', text: "Modules are the rooms of a house. Each room has its own cupboards, and a door that is **locked by default**. A visitor (another module) needs a path from the front door (`crate`) and permission to enter. Walking up a level is `super`, the room you are standing in is `self`." },
        { kind: 'code', code: `// src/lib.rs
mod exchange {                        // an inline module
    pub mod book {
        pub struct Order { pub id: u64, qty: u32 }       // qty is private
        impl Order {
            pub fn new(id: u64, qty: u32) -> Self { Order { id, qty } }
            pub fn qty(&self) -> u32 { self.qty }
        }
        pub fn best_bid() -> f64 { super::price_scale() * 99.5 }   // super: the parent module
    }
    fn price_scale() -> f64 { 1.0 }   // private to \`exchange\` and its children
}

pub fn demo() {
    let o = crate::exchange::book::Order::new(1, 10);   // absolute path from the crate root
    println!("{}", o.qty());
    // exchange::price_scale();          // error: private function
}` },
        { kind: 'code', code: `// Splitting into files. In src/lib.rs (or main.rs):
mod exchange;             // load src/exchange.rs (or src/exchange/mod.rs)
pub mod util;

// src/exchange.rs
pub mod book;             // load src/exchange/book.rs

// File tree:
// src/lib.rs
// src/exchange.rs
// src/exchange/book.rs
// src/util.rs` },
        { kind: 'list', items: [
          'The module tree is declared in code with `mod name;`. It is **not** implied by the file system: a file that is never named in a `mod` declaration is never compiled.',
          '`mod foo;` looks for `foo.rs` next to the declaring file, or `foo/mod.rs`. The first form (`foo.rs` plus a `foo/` folder for children) is the modern preference.',
          'Paths: **absolute** from the crate root `crate::a::b`, or **relative** from here (`a::b`, `self::a`, `super::sibling`). Paths to other crates start with the crate name: `serde::Serialize`.',
          'Module names are `snake_case`, types are `UpperCamelCase`, and functions and variables are `snake_case`. The compiler warns about deviations.',
          'Everything in a module is **private to that module** (and its children) by default. The privacy boundary is the module, not the type: two types in the same module can read each other\'s private fields.',
          'Items from the standard library prelude (`Vec`, `Option`, `String`, `Some`, `None`, `Box`, `Clone`...) are in scope in every module with no import.',
        ] },
        { kind: 'pitfall', text: 'Creating `src/util.rs` and expecting it to compile is the common first-module mistake. Cargo only builds files reachable from the crate root through `mod` declarations. If the compiler says "unresolved import" for something you wrote, check that the module is declared.' },
        { kind: 'compare',
          cpp: `// headers: #include "exchange/book.hpp"; namespaces are separate from files
namespace exchange::book { struct Order; }`,
          go: `// a package is a directory; all files in it share one namespace
import "myapp/exchange/book"`,
          python: `# the file system is the module tree: exchange/book.py
from exchange.book import Order`,
          java: `package exchange.book;     // must match the folder
import exchange.book.Order;`,
          ts: `// each file is a module with explicit exports
import { Order } from "./exchange/book"`,
          rust: `mod exchange { pub mod book { pub struct Order; } }   // or files via \`mod exchange;\`
use crate::exchange::book::Order;`,
          note: 'Rust is the only one here where the module tree is declared in code and the files only provide the text. It trades a little ceremony for full control over visibility.' },
        { kind: 'check', q: 'You create `src/util.rs` and call `util::helper()` from `main.rs`, but get "unresolved". What is missing?', options: ['`mod util;` in `main.rs`', '`import util`', 'A `util/mod.rs` file', 'Nothing: restart rust-analyzer'], answer: 0, hint: 'Files do not declare themselves.', explain: 'The `mod util;` declaration tells the compiler the module exists and to load `util.rs`.' },
      ],
    },
    {
      id: 'visibility',
      title: 'Visibility and use',
      blocks: [
        { kind: 'analogy', text: "`pub` is the sign on the door: how far out does the invitation go? `pub` alone is everyone, even other crates. `pub(crate)` means \"staff only\": anyone inside this crate. `pub(super)` is \"my parent's room\". And `use` is a shortcut on your phone: it does not move the contact, it only saves you from typing the long path." },
        { kind: 'code', code: `pub fn everyone() {}                // visible outside the crate
pub(crate) fn staff() {}            // visible inside this crate only
pub(super) fn parent() {}           // visible in the parent module
pub(in crate::exchange) fn one() {} // visible in a named ancestor module
fn me() {}                          // private: this module and its children

pub struct Account {
    pub owner: String,              // fields are private unless marked pub
    balance: f64,
}
pub enum Side { Buy, Sell }         // enum variants are always as public as the enum

// use: bring names into scope
use std::collections::HashMap;
use std::io::{self, Read, Write};   // nested paths: std::io, std::io::Read, std::io::Write
use std::fmt::Result as FmtResult;  // rename with as
use crate::exchange::book::*;       // glob import (use sparingly)
pub use self::book::Order;          // re-export: part of *this* module's public API` },
        { kind: 'list', items: [
          '**Idiom:** import a *module* for functions (`use std::io; io::stdin()`), and the *type* itself for structs and enums (`use std::collections::HashMap;`). The first keeps the origin visible at the call site and the second keeps type names short.',
          'To avoid a name clash, use `as` (`use std::fmt::Result as FmtResult`) or refer to the parent module in the path.',
          '`pub use` **re-exports** an item, so users of your crate see a tidy flat API while your internal layout stays free to change. Much of `std::prelude` works this way.',
          'Glob imports (`use x::*`) are fine in tests (`use super::*;`) and preludes, and discouraged elsewhere, since they hide where names come from.',
          'A struct with private fields cannot be built with literal syntax outside its module, so the module controls how values come into existence (**smart constructors**), which is how invariants are enforced.',
          '`use` declarations can go anywhere in a block, and you can write `use` inside a function to scope the names to it.',
        ] },
        { kind: 'code', code: `// Enforcing an invariant through privacy
pub mod money {
    #[derive(Debug, Clone, Copy)]
    pub struct Cents(i64);                   // field is private

    impl Cents {
        pub fn new(v: i64) -> Option<Self> { (v >= 0).then_some(Cents(v)) }
        pub fn get(self) -> i64 { self.0 }
    }
}
// Outside: money::Cents(-5) is an error. Only money::Cents::new(...) can make one,
// so every Cents in the program is known to be non-negative.` },
        { kind: 'compare',
          cpp: `class Account { public: std::string owner; private: double balance; };   // access per member, per class`,
          go: `type Account struct { Owner string; balance float64 }   // capital = exported, per package`,
          python: `class Account: ...    # _balance is private by convention only`,
          java: `public class Account { public String owner; private double balance; }   // per class; package-private default`,
          ts: `class Account { owner = ""; #balance = 0 }   // # is truly private at runtime`,
          rust: `pub struct Account { pub owner: String, balance: f64 }   // privacy is per module`,
          note: 'Privacy in Rust is module-wide: code in the same module can access private fields of all types in that module. The module, not the class, is the encapsulation boundary.' },
        { kind: 'check', q: 'What does `pub(crate)` mean?', options: ['Visible to all crates', 'Visible only within the current crate', 'Visible only in the current module', 'Visible to the parent module only'], answer: 1, hint: 'The word in parentheses names the scope.', explain: '`pub(crate)` makes an item part of the crate\'s internal API: usable anywhere inside, hidden from dependents.' },
      ],
    },
    {
      id: 'workspaces',
      title: 'Workspaces and features',
      blocks: [
        { kind: 'analogy', text: "A workspace is a business park: several buildings (crates) that share one car park (`target/`), one reception desk (`Cargo.lock`) and a common rulebook (shared dependency versions and lints). Features are the optional rooms in each building that you can choose to open or keep locked, so visitors only pay for what they use." },
        { kind: 'code', code: `# Cargo.toml at the repository root
[workspace]
resolver = "3"
members = ["crates/core", "crates/cli", "crates/feed"]

[workspace.package]                 # shared metadata
version = "0.4.0"
edition = "2024"
license = "MIT"

[workspace.dependencies]            # one place to pin versions
serde = { version = "1", features = ["derive"] }
anyhow = "1"

[workspace.lints.clippy]            # shared lint policy
unwrap_used = "warn"

# crates/cli/Cargo.toml
[package]
name = "cli"
version.workspace = true            # inherit
edition.workspace = true

[dependencies]
core = { path = "../core" }         # a sibling crate
serde.workspace = true              # use the shared entry
anyhow.workspace = true

[lints]
workspace = true` },
        { kind: 'code', code: `# crates/feed/Cargo.toml: optional functionality
[features]
default = ["json"]
json = ["dep:serde_json"]          # enables an optional dependency
fix-protocol = []                  # a plain on/off flag

[dependencies]
serde_json = { version = "1", optional = true }` },
        { kind: 'code', code: `// In the code: compile pieces only when the feature is on
#[cfg(feature = "json")]
pub fn parse_json(s: &str) -> Result<Quote, Error> { /* ... */ }

#[cfg(test)]                         // other cfg: tests, OS, architecture
mod tests { /* ... */ }

#[cfg(target_os = "linux")]
fn pin_to_core() { /* ... */ }

if cfg!(debug_assertions) { println!("debug build"); }   // runtime-looking, compile-time value` },
        { kind: 'list', items: [
          'A **workspace** compiles all member crates into one shared `target/` directory with one `Cargo.lock`. `cargo build --workspace`, `cargo test -p core` and `cargo run -p cli` select members.',
          'Use workspaces to split a big project (core logic, CLI, server, bindings) into crates that compile and test independently. Crates compile in parallel, and only changed ones rebuild.',
          '**Features** are additive switches. Enabling a feature must never remove API or change behaviour incompatibly, because Cargo takes the **union** of features requested by every dependent.',
          '`cargo build --features json`, `--no-default-features` and `--all-features` pick them. Keep `default` small.',
          '`cfg` attributes and the `cfg!` macro compile code conditionally on features, OS, architecture, test mode and debug assertions.',
        ] },
        { kind: 'check', q: 'Why must Cargo features be additive?', options: ['They are always enabled together', 'Several crates may request different features of the same dependency, and Cargo builds one version with the union', 'Features cannot be disabled', 'It is only a convention for naming'], answer: 1, hint: 'Think of two dependents of the same crate.', explain: 'If crate A needs feature x and crate B needs feature y of a shared dependency, one copy is built with both. Features that conflict would make that impossible.' },
      ],
    },
    {
      id: 'profiles',
      title: 'Profiles, docs and publishing',
      blocks: [
        { kind: 'analogy', text: "A profile is a dial between *fast to cook* and *fast to eat*. The `dev` profile is a microwave dinner: ready in seconds, but not as good. The `release` profile is slow-roasting: it takes time to prepare, and tastes far better. You choose by use, and Cargo lets you customise the dial." },
        { kind: 'code', code: `# Cargo.toml
[profile.dev]
opt-level = 1               # a little optimisation so debug builds are tolerable

[profile.release]
opt-level = 3               # default; "s" and "z" optimise for size
lto = "fat"                 # link-time optimisation: slower to build, faster binary
codegen-units = 1           # less parallel compile, better optimisation
panic = "abort"             # no unwinding: smaller and faster, but no catch_unwind
debug = "line-tables-only"  # keep stack traces useful in production
strip = "symbols"           # shrink the binary

[profile.bench]
inherits = "release"

[profile.profiling]         # a custom profile: cargo build --profile profiling
inherits = "release"
debug = true` },
        { kind: 'code', caption: 'Documentation and publishing.', code: `$ cargo doc --open               # build HTML docs from /// comments, and open them
$ cargo test --doc               # doc examples are compiled and run as tests
$ cargo publish --dry-run        # package and verify without uploading
$ cargo publish                  # upload to crates.io (needs a token)
$ cargo yank --version 0.3.0     # stop new projects from using a version
$ cargo install ripgrep          # install a binary crate from crates.io
$ cargo install --path .         # install from this folder` },
        { kind: 'code', code: `//! Crate-level docs: a short overview shown on the front page.

/// Returns the midpoint of a bid and an ask.
///
/// # Examples
/// \`\`\`
/// assert_eq!(mylib::mid(99.0, 101.0), 100.0);
/// \`\`\`
///
/// # Panics
/// Never.
pub fn mid(bid: f64, ask: f64) -> f64 { (bid + ask) / 2.0 }` },
        { kind: 'list', items: [
          '`cargo build` uses the `dev` profile, and `--release` uses `release`. Profile settings apply **per workspace root**: set them in the top-level `Cargo.toml`.',
          '`lto`, `codegen-units = 1` and `panic = "abort"` are the usual three knobs for a production binary. Measure the gain before adopting each one.',
          'Doc comments are Markdown. Code blocks in them are **compiled and run as tests**, so docs cannot silently rot. Standard section headings are `# Examples`, `# Panics`, `# Errors` and `# Safety`.',
          '`cargo publish` is permanent: a published version can be yanked (hidden from new users) but never deleted. Check `cargo package --list` first so you do not leak files.',
          'The `rust-version` field and `cargo msrv` help you decide which Rust versions you promise to support. Following semver carefully matters: use `cargo semver-checks` before a release.',
        ] },
        { kind: 'pitfall', text: 'Benchmarking a `dev` build and concluding "Rust is slow" is the most common mistake. Debug builds are often 10 to 100 times slower than release in numeric code. Always measure with `--release`.' },
        { kind: 'check', q: 'Which `Cargo.toml` section changes optimisation level for `cargo build --release`?', options: ['`[features]`', '`[profile.release]`', '`[workspace]`', '`[dev-dependencies]`'], answer: 1, hint: 'The name matches the flag.', explain: 'Profiles configure the compiler for a build mode. `[profile.release]` applies to `--release`.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is the difference between a package and a crate?', options: ['None, they are synonyms', 'A package is described by one `Cargo.toml` and holds one or more crates; a crate is a compilation unit', 'A crate holds packages', 'Packages are only for libraries'], answer: 1, explain: 'The package is the Cargo unit (manifest, version). The crate is the unit the compiler builds: a library or a binary.' },
    { q: 'What makes `src/util.rs` part of the build?', options: ['Its existence', 'A `mod util;` declaration reachable from the crate root', 'An entry in Cargo.lock', 'An `import util` statement'], answer: 1, explain: 'The module tree is declared in code. A file nobody declares is ignored by the compiler.' },
    { q: 'What does `super::` refer to in a path?', options: ['The crate root', 'The current module', 'The parent module', 'The standard library'], answer: 2, explain: '`super` goes up one module, like `..` in a file system.' },
    { q: 'By default, items in a module are…', options: ['Public', 'Private to the module and its children', 'Private to the crate', 'Private to the file'], answer: 1, explain: 'Privacy is the default. Use `pub`, `pub(crate)`, `pub(super)` or `pub(in path)` to widen it.' },
    { q: 'What is `pub use` for?', options: ['Making an import mutable', 'Re-exporting an item as part of this module\'s public API', 'Importing from other crates only', 'Importing private items'], answer: 1, explain: 'It lets a crate present a clean public path regardless of its internal layout.' },
    { q: 'Why are Cargo features required to be additive?', options: ['Because of naming rules', 'Because the union of all requested features is built once', 'Because features cannot be disabled', 'Because cargo cannot parse negations'], answer: 1, explain: 'A dependency graph may ask for different features of one crate. Cargo builds a single copy with the union, so features must never conflict.' },
    { q: 'Which profile setting enables link-time optimisation?', options: ['`opt-level = 3`', '`lto = "fat"`', '`panic = "abort"`', '`strip = "symbols"`'], answer: 1, explain: '`lto` lets the optimiser see the whole program at link time, which can improve speed at the cost of build time.' },
    { q: 'What happens to code examples in `///` doc comments during `cargo test`?', options: ['They are ignored', 'They are compiled and run as tests', 'They are only rendered', 'They run only with `--release`'], answer: 1, explain: 'Doc tests keep documentation correct: if an example stops compiling, the test fails.' },
    { q: 'You have three crates that all depend on `serde`. How do you keep their versions in sync?', options: ['Copy the version into each manifest', 'Use `[workspace.dependencies]` and `serde.workspace = true`', 'Use `Cargo.lock` only', 'Rename the crates'], answer: 1, explain: 'A workspace can declare each dependency once and members inherit it.' },
    { q: 'Does `cargo publish` allow you to delete a published version?', options: ['Yes, with `cargo delete`', 'No: it can only be yanked', 'Yes within 24 hours', 'Only for binaries'], answer: 1, explain: 'Published versions are permanent so builds stay reproducible. Yanking prevents new projects from picking one up.' },
  ],
}
