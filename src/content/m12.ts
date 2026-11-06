import type { Module } from './types'

export const m12: Module = {
  n: 12,
  title: 'Containers',
  tour: '12 · Containers',
  summary: 'vector, list, map, unordered_map and the new flat_map: how each is laid out in memory, what each costs, and which one to reach for.',
  topics: ['vector', 'list & forward_list', 'map', 'unordered_map', 'flat_map', 'Allocators', 'Choosing a container'],
  cpp23: [
    '`std::flat_map` / `std::flat_set`: sorted-vector maps with cache-friendly lookups.',
    '`insert_range`, `append_range`, `prepend_range`, `assign_range` on containers.',
    'Construct any container from a range: `std::vector<int> v(std::from_range, some_view);`',
  ],
  lessons: [
    {
      id: 'vector',
      title: 'vector',
      blocks: [
        { kind: 'analogy', text: "A `vector` is a row of numbered lockers in one corridor. Finding locker 500 is instant, and walking the row is fast because the lockers are side by side. When the corridor fills up, everyone moves to a corridor twice as long, and any directions you'd written down to the old lockers are now wrong." },
        { kind: 'code', code: `std::vector<double> px;              // empty: size 0, capacity 0
px.reserve(1'000);                   // allocate once up front
px.push_back(2390.5);                // copy/move an element in
px.emplace_back(2391.0);             // construct in place
px.size();  px.capacity();  px.empty();
px.front(); px.back();
px.insert(px.begin(), 2389.9);       // O(n): shifts everything right
px.erase(px.begin() + 1);            // O(n): shifts everything left
std::erase_if(px, [](double p) { return p < 0; });   // remove matching elements (C++20)
px.clear();                          // size 0, keeps capacity` },
        { kind: 'stepper', title: 'Step through: growth invalidates pointers', code: [
          'std::vector<int> v {1, 2};      // capacity 2',
          'int* first = &v[0];',
          'v.push_back(3);                 // full: reallocate',
          'std::println("{}", *first);     // ???',
        ], steps: [
          { line: 1, note: 'Two elements in a block with room for exactly two.', memory: [{ name: 'v', value: 'data → 0x100, size 2, cap 2', kind: 'ptr' }, { name: '0x100', value: '[1, 2]', kind: 'heap' }] },
          { line: 2, note: '`first` points at element 0.', memory: [{ name: 'v', value: 'data → 0x100, size 2, cap 2', kind: 'ptr' }, { name: '0x100', value: '[1, 2]', kind: 'heap' }, { name: 'first', value: '→ 0x100', kind: 'ptr' }] },
          { line: 3, note: 'No room left. The vector allocates a bigger block (typically 1.5× or 2×), moves the elements, adds 3 and **frees the old block**.', memory: [{ name: 'v', value: 'data → 0x200, size 3, cap 4', kind: 'ptr' }, { name: '0x200', value: '[1, 2, 3, _]', kind: 'heap' }, { name: '0x100', value: 'freed', kind: 'dead' }, { name: 'first', value: '→ 0x100 (dangling)', kind: 'ptr' }] },
          { line: 4, note: 'Reading through `first` is undefined behaviour. The same goes for iterators and references into `v`.', memory: [{ name: 'first', value: 'dangling', kind: 'dead' }] },
        ] },
        { kind: 'list', items: [
          '`push_back` is **amortised O(1)**: occasional reallocations, cheap on average. `reserve` removes them entirely when you know the size.',
          'Growth invalidates **all** pointers, references and iterators. Insert/erase invalidate those at or after the change point.',
          'Contiguous memory means great cache behaviour. For most workloads, a `vector` beats a "theoretically better" structure.',
        ] },
        { kind: 'pitfall', text: 'Don\'t push into a vector while range-for-looping over it: the loop\'s iterators can be invalidated mid-loop. Collect changes and apply them afterwards, or loop by index.' },
        { kind: 'check', q: 'You will add exactly 10,000 elements. What should you call first?', options: ['`v.resize(10000)`', '`v.reserve(10000)`', '`v.shrink_to_fit()`', 'Nothing helps'], answer: 1, hint: 'One of these creates 10,000 elements; the other only makes room.', explain: '`reserve` allocates capacity without creating elements, so `push_back` never reallocates. `resize` would create 10,000 default elements you then append after.' },
      ],
    },
    {
      id: 'list',
      title: 'list & forward_list',
      blocks: [
        { kind: 'analogy', text: "A linked list is a treasure hunt: each clue tells you where the next one is hidden. Adding a clue in the middle is easy (rewrite two notes), but finding clue 500 means following 499 notes scattered all over town, and the CPU hates scattered memory." },
        { kind: 'code', code: `std::list<Order> book;
auto it = book.insert(book.end(), Order{"A"});   // O(1) given an iterator
book.push_front(Order{"B"});
book.erase(it);                                   // O(1); other iterators stay valid
book.splice(book.begin(), other_list);            // move nodes between lists, no copying

std::forward_list<int> fl {1, 2, 3};              // singly linked: smaller, only forward
fl.push_front(0);` },
        { kind: 'list', items: [
          '**Strengths**: O(1) insert/erase anywhere once you have an iterator, iterators that stay valid through other insertions and erasures, and `splice`.',
          '**Weaknesses**: no indexing, one heap allocation per element, poor cache locality, and 16+ bytes of pointer overhead per node.',
          "In practice, `vector` usually wins even for middle insertions up to surprisingly large sizes, because shifting contiguous memory is that fast. Measure before choosing `list`.",
        ] },
        { kind: 'check', q: 'Which operation is O(1) on `std::list` but O(n) on `std::vector`?', options: ['Accessing element i', 'Inserting in the middle given an iterator', 'Appending at the end', 'Getting the size'], answer: 1, hint: 'Rewrite two notes vs shift everything after.', explain: 'Middle insertion is O(1) on a list but O(n) on a vector. Indexing is the reverse.' },
      ],
    },
    {
      id: 'maps',
      title: 'map, unordered_map & flat_map',
      blocks: [
        { kind: 'analogy', text: "A `map` is a filing cabinet kept in alphabetical order: lookups take a few comparisons, and you can read it in order. An `unordered_map` is a cloakroom: hand over a ticket (the hash) and the attendant goes straight to the right hook, but the coats aren't in any order. A `flat_map` is the alphabetical list printed on one sheet: fastest to read, slow to insert into." },
        { kind: 'code', code: `std::map<std::string, double> last;           // red-black tree, ordered by key
last["XAU"] = 2390.5;                          // inserts if missing!
last.insert_or_assign("XAG", 28.1);
if (auto it = last.find("XAU"); it != last.end()) std::println("{}", it->second);
if (last.contains("EUR")) {}                   // C++20
for (const auto& [sym, px] : last) {}          // sorted by symbol
auto it = last.lower_bound("X");               // first key >= "X": range queries

std::unordered_map<std::string, double> fast;  // hash table: average O(1)
fast.try_emplace("XAU", 2390.5);               // no-op if the key exists
fast.reserve(10'000);                          // avoid rehashing` },
        { kind: 'pitfall', text: '`m[key]` **inserts** a default value when the key is missing. Use `find`, `contains` or `at` (which throws) when you only want to read. It is also why `operator[]` can\'t be used on a `const map`.' },
        { kind: 'h', text: 'Custom keys' },
        { kind: 'code', code: `struct Instrument { std::string venue, symbol;
    auto operator<=>(const Instrument&) const = default; };   // enough for std::map

template<> struct std::hash<Instrument> {                      // needed for unordered_map
    std::size_t operator()(const Instrument& i) const noexcept {
        return std::hash<std::string>{}(i.venue) ^ (std::hash<std::string>{}(i.symbol) << 1);
    }
};` },
        { kind: 'new23', text: "`std::flat_map` (`<flat_map>`) stores keys and values in two sorted vectors. Lookups are binary searches over contiguous memory, much faster than chasing tree nodes, and iteration is a straight scan. Inserting is O(n). Ideal for data built once and read often, such as a reference-data table or the price levels of a small order book." },
        { kind: 'list', items: [
          '`map`: O(log n) everything, ordered iteration, stable iterators. Use it when order or range queries matter.',
          '`unordered_map`: O(1) average lookup, no order. Use it for big key→value lookups. Pick a decent hash.',
          '`flat_map`: fastest reads and iteration, slow inserts. Use it for read-mostly data.',
          '`set` / `unordered_set` / `flat_set`: the same structures, keys only.',
        ] },
        { kind: 'check', q: 'What does `std::println("{}", m.size())` print?', code: `std::map<std::string, int> m;
if (m["AAPL"] > 0) {}
if (m.contains("MSFT")) {}`, options: ['0', '1', '2', 'Compile error'], answer: 1, hint: 'One of those lookups has a side effect.', explain: '`m["AAPL"]` inserted `{"AAPL", 0}`. `contains` only looks.' },
      ],
    },
    {
      id: 'choosing',
      title: 'Allocators & choosing',
      blocks: [
        { kind: 'analogy', text: "An allocator is the container's supplier of storage. The default is the general store (`new`/`delete`). Polymorphic memory resources (`std::pmr`) let you swap in a local warehouse, such as one pre-allocated buffer that is thrown away all at once. That is very fast for short-lived bursts like processing one message." },
        { kind: 'code', code: `std::array<std::byte, 64 * 1024> buf;                       // stack buffer
std::pmr::monotonic_buffer_resource arena {buf.data(), buf.size()};
std::pmr::vector<int> ids {&arena};                          // allocations come from buf
std::pmr::unordered_map<int, double> seen {&arena};
// ... use them; everything is released together when arena is destroyed` },
        { kind: 'h', text: 'Which container?' },
        { kind: 'list', items: [
          '**Default: `std::vector`.** Seriously. Reach for something else only with a reason.',
          'Fixed size known at compile time: `std::array`.',
          'Key → value lookup, large: `std::unordered_map`. Needs order or range queries: `std::map`. Read-mostly: `std::flat_map`.',
          'Queue at both ends: `std::deque`. FIFO / LIFO / priority: `std::queue`, `std::stack`, `std::priority_queue` (adaptors over other containers).',
          'Many middle insertions with stable iterators, measured to matter: `std::list`.',
        ] },
        { kind: 'pitfall', text: "Big-O notation hides constants. A linear scan of a 100-element `vector` often beats a hash lookup. For latency-sensitive code, benchmark with realistic sizes; don't choose from the textbook table alone." },
        { kind: 'check', q: 'You need the lowest-priced order at any moment, with frequent inserts. Which adaptor fits?', options: ['`std::stack`', '`std::queue`', '`std::priority_queue` with `std::greater`', '`std::list`'], answer: 2, hint: '"Always give me the smallest" is the job of a heap.', explain: '`priority_queue` is a binary heap: O(log n) push/pop, O(1) top. It is a max-heap by default; `std::greater` makes it a min-heap.' },
      ],
    },
  ],
  quiz: [
    { q: 'What happens to iterators into a `vector` when it reallocates?', options: ['They update automatically', 'They are all invalidated', 'Only `end()` is invalidated', 'Nothing'], answer: 1, explain: 'The elements moved to new memory, so old pointers, references and iterators dangle.' },
    { q: 'What is `push_back` on a vector?', options: ['Always O(1)', 'Amortised O(1)', 'O(log n)', 'O(n)'], answer: 1, explain: 'Geometric growth makes reallocations rare enough to average out.' },
    { q: 'What does `m[key]` do on a `std::map` when the key is absent?', options: ['Throws', 'Returns `nullptr`', 'Inserts a value-initialised element', 'UB'], answer: 2, explain: 'Use `find`, `contains` or `at` for read-only lookups.' },
    { q: 'What do you need to use a custom type as an `unordered_map` key?', options: ['`operator<`', 'A hash (e.g. `std::hash` specialisation) and `==`', 'Inheriting from `Hashable`', 'Nothing'], answer: 1, explain: '`std::map` needs ordering (`<`); hash containers need hashing plus equality.' },
    { q: '`std::flat_map` is best for…', options: ['Frequent inserts', 'Read-mostly lookups and iteration', 'Thread-safe access', 'Very large keys only'], answer: 1, explain: 'Sorted contiguous storage: fast reads, O(n) inserts.' },
    { q: 'Why is `vector` often faster than `list` even for middle insertions?', options: ['It uses SIMD for everything', 'Contiguous memory is cache-friendly; list nodes are scattered', 'Lists are implemented badly', 'It isn\'t; list is always faster'], answer: 1, explain: 'Memory access patterns dominate on modern CPUs.' },
    { q: '`v.reserve(n)` vs `v.resize(n)`:', options: ['Identical', 'reserve allocates capacity; resize changes the element count', 'resize is faster', 'reserve creates n elements'], answer: 1, explain: 'After `reserve(n)`, `size()` is unchanged.' },
    { q: 'Which is ordered by key?', options: ['`unordered_map`', '`map`', 'Both', 'Neither'], answer: 1, explain: '`map` (and `flat_map`) iterate in key order.' },
  ],
}
