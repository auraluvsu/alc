import type { Module } from '../types'

export const j13: Module = {
  n: 13,
  title: 'Object-Oriented Design',
  tour: 'Added · OO design',
  summary: 'Using objects well: responsibilities and encapsulation, composition over inheritance, depending on abstractions, the SOLID ideas, classic patterns as they look in modern Java, and when to use data rather than objects.',
  topics: ['Responsibilities & encapsulation', 'Composition over inheritance', 'Polymorphism & dependency inversion', 'SOLID without the slogans', 'Design patterns in modern Java', 'Objects vs data'],
  cpp23: [
    'This module is an addition to the book. Records, sealed types and pattern matching (Java 16 to 21) change which patterns you need at all.',
    'Lambdas replace many one-method classes in Strategy, Command and Factory patterns.',
  ],
  lessons: [
    {
      id: 'responsibility',
      title: 'Responsibilities & encapsulation',
      blocks: [
        { kind: 'analogy', text: "Good objects behave like colleagues rather than filing cabinets. You don't open an accountant's drawer, take out the ledger, add a line and put it back. You say \"please record this expense\", and how the books are kept stays the accountant's business. That habit has a name: **tell, don't ask**." },
        { kind: 'code', code: `// ASKING: logic lives outside, and the rules get copied around
class BankAccount {
    private double balance;
    public double getBalance() { return balance; }
    public void setBalance(double b) { balance = b; }
}

void withdrawBad(BankAccount a, double amt) {
    if (a.getBalance() >= amt) {
        a.setBalance(a.getBalance() - amt);   // every caller re-implements this rule
    }
}

// TELLING: the object protects its own rules
final class Account {
    private long cents;

    Account(long cents) { this.cents = cents; }

    boolean withdraw(long amount) {
        if (amount <= 0 || amount > cents) return false;
        cents -= amount;
        return true;
    }
}` },
        { kind: 'list', items: [
          'Start from **behaviour**, not data. Ask "what should this object do?" before "what fields does it have?".',
          'Give a class one clear job that you can describe in a sentence without saying "and". `OrderManager`, `Helper` and `Util` usually mean no one could name that job.',
          'A class has high **cohesion** if its methods all use the same fields. If half the methods use half the fields, there are two classes in there.',
          'Keep **coupling** low: the less one class knows about another\'s insides, the safer each is to change.',
          'Make illegal states unrepresentable: a `Money` type that always holds a currency, rather than a `double` and a nullable `String` kept side by side.',
          'Prefer immutable objects where it\'s natural. Fewer moving parts means fewer invariants to protect.',
        ] },
        { kind: 'pitfall', text: 'The **anaemic domain model**: classes that are nothing but getters and setters, with all the logic in a `Service` that manipulates them. It looks object-oriented, but it\'s really procedural code with extra typing, and nothing protects the invariants.' },
        { kind: 'check', q: 'Which design best protects the rule "balance can\'t go negative"?', options: ['A public field with a comment', 'A setter that callers must remember to check first', 'A `withdraw` method that enforces it, with no setter', 'A separate `BalanceValidator` called by each caller'], answer: 2, hint: 'Where is the only place the rule needs to exist?', explain: 'If only the object can change its state, the rule lives in one place, and no caller can break it.' },
      ],
    },
    {
      id: 'composition',
      title: 'Composition over inheritance',
      blocks: [
        { kind: 'analogy', text: "Inheritance welds a new part on to a machine: quick, but you now depend on every internal detail of what you welded to. Composition plugs parts together: a car **has** an engine and isn't a kind of engine. When a better engine comes along, you swap it out." },
        { kind: 'code', code: `// Inheritance breaks in a surprising way
class CountingList<E> extends ArrayList<E> {
    int added = 0;
    @Override public boolean add(E e) { added++; return super.add(e); }
    @Override public boolean addAll(Collection<? extends E> c) {
        added += c.size();
        return super.addAll(c);
    }
}
// If the superclass's addAll were ever implemented by calling add(), each element
// would count twice. You are depending on a private detail of ArrayList.

// Composition: wrap, and forward only what you mean to offer
final class CountingBag<E> {
    private final List<E> items = new ArrayList<>();
    private int added = 0;

    void add(E e) { items.add(e); added++; }
    void addAll(Collection<? extends E> c) { c.forEach(this::add); }
    int added() { return added; }
    List<E> items() { return List.copyOf(items); }
}

// Swap behaviour by swapping a part
interface Discount { double apply(double price); }

final class Checkout {
    private final Discount discount;              // HAS-A, chosen when built
    Checkout(Discount d) { discount = d; }
    double total(double price) { return discount.apply(price); }
}

var normal = new Checkout(p -> p);
var sale = new Checkout(p -> p * 0.8);` },
        { kind: 'list', items: [
          'Use inheritance only for a true **is-a** relationship, where the subclass can stand in for the parent everywhere, and when you control both classes.',
          'Warning signs: overriding a method to throw `UnsupportedOperationException`, or inheriting just to reuse a few helpers.',
          'The JDK has a famous mistake: `Stack extends Vector`, which gives stacks an `add(index, item)`. `Properties extends Hashtable` is another.',
          'Design for inheritance, or forbid it. Mark classes `final` unless you\'ve considered and documented how subclasses may hook in.',
          'A `sealed` hierarchy is a good compromise: inheritance, with a closed list of participants you control.',
        ] },
        { kind: 'compare',
          python: `class Checkout:
    def __init__(self, discount):
        self.discount = discount   # any callable

sale = Checkout(lambda p: p * 0.8)`,
          cpp: `class Checkout {
    std::function<double(double)> discount_;
public:
    explicit Checkout(std::function<double(double)> d) : discount_{std::move(d)} {}
};`,
          go: `// Go has no inheritance at all, so composition is the only way.
type Checkout struct {
    Discount func(float64) float64
}`,
          ts: `class Checkout {
  constructor(private discount: (p: number) => number) {}
}`,
          java: `final class Checkout {
    private final Discount discount;
    Checkout(Discount d) { discount = d; }
}
var sale = new Checkout(p -> p * 0.8);`,
          note: 'Go removed inheritance altogether and did fine. That is good evidence for how rarely you truly need it.' },
        { kind: 'check', q: 'A `Square extends Rectangle` overrides `setWidth` to change the height as well. What principle does this break?', options: ['Encapsulation', 'Substitutability: code written for `Rectangle` can now be surprised', 'Overloading', 'It breaks nothing'], answer: 1, hint: 'What does a caller expect after `setWidth(5)`, given a `Rectangle`?', explain: 'A subclass must honour the parent\'s promises. A caller that sets the width and height independently will get wrong results from a `Square`.' },
      ],
    },
    {
      id: 'polymorphism',
      title: 'Polymorphism & dependency inversion',
      blocks: [
        { kind: 'analogy', text: "A company that hard-wires itself to one specific courier has a problem when that courier fails. Instead, the company writes a spec: \"anyone who can pick up, deliver and confirm\". Now the couriers depend on the company's spec, rather than the company depending on a courier. That reversal is **dependency inversion**." },
        { kind: 'code', code: `// Without polymorphism: every new type edits this method
double feeBad(String kind, double notional) {
    if (kind.equals("equity")) return notional * 0.001;
    if (kind.equals("fx")) return notional * 0.0002;
    throw new IllegalArgumentException(kind);
}

// With polymorphism: each new type is a new class, and this code stays closed
interface Instrument { double fee(double notional); }
record Equity() implements Instrument {
    public double fee(double n) { return n * 0.001; }
}
record Fx() implements Instrument {
    public double fee(double n) { return n * 0.0002; }
}

// Dependency inversion: high-level policy owns the interface
interface TradeStore { void save(Trade t); }

final class TradeService {
    private final TradeStore store;
    TradeService(TradeStore store) { this.store = store; }   // constructor injection
    void book(Trade t) { store.save(t); }
}

// Production wiring
// new TradeService(new PostgresTradeStore(dataSource));

// In tests: no database, no mocking library
final class MemoryStore implements TradeStore {
    final List<Trade> saved = new ArrayList<>();
    @Override public void save(Trade t) { saved.add(t); }
}` },
        { kind: 'list', items: [
          '**Dependency injection** just means "pass in what you need". You can do it with plain constructors. Frameworks such as Spring add automation, not a new idea.',
          'Avoid `new` for collaborators with side effects (a database, a clock, the network) inside your logic. Pass them in, and tests become easy.',
          'Inject a `java.time.Clock` rather than calling `Instant.now()`, and tests can control time.',
          'Don\'t create an interface for every class. A single implementation with no test double in sight doesn\'t need one, and you can extract it later when there\'s a second.',
        ] },
        { kind: 'check', q: 'What is the main practical benefit of `TradeService(TradeStore store)` over creating `new PostgresTradeStore()` inside it?', options: ['It runs faster', 'You can supply any implementation, so tests need no database', 'It uses less memory', 'It removes the need for interfaces'], answer: 1, hint: 'What would you pass in a unit test?', explain: 'The service depends on a contract. Any implementation can be plugged in, which makes testing and later changes easy.' },
      ],
    },
    {
      id: 'solid',
      title: 'SOLID without the slogans',
      blocks: [
        { kind: 'analogy', text: "SOLID is a set of smoke detectors, not a building code. They don't tell you how to design a house. They go off when something's starting to burn: a class that keeps changing for unrelated reasons, or a subclass that surprises its callers. Treat them as questions to ask about real pain, not rules to apply up front." },
        { kind: 'list', items: [
          '**S: single responsibility.** A class should have one reason to change. If tax rules and PDF layout both force edits to `Invoice`, split them.',
          '**O: open/closed.** Add behaviour by adding code, not by editing what already works: a new `Instrument` class, not one more `else if`.',
          '**L: Liskov substitution.** A subtype must work anywhere its parent does, keeping the parent\'s promises. No stricter preconditions, no weaker results.',
          '**I: interface segregation.** Don\'t force clients to depend on methods they don\'t use. Prefer several small interfaces to one with thirty methods.',
          '**D: dependency inversion.** Business logic defines the interfaces it needs, and infrastructure implements them.',
        ] },
        { kind: 'code', code: `// Interface segregation: readers shouldn't depend on write methods
interface PriceReader { double latest(String sym); }
interface PriceWriter { void publish(String sym, double px); }

final class PriceCache implements PriceReader, PriceWriter {
    private final Map<String, Double> px = new ConcurrentHashMap<>();
    @Override public double latest(String sym) { return px.getOrDefault(sym, 0.0); }
    @Override public void publish(String sym, double p) { px.put(sym, p); }
}

// A report needs only this much:
double report(PriceReader feed) { return feed.latest("XAU"); }

// A Liskov violation: the parent promises add() works
final class ReadOnlyList<E> extends ArrayList<E> {
    @Override public boolean add(E e) { throw new UnsupportedOperationException(); }
}` },
        { kind: 'pitfall', text: 'Over-engineering does more damage than under-engineering in most codebases. An `AbstractOrderProcessorFactoryProvider` for a single implementation has real costs: more files, more indirection and harder reading. Add an abstraction when you have a second use, or a clear need.' },
        { kind: 'check', q: 'A `Bird` class has `fly()`, and `Penguin extends Bird` throws in `fly()`. Which principle is at stake?', options: ['Single responsibility', 'Liskov substitution', 'Interface segregation only', 'None'], answer: 1, hint: 'Can a Penguin stand in wherever a Bird is expected?', explain: 'Code that calls `bird.fly()` breaks when handed a `Penguin`. The promise belongs to a narrower type, such as a `Flyer` interface.' },
      ],
    },
    {
      id: 'patterns',
      title: 'Design patterns in modern Java',
      blocks: [
        { kind: 'analogy', text: "Patterns are recipes with names. Their real value is the vocabulary: saying \"that's a strategy\" tells your colleague a lot in three words. Many were written for a Java with no lambdas, so modern versions are often much shorter. A good cook knows when the recipe's been replaced by a better appliance." },
        { kind: 'code', code: `// STRATEGY: interchangeable algorithms. Used to be a class per algorithm, now a lambda
trades.sort(Comparator.comparing(Trade::sym));

// BUILDER: readable construction with many optional parts
public final class Request {
    private final String url;
    private final int timeoutMs;
    private final boolean retry;

    private Request(Builder b) { url = b.url; timeoutMs = b.timeoutMs; retry = b.retry; }

    public static Builder to(String url) { return new Builder(url); }

    public static final class Builder {
        private final String url;
        private int timeoutMs = 5_000;           // defaults live here
        private boolean retry;

        private Builder(String url) { this.url = url; }
        public Builder timeoutMs(int v) { timeoutMs = v; return this; }
        public Builder retry() { retry = true; return this; }
        public Request build() { return new Request(this); }
    }
}
var req = Request.to("https://example.com").timeoutMs(1000).retry().build();

// FACTORY METHOD: choose the implementation by name
sealed interface Codec permits Json, Csv {
    static Codec of(String kind) {
        return switch (kind) {
            case "json" -> new Json();
            case "csv" -> new Csv();
            default -> throw new IllegalArgumentException(kind);
        };
    }
}
record Json() implements Codec {}
record Csv() implements Codec {}

// OBSERVER: tell interested parties about events
final class Ticker {
    private final List<Consumer<Double>> listeners = new CopyOnWriteArrayList<>();
    void subscribe(Consumer<Double> l) { listeners.add(l); }
    void publish(double px) { listeners.forEach(l -> l.accept(px)); }
}

// DECORATOR: same interface, added behaviour
interface Feed { double latest(String sym); }
record LoggedFeed(Feed inner) implements Feed {
    @Override public double latest(String sym) {
        double px = inner.latest(sym);
        System.out.println(sym + " = " + px);
        return px;
    }
}

// TEMPLATE METHOD: a fixed skeleton with one hook; often a function parameter now
static <T> T timed(Supplier<T> work) {
    long t0 = System.nanoTime();
    try { return work.get(); }
    finally { System.out.println(System.nanoTime() - t0); }
}` },
        { kind: 'list', items: [
          '**Strategy / Command:** a lambda is usually enough.',
          '**Builder:** for four or more parameters, particularly when many are optional. For few, a record with static factories is simpler.',
          '**Decorator:** found in `java.io` (`BufferedReader` wraps a `Reader`) and `Collections.unmodifiableList`.',
          '**Singleton:** rarely a good idea. It\'s a global variable, and it makes testing hard. Create one object at startup, and pass it in.',
          '**Visitor:** a sealed interface and a pattern `switch` replaces it almost entirely.',
        ] },
        { kind: 'check', q: 'In modern Java, what most often replaces a Strategy class with a single method?', options: ['A static block', 'A lambda or method reference', 'A singleton', 'An annotation'], answer: 1, hint: 'A functional interface takes which kind of expression?', explain: 'If the strategy is a single behaviour, a lambda supplies it without a class. Only reach for a named class when it has state or several methods.' },
      ],
    },
    {
      id: 'data-vs-objects',
      title: 'Objects vs data',
      blocks: [
        { kind: 'analogy', text: "Some things are actors, and some are facts. A bank account is an actor: it has rules and a life story. \"$10 on 6 November\" is a fact: there's nothing to protect, and it never changes. Classic OO treats everything as an actor. Modern Java offers two good tools, and the skill is telling which one you're looking at." },
        { kind: 'code', code: `// OBJECT style: behaviour with the type. Easy to add a new TYPE.
interface Shape { double area(); }
record Circle(double r) implements Shape {
    public double area() { return Math.PI * r * r; }
}
record Rect(double w, double h) implements Shape {
    public double area() { return w * h; }
}

// DATA style: a closed set of shapes. Easy to add a new OPERATION.
sealed interface Figure permits Round, Box {}
record Round(double r) implements Figure {}
record Box(double w, double h) implements Figure {}

static double area(Figure f) {
    return switch (f) {
        case Round c -> Math.PI * c.r() * c.r();
        case Box b -> b.w() * b.h();
    };
}
static String svg(Figure f) {           // no change to any record
    return switch (f) {
        case Round c -> "<circle r='" + c.r() + "'/>";
        case Box b -> "<rect width='" + b.w() + "' height='" + b.h() + "'/>";
    };
}` },
        { kind: 'list', items: [
          '**Add types often?** Use polymorphic methods: new classes don\'t touch existing code. Plug-ins and strategies are typical.',
          '**Add operations often?** Use sealed types with pattern matching: new functions don\'t touch the data. Compilers, messages and API results are typical.',
          'This trade-off is known as the **expression problem**: neither style makes both kinds of change easy.',
          'A common shape for a modern Java application: records for data moving through the system, stateful objects for the few things with identity and lifecycle, and interfaces at the boundaries.',
          'Immutable data, with logic in focused methods, is often much easier to test than a web of mutable objects.',
        ] },
        { kind: 'compare',
          python: `@dataclass(frozen=True)
class Box:
    w: float
    h: float

match f:
    case Box(w, h):
        area = w * h`,
          cpp: `using Figure = std::variant<Round, Box>;

double area(const Figure& f) {
    return std::visit(overloaded{
        [](const Round& c) { return 3.14 * c.r * c.r; },
        [](const Box& b)   { return b.w * b.h; },
    }, f);
}`,
          go: `type Figure interface{ isFigure() }  // sealed by an unexported method

func area(f Figure) float64 {
    switch v := f.(type) {
    case Round: return 3.14 * v.R * v.R
    case Box:   return v.W * v.H
    }
    panic("unreachable")
}`,
          ts: `type Figure = { kind: "round"; r: number } | { kind: "box"; w: number; h: number }

const area = (f: Figure) =>
  f.kind === "round" ? Math.PI * f.r * f.r : f.w * f.h`,
          java: `sealed interface Figure permits Round, Box {}
record Round(double r) implements Figure {}
record Box(double w, double h) implements Figure {}

static double area(Figure f) {
    return switch (f) {
        case Round c -> Math.PI * c.r() * c.r();
        case Box b -> b.w() * b.h();
    };
}`,
          note: 'Java now has real algebraic data types. If you came for OOP, keep this tool as well: it isn\'t a betrayal of it.' },
        { kind: 'check', q: 'You often add new operations over a stable, fixed set of message types. Which fits best?', options: ['A deep abstract class hierarchy', 'A sealed interface, records, and pattern `switch`', 'A map from strings to objects', 'Reflection'], answer: 1, hint: 'Which style makes adding an operation cheap?', explain: 'A new operation is just a new function, and the compiler checks that each switch handles every type.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does "tell, don\'t ask" encourage?', options: ['More getters', 'Asking objects to do things instead of pulling out their data to act on it', 'More comments', 'Using static methods'], answer: 1, explain: 'Logic stays with the data it protects.' },
    { q: 'When is inheritance appropriate?', options: ['Whenever two classes share code', 'For a true is-a relationship where the subclass can always stand in for the parent', 'Always instead of composition', 'To reuse a helper method'], answer: 1, explain: 'To reuse code, prefer composition.' },
    { q: 'What is dependency injection?', options: ['A framework feature only', 'Giving an object its collaborators from outside, such as through its constructor', 'A compiler optimisation', 'Bytecode manipulation'], answer: 1, explain: 'Plain constructors are enough. A framework only automates the wiring.' },
    { q: 'Which is a sign of a Liskov violation?', options: ['An abstract method', 'A subclass that throws `UnsupportedOperationException` for an inherited method', 'A class with two interfaces', 'A final method'], answer: 1, explain: 'Callers relying on the parent\'s promise will break.' },
    { q: 'Why is `Stack extends Vector` considered a mistake?', options: ['It is slow', 'A stack isn\'t a vector: it exposes operations that break stack discipline', 'Vector is final', 'Stack was never released'], answer: 1, explain: 'It should have used composition.' },
    { q: 'What is a common problem with the Singleton pattern?', options: ['It uses too much memory', 'It is effectively global state, which makes testing and reasoning harder', 'It does not compile', 'It cannot have methods'], answer: 1, explain: 'Create one instance at startup, and pass it to whatever needs it.' },
    { q: 'What modern Java feature largely replaces the Visitor pattern?', options: ['`var`', 'Sealed types with pattern `switch`', 'Text blocks', 'Modules'], answer: 1, explain: 'The compiler checks exhaustiveness, and no `accept` plumbing is needed.' },
    { q: 'What does the expression problem describe?', options: ['Slow lambda expressions', 'The tension between making it easy to add new types and easy to add new operations', 'Precedence in arithmetic', 'A kind of compile error'], answer: 1, explain: 'Polymorphism makes new types cheap. Pattern matching makes new operations cheap.' },
  ],
}
