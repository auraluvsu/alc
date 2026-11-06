import type { Module } from '../types'

export const j08: Module = {
  n: 8,
  title: 'Streams',
  tour: '8 · Streams',
  summary: 'Saying what you want rather than how to loop: creating streams, transforming them, reducing and collecting results, Optional, grouping, primitive streams, gatherers and parallelism.',
  topics: ['From loops to pipelines', 'Creating streams', 'filter, map, flatMap', 'Optional', 'Collectors & grouping', 'Primitive & parallel streams', 'Gatherers'],
  cpp23: [
    'Stream gatherers: `stream.gather(...)` adds custom intermediate stages, with built-in `windowFixed`, `windowSliding`, `fold`, `scan` and `mapConcurrent` (Java 24).',
    'Virtual threads power `Gatherers.mapConcurrent`, which limits how many tasks run at once.',
  ],
  lessons: [
    {
      id: 'pipelines',
      title: 'From loops to pipelines',
      blocks: [
        { kind: 'analogy', text: "A stream is an assembly line. You set up the stations first (filter out the bad parts, paint, box), and nothing moves until someone at the far end says \"give me the output\". Then one part at a time travels the whole line, and the line stops the moment there is enough." },
        { kind: 'code', code: `record Trade(String sym, double px, int qty) {
    double notional() { return px * qty; }
}

List<Trade> trades = List.of(
    new Trade("XAU", 2390.5, 10),
    new Trade("EUR", 1.08, 500),
    new Trade("XAG", 28.1, 40),
    new Trade("XAU", 2401.0, 5));

// The loop version: how
List<String> big = new ArrayList<>();
for (Trade t : trades) {
    if (t.notional() > 1000) {
        big.add(t.sym());
    }
}

// The stream version: what
List<String> big2 = trades.stream()                // a source
    .filter(t -> t.notional() > 1000)              // intermediate: lazy
    .map(Trade::sym)                               // intermediate: lazy
    .distinct()
    .sorted()
    .toList();                                     // terminal: this runs it` },
        { kind: 'list', items: [
          'A stream doesn\'t store data, and doesn\'t change its source. It describes a computation over it.',
          '**Intermediate** operations (`filter`, `map`, `sorted`…) return a new stream, and do nothing yet.',
          'A **terminal** operation (`toList`, `count`, `forEach`, `reduce`…) starts the work, and uses up the stream.',
          'Elements are processed one at a time through the whole pipeline. Short-circuiting operations like `limit` and `findFirst` can stop early, even on an infinite stream.',
          'Loops are still fine, and often clearer for complicated control flow, multiple outputs or early exits with side effects. Use whichever reads better.',
        ] },
        { kind: 'stepper', title: 'Laziness in action', code: [
          'var s = List.of(1, 2, 3, 4).stream()',
          '    .filter(x -> x % 2 == 0)',
          '    .map(x -> x * 10);',
          'var first = s.findFirst();',
        ], steps: [
          { line: 1, note: 'This creates a stream over the list. No elements have been read.', memory: [{ name: 'pipeline', value: 'source only' }] },
          { line: 2, note: 'Adds a filter stage. It has not run.', memory: [{ name: 'pipeline', value: 'source → filter' }] },
          { line: 3, note: 'Adds a map stage. Still nothing has run.', memory: [{ name: 's', value: 'source → filter → map' }] },
          { line: 4, note: 'The terminal operation starts it: 1 fails the filter, 2 passes and becomes 20, and `findFirst` stops. Neither 3 nor 4 is ever examined.', memory: [{ name: 'first', value: 'Optional[20]' }, { name: 's', value: 'consumed', kind: 'dead' }] },
        ] },
        { kind: 'compare',
          python: `big = sorted({t.sym for t in trades if t.notional() > 1000})`,
          cpp: `auto big = trades
    | std::views::filter([](const Trade& t) { return t.notional() > 1000; })
    | std::views::transform(&Trade::sym)
    | std::ranges::to<std::set>();`,
          go: `var big []string
for _, t := range trades {   // the plain loop is idiomatic Go
    if t.Notional() > 1000 { big = append(big, t.Sym) }
}
slices.Sort(big)
big = slices.Compact(big)`,
          ts: `const big = [...new Set(
  trades.filter(t => t.notional() > 1000).map(t => t.sym)
)].sort()`,
          java: `var big = trades.stream()
    .filter(t -> t.notional() > 1000)
    .map(Trade::sym)
    .distinct().sorted().toList();`,
          note: 'Java streams, like C++ views and unlike JavaScript array methods, are lazy: no intermediate lists are created.' },
        { kind: 'pitfall', text: 'A stream is single-use. Calling a second terminal operation on it throws `IllegalStateException`. Keep a `Supplier<Stream<T>>`, or call `collection.stream()` again. Also, keep lambdas free of side effects: `.map(x -> { log.add(x); return x; })` is fragile, and in parallel it\'s wrong.' },
        { kind: 'check', q: 'What does this print?', code: `Stream.of(1, 2, 3).filter(x -> {
    System.out.println(x);
    return true;
});`, options: ['1, 2 and 3', 'Nothing: there is no terminal operation', 'Only 1', 'It does not compile'], answer: 1, hint: 'When do intermediate operations run?', explain: 'Without a terminal operation, the pipeline never runs.' },
      ],
    },
    {
      id: 'creating',
      title: 'Creating streams',
      blocks: [
        { kind: 'analogy', text: "Everything can be a source for the assembly line: a warehouse (a collection), a delivery of a known few parts (`Stream.of`), a machine that stamps out parts forever (`generate`, `iterate`), or a pipe from the outside world (the lines of a file)." },
        { kind: 'code', code: `Stream<String> a = List.of("x", "y").stream();
Stream<String> b = Stream.of("x", "y");
Stream<String> c = Arrays.stream(new String[] {"x", "y"});
Stream<String> empty = Stream.empty();
Stream<String> maybe = Stream.ofNullable(System.getenv("HOME"));

// Infinite: must be limited before a terminal operation
Stream<Double> randoms = Stream.generate(Math::random).limit(5);
Stream<Integer> powers = Stream.iterate(1, x -> x * 2).limit(10);
Stream<Integer> bounded = Stream.iterate(1, x -> x < 100, x -> x * 2);   // has a stop test

IntStream range = IntStream.range(0, 5);        // 0..4
IntStream closed = IntStream.rangeClosed(1, 5); // 1..5
IntStream chars = "hello".chars();
Stream<String> lines = "a\\nb".lines();
Stream<String> words = Pattern.compile("\\\\s+").splitAsStream("a b  c");

// From files: this stream holds an open file, so close it
try (Stream<String> file = Files.lines(Path.of("trades.csv"))) {
    long n = file.filter(l -> l.startsWith("XAU")).count();
}

// Extracting substreams, and combining
Stream.of(1, 2, 3, 4, 5).skip(1).limit(2);                  // 2, 3
Stream.of(1, 2, 8, 3).takeWhile(x -> x < 5);                // 1, 2
Stream.of(1, 2, 8, 3).dropWhile(x -> x < 5);                // 8, 3
Stream.concat(Stream.of(1), Stream.of(2));` },
        { kind: 'pitfall', text: 'A stream from `Files.lines` or `Files.list` holds an open file handle, and it isn\'t closed at the end of the pipeline automatically. Unlike most streams, these need try-with-resources.' },
        { kind: 'check', q: 'What goes wrong with `Stream.iterate(1, x -> x + 1).toList()`?', options: ['A compile error', 'It never finishes, since the stream is infinite', 'It returns one element', 'It returns an empty list'], answer: 1, hint: 'Where does it stop?', explain: 'It needs `limit`, `takeWhile`, or the three-argument `iterate` with a stop condition.' },
      ],
    },
    {
      id: 'transforming',
      title: 'filter, map & flatMap',
      blocks: [
        { kind: 'analogy', text: "`map` replaces each parcel with one parcel. `flatMap` opens each parcel and tips the contents on to the belt, so one parcel may become zero, one or many items. Whenever you see a list of lists and wanted a list, you wanted `flatMap`." },
        { kind: 'code', code: `List<String> lines = List.of("buy XAU 10", "sell EUR 500");

// map: one output for each input
List<Integer> lengths = lines.stream().map(String::length).toList();

// map gives a Stream<String[]>: rarely what you want
// flatMap gives a Stream<String>
List<String> words = lines.stream()
    .flatMap(l -> Arrays.stream(l.split(" ")))
    .toList();                                     // [buy, XAU, 10, sell, EUR, 500]

// mapMulti: an alternative that avoids creating small streams
List<Integer> evens = Stream.of(1, 2, 3, 4)
    .<Integer>mapMulti((x, sink) -> {
        if (x % 2 == 0) sink.accept(x);
    })
    .toList();

// Other transformations
Stream.of("b", "a", "b").distinct();               // b, a: first occurrences, in encounter order
Stream.of("bb", "a").sorted(Comparator.comparingInt(String::length));
Stream.of(1, 2, 3).peek(x -> System.out.println("saw " + x)).toList();  // for debugging only

// Simple reductions
long n = Stream.of(1, 2, 3).count();
Optional<Integer> most = Stream.of(1, 5, 3).max(Comparator.naturalOrder());
boolean any = Stream.of(1, 2).anyMatch(x -> x > 1);
boolean all = Stream.of(1, 2).allMatch(x -> x > 1);
boolean none = Stream.of(1, 2).noneMatch(x -> x > 5);
Optional<Integer> first = Stream.of(1, 2).findFirst();` },
        { kind: 'check', q: 'You have `List<Order>`, and each order has `List<Item> items()`. How do you get every item in one stream?', options: ['`orders.stream().map(Order::items)`', '`orders.stream().flatMap(o -> o.items().stream())`', '`orders.stream().filter(Order::items)`', '`orders.stream().items()`'], answer: 1, hint: 'You need to flatten one level.', explain: '`map` would give a stream of lists. `flatMap` joins each list\'s elements into one stream.' },
      ],
    },
    {
      id: 'optional',
      title: 'Optional',
      blocks: [
        { kind: 'analogy', text: "An `Optional` is a box that may be empty, and whose label says so. A method that returns `null` is a shelf that might have nothing on it, and you find out when your hand hits air. With a box, the compiler makes you go through the act of opening it." },
        { kind: 'code', code: `Optional<Trade> found = trades.stream()
    .filter(t -> t.sym().equals("XAU"))
    .findFirst();

double px = found.map(Trade::px).orElse(0.0);             // transform, with a default
double px2 = found.map(Trade::px)
                  .orElseGet(() -> expensiveFallback());  // computed only if empty
Trade t = found.orElseThrow();                            // NoSuchElementException if empty
found.ifPresent(x -> System.out.println(x));
found.ifPresentOrElse(System.out::println, () -> System.out.println("none"));
boolean has = found.isPresent();

Optional<String> sym = found.filter(x -> x.qty() > 1).map(Trade::sym);

// Chaining methods that themselves return Optional
Optional<String> city = findUser("nas").flatMap(User::address).map(Address::city);

// Creating one
Optional<String> a = Optional.of("x");            // NPE if given null
Optional<String> b = Optional.ofNullable(maybe);  // empty if given null
Optional<String> c = Optional.empty();` },
        { kind: 'list', items: [
          'Designed mainly as a **return type** for methods that may have no result.',
          'Don\'t use it for fields or parameters: overloads, or simply a nullable field that\'s private and handled carefully, are usually cleaner.',
          'Never return `null` from a method declared as returning `Optional`.',
          'Calling `get()` without checking is just a `NullPointerException` by another name. Prefer `map`, `orElse` and `orElseThrow`.',
          '`orElse(compute())` always evaluates the argument. Use `orElseGet(() -> compute())` when computing it is expensive.',
          'For primitives, there are `OptionalInt`, `OptionalDouble` and `OptionalLong`.',
        ] },
        { kind: 'compare',
          python: `sym = trade.sym if trade is not None else "none"`,
          cpp: `std::optional<Trade> t = find();
auto sym = t.transform(&Trade::sym).value_or("none");`,
          go: `t, ok := find()         // the comma-ok idiom
sym := "none"
if ok { sym = t.Sym }`,
          ts: `const sym = find()?.sym ?? "none"`,
          java: `String sym = find().map(Trade::sym).orElse("none");`,
          note: 'Java has no `?.` operator. `Optional.map` is the closest equivalent.' },
        { kind: 'check', q: 'When is `orElseGet` better than `orElse`?', options: ['Never', 'When the fallback is expensive: it is computed only if the Optional is empty', 'When the value is present', 'When the Optional holds a primitive'], answer: 1, hint: 'When are method arguments evaluated?', explain: '`orElse(f())` calls `f()` always, before `orElse` runs. `orElseGet` receives a lambda and only calls it when needed.' },
      ],
    },
    {
      id: 'collectors',
      title: 'Collecting, grouping & reducing',
      blocks: [
        { kind: 'analogy', text: "`collect` is the packing station at the end of the line. `groupingBy` sorts everything into labelled bins, and each bin has its own smaller packing station (a **downstream collector**) that can count, sum or list what lands in it. That is where SQL's `GROUP BY` lives in Java." },
        { kind: 'code', code: `import static java.util.stream.Collectors.*;

List<String> a = trades.stream().map(Trade::sym).toList();       // unmodifiable
Set<String> s = trades.stream().map(Trade::sym).collect(toSet());
String csv = trades.stream().map(Trade::sym).collect(joining(", ", "[", "]"));

// To a map: duplicates throw unless you say how to merge them
Map<String, Integer> totalQty = trades.stream()
    .collect(toMap(Trade::sym, Trade::qty, Integer::sum));

// GROUP BY
Map<String, List<Trade>> bySym = trades.stream().collect(groupingBy(Trade::sym));

// GROUP BY with an aggregate
Map<String, Long> counts = trades.stream()
    .collect(groupingBy(Trade::sym, counting()));

Map<String, Double> notional = trades.stream()
    .collect(groupingBy(Trade::sym, TreeMap::new, summingDouble(Trade::notional)));

Map<String, Set<Integer>> sizes = trades.stream()
    .collect(groupingBy(Trade::sym, mapping(Trade::qty, toSet())));

// Exactly two groups
Map<Boolean, List<Trade>> split = trades.stream()
    .collect(partitioningBy(t -> t.qty() >= 100));

// Two results from one pass
record Summary(long count, double total) {}
Summary summary = trades.stream().collect(teeing(
    counting(),
    summingDouble(Trade::notional),
    Summary::new));

// reduce: combines elements into one value
int sum = Stream.of(1, 2, 3).reduce(0, Integer::sum);
Optional<Integer> prod = Stream.of(1, 2, 3).reduce((x, y) -> x * y);` },
        { kind: 'compare',
          python: `import pandas as pd

df.groupby("sym")["notional"].sum()`,
          cpp: `std::map<std::string, double> total;
for (const auto& t : trades) total[t.sym] += t.notional();`,
          go: `total := map[string]float64{}
for _, t := range trades { total[t.Sym] += t.Notional() }`,
          ts: `const total = Object.groupBy(trades, t => t.sym)
// then reduce each group`,
          java: `var total = trades.stream()
    .collect(groupingBy(Trade::sym, summingDouble(Trade::notional)));`,
          note: 'For simple sums, a `HashMap` loop is equally valid. Collectors pay off when you compose them.' },
        { kind: 'pitfall', text: '`toMap` without a merge function throws `IllegalStateException` on a duplicate key. And `reduce`\'s identity must really be an identity for the operation: `reduce(1, Integer::sum)` might seem to work sequentially but gives wrong answers in parallel.' },
        { kind: 'check', q: 'What does `groupingBy(Trade::sym, counting())` produce?', options: ['`List<Long>`', '`Map<String, Long>`', '`Map<String, List<Trade>>`', '`Long`'], answer: 1, hint: 'The first argument gives the keys, and the second builds the values.', explain: 'Keys come from the classifier, and each value is the downstream collector\'s result for that group.' },
      ],
    },
    {
      id: 'primitive-parallel',
      title: 'Primitive & parallel streams',
      blocks: [
        { kind: 'analogy', text: "A `Stream<Integer>` wraps every number in its own little gift box and unwraps it at each station. `IntStream` skips the boxes. A parallel stream adds more assembly lines: great for a huge pile of independent parts, and a waste of effort for a small pile, or for parts that must stay in order or share one tool." },
        { kind: 'code', code: `double total = trades.stream().mapToDouble(Trade::notional).sum();   // no boxing
OptionalDouble avg = trades.stream().mapToInt(Trade::qty).average();

DoubleSummaryStatistics stats =
    trades.stream().mapToDouble(Trade::px).summaryStatistics();
System.out.println(stats.getMin() + " " + stats.getMax() + " " + stats.getAverage());

IntStream.range(0, 5).boxed().toList();                // back to objects
IntStream.range(0, 5).mapToObj(i -> "row" + i).toList();

// Parallel: splits work across the common ForkJoinPool
long primes = LongStream.rangeClosed(2, 5_000_000).parallel()
    .filter(n -> isPrime(n))
    .count();

// Wrong: a shared mutable list from many threads
List<Integer> bad = new ArrayList<>();
IntStream.range(0, 10_000).parallel().forEach(bad::add);   // lost updates, or a crash

// Right: let the collector do the combining
List<Integer> good = IntStream.range(0, 10_000).parallel().boxed().toList();` },
        { kind: 'list', items: [
          'Prefer `mapToInt`/`mapToDouble`/`mapToLong` for numbers. They offer `sum`, `average`, `min`, `max`, `summaryStatistics`, and they avoid boxing.',
          'Parallel streams work best on large data, with CPU-heavy independent work, and with sources that split well (arrays, `ArrayList`, ranges). `LinkedList` and `Stream.iterate` split poorly.',
          'Don\'t put blocking I/O in a parallel stream: all parallel streams share a single pool by default.',
          'Measure before using `.parallel()`. Coordination has a cost, and it can easily make small tasks slower.',
          'Order-sensitive operations (`findFirst`, `limit`) cost more in parallel. Use `findAny`, or `unordered()`, when order doesn\'t matter.',
        ] },
        { kind: 'check', q: 'Why is `mapToDouble(...).sum()` better than `map(...).reduce(0.0, Double::sum)` for numeric data?', options: ['It is required by the compiler', 'It avoids boxing each value, and states the intent directly', 'It sorts the data first', 'It always runs in parallel'], answer: 1, hint: 'What does `Stream<Double>` hold?', explain: 'A `DoubleStream` works directly on `double` values, without allocating wrappers.' },
      ],
    },
    {
      id: 'gatherers',
      title: 'Gatherers: custom stages',
      blocks: [
        { kind: 'analogy', text: "Collectors let you customise the packing station at the end of the line. For years the middle of the line was fixed: only the stations that came in the catalogue. **Gatherers** let you build your own station that can remember what passed by, so it can do things like \"take every three parts as a set\"." },
        { kind: 'new23', text: "This whole lesson is newer than the book. `Stream.gather` became final in **Java 24**. Before it, a moving average couldn't be written as a normal stream stage: you had to fall back on a loop." },
        { kind: 'code', code: `import java.util.stream.Gatherers;

List<Double> closes = List.of(10.0, 11.0, 12.0, 13.0, 14.0);

// Windows
closes.stream().gather(Gatherers.windowFixed(2)).toList();
// [[10.0, 11.0], [12.0, 13.0], [14.0]]

// A 3-period moving average
List<Double> sma = closes.stream()
    .gather(Gatherers.windowSliding(3))
    .map(w -> w.stream().mapToDouble(Double::doubleValue).average().orElseThrow())
    .toList();                                       // [11.0, 12.0, 13.0]

// A running total
List<Integer> running = Stream.of(1, 2, 3, 4)
    .gather(Gatherers.scan(() -> 0, Integer::sum))
    .toList();                                       // [1, 3, 6, 10]

// Concurrent mapping with a limit, on virtual threads, keeping order
List<String> pages = urls.stream()
    .gather(Gatherers.mapConcurrent(8, url -> fetch(url)))
    .toList();

// Your own: drop consecutive duplicates
static <T> Gatherer<T, ?, T> dedupe() {
    return Gatherer.ofSequential(
        () -> new Object[1],                          // state: the last value seen
        (state, element, downstream) -> {
            boolean changed = !Objects.equals(state[0], element);
            state[0] = element;
            return !changed || downstream.push(element);
        });
}` },
        { kind: 'list', items: [
          'A gatherer has up to four parts: an initialiser (state), an integrator (per element), a combiner (for parallel), and a finisher (at the end).',
          'Integrators return `false` to signal "stop sending". They can emit zero, one or many elements per input.',
          'Built-ins: `fold`, `scan`, `windowFixed`, `windowSliding`, `mapConcurrent`.',
        ] },
        { kind: 'check', q: 'What does `Gatherers.windowSliding(2)` produce from 1, 2, 3?', options: ['`[1, 2], [3]`', '`[1, 2], [2, 3]`', '`[1], [2], [3]`', '`3`'], answer: 1, hint: 'Sliding windows overlap.', explain: '`windowSliding` advances by one element at a time. `windowFixed` gives non-overlapping groups.' },
      ],
    },
  ],
  quiz: [
    { q: 'What starts a stream pipeline running?', options: ['`stream()`', 'A terminal operation', '`filter`', 'A separate thread'], answer: 1, explain: 'Intermediate operations are lazy. Nothing happens until something like `toList` or `count`.' },
    { q: 'Can you reuse a stream after a terminal operation?', options: ['Yes', 'No: it throws `IllegalStateException`', 'Only if sequential', 'Only for `IntStream`'], answer: 1, explain: 'Get a fresh stream from the source for each pipeline.' },
    { q: 'What is the difference between `map` and `flatMap`?', options: ['`flatMap` is parallel', '`map` is one-to-one; `flatMap` turns each element into a stream and joins them', '`flatMap` sorts', 'There is none'], answer: 1, explain: 'Use `flatMap` when each input expands to zero or more outputs.' },
    { q: 'What does `Stream.toList()` return?', options: ['A modifiable `ArrayList`', 'An unmodifiable list', 'A `LinkedList`', 'A stream'], answer: 1, explain: 'If you need to modify it, collect with `toCollection(ArrayList::new)` instead.' },
    { q: 'What is `Optional` mainly designed for?', options: ['Fields', 'Method return values that may be absent', 'Parameters', 'Replacing every reference'], answer: 1, explain: 'It makes possible absence visible in a method\'s signature.' },
    { q: 'What happens with `toMap` when two elements have the same key and there is no merge function?', options: ['The last wins', 'The first wins', 'It throws `IllegalStateException`', 'It collects a list'], answer: 2, explain: 'Pass a third argument to say how to merge duplicates.' },
    { q: 'Which is a good fit for a parallel stream?', options: ['Writing to one file', 'A CPU-heavy calculation over a large array', 'A few small items', 'Calling a slow web API from each element'], answer: 1, explain: 'Independent CPU work on data that splits well. Blocking calls would tie up the shared pool.' },
    { q: 'What do stream gatherers add?', options: ['Custom terminal collectors', 'Custom intermediate operations, including stateful ones', 'A new parallel engine', 'Mutable streams'], answer: 1, explain: 'They arrived in Java 24, via `Stream.gather`. Windows and running totals are built in.' },
  ],
}
