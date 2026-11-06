import type { Module } from './types'

export const m08: Module = {
  n: 8,
  title: 'Concepts & Generic Programming',
  tour: '8 · Concepts and Generic Programming',
  summary: 'State what a template needs from its types with concepts, write algorithms once for many containers, and handle any number of arguments with variadic templates.',
  topics: ['Using concepts', 'Defining concepts', 'Generic programming', 'Variadic templates & folds', 'Template compilation model'],
  cpp23: [
    '`static_assert(false, ...)` is now allowed in a template branch that is never instantiated (P2593).',
    'Pack indexing (`Ts...[0]`) arrives in C++26, so in C++23 you still use `std::get` on a tuple or recursion.',
  ],
  lessons: [
    {
      id: 'using',
      title: 'Using concepts',
      blocks: [
        { kind: 'analogy', text: "An unconstrained template is a job advert that says \"anyone may apply\" and then fails people on day three. A concept is the advert's requirements list: \"must be able to drive and lift 20 kg\". Unsuitable applicants are turned away at the door, with a clear reason." },
        { kind: 'code', code: `// Without a concept, sort(list) fails deep inside the library with pages of errors.
// With one, the requirement is part of the signature:
template<std::random_access_iterator Iter>
void my_sort(Iter first, Iter last);

// Three equivalent spellings:
template<typename T> requires std::integral<T>
T gcd(T a, T b);

template<std::integral T>
T gcd(T a, T b);

std::integral auto gcd(std::integral auto a, std::integral auto b);  // abbreviated` },
        { kind: 'p', text: 'The standard library ships many concepts in `<concepts>`, `<iterator>` and `<ranges>`:' },
        { kind: 'list', items: [
          '**Core language**: `std::same_as`, `std::convertible_to`, `std::derived_from`, `std::integral`, `std::floating_point`.',
          '**Comparison**: `std::equality_comparable`, `std::totally_ordered`.',
          '**Object**: `std::copyable`, `std::movable`, `std::regular` (copyable, default-constructible, equality-comparable).',
          '**Callable**: `std::invocable<F, Args...>`, `std::predicate<F, Args...>`.',
          '**Ranges**: `std::ranges::range`, `std::ranges::random_access_range`, `std::ranges::sized_range`.',
        ] },
        { kind: 'code', code: `double mean(const std::ranges::sized_range auto& xs) {
    double s = 0;
    for (auto x : xs) s += x;
    return xs.empty() ? 0 : s / std::ranges::size(xs);
}

// error: no matching function for call to 'gcd(double, double)'
//   note: constraints not satisfied: 'std::integral<double>' evaluated to false
gcd(1.5, 2.5);` },
        { kind: 'p', text: 'Concepts also drive **overloading**: when several templates match, the compiler picks the most constrained one.' },
        { kind: 'code', code: `template<std::forward_iterator I>       void advance_to(I& it, int n);   // step one at a time
template<std::random_access_iterator I> void advance_to(I& it, int n);   // jump directly: chosen when possible` },
        { kind: 'check', q: 'Given both overloads above, which is chosen for a `std::vector<int>::iterator`?', options: ['The `forward_iterator` one', 'The `random_access_iterator` one', 'Ambiguous: compile error', 'Neither'], answer: 1, hint: 'A random-access iterator is also a forward iterator. Which requirement says more?', explain: '`random_access_iterator` subsumes `forward_iterator`, so it is more constrained and wins.' },
      ],
    },
    {
      id: 'defining',
      title: 'Defining concepts',
      blocks: [
        { kind: 'analogy', text: "Writing a concept is writing the checklist yourself: \"can be added to itself, and the result is the same kind of thing\". The compiler ticks the list off against each type, without running anything." },
        { kind: 'code', code: `template<typename T>
concept Number = requires(T x, T y) {
    x + y; x - y; x * y; x / y;          // these expressions must compile
    { x += y } -> std::same_as<T&>;       // ...and this must return T&
    T{0};                                 // constructible from 0
};

template<typename T>
concept Priced = requires(const T& t) {
    { t.price() } -> std::convertible_to<double>;
    { t.symbol() } -> std::convertible_to<std::string_view>;
};

double notional(const Priced auto& p, Number auto qty) { return p.price() * qty; }` },
        { kind: 'list', items: [
          'A `requires` expression lists expressions that must be valid. Nothing is evaluated: it only checks they would compile.',
          '`{ expr } -> concept;` also constrains the result type.',
          'Concepts combine with `&&` and `||`: `concept Sortable = std::ranges::random_access_range<R> && std::totally_ordered<std::ranges::range_value_t<R>>;`',
          'Satisfaction is **structural**: any type with the right operations qualifies. It doesn\'t need to declare that it does.',
        ] },
        { kind: 'compare',
          python: `from typing import Protocol

class Priced(Protocol):
    def price(self) -> float: ...
    def symbol(self) -> str: ...

# checked by a type checker (mypy),
# not by Python itself`,
          ts: `interface Priced {
  price(): number
  symbol(): string
}

function notional<T extends Priced>(
  p: T, qty: number) {
  return p.price() * qty
}`,
          go: `type Priced interface {
    Price() float64
    Symbol() string
}

func Notional[T Priced](p T, qty float64) float64 {
    return p.Price() * qty
}`,
          java: `interface Priced {
    double price();
    String symbol();
}
// nominal: a class must say "implements Priced"
static <T extends Priced> double notional(
        T p, double qty) {
    return p.price() * qty;
}`,
          cpp: `template<typename T>
concept Priced = requires(const T& t) {
    { t.price() }  -> std::convertible_to<double>;
    { t.symbol() } -> std::convertible_to<std::string_view>;
};

double notional(const Priced auto& p, double qty) {
    return p.price() * qty;   // no vtable, inlined per type
}`,
          note: 'A concept checks shape at compile time, then the code is generated for the exact type: no interface object, no virtual call.' },
        { kind: 'check', q: 'A struct `Gold` has `double price() const` and `std::string symbol() const`, but never mentions `Priced`. Does it satisfy the concept?', options: ['No: it must inherit from `Priced`', 'Yes: concepts are checked structurally', 'Only if `Gold` is a template', 'Only at runtime'], answer: 1, hint: 'Concepts are checklists, not family trees.', explain: 'Concepts test whether the expressions compile. No declaration or inheritance is needed.' },
      ],
    },
    {
      id: 'generic',
      title: 'Generic programming',
      blocks: [
        { kind: 'analogy', text: "Generic programming is \"lifting\": you write a specific, working algorithm (sum these doubles in this array), then ask what it really needs (something to walk through, values that can be added) and rewrite it to need only that. It now works on lists, maps, ranges and types that don't exist yet, at the same speed." },
        { kind: 'code', code: `// 1. concrete
double sum(const double* a, int n) {
    double s = 0;
    for (int i = 0; i < n; ++i) s += a[i];
    return s;
}

// 2. lifted: any range of values that can be added to an accumulator
template<std::ranges::input_range R, typename Acc>
    requires requires(Acc a, std::ranges::range_reference_t<R> x) { a += x; }
Acc sum(R&& r, Acc acc) {
    for (auto&& x : r) acc += x;
    return acc;
}

sum(std::vector{1.0, 2.0}, 0.0);
sum(std::list{1, 2, 3}, 0LL);
sum(prices | std::views::take(10), 0.0);` },
        { kind: 'p', text: "This is exactly how the standard library is built. Algorithms such as `std::ranges::sort` know nothing about containers. They work on **iterators and ranges** that meet stated concepts. Module 13 builds on this." },
        { kind: 'list', items: [
          'Start concrete, then lift. Abstracting too early gives you templates no one can read.',
          'Constrain with the **semantic** concepts your algorithm needs (`std::totally_ordered`, `std::regular`), not ad-hoc syntax lists.',
          'Templates are **zero-overhead**: the lifted `sum` compiles to the same machine code as the concrete one.',
        ] },
        { kind: 'check', q: 'What does "lifting" an algorithm mean?', options: ['Moving it to a header', 'Generalising it to require only what it really uses', 'Making it virtual', 'Running it at compile time'], answer: 1, hint: 'Think about removing assumptions.', explain: 'You keep the algorithm and drop incidental assumptions such as "an array of doubles".' },
      ],
    },
    {
      id: 'variadic',
      title: 'Variadic templates & folds',
      blocks: [
        { kind: 'analogy', text: "A variadic template is a conveyor belt that takes any number of parcels, each of a different type, and still knows exactly what every parcel is. A fold expression is the instruction \"combine everything on the belt with `+`\"." },
        { kind: 'code', code: `template<typename... Ts>              // a parameter pack of types
auto sum_all(Ts... xs) {               // a pack of values
    return (xs + ... + 0);             // fold: x1 + (x2 + (x3 + 0))
}
sum_all(1, 2.5, 3);                     // 6.5

template<typename... Ts>
void print_all(const Ts&... xs) {
    ((std::print("{} ", xs)), ...);    // comma fold: one print per argument
    std::println("");
}
print_all("XAU", 2390.5, 42);

sizeof...(Ts);                          // number of elements in the pack` },
        { kind: 'h', text: 'Forwarding arguments' },
        { kind: 'p', text: 'A common use is a function that passes its arguments on unchanged, for example to a constructor. `Args&&...` plus `std::forward` keeps each argument as an lvalue or rvalue, exactly as the caller gave it (module 16 goes deeper).' },
        { kind: 'code', code: `template<typename T, typename... Args>
std::unique_ptr<T> make(Args&&... args) {
    return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}
auto o = make<Order>("ID-7", 2390.5);   // this is essentially std::make_unique` },
        { kind: 'list', items: [
          'Folds work with most binary operators: `(... && xs)`, `(xs || ...)`, `(acc * ... * xs)`.',
          'An empty pack with a unary `+` fold is an error. Give it an initial value: `(xs + ... + 0)`.',
          'Each element keeps its own type, unlike `...args` lists that share one type.',
        ] },
        { kind: 'check', q: 'What does `(xs && ...)` return for an empty pack?', options: ['`false`', '`true`', 'Compile error', 'Undefined'], answer: 1, hint: 'What is the neutral value of AND?', explain: 'Unary folds over `&&`, `||` and `,` have defined empty values: `true`, `false` and `void()`. All other operators need an initial value.' },
      ],
    },
    {
      id: 'model',
      title: 'Template compilation model',
      blocks: [
        { kind: 'analogy', text: "The compiler can't stamp out a cookie unless it has the cutter in hand. That is why template **definitions**, not just declarations, must be visible wherever they are used: they normally live in headers or module interfaces." },
        { kind: 'list', items: [
          'A template is checked twice: once at definition (syntax, non-dependent names) and again at instantiation, with the real types.',
          'Put template definitions in headers (`.h`) or export them from a module. Splitting them into a `.cpp` gives "undefined reference" link errors.',
          'Every translation unit that uses `Vector<int>` instantiates it, and the linker keeps one copy. That costs compile time, not runtime.',
          '`extern template class Vector<int>;` plus one explicit `template class Vector<int>;` in a `.cpp` can cut build times for heavily used instantiations.',
        ] },
        { kind: 'pitfall', text: "Template error messages can run to hundreds of lines. Read the **first** error and the \"required from here\" line that points to your code. With concepts, the message becomes \"constraint not satisfied\" at your call site, which is a big part of why to use them." },
        { kind: 'new23', text: 'Writing `static_assert(false, "unsupported type")` in a template\'s final `else` branch used to fail even when that branch was never instantiated. C++23 (as a defect fix) makes this work as you\'d expect.' },
        { kind: 'check', q: 'You declare a class template in `stack.h` and define its member functions in `stack.cpp`. `main.cpp` uses `Stack<int>`. What happens?', options: ['Works fine', 'Link error: no definitions were instantiated for `Stack<int>`', 'Compile error in `stack.h`', 'Runtime crash'], answer: 1, hint: 'Where does the compiler see both the definition and the type `int` at once?', explain: 'Compiling `stack.cpp` never sees `int`, and compiling `main.cpp` never sees the definitions. Nobody instantiates them, so the linker finds nothing.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is a concept?', options: ['A runtime interface', 'A named compile-time predicate on template arguments', 'A kind of base class', 'A macro'], answer: 1, explain: 'Concepts constrain templates and are evaluated entirely at compile time.' },
    { q: 'Which is NOT a valid way to constrain `T` to integers?', options: ['`template<std::integral T>`', '`template<typename T> requires std::integral<T>`', '`std::integral auto x` parameter', '`template<typename T : std::integral>`'], answer: 3, explain: 'The `T : Concept` syntax doesn\'t exist in C++.' },
    { q: 'How does a type satisfy a concept?', options: ['By inheriting from it', 'By declaring `implements`', 'By supporting the required expressions', 'By registration at link time'], answer: 2, explain: 'Satisfaction is structural.' },
    { q: 'When two constrained overloads match, which wins?', options: ['The first declared', 'The more constrained (subsuming) one', 'Neither: always ambiguous', 'The unconstrained one'], answer: 1, explain: 'Partial ordering by constraints picks the most specific overload.' },
    { q: 'What does `(xs + ... + 0)` compute for xs = 1, 2, 3?', options: ['0', '6', '123', 'Compile error'], answer: 1, explain: 'A binary right fold: 1 + (2 + (3 + 0)).' },
    { q: 'What is `sizeof...(Ts)`?', options: ['The total byte size of the pack', 'The number of elements in the pack', 'The size of the first type', 'Invalid'], answer: 1, explain: 'It counts pack elements and is evaluated at compile time.' },
    { q: 'Why do template definitions usually live in headers or module interfaces?', options: ['Style convention only', 'The compiler needs the definition at each point of instantiation', 'Templates can\'t be in .cpp files at all', 'For faster linking'], answer: 1, explain: 'Without the definition visible, no code is generated for the types used.' },
    { q: 'Main benefit of concepts for error messages?', options: ['Errors disappear', 'Errors point at the call site with the unmet requirement', 'Errors are moved to runtime', 'They suppress warnings'], answer: 1, explain: 'Failures happen at the interface, not deep inside the implementation.' },
  ],
}
