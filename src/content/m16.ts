import type { Module } from './types'

export const m16: Module = {
  n: 16,
  title: 'Utilities',
  tour: '16 · Utilities',
  summary: 'Time and dates, wrapping and adapting functions, compile-time type functions, source locations, move and forward, bit twiddling, and ending a program cleanly.',
  topics: ['Time (chrono)', 'Function adaptation', 'Type functions', 'source_location', 'move() and forward()', 'Bit manipulation', 'Exiting a program'],
  cpp23: [
    '`std::move_only_function`: a `std::function` that accepts move-only callables.',
    '`std::bind_back`, to go with C++20\'s `bind_front`.',
    '`std::byteswap` for endianness conversion.',
    '`std::forward_like`, `std::to_underlying`, `std::unreachable`.',
  ],
  lessons: [
    {
      id: 'chrono',
      title: 'Time',
      blocks: [
        { kind: 'analogy', text: "`<chrono>` is a ruler with the units printed on it. `250ms` and `2s` are different marks on the same ruler. Adding them just works, and the type system stops you mixing a duration with a point in time, or seconds with plain integers, by accident." },
        { kind: 'code', code: `using namespace std::chrono;
using namespace std::chrono_literals;

auto t0 = steady_clock::now();                     // for measuring intervals
run_backtest();
auto elapsed = steady_clock::now() - t0;
std::println("took {}", duration_cast<milliseconds>(elapsed));   // e.g. "took 842ms"

auto timeout = 1500ms + 2s;                        // 3500ms, typed
std::this_thread::sleep_for(timeout);

auto now = system_clock::now();                    // wall-clock time
std::println("{:%Y-%m-%d %H:%M}", now);
year_month_day d = 2024y / November / 5d;           // calendar dates (C++20)
auto weekday = std::chrono::weekday{sys_days{d}};
auto london = zoned_time{"Europe/London", now};     // time zones (C++20)` },
        { kind: 'list', items: [
          '**`steady_clock`** never goes backwards. Use it for timing and timeouts.',
          '**`system_clock`** is wall-clock time and can jump (NTP, DST). Use it for timestamps.',
          'Durations carry their unit in the type. `duration_cast` converts with truncation; conversions that lose nothing are implicit.',
        ] },
        { kind: 'pitfall', text: "Benchmarking with `system_clock` can give negative durations if the clock is adjusted mid-run. Use `steady_clock`, and for micro-benchmarks use a proper library such as Google Benchmark, which handles warm-up and optimiser effects." },
        { kind: 'check', q: 'Which clock should time a function call?', options: ['`system_clock`', '`steady_clock`', '`file_clock`', 'Any of them'], answer: 1, hint: 'You need a clock that can\'t jump.', explain: '`steady_clock` is monotonic; `system_clock` follows the wall clock, which can be adjusted.' },
      ],
    },
    {
      id: 'functions',
      title: 'Function adaptation',
      blocks: [
        { kind: 'analogy', text: "Sometimes you have a tool with the wrong handle for the job. A lambda is a custom adapter you whittle on the spot. `bind_front` pre-fills the first few inputs. `std::function` is a universal socket that accepts any callable with the right signature, at the cost of a little indirection." },
        { kind: 'code', code: `double fee(double rate, double notional) { return rate * notional; }

auto retail = std::bind_front(fee, 0.001);       // pre-fill the first argument
retail(10'000);                                   // 10.0
auto same   = [](double n) { return fee(0.001, n); };   // the lambda equivalent

std::function<double(double)> f = retail;        // type-erased: holds any matching callable
f = [](double n) { return n * 0.002; };
f = &some_free_function;

std::vector<std::function<void()>> on_close;      // a list of callbacks
on_close.push_back([&] { flush_logs(); });` },
        { kind: 'list', items: [
          '`std::function` **copies** its callable and may heap-allocate. Calling it is an indirect call, so prefer a template parameter (`auto&& f`) in hot paths.',
          '`std::invoke(f, args...)` calls anything callable uniformly, including member function pointers.',
          '`std::mem_fn(&Order::cancel)` turns a member function into a free-function-style callable.',
        ] },
        { kind: 'new23', text: "`std::move_only_function<void()>` accepts callables that can't be copied, such as a lambda that owns a `unique_ptr`. It is ideal for task queues. It also respects `const` and `noexcept` in its signature." },
        { kind: 'code', code: `auto job = std::make_unique<Job>();
// std::function<void()> f = [j = std::move(job)] { j->run(); };      // error: lambda not copyable
std::move_only_function<void()> task = [j = std::move(job)] { j->run(); };   // OK` },
        { kind: 'check', q: 'Why can\'t a lambda capturing a `unique_ptr` be stored in `std::function`?', options: ['Lambdas can\'t capture unique_ptr', '`std::function` requires a copyable callable', '`unique_ptr` is not callable', 'It can'], answer: 1, hint: 'What does copying the lambda require of its captures?', explain: 'Copying the lambda would copy the `unique_ptr`, which is impossible. `move_only_function` (C++23) solves this.' },
      ],
    },
    {
      id: 'types',
      title: 'Type functions & source_location',
      blocks: [
        { kind: 'analogy', text: "Type functions are questions you ask the compiler about types, answered before the program exists: \"is this an integer?\", \"what is this with `const` stripped off?\". Think of them as `if` and functions for the type system." },
        { kind: 'code', code: `static_assert(std::is_integral_v<int>);
static_assert(std::is_same_v<std::remove_cvref_t<const int&>, int>);
static_assert(std::is_trivially_copyable_v<Tick>);         // safe to memcpy into a buffer

template<typename T>
using Elem = std::ranges::range_value_t<T>;                 // element type of any range

std::numeric_limits<double>::epsilon();                      // traits about numeric types
std::iterator_traits<int*>::value_type;                      // int` },
        { kind: 'list', items: [
          '**Predicates** end in `_v` (bool values): `is_integral_v`, `is_same_v`, `is_base_of_v`.',
          '**Transformations** end in `_t` (types): `remove_cvref_t`, `decay_t`, `common_type_t`, `make_unsigned_t`.',
          'In new code, prefer **concepts** (`std::integral T`) for constraints and use traits inside `if constexpr` and `static_assert`.',
        ] },
        { kind: 'h', text: 'source_location' },
        { kind: 'code', code: `void log(std::string_view msg,
         std::source_location loc = std::source_location::current()) {   // filled at the CALL site
    std::println("{}:{} [{}] {}", loc.file_name(), loc.line(), loc.function_name(), msg);
}
log("order rejected");   // main.cpp:42 [void submit()] order rejected` },
        { kind: 'p', text: '`std::source_location` replaces the `__FILE__` / `__LINE__` macros. Because it is a default argument, it captures the **caller\'s** position, which is exactly what a logging or assertion helper needs.' },
        { kind: 'check', q: 'What is `std::remove_cvref_t<const std::string&>`?', options: ['`const std::string`', '`std::string&`', '`std::string`', '`const std::string&`'], answer: 2, hint: 'cv = const/volatile, ref = reference. Remove both.', explain: 'It strips the reference and the `const`, leaving the plain type.' },
      ],
    },
    {
      id: 'move',
      title: 'move() and forward()',
      blocks: [
        { kind: 'analogy', text: "`std::move` is a sticker that says \"you may take my contents\". It doesn't move anything itself. `std::forward` is a courier who passes a parcel on in exactly the condition it arrived: a sticker stays on if it came with one, and stays off if it didn't." },
        { kind: 'code', code: `// std::move: an unconditional cast to an rvalue
std::string a = "big text";
std::string b = std::move(a);          // b steals a's buffer; a is valid but unspecified

// std::forward: a conditional cast, used with "forwarding references" (T&& in a template)
template<typename T>
void store(T&& x) {                    // T&& here binds to lvalues AND rvalues
    items.push_back(std::forward<T>(x));   // copy if caller passed an lvalue, move if an rvalue
}
std::string s = "keep me";
store(s);                // lvalue: copied, s untouched
store(std::string{"tmp"});   // rvalue: moved
store(std::move(s));     // caller opted in: moved` },
        { kind: 'list', items: [
          '`T&&` is a **forwarding reference** only when `T` is deduced (a template parameter or `auto&&`). `std::string&&` is a plain rvalue reference.',
          'Use `std::move` when you are done with a named object. Use `std::forward<T>` only on a forwarding reference, exactly once.',
          'Never use an object after moving from it, except to assign it a new value or destroy it.',
        ] },
        { kind: 'new23', text: "`std::forward_like<Self>(member)` forwards a member with the value category of its enclosing object. It pairs naturally with deducing `this`: `return std::forward_like<Self>(self.data);`." },
        { kind: 'check', q: 'Inside `template<class T> void f(T&& x)`, called as `f(s)` with an lvalue `std::string s`, what is `T`?', options: ['`std::string`', '`std::string&`', '`std::string&&`', '`const std::string`'], answer: 1, hint: 'Forwarding references use a special deduction rule for lvalues.', explain: 'For an lvalue argument, `T` deduces to `std::string&`, and `T&&` collapses to `std::string&`. That is how `std::forward<T>` knows to copy rather than move.' },
      ],
    },
    {
      id: 'bits',
      title: 'Bits & exiting',
      blocks: [
        { kind: 'analogy', text: "`<bit>` is the electronics bench: count the lit LEDs, rotate a register, flip the byte order of a message from another machine. These are single CPU instructions, now wrapped in safe, portable functions." },
        { kind: 'code', code: `std::uint32_t x = 0b1011'0000;
std::popcount(x);            // 3: bits set
std::countr_zero(x);         // 4: trailing zeros
std::bit_width(x);           // 8: bits needed to represent x
std::has_single_bit(64u);    // true: power of two
std::rotl(x, 4);             // rotate left
std::byteswap(0x12345678u);  // 0x78563412 (C++23): endianness conversion
if constexpr (std::endian::native == std::endian::little) {}

double d = 1.5;
auto bits = std::bit_cast<std::uint64_t>(d);   // reinterpret bytes safely (no UB)` },
        { kind: 'p', text: '`std::bit_cast` is the legal way to view one type\'s bytes as another, replacing `reinterpret_cast` and `union` tricks, which are UB. It is common when decoding binary market-data feeds alongside `byteswap`.' },
        { kind: 'h', text: 'Exiting a program' },
        { kind: 'list', items: [
          '**`return` from `main`**: the normal way. Local and static objects are destroyed properly.',
          '**`std::exit(code)`**: static objects are destroyed and `atexit` handlers run, but **locals are not destroyed** (no stack unwinding).',
          '**`std::quick_exit(code)`**: runs `at_quick_exit` handlers only, with no destructors.',
          '**`std::abort()`**: immediate abnormal termination, with no cleanup at all.',
          '**`std::terminate()`**: called on unhandled exceptions or `noexcept` violations, and calls `abort` by default.',
        ] },
        { kind: 'check', q: 'You call `std::exit(1)` from deep inside a function that holds an `std::ofstream`. Is the file flushed by its destructor?', options: ['Yes, always', 'No: `exit` doesn\'t unwind the stack, so local destructors don\'t run', 'Only on Linux', 'Only if it is static'], answer: 1, hint: 'Which objects does `exit` clean up?', explain: '`exit` destroys statics, not locals. Prefer throwing to `main` or returning an error so RAII can do its job.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is the type of `250ms + 2s`?', options: ['`int`', 'A `std::chrono::duration` in milliseconds', '`double` seconds', 'Compile error'], answer: 1, explain: 'The result uses the finer common unit: 2250ms.' },
    { q: 'What does `std::bind_front(f, a)` produce?', options: ['The result of `f(a)`', 'A callable equivalent to `[&](auto... xs) { return f(a, xs...); }` (holding a copy of `a`)', 'A `std::function`', 'A thread'], answer: 1, explain: 'It is partial application of the leading arguments.' },
    { q: 'Main cost of `std::function`?', options: ['None', 'Type erasure: an indirect call and possible heap allocation', 'It is not thread-safe', 'It can\'t hold lambdas'], answer: 1, explain: 'Prefer templates or `auto` parameters in hot code.' },
    { q: 'Which traits suffix gives a bool value?', options: ['`_t`', '`_v`', '`_b`', '`_type`'], answer: 1, explain: '`_v` for values, `_t` for types.' },
    { q: 'Why does `std::source_location::current()` work as a default argument?', options: ['It is a macro', 'Default arguments are evaluated at the call site', 'It reads the stack at runtime', 'It doesn\'t'], answer: 1, explain: 'So it records the caller\'s file and line.' },
    { q: 'When is `T&&` a forwarding reference?', options: ['Always', 'When `T` is a deduced template parameter', 'Only in constructors', 'Never in C++23'], answer: 1, explain: 'Otherwise it is an ordinary rvalue reference.' },
    { q: 'What is the safe way to get the raw bits of a `double`?', options: ['`reinterpret_cast<uint64_t&>(d)`', 'Through a union', '`std::bit_cast<std::uint64_t>(d)`', '`(uint64_t)d`'], answer: 2, explain: 'The first two are UB (strict aliasing and inactive union member); the C-style cast converts the value.' },
    { q: 'Which way of exiting runs local destructors?', options: ['`std::exit`', '`std::abort`', 'Returning from `main` (or throwing up to it)', '`std::quick_exit`'], answer: 2, explain: 'Only normal returns and unwinding destroy locals.' },
  ],
}
