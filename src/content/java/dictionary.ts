import type { DictEntry } from '../types'

export const JAVA_DICT: DictEntry[] = [
  // ---------- Tooling ----------
  { term: 'javac / java', cat: 'Tooling', module: 1, desc: '`javac` compiles source to `.class` bytecode, and `java` runs it on the JVM. `java File.java` compiles and runs in a single step.', syntax: `javac -d out src/App.java
java -cp out App
java App.java        # source launcher` },
  { term: 'jshell', cat: 'Tooling', module: 1, desc: 'The built-in REPL. Good for testing an API or an expression quickly.', syntax: `$ jshell
jshell> List.of(1, 2).size()
$1 ==> 2` },
  { term: 'jar', cat: 'Tooling', module: 2, desc: 'Packages classes and resources into a JAR file, which is a zip with metadata.', syntax: `jar --create --file app.jar --main-class App -C out .
java -jar app.jar` },
  { term: 'Class path', cat: 'Tooling', module: 2, desc: 'The list of directories and JARs where the JVM looks for classes.', syntax: `java -cp "out:libs/*" com.example.App` },
  { term: 'jdeps / jlink', cat: 'Tooling', module: 12, desc: '`jdeps` reports dependencies. `jlink` builds a trimmed, self-contained runtime image.', syntax: `jdeps --print-module-deps app.jar
jlink --add-modules java.base --output image` },

  // ---------- Basics ----------
  { term: 'main method', cat: 'Basics', module: 1, desc: 'A program\'s entry point. The classic form is public and static, and compact source files allow a bare `void main()`.', since: 'Java 25', syntax: `public static void main(String[] args) { }

void main() { IO.println("hi"); }   // compact source file` },
  { term: 'Primitive types', cat: 'Basics', module: 1, desc: 'The eight non-object types, with sizes fixed by the language.', syntax: `byte short int long
float double
char boolean` },
  { term: 'Wrapper classes & autoboxing', cat: 'Basics', module: 1, desc: 'Object forms of primitives, used in collections. Conversions are automatic. Unboxing `null` throws.', syntax: `Integer boxed = 5;
int plain = boxed;
List<Integer> xs = List.of(1, 2);` },
  { term: 'var', cat: 'Basics', module: 1, desc: 'Local type inference. The variable still has a fixed static type.', syntax: `var trades = new ArrayList<Trade>();
for (var t : trades) { }` },
  { term: 'final', cat: 'Basics', module: 1, desc: 'On a variable: no reassignment. On a method: no overriding. On a class: no subclassing. It doesn\'t make the referenced object immutable.', syntax: `final int MAX = 10;
public final void lock() { }
public final class Money { }` },
  { term: 'Casting', cat: 'Basics', module: 1, desc: 'Narrowing conversion for numbers, and a checked conversion for references. A bad reference cast throws `ClassCastException`.', syntax: `int n = (int) 3.9;     // 3
String s = (String) obj;` },
  { term: 'switch expression', cat: 'Basics', module: 1, desc: 'Yields a value, has no fall-through with arrows, and must be exhaustive. `yield` returns from a block.', syntax: `int n = switch (day) {
    case "SAT", "SUN" -> 0;
    default -> { yield 8; }
};` },
  { term: 'Enhanced for', cat: 'Basics', module: 1, desc: 'Loops over an array or any `Iterable`.', syntax: `for (String s : names) { }` },
  { term: 'Labelled break', cat: 'Basics', module: 1, desc: 'Leaves an outer loop directly.', syntax: `outer:
for (int i : a) {
    for (int j : b) {
        if (i == j) break outer;
    }
}` },
  { term: 'Arrays', cat: 'Basics', module: 1, desc: 'Fixed-size, bounds-checked. `length` is a field, and printing needs `Arrays.toString`.', syntax: `int[] xs = {1, 2, 3};
int[][] grid = new int[3][4];
Arrays.sort(xs);` },
  { term: 'Varargs', cat: 'Basics', module: 1, desc: 'A variable number of trailing arguments, received as an array.', syntax: `static int sum(int... xs) { return 0; }
sum(1, 2, 3);` },
  { term: 'String', cat: 'Basics', module: 1, desc: 'Immutable text. Compare with `equals`, and use `StringBuilder` for loops.', syntax: `s.length(); s.charAt(0);
s.substring(1, 3);
s.equals(t);
"%d".formatted(5);` },
  { term: 'Text block', cat: 'Basics', module: 1, desc: 'A multi-line string literal. Common indentation is stripped.', syntax: `String json = """
    {"qty": 1}
    """;` },
  { term: 'Unnamed variable _', cat: 'Basics', module: 3, desc: 'A variable or pattern you intentionally do not use.', since: 'Java 22', syntax: `catch (Exception _) { }
map.computeIfAbsent(k, _ -> new ArrayList<>());
case Point(var x, _) -> x;` },

  // ---------- Classes ----------
  { term: 'class', cat: 'OOP', module: 2, desc: 'A blueprint with state and behaviour. A file may contain one public top-level class, named after the file.', syntax: `public class Account {
    private long cents;
    public long cents() { return cents; }
}` },
  { term: 'Constructor', cat: 'OOP', module: 2, desc: 'Sets up a new object, and has no return type. `this(...)` delegates to another constructor, and `super(...)` calls the parent.', syntax: `public Account(long c) { cents = c; }
public Account() { this(0); }` },
  { term: 'Flexible constructor body', cat: 'OOP', module: 2, desc: 'Statements may precede `super(...)` or `this(...)` as long as they don\'t read the object under construction.', since: 'Java 25', syntax: `Sub(int n) {
    if (n < 0) throw new IllegalArgumentException();
    super(n);
}` },
  { term: 'Access modifiers', cat: 'OOP', module: 2, desc: 'Visibility levels: `private`, package-private (none), `protected`, `public`.', syntax: `private int a;
int b;            // package
protected int c;
public int d;` },
  { term: 'static', cat: 'OOP', module: 2, desc: 'Belongs to the class rather than to any object. Static methods have no `this`.', syntax: `static int count;
static double fee(double n) { return n * 0.01; }
Math.max(1, 2);` },
  { term: 'record', cat: 'OOP', module: 2, desc: 'A concise, shallowly immutable data carrier. Generates fields, a constructor, accessors, `equals`, `hashCode` and `toString`.', syntax: `record Trade(String sym, double px) {
    Trade { if (px < 0) throw new IllegalArgumentException(); }
}
new Trade("XAU", 1).sym();` },
  { term: 'package / import', cat: 'OOP', module: 2, desc: 'Namespaces that mirror directories. `java.lang` is imported automatically.', syntax: `package com.example.app;
import java.util.List;
import static java.lang.Math.max;` },
  { term: 'import module', cat: 'OOP', module: 2, desc: 'Imports all packages exported by a module.', since: 'Java 25', syntax: `import module java.base;` },
  { term: 'Nested class', cat: 'OOP', module: 2, desc: 'A class inside another. `static` ones stand alone, and inner ones hold a reference to their enclosing instance.', syntax: `class A {
    static class B { }
    class C { }
}` },
  { term: 'Javadoc', cat: 'OOP', module: 2, desc: 'Comments that document the API. Since Java 23, they may be written in Markdown with `///`.', since: 'Java 23', syntax: `/** Returns the fee. @param n notional */
/// Returns the **fee**.` },

  // ---------- Interfaces ----------
  { term: 'interface', cat: 'Interfaces', module: 3, desc: 'A contract classes must declare they implement. May hold abstract, default, static and private methods, but no instance state.', syntax: `interface Feed {
    double latest(String s);
    default double zero() { return 0; }
    static Feed fixed(double p) { return s -> p; }
}` },
  { term: 'Lambda expression', cat: 'Interfaces', module: 3, desc: 'An inline implementation of a functional interface. Captured locals must be effectively final.', syntax: `(a, b) -> a + b
s -> s.length()
() -> { return 1; }` },
  { term: 'Method reference', cat: 'Interfaces', module: 3, desc: 'A shorthand lambda that forwards to a method or constructor.', syntax: `String::length
System.out::println
ArrayList::new
int[]::new` },
  { term: 'Functional interface', cat: 'Interfaces', module: 3, desc: 'An interface with exactly one abstract method, which is the target type of a lambda.', syntax: `Function<T, R>     // apply
Predicate<T>       // test
Consumer<T>        // accept
Supplier<T>        // get` },
  { term: 'Comparable / Comparator', cat: 'Interfaces', module: 3, desc: '`Comparable` defines a natural order, and `Comparator` is an external, composable order.', syntax: `xs.sort(Comparator.comparing(Trade::sym)
    .thenComparingInt(Trade::qty)
    .reversed());` },
  { term: 'Anonymous class', cat: 'Interfaces', module: 3, desc: 'An unnamed class defined in an expression. Prefer a lambda unless you need state or several methods.', syntax: `new Iterator<>() {
    public boolean hasNext() { return false; }
    public Integer next() { return 0; }
};` },

  // ---------- Inheritance ----------
  { term: 'extends / super', cat: 'Inheritance', module: 4, desc: 'Single class inheritance. `super` calls the parent constructor or method.', syntax: `class Manager extends Employee {
    Manager() { super("x"); }
    @Override double pay() { return super.pay() + 1; }
}` },
  { term: 'abstract', cat: 'Inheritance', module: 4, desc: 'A class that can\'t be instantiated, or a method with no body that subclasses must supply.', syntax: `abstract class Shape {
    abstract double area();
}` },
  { term: 'sealed / permits', cat: 'Inheritance', module: 4, desc: 'Restricts which types may extend or implement a type. Enables exhaustive switches.', syntax: `sealed interface Pay permits Card, Cash {}
record Card(String n) implements Pay {}
record Cash(double a) implements Pay {}` },
  { term: 'equals / hashCode / toString', cat: 'Inheritance', module: 4, desc: 'Methods from `Object` you often override. Equal objects must have equal hash codes.', syntax: `@Override public boolean equals(Object o) {
    return o instanceof Money m && cents == m.cents;
}
@Override public int hashCode() { return Long.hashCode(cents); }` },
  { term: 'enum', cat: 'Inheritance', module: 4, desc: 'A fixed set of named singleton objects, which can have fields and methods.', syntax: `enum Side {
    BUY(1), SELL(-1);
    final int sign;
    Side(int s) { sign = s; }
}` },
  { term: 'instanceof pattern', cat: 'Inheritance', module: 4, desc: 'Tests a type and binds a variable in one step.', syntax: `if (o instanceof String s && !s.isEmpty()) {
    s.length();
}` },
  { term: 'Pattern switch', cat: 'Inheritance', module: 4, desc: 'Switches on type with guards, `null`, and record deconstruction.', syntax: `String s = switch (o) {
    case null -> "none";
    case Integer i when i > 9 -> "big";
    case Point(var x, var y) -> "p";
    default -> "other";
};` },
  { term: 'Reflection', cat: 'Inheritance', module: 4, desc: 'Inspecting and using classes at runtime through `Class`, `Method` and `Field`.', syntax: `Class<?> c = obj.getClass();
var m = c.getMethod("size");
m.invoke(obj);` },

  // ---------- Exceptions ----------
  { term: 'try / catch / finally', cat: 'Exceptions', module: 5, desc: 'Handles exceptions by type. `finally` always runs.', syntax: `try { f(); }
catch (IOException | SQLException e) { }
finally { cleanup(); }` },
  { term: 'try-with-resources', cat: 'Exceptions', module: 5, desc: 'Closes `AutoCloseable` resources automatically, in reverse order.', syntax: `try (var r = Files.newBufferedReader(p)) {
    r.readLine();
}` },
  { term: 'Checked exception', cat: 'Exceptions', module: 5, desc: 'An exception that isn\'t a `RuntimeException` or `Error`. It must be caught or declared.', syntax: `void read() throws IOException { }` },
  { term: 'Unchecked exception', cat: 'Exceptions', module: 5, desc: 'A subclass of `RuntimeException`, usually a programming error. No declaration required.', syntax: `throw new IllegalArgumentException("qty");` },
  { term: 'Exception chaining', cat: 'Exceptions', module: 5, desc: 'Wrap a low-level exception and keep it as the cause.', syntax: `throw new AppException("failed", e);
e.getCause();` },
  { term: 'assert', cat: 'Exceptions', module: 5, desc: 'An internal check, disabled unless the JVM runs with `-ea`.', syntax: `assert x >= 0 : "negative";` },
  { term: 'System.Logger', cat: 'Exceptions', module: 5, desc: 'A small logging facade in the JDK.', syntax: `var log = System.getLogger("app");
log.log(System.Logger.Level.INFO, "started");` },

  // ---------- Generics ----------
  { term: 'Generic class', cat: 'Generics', module: 6, desc: 'A class with type parameters. The diamond `<>` infers the arguments.', syntax: `class Box<T> { T value; }
Box<String> b = new Box<>();` },
  { term: 'Generic method', cat: 'Generics', module: 6, desc: 'A method declaring its own type parameters before the return type.', syntax: `static <T> List<T> twice(T x) { return List.of(x, x); }` },
  { term: 'Bounded type', cat: 'Generics', module: 6, desc: 'Requires a type argument to be a subtype of something, making that type\'s methods available.', syntax: `<T extends Comparable<T>> T max(List<T> xs)` },
  { term: 'Wildcards', cat: 'Generics', module: 6, desc: 'Flexible parameter types. Use `extends` when reading, and `super` when writing (PECS).', syntax: `double sum(List<? extends Number> xs)
void fill(List<? super Integer> xs)
int size(List<?> xs)` },
  { term: 'Type erasure', cat: 'Generics', module: 6, desc: 'Type arguments are removed after compilation, so there is one runtime class, and casts are inserted.', syntax: `new ArrayList<String>().getClass()
    == new ArrayList<Integer>().getClass()   // true` },

  // ---------- Collections ----------
  { term: 'List / ArrayList', cat: 'Collections', module: 7, desc: 'An ordered, indexed collection. `ArrayList` is the default choice.', syntax: `List<String> xs = new ArrayList<>();
xs.add("a"); xs.get(0); xs.size();
List.of("a", "b");` },
  { term: 'Set / HashSet / TreeSet', cat: 'Collections', module: 7, desc: 'Unique elements. `HashSet` is fast and unordered, `LinkedHashSet` keeps insertion order, `TreeSet` keeps sorted order.', syntax: `Set<String> s = new HashSet<>();
s.add("a"); s.contains("a");
new TreeSet<>(s).first();` },
  { term: 'Map / HashMap / TreeMap', cat: 'Collections', module: 7, desc: 'Key to value. `merge` and `computeIfAbsent` handle the "is it there yet?" cases.', syntax: `Map<String, Integer> m = new HashMap<>();
m.put("a", 1); m.get("a");
m.merge("a", 1, Integer::sum);
m.computeIfAbsent("b", _ -> 0);` },
  { term: 'Deque / ArrayDeque', cat: 'Collections', module: 7, desc: 'A double-ended queue, and the go-to stack or queue.', syntax: `Deque<Integer> d = new ArrayDeque<>();
d.push(1); d.pop();
d.offer(1); d.poll();` },
  { term: 'PriorityQueue', cat: 'Collections', module: 7, desc: 'A binary min-heap. `poll` returns the smallest element.', syntax: `var q = new PriorityQueue<Integer>();
q.add(3); q.poll();` },
  { term: 'Iterator', cat: 'Collections', module: 7, desc: 'Steps through a collection, and is the safe way to remove during iteration.', syntax: `var it = xs.iterator();
while (it.hasNext()) {
    if (it.next() == 0) it.remove();
}` },
  { term: 'Sequenced collections', cat: 'Collections', module: 7, desc: 'One consistent API for first and last elements, and reversed views.', since: 'Java 21', syntax: `xs.getFirst(); xs.getLast();
xs.addFirst(0); xs.reversed();
map.firstEntry();` },

  // ---------- Streams ----------
  { term: 'Stream', cat: 'Streams', module: 8, desc: 'A lazy pipeline over data. Intermediate operations build it, and a terminal operation runs it.', syntax: `xs.stream()
  .filter(x -> x > 0)
  .map(x -> x * 2)
  .toList();` },
  { term: 'flatMap', cat: 'Streams', module: 8, desc: 'Maps each element to a stream, then flattens the results.', syntax: `lines.stream().flatMap(l -> Arrays.stream(l.split(" ")))` },
  { term: 'Optional', cat: 'Streams', module: 8, desc: 'A return value that may be absent.', syntax: `find().map(T::name).orElse("none");
find().orElseThrow();
find().ifPresent(System.out::println);` },
  { term: 'Collectors', cat: 'Streams', module: 8, desc: 'Reduce a stream to a collection or aggregate. `groupingBy` is GROUP BY.', syntax: `collect(joining(", "))
collect(toMap(T::k, T::v, Integer::sum))
collect(groupingBy(T::k, counting()))` },
  { term: 'IntStream / DoubleStream', cat: 'Streams', module: 8, desc: 'Streams of primitives, with `sum`, `average` and `range`.', syntax: `IntStream.range(0, 5).sum();
xs.stream().mapToDouble(T::px).average();` },
  { term: 'Gatherer', cat: 'Streams', module: 8, desc: 'A custom intermediate operation, which may keep state.', since: 'Java 24', syntax: `xs.stream().gather(Gatherers.windowSliding(3)).toList();` },

  // ---------- I/O ----------
  { term: 'Path / Files', cat: 'I/O', module: 9, desc: '`Path` names a location, and `Files` acts on it.', syntax: `Path p = Path.of("data", "a.txt");
String s = Files.readString(p);
Files.writeString(p, "hi");` },
  { term: 'InputStream / Reader', cat: 'I/O', module: 9, desc: 'Byte streams and character streams. `InputStreamReader` bridges the two.', syntax: `var r = new BufferedReader(
    new InputStreamReader(in, StandardCharsets.UTF_8));` },
  { term: 'HttpClient', cat: 'I/O', module: 9, desc: 'The standard HTTP client, with sync and async calls.', syntax: `var req = HttpRequest.newBuilder(URI.create(url)).build();
var res = client.send(req, BodyHandlers.ofString());` },
  { term: 'Pattern / Matcher', cat: 'I/O', module: 9, desc: 'Compiled regular expressions and their matches.', syntax: `Matcher m = Pattern.compile("\\\\d+").matcher(s);
while (m.find()) m.group();` },
  { term: 'Serializable / transient', cat: 'I/O', module: 9, desc: 'Marks a class for Java serialisation. `transient` fields are skipped. Never read untrusted data this way.', syntax: `class S implements Serializable {
    transient Socket conn;
}` },

  // ---------- Concurrency ----------
  { term: 'ExecutorService', cat: 'Concurrency', module: 10, desc: 'Runs submitted tasks on managed threads. Closeable since Java 19.', syntax: `try (var ex = Executors.newFixedThreadPool(4)) {
    Future<Integer> f = ex.submit(() -> 1);
    f.get();
}` },
  { term: 'synchronized', cat: 'Concurrency', module: 10, desc: 'Mutual exclusion on an object\'s intrinsic lock.', syntax: `synchronized (lock) { n++; }
synchronized void inc() { n++; }` },
  { term: 'volatile', cat: 'Concurrency', module: 10, desc: 'Guarantees visibility and ordering of a field, but not atomic compound updates.', syntax: `private volatile boolean stop;` },
  { term: 'Atomic classes', cat: 'Concurrency', module: 10, desc: 'Lock-free thread-safe variables.', syntax: `var n = new AtomicLong();
n.incrementAndGet();
n.compareAndSet(1, 2);` },
  { term: 'ConcurrentHashMap', cat: 'Concurrency', module: 10, desc: 'A scalable thread-safe map, with atomic compound operations.', syntax: `map.merge(k, 1, Integer::sum);
map.computeIfAbsent(k, _ -> 0);` },
  { term: 'BlockingQueue', cat: 'Concurrency', module: 10, desc: 'A thread-safe queue that waits when empty or full.', syntax: `q.put(x);       // waits if full
q.take();       // waits if empty` },
  { term: 'CompletableFuture', cat: 'Concurrency', module: 10, desc: 'Composable asynchronous results.', syntax: `supplyAsync(() -> 1)
  .thenApply(x -> x + 1)
  .thenCompose(x -> other(x))
  .exceptionally(e -> 0);` },
  { term: 'ReentrantLock', cat: 'Concurrency', module: 10, desc: 'An explicit lock offering `tryLock`, timeouts and conditions.', syntax: `lock.lock();
try { work(); }
finally { lock.unlock(); }` },

  // ---------- Annotations ----------
  { term: '@Override', cat: 'Annotations', module: 11, desc: 'The compiler checks that this method really overrides or implements something.', syntax: `@Override public String toString() { return "x"; }` },
  { term: '@interface', cat: 'Annotations', module: 11, desc: 'Declares your own annotation type.', syntax: `@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface Test { int timeout() default 0; }` },

  // ---------- Modules ----------
  { term: 'module-info.java', cat: 'Modules', module: 12, desc: 'Declares a module: what it needs, what it offers, and what may reflect on it.', syntax: `module com.example.app {
    requires java.net.http;
    exports com.example.app.api;
    opens com.example.app.dto;
}` },
  { term: 'ServiceLoader', cat: 'Modules', module: 12, desc: 'Finds implementations declared with `provides ... with`.', syntax: `ServiceLoader.load(Feed.class).findFirst();` },

  // ---------- Design ----------
  { term: 'Encapsulation', cat: 'Design', module: 13, desc: 'Hiding state behind methods, so the class alone can maintain its rules.', syntax: `private long cents;
public boolean withdraw(long c) { return c <= cents; }` },
  { term: 'Composition', cat: 'Design', module: 13, desc: 'Building behaviour by holding other objects rather than inheriting from them.', syntax: `final class Checkout {
    private final Discount discount;
    Checkout(Discount d) { discount = d; }
}` },
  { term: 'Dependency injection', cat: 'Design', module: 13, desc: 'Passing collaborators in from outside, usually through the constructor.', syntax: `new TradeService(new MemoryStore());` },
  { term: 'Builder pattern', cat: 'Design', module: 13, desc: 'Step-by-step construction for objects with many optional parts.', syntax: `Request.to(url).timeoutMs(500).retry().build();` },

  // ---------- Modern concurrency ----------
  { term: 'Virtual thread', cat: 'Modern concurrency', module: 14, desc: 'A cheap JVM-scheduled thread. Create one per task, and never pool them.', since: 'Java 21', syntax: `Thread.startVirtualThread(() -> work());
Executors.newVirtualThreadPerTaskExecutor();` },
  { term: 'ScopedValue', cat: 'Modern concurrency', module: 14, desc: 'Immutable context bound for one dynamic scope.', since: 'Java 25', syntax: `ScopedValue.where(USER, "nas").run(() -> USER.get());` },
  { term: 'StructuredTaskScope', cat: 'Modern concurrency', module: 14, desc: 'Treats a group of subtasks as one unit. Preview: needs `--enable-preview`.', since: 'Preview', syntax: `try (var s = StructuredTaskScope.open()) {
    var a = s.fork(() -> 1);
    s.join();
    a.get();
}` },
]
