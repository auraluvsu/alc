import type { Module } from './types'

export const m03: Module = {
  n: 3,
  title: 'Modularity & Functions',
  tour: '3 · Modularity',
  summary: 'Split programs across files with headers or modules, organise names with namespaces, and choose how arguments go in and results come out.',
  topics: ['Headers & separate compilation', 'Modules', 'Namespaces', 'Argument passing', 'Return values & structured bindings'],
  cpp23: [
    '`import std;` / `import std.compat;` standard library modules.',
    'Implicit move on return extended (P2266): returning a local `T&&` now moves too.',
    '`auto(x)` makes an explicit decay-copy of `x`.',
  ],
  lessons: [
    {
      id: 'headers',
      title: 'Headers & separate compilation',
      blocks: [
        { kind: 'analogy', text: 'A header is a restaurant menu: it tells customers what dishes exist and what they cost (declarations), without the recipes. The `.cpp` file is the kitchen. Every customer file gets a photocopy of the menu via `#include`, which is literally a copy-paste.' },
        { kind: 'code', code: `// vector.h  (the menu)
#pragma once                       // include this file at most once per translation unit
class Vector {
public:
    explicit Vector(int s);
    double& operator[](int i);
    int size() const;
private:
    double* elem;
    int sz;
};

// vector.cpp  (the kitchen)
#include "vector.h"
Vector::Vector(int s) : elem{new double[s]}, sz{s} {}
double& Vector::operator[](int i) { return elem[i]; }
int Vector::size() const { return sz; }

// user.cpp  (a customer)
#include "vector.h"
double sum(Vector& v) { /* ... */ }`, caption: 'Build: `g++ -std=c++23 vector.cpp user.cpp -o app`.' },
        { kind: 'p', text: 'Each `.cpp` plus everything it includes is a **translation unit**. They are compiled independently, so changing `vector.cpp` only recompiles that file. Changing `vector.h` recompiles every file that includes it, which is why big C++ builds are slow.' },
        { kind: 'pitfall', text: 'Defining a non-`inline` function body in a header that is included in two `.cpp` files gives "multiple definition" link errors (ODR violation). Mark header-defined functions `inline`, or put them in the `.cpp`. Templates are an exception: they live in headers (module 7).' },
        { kind: 'p', text: 'Headers are a 1970s mechanism C++ inherited from C: textual copy-paste, not a real module system. Modules (next lesson) are the fix, and most real codebases still mix both.' },
        { kind: 'check', q: 'What does `#include "vector.h"` actually do?', options: ['Links the compiled `vector.o`', 'Pastes the file\'s text in at that point', 'Imports only the public names', 'Loads the header at runtime'], answer: 1, hint: 'It runs before the compiler proper, in the preprocessor.', explain: '`#include` is textual inclusion by the preprocessor. Linking happens much later.' },
      ],
    },
    {
      id: 'modules',
      title: 'Modules',
      blocks: [
        { kind: 'analogy', text: 'Headers photocopy the menu into every customer\'s pocket. A module is a shared, precompiled menu board: the compiler reads it once, and you only see the dishes marked for export.' },
        { kind: 'code', code: `// vector.cppm   (module interface unit)
export module Vector;          // this file defines module "Vector"

export class Vector {
public:
    explicit Vector(int s);
    double& operator[](int i);
    int size() const;
private:
    double* elem;
    int sz;
};

export bool operator==(const Vector& a, const Vector& b);

// user.cpp
import Vector;                 // no textual inclusion, no macros leak in
import std;

double sum(Vector& v) {
    double s = 0;
    for (int i = 0; i != v.size(); ++i) s += v[i];
    return s;
}` },
        { kind: 'list', items: [
          'Only `export`ed names are visible to importers.',
          'Macros don\'t leak in or out, and import order doesn\'t matter.',
          'A module is compiled once, so builds can be dramatically faster than with headers.',
        ] },
        { kind: 'new23', text: 'C++23 standardises `import std;` (everything in namespace `std`) and `import std.compat;` (also puts C functions such as `printf` in the global namespace). The book uses headers in most examples. This course defaults to `import std;` and notes header equivalents where useful.' },
        { kind: 'p', text: '**Practical reality (late 2026):** modules work in MSVC, Clang 18+ and GCC 15 with CMake 3.28+, but tooling (IDEs, some package managers) still lags. You will meet headers in every codebase for years, so you need to read both.' },
        { kind: 'check', q: 'In a module interface, a class declared **without** `export` is…', options: ['Visible to importers', 'Visible only within the module', 'A compile error', 'Exported automatically if public'], answer: 1, hint: 'Think of ES modules: what can another file import if you didn\'t write `export`?', explain: 'Non-exported entities are module-private. Importers can\'t name them.' },
      ],
    },
    {
      id: 'namespaces',
      title: 'Namespaces',
      blocks: [
        { kind: 'analogy', text: 'Namespaces are surnames. There can be many people called "Vector", but `std::vector` and `mylib::Vector` are different people. `using` is like being on first-name terms in a particular room.' },
        { kind: 'code', code: `namespace quant::pricing {          // nested namespace shorthand
    double black_scholes(double s, double k, double t, double r, double sigma);
}

namespace qp = quant::pricing;      // alias

int main() {
    double c = qp::black_scholes(100, 105, 0.5, 0.04, 0.2);
    using std::println;              // bring one name in
    println("{}", c);
}` },
        { kind: 'pitfall', text: 'Never write `using namespace std;` in a header. It dumps hundreds of names into every file that includes it and causes baffling clashes (your `distance` vs `std::distance`). In a small `.cpp` or a function body it is tolerable.' },
        { kind: 'p', text: '**Argument-dependent lookup (ADL)**: when you call an unqualified function, the compiler also searches the namespaces of the arguments\' types. That is why `std::println("{}", x)` works but plain `swap(a, b)` finds `std::swap` for `std` types. You will rely on it for operators without noticing.' },
        { kind: 'check', q: 'Why does `operator<<` for `std::string` work without writing `std::operator<<`?', options: ['It\'s a keyword', 'Argument-dependent lookup searches `std` because the argument is a `std::string`', 'Every header uses `using namespace std`', 'Operators ignore namespaces'], answer: 1, hint: 'The compiler looks where the argument\'s type was born.', explain: 'ADL adds the namespaces of the argument types to the lookup, so operators defined next to a type are found automatically.' },
      ],
    },
    {
      id: 'args',
      title: 'Passing arguments',
      blocks: [
        { kind: 'analogy', text: 'Passing by value hands someone a photocopy. Passing by `&` hands them the original document. Passing by `const&` hands them the original in a sealed display case. Passing by `&&` (module 6) says "take it, I\'m done with it".' },
        { kind: 'list', items: [
          '**Small and cheap to copy** (int, double, pointers, `string_view`, `span`): pass **by value**.',
          '**Large, read-only**: `const T&`.',
          '**Need to modify the caller\'s object**: `T&`. Prefer returning a new value when it reads better.',
          '**Taking ownership / storing a copy**: by value, then `std::move` it into place (module 6).',
        ] },
        { kind: 'code', code: `void print(const std::vector<int>& v);        // read-only, no copy
void normalise(std::vector<double>& v);        // modifies caller's data
double mid(double bid, double ask);            // small, by value

struct Order { std::string id; double px; };
class Book {
    std::vector<Order> orders;
public:
    void add(Order o) { orders.push_back(std::move(o)); }  // sink: by value + move
};` },
        { kind: 'h', text: 'Default arguments & overloading' },
        { kind: 'code', code: `void log(std::string_view msg, int level = 1);  // default argument
log("started");          // level = 1

void show(int x);        // overloading: same name, different parameter types
void show(double x);
void show(std::string_view s);
show(3);                 // picks show(int)
show(3.0);               // picks show(double)` },
        { kind: 'p', text: 'Each overload is a separate real function, chosen at compile time from the argument types.' },
        { kind: 'check', q: 'A function stores a `std::string` argument inside an object it owns. Which signature is idiomatic?', options: ['`void set(const std::string& s)` then copy', '`void set(std::string s)` then `std::move(s)` into the member', '`void set(std::string* s)`', '`void set(std::string& s)` and steal it'], answer: 1, hint: 'The function will end up keeping its own copy anyway. Where is the cheapest place to make it?', explain: 'By value + move gives one copy for lvalue arguments and zero copies for temporaries. Stealing from a non-const `&` surprises callers.' },
      ],
    },
    {
      id: 'returns',
      title: 'Returning values',
      blocks: [
        { kind: 'analogy', text: 'Returning a big object from a function sounds like building furniture in one room and carrying it to another. Modern C++ builds it directly in the destination room instead (copy elision), so returning by value is cheap.' },
        { kind: 'code', code: `std::vector<double> make_returns(const std::vector<double>& px) {
    std::vector<double> r;
    for (std::size_t i = 1; i < px.size(); ++i)
        r.push_back(px[i] / px[i - 1] - 1);
    return r;          // no copy: elided or moved
}` },
        { kind: 'p', text: 'Return by value by default. Never return a reference or pointer to a local variable: it dangles the moment the function ends.' },
        { kind: 'h', text: 'Multiple return values: structured bindings' },
        { kind: 'compare', python: `def min_max(xs: list[int]) -> tuple[int, int]:
    ...
    return lo, hi

lo, hi = min_max(xs)`, java: `record Range(int lo, int hi) {}
Range minMax(int[] xs) { ... }

var r = minMax(xs);
int lo = r.lo(), hi = r.hi();`, go: `func minMax(xs []int) (int, int) {
    ...
    return lo, hi
}
lo, hi := minMax(xs)`, ts: `function minMax(xs: number[]) {
  return [lo, hi] as const
}
const [lo, hi] = minMax(xs)`, cpp: `struct Range { int lo, hi; };
Range min_max(std::span<const int> xs);

auto [lo, hi] = min_max(xs);   // structured binding
// or with a pair:
auto [it, inserted] = my_map.insert({"k", 1});` },
        { kind: 'h', text: 'Return type deduction' },
        { kind: 'code', code: `auto twice(int x) { return x * 2; }                 // deduces int
auto mul(auto a, auto b) -> decltype(a * b) {       // trailing return type
    return a * b;
}` },
        { kind: 'new23', text: '`auto(x)` produces a prvalue copy of `x`, handy when you need "a copy of this, right here" without naming the type, e.g. `v.erase(std::remove(v.begin(), v.end(), auto(v.front())), v.end());` avoids aliasing a reference into the container you are modifying.' },
        { kind: 'check', q: 'What is wrong with this?', code: `const std::string& greet() {
    std::string s = "hi";
    return s;
}`, options: ['Nothing', 'Returns a dangling reference', 'Needs `std::move(s)`', 'Strings can\'t be returned'], answer: 1, hint: 'When does `s` die, relative to when the caller uses the result?', explain: '`s` is destroyed at the end of the function, so the reference dangles. Return `std::string` by value instead.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is a translation unit?', options: ['A module interface', 'A `.cpp` file plus everything it `#include`s', 'A compiled executable', 'A namespace'], answer: 1, explain: 'The compiler processes each translation unit independently, and the linker combines the results.' },
    { q: 'Why is `using namespace std;` in a header discouraged?', options: ['It slows the program', 'It forces every includer to have all `std` names unqualified, risking clashes', 'It is illegal', 'It disables ADL'], answer: 1, explain: 'Headers are pasted into other files, so the directive spreads everywhere.' },
    { q: 'Best way to pass a `double` to a read-only function?', options: ['`const double&`', '`double`', '`double*`', '`double&&`'], answer: 1, explain: 'Small trivially-copyable types are cheapest by value. A reference adds indirection for nothing.' },
    { q: '`auto [a, b] = f();` is called a…', options: ['tuple unpack', 'structured binding', 'destructuring assignment', 'pattern match'], answer: 1, explain: 'Structured bindings work with structs, `std::pair`, `std::tuple` and arrays.' },
    { q: 'In a module, which names can importers use?', options: ['All public ones', 'Only those marked `export`', 'All of them', 'Only functions'], answer: 1, explain: 'Like ES modules, visibility is opt-in with `export`.' },
    { q: 'What does `#pragma once` protect against?', options: ['Multiple definitions across `.cpp` files', 'The same header being included twice in one translation unit', 'Macro leakage', 'ODR violations in templates'], answer: 1, explain: 'It is an include guard. It doesn\'t help with definitions duplicated across translation units.' },
    { q: 'Which call does `show(3.0f)` choose, given `show(int)` and `show(double)`?', options: ['`show(int)`', '`show(double)` (float → double promotion)', 'Ambiguous, so a compile error', 'Neither'], answer: 1, explain: '`float` → `double` is a promotion, which beats the `float` → `int` conversion in overload resolution.' },
    { q: 'Returning a large `std::vector` by value from a function is…', options: ['always a deep copy, so avoid it', 'cheap thanks to copy elision and move semantics', 'only allowed with `std::move`', 'UB'], answer: 1, explain: 'Return by value is the idiomatic default. Writing `return std::move(local);` can actually block elision.' },
  ],
}
