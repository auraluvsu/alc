import type { LangId } from '../../course'

// "Coming from another language" notes for the Java course.
export const JAVA_BRIDGES: Record<number, Partial<Record<LangId, string>>> = {
  1: {
    python: 'Types are declared and checked before the program runs, blocks use braces, and statements end in semicolons. `int` is a fixed 32 bits and wraps on overflow, unlike Python\'s arbitrary-precision ints. `/` on two ints truncates like Python\'s `//`, except that it rounds toward zero rather than down. `ArrayList` is your `list`, with a fixed element type.',
    cpp: 'Compiles to bytecode rather than native code, then the JIT produces optimised native code at runtime. No headers, no preprocessor, no `unsigned`, no operator overloading. Sizes are fixed by the language. All objects live on the heap behind references, and array bounds are always checked. `args[0]` is the first real argument, not the program name.',
    go: 'Like Go, there is a garbage collector, a runtime and fixed-size integers. But you ship JARs that need a JVM (or use `jlink`) rather than one static binary. Unused imports and locals are allowed. Java has several loop forms, classes everywhere, and exceptions rather than `error` values. `var` is the closest thing to `:=`.',
    ts: 'The syntax looks familiar, but types really exist at runtime, and there is one concrete integer type per width rather than `number`. `==` never coerces, but on objects it compares identity, so use `.equals`. `ArrayList` plays the role of a JS array, and `javac` plus a JVM replace `tsc` plus Node.',
  },
  2: {
    python: 'All fields are declared up front, with no adding attributes at runtime, and `private` is really enforced. `self` is implicit and spelled `this`. Constructors are named after the class, and there can be several of them, since overloading exists. `record` is your `@dataclass(frozen=True)`, and there are no properties: use methods.',
    cpp: 'Every class-typed variable is a reference, like a non-owning pointer that may be null and can be reassigned. There is no copy constructor run on assignment, no destructor, no `const` methods and no stack-allocated objects. Assignment never copies an object. A `record` gives you `= default` comparison, plus accessors and `toString`.',
    go: 'Methods live inside the class rather than on a receiver, and access uses keywords rather than capitalisation. There are real constructors, since a useful zero value is not a thing for objects (object fields default to `null`). A `record` is a struct whose fields are immutable, and with `equals` already generated. All objects are referred to through references, with no explicit `*T`.',
    ts: 'Much like TS classes, but a class is nominal: two classes with identical members are unrelated types. Fields must be declared, and `private` is enforced at runtime as well. `this` never changes with the caller, so you\'ll have no binding surprises. Static typing doesn\'t vanish at runtime here.',
  },
  3: {
    python: 'An interface is an explicit `Protocol` that classes must name in an `implements` clause. There are no free functions, and no function type: a lambda is an object of a single-method interface, so you call `f.apply(x)`. Lambdas can have full bodies, and captured locals must not be reassigned.',
    cpp: 'An interface is close to an abstract class with pure virtual functions and no data, and multiple implementation is fine. A lambda is like a closure that captures by value, with captures required to be effectively final. There is no `std::function`: the target is a named interface such as `Function<T, R>`. Method references resemble `std::mem_fn`.',
    go: 'The big difference: a Java class must declare `implements`, so nothing satisfies an interface implicitly. You also can\'t add an interface to a type you don\'t own, except with a wrapper. Functions aren\'t first class, but a lambda converts to any single-method interface. Note the loop-variable capture rule: the classic `i` can\'t be captured at all.',
    ts: 'Typing is nominal, not structural: having the right shape isn\'t enough. Function types don\'t exist, so you use `Function<A, B>` or your own interface, and call it by the method name. `this` inside a lambda works like an arrow function\'s. Default methods have no direct TS equivalent.',
  },
  4: {
    python: 'Single class inheritance only, with interfaces for the rest, so no MRO puzzles. `equals`, `hashCode`, `toString` are your `__eq__`, `__hash__`, `__str__`. `switch` patterns resemble `match`, but sealed types get exhaustiveness checked by the compiler. An `enum` is much like Python\'s `Enum`, with methods and fields.',
    cpp: 'Methods are virtual by default, and `final` opts out. There are no slicing surprises, as all objects are held by reference. No multiple inheritance of classes, no `protected` inheritance. A sealed interface with records fills the role of `std::variant` with exhaustive `switch` rather than `std::visit`. `getClass` and reflection go far beyond RTTI.',
    go: 'Go has no inheritance, so this is the main new thing to learn: `extends`, `super` and `protected`. Unlike embedding, inherited code calling an overridden method does dispatch to the subclass. A sealed interface is what you may have faked with an unexported marker method, and here the compiler checks each `switch` for completeness.',
    ts: 'Class inheritance works as in TS, with an actual `sealed` keyword replacing discriminated unions, and record patterns replacing property checks. `instanceof` is reliable for all types, since types are real at runtime. An `enum` is a set of full objects, not numbers or strings.',
  },
  5: {
    python: 'Same try/catch idea, plus `finally`. New for you: checked exceptions, which the compiler makes you handle or declare. try-with-resources is your `with` statement, and `AutoCloseable` is your `__exit__`. Python\'s `logging` maps closely to Java\'s logging facades.',
    cpp: 'Exceptions are objects thrown by reference and caught by type. There is no `noexcept`, and destructors don\'t exist, so RAII becomes try-with-resources. Exceptions are the normal error style throughout the libraries. Stack traces come free with each exception. `assert` is off unless you pass `-ea`.',
    go: 'You\'re leaving `if err != nil` behind. Errors propagate automatically until something catches them, and the compiler checks some of them (checked exceptions). `defer f.Close()` becomes try-with-resources. `panic` is close to an unchecked exception. Wrapping with `%w` corresponds to passing a cause to the constructor.',
    ts: 'Catch clauses can filter by type, and you may have several. Checked exceptions have no TS equivalent. try-with-resources resembles `using` and `await using`. A thrown value must be a `Throwable`, so strings cannot be thrown. Unhandled errors end a thread rather than the event loop.',
  },
  6: {
    python: 'Java generics are checked at compile time like `mypy`, but the compiler always enforces them. `TypeVar` bounds become `T extends X`. Variance is declared at each use, with `? extends` and `? super`, instead of on the type variable. Primitives aren\'t allowed as type arguments.',
    cpp: 'These aren\'t templates. There is one compiled class shared by all type arguments, thanks to erasure. No specialisation, no `new T()`, no `T::something`, no primitives, no non-type parameters. Bounds are like concepts, and enforced at the definition. Error messages are far shorter, but `vector<int>`-style packed storage isn\'t available.',
    go: 'Syntax is close to Go 1.18 generics: `[T cmp.Ordered]` becomes `<T extends Comparable<T>>`. Java adds wildcards, since subtyping exists and has to be handled. Java erases types rather than instantiating them by shape, and it can\'t hold primitives directly in a `List`.',
    ts: 'Very similar syntax, including erasure at runtime. But TS generics are structural with bivariance in places, while Java is invariant unless you use wildcards at the call site. Java inserts checked casts at runtime. Conditional and mapped types have no equivalent.',
  },
  7: {
    python: '`ArrayList` is `list`, `HashMap` is `dict`, `HashSet` is `set`, `ArrayDeque` is `deque`, `PriorityQueue` is `heapq`, and `Map.merge` covers `Counter` and `defaultdict` use. No subscript syntax: `get` and `put`. `HashMap` order isn\'t insertion order: use `LinkedHashMap` if you want that.',
    cpp: '`ArrayList` is `vector`, `HashMap` is `unordered_map`, `TreeMap` is `map`, `ArrayDeque` is `deque`, and `PriorityQueue` is a min-heap (the opposite of `priority_queue`). Everything stores references, so a list of numbers is a list of pointers to boxed values. Iterators are hasNext/next objects with no pairs of begin and end.',
    go: '`ArrayList` is a slice with `append` built in, `HashMap` is a `map`, and sets actually exist. `get` on a missing key gives `null`, not a zero value. There is no comma-ok: use `containsKey` or `getOrDefault`. Thread-safe maps come in the library as `ConcurrentHashMap`, similar to `sync.Map`.',
    ts: '`ArrayList` is `Array`, `HashMap` is `Map`, and `HashSet` is `Set`. But `TreeMap`, `PriorityQueue` and `ArrayDeque` have no built-in JS equivalent. `HashMap` uses your `equals` and `hashCode`, so objects can work as keys by value rather than only by identity.',
  },
  8: {
    python: 'Streams are generator pipelines with named stages. `.filter(...)`, `.map(...)` and `.toList()` read in order, instead of nested comprehensions. Single use, like a generator. `groupingBy` covers `itertools.groupby` and `Counter`, without needing sorted input. `Optional` replaces `None` checks for return values.',
    cpp: 'Very close to C++20 ranges with `views::filter` and `views::transform`: lazy, one element at a time, with collectors as `ranges::to`. Unlike views, a stream is single-use and can run in parallel with one call. `Optional.map` matches `std::optional::transform`.',
    go: 'Go prefers plain loops, plus iterator functions since 1.23. Streams are the Java idiom for what you\'d write as a `for` with `append`, and there\'s a one-word parallel mode. `mapConcurrent` is like an `errgroup` with a limit. Don\'t overuse them: a clear loop is fine in Java too.',
    ts: 'Like array `filter`, `map` and `reduce`, but lazy: no intermediate arrays, and nothing runs without a terminal operation. You start with `.stream()` and end with `.toList()`. `Collectors.groupingBy` is `Object.groupBy` with composable aggregates. `Optional` replaces `?.` and `??`.',
  },
  9: {
    python: '`Files.readString` is `Path.read_text`, and `Path` feels like `pathlib` split in two. try-with-resources is `with open(...)`. `Pattern` and `Matcher` map to `re.compile` and match objects. `HttpClient` covers what `requests` does, in the JDK. `ObjectOutputStream` has the same risks as `pickle`.',
    cpp: 'Decorated streams look like `iostream` filters, and `Path` is `std::filesystem::path`. Reading text always involves a charset, because `char` is a UTF-16 unit, not a byte. An HTTP client and regex are in the standard library, and exception-based errors replace stream state flags.',
    go: '`InputStream` is `io.Reader`, and `OutputStream` is `io.Writer`, with decorators in place of composition functions. `Files.readAllBytes` is `os.ReadFile`. `java.net.http` matches the `net/http` client, but there is no standard server to match. Java regexes backtrack, unlike RE2, so hostile patterns can be slow.',
    ts: '`Files` resembles `fs` with synchronous calls, which on virtual threads scale like async ones. `HttpClient` is close to `fetch`, with an explicit client and body handlers. Regex syntax is close to JS, but you double each backslash in a string, and there are no regex literals.',
  },
  10: {
    python: 'No GIL here: threads really run in parallel on multiple cores, so races are real, and `count += 1` needs protection. `ExecutorService` is `concurrent.futures`. `CompletableFuture` is like an asyncio `Task` with chaining. Python\'s free-threaded build moves in this direction.',
    cpp: 'The memory model is similar, with `synchronized` as a mutex built into each object, and `volatile` meaning something like `std::atomic` load and store (not C++ `volatile`). Data races don\'t produce undefined behaviour of the C++ kind, but you can still see surprising values. `std::jthread` ideas map on to `Thread` plus interrupts.',
    go: 'Executors stand in for spawning goroutines, and `BlockingQueue` is a channel without `select`. `synchronized` is like `sync.Mutex`, and `AtomicInteger` is `atomic.Int64`. Java shares memory by default, whereas Go encourages passing messages. Module 14 covers virtual threads, Java\'s version of goroutines.',
    ts: 'Real shared-memory threads replace the single-threaded event loop, and that\'s a real change: two pieces of code can run at the same instant. `CompletableFuture` is a `Promise`, with `thenApply` and `thenCompose` as `then`. You now also need locks and atomics.',
  },
  11: {
    python: 'They look like decorators, but do nothing by themselves: no wrapper function is created. Some framework or tool has to read them through reflection, or at compile time. `@dataclass`-like behaviour needs a code generator, or a record.',
    cpp: 'Like `[[attributes]]`, but user-definable and readable through reflection at runtime. They can have typed parameters, and processors can use them to generate source during the build, which is roughly where you\'d reach for macros or C++26 reflection.',
    go: 'Struct tags, promoted to typed, compiler-checked language features. Annotation processors match `go generate`, though they run as part of the compile. They can sit on nearly anything, not just struct fields.',
    ts: 'Same syntax as TS decorators, but a Java annotation doesn\'t execute: it\'s only data. Think of `reflect-metadata` without the function. Frameworks do what NestJS and Angular do, by reading annotations through reflection.',
  },
  12: {
    python: '`__all__` and leading underscores are hints, whereas modules are enforced by the compiler and JVM. A `module-info.java` does part of the job of `pyproject.toml` dependencies, without versions. `jlink` is like shipping a trimmed interpreter with your app, as tools like PyInstaller do.',
    cpp: 'Named like C++20 modules, but the goal is encapsulation and configuration at the level of JARs, not faster builds. `exports` works on whole packages, not individual declarations. `jlink` gives you a form of static linking for the runtime.',
    go: 'A Go module is about versioned dependencies, whereas a Java module is about access boundaries. `exports` plays the role of the `internal/` rule. Versions remain with Maven or Gradle. `jlink` gets you closer to Go\'s self-contained deployment.',
    ts: 'Closest to the `exports` map in `package.json`, but enforced at runtime for all reflection as well. Services resemble dependency injection configured by the runtime. There is nothing like `node_modules`: the module path is a flat list.',
  },
  13: {
    python: 'Python lets you get by with duck typing and module-level functions, so OO discipline is often optional there. Java makes it structural: the compiler checks contracts. Most patterns here apply equally, but `Protocol` and first-class functions replace some of the ceremony you\'d see in older Java.',
    cpp: 'The ideas match Core Guidelines advice: prefer composition, keep hierarchies shallow, separate interface from implementation. The cost model is different: without value types and templates, polymorphism goes through virtual calls and heap objects, which the JIT is very good at optimising.',
    go: 'Go made many of these rules into language choices: no inheritance, small implicit interfaces and plain constructors. Java gives you more options, so the discipline is on you. Apply your Go instincts here: small interfaces, composition and functions as parameters are all good Java.',
    ts: 'You\'ll recognise many of these from TS, where interfaces and classes coexist. The sealed-and-records style maps closely to discriminated unions, and Java now enforces exhaustiveness equally well. Dependency injection is common in both ecosystems.',
  },
  14: {
    python: 'There\'s no `async`/`await` split: every method can block cheaply on a virtual thread. `StructuredTaskScope` is `asyncio.TaskGroup`, and `ScopedValue` is an immutable `ContextVar` whose lifetime is managed for you. Unlike asyncio tasks, these run on multiple cores too.',
    cpp: 'Stackful coroutines with no `co_await` keyword, managed by the JVM\'s scheduler. Standard blocking calls cooperate without any changes. There\'s no standard C++ equivalent to structured scope cancellation, although `std::execution` targets similar ground.',
    go: 'Virtual threads are goroutines, plus `Semaphore` where you\'d use a buffered channel for limits. `StructuredTaskScope` is `errgroup` with automatic cancellation, built in as a preview. `ScopedValue` passes what `context.Value` passes, but without a parameter. Java has no channels or `select`.',
    ts: 'Instead of `await` at each suspension point, you write straight blocking code. Tasks may truly run in parallel, so shared state needs protecting. `StructuredTaskScope` is what you might wish `Promise.all` did: cancel the rest on failure. `ScopedValue` is `AsyncLocalStorage`.',
  },
}
