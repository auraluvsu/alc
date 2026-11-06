import type { Module } from '../types'

export const j02: Module = {
  n: 2,
  title: 'Object-Oriented Programming',
  tour: '2 · Object-Oriented Programming',
  summary: 'Objects and references, writing classes that protect their invariants, construction, records, static members, packages, nested classes and documentation comments.',
  topics: ['Objects & references', 'Implementing classes', 'Object construction', 'Records', 'Static members & packages', 'Nested classes & docs'],
  cpp23: [
    'Flexible constructor bodies: statements may now come before `super(...)` or `this(...)`, for validating arguments first (Java 25).',
    'Documentation comments can be written in Markdown with `///` (Java 23).',
    'Module import declarations: `import module java.base;` imports every package the module exports (Java 25).',
  ],
  lessons: [
    {
      id: 'objects',
      title: 'Objects & references',
      blocks: [
        { kind: 'analogy', text: "A class is the blueprint and an object is the house built from it. A variable is never the house: it is a card with the address written on it. Hand someone a copy of the card and you both visit the same house, so if they repaint the door, you see the new colour." },
        { kind: 'stepper', title: 'Two variables, one object', code: [
          'Account a = new Account(100);',
          'Account b = a;',
          'b.deposit(50);',
          'a = new Account(0);',
          'b = null;',
        ], steps: [
          { line: 1, note: '`new` allocates an object on the heap and runs the constructor. `a` holds a reference to it.', memory: [
            { name: 'a', value: '→ Account#1', kind: 'ptr' }, { name: 'Account#1', value: 'balance = 100', kind: 'heap' },
          ] },
          { line: 2, note: 'Assignment copies the **reference**. There is still only one Account.', memory: [
            { name: 'a', value: '→ Account#1', kind: 'ptr' }, { name: 'b', value: '→ Account#1', kind: 'ptr' }, { name: 'Account#1', value: 'balance = 100', kind: 'heap' },
          ] },
          { line: 3, note: 'Calling through `b` changes the shared object, and `a` sees the change too.', memory: [
            { name: 'a', value: '→ Account#1', kind: 'ptr' }, { name: 'b', value: '→ Account#1', kind: 'ptr' }, { name: 'Account#1', value: 'balance = 150', kind: 'heap' },
          ] },
          { line: 4, note: '`a` now refers to a new object. `b` is unaffected and keeps the first one alive.', memory: [
            { name: 'a', value: '→ Account#2', kind: 'ptr' }, { name: 'b', value: '→ Account#1', kind: 'ptr' }, { name: 'Account#1', value: 'balance = 150', kind: 'heap' }, { name: 'Account#2', value: 'balance = 0', kind: 'heap' },
          ] },
          { line: 5, note: 'Nothing refers to Account#1 any more, so the garbage collector may reclaim it at some later point. Calling a method through `b` now would throw `NullPointerException`.', memory: [
            { name: 'a', value: '→ Account#2', kind: 'ptr' }, { name: 'b', value: 'null', kind: 'val' }, { name: 'Account#1', value: 'unreachable', kind: 'dead' }, { name: 'Account#2', value: 'balance = 0', kind: 'heap' },
          ] },
        ] },
        { kind: 'list', items: [
          '**Accessor** methods read state (`list.size()`). **Mutator** methods change it (`list.add(x)`). Many well-designed classes have no mutators at all, as with `String`, `LocalDate` and records.',
          'There is no way to place an object inside a variable. Every object lives on the heap, and every object variable is a reference. (The JIT may optimise allocations away, but that never changes the meaning.)',
          'Objects have no destructor. Memory is reclaimed automatically. Other resources such as files are released with try-with-resources (module 5).',
        ] },
        { kind: 'pitfall', text: 'A method returning a reference to internal mutable state hands callers the keys. If `getItems()` returns your private `ArrayList`, anyone can modify it. Return `List.copyOf(items)` or an unmodifiable view instead.' },
        { kind: 'check', q: 'How many `Account` objects exist after this?', code: `Account a = new Account(1);
Account b = a;
Account c = b;`, options: ['1', '2', '3', '0'], answer: 0, hint: 'Count the `new`s.', explain: 'Only `new` creates an object. The other lines copy references to it.' },
      ],
    },
    {
      id: 'classes',
      title: 'Implementing classes',
      blocks: [
        { kind: 'analogy', text: "A well-designed class is a vending machine: buttons on the front, machinery behind a locked panel. Customers can't reach in and set the coin count to a thousand, so the machine can promise that its books always balance. **Encapsulation** is that locked panel, and the promise is called an **invariant**." },
        { kind: 'code', code: `public class Account {
    private final String owner;     // set once in the constructor
    private long balanceCents;      // private: only this class can touch it

    public Account(String owner, long openingCents) {
        if (openingCents < 0) throw new IllegalArgumentException("negative opening");
        this.owner = owner;         // this.owner is the field, owner the parameter
        this.balanceCents = openingCents;
    }

    public void deposit(long cents) {
        if (cents <= 0) throw new IllegalArgumentException("deposit must be positive");
        balanceCents += cents;      // the invariant (never negative) is kept here
    }

    public boolean withdraw(long cents) {
        if (cents <= 0 || cents > balanceCents) return false;
        balanceCents -= cents;
        return true;
    }

    public long balance() { return balanceCents; }
    public String owner() { return owner; }
}` },
        { kind: 'list', items: [
          'Keep fields `private`. Access levels are `private` (this class), no modifier (same package), `protected` (package plus subclasses), `public` (everyone).',
          '`this` is the object the method was called on. You only need to write it to resolve a name clash.',
          'Instance methods dispatch on the object\'s **runtime** class (module 4), and every call is effectively virtual unless the method is `private`, `static` or `final`.',
          'Mark fields `final` wherever you can. A class whose fields are all `final` and whose fields point only at immutable data is safe to share across threads.',
          'Avoid reflexive getters and setters for every field. A setter on everything is a public field with extra typing. Offer operations that mean something (`withdraw`), not `setBalance`.',
        ] },
        { kind: 'compare',
          python: `class Account:
    def __init__(self, owner, cents):
        self._owner = owner      # private by convention only
        self._cents = cents

    def deposit(self, cents):
        self._cents += cents`,
          cpp: `class Account {
    std::string owner_;
    long cents_;
public:
    Account(std::string o, long c) : owner_{std::move(o)}, cents_{c} {}
    void deposit(long c) { cents_ += c; }
};`,
          go: `type Account struct {
    owner string  // lowercase: package-private
    cents int64
}

func (a *Account) Deposit(c int64) { a.cents += c }`,
          ts: `class Account {
  #cents: number
  constructor(readonly owner: string, cents: number) { this.#cents = cents }
  deposit(c: number) { this.#cents += c }
}`,
          java: `public class Account {
    private final String owner;
    private long cents;

    public Account(String owner, long cents) {
        this.owner = owner;
        this.cents = cents;
    }

    public void deposit(long c) { cents += c; }
}`,
          note: 'Java enforces `private` at compile time and at runtime, per class. Two `Account` objects can read each other\'s private fields, because the boundary is the class, not the object.' },
        { kind: 'check', q: 'Why make `balanceCents` private rather than public?', options: ['Private fields are faster', 'So the class alone can enforce rules like "never negative"', 'Public fields do not compile in a class with methods', 'To stop subclasses being written'], answer: 1, hint: 'Who could break the rule if everybody could write to it?', explain: 'Encapsulation means that invariants need checking in only one place. If any code could assign the field, no rule could be guaranteed.' },
      ],
    },
    {
      id: 'construction',
      title: 'Object construction',
      blocks: [
        { kind: 'analogy', text: "A constructor is the factory's final inspection: nothing leaves the line half-built. Overloaded constructors are different order forms that all feed the same assembly line, so the rules live in one station and the forms just fill in defaults." },
        { kind: 'code', code: `public class Order {
    private static int nextId = 1;           // shared by all orders

    private final int id = nextId++;         // field initialiser runs before the body
    private final String sym;
    private final int qty;
    private String note = "";                // default value for every order

    public Order(String sym, int qty) {
        if (qty <= 0) throw new IllegalArgumentException("qty");
        this.sym = sym;
        this.qty = qty;
    }

    public Order(String sym) {
        this(sym, 1);                        // delegate to the other constructor
    }

    public static Order ofLot(String sym) {  // a static factory has a useful name
        return new Order(sym, 100);
    }
}` },
        { kind: 'list', items: [
          'A constructor has the class\'s name and no return type. Writing `public void Order()` declares an ordinary method by accident.',
          'If you write no constructor at all, the compiler supplies a no-argument one. Write any constructor and that default disappears.',
          'Order of events: all fields get default values, then field initialisers and instance init blocks run in source order, then the constructor body.',
          'Every `final` field must be assigned by the end of construction, or the code will not compile.',
          '**Static factory methods** (`List.of`, `Path.of`, `Optional.empty`) can have descriptive names, can return cached instances, and can return a subclass.',
        ] },
        { kind: 'new23', text: "Until recently, `this(...)` or `super(...)` had to be the very first statement in a constructor, so checking an argument before delegating needed awkward static helpers. **Java 25** allows statements before that call, as long as they don't touch the object being built. They may validate arguments and may assign this class's fields." },
        { kind: 'code', code: `public class Percent extends Number {
    private final double value;

    public Percent(double value) {
        if (value < 0 || value > 100) throw new IllegalArgumentException();  // Java 25+
        super();                  // may no longer need to be first
        this.value = value;
    }

    @Override public double doubleValue() { return value; }
    @Override public float floatValue() { return (float) value; }
    @Override public int intValue() { return (int) value; }
    @Override public long longValue() { return (long) value; }
}` },
        { kind: 'pitfall', text: 'Never call an overridable method from a constructor. A subclass override would run before the subclass\'s own fields are initialised, and it would see zeros and nulls.' },
        { kind: 'check', q: 'This class has one constructor, `Order(String sym)`. What does `new Order()` do?', options: ['Creates an order with a null `sym`', 'Compile error: the default constructor no longer exists', 'Throws `NullPointerException`', 'Creates an order with an empty `sym`'], answer: 1, hint: 'When does the compiler add a no-argument constructor?', explain: 'The compiler only supplies a no-argument constructor when a class declares no constructors at all.' },
      ],
    },
    {
      id: 'records',
      title: 'Records',
      blocks: [
        { kind: 'analogy', text: "A record is a labelled specimen jar: what's inside is exactly what the label says, sealed when you fill it. Two jars with the same contents count as equal. You don't write the label, the seal or the comparison yourself, because a jar's whole job is to be its contents." },
        { kind: 'code', code: `public record Trade(String sym, double px, int qty) {
    public Trade {                                  // compact constructor: validate
        if (qty <= 0) throw new IllegalArgumentException("qty");
        sym = sym.toUpperCase();                    // may normalise the parameters
    }                                               // fields are assigned afterwards

    public double notional() { return px * qty; }   // ordinary methods are fine

    public static Trade of(String line) {           // and so are static factories
        String[] p = line.split(",");
        return new Trade(p[0], Double.parseDouble(p[1]), Integer.parseInt(p[2]));
    }
}

var t = new Trade("xau", 2390.5, 10);
System.out.println(t.sym());       // XAU: the accessor is sym(), not getSym()
System.out.println(t);             // Trade[sym=XAU, px=2390.5, qty=10]
System.out.println(t.equals(new Trade("XAU", 2390.5, 10)));   // true` },
        { kind: 'list', items: [
          'From the header, the compiler generates private final fields, a constructor, accessors, `equals`, `hashCode` and `toString`.',
          'Records are implicitly `final` and cannot extend a class, but they can implement interfaces.',
          'You can add methods, static fields and extra constructors, but no extra instance fields: the header is the entire state.',
          'Immutability is **shallow**. A record holding a `List` can still see that list change. Defend with `items = List.copyOf(items);` in the compact constructor.',
          'Use a record for a value identified by its data: a point, a price, a result pair. Use a class when an object has its own identity or changing state: an account, a connection.',
        ] },
        { kind: 'compare',
          python: `from dataclasses import dataclass

@dataclass(frozen=True)
class Trade:
    sym: str
    px: float
    qty: int`,
          cpp: `struct Trade {
    std::string sym;
    double px;
    int qty;
    bool operator==(const Trade&) const = default;
};`,
          go: `type Trade struct {
    Sym string
    Px  float64
    Qty int
}   // == compares comparable fields`,
          ts: `type Trade = Readonly<{
  sym: string
  px: number
  qty: number
}>`,
          java: `public record Trade(String sym, double px, int qty) {}`,
          note: 'A single line replaces roughly forty lines of hand-written class. Use it often.' },
        { kind: 'check', q: 'What is the accessor for field `px` of `record Trade(double px)`?', options: ['`t.getPx()`', '`t.px()`', '`t.px`', '`t.get("px")`'], answer: 1, hint: 'Records drop the `get` prefix.', explain: 'A record generates an accessor with the same name as the component: `px()`. The field itself is private.' },
      ],
    },
    {
      id: 'static-packages',
      title: 'Static members & packages',
      blocks: [
        { kind: 'analogy', text: "Static members belong to the franchise, not to any single shop. Every shop (object) sees the one head-office ledger, and head office can answer the phone even before any shop has opened. A package is the street address that keeps your `Order` from being confused with someone else's `Order`." },
        { kind: 'code', code: `package com.example.pricing;              // must match the folder com/example/pricing

import java.util.List;                    // one class
import java.util.*;                       // every class in java.util (not subpackages)
import static java.lang.Math.max;         // a static member, usable as max(a, b)
import java.sql.Date;                     // when two packages clash, import one...

public class Fees {
    public static final double RATE = 0.001;   // a constant: static + final
    private static int calls;                  // one copy, shared by all

    static {                                   // static init: runs once at class load
        System.out.println("Fees loaded");
    }

    public static double fee(double notional) {
        calls++;
        return max(notional * RATE, 1.0);      // no 'this' exists here
    }

    java.util.Date stamp = new java.util.Date(); // ...and spell the other out in full
}` },
        { kind: 'list', items: [
          'A static method has no `this`, so it can\'t touch instance fields directly. `Math.sqrt` and `List.of` are static.',
          '`java.lang` (`String`, `Math`, `System`, `Integer`…) is imported automatically.',
          'Package names are reversed domains by convention, and the folder layout must mirror them. Compile with `javac -d out com/example/pricing/Fees.java`, and run with `java -cp out com.example.pricing.Fees`.',
          'A **JAR** is a zip of class files plus metadata. The **class path** (`-cp`) tells the JVM where to look for classes.',
          'With no access modifier, a member is visible throughout its package. This is the default on purpose, and it is great for internal helpers.',
        ] },
        { kind: 'new23', text: "**Java 25** adds module imports: `import module java.base;` pulls in every package that module exports, including `java.util` and `java.nio.file`. It's convenient for scripts and teaching. Compact source files get it implicitly. In larger codebases, explicit imports still make dependencies easier to see." },
        { kind: 'pitfall', text: 'Mutable static fields are global variables: hard to test and unsafe across threads without synchronisation. Keep `static` for constants and stateless helpers.' },
        { kind: 'check', q: 'Why can\'t a static method read an instance field directly?', options: ['Instance fields are private', 'It has no `this`: there may be no object at all', 'Static methods run on another thread', 'It can, with no restriction'], answer: 1, hint: 'Which object would the field belong to?', explain: 'A static method runs on the class, without a receiver. To reach instance state, it needs an object passed in or created.' },
      ],
    },
    {
      id: 'nested',
      title: 'Nested classes & documentation',
      blocks: [
        { kind: 'analogy', text: "A static nested class is a tenant who merely rents an address inside the building: related, but independent. An inner class is a room that can't exist without the building, and it can always walk down the hall to reach the building's own things, because it secretly holds a key to it." },
        { kind: 'code', code: `public class Book {
    private final List<Line> lines = new ArrayList<>();

    /** Static nested: no link to any Book instance. This is the one you usually want. */
    public static class Line {
        final String sym;
        Line(String sym) { this.sym = sym; }
    }

    /** Inner: each Cursor holds a hidden reference to its enclosing Book. */
    public class Cursor {
        private int at = 0;
        public Line next() { return lines.get(at++); }   // reaches Book.this.lines
    }

    public Cursor cursor() { return new Cursor(); }
}

var line = new Book.Line("XAU");       // no Book needed
Book book = new Book();
Book.Cursor c = book.new Cursor();     // odd syntax: needs an enclosing object` },
        { kind: 'list', items: [
          'Prefer `static` nested classes. An inner class silently keeps its outer object alive, which is a classic source of memory leaks.',
          'Nested classes can see each other\'s private members, and the enclosing class sees theirs.',
          'Records, enums and interfaces declared inside a class are implicitly static.',
          '`javadoc` turns `/** ... */` comments into HTML. Document the contract: `@param`, `@return`, `@throws`, not the implementation.',
        ] },
        { kind: 'code', code: `/**
 * Returns the fee for a trade.
 *
 * @param notional the trade value; must not be negative
 * @return the fee, never less than {@link #MIN_FEE}
 * @throws IllegalArgumentException if notional is negative
 */
public static double fee(double notional) { return 0; }

public static final double MIN_FEE = 1.0;` },
        { kind: 'new23', text: "**Java 23** lets you write documentation comments in Markdown using `///` on each line: backticks for code, lists and `[Trade#notional()]` links all work. No more `<p>` and `{@code ...}` clutter, and the classic form still works." },
        { kind: 'check', q: 'What does an inner (non-static) class have that a static nested class does not?', options: ['Access to `java.lang`', 'A hidden reference to an instance of its enclosing class', 'The ability to have methods', 'Faster field access'], answer: 1, hint: 'How does `Cursor` reach `lines`?', explain: 'Each inner object holds a reference to its outer object (`Book.this`). That is both its power and its memory-leak risk.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does `Account b = a;` do?', options: ['Clones the account', 'Copies the reference, so both refer to one object', 'Moves the object from `a` to `b`', 'Fails unless `Account` implements `Cloneable`'], answer: 1, explain: 'Object variables hold references. Assignment copies the reference, never the object.' },
    { q: 'When does the compiler add a no-argument constructor?', options: ['Always', 'Only when the class declares no constructors at all', 'When a field has no initialiser', 'Only for public classes'], answer: 1, explain: 'As soon as you declare any constructor, the implicit no-argument one is gone.' },
    { q: 'Which access level is the default when you write no modifier?', options: ['`public`', '`private`', 'Package-private', '`protected`'], answer: 2, explain: 'Package-private members are visible to all classes in the same package.' },
    { q: 'Which is true of records?', options: ['They can extend any class', 'They are implicitly final and generate `equals`, `hashCode` and `toString`', 'Their fields are mutable by default', 'They cannot have methods'], answer: 1, explain: 'A record is a transparent, shallowly immutable carrier for its components.' },
    { q: 'A record has a `List<String>` component. Is it fully immutable?', options: ['Yes, records are deeply immutable', 'No: the reference is final, but the list itself may still change', 'Yes, the compiler copies the list', 'Records cannot hold lists'], answer: 1, explain: 'Copy defensively in the compact constructor: `items = List.copyOf(items);`.' },
    { q: 'What can a static method NOT do directly?', options: ['Call another static method', 'Read a static field', 'Use `this`', 'Create objects'], answer: 2, explain: 'A static method has no receiver object, so `this` does not exist there.' },
    { q: 'Why prefer a static nested class over an inner class?', options: ['It compiles faster', 'It carries no hidden reference to an outer object', 'Inner classes cannot have fields', 'Only static nested classes can be public'], answer: 1, explain: 'The hidden outer reference costs memory and can keep large objects alive unexpectedly.' },
    { q: 'Since Java 25, what may come before `super(...)` in a constructor?', options: ['Nothing', 'Statements that do not use the object under construction, such as argument checks', 'Any code at all, including instance method calls', 'Only comments'], answer: 1, explain: 'Flexible constructor bodies allow validation and assigning this class\'s own fields, but not reading `this`.' },
  ],
}
