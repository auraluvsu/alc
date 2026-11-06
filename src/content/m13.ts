import type { Module } from './types'

export const m13: Module = {
  n: 13,
  title: 'Algorithms',
  tour: '13 · Algorithms',
  summary: 'Iterators as the glue between containers and algorithms, the most useful standard algorithms, predicates and projections, and running algorithms in parallel.',
  topics: ['Using iterators', 'Iterator types', 'Using algorithms', 'Predicates & projections', 'Parallel algorithms'],
  cpp23: [
    '`std::ranges::fold_left` / `fold_right` / `fold_left_first`: a proper ranges reduce.',
    '`ranges::contains`, `contains_subrange`, `starts_with`, `ends_with`, `find_last`.',
    '`ranges::iota`, `ranges::shift_left` / `shift_right`.',
  ],
  lessons: [
    {
      id: 'iterators',
      title: 'Iterators',
      blocks: [
        { kind: 'analogy', text: "An iterator is a bookmark. Every container hands out bookmarks that know how to move to the next page and read the current one. Algorithms only ever deal with bookmarks, so a single `find` works on a vector, a list, a file stream or a range you wrote yourself." },
        { kind: 'code', code: `std::vector<int> v {3, 1, 4, 1, 5};
auto first = v.begin();          // bookmark on the first element
auto last  = v.end();            // bookmark ONE PAST the last element
for (auto it = first; it != last; ++it)
    std::println("{}", *it);     // * reads, ++ moves on

auto it = std::find(v.begin(), v.end(), 4);   // classic: iterator pair
if (it != v.end()) {
    std::println("found at index {}", it - v.begin());
}` },
        { kind: 'p', text: "Sequences are **half-open**: `[begin, end)`. `end()` is a sentinel you compare against and never dereference. An empty range has `begin == end`, and \"not found\" is reported by returning `end`." },
        { kind: 'h', text: 'Iterator categories' },
        { kind: 'list', items: [
          '**Input**: read once, forward only (reading a stream).',
          '**Forward**: read many times, forward only (`forward_list`, `unordered_map`).',
          '**Bidirectional**: forward and back (`list`, `map`).',
          '**Random access**: jump with `it + n`, `it[n]`, `it2 - it1` (`deque`).',
          '**Contiguous**: random access plus elements adjacent in memory (`vector`, `array`, `string`).',
        ] },
        { kind: 'p', text: 'Algorithms state the category they need as a concept. `std::sort` needs random access, which is why you can\'t `std::sort` a `std::list`. It has its own `list.sort()` member instead.' },
        { kind: 'check', q: 'What is `v.end()` for an empty vector?', options: ['`nullptr`', 'Equal to `v.begin()`', 'Undefined', 'It throws'], answer: 1, hint: 'Half-open range with nothing in it.', explain: 'For an empty range, begin and end are equal, so loops run zero times naturally.' },
      ],
    },
    {
      id: 'using',
      title: 'Using algorithms',
      blocks: [
        { kind: 'analogy', text: "The `<algorithm>` header is a toolbox of about 100 tested, optimised tools. Writing your own loop to find, count or sort is like carving your own screwdriver: possible, slower, and it slips. Naming the algorithm also tells the reader your intent immediately." },
        { kind: 'code', code: `std::vector<double> px {2390.5, 2388.1, 2395.0, 2391.7};

std::ranges::sort(px);                                   // ascending
std::ranges::sort(px, std::greater{});                   // descending
auto mx  = std::ranges::max(px);
auto [lo, hi] = std::ranges::minmax(px);
auto n   = std::ranges::count_if(px, [](double p) { return p > 2390; });
bool any = std::ranges::any_of(px, [](double p) { return p > 2394; });
auto it  = std::ranges::find(px, 2391.7);
bool has = std::ranges::contains(px, 2391.7);            // C++23

std::vector<double> rets;
std::ranges::transform(px | std::views::drop(1), px, std::back_inserter(rets),
                       [](double now, double prev) { return now / prev - 1; });` },
        { kind: 'list', items: [
          '`std::ranges::` algorithms take the whole container. The older `std::` versions take an iterator pair, and you\'ll see both.',
          'Output goes to an iterator. `std::back_inserter(v)` turns writes into `push_back` calls, so the destination grows.',
          'Removing elements: `std::erase_if(v, pred)` (C++20). The old erase–remove idiom `v.erase(std::remove_if(...), v.end())` is still everywhere in existing code.',
          'Sorted data unlocks binary search: `ranges::lower_bound`, `upper_bound`, `equal_range`, `binary_search`.',
        ] },
        { kind: 'pitfall', text: "`std::remove_if` doesn't remove anything. It shuffles the keepers to the front and returns where the junk starts. Without the following `erase`, the vector still has its old size. Prefer `std::erase_if`." },
        { kind: 'new23', text: '`std::ranges::fold_left(range, init, op)` is the ranges-era reduce: `fold_left(px, 0.0, std::plus{})`. `fold_left_first` uses the first element as the initial value and returns an `optional` (empty for an empty range).' },
        { kind: 'check', q: 'What is `v.size()` after this?', code: `std::vector<int> v {1, 2, 3, 4};
std::remove_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; });`, options: ['2', '4', '0', 'UB'], answer: 1, hint: 'Did anything actually call erase?', explain: '`remove_if` only reorders and returns a new logical end. The size stays 4 until you erase from that point.' },
      ],
    },
    {
      id: 'predicates',
      title: 'Predicates & projections',
      blocks: [
        { kind: 'analogy', text: "A predicate is a question an algorithm asks about each element: \"is this one negative?\". A projection is a pair of glasses the algorithm puts on before looking: \"look only at each trade's price\". Together they let one `sort` handle every sorting job without you writing a comparator class." },
        { kind: 'code', code: `struct Trade { std::string sym; double px; int qty; };
std::vector<Trade> trades = load();

std::ranges::sort(trades, {}, &Trade::px);                  // sort by price (projection)
std::ranges::sort(trades, std::greater{}, &Trade::qty);     // by qty, descending
auto big = std::ranges::find_if(trades, [](int q) { return q > 100; }, &Trade::qty);

// multi-key ordering: compare tuples
std::ranges::sort(trades, {}, [](const Trade& t) { return std::tie(t.sym, t.px); });` },
        { kind: 'list', items: [
          'A comparator must be a **strict weak ordering**: return `true` only when a is strictly before b. Use `<`, never `<=`.',
          'A projection can be a member pointer (`&Trade::px`) or any callable.',
          'Predicates should be pure: no side effects, same answer every time.',
        ] },
        { kind: 'compare',
          python: `trades.sort(key=lambda t: t.px)
trades.sort(key=lambda t: t.qty, reverse=True)
big = next((t for t in trades if t.qty > 100), None)`,
          ts: `trades.sort((a, b) => a.px - b.px)
trades.sort((a, b) => b.qty - a.qty)
const big = trades.find(t => t.qty > 100)`,
          go: `slices.SortFunc(trades, func(a, b Trade) int {
    return cmp.Compare(a.Px, b.Px)
})
i := slices.IndexFunc(trades, func(t Trade) bool {
    return t.Qty > 100
})`,
          java: `trades.sort(Comparator.comparingDouble(Trade::px));
trades.sort(Comparator.comparingInt(Trade::qty).reversed());
var big = trades.stream()
    .filter(t -> t.qty() > 100).findFirst();`,
          cpp: `std::ranges::sort(trades, {}, &Trade::px);
std::ranges::sort(trades, std::greater{}, &Trade::qty);
auto big = std::ranges::find_if(trades,
    [](int q) { return q > 100; }, &Trade::qty);`,
          note: 'C++ comparators return `bool` ("is a before b?"), not a negative/zero/positive number.' },
        { kind: 'check', q: 'Why is `[](int a, int b) { return a <= b; }` a broken comparator for `sort`?', options: ['It is fine', 'It says equal elements come before each other, violating strict weak ordering (UB)', 'It sorts descending', '`<=` is not allowed in lambdas'], answer: 1, hint: 'What does it return for `cmp(x, x)`?', explain: 'A comparator must return false for equal elements. With `<=`, `sort` may run off the end of the range; this is a real crash source.' },
      ],
    },
    {
      id: 'parallel',
      title: 'Parallel algorithms',
      blocks: [
        { kind: 'analogy', text: "An execution policy is telling the foreman how many workers to use: one worker in order (`seq`), a crew splitting the job (`par`), or a crew whose members each also use both hands (`par_unseq`, i.e. threads plus SIMD vector instructions)." },
        { kind: 'code', code: `#include <execution>
std::vector<double> big(50'000'000);

std::sort(std::execution::par, big.begin(), big.end());
double total = std::reduce(std::execution::par_unseq, big.begin(), big.end(), 0.0);
std::for_each(std::execution::par, big.begin(), big.end(), [](double& x) { x = std::sqrt(x); });` },
        { kind: 'list', items: [
          'Policies: `seq`, `par`, `par_unseq`, `unseq`. They are a **permission**, not a guarantee: the library may still run sequentially.',
          '`std::reduce` (not `accumulate`) is the parallel-friendly sum. It may reorder operations, so floating-point results can differ slightly.',
          'Your lambda must be safe to run concurrently: no unsynchronised writes to shared state. With `par_unseq`, no locks at all.',
          'Parallel policies apply to the iterator-pair `std::` algorithms; the `std::ranges::` versions don\'t take policies yet.',
          'With GCC/libstdc++ they need Intel TBB (`-ltbb`). Parallelism pays off only for large inputs (roughly 10⁵+ elements of real work).',
        ] },
        { kind: 'pitfall', text: 'Writing to a shared variable inside a `par` lambda (`count++`) is a **data race**, which is undefined behaviour. Use `std::reduce` / `std::transform_reduce`, or atomics (module 18).' },
        { kind: 'check', q: 'Why might `std::reduce(par, ...)` give a slightly different floating-point sum than `std::accumulate`?', options: ['A bug in the library', 'It may add in a different order, and floating-point addition isn\'t associative', 'It uses float instead of double', 'It skips elements'], answer: 1, hint: 'Is (a + b) + c always exactly a + (b + c) for doubles?', explain: '`reduce` is allowed to regroup and reorder; rounding differs with order.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does `end()` refer to?', options: ['The last element', 'One past the last element', 'nullptr', 'The first element'], answer: 1, explain: 'Half-open ranges: never dereference `end()`.' },
    { q: 'Which container\'s iterators can NOT be used with `std::sort`?', options: ['`vector`', '`deque`', '`list`', '`array`'], answer: 2, explain: '`sort` needs random access; use `list.sort()`.' },
    { q: 'What does `std::back_inserter(v)` do?', options: ['Points at `v.back()`', 'Makes writes call `v.push_back`', 'Reverses `v`', 'Reserves capacity'], answer: 1, explain: 'It lets output algorithms grow the destination.' },
    { q: 'What does `std::ranges::sort(v, {}, &Trade::px)` sort by?', options: ['Address', 'The `px` member, ascending', 'All members', 'Nothing: compile error'], answer: 1, explain: '`{}` = default comparator `ranges::less`, and `&Trade::px` is the projection.' },
    { q: 'What is the C++20 one-liner to remove all zeros from a vector?', options: ['`v.remove(0)`', '`std::erase(v, 0)`', '`std::remove(v, 0)`', '`v.erase(0)`'], answer: 1, explain: '`std::erase` / `std::erase_if` replace the erase–remove idiom.' },
    { q: 'Which C++23 algorithm is a left fold?', options: ['`ranges::accumulate`', '`ranges::fold_left`', '`ranges::reduce`', '`ranges::collect`'], answer: 1, explain: 'There is still no `ranges::accumulate`; `fold_left` fills the gap.' },
    { q: 'Requirement for a `sort` comparator:', options: ['Return -1/0/1', 'Strict weak ordering (use `<`)', 'Must be a function pointer', 'Must be `noexcept`'], answer: 1, explain: 'Violating it (e.g. using `<=`) is undefined behaviour.' },
    { q: 'Parallel execution policies are…', options: ['guarantees of parallelism', 'permissions the implementation may use', 'only for GPUs', 'C++23-only'], answer: 1, explain: 'They have existed since C++17 and permit, but don\'t require, parallel execution.' },
  ],
}
