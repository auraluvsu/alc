import type { Module } from './types'

export const m15: Module = {
  n: 15,
  title: 'Pointers & Containers',
  tour: '15 · Pointers and Containers',
  summary: 'Smart pointers that express ownership, span and mdspan for viewing memory, small fixed containers, and the "alternatives": optional, variant and any.',
  topics: ['unique_ptr', 'shared_ptr & weak_ptr', 'span & mdspan', 'array, bitset, pair, tuple', 'optional, variant, any'],
  cpp23: [
    '`std::optional` monadic operations: `and_then`, `transform`, `or_else`.',
    '`std::mdspan` (`<mdspan>`): multidimensional views with `m[i, j]` indexing.',
    '`std::out_ptr` / `std::inout_ptr`: pass smart pointers to C APIs that fill in a `T**`.',
    '`std::unique_ptr` is usable in `constexpr` code.',
  ],
  lessons: [
    {
      id: 'unique',
      title: 'unique_ptr',
      blocks: [
        { kind: 'analogy', text: "A `unique_ptr` is the single key to a storage unit. Whoever holds the key owns the unit, and when they're done, the unit is emptied automatically. You can **hand the key over** (move), but you can't copy it, so there is never confusion about who clears the unit out." },
        { kind: 'code', code: `auto p = std::make_unique<Order>("ID-1", 2390.5);   // allocate + own
p->px = 2391.0;                                    // use like a pointer
std::unique_ptr<Order> q = std::move(p);           // transfer ownership; p is now null
// auto r = q;                                      // error: can't copy a unique_ptr

std::unique_ptr<Shape> make_shape(Kind k) {        // factories return ownership
    if (k == Kind::circle) return std::make_unique<Circle>(Point{}, 5);
    return std::make_unique<Square>(Point{}, 3);
}

void inspect(const Order& o);       // borrowing: take a reference
inspect(*q);
void adopt(std::unique_ptr<Order> o);   // taking ownership: by value
adopt(std::move(q));` },
        { kind: 'list', items: [
          '**Zero overhead**: the same size and speed as a raw pointer. Default to it for anything on the heap that a container doesn\'t already manage.',
          'Pass `T&` / `const T&` (or `T*` if it may be null) to functions that only **use** the object. Pass `unique_ptr<T>` by value only to transfer ownership.',
          'Custom deleters handle non-memory resources: `std::unique_ptr<FILE, decltype(&std::fclose)> f {std::fopen("x", "r"), &std::fclose};`',
        ] },
        { kind: 'new23', text: "`std::out_ptr(p)` adapts a smart pointer for C APIs with an output parameter: `sqlite3_open(\"db\", std::out_ptr(db));` fills `db` and keeps ownership correct, even if the call fails part-way." },
        { kind: 'check', q: 'After `auto b = std::move(a);` where `a` is a `unique_ptr`, what is `a`?', options: ['A dangling pointer', '`nullptr`', 'Still owning the object', 'A copy'], answer: 1, hint: 'The key has been handed over.', explain: 'Moving a `unique_ptr` transfers ownership and guarantees the source becomes null.' },
      ],
    },
    {
      id: 'shared',
      title: 'shared_ptr & weak_ptr',
      blocks: [
        { kind: 'analogy', text: "A `shared_ptr` is a shared office with a sign-in sheet. Each holder signs in; when the last person signs out, the office is closed and cleaned. A `weak_ptr` is a visitor's pass: you can check whether the office is still open and pop in, but your pass doesn't keep it open." },
        { kind: 'code', code: `auto cfg = std::make_shared<Config>(load_config());   // count = 1
auto a = cfg;                                          // count = 2 (copying is allowed)
{
    auto b = cfg;                                      // 3
}                                                      // 2
cfg.use_count();

// Breaking a cycle: parent owns children; children only observe the parent
struct Node {
    std::vector<std::shared_ptr<Node>> children;
    std::weak_ptr<Node> parent;                        // doesn't keep the parent alive
};
if (auto p = node->parent.lock()) {                     // a shared_ptr, or null if gone
    p->visit();
}` },
        { kind: 'list', items: [
          'Costs: a control block (one allocation with `make_shared`), and **atomic** increments and decrements on every copy, which is thread-safe but not free.',
          'Two `shared_ptr`s pointing at each other never reach count 0, so they leak. `weak_ptr` breaks the cycle.',
          'Use `shared_ptr` only when ownership is genuinely shared and lifetimes are unpredictable, such as caches or async callbacks. Most code needs only `unique_ptr`.',
        ] },
        { kind: 'pitfall', text: "Never create two separate `shared_ptr`s from the same raw pointer (`std::shared_ptr<T> a(raw), b(raw);`). They'd have two counts and both delete it. Always use `make_shared` or copy an existing `shared_ptr`." },
        { kind: 'check', q: 'A and B hold `shared_ptr`s to each other, and nothing else refers to them. What happens?', options: ['Both are freed', 'Neither is ever freed (leak)', 'Undefined behaviour', 'One is freed'], answer: 1, hint: 'Each keeps the other\'s count at 1.', explain: 'Reference counting can\'t reclaim cycles. Make one side a `weak_ptr`.' },
      ],
    },
    {
      id: 'span',
      title: 'span & mdspan',
      blocks: [
        { kind: 'analogy', text: "A `span` is a window frame you hold up against any row of lockers: where it starts and how many lockers it covers. It doesn't own the lockers, and it works the same whether they belong to a vector, an array or a raw buffer. `mdspan` is the same frame for a grid." },
        { kind: 'code', code: `double mean(std::span<const double> xs) {          // any contiguous doubles
    return std::ranges::fold_left(xs, 0.0, std::plus{}) / xs.size();
}
std::vector<double> v {1, 2, 3};
std::array<double, 4> a {1, 2, 3, 4};
double raw[] {5, 6};
mean(v); mean(a); mean(raw);
mean(std::span{v}.subspan(1, 2));                   // a slice: elements 1..2

void scale(std::span<double> xs, double k) {       // non-const span: may modify
    for (double& x : xs) x *= k;
}` },
        { kind: 'p', text: '`std::span` replaces the error-prone `(T* ptr, size_t n)` parameter pair. Like `string_view`, it is a non-owning view and must not outlive the data.' },
        { kind: 'new23', text: "`std::mdspan` views a flat buffer as a matrix (or any number of dimensions) with `m[i, j]` indexing, using C++23's multi-argument `operator[]`. Layout policies choose row-major (`layout_right`, the default) or column-major (`layout_left`) to match whatever library produced the data." },
        { kind: 'code', code: `std::vector<double> buf(3 * 4);
std::mdspan m {buf.data(), 3, 4};                     // 3 rows × 4 columns, row-major
for (std::size_t i = 0; i < m.extent(0); ++i)
    for (std::size_t j = 0; j < m.extent(1); ++j)
        m[i, j] = i * 10 + j;                         // writes into buf` },
        { kind: 'check', q: 'Which parameter type accepts a `vector<int>`, `array<int, 8>` and `int[8]` without copying?', options: ['`std::vector<int>`', '`std::span<const int>`', '`std::initializer_list<int>`', '`int*`'], answer: 1, hint: 'You want a view that knows its length.', explain: '`span` binds to any contiguous sequence and carries its size. A bare `int*` loses the size.' },
      ],
    },
    {
      id: 'small',
      title: 'array, bitset, pair & tuple',
      blocks: [
        { kind: 'analogy', text: "These are the small, fixed-size cases in the toolbox: a fixed tray (`array`), a row of light switches (`bitset`), and quick bundles of two or a few things (`pair`, `tuple`) for when defining a named struct feels like overkill." },
        { kind: 'code', code: `std::array<double, 4> ohlc {2385.0, 2396.2, 2381.4, 2390.5};   // on the stack, knows its size
auto [o, h, l, c] = ohlc;

std::bitset<8> flags {0b0000'0101};
flags.set(3); flags.test(0); flags.count();      // 3 bits set
std::println("{}", flags.to_string());           // "00001101"

std::pair<std::string, double> quote {"XAU", 2390.5};
quote.first; quote.second;

auto t = std::tuple{1, 2.5, "x"s};
std::get<1>(t);                                  // 2.5
auto [i, d, s] = t;` },
        { kind: 'p', text: "Prefer a named struct when the fields mean something: `quote.second` says nothing, while `quote.price` explains itself. Tuples shine in generic code and for quick multi-key comparisons with `std::tie`." },
        { kind: 'check', q: 'Where are the elements of a local `std::array<int, 1000>` stored?', options: ['On the heap', 'Inside the object itself (e.g. on the stack)', 'In static memory', 'It depends on the size'], answer: 1, hint: 'Its size is part of its type.', explain: '`std::array` is a wrapper around a built-in array: no allocation at all.' },
      ],
    },
    {
      id: 'alternatives',
      title: 'optional, variant & any',
      blocks: [
        { kind: 'analogy', text: "Three kinds of box. `optional<T>` either holds a T or is visibly empty. `variant<A, B>` holds exactly one of a known list of things and tells you which. `any` holds anything at all, but you must guess correctly what's inside to get it out." },
        { kind: 'code', code: `std::optional<double> last_price(std::string_view sym) {
    if (auto it = cache.find(sym); it != cache.end()) return it->second;
    return std::nullopt;                                  // "no value"
}

if (auto p = last_price("XAU")) std::println("{}", *p);  // test, then dereference
double px = last_price("XAU").value_or(0.0);

// C++23 monadic chaining: no nested ifs
auto shown = last_price("XAU")
    .transform([](double p) { return p * fx_rate; })     // only runs if present
    .and_then([](double p) -> std::optional<double> {     // may itself produce "nothing"
        return p > 0 ? std::optional{p} : std::nullopt; })
    .value_or(-1);` },
        { kind: 'list', items: [
          '`optional<T>`: maybe a value, no reason given. If you need to say **why** there is no value, use `expected<T, E>` (module 4).',
          '`variant<A, B, C>`: a closed set of types, checked with `std::visit` (module 2).',
          '`any`: an open set, recovered with `std::any_cast<T>`. It is rarely the right choice: usually a `variant` or a virtual interface expresses the design better.',
          'There is no `optional<T&>` in C++23 (it arrives in C++26). Use `T*` for "maybe a reference".',
        ] },
        { kind: 'check', q: 'Which type fits "parse a price, and report what went wrong if it fails"?', options: ['`std::optional<double>`', '`std::expected<double, ParseError>`', '`std::any`', '`double*`'], answer: 1, hint: 'You need to carry a reason for failure.', explain: '`optional` can only say "nothing". `expected` carries a typed error.' },
      ],
    },
  ],
  quiz: [
    { q: 'Overhead of `unique_ptr` (default deleter) vs a raw pointer:', options: ['A reference count', 'None: same size, same speed', 'A virtual call', 'A mutex'], answer: 1, explain: 'That is why it is the default for owning heap objects.' },
    { q: 'Why prefer `make_shared<T>()` over `shared_ptr<T>(new T)`?', options: ['It is the only way', 'One allocation for object + control block, and no leak risk', 'It avoids reference counting', 'It is thread-unsafe'], answer: 1, explain: 'Fewer allocations and better exception safety.' },
    { q: 'What does `weak_ptr::lock()` return?', options: ['A raw pointer', 'A `shared_ptr`, empty if the object is gone', 'A bool', 'A `unique_ptr`'], answer: 1, explain: 'It safely upgrades an observer to a temporary owner.' },
    { q: '`std::span<const double>` is…', options: ['an owning array', 'a non-owning view of contiguous doubles', 'a linked list', 'heap-allocated'], answer: 1, explain: 'It is a pointer + size, like `string_view` for arbitrary elements.' },
    { q: 'How do you index a 2-D `std::mdspan m` in C++23?', options: ['`m[i][j]`', '`m(i, j)` only', '`m[i, j]`', '`m.at(i)(j)`'], answer: 2, explain: 'C++23 allows multi-argument `operator[]`.' },
    { q: 'What does `opt.transform(f)` return if `opt` is empty?', options: ['Throws', 'An empty optional (f not called)', '`f()`', 'UB'], answer: 1, explain: 'Monadic operations skip empty optionals.' },
    { q: 'How should a function that only reads a `Widget` owned by a `unique_ptr` take it?', options: ['`std::unique_ptr<Widget>`', '`const std::unique_ptr<Widget>&`', '`const Widget&`', '`std::shared_ptr<Widget>`'], answer: 2, explain: 'Don\'t couple non-owning functions to the ownership strategy.' },
    { q: 'What problem does `weak_ptr` solve?', options: ['Slow copies', 'Reference cycles that would leak with `shared_ptr`', 'Thread safety', 'Null pointers'], answer: 1, explain: 'An observer that doesn\'t contribute to the count.' },
  ],
}
