import type { StdEntry } from '../standard'

// The most useful classes and methods in Java's standard library.
export const JAVA_STANDARD: StdEntry[] = [
  // ---------------- Text ----------------
  {
    name: 'String.format / formatted / printf', header: 'java.lang', cat: 'Text', module: 1,
    summary: 'Build formatted text with verbs like %s and %.2f.',
    what: '`String.format` and `"...".formatted(...)` return a string, and `System.out.printf` prints. Verbs: `%s` any value, `%d` integer, `%.2f` fixed decimals, `%,d` thousands, `%-8s` left align, `%n` newline.',
    code: `String a = "%-6s|%8.2f".formatted("XAU", 2390.5);
System.out.printf("%s x %,d%n", "EUR", 1500000);`,
    when: 'Any readable output, such as reports, logs or fixed-width tables. Use `+` for simple joins.',
  },
  {
    name: 'String.split / join / strip / lines', header: 'java.lang', cat: 'Text', module: 1,
    summary: 'Break text apart, glue it together and clean it up.',
    what: '`split` takes a regex and drops trailing empties. `String.join` concatenates with a separator. `strip` removes whitespace at both ends and understands Unicode. `lines` streams the lines of a string. `isBlank` tests for whitespace only.',
    code: `String[] parts = "a,b,c".split(",");
String joined = String.join(" | ", parts);
String clean = "  hi  ".strip();
long n = "a\\nb".lines().count();
boolean none = "   ".isBlank();`,
    when: 'Parsing simple text formats and tidying input. For real CSV with quotes, use a library.',
  },
  {
    name: 'StringBuilder', header: 'java.lang', cat: 'Text', module: 1,
    summary: 'A mutable buffer for assembling strings efficiently.',
    what: 'Strings are immutable, so `+=` in a loop copies the whole string each time. `StringBuilder` appends in place and converts at the end. `repeat` was added in Java 21.',
    code: `var sb = new StringBuilder();
for (String s : List.of("a", "b")) sb.append(s).append(',');
sb.setLength(sb.length() - 1);
sb.repeat("-", 3);
String out = sb.toString();`,
    when: 'Building a string across a loop. A simple one-line `+` is fine.',
  },
  {
    name: 'Pattern / Matcher', header: 'java.util.regex', cat: 'Text', module: 9,
    summary: 'Compiled regular expressions.',
    what: '`Pattern.compile` is relatively costly and thread-safe, so hold compiled patterns in constants. `Matcher` is one search: `matches` for the whole input, `find` for each occurrence, and `results` as a stream.',
    code: `var p = Pattern.compile("(?<sym>[A-Z]{3}) (?<qty>\\\\d+)");
Matcher m = p.matcher("XAU 10");
if (m.matches()) System.out.println(m.group("qty"));
List<String> all = p.matcher("XAU 1 EUR 2").results().map(MatchResult::group).toList();`,
    when: 'Validating formats and extracting fields from text. Prefer plain `String` methods for simple cases.',
  },

  // ---------------- Numbers ----------------
  {
    name: 'Math', header: 'java.lang', cat: 'Numbers', module: 1,
    summary: 'Common numeric functions, including overflow-checked arithmetic.',
    what: '`max`, `min`, `abs`, `round`, `sqrt`, `pow`, `floorMod`, `clamp` (Java 21). The `addExact`, `multiplyExact` family throws on overflow rather than wrapping.',
    code: `int m = Math.max(3, 9);
long r = Math.round(2.5);        // 3
int w = Math.floorMod(-7, 3);    // 2
int c = Math.clamp(150L, 0, 100); // 100
int s = Math.addExact(1, 2);`,
    when: 'Everyday calculation. Use the `Exact` methods anywhere overflow would be a silent bug.',
  },
  {
    name: 'Integer / Long / Double helpers', header: 'java.lang', cat: 'Numbers', module: 1,
    summary: 'Parse, compare and inspect numbers.',
    what: 'Wrappers have static helpers: `parseInt`, `compare`, `MAX_VALUE`, `toHexString`, `bitCount`. `Double.isNaN` tests for NaN, since `NaN != NaN`.',
    code: `int n = Integer.parseInt("42");
int c = Integer.compare(1, 2);
String hex = Integer.toHexString(255);   // ff
boolean bad = Double.isNaN(0.0 / 0);`,
    when: 'Converting from text, writing comparators and working with bits.',
  },
  {
    name: 'BigDecimal', header: 'java.math', cat: 'Numbers', module: 1,
    summary: 'Exact decimal arithmetic.',
    what: 'Arbitrary-precision decimals with control over rounding. Construct from strings, not doubles. They are immutable, so each operation returns a new value. `compareTo` ignores scale, whereas `equals` does not.',
    code: `var px = new BigDecimal("2390.50");
var total = px.multiply(new BigDecimal("3"));
var fee = total.multiply(new BigDecimal("0.001")).setScale(2, RoundingMode.HALF_EVEN);
boolean same = new BigDecimal("1.0").compareTo(new BigDecimal("1.00")) == 0;  // true`,
    when: 'Money and any decimal that must be exact. For speed, long counts of cents are also common.',
  },

  // ---------------- Collections ----------------
  {
    name: 'List.of / Set.of / Map.of', header: 'java.util', cat: 'Collections', module: 7,
    summary: 'Compact unmodifiable collections.',
    what: 'Factory methods that create unmodifiable collections, reject nulls, and throw on duplicate set elements or map keys. `copyOf` makes an unmodifiable copy.',
    code: `var xs = List.of(1, 2, 3);
var ss = Set.of("a", "b");
var mm = Map.of("XAU", 1, "EUR", 2);
var safe = List.copyOf(xs);`,
    when: 'Constants, test data, and defensive copies. Use `new ArrayList<>(List.of(...))` when you need to change it.',
  },
  {
    name: 'ArrayList', header: 'java.util', cat: 'Collections', module: 7,
    summary: 'The default growable list.',
    what: 'Backed by an array: indexing is constant, appending is amortised constant, and inserting in the middle is linear. Java 21 added `getFirst`, `getLast`, `reversed`.',
    code: `var xs = new ArrayList<String>();
xs.add("a");
xs.addFirst("z");
xs.sort(Comparator.naturalOrder());
xs.removeIf(String::isEmpty);
String last = xs.getLast();`,
    when: 'Whenever you need a list, unless there is a concrete reason otherwise.',
  },
  {
    name: 'HashMap', header: 'java.util', cat: 'Collections', module: 7,
    summary: 'The default key-value store.',
    what: 'Constant time on average, with keys hashed through `hashCode` and `equals`. Order isn\'t guaranteed. `merge`, `computeIfAbsent` and `getOrDefault` replace most manual checks.',
    code: `var m = new HashMap<String, Integer>();
m.merge("XAU", 1, Integer::sum);
int n = m.getOrDefault("EUR", 0);
m.computeIfAbsent("XAG", _ -> 0);
m.forEach((k, v) -> System.out.println(k + "=" + v));`,
    when: 'Lookups, counting, grouping and caching on a single thread.',
  },
  {
    name: 'TreeMap', header: 'java.util', cat: 'Collections', module: 7,
    summary: 'A sorted map with range queries.',
    what: 'A red-black tree with logarithmic operations. Offers navigation: `floorKey`, `ceilingKey`, `headMap`, `tailMap`, `firstEntry`, `descendingMap`.',
    code: `var book = new TreeMap<Double, Integer>();
book.put(100.0, 50);
book.put(99.5, 100);
double bid = book.lastKey();
Double near = book.floorKey(99.9);   // 99.5
var below = book.headMap(100.0);`,
    when: 'Order books, time series keyed by timestamp, and anything needing "next nearest".',
  },
  {
    name: 'ArrayDeque', header: 'java.util', cat: 'Collections', module: 7,
    summary: 'The fast stack and queue.',
    what: 'A resizable circular array. Use `push`/`pop`/`peek` as a stack, and `offer`/`poll` as a queue. Rejects nulls.',
    code: `var stack = new ArrayDeque<Integer>();
stack.push(1);
int top = stack.pop();

var queue = new ArrayDeque<String>();
queue.offer("a");
String next = queue.poll();`,
    when: 'Any stack or FIFO queue, in place of `Stack` and `LinkedList`.',
  },
  {
    name: 'PriorityQueue', header: 'java.util', cat: 'Collections', module: 7,
    summary: 'Always gives you the smallest item next.',
    what: 'A binary heap, ordered naturally or by a comparator. Iteration order isn\'t sorted, only `poll` is.',
    code: `var q = new PriorityQueue<>(Comparator.comparingInt(String::length));
q.add("xxx");
q.add("x");
String shortest = q.poll();`,
    when: 'Scheduling, top-K problems and shortest-path algorithms.',
  },
  {
    name: 'Collections / Arrays helpers', header: 'java.util', cat: 'Collections', module: 7,
    summary: 'Utility methods for lists and arrays.',
    what: '`Arrays`: `sort`, `binarySearch`, `fill`, `copyOf`, `toString`, `stream`, `asList`. `Collections`: `shuffle`, `reverse`, `frequency`, `nCopies`, `unmodifiableList`.',
    code: `int[] xs = {3, 1, 2};
Arrays.sort(xs);
int i = Arrays.binarySearch(xs, 2);
System.out.println(Arrays.toString(xs));
var list = new ArrayList<>(List.of(1, 2));
Collections.shuffle(list);`,
    when: 'Printing arrays, quick sorting and small list operations.',
  },
  {
    name: 'Objects', header: 'java.util', cat: 'Collections', module: 4,
    summary: 'Null-safe helpers for equals, hash and checks.',
    what: '`equals` handles nulls, `hash` builds a combined hash, `requireNonNull` fails fast, `requireNonNullElse` supplies a default, `checkIndex` validates a range.',
    code: `boolean same = Objects.equals(a, b);
int h = Objects.hash(sym, qty);
String v = Objects.requireNonNull(input, "input");
String w = Objects.requireNonNullElse(input, "default");`,
    when: 'Writing `equals` and `hashCode`, and validating constructor arguments.',
  },
  {
    name: 'Comparator', header: 'java.util', cat: 'Collections', module: 3,
    summary: 'Compose sort orders from keys.',
    what: 'Combinators such as `comparing`, `comparingInt`, `thenComparing`, `reversed`, `naturalOrder`, `nullsFirst`.',
    code: `trades.sort(Comparator.comparing(Trade::sym)
    .thenComparing(Trade::px, Comparator.reverseOrder()));`,
    when: 'Every custom sort. Avoid writing comparison logic by hand.',
  },

  // ---------------- Streams ----------------
  {
    name: 'Stream.filter / map / flatMap', header: 'java.util.stream', cat: 'Streams', module: 8,
    summary: 'The core transformations.',
    what: '`filter` keeps matching elements, `map` converts each element, `flatMap` expands each into zero or more. All are lazy.',
    code: `List<String> syms = trades.stream()
    .filter(t -> t.qty() > 10)
    .map(Trade::sym)
    .distinct()
    .sorted()
    .toList();`,
    when: 'Declarative data transformation. A loop is fine for complex control flow.',
  },
  {
    name: 'Collectors.groupingBy', header: 'java.util.stream', cat: 'Streams', module: 8,
    summary: 'SQL-style GROUP BY.',
    what: 'Groups by a classifier into a map, with optional map type and downstream collector: `counting`, `summingDouble`, `averagingInt`, `mapping`, `toSet`.',
    code: `Map<String, Long> n = trades.stream()
    .collect(Collectors.groupingBy(Trade::sym, Collectors.counting()));
Map<String, Double> sum = trades.stream()
    .collect(Collectors.groupingBy(Trade::sym, Collectors.summingDouble(Trade::px)));`,
    when: 'Aggregating records by key.',
  },
  {
    name: 'Collectors.toMap / joining / partitioningBy', header: 'java.util.stream', cat: 'Streams', module: 8,
    summary: 'Other everyday terminal collections.',
    what: '`toMap` builds a map, and throws on duplicates unless given a merge function. `joining` concatenates strings. `partitioningBy` splits into `true` and `false` lists.',
    code: `var bySym = trades.stream().collect(Collectors.toMap(Trade::sym, Trade::qty, Integer::sum));
String csv = syms.stream().collect(Collectors.joining(","));
var split = trades.stream().collect(Collectors.partitioningBy(t -> t.qty() > 10));`,
    when: 'Turning streams into lookup tables and text.',
  },
  {
    name: 'IntStream / summaryStatistics', header: 'java.util.stream', cat: 'Streams', module: 8,
    summary: 'Numeric streams, with no boxing.',
    what: '`range`, `rangeClosed`, `sum`, `average`, `max`, `boxed`, `mapToObj`. `summaryStatistics` gives count, min, max, mean and sum in one pass.',
    code: `int total = IntStream.rangeClosed(1, 10).sum();
var stats = trades.stream().mapToDouble(Trade::px).summaryStatistics();
System.out.println(stats.getAverage());`,
    when: 'Counting loops and numeric summaries.',
  },
  {
    name: 'Gatherers', header: 'java.util.stream', cat: 'Streams', module: 8, since: 'Java 24',
    summary: 'Windows, running totals and concurrent maps inside a stream.',
    what: '`windowFixed`, `windowSliding`, `fold`, `scan` and `mapConcurrent`. Used with `Stream.gather`.',
    code: `var sma = closes.stream()
    .gather(Gatherers.windowSliding(20))
    .map(w -> w.stream().mapToDouble(Double::doubleValue).average().orElseThrow())
    .toList();`,
    when: 'Rolling calculations and bounded concurrency over a stream.',
  },
  {
    name: 'Optional', header: 'java.util', cat: 'Streams', module: 8,
    summary: 'A value that might be absent.',
    what: '`of`, `ofNullable`, `empty`, then `map`, `filter`, `flatMap`, `orElse`, `orElseGet`, `orElseThrow`, `ifPresent`, `ifPresentOrElse`.',
    code: `String name = find(id).map(User::name).orElse("guest");
User u = find(id).orElseThrow(() -> new IllegalStateException("no user " + id));`,
    when: 'Method return types where "nothing found" is normal.',
  },

  // ---------------- I/O ----------------
  {
    name: 'Files.readString / writeString / lines', header: 'java.nio.file', cat: 'I/O', module: 9,
    summary: 'The simple ways to read and write text files.',
    what: '`readString` and `writeString` handle whole files, `readAllLines` returns a list, and `lines` streams lazily. All use UTF-8 by default.',
    code: `String all = Files.readString(Path.of("a.txt"));
Files.writeString(Path.of("b.txt"), all.toUpperCase());
try (Stream<String> s = Files.lines(Path.of("big.csv"))) {
    long n = s.count();
}`,
    when: 'Config files and small data use the whole-file methods. Large files use `lines`.',
  },
  {
    name: 'Files.walk / list / copy / move', header: 'java.nio.file', cat: 'I/O', module: 9,
    summary: 'Work with the file system.',
    what: '`list` is one directory, `walk` is the whole tree. `createDirectories`, `copy`, `move`, `deleteIfExists`, `size`, `isDirectory`.',
    code: `try (Stream<Path> tree = Files.walk(Path.of("logs"))) {
    tree.filter(p -> p.toString().endsWith(".log")).forEach(System.out::println);
}
Files.createDirectories(Path.of("out/2026"));`,
    when: 'File tooling, build scripts and data pipelines.',
  },
  {
    name: 'HttpClient', header: 'java.net.http', cat: 'I/O', module: 9,
    summary: 'A modern HTTP client built in.',
    what: 'Builders for client and request, sync `send` and async `sendAsync`, and body handlers for strings, files, or lines. Supports HTTP/1.1, HTTP/2, and since Java 26, HTTP/3.',
    code: `try (var client = HttpClient.newHttpClient()) {
    var req = HttpRequest.newBuilder(URI.create("https://example.com")).build();
    var res = client.send(req, HttpResponse.BodyHandlers.ofString());
    System.out.println(res.statusCode());
}`,
    when: 'Calling web APIs with no extra dependencies.',
  },
  {
    name: 'Scanner', header: 'java.util', cat: 'I/O', module: 1,
    summary: 'A simple parser for console and text input.',
    what: 'Reads tokens and lines from a source, with `nextInt`, `nextLine`, `hasNext`. Convenient, but slow for large input.',
    code: `var in = new Scanner(System.in);
while (in.hasNextLine()) {
    String line = in.nextLine();
}`,
    when: 'Small command-line programs and exercises. Use `BufferedReader` for volume.',
  },

  // ---------------- Dates & times ----------------
  {
    name: 'LocalDate / LocalDateTime', header: 'java.time', cat: 'Dates & times', module: 9,
    summary: 'Dates and times with no time zone.',
    what: 'Immutable types. Methods such as `plusDays` return new objects. `parse` reads ISO format, and `getDayOfWeek` and `isBefore` handle common needs.',
    code: `LocalDate d = LocalDate.of(2026, 11, 6);
LocalDate next = d.plusDays(30);
boolean weekend = d.getDayOfWeek().getValue() >= 6;
LocalDate parsed = LocalDate.parse("2026-01-31");`,
    when: 'Birthdays, schedules and business dates. Use it in place of the old `Date` and `Calendar`.',
  },
  {
    name: 'Instant / Duration / ZonedDateTime', header: 'java.time', cat: 'Dates & times', module: 9,
    summary: 'Points on the timeline, spans of time, and zones.',
    what: '`Instant` is a UTC timestamp, `Duration` a time span, and `ZonedDateTime` a time with a zone and its daylight-saving rules. `Period` covers calendar spans such as "one month".',
    code: `Instant t0 = Instant.now();
Duration took = Duration.between(t0, Instant.now());
var ny = ZonedDateTime.of(2026, 11, 6, 9, 30, 0, 0, ZoneId.of("America/New_York"));
Instant same = ny.toInstant();`,
    when: 'Log timestamps and elapsed time use `Instant`. Anything shown to users in their zone uses `ZonedDateTime`.',
  },
  {
    name: 'DateTimeFormatter', header: 'java.time.format', cat: 'Dates & times', module: 9,
    summary: 'Format and parse dates. Immutable and thread-safe.',
    what: 'Predefined forms such as `ISO_LOCAL_DATE`, plus patterns through `ofPattern`. It replaces `SimpleDateFormat`, which isn\'t thread-safe.',
    code: `var f = DateTimeFormatter.ofPattern("dd/MM/yyyy");
String s = LocalDate.of(2026, 11, 6).format(f);   // 06/11/2026
LocalDate d = LocalDate.parse("06/11/2026", f);`,
    when: 'Any date in or out of text. Keep one in a `static final` constant.',
  },

  // ---------------- Concurrency ----------------
  {
    name: 'Executors', header: 'java.util.concurrent', cat: 'Concurrency', module: 10,
    summary: 'Ready-made thread pools.',
    what: '`newFixedThreadPool` for CPU work, `newVirtualThreadPerTaskExecutor` for blocking tasks, `newScheduledThreadPool` for timers. All are closeable.',
    code: `try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    var f = ex.submit(() -> "done");
    System.out.println(f.get());
}`,
    when: 'Any time you would otherwise create threads by hand.',
  },
  {
    name: 'CompletableFuture', header: 'java.util.concurrent', cat: 'Concurrency', module: 10,
    summary: 'Chain asynchronous steps.',
    what: '`supplyAsync` starts work, `thenApply` and `thenCompose` chain, `thenCombine` joins two, `allOf` waits for many, and `exceptionally` recovers.',
    code: `var total = CompletableFuture.supplyAsync(() -> 2)
    .thenCombine(CompletableFuture.supplyAsync(() -> 3), Integer::sum)
    .exceptionally(e -> 0)
    .join();`,
    when: 'Combining async results, particularly with callback-style APIs.',
  },
  {
    name: 'ConcurrentHashMap', header: 'java.util.concurrent', cat: 'Concurrency', module: 10,
    summary: 'A map shared between threads.',
    what: 'Per-key atomic `merge`, `compute` and `computeIfAbsent`, without a global lock. Disallows null keys and values.',
    code: `var hits = new ConcurrentHashMap<String, Long>();
hits.merge("XAU", 1L, Long::sum);`,
    when: 'Shared caches and counters. Prefer it to `Collections.synchronizedMap`.',
  },
  {
    name: 'BlockingQueue', header: 'java.util.concurrent', cat: 'Concurrency', module: 10,
    summary: 'A hand-off point between threads, with backpressure.',
    what: '`put` waits while full, `take` waits while empty, and `offer` and `poll` accept timeouts. `ArrayBlockingQueue` is bounded.',
    code: `BlockingQueue<String> q = new ArrayBlockingQueue<>(100);
q.put("job");
String job = q.take();`,
    when: 'Producer and consumer designs.',
  },
  {
    name: 'AtomicLong / LongAdder', header: 'java.util.concurrent.atomic', cat: 'Concurrency', module: 10,
    summary: 'Thread-safe counters without locks.',
    what: '`AtomicLong` offers compare-and-set and exact reads. `LongAdder` is faster under heavy write contention, but `sum` isn\'t an atomic snapshot.',
    code: `var n = new AtomicLong();
n.incrementAndGet();
var a = new LongAdder();
a.increment();
long total = a.sum();`,
    when: 'Metrics and statistics counters, and simple shared state.',
  },
  {
    name: 'Semaphore / CountDownLatch', header: 'java.util.concurrent', cat: 'Concurrency', module: 14,
    summary: 'Limit concurrency, or wait for events.',
    what: 'A `Semaphore` hands out a fixed number of permits. A `CountDownLatch` lets threads wait until a count reaches zero.',
    code: `var permits = new Semaphore(10);
permits.acquire();
try { callDatabase(); }
finally { permits.release(); }`,
    when: 'Throttling virtual threads\' access to a scarce resource, and coordinating startup.',
  },
  {
    name: 'ScopedValue', header: 'java.lang', cat: 'Concurrency', module: 14, since: 'Java 25',
    summary: 'Immutable context for one call tree.',
    what: 'Bind with `where(...).run(...)` or `.call(...)`, and read anywhere below with `get`. Cheap for large numbers of threads, and it can\'t leak.',
    code: `static final ScopedValue<String> REQ = ScopedValue.newInstance();
ScopedValue.where(REQ, "req-1").run(() -> System.out.println(REQ.get()));`,
    when: 'Request IDs and the current user, in place of a `ThreadLocal`.',
  },

  // ---------------- Reflection & platform ----------------
  {
    name: 'System', header: 'java.lang', cat: 'Platform', module: 1,
    summary: 'Access to standard streams, time, the environment and properties.',
    what: '`out`, `err`, `in`, `nanoTime` for elapsed time, `currentTimeMillis` for wall time, `getenv`, `getProperty`, `lineSeparator`.',
    code: `long t0 = System.nanoTime();
String home = System.getenv("HOME");
String version = System.getProperty("java.version");
System.err.println((System.nanoTime() - t0) + " ns");`,
    when: 'Timing code, reading configuration and writing errors.',
  },
  {
    name: 'Class / Method / Field', header: 'java.lang.reflect', cat: 'Platform', module: 4,
    summary: 'Inspect and call code at runtime.',
    what: '`getClass`, `Class.forName`, `getMethods`, `getRecordComponents`, `getAnnotation`, and `Method.invoke`. Subject to module encapsulation.',
    code: `Class<?> c = Class.forName("java.util.ArrayList");
Object o = c.getDeclaredConstructor().newInstance();
c.getMethod("add", Object.class).invoke(o, "x");`,
    when: 'Frameworks, plug-ins and tooling. Rarely in application logic.',
  },
  {
    name: 'ServiceLoader', header: 'java.util', cat: 'Platform', module: 12,
    summary: 'Discover plug-in implementations.',
    what: 'Loads providers declared by `provides ... with`, or listed in `META-INF/services`. Iterates lazily.',
    code: `for (PriceFeed feed : ServiceLoader.load(PriceFeed.class)) {
    System.out.println(feed.getClass());
}`,
    when: 'Keeping a consumer from depending on a specific implementation.',
  },
  {
    name: 'ProcessBuilder', header: 'java.lang', cat: 'Platform', module: 10,
    summary: 'Run another program.',
    what: 'Set command, directory and environment, redirect streams, then `start`. Read the output with `inputReader`, and finish with `waitFor`.',
    code: `Process p = new ProcessBuilder("git", "status").redirectErrorStream(true).start();
try (var r = p.inputReader()) {
    r.lines().forEach(System.out::println);
}
int code = p.waitFor();`,
    when: 'Scripting and calling external tools. Always read or redirect output.',
  },
]
