import type { DictEntry } from './types'

export const DICT: DictEntry[] = [
  // ---------- Basics ----------
  { term: 'import std;', cat: 'Basics', module: 1, since: 'C++23', desc: 'Imports the entire standard library as one module. Use `#include <header>` if your toolchain lacks support.', syntax: `import std;
int main() { std::println("hi"); }` },
  { term: 'std::println', cat: 'Basics', module: 1, since: 'C++23', desc: 'Formatted print with a trailing newline. `{}` placeholders use `std::format` syntax.', syntax: `std::println("{} has {:.2f}", name, price);
std::print(stderr, "warn: {}\\n", msg);` },
  { term: 'auto', cat: 'Basics', module: 1, desc: 'Deduce a variable\'s type from its initialiser. Add `&` / `const&` to avoid copies.', syntax: `auto x = 1.5;          // double
const auto& v = big;   // no copy
for (auto& e : vec) e *= 2;` },
  { term: '{} initialisation', cat: 'Basics', module: 1, desc: 'Uniform initialisation that rejects narrowing conversions. Prefer it.', syntax: `int a {7};
std::vector<int> v {1, 2, 3};
// int b {7.5};   // error: narrowing` },
  { term: 'const', cat: 'Basics', module: 1, desc: 'Read-only after initialisation. On a member function: does not modify the object.', syntax: `const double rate = load();
int size() const;
void f(const Big& b);` },
  { term: 'constexpr / consteval', cat: 'Basics', module: 1, desc: '`constexpr`: may be evaluated at compile time (variables must be). `consteval`: must be evaluated at compile time.', syntax: `constexpr int sq(int x) { return x * x; }
constexpr int N = sq(8);
consteval int kib(int n) { return n * 1024; }` },
  { term: 'if consteval', cat: 'Basics', module: 1, since: 'C++23', desc: 'Branch on whether the current evaluation is at compile time.', syntax: `constexpr double f(double x) {
    if consteval { return slow_portable(x); }
    else         { return fast_intrinsic(x); }
}` },
  { term: 'Pointer T*', cat: 'Basics', module: 1, desc: 'Holds an address. Nullable and reseatable. `&x` takes an address, `*p` dereferences, `p->m` accesses a member.', syntax: `int x = 1;
int* p = &x;
*p = 2;
p = nullptr;
if (p) { /* ... */ }` },
  { term: 'Reference T&', cat: 'Basics', module: 1, desc: 'An alias. Must be initialised and can\'t be reseated or null. Main use: parameters.', syntax: `int& r = x;   // r is x
void bump(int& n) { ++n; }
void read(const std::string& s);` },
  { term: 'nullptr', cat: 'Basics', module: 1, desc: 'The null pointer literal. Never use `0` or `NULL` for pointers.', syntax: `Node* next = nullptr;
if (next == nullptr) { /* end */ }` },
  { term: 'Range-for', cat: 'Basics', module: 1, desc: 'Iterate any range (container, view, array).', syntax: `for (const auto& t : trades) total += t.qty;
for (auto [k, v] : my_map) std::println("{}={}", k, v);` },
  { term: 'Fixed-width integers', cat: 'Basics', module: 1, desc: 'Exact-size integer types from `<cstdint>`. Use when layout or overflow matters.', syntax: `std::int64_t ts;
std::uint8_t flags;
std::size_t n = 10uz;   // C++23 uz suffix` },
  { term: 'Undefined behaviour (UB)', cat: 'Basics', module: 1, desc: 'Operations the standard gives no meaning to: null deref, out-of-bounds, signed overflow, use-after-free, reading uninitialised values. Compile with sanitizers to catch them.', syntax: `// g++ -std=c++23 -g -fsanitize=address,undefined main.cpp
int a[3]; a[3] = 1;   // UB` },

  // ---------- Types ----------
  { term: 'struct', cat: 'Types', module: 2, desc: 'A type with public-by-default members. Use for plain data.', syntax: `struct Tick {
    std::string sym;
    double px = 0;
};
Tick t {.sym = "XAU", .px = 2390.5};` },
  { term: 'class', cat: 'Types', module: 2, desc: 'A type with private-by-default members. Use when an invariant must be protected.', syntax: `class Account {
public:
    explicit Account(double b) : bal{b} {}
    double balance() const { return bal; }
private:
    double bal;
};` },
  { term: 'Member initialiser list', cat: 'Types', module: 2, desc: 'Construct members before the constructor body runs. Members are initialised in declaration order.', syntax: `Vector(int s) : elem{new double[s]}, sz{s} {}` },
  { term: 'explicit', cat: 'Types', module: 2, desc: 'Prevents a constructor or conversion operator being used implicitly.', syntax: `explicit Vector(int size);
// Vector v = 10;   // error
Vector v(10);       // ok` },
  { term: 'enum class', cat: 'Types', module: 2, desc: 'Scoped, strongly-typed enumeration. No implicit int conversion.', syntax: `enum class Side : std::uint8_t { Buy, Sell };
Side s = Side::Buy;
auto i = std::to_underlying(s);   // C++23` },
  { term: 'std::variant', cat: 'Types', module: 2, desc: 'Type-safe tagged union: holds exactly one of a fixed set of types. Visit with `std::visit`.', syntax: `std::variant<int, std::string> v = "hi";
std::visit(overloaded{
    [](int i)                { /* ... */ },
    [](const std::string& s) { /* ... */ },
}, v);
if (auto* s = std::get_if<std::string>(&v)) {}` },
  { term: 'union', cat: 'Types', module: 2, desc: 'Members share storage and the active one isn\'t tracked. Avoid; prefer `std::variant`.', syntax: `union U { int i; float f; };` },
  { term: 'Deducing this', cat: 'Types', module: 6, since: 'C++23', desc: 'Explicit object parameter: write one member function for const, non-const and rvalue objects.', syntax: `struct S {
    template<class Self>
    auto&& get(this Self&& self) {
        return std::forward<Self>(self).value;
    }
    int value;
};` },

  // ---------- Functions & modularity ----------
  { term: '#include / #pragma once', cat: 'Modularity', module: 3, desc: 'Textual inclusion of a header; `#pragma once` stops double inclusion in one translation unit.', syntax: `// thing.h
#pragma once
int helper(int);

// thing.cpp
#include "thing.h"` },
  { term: 'Modules', cat: 'Modularity', module: 3, desc: 'Compiled-once units with explicit `export`. No macro leakage.', syntax: `// math.cppm
export module math;
export double sq(double x) { return x * x; }

// main.cpp
import math;` },
  { term: 'namespace', cat: 'Modularity', module: 3, desc: 'Groups names to avoid clashes. Aliases shorten long names.', syntax: `namespace quant::risk { double var(); }
namespace qr = quant::risk;
using std::println;` },
  { term: 'Parameter passing', cat: 'Functions', module: 3, desc: 'Small: by value. Big read-only: `const&`. Modify: `&`. Sink/take ownership: by value + `std::move`.', syntax: `void f(int x, const Big& b, Out& o, std::string sink);` },
  { term: 'Structured bindings', cat: 'Functions', module: 3, desc: 'Unpack structs, pairs, tuples and arrays into named variables.', syntax: `auto [lo, hi] = min_max(xs);
auto [it, ok] = m.insert({"k", 1});
for (const auto& [k, v] : m) {}` },
  { term: 'Lambda', cat: 'Functions', module: 7, desc: 'Anonymous function object. `[...]` lists captures: `[=]` by copy, `[&]` by reference, `[x, &y]` explicit.', syntax: `auto add = [](int a, int b) { return a + b; };
int k = 3;
auto scale = [k](double x) { return x * k; };
std::ranges::sort(v, [](auto& a, auto& b) { return a.px < b.px; });` },
  { term: 'Default arguments & overloading', cat: 'Functions', module: 3, desc: 'Same name, different parameter types. Resolved at compile time.', syntax: `void log(std::string_view m, int lvl = 1);
void show(int);
void show(double);` },

  // ---------- Errors ----------
  { term: 'try / throw / catch', cat: 'Errors', module: 4, desc: 'Exceptions. Throw by value, catch by `const&`. Destructors run during unwinding.', syntax: `try {
    if (bad) throw std::runtime_error{"bad input"};
} catch (const std::exception& e) {
    std::println(stderr, "{}", e.what());
}` },
  { term: 'noexcept', cat: 'Errors', module: 4, desc: 'Promise not to throw. Violations call `std::terminate`. Required for vector to use your moves.', syntax: `void swap(T& a, T& b) noexcept;
T(T&&) noexcept;` },
  { term: 'std::expected', cat: 'Errors', module: 4, since: 'C++23', desc: 'Holds a value or an error (errors as values). Chain with `and_then`, `transform`, `or_else`.', syntax: `std::expected<int, std::string> parse(std::string_view s);

auto r = parse(in);
if (!r) return std::unexpected(r.error());
int v = *r;
auto d = parse(in).transform([](int x) { return x * 2; });` },
  { term: 'static_assert / assert', cat: 'Errors', module: 4, desc: '`static_assert`: compile-time check. `assert`: debug-only runtime check (removed by `NDEBUG`).', syntax: `static_assert(sizeof(void*) == 8);
assert(idx < v.size());` },
  { term: 'std::stacktrace', cat: 'Errors', module: 4, since: 'C++23', desc: 'Capture and print the current call stack.', syntax: `#include <stacktrace>
std::println("{}", std::stacktrace::current());` },

  // ---------- Classes ----------
  { term: 'Destructor', cat: 'Classes', module: 5, desc: '`~T()` runs when the object\'s lifetime ends. Release resources here (RAII).', syntax: `class File {
    std::FILE* f;
public:
    explicit File(const char* p) : f{std::fopen(p, "r")} {}
    ~File() { if (f) std::fclose(f); }
};` },
  { term: 'RAII', cat: 'Classes', module: 5, desc: 'Resource Acquisition Is Initialisation: tie a resource to an object\'s lifetime so cleanup is automatic and exception-safe.', syntax: `{
    std::lock_guard lk{mtx};    // locked
    std::ofstream out{"log.txt"};
}   // unlocked & closed here` },
  { term: 'virtual / override / final', cat: 'Classes', module: 5, desc: 'Run-time polymorphism. `override` checks the signature; `final` forbids further overriding.', syntax: `struct Shape {
    virtual double area() const = 0;
    virtual ~Shape() = default;
};
struct Sq final : Shape {
    double s;
    double area() const override { return s * s; }
};` },
  { term: 'Pure virtual (= 0)', cat: 'Classes', module: 5, desc: 'Declares an interface function with no implementation, making the class abstract.', syntax: `virtual void draw() const = 0;` },
  { term: 'Virtual destructor', cat: 'Classes', module: 5, desc: 'Required on any base class deleted through a base pointer.', syntax: `virtual ~Base() = default;` },
  { term: 'dynamic_cast', cat: 'Classes', module: 5, desc: 'Checked down-cast in a hierarchy. Pointer form returns nullptr on failure; reference form throws `bad_cast`.', syntax: `if (auto* c = dynamic_cast<Circle*>(shape)) c->radius();` },
  { term: 'static_cast & friends', cat: 'Classes', module: 5, desc: '`static_cast`: checked conversions. `const_cast`: remove const. `reinterpret_cast`: raw bit reinterpretation. Avoid C-style `(T)x`.', syntax: `double d = static_cast<double>(n) / 3;
auto bits = std::bit_cast<std::uint64_t>(d);   // prefer over reinterpret_cast` },

  // ---------- Essential operations ----------
  { term: 'Copy constructor / assignment', cat: 'Operations', module: 6, desc: 'Make an independent duplicate. Needed when you manage a raw resource.', syntax: `T(const T& other);
T& operator=(const T& other);` },
  { term: 'Move constructor / assignment', cat: 'Operations', module: 6, desc: 'Steal resources from an rvalue, leaving it valid but unspecified. Mark `noexcept`.', syntax: `T(T&& other) noexcept : p{std::exchange(other.p, nullptr)} {}
T& operator=(T&& other) noexcept;` },
  { term: 'Rule of zero / five', cat: 'Operations', module: 6, desc: 'Zero: let members manage themselves and write nothing. Five: if you write one of dtor/copy/move ops, write (or `= default`/`= delete`) all five.', syntax: `struct Good { std::string s; std::vector<int> v; };   // zero
Noncopyable(const Noncopyable&) = delete;` },
  { term: 'std::move', cat: 'Operations', module: 16, desc: 'Casts to an rvalue so a move operation can be chosen. Doesn\'t move by itself.', syntax: `v.push_back(std::move(s));    // s now valid but unspecified
auto b = std::move(a);` },
  { term: 'std::forward', cat: 'Operations', module: 16, desc: 'Perfect forwarding: pass an argument on, preserving whether it was an lvalue or rvalue.', syntax: `template<class... Args>
auto make(Args&&... args) {
    return T(std::forward<Args>(args)...);
}` },
  { term: 'operator<=>', cat: 'Operations', module: 6, desc: 'Three-way comparison. `= default` generates all six comparison operators memberwise.', syntax: `struct Ver {
    int major, minor;
    auto operator<=>(const Ver&) const = default;
};` },
  { term: 'Operator overloading', cat: 'Operations', module: 6, desc: 'Give your types natural syntax. Implement `+` via `+=`; keep conventional meanings.', syntax: `Money& operator+=(Money o);
friend Money operator+(Money a, Money b) { return a += b; }
double& operator[](std::size_t i, std::size_t j);   // C++23 multi-index` },
  { term: 'User-defined literal', cat: 'Operations', module: 6, desc: 'Custom literal suffixes (must start with `_`). Standard ones: `s`, `sv`, `ms`, `h`, etc.', syntax: `constexpr Km operator""_km(long double v) { return Km{double(v)}; }
using namespace std::literals;
auto s = "abc"s; auto t = 5ms;` },

  // ---------- Templates & concepts ----------
  { term: 'Class template', cat: 'Templates', module: 7, desc: 'A type parameterised by types or values. Generated per argument set at compile time.', syntax: `template<typename T>
class Stack {
    std::vector<T> items;
public:
    void push(T x) { items.push_back(std::move(x)); }
};
Stack<int> s;` },
  { term: 'Function template', cat: 'Templates', module: 7, desc: 'A function generic over its parameter types. Arguments are usually deduced.', syntax: `template<typename T>
T max_of(const std::vector<T>& v);
auto f(auto x) { return x * 2; }   // abbreviated template` },
  { term: 'if constexpr', cat: 'Templates', module: 7, desc: 'Compile-time branch. The discarded branch isn\'t instantiated.', syntax: `if constexpr (std::is_integral_v<T>) { /* int path */ }
else { /* other */ }` },
  { term: 'concept / requires', cat: 'Templates', module: 8, desc: 'Named compile-time constraints on template arguments: structural checks evaluated at compile time.', syntax: `template<typename T>
concept Priced = requires(T t) { { t.price() } -> std::convertible_to<double>; };

template<Priced T> double value(const T& x) { return x.price(); }` },
  { term: 'Variadic template & fold', cat: 'Templates', module: 8, desc: 'Templates taking any number of arguments. Fold expressions apply an operator across the pack.', syntax: `template<typename... Ts>
auto sum(Ts... xs) { return (xs + ...); }
sum(1, 2, 3.5);   // 6.5` },
  { term: 'Type traits', cat: 'Templates', module: 16, desc: 'Compile-time queries and transforms on types from `<type_traits>`.', syntax: `std::is_integral_v<T>
std::remove_cvref_t<T>
std::is_trivially_copyable_v<T>` },

  // ---------- Strings ----------
  { term: 'std::string', cat: 'Strings', module: 10, desc: 'Owning, mutable, contiguous char sequence. Small strings live inline (SSO).', syntax: `std::string s = "gold";
s += "/usd";
if (s.contains("usd")) {}   // C++23
auto sub = s.substr(0, 4);` },
  { term: 'std::string_view', cat: 'Strings', module: 10, desc: 'Non-owning (pointer, length) view of characters. Ideal read-only parameter; never let it outlive the data.', syntax: `void parse(std::string_view line);
std::string_view sv = s;
sv.remove_prefix(2);` },
  { term: 'std::regex', cat: 'Strings', module: 10, desc: 'ECMAScript-flavoured regular expressions. Correct but slow, so avoid in hot paths.', syntax: `std::regex pat{R"((\\w+)=(\\d+))"};
std::smatch m;
if (std::regex_search(s, m, pat)) std::println("{}", m[1].str());` },
  { term: 'std::format', cat: 'Strings', module: 11, desc: 'Type-safe formatting into a `std::string` with `{}` placeholders.', syntax: `auto msg = std::format("{:>8.2f} | {:#x}", px, flags);` },
  { term: 'std::from_chars / to_chars', cat: 'Strings', module: 10, desc: 'Fastest locale-free number parsing/printing. No allocation, no exceptions.', syntax: `int v{};
auto [p, ec] = std::from_chars(s.data(), s.data() + s.size(), v);
if (ec == std::errc{}) { /* ok */ }` },

  // ---------- I/O ----------
  { term: 'std::ifstream / ofstream', cat: 'I/O', module: 11, desc: 'File streams. RAII: closed automatically.', syntax: `std::ifstream in{"prices.csv"};
for (std::string line; std::getline(in, line);) { /* ... */ }
std::ofstream out{"out.txt"};
out << "done\\n";` },
  { term: 'std::filesystem', cat: 'I/O', module: 11, desc: 'Paths, directory iteration, file metadata.', syntax: `namespace fs = std::filesystem;
for (const auto& e : fs::directory_iterator{"data"})
    if (e.path().extension() == ".csv") std::println("{}", e.path().string());` },
  { term: 'std::formatter<T>', cat: 'I/O', module: 11, desc: 'Make your type printable with `std::format`/`println`.', syntax: `template<> struct std::formatter<Money> : std::formatter<double> {
    auto format(Money m, auto& ctx) const {
        return std::formatter<double>::format(m.pence / 100.0, ctx);
    }
};` },

  // ---------- Containers ----------
  { term: 'std::vector', cat: 'Containers', module: 12, desc: 'Contiguous, growable array. The default container: use it unless you have a reason not to.', syntax: `std::vector<double> v;
v.reserve(1000);
v.push_back(1.0);
v.emplace_back(2.0);
v.append_range(other);   // C++23` },
  { term: 'std::array', cat: 'Containers', module: 15, desc: 'Fixed-size array that knows its size and copies properly. Lives on the stack.', syntax: `std::array<int, 4> a {1, 2, 3, 4};
a.size();   // 4` },
  { term: 'std::map', cat: 'Containers', module: 12, desc: 'Ordered key→value (balanced tree). O(log n). Iterates in key order.', syntax: `std::map<std::string, int> m;
m["a"] = 1;
if (auto it = m.find("a"); it != m.end()) {}
if (m.contains("a")) {}` },
  { term: 'std::unordered_map', cat: 'Containers', module: 12, desc: 'Hash map. Average O(1). Needs `std::hash<Key>`. No ordering.', syntax: `std::unordered_map<std::string, double> px;
px.try_emplace("XAU", 2390.5);` },
  { term: 'std::flat_map', cat: 'Containers', module: 12, since: 'C++23', desc: 'Map interface over sorted vectors. Faster lookups and iteration than `std::map` for read-heavy data.', syntax: `#include <flat_map>
std::flat_map<int, double> levels;
levels[100] = 1.5;` },
  { term: 'std::list / forward_list', cat: 'Containers', module: 12, desc: 'Doubly/singly linked lists. Rarely the fastest choice; use when you need stable iterators and splicing.', syntax: `std::list<int> l {1, 2, 3};
l.splice(l.begin(), other);` },
  { term: 'std::span', cat: 'Containers', module: 15, desc: 'Non-owning view of contiguous elements (pointer + size). Replaces `(T* p, size_t n)` parameters.', syntax: `double mean(std::span<const double> xs);
mean(vec); mean(arr);` },
  { term: 'std::mdspan', cat: 'Containers', module: 15, since: 'C++23', desc: 'Multidimensional non-owning view, with `m[i, j]` indexing.', syntax: `std::vector<double> buf(rows * cols);
std::mdspan m{buf.data(), rows, cols};
m[1, 2] = 3.0;` },

  // ---------- Algorithms & ranges ----------
  { term: 'Iterators', cat: 'Algorithms', module: 13, desc: 'Generalised pointers marking positions in a sequence. `begin()` to `end()` is half-open.', syntax: `for (auto it = v.begin(); it != v.end(); ++it) *it += 1;
auto it = std::ranges::find(v, 42);
if (it != v.end()) {}` },
  { term: 'std::ranges::sort / find_if', cat: 'Algorithms', module: 13, desc: 'Range-based algorithms: pass the container, not an iterator pair. Projections pick the key.', syntax: `std::ranges::sort(trades, {}, &Trade::px);      // sort by px
auto it = std::ranges::find_if(v, [](int x) { return x < 0; });` },
  { term: 'std::ranges::fold_left', cat: 'Algorithms', module: 13, since: 'C++23', desc: 'Left fold (reduce) over a range.', syntax: `auto total = std::ranges::fold_left(v, 0.0, std::plus{});` },
  { term: 'Parallel algorithms', cat: 'Algorithms', module: 13, desc: 'Pass an execution policy to run supported algorithms in parallel or vectorised.', syntax: `std::sort(std::execution::par, v.begin(), v.end());
std::reduce(std::execution::par_unseq, v.begin(), v.end());` },
  { term: 'Views & pipelines', cat: 'Ranges', module: 14, desc: 'Lazy, composable range adaptors chained with `|`.', syntax: `auto evens = v | std::views::filter([](int x) { return x % 2 == 0; })
               | std::views::transform([](int x) { return x * x; })
               | std::views::take(5);` },
  { term: 'std::ranges::to', cat: 'Ranges', module: 14, since: 'C++23', desc: 'Materialise a view into a container.', syntax: `auto sq = v | std::views::transform(f) | std::ranges::to<std::vector>();` },
  { term: 'views::zip / enumerate', cat: 'Ranges', module: 14, since: 'C++23', desc: 'Iterate several ranges in lockstep, or with an index.', syntax: `for (auto [i, x] : std::views::enumerate(v)) {}
for (auto [a, b] : std::views::zip(xs, ys)) {}` },
  { term: 'views::chunk / slide / stride', cat: 'Ranges', module: 14, since: 'C++23', desc: 'Fixed-size chunks, sliding windows (great for rolling stats), every n-th element.', syntax: `for (auto w : prices | std::views::slide(20)) { /* 20-bar window */ }
for (auto c : v | std::views::chunk(3)) {}` },
  { term: 'std::generator', cat: 'Ranges', module: 14, since: 'C++23', desc: 'Coroutine that lazily yields values, usable as a range.', syntax: `std::generator<int> fib() {
    int a = 0, b = 1;
    while (true) { co_yield a; a = std::exchange(b, a + b); }
}
for (int x : fib() | std::views::take(10)) {}` },

  // ---------- Memory ----------
  { term: 'std::unique_ptr', cat: 'Memory', module: 15, desc: 'Sole owner of a heap object; freed automatically. Movable, not copyable. Zero overhead.', syntax: `auto p = std::make_unique<Circle>(Point{}, 5);
std::unique_ptr<Shape> s = std::move(p);
s->draw();` },
  { term: 'std::shared_ptr', cat: 'Memory', module: 15, desc: 'Reference-counted shared ownership. Freed when the last owner goes. Costs an atomic refcount.', syntax: `auto cfg = std::make_shared<Config>();
auto copy = cfg;          // count = 2
cfg.use_count();` },
  { term: 'std::weak_ptr', cat: 'Memory', module: 15, desc: 'Non-owning observer of a `shared_ptr`. Breaks reference cycles. `lock()` to use.', syntax: `std::weak_ptr<Node> parent;
if (auto p = parent.lock()) p->visit();` },
  { term: 'new / delete', cat: 'Memory', module: 5, desc: 'Raw heap allocation. Avoid in application code: use containers and smart pointers.', syntax: `int* p = new int{5};
delete p;
double* a = new double[n];
delete[] a;   // [] must match` },
  { term: 'std::optional', cat: 'Memory', module: 15, desc: 'Maybe a value. C++23 adds monadic `and_then`, `transform`, `or_else`.', syntax: `std::optional<double> last_price(std::string_view sym);
auto p = last_price("XAU").transform([](double x) { return x * 1.01; }).value_or(0);` },
  { term: 'std::any', cat: 'Memory', module: 15, desc: 'Holds a value of any copyable type. Rarely the right tool; prefer `variant`.', syntax: `std::any a = 42;
int i = std::any_cast<int>(a);` },
  { term: 'std::pair / std::tuple', cat: 'Memory', module: 15, desc: 'Ad-hoc groupings of values. Prefer a named struct when fields have meaning.', syntax: `std::pair<std::string, int> p {"a", 1};
auto t = std::tuple{1, 2.0, "x"};
auto [a, b, c] = t;` },

  // ---------- Utilities ----------
  { term: 'std::chrono', cat: 'Utilities', module: 16, desc: 'Type-safe durations, clocks and calendar dates.', syntax: `using namespace std::chrono;
auto t0 = steady_clock::now();
work();
auto ms = duration_cast<milliseconds>(steady_clock::now() - t0);
std::println("{}", ms);` },
  { term: 'std::function / move_only_function', cat: 'Utilities', module: 16, desc: 'Type-erased callable wrappers. C++23 `move_only_function` accepts non-copyable callables and is cheaper.', syntax: `std::function<double(double)> f = [](double x) { return x * 2; };
std::move_only_function<void()> task = [p = std::make_unique<Job>()] { p->run(); };` },
  { term: 'std::source_location', cat: 'Utilities', module: 16, desc: 'File, line and function of the call site, without macros.', syntax: `void log(std::string_view m, std::source_location l = std::source_location::current()) {
    std::println("{}:{} {}", l.file_name(), l.line(), m);
}` },
  { term: '<bit> operations', cat: 'Utilities', module: 16, desc: 'Bit manipulation: popcount, rotations, byte order, bit_cast.', syntax: `std::popcount(x);
std::countr_zero(x);
std::byteswap(x);               // C++23
std::bit_cast<std::uint32_t>(f);` },
  { term: 'std::unreachable', cat: 'Utilities', module: 16, since: 'C++23', desc: 'Marks code that can never execute; lets the optimiser assume it. Reaching it is UB.', syntax: `default: std::unreachable();` },
  { term: 'Exiting a program', cat: 'Utilities', module: 16, desc: '`return` from main / `std::exit` run cleanup; `std::quick_exit` and `std::abort` skip most of it; `std::terminate` on fatal errors.', syntax: `return EXIT_FAILURE;
std::exit(1);       // runs static destructors
std::abort();       // no cleanup` },

  // ---------- Numerics ----------
  { term: '<cmath> functions', cat: 'Numerics', module: 17, desc: '`sqrt`, `exp`, `log`, `pow`, `fma`, etc. Many are `constexpr` in C++23.', syntax: `double d = std::sqrt(var);
double y = std::fma(a, b, c);   // a*b + c, one rounding` },
  { term: 'std::numbers', cat: 'Numerics', module: 17, desc: 'Mathematical constants as `constexpr` values.', syntax: `using std::numbers::pi;
double area = pi * r * r;
std::numbers::e; std::numbers::sqrt2;` },
  { term: 'Random numbers', cat: 'Numerics', module: 17, desc: 'Engine + distribution. Seed once; reuse the engine.', syntax: `std::mt19937_64 rng{std::random_device{}()};
std::normal_distribution<double> ret{0.0, 0.01};
double r = ret(rng);` },
  { term: 'std::numeric_limits', cat: 'Numerics', module: 17, desc: 'Properties of arithmetic types: min, max, epsilon, infinity.', syntax: `std::numeric_limits<double>::epsilon();
std::numeric_limits<std::int64_t>::max();` },
  { term: 'std::accumulate / reduce', cat: 'Numerics', module: 17, desc: 'Numeric algorithms in `<numeric>`: sums, inner products, prefix sums.', syntax: `double s = std::accumulate(v.begin(), v.end(), 0.0);
std::partial_sum(v.begin(), v.end(), cum.begin());` },
  { term: 'std::complex', cat: 'Numerics', module: 17, desc: 'Complex arithmetic (FFTs, signal processing).', syntax: `using namespace std::complex_literals;
std::complex<double> z = 1.0 + 2.0i;
std::abs(z);` },

  // ---------- Concurrency ----------
  { term: 'std::jthread', cat: 'Concurrency', module: 18, desc: 'Thread that joins automatically on destruction and supports cooperative cancellation.', syntax: `std::jthread t{[](std::stop_token st) {
    while (!st.stop_requested()) poll();
}};
// t.request_stop(); joined at scope end` },
  { term: 'std::mutex & locks', cat: 'Concurrency', module: 18, desc: 'Mutual exclusion. Always lock via RAII guards; `scoped_lock` locks several without deadlock.', syntax: `std::mutex m;
{
    std::scoped_lock lk{m};
    shared.push_back(x);
}` },
  { term: 'std::atomic', cat: 'Concurrency', module: 18, desc: 'Lock-free operations on a single value.', syntax: `std::atomic<int> count{0};
count.fetch_add(1, std::memory_order_relaxed);` },
  { term: 'std::condition_variable', cat: 'Concurrency', module: 18, desc: 'Wait for a condition signalled by another thread. Always use the predicate form.', syntax: `std::unique_lock lk{m};
cv.wait(lk, [&] { return !queue.empty(); });
// producer: { lock; push; } cv.notify_one();` },
  { term: 'std::async / future / promise', cat: 'Concurrency', module: 18, desc: 'Run a task and collect its result (or exception) later through a future.', syntax: `auto f = std::async(std::launch::async, [] { return compute(); });
auto result = f.get();   // waits; rethrows exceptions` },
  { term: 'Coroutines', cat: 'Concurrency', module: 18, desc: 'Functions that suspend with `co_await`/`co_yield`/`co_return`. Use library types such as `std::generator`.', syntax: `std::generator<Tick> replay(std::span<const Tick> ts) {
    for (const auto& t : ts) co_yield t;
}` },
]
