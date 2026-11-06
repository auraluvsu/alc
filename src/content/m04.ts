import type { Module } from './types'

export const m04: Module = {
  n: 4,
  title: 'Error Handling',
  tour: '4 · Error Handling',
  summary: 'Exceptions, invariants, and when to use error values instead. C++23\'s std::expected gives you errors as values, with type safety.',
  topics: ['Exceptions', 'Invariants', 'Error-handling alternatives', 'std::expected', 'Assertions'],
  cpp23: [
    '`std::expected<T, E>` (`<expected>`): a value or an error, with monadic `and_then` / `transform` / `or_else`.',
    '`std::optional` gains the same monadic operations.',
    '`std::stacktrace` (`<stacktrace>`) captures the call stack for diagnostics.',
    '`static_assert(false)` in a discarded `if constexpr` branch is now allowed (DR, P2593).',
  ],
  lessons: [
    {
      id: 'exceptions',
      title: 'Exceptions',
      blocks: [
        { kind: 'analogy', text: 'An exception is a fire alarm. The code that discovers the fire doesn\'t know who should handle it. It pulls the alarm, and everyone between there and the nearest fire marshal (a `catch`) evacuates in an orderly way, locking up as they go. Locking up is the destructors running.' },
        { kind: 'code', code: `double& Vector::operator[](int i) {
    if (i < 0 || size() <= i)
        throw std::out_of_range{"Vector::operator[]"};
    return elem[i];
}

void f(Vector& v) {
    try {
        v[v.size()] = 7;                       // out of range
    } catch (const std::out_of_range& err) {   // catch by const reference
        std::println("error: {}", err.what());
    }
}` },
        { kind: 'p', text: 'You catch by **type**, and multiple `catch` clauses are tried in order. You can throw any type, but convention is to throw something derived from `std::exception`. There is no `finally`: cleanup goes in destructors (RAII), which can\'t be forgotten.' },
        { kind: 'p', text: 'Exceptions are the normal mechanism for errors that can\'t be handled locally, not reserved for catastrophes. Throwing is slow compared with returning, though, so never use them for ordinary control flow.' },
        { kind: 'h', text: 'Stack unwinding' },
        { kind: 'stepper', title: 'Step through: unwinding runs destructors', code: [
          'void inner() {',
          '    std::lock_guard lk{m};   // locks m',
          '    throw std::runtime_error{"boom"};',
          '}',
          'void outer() {',
          '    std::vector<int> v(1000);',
          '    inner();',
          '}',
          '// caller: try { outer(); } catch (...) {}',
        ], steps: [
          { line: 6, note: '`outer` allocates a vector.', memory: [{ name: 'v (outer)', value: 'vector, 1000 ints', note: 'buffer on the heap' }, { name: 'heap block', value: '4000 bytes', kind: 'heap' }] },
          { line: 2, note: '`inner` locks a mutex through an RAII guard.', memory: [{ name: 'v (outer)', value: 'vector, 1000 ints' }, { name: 'heap block', value: '4000 bytes', kind: 'heap' }, { name: 'lk (inner)', value: 'holds m: LOCKED' }] },
          { line: 3, note: 'Throw! The runtime searches up the call stack for a matching `catch`.', memory: [{ name: 'v (outer)', value: 'vector, 1000 ints' }, { name: 'heap block', value: '4000 bytes', kind: 'heap' }, { name: 'lk (inner)', value: 'holds m: LOCKED' }] },
          { line: 4, note: 'Leaving `inner`: `lk`\'s destructor runs and **unlocks m**.', memory: [{ name: 'v (outer)', value: 'vector, 1000 ints' }, { name: 'heap block', value: '4000 bytes', kind: 'heap' }, { name: 'lk (inner)', value: 'destroyed, m unlocked', kind: 'dead' }] },
          { line: 8, note: 'Leaving `outer`: `v`\'s destructor frees the heap block. No leaks.', memory: [{ name: 'v (outer)', value: 'destroyed', kind: 'dead' }, { name: 'heap block', value: 'freed', kind: 'dead' }] },
          { line: 9, note: 'The caller\'s `catch` handles it. Everything acquired on the way was released automatically.', memory: [] },
        ] },
        { kind: 'pitfall', text: 'Catch by `const&`, never by value: catching by value slices derived exception types and copies needlessly. Never let an exception escape a destructor. Destructors are implicitly `noexcept`, so it calls `std::terminate`.' },
        { kind: 'check', q: 'An exception is thrown inside a function holding a `std::vector` and a `std::lock_guard`. With no `catch` in that function, what happens to them?', options: ['They leak', 'Their destructors run as the stack unwinds', 'They are freed only if you add `finally`', 'The program terminates immediately'], answer: 1, hint: 'What does the orderly evacuation do on its way out of each room?', explain: 'Stack unwinding destroys every fully-constructed local, which is why RAII makes exception-safe code straightforward.' },
      ],
    },
    {
      id: 'invariants',
      title: 'Invariants & noexcept',
      blocks: [
        { kind: 'analogy', text: 'An invariant is a promise a class keeps at all times between calls, like a bank vault that always balances. The constructor\'s job is to **establish** it. If it can\'t, it shouldn\'t hand you a half-built vault. It throws.' },
        { kind: 'code', code: `Vector::Vector(int s) {
    if (s < 0) throw std::length_error{"Vector: negative size"};
    elem = new double[s];       // may itself throw std::bad_alloc
    sz = s;
}   // either you get a valid Vector, or no Vector at all` },
        { kind: 'p', text: 'This is why C++ prefers exceptions for constructor failure: constructors have no return value to carry an error code, and a "zombie" object that must be checked with `isValid()` is a design smell.' },
        { kind: 'h', text: 'noexcept' },
        { kind: 'code', code: `int size() const noexcept { return sz; }    // promise: never throws
void swap(Vector& a, Vector& b) noexcept;` },
        { kind: 'list', items: [
          '`noexcept` is a promise. If an exception tries to escape anyway, `std::terminate()` is called and there is no unwinding.',
          'It enables optimisations: `std::vector` will only **move** your elements on resize if their move constructor is `noexcept`. Otherwise it copies (module 6).',
          'Mark destructors, move operations, swaps and trivial getters `noexcept`.',
        ] },
        { kind: 'check', q: 'A function marked `noexcept` throws. What happens?', options: ['The exception propagates normally', 'The compiler rejects it', '`std::terminate` is called', 'The exception is silently ignored'], answer: 2, hint: 'Breaking a promise like this is treated as fatal.', explain: 'The compiler can\'t always detect it statically, so at runtime an escaping exception from a `noexcept` function terminates the program.' },
      ],
    },
    {
      id: 'expected',
      title: 'std::expected: errors as values',
      blocks: [
        { kind: 'analogy', text: 'An exception is a fire alarm. `std::expected` is a parcel that arrives either containing what you ordered or containing a note saying why it couldn\'t be sent. You must open it and check. Nothing interrupts your day.' },
        { kind: 'p', text: 'Exceptions are the right tool when errors are rare and handled far away. When failure is **routine** (parsing input, a missing key, a rejected order), the caller should handle it immediately. That is what `std::expected` is for.' },
        { kind: 'compare', python: `# Python's convention is exceptions,
# so failure is raised, not returned:
def parse_price(s: str) -> float:
    if not s:
        raise ValueError("empty")
    return float(s)   # raises on bad input

try:
    p = parse_price(raw)
except ValueError as e:
    ...`, ts: `type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E }

function parsePrice(s: string): Result<number, string> {
  if (!s) return { ok: false, error: "empty" }
  const v = Number(s)
  return isNaN(v)
    ? { ok: false, error: "not a number" }
    : { ok: true, value: v }
}`, java: `// Java uses exceptions; Optional is the
// nearest "value or nothing" type:
Optional<Double> parsePrice(String s) {
    try {
        return Optional.of(Double.parseDouble(s));
    } catch (NumberFormatException e) {
        return Optional.empty();
    }
}`, go: `func parsePrice(s string) (float64, error) {
    v, err := strconv.ParseFloat(s, 64)
    if err != nil {
        return 0, fmt.Errorf("bad price %q", s)
    }
    return v, nil
}

p, err := parsePrice(in)
if err != nil { return err }`, cpp: `enum class ParseErr { Empty, NotNumber };

std::expected<double, ParseErr> parse_price(std::string_view s) {
    if (s.empty()) return std::unexpected(ParseErr::Empty);
    double v{};
    auto [ptr, ec] = std::from_chars(s.data(), s.data() + s.size(), v);
    if (ec != std::errc{}) return std::unexpected(ParseErr::NotNumber);
    return v;
}

auto p = parse_price(in);
if (!p) return std::unexpected(p.error());
double px = *p;      // or p.value(), which throws if empty` },
        { kind: 'new23', text: '`std::expected` is new in C++23 and is the biggest error-handling change since the book. It also has **monadic** operations that chain without `if` ladders, like `Promise.then` for fallible values.' },
        { kind: 'code', code: `auto mid = parse_price(bid_str)
    .and_then([&](double b) {                 // b is the bid; continue if ok
        return parse_price(ask_str)
            .transform([b](double a) { return (a + b) / 2; });
    })
    .transform_error([](ParseErr e) {         // convert error type for the caller
        return std::format("parse failed: {}", std::to_underlying(e));
    });
// mid is std::expected<double, std::string>` },
        { kind: 'list', items: [
          '`.transform(f)`: if it holds a value, apply `f` to it (like `Array.map`).',
          '`.and_then(f)`: `f` itself returns an `expected`, which is flattened (like `flatMap` / `.then`).',
          '`.or_else(f)`: recover from an error.',
          '`.value_or(x)`: unwrap with a fallback.',
          '`std::optional<T>` (module 15) gets the same `transform`/`and_then`/`or_else` in C++23, for "maybe a value, no reason given".',
        ] },
        { kind: 'h', text: 'Choosing a strategy' },
        { kind: 'list', items: [
          '**Exception**: constructors, rare failures, errors handled several layers up, out-of-memory.',
          '**`std::expected`**: expected failures handled by the immediate caller, hot paths where you want no hidden control flow, APIs called from code compiled with `-fno-exceptions` (common in games and HFT).',
          '**`std::optional`**: absence is the only failure mode (lookup miss).',
          '**Terminate**: unrecoverable states, e.g. a broken invariant you can\'t trust anymore.',
        ] },
        { kind: 'check', q: 'You have `std::expected<int, Err> r`. Which expression gives the value or 0 on error?', options: ['`r.value()`', '`*r`', '`r.value_or(0)`', '`r.error_or(0)`'], answer: 2, hint: 'You want a fallback, not an exception and not UB.', explain: '`value()` throws `bad_expected_access` on error, and `*r` on an error is UB. `value_or(0)` is the safe fallback.' },
      ],
    },
    {
      id: 'asserts',
      title: 'Assertions & static_assert',
      blocks: [
        { kind: 'analogy', text: 'A `static_assert` is a building inspector who checks the blueprints before construction starts. A runtime `assert` is a smoke detector installed only during testing. It is removed (with `NDEBUG`) in the release build.' },
        { kind: 'code', code: `static_assert(sizeof(int) >= 4, "int too small for this code");   // compile time
static_assert(std::is_trivially_copyable_v<Tick>);                // no message needed

#include <cassert>
void set_weight(double w) {
    assert(0.0 <= w && w <= 1.0);   // checked in debug builds only
    weight = w;
}` },
        { kind: 'list', items: [
          '`static_assert` checks anything known at compile time: sizes, type properties, `constexpr` results. It costs nothing at runtime.',
          '`assert` checks preconditions while developing. It is compiled out when `NDEBUG` is defined, so never put side effects inside it.',
          'For checks that must stay in production, write an explicit `if` and throw or return an error.',
        ] },
        { kind: 'new23', text: '`std::stacktrace::current()` (`<stacktrace>`) captures a printable call stack. It is handy in a custom assertion handler or when logging an unexpected error. Contracts (`pre`/`post`/`contract_assert`) are coming in C++26, not 23.' },
        { kind: 'check', q: 'Why is `assert(++count < 10);` a bug?', options: ['assert can\'t take expressions', 'In release builds the increment disappears with the assert', 'It throws', '`count` must be `const`'], answer: 1, hint: 'What happens to the whole line when `NDEBUG` is defined?', explain: 'With `NDEBUG`, `assert(...)` expands to nothing, so the side effect vanishes and debug and release behave differently.' },
      ],
    },
  ],
  quiz: [
    { q: 'How should you catch exceptions?', options: ['By value', 'By `const&`', 'By pointer', 'With `catch (...)` only'], answer: 1, explain: 'Catching by const reference avoids slicing and copies.' },
    { q: 'What cleans up resources when an exception propagates?', options: ['`finally` blocks', 'The garbage collector', 'Destructors of local objects during stack unwinding', 'Nothing; you must catch and clean up manually'], answer: 2, explain: 'RAII plus unwinding replaces `finally`.' },
    { q: 'Why mark a move constructor `noexcept`?', options: ['It\'s required to compile', 'So containers like `std::vector` will move rather than copy on reallocation', 'To make it inline', 'It prevents copying'], answer: 1, explain: '`vector` needs the strong exception guarantee, so it only moves when moving can\'t throw.' },
    { q: '`std::expected<T, E>` is most similar to…', options: ['Returning a value or an error that the caller checks (errors as values)', 'A dynamically typed value', 'A checked exception', 'A `std::variant<T>`'], answer: 0, explain: 'A value or an error, checked by the caller, but in one type that can\'t be accidentally ignored.' },
    { q: 'What does `.and_then(f)` on an expected require `f` to return?', options: ['A plain value', 'Another `std::expected` (same error type)', '`void`', 'A `bool`'], answer: 1, explain: '`and_then` chains fallible steps (flatMap). `transform` is for functions that return plain values.' },
    { q: 'What happens to `assert(x > 0)` when `NDEBUG` is defined?', options: ['Becomes a `static_assert`', 'Throws instead of aborting', 'Is removed entirely', 'Logs a warning'], answer: 2, explain: 'Assertions are debug-only checks.' },
    { q: 'A constructor can\'t establish its invariant. Idiomatic C++ response?', options: ['Set an `is_valid` flag', 'Return an error code', 'Throw an exception', 'Call `exit(1)`'], answer: 2, explain: 'Constructors can\'t return values, and a half-built object breaks the invariant everyone relies on. (Alternative: a static factory returning `std::expected`.)' },
    { q: 'Which is evaluated at compile time?', options: ['`assert`', '`static_assert`', '`std::expected`', '`noexcept` violation'], answer: 1, explain: '`static_assert` fails the build if its condition is false.' },
  ],
}
