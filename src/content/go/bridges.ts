import type { LangId } from '../../course'

// "Coming from another language" notes for the Go course.
export const GO_BRIDGES: Record<number, Partial<Record<LangId, string>>> = {
  1: {
    python: 'Like Python, the toolchain is one command, but Go compiles to a single static binary: there is no interpreter or virtualenv to ship. Indentation means nothing, braces do, and `gofmt` settles style. `go run` gives you the quick edit-run loop you are used to.',
    ts: 'Go feels like TypeScript with the types enforced at runtime and no build pipeline to configure. `go.mod` is `package.json`, `go get` is `npm install`, and the standard library covers HTTP, JSON and testing without npm. Goroutines replace the event loop: blocking code is fine because each request has its own goroutine.',
    java: 'Single static binaries instead of a JVM and JARs, near-instant start-up, and no build tool beyond `go`. `package main` + `func main()` replaces `public static void main`. Goroutines are similar to Java 21 virtual threads, which Go has had since day one.',
    cpp: 'Native code, like C++, but with a garbage collector and a scheduler in the runtime, and a build system, formatter and package manager built in. Compile times are seconds, not minutes, by design (no headers, no templates to instantiate).',
  },
  2: {
    python: 'Variables are declared (`:=`) and statically typed, and they always start at a zero value, never `None` by accident. Visibility is capitalisation rather than a leading underscore convention, and the compiler enforces it.',
    ts: 'Exported = capitalised, instead of `export`. `:=` is `let` with inference; `const` is only for compile-time constants, not for "don\'t reassign this". Named types like `type Celsius float64` give the branding TS fakes with intersection types.',
    java: 'No classes, constructors or access modifiers. Capitalisation decides visibility per package, and zero values replace null-default fields. Pointers are explicit (`*T`, `&x`), but there is no pointer arithmetic and the GC manages lifetimes, like Java references.',
    cpp: 'Pointers without arithmetic, and returning `&local` is safe because escape analysis moves it to the heap. Zero-initialisation everywhere means no garbage reads. `type T U` creates a distinct type with no implicit conversions, which is stricter than a C++ `using` alias.',
  },
  3: {
    python: 'Ints are fixed-width and wrap on overflow, unlike Python\'s arbitrary-precision ints. Strings are immutable **bytes** (usually UTF-8), so `len` counts bytes and `range` decodes runes. There are no implicit int/float mixes: `float64(n)` is required.',
    ts: 'Real integer types instead of one `number`, and no implicit conversions at all. Strings are UTF-8 bytes rather than UTF-16, so emoji and accents take several bytes, and `range` gives code points. `iota` replaces enum declarations.',
    java: 'Similar sized integers, but overflow is defined to wrap (as in Java) and there are unsigned types too. Strings are UTF-8 bytes, not UTF-16 chars, and a `rune` is a full code point. `iota` constants replace `enum`, which Go doesn\'t have.',
    cpp: 'Like `std::string`, a Go string holds bytes, but the language understands UTF-8 (`range`, `rune`). Signed overflow is defined (it wraps), not UB. Untyped constants have arbitrary precision, a bit like constexpr arithmetic that never overflows.',
  },
  4: {
    python: 'A slice is like a list, but slicing does **not** copy: `b := a[:2]` shares memory with `a`. Maps are dicts, but with random iteration order and compile-time key/value types. A struct is a dataclass without methods inside it.',
    ts: 'Slices look like arrays but are views that can share memory, so `append` might or might not affect another slice. Maps are typed `Map`s with random order. Struct tags (`json:"name"`) do what decorators or zod schemas do for JSON.',
    java: 'Slices behave like `ArrayList.subList` views that can also grow. Maps are `HashMap`s, typed, and unsafe for concurrent writes. Structs are value types (copied on assignment), closer to records than to classes. Embedding is composition, not `extends`.',
    cpp: 'A slice is roughly a `std::span` that can `append` (sometimes reallocating, like `vector`). Arrays are values like `std::array`. Maps are hash maps with deliberately random iteration. Struct embedding promotes members but creates no base-class relationship.',
  },
  5: {
    python: 'Instead of `try/except`, functions return `(value, err)` and you check `err` on the spot. `defer` is a more flexible `with`/`finally`. Closures and first-class functions work as you\'d expect; Go has no keyword arguments or decorators.',
    ts: 'No exceptions for normal failures: `(T, error)` is like returning `Result<T, E>` and checking it every time. `defer` is `finally` attached to the function. `errors.Is`/`As` replace `instanceof` checks on caught errors.',
    java: 'No checked or unchecked exceptions for ordinary errors: they are return values. `errors.As` is like catching a specific exception type, and `%w` wrapping is like a `cause`. `defer` replaces `finally` and try-with-resources. `panic` exists but is reserved for bugs.',
    cpp: '`(T, error)` returns are Go\'s `std::expected`. `defer` is an ad-hoc scope guard (RAII without writing a class). `panic`/`recover` work like exceptions but are only for programmer errors. Closures capture by reference and the GC keeps captured variables alive.',
  },
  6: {
    python: 'Methods are declared outside the type with an explicit receiver (no `self` magic), and any named type can have them, even a float. There is no inheritance: embedding gives composition with automatic delegation.',
    ts: 'No classes: methods attach to any type in the package. A pointer receiver (`*T`) is how a method mutates its object; with a value receiver it works on a copy. Embedding is like mixins without a prototype chain.',
    java: 'No classes, no inheritance, no `this`. Value vs pointer receivers decide whether a method sees a copy or the original, which matters because structs are values. Embedding gives delegation without subtyping. Generic methods arrived only in Go 1.27.',
    cpp: 'Methods are free functions with a receiver: a value receiver is like taking `T` by value, a pointer receiver like `T*`/`this`. There are no virtual functions or overloading. Embedding promotes methods like public inheritance would, but with no conversion to the "base".',
  },
  7: {
    python: 'Go interfaces formalise duck typing: any type with the right methods satisfies the interface, checked at compile time.',
    ts: 'Structural like TS interfaces, but for methods only, and checked by the compiler with no `implements` needed.',
    java: 'Interfaces without `implements`: satisfaction is implicit. Small, one-method interfaces are idiomatic (`io.Reader`).',
    cpp: 'Like a concept that also works at runtime: structural, implicitly satisfied, with dynamic dispatch through an interface value (type + pointer).',
  },
  8: {
    python: 'Goroutines are like asyncio tasks that run in parallel on all cores, with no `async`/`await` colouring of functions.',
    ts: 'No event loop: blocking calls are fine because each goroutine is cheap. Channels replace Promises and async iterators.',
    java: 'Goroutines ≈ virtual threads; channels ≈ `BlockingQueue` with `select` built into the language.',
    cpp: 'Goroutines are cheap, runtime-scheduled threads; channels are the standard queue C++ lacks. `select` waits on several at once.',
  },
  9: {
    python: 'No GIL: goroutines really run at the same time, so shared data needs mutexes or channels. `go test -race` finds races for you.',
    ts: 'Real shared-memory parallelism, so data races are possible, unlike single-threaded JS.',
    java: '`sync.Mutex` ≈ `ReentrantLock` (but not reentrant!), and the memory model is similar to Java\'s happens-before rules.',
    cpp: 'Same ideas as `std::mutex` and atomics, plus a built-in race detector. Data races are bugs, though not UB in the C++ sense.',
  },
  10: {
    python: 'Modules ≈ pyproject + pip, with dependencies pinned and checksummed by default. Packages are folders, as in Python.',
    ts: '`go.mod` ≈ package.json + lockfile. Imports are full paths (`github.com/x/y`) instead of registry names.',
    java: 'Packages are folders, as in Java, but there is no Maven/Gradle; the go command does it all.',
    cpp: 'The package manager and build system C++ never standardised: no CMake, no vcpkg, just `go build`.',
  },
  11: {
    python: '`go test` is pytest built in, and table-driven tests replace parametrize. Benchmarks and fuzzing are also built in.',
    ts: 'Like Jest/Vitest but in the standard toolchain, with no assertion library by default: plain `if` plus `t.Errorf`.',
    java: 'JUnit built into the toolchain. Tests live next to code in `_test.go` files.',
    cpp: 'GoogleTest, Google Benchmark and libFuzzer all included in `go test`.',
  },
  12: {
    python: 'Reflection is much more cumbersome than Python\'s `getattr` and `__dict__`, on purpose: it is for libraries such as encoders.',
    ts: 'There are no runtime type annotations in TS; Go keeps full type information at runtime, accessible through `reflect`.',
    java: 'Similar in spirit to `java.lang.reflect`, but less used: generics and interfaces cover most needs.',
    cpp: 'The runtime reflection that C++ is only now getting at compile time (C++26). It is used by `encoding/json` and friends.',
  },
  13: {
    python: '`unsafe` and cgo play the role of ctypes/C extensions: for interop and the occasional hot path.',
    ts: 'Like WebAssembly or native addons: rarely needed, and it gives up the safety guarantees.',
    java: 'Comparable to JNI and `sun.misc.Unsafe`.',
    cpp: '`unsafe.Pointer` gives you back C-style pointer games. cgo calls C (and C++ via `extern "C"`), at a per-call cost.',
  },
  14: {
    python: 'Generics are checked by the compiler, unlike `TypeVar` hints that only a type checker reads.',
    ts: 'Similar syntax (`[T any]` instead of `<T>`), but constraints can include operators via type sets (`~int | ~float64`).',
    java: 'No type erasure, and primitives work directly (`[]int`, no boxing). Since Go 1.27, methods can have type parameters too.',
    cpp: 'Constraints are like concepts. Go compiles generics with shared "GC shape" code rather than one instantiation per type.',
  },
  15: {
    python: '`iter.Seq` ≈ generator functions; `yield` is a callback you call instead of a keyword.',
    ts: 'Like generator functions with `for...of`, but push-based: the iterator calls `yield` for each element.',
    java: 'Similar to `Iterable` and streams, but you write a single function that pushes values.',
    cpp: 'Similar to `std::generator`, without coroutines: the loop body becomes the `yield` callback.',
  },
}
