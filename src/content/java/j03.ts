import type { Module } from '../types'

export const j03: Module = {
  n: 3,
  title: 'Interfaces and Lambda Expressions',
  tour: '3 · Interfaces and Lambda Expressions',
  summary: 'Programming to contracts: interfaces, default and static methods, Comparable and Comparator, lambdas and method references, capture, higher-order functions, and local and anonymous classes.',
  topics: ['Interfaces', 'Static, default & private methods', 'Comparable & Comparator', 'Lambdas & method references', 'Functional interfaces & capture', 'Local & anonymous classes'],
  cpp23: [
    'Unnamed variables: write `_` for a lambda parameter you do not need, as in `(k, _) -> k` (Java 22).',
    'Stream gatherers let you plug custom lambda-driven stages into pipelines (Java 24; see module 8).',
  ],
  lessons: [
    {
      id: 'interfaces',
      title: 'Interfaces',
      blocks: [
        { kind: 'analogy', text: "An interface is a wall socket. The socket doesn't care whether you plug in a lamp or a laptop, and the lamp doesn't care which power station is behind the wall. Each side only knows the shape of the plug. That is why you can swap either side without rewiring the house." },
        { kind: 'code', code: `public interface PriceFeed {
    double latest(String sym);                 // abstract: no body, implicitly public
    int MAX_SYMBOLS = 500;                     // implicitly public static final
}

public class FixedFeed implements PriceFeed {
    private final double px;
    public FixedFeed(double px) { this.px = px; }

    @Override public double latest(String sym) { return px; }
}

public class Pricer {
    private final PriceFeed feed;                  // depends on the contract only
    public Pricer(PriceFeed feed) { this.feed = feed; }
    public double value(String sym, int qty) { return feed.latest(sym) * qty; }
}

var pricer = new Pricer(new FixedFeed(100.0));     // a test double, or the real feed` },
        { kind: 'list', items: [
          'You **declare** that a class implements an interface. Unlike in Go, matching method signatures alone are not enough.',
          'A class extends only one class, but can implement any number of interfaces: `class A extends B implements C, D`.',
          'Declare variables with the interface: `List<String> xs = new ArrayList<>();`. Then only one line needs to change to switch implementation.',
          '`@Override` asks the compiler to verify that you really are overriding something. Always write it: it catches typos such as `Latest`.',
          'A cast or `instanceof` moves from a general type to a specific one. A wrong cast throws `ClassCastException` at runtime. Pattern matching is the modern way (module 4).',
        ] },
        { kind: 'compare',
          python: `from typing import Protocol

class PriceFeed(Protocol):   # structural: no declaration needed
    def latest(self, sym: str) -> float: ...`,
          cpp: `class PriceFeed {
public:
    virtual ~PriceFeed() = default;
    virtual double latest(const std::string& sym) = 0;
};`,
          go: `type PriceFeed interface {  // satisfied implicitly
    Latest(sym string) float64
}`,
          ts: `interface PriceFeed {       // structural typing
  latest(sym: string): number
}`,
          java: `public interface PriceFeed {   // nominal: must say "implements"
    double latest(String sym);
}`,
          note: 'Java interfaces are nominal: a class must name the interface. That makes intent explicit, but you cannot retrofit an interface onto a class you do not own (write an adapter instead).' },
        { kind: 'check', q: 'A class has every method in an interface, but no `implements` clause. Can you assign it to that interface type?', options: ['Yes, Java uses structural typing', 'No, it must declare `implements`', 'Only with a cast, which then always succeeds', 'Only if the methods are static'], answer: 1, hint: 'Compare this with how Go does it.', explain: 'Java typing is nominal. Without `implements`, the class is not a subtype, even if the signatures match.' },
      ],
    },
    {
      id: 'default-methods',
      title: 'Static, default & private methods',
      blocks: [
        { kind: 'analogy', text: "Publishing a new abstract method on a popular interface is like changing the socket shape on a million homes. A **default** method is an adapter shipped with the new socket: old plugs keep working because the socket supplies the missing behaviour itself." },
        { kind: 'code', code: `public interface PriceFeed {
    double latest(String sym);

    default double latestOr(String sym, double fallback) {  // inherited; can be overridden
        double px = latest(sym);
        return checked(px) ? px : fallback;
    }

    private boolean checked(double px) {                    // shared helper, not public
        return px > 0 && !Double.isNaN(px);
    }

    static PriceFeed fixed(double px) {                     // factory on the interface
        return sym -> px;
    }
}

interface Named { default String name() { return "named"; } }
interface Titled { default String name() { return "titled"; } }

class Report implements Named, Titled {
    @Override public String name() {          // the conflict must be resolved
        return Named.super.name() + "/" + Titled.super.name();
    }
}` },
        { kind: 'list', items: [
          '**Default** methods let an interface evolve without breaking implementers. That is how `List.sort` and `Collection.stream` were added in Java 8.',
          '**Static** methods give an interface its own factories, like `List.of` and `Comparator.comparing`.',
          '**Private** methods share code between default methods without exposing it.',
          'If a superclass and an interface supply the same method, the class wins. If two interfaces conflict, you must override and choose.',
          'Interfaces still hold no instance state. An abstract class can have fields and constructors, an interface cannot, and that remains the main reason to choose one over the other.',
        ] },
        { kind: 'pitfall', text: 'A default method can\'t define `equals`, `hashCode` or `toString`: the compiler rejects it, because `Object` would always win.' },
        { kind: 'check', q: 'Two interfaces each provide a default `name()`. A class implements both and declares nothing. What happens?', options: ['The first listed wins', 'The last listed wins', 'Compile error: the class must override `name()`', 'A runtime exception on call'], answer: 2, hint: 'Java refuses to guess.', explain: 'The conflict is a compile error. The class overrides and may call `Named.super.name()` to pick one.' },
      ],
    },
    {
      id: 'comparators',
      title: 'Comparable & Comparator',
      blocks: [
        { kind: 'analogy', text: "`Comparable` is a person's height: one built-in, natural way to line people up. `Comparator` is a referee with a rulebook: today sort by age, tomorrow by surname, and the people themselves don't have to change for either." },
        { kind: 'code', code: `public record Trade(String sym, double px, int qty) implements Comparable<Trade> {
    @Override public int compareTo(Trade other) {           // the natural order
        return Double.compare(px, other.px);                // negative, zero or positive
    }
}

var trades = new ArrayList<>(List.of(
    new Trade("XAU", 2390.5, 10),
    new Trade("EUR", 1.08, 500),
    new Trade("XAG", 28.1, 40)));

Collections.sort(trades);                                   // uses compareTo
trades.sort(Comparator.comparing(Trade::sym));              // by a key
trades.sort(Comparator.comparingInt(Trade::qty).reversed());
trades.sort(Comparator.comparing(Trade::sym)
                      .thenComparingDouble(Trade::px));     // a tie-breaker
trades.sort(Comparator.comparing(Trade::sym, Comparator.nullsFirst(Comparator.naturalOrder())));` },
        { kind: 'list', items: [
          '`compareTo` should be consistent with `equals`. If `compareTo` returns 0 for objects that are not equal, a `TreeSet` will treat them as duplicates.',
          'Other everyday single-method interfaces: `Runnable` (no arguments, no result), `Callable<T>` (returns a result, may throw), `Iterable<T>` (makes for-each work), `AutoCloseable` (try-with-resources).',
          'Prefer the `Comparator` combinators to writing comparison logic by hand.',
        ] },
        { kind: 'pitfall', text: 'Comparing with subtraction (`return a - b;`) is a famous bug, since it overflows for large values of opposite signs and gives the wrong order. Use `Integer.compare(a, b)`.' },
        { kind: 'check', q: 'What must `compareTo` return when `this` sorts before `other`?', options: ['`true`', 'A negative number', 'A positive number', '`-1`, and nothing else is valid'], answer: 1, hint: 'Think of it as `this - other`, without the overflow.', explain: 'Any negative value means "before", zero means "same position", and any positive value means "after".' },
      ],
    },
    {
      id: 'lambdas',
      title: 'Lambdas & method references',
      blocks: [
        { kind: 'analogy', text: "A lambda is a sticky note with instructions that you hand to someone else to carry out later or repeatedly. Java has no separate \"function\" type, so each note is stuck to a single-purpose form (a functional interface), and the form's one blank decides what the note means." },
        { kind: 'code', code: `Comparator<String> byLen = (a, b) -> Integer.compare(a.length(), b.length());
Runnable hello = () -> System.out.println("hi");       // no parameters
Function<String, Integer> len = s -> s.length();       // one parameter, no parens
BiFunction<Integer, Integer, Integer> add = (a, b) -> {    // a block body needs return
    int sum = a + b;
    return sum;
};

// Method references: shorthand when a lambda only forwards its arguments
Function<String, Integer> len2 = String::length;       // method on the first argument
Consumer<Object> printer = System.out::println;        // method on a particular object
Function<String, Integer> parse = Integer::parseInt;   // static method
Supplier<List<String>> mk = ArrayList::new;            // constructor
Function<Integer, int[]> mkArr = int[]::new;           // array constructor` },
        { kind: 'p', text: 'A **functional interface** has exactly one abstract method. A lambda can only be used where such an interface is expected, and the compiler infers the parameter types from it. `@FunctionalInterface` makes the compiler check that the interface qualifies.' },
        { kind: 'code', code: `// java.util.function: the common shapes
Supplier<Double>        s = Math::random;             // () -> T          get()
Consumer<String>        c = System.out::println;      // T -> void        accept(t)
Predicate<String>       p = String::isEmpty;          // T -> boolean     test(t)
Function<String,Integer> f = String::length;          // T -> R           apply(t)
UnaryOperator<String>   u = String::trim;             // T -> T           apply(t)
BinaryOperator<Integer> b = Integer::sum;             // (T, T) -> T      apply(a, b)
IntBinaryOperator       i = Math::max;                // primitives: no boxing

@FunctionalInterface
interface Rule { boolean allows(double px); }         // your own works just the same
Rule cap = px -> px < 3000;` },
        { kind: 'new23', text: "Since **Java 22**, an unused lambda parameter can be written `_`: `map.computeIfAbsent(key, _ -> new ArrayList<>())` and `(sym, _) -> sym`. It says plainly that the value doesn't matter, and multiple `_` parameters may appear in the same lambda." },
        { kind: 'compare',
          python: `by_len = lambda s: len(s)
names.sort(key=len)
add = lambda a, b: a + b`,
          cpp: `auto byLen = [](const std::string& s) { return s.size(); };
std::ranges::sort(names, {}, &std::string::size);`,
          go: `byLen := func(a, b string) int { return len(a) - len(b) }
slices.SortFunc(names, byLen)`,
          ts: `const byLen = (s: string) => s.length
names.sort((a, b) => a.length - b.length)`,
          java: `Function<String, Integer> byLen = String::length;
names.sort(Comparator.comparing(String::length));`,
          note: 'In the others, a function is a value with a function type. In Java, a lambda always becomes an object implementing one interface, so you call `f.apply(x)`, not `f(x)`.' },
        { kind: 'check', q: 'How do you invoke `Function<String, Integer> f`?', options: ['`f("abc")`', '`f.apply("abc")`', '`f.call("abc")`', '`f->("abc")`'], answer: 1, hint: 'A lambda is an object implementing an interface.', explain: 'Calling a lambda means calling the interface\'s one abstract method. For `Function`, that is `apply`.' },
      ],
    },
    {
      id: 'capture',
      title: 'Capture & higher-order functions',
      blocks: [
        { kind: 'analogy', text: "A lambda takes a photograph of the variables it needs. Since it might run later on another thread, Java only lets you photograph things that never change, so the picture can't go out of date while it's in someone's pocket." },
        { kind: 'code', code: `// Capturing: the local must be effectively final (never reassigned)
int limit = 3;
Predicate<String> shortName = s -> s.length() < limit;   // ok
// limit++;                                              // would break the line above

// A workaround that compiles but isn't a good idea: mutating through an array
int[] counter = {0};
List.of("a", "b").forEach(s -> counter[0]++);            // unsafe if run in parallel

// A method that returns a function
static Predicate<Trade> minQty(int n) {
    return t -> t.qty() >= n;                            // captures n
}

// A method that takes and returns functions
static <T> Predicate<T> not(Predicate<T> p) {
    return x -> !p.test(x);
}

// The library's own combinators
Predicate<Trade> big = minQty(100).and(t -> t.px() > 10);
Function<Integer, Integer> plus1 = x -> x + 1;
Function<Integer, Integer> twice = x -> x * 2;
int y = plus1.andThen(twice).apply(3);                   // (3 + 1) * 2 = 8
int z = plus1.compose(twice).apply(3);                   // 3 * 2 + 1 = 7` },
        { kind: 'list', items: [
          '**Effectively final** means never reassigned after initialisation. You don\'t have to write `final`, but the compiler checks.',
          'Only locals have this rule. A lambda can read and write fields freely, because it captures `this`.',
          'Inside a lambda, `this` refers to the enclosing object, and the lambda body shares the enclosing scope, so it cannot redeclare a local name.',
          'A lambda can\'t throw a checked exception unless the functional interface\'s method declares one. Wrap it, or define your own interface.',
          'Loops with `for (String s : names)` are fine: each iteration\'s `s` is a fresh, effectively final variable.',
        ] },
        { kind: 'pitfall', text: 'The classic `for (int i = 0; i < n; i++)` counter is reassigned, so a lambda in the loop body can\'t capture `i`. Copy it first: `int id = i;`.' },
        { kind: 'check', q: 'Why does this not compile?', code: `int total = 0;
list.forEach(x -> total += x);`, options: ['`forEach` does not accept lambdas', '`total` is captured but reassigned, so it is not effectively final', '`x` has no type', '`+=` is not allowed in a lambda'], answer: 1, hint: 'What rule applies to locals captured by a lambda?', explain: 'Captured locals must be effectively final. Use `mapToInt(...).sum()`: streams are built for this (module 8).' },
      ],
    },
    {
      id: 'local-anon',
      title: 'Local & anonymous classes',
      blocks: [
        { kind: 'analogy', text: "A lambda is a sticky note: one instruction. An anonymous class is a contractor hired for just this one job: it has no name on its van, but it can bring its own tools (fields) and do several jobs (methods). If you only need one instruction, use the sticky note." },
        { kind: 'code', code: `// Anonymous class: for an interface with several methods, or when you need state
Iterator<Integer> upTo(int n) {
    return new Iterator<>() {
        private int i = 0;                               // its own state
        @Override public boolean hasNext() { return i < n; }   // captures n
        @Override public Integer next() { return i++; }
    };
}

// Local class: named, but only visible inside the method
double total(List<Trade> trades) {
    record Row(String sym, double value) {}              // local records are handy
    double sum = 0;
    for (Trade t : trades) {
        var row = new Row(t.sym(), t.px() * t.qty());
        sum += row.value();
    }
    return sum;
}` },
        { kind: 'list', items: [
          'In an anonymous class, `this` means the anonymous object. In a lambda, `this` means the enclosing object.',
          'Each `new` on an anonymous class creates a new object. A non-capturing lambda is normally reused as a single instance.',
          'Local records, enums and interfaces are implicitly static: they can\'t capture local variables.',
          'For a functional interface, always prefer a lambda. Reach for an anonymous class only when you need multiple methods or fields.',
        ] },
        { kind: 'check', q: 'Inside an anonymous class\'s method, what does `this` refer to?', options: ['The enclosing object', 'The anonymous object itself', 'The class literal', 'Nothing: `this` is illegal there'], answer: 1, hint: 'This is a difference from lambdas.', explain: 'An anonymous class is a real object with its own `this`. Use `Outer.this` to reach the enclosing object.' },
      ],
    },
  ],
  quiz: [
    { q: 'How many classes can a Java class extend, and how many interfaces can it implement?', options: ['One and one', 'One and any number', 'Any number and any number', 'Any number and one'], answer: 1, explain: 'Single class inheritance, multiple interface implementation.' },
    { q: 'What is a functional interface?', options: ['An interface with no methods', 'An interface with exactly one abstract method', 'Any interface in `java.util.function`', 'An interface with only default methods'], answer: 1, explain: 'A lambda provides the body of that single abstract method. Default and static methods do not count.' },
    { q: 'Why were default methods added?', options: ['To replace abstract classes', 'To allow interfaces to evolve without breaking existing implementers', 'To add state to interfaces', 'For performance'], answer: 1, explain: 'They let methods such as `Collection.stream` be added without breaking every existing collection class.' },
    { q: 'Which is the correct method reference for `s -> s.length()`?', options: ['`s::length`', '`String::length`', '`String.length`', '`String->length`'], answer: 1, explain: 'The form `Class::instanceMethod` uses the first argument as the receiver.' },
    { q: 'Which interface fits a function taking a `String` and returning a `boolean`?', options: ['`Supplier<String>`', '`Predicate<String>`', '`Consumer<String>`', '`Runnable`'], answer: 1, explain: '`Predicate<T>` is `T -> boolean`, called with `test`.' },
    { q: 'What does this expression do?', code: 'Comparator.comparing(Trade::sym).reversed()', options: ['Sorts by `sym` ascending', 'Produces a comparator for `sym` in descending order', 'Reverses the list in place', 'Does not compile'], answer: 1, explain: 'Comparators are composable values. `reversed` returns a new comparator.' },
    { q: 'Why is `return a - b;` a poor `compareTo` for ints?', options: ['It is slower', 'It can overflow and report the wrong order', 'It must return only -1, 0 or 1', 'Subtraction is illegal in a comparator'], answer: 1, explain: 'For large values of opposite signs the difference wraps around. Use `Integer.compare`.' },
    { q: 'In a lambda inside an instance method, `this` means…', options: ['The lambda object', 'The enclosing instance', 'The functional interface', 'Nothing: it is a compile error'], answer: 1, explain: 'A lambda has no scope of its own for `this`. Anonymous classes, by contrast, do.' },
  ],
}
