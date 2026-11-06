import type { Module } from './types'

export const m14: Module = {
  n: 14,
  title: 'Ranges',
  tour: '14 · Ranges',
  summary: 'Lazy views, composable pipelines with |, the C++23 view adaptors, collecting results with ranges::to, and generators.',
  topics: ['Views', 'Pipelines', 'C++23 views', 'ranges::to', 'Generators', 'Range concepts'],
  cpp23: [
    '`std::ranges::to<Container>()` collects a view into a container.',
    'New views: `zip`, `zip_transform`, `enumerate`, `chunk`, `chunk_by`, `slide`, `stride`, `adjacent`, `pairwise`, `join_with`, `cartesian_product`, `as_const`, `as_rvalue`, `repeat`.',
    '`std::generator<T>` (`<generator>`): coroutine-based lazy sequences.',
  ],
  lessons: [
    {
      id: 'views',
      title: 'Views',
      blocks: [
        { kind: 'analogy', text: "A view is a recipe card, not a cooked meal. \"Take the prices, keep the ones above 2390, double them\" describes the dish but cooks nothing. Food is only made, one plate at a time, when someone starts eating (iterates). If they stop after three plates, only three get cooked." },
        { kind: 'code', code: `std::vector<int> v {1, 2, 3, 4, 5, 6, 7, 8};

auto evens   = std::views::filter(v, [](int x) { return x % 2 == 0; });   // nothing computed yet
auto squared = std::views::transform(evens, [](int x) { return x * x; });

for (int x : squared) std::println("{}", x);   // 4 16 36 64: computed on demand

auto first3 = std::views::take(v, 3);           // 1 2 3
auto nat    = std::views::iota(1);              // 1, 2, 3, ... infinite, lazily
auto rev    = std::views::reverse(v);
auto keys   = std::views::keys(my_map);         // just the keys of a map` },
        { kind: 'list', items: [
          'A **view** is a lightweight range that doesn\'t own its elements (or owns cheaply). Creating one is O(1).',
          'Work happens element by element during iteration, so infinite sequences like `iota(1)` are fine as long as you `take` from them.',
          'Views **refer** to the underlying data: modify the vector and the view sees the change.',
        ] },
        { kind: 'pitfall', text: "A view over a named container only **refers** to it. If the view outlives the container, it dangles, exactly like a `string_view`. Temporaries are handled for you: `get_vector() | std::views::filter(pred)` moves the temporary vector into the view, so it stays alive as long as the view does." },
        { kind: 'check', q: 'How many times is the lambda called?', code: `int calls = 0;
auto sq = std::views::iota(1, 1000)
        | std::views::transform([&](int x) { ++calls; return x * x; })
        | std::views::take(3);
for (int x : sq) {}`, options: ['999', '3', '0', '1000'], answer: 1, hint: 'Views are lazy, and `take(3)` stops after three.', explain: 'Only three elements are ever pulled through the pipeline, so `transform` runs three times.' },
      ],
    },
    {
      id: 'pipelines',
      title: 'Pipelines',
      blocks: [
        { kind: 'analogy', text: "`|` works like a factory assembly line: each station does one job and passes the item on. Reading left to right matches the order things happen, unlike nested function calls you read inside-out." },
        { kind: 'code', code: `struct Tick { std::string sym; double px; long vol; };
std::vector<Tick> ticks = load();

auto gold_px = ticks
    | std::views::filter([](const Tick& t) { return t.sym == "XAU"; })
    | std::views::transform(&Tick::px)              // member pointers work as projections
    | std::views::take(100);

auto v = gold_px | std::ranges::to<std::vector>();   // C++23: collect into a vector
double avg = std::ranges::fold_left(v, 0.0, std::plus{}) / v.size();` },
        { kind: 'compare',
          python: `gold = (t.px for t in ticks if t.sym == "XAU")
first100 = list(itertools.islice(gold, 100))`,
          ts: `const first100 = ticks
  .filter(t => t.sym === "XAU")   // eager: builds arrays
  .map(t => t.px)
  .slice(0, 100)`,
          go: `var first100 []float64
for _, t := range ticks {
    if t.Sym == "XAU" {
        first100 = append(first100, t.Px)
        if len(first100) == 100 { break }
    }
}`,
          java: `var first100 = ticks.stream()
    .filter(t -> t.sym().equals("XAU"))
    .map(Tick::px)
    .limit(100)
    .toList();`,
          cpp: `auto first100 = ticks
    | std::views::filter([](auto& t) { return t.sym == "XAU"; })
    | std::views::transform(&Tick::px)
    | std::views::take(100)
    | std::ranges::to<std::vector>();`,
          note: 'Lazy like Python generators and Java streams, but compiled down to a plain loop with no intermediate allocations.' },
        { kind: 'new23', text: 'Before C++23 there was no standard way to turn a view back into a container, and everyone wrote their own helper. `std::ranges::to<std::vector>()` (or `to<std::map>()`, `to<std::string>()`, …) is the missing last step.' },
        { kind: 'check', q: 'What type is `r` here?', code: `auto r = std::vector{1, 2, 3} | std::views::transform([](int x) { return x * 2; });`, options: ['`std::vector<int>`', 'A view that owns the moved-in vector', 'Compile error: can\'t view a temporary', '`int`'], answer: 1, hint: 'Adaptors never produce containers by themselves. So what happens to the temporary?', explain: 'The temporary vector is moved into an `owning_view`, so `r` is safe to use. It is still a lazy view: nothing is doubled until you iterate, and you need `ranges::to` to get a vector.' },
      ],
    },
    {
      id: 'new23',
      title: 'The C++23 view toolbox',
      blocks: [
        { kind: 'analogy', text: "C++20 shipped the assembly line with a handful of stations. C++23 adds the specialist ones you were writing by hand: one that walks two belts in step (`zip`), one that numbers items (`enumerate`), one that boxes them in sixes (`chunk`), and one that shows a sliding window (`slide`)." },
        { kind: 'code', code: `std::vector<std::string> syms {"XAU", "XAG", "EUR"};
std::vector<double>      pxs  {2390.5, 28.1, 1.08};

for (auto [i, s] : std::views::enumerate(syms))           // index + element
    std::println("{}: {}", i, s);

for (auto [s, p] : std::views::zip(syms, pxs))            // walk two ranges together
    std::println("{} = {}", s, p);

auto closes = load_closes();
for (auto window : closes | std::views::slide(20)) {      // every 20-bar window: rolling stats
    double sma = std::ranges::fold_left(window, 0.0, std::plus{}) / 20;
}

for (auto batch : orders | std::views::chunk(100)) send(batch);       // groups of 100
auto every5th = closes | std::views::stride(5);
for (auto [prev, cur] : closes | std::views::pairwise) {}             // adjacent pairs
auto csv = syms | std::views::join_with(',') | std::ranges::to<std::string>();   // "XAU,XAG,EUR"
for (auto [a, b] : std::views::cartesian_product(syms, syms)) {}       // every pair` },
        { kind: 'list', items: [
          '`zip_transform(f, a, b)`: combine element-wise, e.g. bid and ask into a mid price.',
          '`chunk_by(pred)`: split where `pred(prev, cur)` turns false, e.g. group ticks by day.',
          '`adjacent<N>`: tuples of N neighbours. `pairwise` is `adjacent<2>`.',
          '`repeat(x)` / `repeat(x, n)`: an infinite or n-long sequence of one value.',
        ] },
        { kind: 'check', q: 'With 100 closes, how many windows does `closes | views::slide(20)` produce?', options: ['5', '20', '81', '100'], answer: 2, hint: 'The first window is 0–19, the last is 80–99.', explain: 'n − k + 1 = 100 − 20 + 1 = 81 overlapping windows. `chunk(20)` would give 5 non-overlapping ones.' },
      ],
    },
    {
      id: 'generators',
      title: 'Generators & range concepts',
      blocks: [
        { kind: 'analogy', text: "A generator is a vending machine that makes each item when you press the button. It remembers where it got to, pauses after each item, and resumes when you press again. You can write sequences that are awkward as views (state machines, file parsers) as ordinary-looking loops." },
        { kind: 'code', code: `std::generator<double> random_walk(double start, std::mt19937& rng) {
    std::normal_distribution<double> step {0.0, 1.0};
    double px = start;
    while (true) {
        co_yield px;                  // hand out a value and pause here
        px += step(rng);
    }
}

std::mt19937 rng {42};
for (double p : random_walk(2390.0, rng) | std::views::take(5))
    std::println("{:.2f}", p);

std::generator<std::string_view> lines(std::string_view text) {
    for (auto part : text | std::views::split('\\n'))
        co_yield std::string_view{part.begin(), part.end()};
}` },
        { kind: 'list', items: [
          '`co_yield` makes the function a **coroutine** (module 18). `std::generator` is the ready-made type, so you don\'t have to write coroutine plumbing.',
          'A generator is an input range: single pass, so iterate it once.',
          'It composes with views like any other range.',
        ] },
        { kind: 'h', text: 'Range concepts' },
        { kind: 'list', items: [
          '`std::ranges::range`: has `begin`/`end`. `sized_range`: O(1) `size`. `view`: cheap to copy.',
          '`input_range` → `forward_range` → `bidirectional_range` → `random_access_range` → `contiguous_range`, mirroring the iterator categories.',
          'Use them to constrain your own functions: `void plot(std::ranges::input_range auto&& r);`',
        ] },
        { kind: 'pitfall', text: '`views::filter` caches its first match the first time you call `begin()`. Modifying elements through a filter view so they no longer satisfy the predicate, then iterating again, is UB. Treat filter views as read-only and short-lived.' },
        { kind: 'check', q: 'What does `co_yield` do in a `std::generator`?', options: ['Ends the function', 'Produces one value and suspends until the next is requested', 'Spawns a thread', 'Returns all values at once'], answer: 1, hint: 'Vending machine: one item per button press.', explain: 'The coroutine pauses at `co_yield` and resumes when the consumer advances the iterator.' },
      ],
    },
  ],
  quiz: [
    { q: 'When does a view do its work?', options: ['When created', 'Lazily, as you iterate', 'At compile time', 'On a background thread'], answer: 1, explain: 'Creating a view is O(1); elements are computed on demand.' },
    { q: 'What collects a view into a `std::vector` in C++23?', options: ['`std::collect`', '`| std::ranges::to<std::vector>()`', '`std::vector(view)` only', '`view.toVector()`'], answer: 1, explain: '`ranges::to` was added in C++23.' },
    { q: 'Which view yields (index, element) pairs?', options: ['`views::zip`', '`views::enumerate`', '`views::iota`', '`views::indexed`'], answer: 1, explain: '`enumerate` (C++23); `zip(iota(0), r)` was the old workaround.' },
    { q: 'What does `views::chunk(3)` on [1..7] give?', options: ['[1,2,3] [4,5,6] [7]', '[1,2,3] [2,3,4] …', '[1,4,7] …', '[1,2,3] [4,5,6]'], answer: 0, explain: 'Non-overlapping groups; the last may be shorter. `slide` gives overlapping windows.' },
    { q: 'Why is `std::views::iota(1)` safe despite being infinite?', options: ['It caps at INT_MAX', 'It is lazy: only elements you pull are produced', 'It throws after a limit', 'It isn\'t safe'], answer: 1, explain: 'Pair it with `take` or a `break`.' },
    { q: 'What is the C++23 standard coroutine type for lazy sequences?', options: ['`std::task`', '`std::generator`', '`std::lazy`', '`std::stream`'], answer: 1, explain: '`std::generator<T>` in `<generator>`.' },
    { q: 'Compared with Java streams or Python generators, C++ pipelines…', options: ['allocate intermediate collections', 'typically compile to a plain loop with no intermediate allocation', 'run in parallel by default', 'are eager'], answer: 1, explain: 'Each adaptor is a template inlined into one loop.' },
    { q: 'Which view gives overlapping windows of size k?', options: ['`chunk`', '`slide`', '`stride`', '`split`'], answer: 1, explain: '`slide(k)`, which is perfect for moving averages.' },
  ],
}
