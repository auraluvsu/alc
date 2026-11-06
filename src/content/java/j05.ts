import type { Module } from '../types'

export const j05: Module = {
  n: 5,
  title: 'Exceptions, Assertions, and Logging',
  tour: '5 · Exceptions, Assertions, and Logging',
  summary: 'Throwing and catching, the checked and unchecked split, try-with-resources, designing your own exceptions, assertions for internal checks, and logging that helps at 3am.',
  topics: ['throw, try & catch', 'Checked vs unchecked', 'try-with-resources & finally', 'Custom exceptions & chaining', 'Assertions', 'Logging'],
  cpp23: [
    '`catch (IOException _)` documents that the exception object is deliberately unused (Java 22).',
    'Helpful `NullPointerException` messages name exactly what was null (on by default since Java 15).',
  ],
  lessons: [
    {
      id: 'throwing',
      title: 'Throwing and catching',
      blocks: [
        { kind: 'analogy', text: "An exception is a fire alarm. The code that smells smoke doesn't need to know who evacuates whom: it pulls the handle. The alarm travels up the building, floor by floor (the call stack), until it reaches someone trained to deal with it. If nobody is, the whole program shuts down with a report of the path the alarm took." },
        { kind: 'code', code: `public static int parseQty(String s) {
    int qty = Integer.parseInt(s);                  // throws NumberFormatException
    if (qty <= 0) {
        throw new IllegalArgumentException("qty must be positive: " + qty);
    }
    return qty;
}

try {
    int q = parseQty(input);
    System.out.println(q);
} catch (NumberFormatException e) {                 // most specific first
    System.out.println("Not a number: " + e.getMessage());
} catch (IllegalArgumentException | IllegalStateException e) {   // multi-catch
    System.out.println("Bad value: " + e.getMessage());
}` },
        { kind: 'list', items: [
          'When an exception is thrown, the method stops at once, and the JVM unwinds the stack looking for a matching `catch`.',
          '`catch` clauses are tried top to bottom. A superclass before its subclass is a compile error, since the later one could never run.',
          'An uncaught exception ends the thread, printing the type, message and stack trace. If that was the main thread and no others are running, the program exits.',
          'A stack trace reads top down: the first line is where it was thrown, and each following line is the caller.',
        ] },
        { kind: 'code', code: `Exception in thread "main" java.lang.IllegalArgumentException: qty must be positive: -1
    at Orders.parseQty(Orders.java:5)      // thrown here
    at Orders.load(Orders.java:12)         // called from here
    at Orders.main(Orders.java:20)         // which was called from here`, caption: 'Read the first line of "at" that is in your own code. That is usually where the investigation should begin.' },
        { kind: 'new23', text: "Since Java 15, null dereferences explain themselves: `Cannot invoke \"String.length()\" because \"order.sym\" is null`, instead of a bare `NullPointerException`. And since **Java 22**, `catch (NumberFormatException _)` says outright that you don't need the exception object." },
        { kind: 'compare',
          python: `try:
    q = parse_qty(s)
except ValueError as e:
    print(e)`,
          cpp: `try {
    int q = parseQty(s);
} catch (const std::invalid_argument& e) {
    std::println("{}", e.what());
}`,
          go: `q, err := parseQty(s)   // no exceptions: errors are values
if err != nil {
    fmt.Println(err)
}`,
          ts: `try {
  const q = parseQty(s)
} catch (e) {            // e is unknown: only one catch clause
  console.log(e)
}`,
          java: `try {
    int q = parseQty(s);
} catch (IllegalArgumentException e) {
    System.out.println(e.getMessage());
}`,
          note: 'Java catches by type, across several clauses. Note that `NumberFormatException` is itself a subclass of `IllegalArgumentException`.' },
        { kind: 'check', q: 'Why is this a compile error?', code: `try { f(); }
catch (Exception e) { }
catch (IOException e) { }`, options: ['`f` has no return value', 'The second clause is unreachable, since `Exception` catches everything it would', 'A `try` allows only one `catch`', '`IOException` is not an exception'], answer: 1, hint: 'What does `IOException` extend?', explain: 'Clauses are tried in order. Put the specific type first, and the general one after.' },
      ],
    },
    {
      id: 'checked',
      title: 'Checked vs unchecked',
      blocks: [
        { kind: 'analogy', text: "A checked exception is a clause in a contract, stated up front: \"this delivery may fail because the road floods\". The compiler is the lawyer who won't let you sign without saying what you will do about it. An unchecked exception is more like a bug on the contractor's side: nobody writes \"I may build the wall in the wrong place\" into the contract. You just fix it." },
        { kind: 'code', code: `// Throwable
// |-- Error                      serious JVM problems: OutOfMemoryError. Don't catch.
// |-- Exception
//     |-- IOException, SQLException...     CHECKED: must be handled or declared
//     |-- RuntimeException                 UNCHECKED: usually a bug
//         |-- NullPointerException
//         |-- IllegalArgumentException
//         |-- IndexOutOfBoundsException

// A checked exception must be declared in the signature...
public static String firstLine(Path p) throws IOException {
    return Files.readAllLines(p).getFirst();
}

// ...or caught by the caller
public static String firstLineOr(Path p, String fallback) {
    try {
        return firstLine(p);
    } catch (IOException e) {
        return fallback;
    }
}` },
        { kind: 'list', items: [
          '**Checked** (`Exception` and subclasses, excluding `RuntimeException`): outside your control and expected, such as a missing file or a dropped connection. The compiler forces you to deal with them.',
          '**Unchecked** (`RuntimeException` and `Error`): usually programming mistakes. Fix the code rather than catching them.',
          'An override can\'t declare broader checked exceptions than the method it overrides, though it can declare fewer.',
          'Common standard exceptions: `IllegalArgumentException` (bad argument), `IllegalStateException` (wrong time to call this), `UnsupportedOperationException`, `NullPointerException`, `IndexOutOfBoundsException`.',
          'Many modern libraries prefer unchecked exceptions, and lambdas sit awkwardly with checked ones. `java.io.UncheckedIOException` exists to wrap an `IOException` for such cases.',
        ] },
        { kind: 'pitfall', text: 'The worst handler is an empty one: `catch (Exception e) {}`. The failure vanishes, and the program carries on with bad data. If you truly can\'t handle something, let it propagate or wrap and rethrow it. At the very least, log it.' },
        { kind: 'check', q: 'Which of these must you handle or declare?', options: ['`NullPointerException`', '`IllegalArgumentException`', '`IOException`', '`ArithmeticException`'], answer: 2, hint: 'Which one does not extend `RuntimeException`?', explain: '`IOException` is checked. The others extend `RuntimeException`, so the compiler doesn\'t require handling.' },
      ],
    },
    {
      id: 'resources',
      title: 'try-with-resources & finally',
      blocks: [
        { kind: 'analogy', text: "try-with-resources is a library that automatically checks your book back in the moment you walk out the door, whether you leave calmly or because of a fire alarm. You can't forget, even on the worst day." },
        { kind: 'code', code: `try (var in = Files.newBufferedReader(Path.of("in.txt"));     // anything AutoCloseable
     var out = Files.newBufferedWriter(Path.of("out.txt"))) {
    String line;
    while ((line = in.readLine()) != null) {
        out.write(line.toUpperCase());
        out.newLine();
    }
}   // out closes first, then in: reverse order, even if an exception is thrown

// Your own class joins in by implementing AutoCloseable
public class Timer implements AutoCloseable {
    private final long start = System.nanoTime();
    @Override public void close() {
        System.out.println((System.nanoTime() - start) / 1_000_000 + " ms");
    }
}

try (var t = new Timer()) {
    expensiveWork();
}` },
        { kind: 'list', items: [
          'Resources close automatically in reverse order of creation, on every way out of the block.',
          'If the body throws and `close()` also throws, the body\'s exception is the one you see, and the other is attached: read it with `getSuppressed()`.',
          '`finally` always runs, whether or not an exception occurred. These days, it\'s only needed for cleanup that isn\'t a resource, such as unlocking.',
          'Objects are not closed by the garbage collector in any reliable way. Don\'t depend on it, and don\'t use the deprecated `finalize`.',
        ] },
        { kind: 'code', code: `lock.lock();
try {
    update();
} finally {
    lock.unlock();      // must happen even if update() throws
}` },
        { kind: 'pitfall', text: 'Never `return` or `throw` from a `finally` block. It silently discards any exception in flight and overrides any earlier return value.' },
        { kind: 'compare',
          python: `with open("in.txt") as f:
    data = f.read()`,
          cpp: `{
    std::ifstream f{"in.txt"};
    // ...
}   // RAII: the destructor closes it at end of scope`,
          go: `f, err := os.Open("in.txt")
if err != nil { return err }
defer f.Close()`,
          ts: `{
  await using f = await open("in.txt")
  // closed at end of the block
}`,
          java: `try (var in = Files.newBufferedReader(Path.of("in.txt"))) {
    return in.readLine();
}`,
          note: 'This is Java\'s form of RAII or `with`. Since objects have no destructors, the block marks when cleanup happens.' },
        { kind: 'check', q: 'In what order do these close?', code: `try (var a = open("a"); var b = open("b")) {
    work();
}`, options: ['a then b', 'b then a', 'Whenever the GC runs', 'Only if `work` succeeds'], answer: 1, hint: 'Later resources may depend on earlier ones.', explain: 'Resources close in reverse order of creation, whether `work` succeeds or throws.' },
      ],
    },
    {
      id: 'custom',
      title: 'Custom exceptions & chaining',
      blocks: [
        { kind: 'analogy', text: "Chaining is a hospital referral. The specialist's note says \"cardiac issue\" in terms the next doctor can act on, and the original GP's notes stay attached in case anyone needs them. You translate the problem for your level, and you never throw away the original evidence." },
        { kind: 'code', code: `public class OrderRejected extends Exception {   // or RuntimeException for unchecked
    private final String sym;

    public OrderRejected(String sym, String reason) {
        super(sym + ": " + reason);
        this.sym = sym;
    }

    public OrderRejected(String sym, Throwable cause) {
        super(sym + ": " + cause.getMessage(), cause);    // keep the cause
        this.sym = sym;
    }

    public String sym() { return sym; }
}

public Trade execute(Order o) throws OrderRejected {
    try {
        return gateway.send(o);
    } catch (IOException e) {
        throw new OrderRejected(o.sym(), e);              // chain, don't discard
    }
}` },
        { kind: 'list', items: [
          'Translate exceptions at layer boundaries. Callers of a repository shouldn\'t need to know that it uses SQL.',
          'Always pass the original as the cause. Stack traces print a `Caused by:` section for each link.',
          'Prefer a standard exception when one fits. Write your own when callers need to catch it specifically, or when it carries useful data.',
          'Use exceptions for exceptional conditions, not for ordinary flow such as "the key was not found". Use `Optional` or a sealed result type for expected absence.',
        ] },
        { kind: 'code', code: `// An expected failure as data: the compiler makes callers handle both outcomes
sealed interface Fill permits Filled, Rejected {}
record Filled(double px) implements Fill {}
record Rejected(String reason) implements Fill {}

String report = switch (submit(order)) {
    case Filled f -> "at " + f.px();
    case Rejected r -> "rejected: " + r.reason();
};` },
        { kind: 'check', q: 'What does `new OrderRejected(sym, e)` preserve that `new OrderRejected(sym, e.getMessage())` loses?', options: ['Nothing', 'The original exception, including its stack trace, as the cause', 'The symbol', 'The thread name'], answer: 1, hint: 'What would you want to see while debugging?', explain: 'Passing the cause keeps the entire chain, so the log shows `Caused by:` with the original stack trace.' },
      ],
    },
    {
      id: 'assertions',
      title: 'Assertions',
      blocks: [
        { kind: 'analogy', text: "An assertion is a pilot's pre-flight checklist item, used for things that must already be true unless someone made a mistake. It isn't a passenger complaint form: you don't use it to deal with bad input from the outside world, because it can be switched off." },
        { kind: 'code', code: `private double sqrtOfPositive(double x) {
    assert x >= 0 : "x must be non-negative, got " + x;    // the message is optional
    return Math.sqrt(x);
}

// Public API: always check, using an exception
public static double sqrtChecked(double x) {
    if (x < 0) throw new IllegalArgumentException("negative: " + x);
    return Math.sqrt(x);
}

// One-liners for the most common checks
String name = Objects.requireNonNull(input, "input");
int i = Objects.checkIndex(index, size);`, caption: 'Assertions are **off by default**. Turn them on with `java -ea Main`, and for one package with `-ea:com.example...`.' },
        { kind: 'list', items: [
          'When disabled, assertions cost nothing: the condition is not evaluated.',
          'For that reason, never put a needed side effect in the condition: `assert list.remove(x);` silently does nothing in production.',
          'Use assertions for internal invariants in private code. Use exceptions for validating arguments to public methods.',
          'Fail fast: `Objects.requireNonNull` in a constructor reports the problem at the place it was caused, not much later when the field is used.',
        ] },
        { kind: 'check', q: 'What happens to `assert x > 0;` when you run `java Main` with no flags?', options: ['It throws if false', 'It is skipped: assertions are off by default', 'It prints a warning', 'It does not compile'], answer: 1, hint: 'Which flag turns them on?', explain: 'Assertions need `-ea`. So don\'t rely on them for checks that must always happen.' },
      ],
    },
    {
      id: 'logging',
      title: 'Logging',
      blocks: [
        { kind: 'analogy', text: "`println` is shouting across the office: everyone hears it and you can't turn it down. A logger is the building's intercom, with a volume dial per room: a quiet day shows only alarms, but when something goes wrong you can turn one room up to full detail, without moving a wire." },
        { kind: 'code', code: `import java.lang.System.Logger;
import java.lang.System.Logger.Level;

public class Orders {
    private static final Logger LOG = System.getLogger(Orders.class.getName());

    public void submit(String sym, int qty) {
        LOG.log(Level.INFO, "Submitting {0} x {1}", sym, qty);   // the formatted form
        LOG.log(Level.DEBUG, () -> "State: " + expensiveDump()); // built only when enabled
        try {
            send(sym, qty);
        } catch (RuntimeException e) {
            LOG.log(Level.ERROR, "Submit failed for " + sym, e); // include the exception
            throw e;
        }
    }
}` },
        { kind: 'list', items: [
          'Levels, from most to least severe: `ERROR`, `WARNING`, `INFO`, `DEBUG`, `TRACE`. Setting a threshold hides everything less severe.',
          '`System.Logger` is a small built-in front end. By default, it routes to `java.util.logging`, and can be pointed at other back ends through a service provider.',
          '`java.util.logging` ships with the JDK, configured through a properties file. Most production applications use **SLF4J** as the API, with **Logback** or **Log4j 2** behind it.',
          'Name a logger after its class, so configuration can target whole packages.',
          'Log what you\'d want during an incident: identifiers, inputs and the exception. Don\'t log secrets or personal data.',
        ] },
        { kind: 'pitfall', text: 'Either log an exception or rethrow it for someone else to log, but avoid doing both at each layer. Otherwise, one failure will show up as five stack traces and send you looking for five problems. (The `submit` above can rethrow because it adds context, but a top-level handler is often the better single place.)' },
        { kind: 'check', q: 'Why pass a lambda like `() -> "State: " + expensiveDump()` to the logger?', options: ['Lambdas print faster', 'The message is only built if that level is enabled', 'Loggers accept nothing else', 'To run it on another thread'], answer: 1, hint: 'What would happen with DEBUG off and a plain string?', explain: 'A plain concatenated string is computed before the call, even if it is then discarded. A `Supplier` defers the work.' },
      ],
    },
  ],
  quiz: [
    { q: 'What makes an exception checked?', options: ['It extends `Exception` but not `RuntimeException`', 'It extends `RuntimeException`', 'It has a message', 'It is declared `final`'], answer: 0, explain: 'The compiler forces callers to handle or declare checked exceptions.' },
    { q: 'What must a resource implement to work in try-with-resources?', options: ['`Closeable` only', '`AutoCloseable`', '`Runnable`', '`Iterable`'], answer: 1, explain: '`Closeable` extends `AutoCloseable`, so both work.' },
    { q: 'When does `finally` run?', options: ['Only on success', 'Only on an exception', 'Whether or not an exception occurred', 'Only if nothing was caught'], answer: 2, explain: 'It runs as the block exits, except in cases like `System.exit` or a JVM crash.' },
    { q: 'If both the body and `close()` throw in try-with-resources, what do you get?', options: ['The `close()` exception', 'The body\'s exception, with the other available through `getSuppressed()`', 'Both thrown one after another', 'Neither'], answer: 1, explain: 'The primary failure is preserved, and the secondary one is attached to it.' },
    { q: 'Which is the right way to wrap a lower-level exception?', options: ['`throw new AppError(e.getMessage());`', '`throw new AppError("msg", e);`', '`e.printStackTrace(); return null;`', '`catch (Exception e) {}`'], answer: 1, explain: 'Pass the cause, so the original stack trace is kept.' },
    { q: 'How do you enable assertions?', options: ['They are always enabled', 'Run with `java -ea`', 'Compile with `javac -ea`', 'Import `java.lang.assert`'], answer: 1, explain: 'It is a runtime flag, and they are off by default.' },
    { q: 'What should you use to validate arguments of a public method?', options: ['`assert`', 'An exception such as `IllegalArgumentException`', 'A log message', 'A static initialiser'], answer: 1, explain: 'Assertions can be disabled, so they can\'t protect a public API.' },
    { q: 'What is wrong with `catch (Exception e) {}`?', options: ['It does not compile', 'It silently hides failures, including bugs', 'It is too slow', 'It only catches checked exceptions'], answer: 1, explain: 'The program continues as though nothing happened, usually with bad data.' },
  ],
}
