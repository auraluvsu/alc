// "The Standard": the most useful standard library functions and methods, with what/how/when.
export type StdEntry = {
  name: string
  header: string
  cat: string
  summary: string // one line, shown collapsed
  what: string // what it does
  code: string // how to use it
  when: string // use case
  module: number // course module that covers it
  since?: string
}

export const STANDARD: StdEntry[] = [
  // ---------------- Containers ----------------
  {
    name: 'vector::push_back / emplace_back', header: '<vector>', cat: 'Containers', module: 12,
    summary: 'Add an element to the end of a vector.',
    what: "`push_back(x)` copies or moves an existing object onto the end. `emplace_back(args...)` builds the object directly in the vector's memory from constructor arguments, skipping a temporary. Both are amortised O(1).",
    code: `std::vector<Trade> trades;
trades.push_back(t);                        // copy an existing Trade
trades.push_back(std::move(t));             // move it in (t is now empty)
trades.emplace_back("XAU", 2390.5, 10);     // construct in place from Trade's constructor args`,
    when: 'Building up a list one item at a time: parsed rows, fills, events. Prefer `emplace_back` when you are constructing a new object anyway.',
  },
  {
    name: 'vector::reserve', header: '<vector>', cat: 'Containers', module: 12,
    summary: 'Pre-allocate capacity so later push_backs never reallocate.',
    what: "Allocates room for at least `n` elements without creating them. `size()` stays the same; `capacity()` grows. After that, appending up to `n` elements never moves the existing ones.",
    code: `std::vector<double> closes;
closes.reserve(rows.size());       // one allocation
for (const auto& r : rows) closes.push_back(r.close);`,
    when: 'Whenever you know (or can estimate) the final size up front. It removes repeated reallocations and keeps pointers into the vector valid while you fill it.',
  },
  {
    name: 'map / unordered_map::try_emplace', header: '<map>, <unordered_map>', cat: 'Containers', module: 12,
    summary: 'Insert a key only if it is missing; never overwrites.',
    what: 'Inserts `{key, value}` if `key` is absent and does nothing if it is present. It returns `{iterator, inserted}`. Unlike `m[key] = v`, it does not overwrite, and it does not build the value at all when the key already exists.',
    code: `std::unordered_map<std::string, double> first_seen;
auto [it, inserted] = first_seen.try_emplace(sym, px);
if (!inserted) std::println("{} already seen at {}", sym, it->second);

m.insert_or_assign(sym, px);   // the "always overwrite" version`,
    when: 'Caches, "first time we saw this symbol" tables, de-duplication. Use `insert_or_assign` when you do want to overwrite.',
  },
  {
    name: 'map::find / contains', header: '<map>, <unordered_map>', cat: 'Containers', module: 12,
    summary: 'Look up a key without accidentally inserting it.',
    what: "`find(key)` returns an iterator to the element, or `end()` if missing. `contains(key)` (C++20) just answers yes or no. Neither inserts, unlike `operator[]`, which creates a default value for missing keys.",
    code: `if (auto it = prices.find("XAU"); it != prices.end())
    std::println("gold at {}", it->second);

if (prices.contains("XAG")) { /* ... */ }

double px = prices.at("XAU");   // throws std::out_of_range if missing`,
    when: 'Any read-only lookup. Reach for `find` when you need the value, `contains` when you only need to know, and `at` when a missing key is a bug.',
  },
  {
    name: 'map::lower_bound / upper_bound', header: '<map>', cat: 'Containers', module: 12,
    summary: 'Find the first key at or after a value: range queries on ordered maps.',
    what: "On an ordered `std::map`, `lower_bound(k)` returns the first element with key ≥ k and `upper_bound(k)` the first with key > k. Both are O(log n). Together they give you every key in a range.",
    code: `std::map<Time, Bar> bars;                       // ordered by time
auto from = bars.lower_bound(session_open);
auto to   = bars.upper_bound(session_close);
for (auto it = from; it != to; ++it) process(it->second);   // only this session`,
    when: 'Time-series lookups ("bars between 9:00 and 17:00"), order books keyed by price, finding the nearest key.',
  },
  {
    name: 'std::erase_if', header: '<vector>, <map>, …', cat: 'Containers', module: 13,
    summary: 'Remove every element matching a condition, in one call.',
    what: 'Removes all elements for which the predicate returns true and returns how many were removed. It works on every standard container and replaces the old erase–remove idiom.',
    code: `std::erase_if(orders, [](const Order& o) { return o.cancelled; });
std::erase(ids, 0);                                   // remove by value
auto n = std::erase_if(cache, [](const auto& kv) { return kv.second.stale(); });   // maps too`,
    when: 'Cleaning up a collection: cancelled orders, invalid rows, expired cache entries.',
  },

  // ---------------- Algorithms ----------------
  {
    name: 'std::ranges::sort', header: '<algorithm>', cat: 'Algorithms', module: 13,
    summary: 'Sort a container, optionally by a member or key.',
    what: 'Sorts in O(n log n). It takes the whole container, an optional comparator (`std::greater{}` for descending) and an optional **projection**: a member pointer or function that picks what to compare by.',
    code: `std::ranges::sort(v);                                  // ascending
std::ranges::sort(v, std::greater{});                  // descending
std::ranges::sort(trades, {}, &Trade::px);             // by price
std::ranges::sort(trades, {}, [](const Trade& t) { return std::tie(t.sym, t.px); });   // multi-key
std::ranges::stable_sort(trades, {}, &Trade::time);    // keeps equal elements in order`,
    when: 'Ranking, preparing data for binary search, producing ordered output. Use `stable_sort` when ties must keep their original order.',
  },
  {
    name: 'std::ranges::find / find_if', header: '<algorithm>', cat: 'Algorithms', module: 13,
    summary: 'Find the first element equal to a value, or matching a condition.',
    what: 'Returns an iterator to the first match, or `end()` when nothing matches. `find` compares with `==`; `find_if` uses your predicate. Both accept a projection.',
    code: `auto it = std::ranges::find(syms, "XAU");
if (it != syms.end()) { /* found */ }

auto big = std::ranges::find_if(trades, [](int q) { return q > 100; }, &Trade::qty);
auto idx = std::distance(trades.begin(), big);   // its position`,
    when: 'Locating one item in an unsorted collection. For sorted data, `lower_bound` is much faster. To only ask "is it there?", use `ranges::contains` (C++23).',
  },
  {
    name: 'std::ranges::count_if', header: '<algorithm>', cat: 'Algorithms', module: 13,
    summary: 'Count how many elements match a condition.',
    what: 'Walks the range once and returns the number of elements for which the predicate is true. `count(r, value)` counts exact matches.',
    code: `auto wins   = std::ranges::count_if(pnl, [](double p) { return p > 0; });
auto commas = std::ranges::count(line, ',');
double win_rate = double(wins) / pnl.size();`,
    when: 'Quick statistics: winning trades, error rows, occurrences of a character.',
  },
  {
    name: 'std::ranges::any_of / all_of / none_of', header: '<algorithm>', cat: 'Algorithms', module: 13,
    summary: 'Ask yes/no questions about a whole collection.',
    what: 'Return `bool`s and stop early: `any_of` at the first match, `all_of` at the first failure. `none_of` is the opposite of `any_of`.',
    code: `bool has_gap  = std::ranges::any_of(bars, [](const Bar& b) { return b.volume == 0; });
bool all_pos  = std::ranges::all_of(prices, [](double p) { return p > 0; });
bool no_nans  = std::ranges::none_of(prices, [](double p) { return std::isnan(p); });`,
    when: 'Validation and guard checks before processing data. They read much more clearly than a hand-written loop with a flag.',
  },
  {
    name: 'std::ranges::transform', header: '<algorithm>', cat: 'Algorithms', module: 13,
    summary: 'Apply a function to every element and write the results somewhere.',
    what: 'Calls the function on each element (or on pairs from two ranges) and writes each result to an output iterator. It is eager. For a lazy version, use `views::transform`.',
    code: `std::vector<double> pct;
std::ranges::transform(prices, std::back_inserter(pct),
                       [](double p) { return p / 100; });

std::ranges::transform(bid, ask, std::back_inserter(mid),     // two inputs
                       [](double b, double a) { return (b + a) / 2; });`,
    when: 'Converting one collection into another of the same length: units, derived columns, combining two series.',
  },
  {
    name: 'std::ranges::lower_bound / binary_search', header: '<algorithm>', cat: 'Algorithms', module: 13,
    summary: 'O(log n) search in sorted data.',
    what: '`lower_bound` returns the first element not less than the value; `binary_search` returns whether the value exists. Both require the range to be sorted by the same ordering.',
    code: `std::ranges::sort(times);
auto it = std::ranges::lower_bound(times, t);          // first time >= t
bool exists = std::ranges::binary_search(ids, 42);
auto [lo, hi] = std::ranges::equal_range(sorted, 7);   // all elements equal to 7`,
    when: 'Repeated lookups in a sorted vector, such as finding the bar at or after a timestamp. Often faster than a map because the data is contiguous.',
  },
  {
    name: 'std::ranges::minmax / max_element', header: '<algorithm>', cat: 'Algorithms', module: 13,
    summary: 'Find the smallest and largest values (or where they are).',
    what: '`min`/`max`/`minmax` return values. `min_element`/`max_element` return **iterators**, so you also learn the position. All accept projections.',
    code: `auto [lo, hi] = std::ranges::minmax(prices);
auto best = std::ranges::max_element(trades, {}, &Trade::pnl);   // iterator to the best trade
std::println("best: {} at index {}", best->pnl, best - trades.begin());`,
    when: 'Ranges and extremes: daily high/low, best and worst trade, the drawdown peak.',
  },
  {
    name: 'std::ranges::unique (after sort)', header: '<algorithm>', cat: 'Algorithms', module: 13,
    summary: 'Remove adjacent duplicates: sort first to de-duplicate.',
    what: '`unique` moves the unique elements to the front and returns the leftover tail, which you then erase. It only removes **adjacent** duplicates, so sort first.',
    code: `std::ranges::sort(syms);
auto tail = std::ranges::unique(syms);
syms.erase(tail.begin(), tail.end());   // syms now has each symbol once`,
    when: 'De-duplicating a vector in place. If you need de-duplication while inserting, use a `std::set` or `unordered_set`.',
  },
  {
    name: 'std::ranges::fold_left', header: '<algorithm>', cat: 'Algorithms', module: 13, since: 'C++23',
    summary: 'Reduce a range to one value with any operation.',
    what: 'Combines elements left to right: `op(op(op(init, a), b), c)`. `fold_left_first` uses the first element as the start and returns an `optional`.',
    code: `double total = std::ranges::fold_left(pnl, 0.0, std::plus{});
double prod  = std::ranges::fold_left(returns, 1.0,
                   [](double acc, double r) { return acc * (1 + r); });   // compounded growth
auto biggest = std::ranges::fold_left_first(v, [](int a, int b) { return std::max(a, b); });`,
    when: 'Sums, products, compounding, building a result step by step. It is the ranges-era replacement for `accumulate`.',
  },
  {
    name: 'std::accumulate / std::reduce', header: '<numeric>', cat: 'Algorithms', module: 17,
    summary: 'Sum (or fold) an iterator range; reduce can run in parallel.',
    what: '`accumulate` folds strictly left to right. `reduce` may reorder and parallelise with an execution policy. In both, the **initial value\'s type** is the result type.',
    code: `double s  = std::accumulate(v.begin(), v.end(), 0.0);    // 0.0, not 0!
double s2 = std::reduce(std::execution::par, v.begin(), v.end(), 0.0);
double dot = std::inner_product(w.begin(), w.end(), r.begin(), 0.0);   // weights · returns`,
    when: "You'll see `accumulate` in nearly every codebase. Use `reduce` for large datasets where parallelism helps.",
  },
  {
    name: 'std::iota / views::iota', header: '<numeric>, <ranges>', cat: 'Algorithms', module: 17,
    summary: 'Fill with 0, 1, 2, … or generate a counting range.',
    what: '`std::iota(first, last, start)` writes increasing values into a range. `views::iota(a, b)` is a lazy counting range, so nothing is stored.',
    code: `std::vector<int> idx(n);
std::iota(idx.begin(), idx.end(), 0);                     // 0..n-1
std::ranges::sort(idx, {}, [&](int i) { return px[i]; }); // indices sorted by price ("argsort")

for (int i : std::views::iota(0, 10)) { /* 0..9 */ }`,
    when: 'Index arrays, argsort, numbered loops without a manual counter.',
  },
  {
    name: 'std::clamp', header: '<algorithm>', cat: 'Algorithms', module: 13,
    summary: 'Restrict a value to lie within [low, high].',
    what: 'Returns `lo` if the value is below it, `hi` if above, and the value otherwise. It is clearer than nested `min`/`max`.',
    code: `double size   = std::clamp(raw_size, 0.0, max_position);
int    volume = std::clamp(user_input, 0, 100);`,
    when: 'Limits: position sizing, percentages, UI inputs, keeping indices in bounds.',
  },

  // ---------------- Ranges ----------------
  {
    name: 'views::filter / views::transform', header: '<ranges>', cat: 'Ranges', module: 14,
    summary: 'Lazily keep matching elements and/or map each one.',
    what: 'Creates a view that computes elements on demand as you iterate. Nothing is copied or stored. Chain views with `|`.',
    code: `auto gold = ticks
    | std::views::filter([](const Tick& t) { return t.sym == "XAU"; })
    | std::views::transform(&Tick::px);
for (double px : gold) { /* ... */ }`,
    when: 'Processing pipelines over big data without building intermediate vectors.',
  },
  {
    name: 'std::ranges::to', header: '<ranges>', cat: 'Ranges', module: 14, since: 'C++23',
    summary: 'Turn a view back into a real container.',
    what: 'Materialises any range into a container: `vector`, `string`, `map`, `set`, …. It is the last step of a pipeline when you need to keep the results.',
    code: `auto gold_px = ticks
    | std::views::filter(is_gold)
    | std::views::transform(&Tick::px)
    | std::ranges::to<std::vector>();          // std::vector<double>

auto csv = syms | std::views::join_with(',') | std::ranges::to<std::string>();`,
    when: 'Storing, returning or indexing the output of a pipeline.',
  },
  {
    name: 'views::zip / views::enumerate', header: '<ranges>', cat: 'Ranges', module: 14, since: 'C++23',
    summary: 'Loop over several ranges together, or with an index.',
    what: '`zip(a, b)` yields tuples of corresponding elements and stops at the shortest range. `enumerate(r)` yields `(index, element)` pairs.',
    code: `for (auto [sym, px] : std::views::zip(syms, prices))
    std::println("{} {}", sym, px);

for (auto [i, bar] : std::views::enumerate(bars))
    if (bar.volume == 0) std::println("empty bar at {}", i);`,
    when: 'Parallel arrays (symbols and prices) and any loop that needs both the element and its position.',
  },
  {
    name: 'views::slide / views::chunk', header: '<ranges>', cat: 'Ranges', module: 14, since: 'C++23',
    summary: 'Overlapping windows or fixed-size batches.',
    what: '`slide(n)` gives every window of n consecutive elements (overlapping). `chunk(n)` gives non-overlapping groups of n; the last may be shorter.',
    code: `for (auto w : closes | std::views::slide(20))           // rolling 20-period windows
    sma.push_back(std::ranges::fold_left(w, 0.0, std::plus{}) / 20);

for (auto batch : orders | std::views::chunk(100))       // send in batches of 100
    send(batch);`,
    when: 'Moving averages and rolling statistics (`slide`); batching API calls or writes (`chunk`).',
  },

  // ---------------- Strings & I/O ----------------
  {
    name: 'std::println / std::format', header: '<print>, <format>', cat: 'Strings & I/O', module: 11,
    summary: 'Type-safe formatted output, with {} placeholders.',
    what: '`std::format` builds a `std::string`; `std::println` prints with a newline (`std::print` without). Format specs go after `:` and are checked at compile time.',
    code: `std::println("{} x {} @ {:.2f}", sym, qty, px);
std::println("{:>10}|{:<6}|{:08.3f}", "right", "left", 3.14159);
std::string s = std::format("{:+.2f}%", 1.53);           // "+1.53%"
std::println("{}", std::vector{1, 2, 3});                  // [1, 2, 3] (C++23)`,
    when: 'All output and string building. It replaces `printf`, `cout <<` chains and `stringstream` for formatting.',
    since: 'C++23',
  },
  {
    name: 'string::find / substr', header: '<string>', cat: 'Strings & I/O', module: 10,
    summary: 'Locate text inside a string and cut pieces out.',
    what: '`find(x)` returns the index of the first occurrence, or `std::string::npos`. `substr(pos, len)` copies a piece out. On a `string_view`, `substr` returns a view instead of copying.',
    code: `std::string pair = "XAU/USD";
auto slash = pair.find('/');
if (slash != std::string::npos) {
    std::string base  = pair.substr(0, slash);        // "XAU"
    std::string quote = pair.substr(slash + 1);       // "USD"
}
pair.starts_with("XAU"); pair.ends_with("USD"); pair.contains("/");   // C++20/23`,
    when: 'Parsing symbols, splitting simple formats, checking prefixes and suffixes.',
  },
  {
    name: 'std::string_view', header: '<string_view>', cat: 'Strings & I/O', module: 10,
    summary: 'Read-only, non-copying view of text.',
    what: 'A pointer plus a length. It accepts `std::string`, literals and `char*` without copying, and `substr`/`remove_prefix` are free. It doesn\'t own the text, so it must not outlive it.',
    code: `void handle(std::string_view line) {
    auto date = line.substr(0, 10);
    line.remove_prefix(11);
    // ...
}
handle(file_line);        // std::string
handle("2024-11-05,…");  // literal: no allocation`,
    when: 'Function parameters that only read text, and fast parsing. Never use it to store text in a long-lived object.',
  },
  {
    name: 'std::from_chars', header: '<charconv>', cat: 'Strings & I/O', module: 10,
    summary: 'Fastest text → number parsing; no exceptions, no allocation.',
    what: 'Parses an int or floating-point value from a char range. It returns `{ptr, ec}`: where parsing stopped and an error code. It is locale-independent and very fast.',
    code: `double px{};
auto [ptr, ec] = std::from_chars(field.data(), field.data() + field.size(), px);
if (ec != std::errc{}) { /* not a number */ }

int qty{};
std::from_chars(s.data(), s.data() + s.size(), qty);`,
    when: 'Parsing large CSV or tick files. Use `std::stod`/`std::stoi` for one-offs where exceptions are fine.',
  },
  {
    name: 'std::getline', header: '<string>, <istream>', cat: 'Strings & I/O', module: 11,
    summary: 'Read a whole line (or up to a delimiter) from a stream.',
    what: 'Reads characters into a string until a newline (or the delimiter you give) and returns the stream, which converts to `false` at end of input. That makes it the standard read loop.',
    code: `std::ifstream in {"prices.csv"};
for (std::string line; std::getline(in, line);) {
    std::istringstream row {line};
    std::string date, close;
    std::getline(row, date, ',');     // split on commas
    std::getline(row, close, ',');
}`,
    when: 'Reading files and user input line by line, and simple CSV splitting.',
  },

  // ---------------- Memory & utilities ----------------
  {
    name: 'std::make_unique', header: '<memory>', cat: 'Memory & utilities', module: 15,
    summary: 'Create a heap object owned by a unique_ptr.',
    what: 'Allocates and constructs a `T`, returning a `std::unique_ptr<T>` that deletes it automatically. It is the default way to put something on the heap. `make_shared` is the equivalent for shared ownership.',
    code: `auto engine = std::make_unique<Backtester>(config);
engine->run();

std::vector<std::unique_ptr<Strategy>> strats;
strats.push_back(std::make_unique<MeanReversion>(20));
strats.push_back(std::make_unique<Breakout>(55));`,
    when: 'Polymorphic objects (a list of different strategies), large objects, objects whose lifetime outlives the current scope.',
  },
  {
    name: 'std::move', header: '<utility>', cat: 'Memory & utilities', module: 6,
    summary: 'Hand over an object\'s contents instead of copying them.',
    what: 'Casts its argument to an rvalue so the move constructor or assignment is chosen, transferring buffers instead of duplicating them. The source is left valid but unspecified.',
    code: `std::vector<Tick> batch = read_batch();
queue.push_back(std::move(batch));   // no copy of the ticks; batch is now empty-ish
batch.clear();                       // safe to reuse after assigning/clearing

auto owner2 = std::move(owner1);     // the only way to transfer a unique_ptr`,
    when: "Passing big objects into containers or functions that keep them, and transferring `unique_ptr` ownership. Don't use it on `return local;`, which already moves.",
  },
  {
    name: 'optional::value_or / expected::and_then', header: '<optional>, <expected>', cat: 'Memory & utilities', module: 15,
    summary: 'Handle "maybe a value" results without nested ifs.',
    what: '`value_or(x)` unwraps or falls back. `transform`, `and_then` and `or_else` (C++23 on both types) chain steps that only run when a value is present.',
    code: `double px = last_price("XAU").value_or(0.0);

auto order = parse_order(line)                    // std::expected<Order, Error>
    .and_then(validate)                           // runs only if parsing succeeded
    .transform([](Order o) { o.ts = now(); return o; });
if (!order) log(order.error());`,
    when: 'Lookups that may miss (`optional`) and fallible steps that need a reason for failure (`expected`).',
    since: 'C++23',
  },
  {
    name: 'std::exchange / std::swap', header: '<utility>', cat: 'Memory & utilities', module: 6,
    summary: 'Replace a value and get the old one back; swap two values.',
    what: '`std::exchange(obj, new)` sets `obj` to `new` and returns the previous value in one step. `std::swap(a, b)` swaps two objects, efficiently (by moving) for standard types.',
    code: `auto pending = std::exchange(buffer, {});     // take the buffer, leave it empty
process(pending);

int prev = std::exchange(state, State::Running);
std::swap(front_buffer, back_buffer);         // double buffering`,
    when: 'Draining a buffer, "take and reset" in move constructors, state transitions, double buffering.',
  },
  {
    name: 'steady_clock::now', header: '<chrono>', cat: 'Memory & utilities', module: 16,
    summary: 'Measure how long something takes.',
    what: 'Returns the current time on a clock that never jumps backwards. Subtracting two readings gives a duration, which you convert with `duration_cast`.',
    code: `using namespace std::chrono;
auto t0 = steady_clock::now();
run_backtest();
auto ms = duration_cast<milliseconds>(steady_clock::now() - t0);
std::println("backtest took {}", ms);`,
    when: 'Timing code and implementing timeouts. Use `system_clock` for wall-clock timestamps instead.',
  },

  // ---------------- Concurrency ----------------
  {
    name: 'std::jthread', header: '<thread>', cat: 'Concurrency', module: 18,
    summary: 'Run a function on another thread, joined automatically.',
    what: 'Starts a thread immediately. When the `jthread` is destroyed it requests stop and **joins**, so you can\'t forget to. The function can accept a `std::stop_token` to support cancellation.',
    code: `{
    std::jthread a {simulate, std::span{paths_a}, std::ref(result_a)};
    std::jthread b {simulate, std::span{paths_b}, std::ref(result_b)};
}   // both finished here

std::jthread feed {[](std::stop_token st) { while (!st.stop_requested()) poll(); }};`,
    when: 'Splitting independent work across cores (Monte Carlo paths, per-symbol backtests) and background loops.',
  },
  {
    name: 'std::scoped_lock', header: '<mutex>', cat: 'Concurrency', module: 18,
    summary: 'Lock one or more mutexes for the current scope.',
    what: 'Locks on construction and unlocks on destruction, even when an exception is thrown. Given several mutexes, it locks them all without deadlock.',
    code: `std::mutex m;
std::vector<Fill> fills;

void on_fill(Fill f) {
    std::scoped_lock lock {m};
    fills.push_back(f);
}                                     // unlocked here

std::scoped_lock both {m_book, m_risk};`,
    when: 'Any time threads share data that isn\'t a single atomic value.',
  },
  {
    name: 'std::async', header: '<future>', cat: 'Concurrency', module: 18,
    summary: 'Run a task and get its result later through a future.',
    what: 'Starts the function (on a new thread with `std::launch::async`) and returns a `std::future`. `get()` waits for the result, and rethrows if the task threw.',
    code: `auto fa = std::async(std::launch::async, [&] { return price(book_a); });
auto fb = std::async(std::launch::async, [&] { return price(book_b); });
double total = fa.get() + fb.get();`,
    when: 'A few independent computations whose results you combine. For many small tasks, use a thread pool instead.',
  },
]
