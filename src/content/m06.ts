import type { Module } from './types'

export const m06: Module = {
  n: 6,
  title: 'Essential Operations',
  tour: '6 · Essential Operations',
  summary: 'Copy, move and destroy: how C++ objects are born, duplicated, handed over and cleaned up. Plus operator overloading and user-defined literals.',
  topics: ['Copy constructor & assignment', 'Move semantics', 'Rule of zero / five', 'Resource management', 'Operator overloading & <=>', 'User-defined literals'],
  cpp23: [
    'Deducing `this` (explicit object parameter) removes const/non-const duplicate overloads.',
    'Multidimensional subscript: `operator[](i, j)` is now legal.',
    'Static `operator()` and `operator[]` (no `this`, cheaper lambdas/functors).',
    '`uz` / `z` literal suffixes for `size_t` / signed size.',
  ],
  lessons: [
    {
      id: 'ops',
      title: 'The six special members',
      blocks: [
        { kind: 'analogy', text: 'Think of an object as a house with furniture (its resources). There are six things you can do with it: build it (constructor), build a replica (copy constructor), make an existing house look like another (copy assignment), move the furniture into a new house (move constructor), move furniture into an existing house (move assignment), and demolish it (destructor).' },
        { kind: 'code', code: `class X {
public:
    X(Sometype);              // ordinary constructor
    X();                      // default constructor
    X(const X&);              // copy constructor
    X(X&&);                   // move constructor
    X& operator=(const X&);   // copy assignment
    X& operator=(X&&);        // move assignment
    ~X();                     // destructor
};` },
        { kind: 'p', text: 'The compiler generates these for you, member by member, when it can. For a class made only of well-behaved members (`std::string`, `std::vector`, `int`) the generated versions are exactly right. That is the **rule of zero**: write none of them.' },
        { kind: 'code', code: `struct Order {                // rule of zero: nothing to write
    std::string id;
    std::vector<Fill> fills;
    double limit;
};   // copies, moves and destroys correctly, automatically` },
        { kind: 'p', text: 'When a class directly manages a resource (a raw pointer, a file handle, a socket), the generated copy just copies the **handle**, not the resource. Then you need the **rule of five**: if you write any of destructor, copy ctor, copy assignment, move ctor, move assignment, you probably need all five.' },
        { kind: 'code', code: `class Buffer {
public:
    Buffer(const Buffer&) = delete;              // explicitly forbid copying
    Buffer& operator=(const Buffer&) = delete;
    Buffer(Buffer&&) noexcept = default;         // keep compiler-generated moves
    Buffer& operator=(Buffer&&) noexcept = default;
    ~Buffer() = default;
};`, caption: '`= default` asks for the generated version; `= delete` forbids the operation. Both document intent.' },
        { kind: 'check', q: 'A struct has members `std::string name; std::vector<int> data;`. How many special members should you write?', options: ['All five', 'Just the destructor', 'Copy constructor only', 'None (rule of zero)'], answer: 3, hint: 'Do the members already know how to copy, move and clean themselves up?', explain: 'Every member manages itself, so the compiler-generated operations are correct and optimal.' },
      ],
    },
    {
      id: 'copy',
      title: 'Copying a resource handle',
      blocks: [
        { kind: 'analogy', text: 'Our hand-rolled `Vector` holds a pointer to a heap block. A naive copy duplicates the **address**, so two houses now share one set of furniture. When the first is demolished, the second has nothing but a dangling address.' },
        { kind: 'stepper', title: 'Step through: shallow copy vs deep copy', code: [
          'Vector a {1, 2, 3};',
          'Vector b = a;       // default (shallow) copy',
          '}  // scope ends: ~b, then ~a',
          '',
          '// with a proper copy constructor:',
          'Vector c = a;       // deep copy',
        ], steps: [
          { line: 1, note: '`a` owns a heap block.', memory: [{ name: 'a', value: 'elem → 0xA0, sz 3', kind: 'ptr' }, { name: '0xA0', value: '[1, 2, 3]', kind: 'heap' }] },
          { line: 2, note: 'The generated copy copies `elem` (the address) and `sz`. Both point at the same block.', memory: [{ name: 'a', value: 'elem → 0xA0, sz 3', kind: 'ptr' }, { name: 'b', value: 'elem → 0xA0, sz 3', kind: 'ptr', note: 'same address!' }, { name: '0xA0', value: '[1, 2, 3]', kind: 'heap' }] },
          { line: 3, note: '`~b` frees 0xA0. Then `~a` frees 0xA0 **again**: a double free. UB, often a crash.', memory: [{ name: 'b', value: 'destroyed', kind: 'dead' }, { name: '0xA0', value: 'freed', kind: 'dead' }, { name: 'a', value: 'elem → 0xA0 (dangling)', kind: 'ptr', note: 'about to delete[] freed memory' }] },
          { line: 6, note: 'A proper copy constructor allocates a **new** block and copies the elements.', memory: [{ name: 'a', value: 'elem → 0xA0, sz 3', kind: 'ptr' }, { name: '0xA0', value: '[1, 2, 3]', kind: 'heap' }, { name: 'c', value: 'elem → 0xB0, sz 3', kind: 'ptr' }, { name: '0xB0', value: '[1, 2, 3]', kind: 'heap', note: 'independent copy' }] },
        ] },
        { kind: 'code', code: `Vector::Vector(const Vector& a)                 // copy constructor
    : elem{new double[a.sz]}, sz{a.sz} {
    std::copy(a.elem, a.elem + sz, elem);
}

Vector& Vector::operator=(const Vector& a) {    // copy assignment
    if (this == &a) return *this;               // self-assignment guard
    double* p = new double[a.sz];               // allocate first (may throw)
    std::copy(a.elem, a.elem + a.sz, p);
    delete[] elem;                               // then release the old block
    elem = p;
    sz = a.sz;
    return *this;
}` },
        { kind: 'check', q: 'Why allocate the new block **before** deleting the old one in copy assignment?', options: ['It\'s faster', 'If `new` throws, the object is left unchanged (strong exception guarantee)', 'Required by the standard', 'To avoid self-assignment'], answer: 1, hint: 'What if `new` fails halfway through?', explain: 'Deleting first and then failing to allocate would leave a dangling `elem`, which breaks the invariant.' },
      ],
    },
    {
      id: 'move',
      title: 'Move semantics',
      blocks: [
        { kind: 'analogy', text: 'Copying a house means building an identical one and buying all new furniture. **Moving** means driving the furniture van from the old house to the new one and leaving the old house empty but still standing. It is far cheaper, and fine when nobody needs the old house anymore.' },
        { kind: 'p', text: 'An **rvalue** is a value with no name that is about to disappear: a temporary, a function\'s return value. `T&&` is an **rvalue reference**: it binds to such values, signalling "you may steal from this".' },
        { kind: 'code', code: `Vector::Vector(Vector&& a) noexcept     // move constructor
    : elem{a.elem}, sz{a.sz} {             // grab a's block
    a.elem = nullptr;                       // leave a empty but valid
    a.sz = 0;
}

Vector operator+(const Vector& a, const Vector& b) {
    Vector res(a.size());
    for (int i = 0; i != a.size(); ++i) res[i] = a[i] + b[i];
    return res;       // moved (or elided): no copy of the elements
}` },
        { kind: 'stepper', title: 'Step through: std::move hands over the furniture', code: [
          'std::vector<std::string> book {"AAPL", "MSFT"};',
          'auto snapshot = book;            // copy',
          'auto archive = std::move(book);  // move',
          'book.push_back("NVDA");          // fine: book is valid, empty',
        ], steps: [
          { line: 1, note: '`book` owns a heap array of 2 strings.', memory: [{ name: 'book', value: 'data → 0x100, size 2', kind: 'ptr' }, { name: '0x100', value: '["AAPL", "MSFT"]', kind: 'heap' }] },
          { line: 2, note: 'Copy: a new heap array, and every string duplicated.', memory: [{ name: 'book', value: 'data → 0x100, size 2', kind: 'ptr' }, { name: '0x100', value: '["AAPL", "MSFT"]', kind: 'heap' }, { name: 'snapshot', value: 'data → 0x200, size 2', kind: 'ptr' }, { name: '0x200', value: '["AAPL", "MSFT"]', kind: 'heap' }] },
          { line: 3, note: '`std::move` is just a cast to `&&`. The **move constructor** then steals `book`\'s pointer. Three words copied, no allocation.', memory: [{ name: 'book', value: 'data → null, size 0', kind: 'dead', note: 'moved-from: valid but unspecified (empty in practice)' }, { name: 'archive', value: 'data → 0x100, size 2', kind: 'ptr' }, { name: '0x100', value: '["AAPL", "MSFT"]', kind: 'heap', note: 'same block, new owner' }, { name: 'snapshot', value: 'data → 0x200, size 2', kind: 'ptr' }] },
          { line: 4, note: 'A moved-from object can be assigned to or reused. Just don\'t assume what it contains.', memory: [{ name: 'book', value: 'data → 0x300, size 1', kind: 'ptr' }, { name: '0x300', value: '["NVDA"]', kind: 'heap' }, { name: 'archive', value: 'data → 0x100, size 2', kind: 'ptr' }] },
        ] },
        { kind: 'list', items: [
          '`std::move(x)` doesn\'t move anything. It is a cast that says "treat `x` as an rvalue". The move constructor or assignment does the work.',
          'After a move, the source is in a **valid but unspecified** state. You may destroy it or assign to it.',
          'Mark move operations `noexcept`, or `std::vector` will copy instead when it grows.',
          'Don\'t write `return std::move(local);`. It can prevent copy elision. Plain `return local;` already moves.',
        ] },
        { kind: 'p', text: 'Garbage-collected languages never need this: everything big sits behind a reference, and the GC works out who still uses it. C++ has no GC, so ownership transfer is **explicit**, and it is always clear who frees what. Rust took this idea and made it the default.' },
        { kind: 'check', q: 'What can you say about `s` afterwards?', code: `std::string s = "hello";
std::vector<std::string> a;
a.push_back(std::move(s));
// what about s?`, options: ['`s` is still "hello"', '`s` is valid but unspecified (in practice empty)', 'Using `s` at all is UB', '`s` is destroyed'], answer: 1, hint: 'Moved-from objects aren\'t demolished. The furniture was taken out.', explain: 'The standard library guarantees moved-from objects are valid but unspecified. You can assign to `s` or destroy it safely, but don\'t rely on its value.' },
      ],
    },
    {
      id: 'operators',
      title: 'Operators & conventional operations',
      blocks: [
        { kind: 'analogy', text: 'Operator overloading teaches your type the house rules everyone already knows: `+` adds, `==` compares, `<<` prints. Users then use your type without reading a manual. Break the conventions (making `+` subtract) and you have built a booby trap.' },
        { kind: 'code', code: `struct Money {
    std::int64_t pence{};

    Money& operator+=(Money o) { pence += o.pence; return *this; }
    friend Money operator+(Money a, Money b) { return a += b; }

    // C++20: one line gives ==, !=, <, <=, >, >= (memberwise)
    auto operator<=>(const Money&) const = default;
};

Money a{150}, b{275};
if (a < b) std::println("{}", (a + b).pence);   // 425` },
        { kind: 'list', items: [
          '`operator<=>` ("spaceship") returns an ordering. `= default` generates all six comparisons memberwise.',
          'Define `+` in terms of `+=` so they can\'t disagree.',
          'Symmetric binary operators are usually non-member (`friend` or free functions) so both operands convert alike.',
          'Other conventional operations: `swap` (noexcept), `std::hash<T>` specialisation for unordered containers, and `std::formatter<T>` for `std::println` (module 11).',
        ] },
        { kind: 'new23', text: 'C++23 allows a **multidimensional subscript**, `double& operator[](std::size_t r, std::size_t c)`, so matrices can finally be written `m[i, j]` instead of `m(i, j)` or `m[i][j]` proxies. `std::mdspan` uses it.' },
        { kind: 'code', code: `class Matrix {
    std::vector<double> data;
    std::size_t cols;
public:
    Matrix(std::size_t r, std::size_t c) : data(r * c), cols{c} {}

    // C++23 deducing this: ONE function serves const and non-const objects
    template<class Self>
    auto&& operator[](this Self&& self, std::size_t r, std::size_t c) {
        return std::forward<Self>(self).data[r * self.cols + c];
    }
};

Matrix m(3, 3);
m[1, 2] = 4.0;` },
        { kind: 'check', q: 'What does `auto operator<=>(const T&) const = default;` give you?', options: ['Only `<=>`', '`<`, `<=`, `>`, `>=` and also `==`/`!=`', 'Only `==`', 'Nothing until you define each one'], answer: 1, hint: 'A defaulted spaceship comes with a bonus.', explain: 'Defaulting `<=>` also implicitly defaults `operator==`, so all six comparisons work memberwise.' },
      ],
    },
    {
      id: 'literals',
      title: 'User-defined literals',
      blocks: [
        { kind: 'analogy', text: 'Literal suffixes are units on a number: `5` is ambiguous, `5km` isn\'t. C++ lets you invent your own units so the type system catches "added metres to seconds" bugs.' },
        { kind: 'code', code: `using namespace std::literals;          // opt in to the standard suffixes

auto s  = "hello"s;      // std::string, not const char*
auto sv = "hello"sv;     // std::string_view
auto t  = 250ms;         // std::chrono::milliseconds
auto n  = 42uz;          // C++23: std::size_t

// your own:
struct Bps { double v; };                       // basis points
constexpr Bps operator""_bps(long double x) { return {static_cast<double>(x)}; }
constexpr Bps operator""_bps(unsigned long long x) { return {static_cast<double>(x)}; }

auto spread = 2.5_bps;` },
        { kind: 'list', items: [
          'User-defined suffixes **must** start with `_`. Names without it are reserved for the standard.',
          'The allowed parameter types are fixed: `unsigned long long`, `long double`, `const char*`, `char`, or `(const char*, std::size_t)` for strings.',
          'Make them `constexpr` (or `consteval`) so the conversion costs nothing at runtime.',
        ] },
        { kind: 'check', q: 'What type is `"abc"s`?', options: ['`const char*`', '`std::string`', '`std::string_view`', '`char[4]`'], answer: 1, hint: 'The `s` suffix comes from `std::literals::string_literals`.', explain: '`"abc"s` is a `std::string`. `"abc"sv` is a `std::string_view`. Plain `"abc"` is a `const char[4]`.' },
      ],
    },
  ],
  quiz: [
    { q: 'The rule of zero says…', options: ['Never use pointers', 'If members manage themselves, write none of the special members', 'Initialise everything to zero', 'Classes should have zero virtual functions'], answer: 1, explain: 'Let RAII members (`string`, `vector`, `unique_ptr`) handle it, and the generated operations are correct.' },
    { q: 'What does `std::move(x)` actually do?', options: ['Moves `x`\'s memory', 'Casts `x` to an rvalue reference', 'Destroys `x`', 'Copies `x` then clears it'], answer: 1, explain: 'It is a cast. The move constructor or assignment chosen as a result does the stealing.' },
    { q: 'A class with a raw owning pointer uses compiler-generated copying. Destroying both copies causes…', options: ['Nothing bad', 'A memory leak', 'A double free (UB)', 'A compile error'], answer: 2, explain: 'Both copies `delete[]` the same address. Write the rule of five or use RAII members.' },
    { q: 'State of a moved-from `std::string`?', options: ['Destroyed', 'Valid but unspecified', 'Guaranteed empty', 'UB to touch'], answer: 1, explain: 'You can assign, clear or destroy it. Don\'t depend on its contents.' },
    { q: 'Why should a move constructor be `noexcept`?', options: ['The compiler requires it', 'So `std::vector` uses it during reallocation instead of copying', 'For thread safety', 'To allow inlining'], answer: 1, explain: '`vector` uses `std::move_if_noexcept` to keep its strong exception guarantee.' },
    { q: 'Which is new in C++23?', options: ['`operator<=>`', '`m[i, j]` multidimensional subscript', 'User-defined literals', 'Move semantics'], answer: 1, explain: 'Spaceship is C++20, UDLs are C++11, move is C++11. Multi-arg `operator[]` is C++23.' },
    { q: 'Which line is a mistake?', options: ['`return local;`', '`return std::move(local);`', '`v.push_back(std::move(s));`', '`auto b = std::move(a);`'], answer: 1, explain: '`std::move` on a returned local can block copy elision. The plain return already moves.' },
    { q: 'What must a user-defined literal suffix start with?', options: ['A letter', 'An underscore', '`op`', 'Nothing in particular'], answer: 1, explain: 'Suffixes without `_` are reserved for the standard library.' },
    { q: 'What does `X(const X&) = delete;` achieve?', options: ['Deletes all X objects', 'Makes X non-copyable', 'Makes X non-movable', 'Removes the default constructor'], answer: 1, explain: 'Copy construction becomes a compile error. Typical for unique resources like mutexes and sockets.' },
  ],
}
