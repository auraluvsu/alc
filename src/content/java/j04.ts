import type { Module } from '../types'

export const j04: Module = {
  n: 4,
  title: 'Inheritance and Reflection',
  tour: '4 · Inheritance and Reflection',
  summary: 'Extending classes, dynamic dispatch, abstract and sealed hierarchies, the methods every Object has, enumerations, pattern matching, runtime type information and reflection.',
  topics: ['Extending a class', 'Abstract & sealed hierarchies', 'Object: equals, hashCode, toString', 'Enumerations', 'Pattern matching', 'Reflection'],
  cpp23: [
    'Unnamed patterns: `case Point(var x, _) ->` ignores what you do not need (Java 22).',
    'Primitive types in patterns, `instanceof` and `switch` are in their fifth preview (Java 27), so they are not yet final.',
    'Changing a `final` field through deep reflection now produces a warning, on the way to being disallowed (Java 26).',
    'The Class-File API gives a standard way to read and generate bytecode (Java 24).',
  ],
  lessons: [
    {
      id: 'extending',
      title: 'Extending a class',
      blocks: [
        { kind: 'analogy', text: "Inheritance is a job promotion with the same desk: a `Manager` is still an `Employee`, keeps every duty, and adds a few or does some differently. When head office says \"everyone: submit your pay\", it doesn't check titles. Each person just follows their own procedure. That is **dynamic dispatch**." },
        { kind: 'code', code: `public class Employee {
    private final String name;
    protected double salary;                       // visible to subclasses too

    public Employee(String name, double salary) {
        this.name = name;
        this.salary = salary;
    }

    public double pay() { return salary; }
    public String name() { return name; }
}

public class Manager extends Employee {
    private double bonus;

    public Manager(String name, double salary) {
        super(name, salary);                       // run the superclass constructor
    }

    public void setBonus(double b) { bonus = b; }

    @Override public double pay() {
        return super.pay() + bonus;                // extend the inherited behaviour
    }
}

Employee e = new Manager("Sam", 100);              // a Manager IS-A Employee
System.out.println(e.pay());                       // Manager's pay(): chosen at runtime
// e.setBonus(5);                                  // compile error: Employee has none` },
        { kind: 'list', items: [
          'The **compile-time type** of a variable decides which methods you may call. The **runtime type** of the object decides which implementation runs.',
          'A subclass inherits fields and methods but not constructors. If you do not call `super(...)`, the compiler inserts a call to the no-argument one.',
          'An override may return a more specific type, and may be more visible but never less.',
          '`final` on a method forbids overriding, and `final` on a class forbids extending (`String` is final).',
          '`private` and `static` methods don\'t take part in dynamic dispatch. A field isn\'t overridden either: a subclass field with the same name just hides the other.',
        ] },
        { kind: 'code', code: `Employee[] staff = { new Employee("Ann", 80), new Manager("Sam", 100) };
for (Employee s : staff) {
    System.out.println(s.name() + " " + s.pay());   // the right pay() each time
}

if (staff[1] instanceof Manager m) {                // test and bind in one step
    m.setBonus(10);
}` },
        { kind: 'compare',
          python: `class Manager(Employee):
    def __init__(self, name, salary):
        super().__init__(name, salary)
        self.bonus = 0

    def pay(self):
        return super().pay() + self.bonus`,
          cpp: `class Manager : public Employee {
    double bonus_ = 0;
public:
    using Employee::Employee;
    double pay() const override {   // the base must declare it virtual
        return Employee::pay() + bonus_;
    }
};`,
          go: `// Go has no inheritance. Embed instead:
type Manager struct {
    Employee
    bonus float64
}
func (m Manager) Pay() float64 { return m.Employee.Pay() + m.bonus }
// But Employee's methods never call Manager's Pay.`,
          ts: `class Manager extends Employee {
  bonus = 0
  override pay() { return super.pay() + this.bonus }
}`,
          java: `public class Manager extends Employee {
    private double bonus;
    public Manager(String n, double s) { super(n, s); }
    @Override public double pay() { return super.pay() + bonus; }
}`,
          note: 'In Java, every non-private instance method is virtual by default. C++ makes you opt in with `virtual`, and Java makes you opt out with `final`.' },
        { kind: 'check', q: 'Which `pay()` runs?', code: `Employee e = new Manager("Sam", 100);
e.pay();`, options: ['`Employee.pay`, from the variable\'s type', '`Manager.pay`, from the object\'s actual class', 'Both, in order', 'It does not compile'], answer: 1, hint: 'What is the object, not the label on the variable?', explain: 'Instance method calls dispatch on the runtime class of the object.' },
      ],
    },
    {
      id: 'hierarchies',
      title: 'Abstract & sealed hierarchies',
      blocks: [
        { kind: 'analogy', text: "An abstract class is a form with some sections already filled in and some marked \"complete me\": you can't file it until someone does. A sealed class is a club with a fixed guest list: since nobody else can join, the bouncer (the compiler) can tell you when you forgot to greet someone." },
        { kind: 'code', code: `public abstract class Shape {
    public abstract double area();                 // subclasses must supply this

    public String describe() {                     // shared behaviour with a hook:
        return "area " + area();                   // the "template method" pattern
    }
}

public class Circle extends Shape {
    private final double r;
    public Circle(double r) { this.r = r; }
    @Override public double area() { return Math.PI * r * r; }
}

// Sealed: only the listed types may extend it
public sealed interface Payment permits Card, Cash, Transfer {}
public record Card(String number) implements Payment {}
public record Cash(double amount) implements Payment {}
public non-sealed class Transfer implements Payment {}   // reopened for extension` },
        { kind: 'list', items: [
          'An `abstract` class can\'t be instantiated. It can have fields, constructors and concrete methods, which an interface can\'t.',
          'Every permitted subclass must be `final`, `sealed` or `non-sealed`. Records and enums are implicitly final.',
          'Permitted subclasses must be in the same package (or module). If they are all in one file, you may omit `permits`.',
          'Sealing lets the compiler check that a `switch` covers every case (later in this module). Add a new subtype and every incomplete switch stops compiling, which is the point.',
        ] },
        { kind: 'p', text: "Choose by asking what you need. An **interface** is for a capability that many unrelated types may offer. An **abstract class** is for closely related types that share state and code. A **sealed interface with records** is for a closed set of data alternatives, like the variants of `Payment`." },
        { kind: 'pitfall', text: 'Deep hierarchies age badly: a change at the top shakes everything below, and subclasses depend on superclass details. Keep them shallow, and prefer composition when "is-a" isn\'t truly the case (module 13).' },
        { kind: 'check', q: 'What must a class that directly implements a sealed interface be?', options: ['`abstract`', '`final`, `sealed` or `non-sealed`', '`public`', '`static`'], answer: 1, hint: 'The hierarchy must state how it continues.', explain: 'Each permitted subclass must say what happens next: closed (`final`), still restricted (`sealed`) or opened again (`non-sealed`).' },
      ],
    },
    {
      id: 'object',
      title: 'Object: the cosmic superclass',
      blocks: [
        { kind: 'analogy', text: "`hashCode` is the shelf number in a library, and `equals` is checking the actual title. Two copies of one book must go on the same shelf, or you'll never find the copy you're holding a reference for. That's the whole contract: **equal objects must have equal hash codes.**" },
        { kind: 'code', code: `public final class Money {
    private final String ccy;
    private final long cents;

    public Money(String ccy, long cents) { this.ccy = ccy; this.cents = cents; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;                    // a cheap identity test first
        return o instanceof Money m                    // false for null and other types
            && cents == m.cents
            && Objects.equals(ccy, m.ccy);             // handles null safely
    }

    @Override public int hashCode() {
        return Objects.hash(ccy, cents);               // the same fields as equals
    }

    @Override public String toString() {
        return "Money[" + ccy + " " + cents + "]";     // used by println and +
    }
}` },
        { kind: 'list', items: [
          'Every class extends `Object`, directly or indirectly. It provides `equals`, `hashCode`, `toString`, `getClass` and a few others.',
          'The default `equals` is `==`: same object only. The default `toString` is the class name and a hash, as in `Money@1b6d3586`.',
          '`equals` must be reflexive, symmetric, transitive, consistent and return `false` for `null`.',
          'Override `equals` and you must override `hashCode`, or `HashMap` and `HashSet` will silently misbehave.',
          'Use records whenever you can, since they generate all three correctly. Otherwise, let your IDE write them.',
          'Avoid `clone()`, a notoriously awkward mechanism. Write a copy constructor or a factory such as `copyOf`.',
        ] },
        { kind: 'code', code: `Set<Money> seen = new HashSet<>();
seen.add(new Money("USD", 100));
// With equals but no hashCode override, this is almost always false:
// the two objects hash to different buckets, and equals is never consulted.
System.out.println(seen.contains(new Money("USD", 100)));   // true, with both defined` },
        { kind: 'pitfall', text: 'Don\'t use a mutable field in `hashCode` for a key in a `HashMap` or `HashSet`. Change the field after inserting, and the object is stranded on the wrong shelf: it\'s in the set, but `contains` returns `false`.' },
        { kind: 'check', q: 'A class overrides `equals` but not `hashCode`. What goes wrong?', options: ['It does not compile', 'Equal objects usually hash differently, so `HashSet` and `HashMap` lookups fail', '`toString` breaks', 'Nothing as long as you only use `equals`'], answer: 1, hint: 'Which method does `HashMap` call first?', explain: 'The hash picks the bucket first. If equal objects land in different buckets, `equals` is never even consulted.' },
      ],
    },
    {
      id: 'enums',
      title: 'Enumerations',
      blocks: [
        { kind: 'analogy', text: "An enum isn't a list of numbers with nice names: it's a fixed cast of actual objects. Each one exists once, for the life of the program, and each can carry its own data and play its part in its own way." },
        { kind: 'code', code: `public enum Side {
    BUY(1), SELL(-1);                    // the only two instances that will ever exist

    private final int sign;              // enums can have fields...
    Side(int sign) { this.sign = sign; } // ...a private constructor...
    public int sign() { return sign; }   // ...and methods
    public Side opposite() { return this == BUY ? SELL : BUY; }
}

Side s = Side.BUY;
System.out.println(s == Side.BUY);       // true: == is correct for enums
System.out.println(s.name());            // "BUY"
System.out.println(s.ordinal());         // 0: declaration position
Side parsed = Side.valueOf("SELL");      // IllegalArgumentException if no match
for (Side x : Side.values()) { }         // every constant

int v = switch (s) {                     // exhaustive: no default needed
    case BUY -> 1;
    case SELL -> -1;
};

// Specialised sets and maps are compact and fast
var sides = EnumSet.of(Side.BUY);
var totals = new EnumMap<Side, Double>(Side.class);

// Each constant can have its own behaviour
public enum Op {
    ADD { @Override public int apply(int a, int b) { return a + b; } },
    MUL { @Override public int apply(int a, int b) { return a * b; } };
    public abstract int apply(int a, int b);
}` },
        { kind: 'list', items: [
          'Enum constants are type-safe. A method taking `Side` can\'t be handed a random `int`, unlike C-style enums.',
          'They implement `Comparable` and `Serializable` automatically, and may implement your own interfaces.',
          'A single-constant enum is a reliable way to make a singleton.',
          'Don\'t persist `ordinal()`. Inserting a new constant renumbers everything. Store `name()` or an explicit code field instead.',
        ] },
        { kind: 'check', q: 'How should you compare enum values?', options: ['Only with `equals`', '`==` is correct, since each constant is a single instance', 'By `ordinal()`', 'By `toString()`'], answer: 1, hint: 'How many `Side.BUY` objects can exist?', explain: 'Each constant is a singleton, so `==` is correct, and it is also null-safe and checked at compile time.' },
      ],
    },
    {
      id: 'patterns',
      title: 'Pattern matching',
      blocks: [
        { kind: 'analogy', text: "Think of a mail sorter who doesn't just read the label but opens the parcel, checks its type, and takes out the pieces in one motion. Pattern matching replaces \"check the type, cast it, then pull out the fields\" with a single declaration of the shape you're looking for." },
        { kind: 'code', code: `sealed interface Expr permits Num, Add, Mul, Neg {}
record Num(double v) implements Expr {}
record Add(Expr l, Expr r) implements Expr {}
record Mul(Expr l, Expr r) implements Expr {}
record Neg(Expr e) implements Expr {}

static double eval(Expr e) {
    return switch (e) {                          // no default: sealing makes it exhaustive
        case Num n -> n.v();                     // a type pattern
        case Add(Expr l, Expr r) -> eval(l) + eval(r);   // a record pattern
        case Mul(Num(var a), Num(var b)) -> a * b;       // patterns nest
        case Mul(Expr l, Expr r) -> eval(l) * eval(r);
        case Neg(Expr inner) -> -eval(inner);
    };
}

static String describe(Object o) {
    return switch (o) {
        case null -> "nothing";                  // without this, null throws an NPE
        case Integer i when i > 100 -> "big " + i;   // a guard
        case Integer i -> "int " + i;
        case String s -> "text of length " + s.length();
        case int[] xs -> "array of " + xs.length;
        default -> "other";
    };
}

if (o instanceof Add(Num(var a), var r) && a == 0) { }   // works in instanceof too` },
        { kind: 'list', items: [
          'Pattern switches are checked for **dominance**: a general case above a specific one is a compile error, since the specific one could never run.',
          'A switch on a sealed type needs no `default`, and shouldn\'t have one: leaving it out means adding a subtype causes a compile error at each switch that must be updated.',
          'A pattern variable is in scope only where the match certainly succeeded, including after `&&` in a condition.',
          'This is the other way to organise behaviour. A virtual method makes it easy to add a new **type**. A sealed switch makes it easy to add a new **operation**.',
        ] },
        { kind: 'new23', text: "The book covers type and record patterns (final in Java 21). **Java 22** added unnamed patterns: `case Add(Num _, var r) ->` tests the shape without binding a name, and `catch (Exception _)` and `for (var _ : xs)` work as well. Patterns over primitive types, such as `case int i when ...`, remain in **preview** as of Java 27 (fifth preview), so they need `--enable-preview` and may still change." },
        { kind: 'compare',
          python: `match e:
    case Num(v):
        return v
    case Add(l, r):
        return ev(l) + ev(r)`,
          cpp: `return std::visit(overloaded{
    [](const Num& n) { return n.v; },
    [](const Add& a) { return ev(*a.l) + ev(*a.r); },
}, e);`,
          go: `switch x := e.(type) {
case Num:
    return x.V
case Add:
    return eval(x.L) + eval(x.R)
}  // not checked for exhaustiveness`,
          ts: `switch (e.kind) {
  case 'num': return e.v
  case 'add': return ev(e.l) + ev(e.r)
}  // exhaustive via the union type`,
          java: `return switch (e) {
    case Num n -> n.v();
    case Add(Expr l, Expr r) -> eval(l) + eval(r);
    case Mul(Expr l, Expr r) -> eval(l) * eval(r);
    case Neg(Expr inner) -> -eval(inner);
};`,
          note: 'Python matches at runtime with no exhaustiveness check. Java verifies at compile time that every permitted subtype is handled.' },
        { kind: 'check', q: 'A switch over sealed `Expr` has no `default`, and a new record is added to the `permits` list. What happens?', options: ['A `default` is implied', 'That switch stops compiling until the new case is handled', 'A runtime error, only when the value appears', 'Nothing: new subtypes are ignored'], answer: 1, hint: 'This is what sealing buys you.', explain: 'The compiler knows the full set of subtypes, so a switch that misses one is a compile error. The bug shows up while you are writing the code.' },
      ],
    },
    {
      id: 'reflection',
      title: 'Runtime type information & reflection',
      blocks: [
        { kind: 'analogy', text: "Reflection is a program reading its own blueprint at runtime: what classes exist, what fields they have, and calling a method by name from a string. It's the tool frameworks use to work with classes they have never seen. Like a master key, it's powerful, and you should carry it only when you have to." },
        { kind: 'code', code: `Class<?> c = "text".getClass();              // from an object
Class<?> d = String.class;                   // from a type name
Class<?> e = Class.forName("java.util.ArrayList");   // from a string at runtime

System.out.println(c.getName());             // java.lang.String
System.out.println(c == d);                  // true: one Class object per loaded type

for (var m : Trade.class.getDeclaredMethods()) {
    System.out.println(m.getName());
}

// Records expose their shape directly
for (var rc : Trade.class.getRecordComponents()) {
    System.out.println(rc.getName() + ": " + rc.getType());
}

// Calling something discovered at runtime
Object list = e.getDeclaredConstructor().newInstance();
var add = e.getMethod("add", Object.class);
add.invoke(list, "XAU");
System.out.println(list);                    // [XAU]

// Resources travel inside your JAR: find them through the class
try (var in = Main.class.getResourceAsStream("/config.properties")) {
    if (in != null) new java.util.Properties().load(in);
}` },
        { kind: 'list', items: [
          'Reflection powers serialisation libraries, dependency injection, test frameworks and ORMs.',
          'You lose compile-time checks, since a misspelled method name fails only at runtime. It is also slower to set up than a direct call.',
          '`setAccessible(true)` overrides `private`, but strong encapsulation in modules (module 12) restricts it across module boundaries.',
          '`Proxy.newProxyInstance` generates an implementation of an interface at runtime, with each call routed through one handler. Frameworks use this to wrap objects with logging or transactions.',
        ] },
        { kind: 'new23', text: "**Java 26** began closing a long-standing hole: using deep reflection to change a `final` field now issues a warning, in preparation for disallowing it by default. If a library you use does this, you'll see the warning in the logs. **Java 24** also added a standard Class-File API (`java.lang.classfile`) for tools that generate bytecode." },
        { kind: 'pitfall', text: 'Application code rarely needs reflection. If you want to vary behaviour, reach for interfaces, lambdas or sealed types first: those keep the compiler on your side.' },
        { kind: 'check', q: 'What does `obj.getClass()` return?', options: ['The compile-time type of the variable', 'A `Class` object for the object\'s runtime class', 'The class name as a `String`', 'A new instance'], answer: 1, hint: 'Is it about the variable or the object?', explain: '`getClass` reports the actual runtime class. An `Employee` variable holding a `Manager` gives `Manager.class`.' },
      ],
    },
  ],
  quiz: [
    { q: 'What decides which overridden method runs?', options: ['The declared type of the variable', 'The runtime class of the object', 'The order of class loading', 'The access modifier'], answer: 1, explain: 'That is dynamic dispatch. The declared type only decides which methods you may call.' },
    { q: 'What is the difference between an abstract class and an interface?', options: ['Interfaces cannot have any method bodies', 'An abstract class can have instance fields and constructors; an interface cannot', 'Abstract classes can be instantiated', 'There is no difference'], answer: 1, explain: 'Interfaces can have default methods but no instance state.' },
    { q: 'What does the `sealed` modifier do?', options: ['Prevents all subclassing', 'Restricts subtypes to a declared set', 'Makes all fields final', 'Prevents reflection'], answer: 1, explain: 'It gives you a closed hierarchy that a `switch` can check for exhaustiveness.' },
    { q: 'What is the contract between `equals` and `hashCode`?', options: ['Equal hash codes imply equal objects', 'Equal objects must have equal hash codes', 'Both must call `super`', 'There is no relationship'], answer: 1, explain: 'The reverse isn\'t required: unequal objects may collide.' },
    { q: 'Why not persist `enum.ordinal()`?', options: ['It is slow', 'Reordering or inserting constants changes it', 'It may be negative', 'It is private'], answer: 1, explain: 'Store `name()` or an explicit code instead.' },
    { q: 'What happens when a `switch` over an object receives `null` and has no `case null`?', options: ['It goes to `default`', 'It throws `NullPointerException`', 'It returns `null`', 'It skips the switch'], answer: 1, explain: 'Add `case null ->` to handle it explicitly.' },
    { q: 'What does this guard do: `case Integer i when i > 100 ->`?', options: ['Casts the value to a big integer', 'Matches only integers greater than 100', 'Runs a loop', 'Is a preview feature only'], answer: 1, explain: 'If the guard is false, matching continues with the next case.' },
    { q: 'Why might a reflective call to `setAccessible(true)` fail in modern Java?', options: ['Reflection was removed', 'Strong encapsulation: a module has not opened that package', 'The method must be static', 'It requires a security manager'], answer: 1, explain: 'A module must `opens` a package for deep reflection from outside.' },
  ],
}
