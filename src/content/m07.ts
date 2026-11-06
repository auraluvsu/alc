import type { Module } from './types'

export const m07: Module = {
  n: 7,
  title: 'Templates',
  tour: '7 · Templates',
  summary: 'Write a type or function once and use it with any element type. The compiler generates and type-checks a version for each type you use.',
  topics: ['Parameterised types', 'Parameterised operations', 'Function objects & lambdas', 'Template mechanisms'],
  cpp23: [
    'Deducing `this` replaces many uses of the CRTP pattern.',
    '`static operator()` for stateless lambdas and function objects: no hidden `this` to pass.',
    'Lambdas may omit `()` even when they have specifiers such as `mutable`: `[x] mutable { ++x; }`.',
  ],
  lessons: [
    {
      id: 'types',
      title: 'Parameterised types',
      blocks: [
        { kind: 'analogy', text: "A template is a cookie cutter with a blank where the flavour goes. `Vector<T>` is the cutter; `Vector<double>` and `Vector<std::string>` are the cookies. The compiler stamps out a separate, fully type-checked cookie for every flavour you actually use, and none for the ones you don't." },
        { kind: 'p', text: "Our hand-rolled `Vector` only held `double`s. Make the element type a **parameter** and it works for anything:" },
        { kind: 'code', code: `template<typename T>
class Vector {
public:
    explicit Vector(int s) : elem{new T[s]}, sz{s} {}
    ~Vector() { delete[] elem; }

    T& operator[](int i) { return elem[i]; }
    const T& operator[](int i) const { return elem[i]; }
    int size() const { return sz; }

    T* begin() { return elem; }          // lets range-for work
    T* end()   { return elem + sz; }
private:
    T* elem;
    int sz;
};

Vector<double> prices(100);
Vector<std::string> symbols(10);
for (auto& s : symbols) s = "XAU";` },
        { kind: 'list', items: [
          "`template<typename T>` introduces a type parameter. `class` and `typename` mean the same thing here.",
          "Each distinct `T` produces a separate class, generated at compile time (**instantiation**). There's no runtime cost and no boxing.",
          "Defining `begin()` and `end()` is all it takes for range-for to work with your type.",
        ] },
        { kind: 'h', text: 'Value parameters' },
        { kind: 'p', text: "Template parameters don't have to be types. A **value** parameter bakes a compile-time constant into the type itself:" },
        { kind: 'code', code: `template<typename T, int N>
struct Buffer {
    T elem[N];               // size known at compile time: lives on the stack
    constexpr int size() const { return N; }
};

Buffer<char, 1024> scratch;   // a different type from Buffer<char, 512>
std::array<double, 4> ohlc;   // the standard library does exactly this` },
        { kind: 'h', text: 'Class template argument deduction (CTAD)' },
        { kind: 'code', code: `std::vector v {1, 2, 3};          // deduces std::vector<int>
std::pair p {"XAU", 2390.5};      // deduces std::pair<const char*, double>
Vector<int> w(10);                // no initialiser to deduce from: spell it out` },
        { kind: 'pitfall', text: "CTAD deduces from what you wrote, literally. `std::vector v {\"a\", \"b\"}` is a `vector<const char*>`, not a `vector<std::string>`. Write the type, or use `\"a\"s`, when it matters." },
        { kind: 'check', q: 'How many distinct classes does the compiler generate here?', code: `Vector<int> a(1);
Vector<int> b(2);
Vector<double> c(3);
Buffer<int, 4> d;
Buffer<int, 8> e;`, options: ['1', '2', '4', '5'], answer: 2, hint: 'Count distinct sets of template arguments, not variables.', explain: '`Vector<int>`, `Vector<double>`, `Buffer<int,4>` and `Buffer<int,8>`. The two `Vector<int>` variables share one class, and different values of `N` make different types.' },
      ],
    },
    {
      id: 'functions',
      title: 'Function templates',
      blocks: [
        { kind: 'analogy', text: "A function template is a recipe that says \"works with any ingredient that can be added together\". The compiler checks each time you cook that the ingredient really can be, and writes out a specific recipe card for it." },
        { kind: 'code', code: `template<typename Seq, typename Value>
Value sum(const Seq& s, Value v) {
    for (const auto& x : s) v += x;
    return v;
}

std::vector<int> vi {1, 2, 3};
std::list<double> ld {1.5, 2.5};
int a = sum(vi, 0);          // Seq = vector<int>, Value = int
double b = sum(ld, 0.0);     // Seq = list<double>, Value = double` },
        { kind: 'p', text: 'Template arguments are **deduced** from the call, so you rarely write them. Since C++20 you can also write `auto` parameters, which is shorthand for a function template:' },
        { kind: 'code', code: `auto twice(auto x) { return x + x; }   // "abbreviated function template"
twice(21);       // int
twice(1.5);      // double
twice("hi"s);    // std::string: "hihi"` },
        { kind: 'compare',
          python: `# duck typing: checked when it runs
def total(seq, start):
    for x in seq:
        start += x
    return start

total([1, 2, 3], 0)
total(["a"], 0)   # TypeError at runtime`,
          ts: `// one function; types erased at runtime
function total<T>(seq: T[], start: T,
                  add: (a: T, b: T) => T): T {
  let v = start
  for (const x of seq) v = add(v, x)
  return v
}`,
          go: `type Number interface{ ~int | ~float64 }

func Total[T Number](seq []T, start T) T {
    for _, x := range seq {
        start += x
    }
    return start
}`,
          java: `// erased generics: no "+" on T,
// and no primitives (Integer, not int)
static <T> T total(List<T> seq, T start,
                   BinaryOperator<T> add) {
    T v = start;
    for (T x : seq) v = add.apply(v, x);
    return v;
}`,
          cpp: `template<typename Seq, typename Value>
Value total(const Seq& s, Value v) {
    for (const auto& x : s) v += x;   // checked per type,
    return v;                         // at compile time
}

total(std::vector{1, 2, 3}, 0);
// total(std::vector<std::string>{"a"}, 0);
//   compile error: no int += string`,
          note: 'C++ templates are checked at compile time, separately for every type they are used with, and generate code with no indirection or boxing.' },
        { kind: 'pitfall', text: "An unconstrained template accepts any type until something inside fails to compile, and the error then points deep inside the template. Module 8's **concepts** fix this by stating requirements up front." },
        { kind: 'check', q: 'What is `Value` deduced as in `sum(vi, 0)` where `vi` is a `vector<double>`?', options: ['`double`', '`int`', '`auto`', 'Compile error'], answer: 1, hint: 'Look at the type of the second argument, not the container.', explain: "`Value` comes from `0`, an `int`. The doubles get truncated as they are added into an `int`. A classic bug: write `sum(vi, 0.0)`." },
      ],
    },
    {
      id: 'lambdas',
      title: 'Function objects & lambdas',
      blocks: [
        { kind: 'analogy', text: "A function object is a gadget that remembers a setting and can be pressed like a button: a thermostat set to 21° that answers \"too cold?\" for any temperature you show it. A lambda is the same gadget, built on the spot in one line." },
        { kind: 'code', code: `template<typename T>
class Less_than {
    const T val;                         // the remembered setting
public:
    Less_than(const T& v) : val{v} {}
    bool operator()(const T& x) const { return x < val; }   // the button
};

Less_than lt_42 {42};
bool b = lt_42(7);                        // true

// The same thing as a lambda:
int limit = 42;
auto lt = [limit](int x) { return x < limit; };
auto n = std::ranges::count_if(v, lt);` },
        { kind: 'h', text: 'Captures' },
        { kind: 'list', items: [
          '`[x]`: copy `x` into the lambda when it is created.',
          '`[&x]`: refer to the caller\'s `x`. Fast, but dangerous if the lambda outlives `x`.',
          '`[=]` / `[&]`: capture everything used, by copy / by reference.',
          '`[this]`: access members of the enclosing object. `[*this]` copies the whole object.',
          '`[p = std::move(ptr)]`: init-capture, which creates a new member, often to move something in.',
        ] },
        { kind: 'code', code: `auto counter = [n = 0]() mutable { return ++n; };   // mutable: may change its copy
counter(); counter();       // 1, 2

auto add = [](auto a, auto b) { return a + b; };    // generic lambda
add(1, 2); add(1.5, 2.0);` },
        { kind: 'pitfall', text: "Returning or storing a lambda that captured locals **by reference** is a dangling reference waiting to happen. When a lambda leaves the scope it was made in (stored, returned, sent to a thread), capture by value." },
        { kind: 'new23', text: "A capture-less lambda can be marked `static` in C++23: `[](int x) static { return x * 2; }`. It then has no hidden `this`, so calls are marginally cheaper in hot code. Lambdas with specifiers can now also drop the empty `()`." },
        { kind: 'check', q: 'What does this print?', code: `int x = 1;
auto byval = [x] { return x; };
auto byref = [&x] { return x; };
x = 5;
std::println("{} {}", byval(), byref());`, options: ['`1 1`', '`1 5`', '`5 5`', '`5 1`'], answer: 1, hint: 'When does each lambda look at `x`?', explain: '`byval` copied `x` (1) when it was created. `byref` reads the live variable when it is called, which is 5 by then.' },
      ],
    },
    {
      id: 'mechanisms',
      title: 'Template mechanisms',
      blocks: [
        { kind: 'analogy', text: "These are the specialist tools in the cutter workshop: a constant that changes with the flavour (variable templates), a nickname for a long cutter name (aliases), and a fork in the instructions that's resolved before baking starts (`if constexpr`)." },
        { kind: 'h', text: 'Variable templates & aliases' },
        { kind: 'code', code: `template<typename T>
constexpr T viscosity = T(0.4);          // a constant per type

template<typename Key>
using PriceMap = std::unordered_map<Key, double>;   // alias template

PriceMap<std::string> last;               // = unordered_map<std::string, double>
auto f = viscosity<float>;` },
        { kind: 'h', text: 'Compile-time branching: if constexpr' },
        { kind: 'code', code: `template<typename T>
std::string describe(const T& x) {
    if constexpr (std::is_arithmetic_v<T>)
        return std::format("number {}", x);
    else if constexpr (requires { x.size(); })
        return std::format("sequence of {}", x.size());
    else
        return "something else";
}` },
        { kind: 'p', text: "The branches not taken are **discarded**: they are never compiled for that `T`. So `x.size()` is fine in the second branch even when `T` is `int`. A normal `if` would try to compile every branch for every type." },
        { kind: 'h', text: 'Specialisation' },
        { kind: 'code', code: `template<typename T> struct Printer { static void print(const T& x) { std::println("{}", x); } };
template<> struct Printer<bool> {          // full specialisation for one type
    static void print(bool b) { std::println("{}", b ? "yes" : "no"); }
};` },
        { kind: 'new23', text: "Deducing `this` (`void f(this auto&& self)`) gives a base class access to its most-derived type without the curiously recurring template pattern, `class D : Base<D>`. CRTP still appears in older code, so recognise it, but reach for deducing `this` first." },
        { kind: 'check', q: 'Why does this need `if constexpr` rather than `if`?', code: `template<typename T>
auto len(const T& x) {
    if constexpr (std::is_integral_v<T>) return 1;
    else return x.size();
}
len(42);`, options: ['`if` is slower', 'With plain `if`, `x.size()` would still be compiled for `int` and fail', '`if` can\'t call `is_integral_v`', 'It doesn\'t; both work'], answer: 1, hint: 'Which branches get compiled for `T = int`?', explain: 'A normal `if` compiles both branches for every instantiation. `int` has no `.size()`, so it fails. `if constexpr` discards the untaken branch.' },
      ],
    },
  ],
  quiz: [
    { q: 'When is template code generated?', options: ['At runtime, on first use', 'At compile time, for each set of template arguments used', 'At link time only', 'Once, for all types'], answer: 1, explain: 'Each distinct instantiation is generated and type-checked at compile time.' },
    { q: '`Buffer<int, 4>` and `Buffer<int, 8>` are…', options: ['the same type', 'different types', 'a compile error', 'the same type with different sizes at runtime'], answer: 1, explain: 'Value template arguments are part of the type.' },
    { q: 'What does `[&]` capture?', options: ['Nothing', 'Everything used, by copy', 'Everything used, by reference', 'Only `this`'], answer: 2, explain: '`[=]` copies; `[&]` refers. Watch lifetimes with `[&]`.' },
    { q: 'Why is `mutable` needed in `[n = 0]() mutable { return ++n; }`?', options: ['To allow capturing', "A lambda's call operator is `const` by default, so captured copies can't change", 'To make it thread-safe', 'To allow `auto` parameters'], answer: 1, explain: 'Without `mutable`, modifying a by-copy capture is a compile error.' },
    { q: '`auto f(auto x)` is…', options: ['A function taking `std::any`', 'An abbreviated function template', 'A runtime-polymorphic function', 'Illegal'], answer: 1, explain: 'Each `auto` parameter is an implicit template parameter (C++20).' },
    { q: 'What does `std::vector v {1, 2, 3};` deduce?', options: ['`std::vector<auto>`', '`std::vector<int>`', '`std::vector<long>`', 'Nothing: compile error'], answer: 1, explain: 'Class template argument deduction uses the initialiser types.' },
    { q: 'In `if constexpr`, the branch not taken is…', options: ['compiled but not run', 'discarded and not instantiated', 'evaluated at runtime', 'an error'], answer: 1, explain: 'That is what makes type-specific code possible inside one template.' },
    { q: 'A C++ template vs erased generics (as in Java or TypeScript):', options: ['Both keep one shared implementation', 'C++ generates specialised code per type, with no boxing', 'C++ checks types only at runtime', 'There is no difference'], answer: 1, explain: 'Monomorphisation trades bigger binaries for speed and full type checking per type.' },
  ],
}
