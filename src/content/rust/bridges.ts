import type { LangId } from '../../course'

// "Coming from another language" notes for the Rust course.
export const RUST_BRIDGES: Record<number, Partial<Record<LangId, string>>> = {
  1: {
    cpp: 'Think of `cargo` as CMake, a package manager, clang-format, clang-tidy and a test runner in one. Variables are immutable by default (the opposite of C++), there is no implicit narrowing, and signed overflow is not undefined behaviour: it panics in debug builds and wraps in release. Out-of-range indexing is a defined panic. `if`, `match` and blocks are expressions, so `?:` is unnecessary.',
    go: 'You will find a familiar toolchain story (one command builds, tests and formats) and a similar view of simplicity. The differences: variables are immutable unless `mut`, shadowing with `let` is allowed in the same scope (Go\'s `:=` is not), `if` and `match` are expressions, and there are no default zero values, because every variable must be initialised before use. `usize` indexes, not `int`.',
    python: 'Types are declared on functions and inferred inside them, and the compiler checks everything before the program runs. Integers have fixed widths and overflow is a real concern (use `checked_*` methods). `let` is a new binding, not an assignment, so `let x = x + 1` creates a second variable. Blocks are braces and every statement ends in a semicolon, except the last expression, which is the value.',
    java: 'No JVM, no garbage collector: the result is a native executable. Variables are immutable by default (like `final`), `var` has no real analogue because `let` already infers, and primitives and objects are not split into two worlds. There is no `null`: absence is `Option` (module 3). Integer overflow is checked in debug builds, unlike Java\'s silent wrap.',
    ts: '`let` and `const` map roughly to `let mut` and `let`. Numbers are not one type: choose `i32`, `u64`, `f64` and so on, and convert explicitly with `as`, `From` or `try_from`. There is no `undefined` or `null`, and no implicit coercion. Template strings become `format!("{x}")`.',
  },
}
