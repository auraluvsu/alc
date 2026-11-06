// "Coming from another language" notes, one per module per language.
import type { LangId } from '../course'

export const BRIDGES: Record<number, Partial<Record<LangId, string>>> = {
  1: {
    python: 'Every Python name is a reference to a reference-counted heap object. A C++ variable **is** the object, usually on the stack, and assignment copies it. Python has no pointers (`id(x)` is the nearest thing to an address). Python ints never overflow; C++ ints do, and signed overflow is UB. There is a compile step, and types are fixed at compile time.',
    ts: 'Objects and arrays in TS are shared references, and primitives are copied. In C++ **everything** copies by default. TS `const` stops reassignment only; C++ `const` also makes the object\'s contents read-only. There is no `undefined`: an uninitialised C++ local holds garbage.',
    go: 'Pointers are almost the same (`&x`, `*p`, `nil` → `nullptr`), plus pointer arithmetic. Go zero-initialises everything; C++ locals are uninitialised unless you initialise them. Go\'s escape analysis quietly moves things to the heap; C++ doesn\'t, so returning `&local` dangles. `:=` ≈ `auto`.',
    java: 'A Java object variable is a null-able reference without arithmetic, much like a C++ pointer. But C++ class objects live directly in the variable (usually on the stack) and copy on assignment, like Java primitives. Java `final` ≈ `const` on the variable, not the object. Dereferencing null is UB, not a `NullPointerException`.',
  },
  2: {
    python: '`@dataclass` ≈ `struct`. C++ objects can\'t gain attributes at runtime: the layout is fixed. `enum.Enum` ≈ `enum class`. `typing.Union` plus a `match` statement ≈ `std::variant` plus `std::visit`, except C++ checks it at compile time.',
    ts: 'Discriminated unions (`A | B` with a `kind` tag) ≈ `std::variant`. `private` is compile-time in both languages, but C++ classes are nominal: two structs with the same fields are different, incompatible types.',
    go: 'Structs with methods carry over directly. Go has no constructors (you write `NewX` functions); C++ constructors run automatically and can enforce invariants. `iota` constants ≈ `enum class`. Go has no sum types (you use interface + type switch); `std::variant` is one.',
    java: '`class` feels familiar, but a C++ class object is a **value**, not a reference. Java defaults to package-private; C++ `class` defaults to private, `struct` to public. Java enums are full classes with methods; `enum class` is just named integers. Sealed interfaces + records + pattern `switch` (Java 21) ≈ `std::variant`.',
  },
  3: {
    python: 'Python modules ≈ C++ modules (`import`). Headers have no Python equivalent. Default arguments are evaluated on every call, so there\'s no mutable-default trap. There are no keyword arguments. Overloading exists. Returning a tuple and unpacking it ≈ structured bindings.',
    ts: 'ES modules ≈ C++ modules: only `export`ed names are visible. TS `namespace` ≈ C++ `namespace`. There are no named or object-style arguments; overloads are real separate functions, not signatures over one body. Array destructuring ≈ structured bindings.',
    go: 'A package does the jobs of both a module and a namespace. Go has no overloading and no default arguments; C++ has both. Multiple return values ≈ returning a struct or tuple and unpacking it with structured bindings.',
    java: 'Packages ≈ namespaces, `import` ≈ `import`/`using`. Java has no headers. Java has overloading but no default arguments. Java always passes the value of a reference; C++ lets you choose by value, `&`, `const&` or `&&`.',
  },
  4: {
    python: '`try`/`except`/`raise` ≈ `try`/`catch`/`throw`. `with` and `finally` ≈ RAII destructors. Python uses exceptions for control flow ("easier to ask forgiveness"). In C++ throwing is expensive, so don\'t. `assert` is removed by `-O` just as `NDEBUG` removes it in C++.',
    ts: 'Same `try`/`catch`/`throw` shape, but you catch by type and can have several `catch` blocks. There is no `finally`: destructors do the cleanup. Rejected Promises have no direct equivalent here; `std::expected` is the "errors as values" option.',
    go: '`(T, error)` returns ≈ `std::expected<T, E>`, which is C++23\'s closest match to Go style. `panic` ≈ `throw`, `recover` ≈ `catch`. `defer` ≈ RAII, but the cleanup is attached to the type, not written at each call site.',
    java: 'There are no checked exceptions: `noexcept` is the only exception specification. try-with-resources ≈ RAII, and it applies to every object automatically. Catch by `const&`. There\'s no `finally`.',
  },
  5: {
    python: '`abc.ABC` + `@abstractmethod` ≈ pure virtual functions. Every Python method is effectively virtual; C++ methods are **not** virtual unless you say so. Python duck typing is structural; C++ class hierarchies are nominal. `__del__` runs whenever the GC gets round to it; destructors run at a precise point.',
    ts: 'TS interfaces are structural ("shaped right" is enough); C++ abstract classes are nominal, so you must inherit explicitly. C++ methods are non-virtual by default, unlike JS where all methods dispatch dynamically.',
    go: 'Go interfaces are satisfied implicitly; C++ needs explicit inheritance. A Go interface value is (type, data pointer); a C++ object carries a vtable pointer instead. Go uses embedding rather than inheritance, and C++ has both.',
    java: 'This is the closest match. Abstract classes and interfaces map to classes with pure virtuals. Java methods are virtual unless `final`; C++ methods are non-virtual unless `virtual`. C++ allows multiple inheritance and has no `Object` root. `instanceof` ≈ `dynamic_cast`. No GC: ownership goes through `unique_ptr`.',
  },
  6: {
    python: '`=` rebinds a name; copying is explicit (`copy.copy`, `copy.deepcopy`). In C++, `=` copies and you control how. `__add__`, `__eq__`, `__lt__` ≈ operator overloading, and `functools.total_ordering` ≈ a defaulted `<=>`. Move semantics has no Python equivalent.',
    ts: 'TS has no operator overloading, no copy constructors and no moves. The nearest is `structuredClone` for deep copies. All of this module is new territory.',
    go: 'Go assignment copies a struct field by field, so pointers inside it are shared. That is exactly the default C++ copy, and the rule of five exists to fix it. Go has no operator overloading and no moves.',
    java: '`clone()` or a hand-written copy constructor ≈ the C++ copy constructor. Java has no operator overloading. `equals`/`hashCode`/`compareTo` ≈ `==`, `std::hash`, `<=>`. Move semantics has no Java equivalent.',
  },
  7: {
    python: 'Duck typing does at runtime what templates check at compile time. `typing.Generic`/`TypeVar` are hints only, while C++ templates generate real code for each type.',
    ts: 'Generic syntax looks similar, but TS types are erased. C++ generates separate code per type (monomorphisation). Template parameters can also be **values**, as in `std::array<int, 4>`.',
    go: 'Go 1.18+ generics with type parameters are a close cousin, but Go shares code across "GC shapes" while C++ fully instantiates per type. Func literals ≈ lambdas.',
    java: 'Java generics are erased and can\'t hold primitives (`List<Integer>` boxes). C++ templates work directly with `int`, with no boxing, and can be specialised for particular types.',
  },
  8: {
    python: '`typing.Protocol` ≈ concepts, except a type checker enforces Protocols and the compiler enforces concepts. `*args` ≈ variadic templates, but each argument keeps its own type.',
    ts: 'Structural constraints (`T extends { price(): number }`) ≈ concepts. Variadic templates resemble TS variadic tuple types: each argument keeps its own type, unlike `...rest: T[]`.',
    go: 'Constraint interfaces (`~int | ~float64`, method sets) ≈ concepts. Go\'s `...T` variadics must all share one type; C++ packs don\'t.',
    java: 'Bounded generics (`<T extends Comparable<T>>`) ≈ concepts, but Java bounds are nominal while concepts are structural. Java varargs share one type; C++ packs don\'t.',
  },
  9: {
    python: 'Python\'s standard library is far bigger (HTTP, JSON, CSV, sqlite). The C++ standard library has no JSON, HTTP or networking, so you\'ll reach for libraries such as nlohmann/json, Boost and Asio.',
    ts: 'Node gives you `fs`, `http` and npm. C++ has no standard package manager (vcpkg and Conan are common) and no standard networking.',
    go: 'Go ships `net/http` and `encoding/json` in the standard library. C++ doesn\'t, so expect to pick third-party libraries for those.',
    java: 'The JDK covers networking, GUI, JSON-ish tooling and much more. The C++ standard library is much smaller, focused on containers, algorithms, text, time, maths and concurrency.',
  },
  10: {
    python: '`str` is immutable Unicode; `std::string` is mutable **bytes** with no Unicode awareness. Slicing ≈ `substr` or a `string_view` window. `re` ≈ `std::regex` (correct, but slow).',
    ts: 'JS strings are immutable UTF-16; `std::string` is mutable bytes, and `.size()` counts bytes, not characters. Regex literals ≈ `std::regex` with raw strings `R"(...)"`.',
    go: 'A Go `string` (an immutable byte view) ≈ `std::string_view`; `[]byte` ≈ `std::string`. There\'s no standard rune iteration like `for _, r := range s`.',
    java: '`String` is immutable UTF-16, and `StringBuilder` ≈ a mutable `std::string`. Importantly, `==` on `std::string` compares **contents**, unlike Java\'s reference `==`.',
  },
  11: {
    python: '`print` and f-strings ≈ `std::println`/`std::format`, and the `{:>8.2f}` mini-language was borrowed from Python. `open()` with `with` ≈ an `fstream` closed by RAII. `pathlib` ≈ `std::filesystem`.',
    ts: '`console.log` ≈ `std::println`, template literals ≈ `std::format`, the `fs` module ≈ `fstream` + `std::filesystem`.',
    go: '`fmt.Println`/`Printf` ≈ `std::println`/`std::format`. `bufio.Scanner` ≈ `std::getline`. `path/filepath` ≈ `std::filesystem`. A `Stringer` ≈ a `std::formatter` specialisation.',
    java: '`System.out.println`/`String.format` ≈ `std::println`/`std::format`. `BufferedReader` ≈ `std::getline`. `java.nio.file.Path` ≈ `std::filesystem::path`. `toString()` ≈ `std::formatter`.',
  },
  12: {
    python: '`list` ≈ `vector`, `dict` ≈ `unordered_map`, `set` ≈ `unordered_set`, `collections.deque` ≈ `deque`. A `dict` keeps insertion order; `unordered_map` doesn\'t, and `map` keeps **sorted** order.',
    ts: '`Array` ≈ `vector`, `Map` ≈ `unordered_map`, `Set` ≈ `unordered_set`. JS `Map` keeps insertion order, C++ hash containers don\'t.',
    go: 'Slice ≈ `vector` (but a `vector` copies on assignment), `map` ≈ `unordered_map`. Go has no ordered map in the standard library; C++ has `map` and C++23\'s `flat_map`.',
    java: '`ArrayList` ≈ `vector`, `HashMap` ≈ `unordered_map`, `TreeMap` ≈ `map`, `LinkedList` ≈ `list`. The difference: C++ containers store objects **inline and contiguously**, not references to heap objects.',
  },
  13: {
    python: '`sorted(key=...)` ≈ `ranges::sort` with a projection, `functools.reduce` ≈ `fold_left`, and `itertools` covers similar ground. Algorithms are free functions, not methods.',
    ts: '`map`/`filter`/`reduce`/`find`/`sort` exist as free algorithms. A C++ comparator returns **bool** ("a < b?"), not a negative/zero/positive number like JS `sort`.',
    go: 'The `slices` package (`slices.Sort`, `slices.Index`) ≈ `std::ranges` algorithms. Go has no iterator-pair concept like C++ `begin()`/`end()`.',
    java: '`Collections.sort` with a `Comparator` ≈ `ranges::sort`. A Java `Iterator` is one object; C++ uses a begin/end pair of pointer-like iterators. `parallelStream` ≈ `std::execution::par`.',
  },
  14: {
    python: 'Generators with `yield` ≈ `std::generator` with `co_yield`. `zip`, `enumerate` and `itertools` ≈ `views::zip`, `views::enumerate` and friends. Both are lazy, like generator expressions.',
    ts: '`function*` generators ≈ `std::generator`. Array methods are eager; views are lazy, like the newer iterator helpers. `Array.from(iter)` ≈ `ranges::to`.',
    go: 'Range-over-func iterators (`iter.Seq`, Go 1.23) ≈ `std::generator` and views.',
    java: 'Streams ≈ view pipelines (both lazy), and `.toList()` ≈ `ranges::to`. Views usually allocate nothing and can often be iterated more than once.',
  },
  15: {
    python: 'Every Python reference is effectively a `shared_ptr` (refcounting), and the `weakref` module ≈ `weak_ptr`. `Optional[T]` / `None` ≈ `std::optional`. `memoryview` ≈ `std::span`.',
    ts: 'The GC handles ownership, so smart pointers are new. `T | undefined` ≈ `std::optional<T>`. Tuples ≈ `pair`/`tuple`. A typed array `subarray` ≈ `std::span`.',
    go: 'GC\'d pointers replace ownership decisions. A slice ≈ `std::span` (a view into an array). The comma-ok idiom ≈ `std::optional`.',
    java: 'The GC means all references are shared ownership. `WeakReference` ≈ `weak_ptr`, `Optional` ≈ `std::optional`. Records ≈ named structs; Java has no tuples.',
  },
  16: {
    python: '`time`/`datetime` ≈ `std::chrono`, `functools.partial` ≈ `std::bind_front`, `inspect` frames ≈ `source_location`, `int.bit_count()` ≈ `std::popcount`, `sys.exit` ≈ `std::exit`. `move()`/`forward()` have no Python equivalent.',
    ts: '`Date`/`performance.now()` ≈ `std::chrono`. `.bind` ≈ `std::bind_front`. There\'s no built-in source location beyond `Error().stack`. `move()`/`forward()` have no TS equivalent.',
    go: '`time.Duration` ≈ typed `chrono` durations. `math/bits` ≈ `<bit>`. `runtime.Caller` ≈ `source_location`. `os.Exit` skips defers, just as `std::quick_exit` skips cleanup.',
    java: '`java.time` ≈ `std::chrono`. Method references ≈ function objects. `StackWalker` ≈ `source_location`. `Integer.bitCount` ≈ `std::popcount`. `System.exit` ≈ `std::exit`. `move()`/`forward()` have no Java equivalent.',
  },
  17: {
    python: '`math` ≈ `<cmath>` and `random` ≈ `<random>` (engines plus distributions). NumPy has **no** standard equivalent: `std::mdspan` and `valarray` are partial at best, and real projects use Eigen. Python ints are arbitrary precision; C++ ints are fixed width.',
    ts: '`Math.*` ≈ `<cmath>`. JS has only `number` (double) and `bigint`; C++ has many fixed-width types. `Math.random` can\'t be seeded; C++ engines can.',
    go: '`math` ≈ `<cmath>`, `math/rand` ≈ `<random>`, the built-in `complex128` ≈ `std::complex<double>`, `math.MaxInt64` ≈ `std::numeric_limits`.',
    java: '`Math` ≈ `<cmath>`, `Random`/`SplittableRandom` ≈ `<random>`, `Integer.MAX_VALUE` ≈ `std::numeric_limits`. Java has no standard complex type; C++ has `std::complex`.',
  },
  18: {
    python: 'CPython threads are limited by the GIL (free-threading is optional from 3.13); C++ threads run truly in parallel. `asyncio` coroutines ≈ C++ coroutines, but C++ ships no event loop. `concurrent.futures` ≈ `std::async`/`std::future`.',
    ts: 'JS is single-threaded with an event loop. C++ threads share memory, so data races are your problem. Promise ≈ `std::future`, `async`/`await` ≈ `co_await`, but there is no standard runtime to drive coroutines.',
    go: 'Goroutines are cheap and scheduled by the runtime; `std::thread` is a heavyweight OS thread. There are no standard channels: build one from a mutex plus a condition variable. `sync.Mutex` ≈ `std::mutex`, `WaitGroup` ≈ `std::latch`, context cancellation ≈ `std::stop_token`.',
    java: 'Very close: `Thread` ≈ `std::jthread`, `synchronized` ≈ `std::mutex` + `scoped_lock`, `CompletableFuture` ≈ `std::future`, `AtomicInteger` ≈ `std::atomic<int>`. The memory models are similar. Virtual threads have no standard equivalent.',
  },
}
