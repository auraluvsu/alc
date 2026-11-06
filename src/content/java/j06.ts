import type { Module } from '../types'

export const j06: Module = {
  n: 6,
  title: 'Generic Programming',
  tour: '6 · Generic Programming',
  summary: 'Generic classes and methods, bounds, the rules behind wildcards, how erasure implements all this on the JVM, the restrictions that follow, and generics under reflection.',
  topics: ['Generic classes & methods', 'Type bounds', 'Variance & wildcards', 'Erasure', 'Restrictions', 'Reflection & generics'],
  cpp23: [
    'Project Valhalla\'s value classes and specialised generics are still in development, so `List<int>` remains illegal in Java 27.',
    'Unnamed variables and patterns (Java 22) tidy generic-heavy code, as in `case Box<String>(var _) ->`.',
  ],
  lessons: [
    {
      id: 'classes-methods',
      title: 'Generic classes & methods',
      blocks: [
        { kind: 'analogy', text: "A generic class is a storage box with a label holder. `Box<String>` has the label \"strings only\": the compiler checks each item going in and knows what's coming out, so nobody has to open the box and guess. Before generics, every box was just \"stuff\", and you found out you were wrong only when you tried to use it." },
        { kind: 'code', code: `public class Pair<A, B> {                      // A and B are type parameters
    private final A first;
    private final B second;

    public Pair(A first, B second) { this.first = first; this.second = second; }
    public A first() { return first; }
    public B second() { return second; }
    public Pair<B, A> swap() { return new Pair<>(second, first); }
}

var p = new Pair<>("XAU", 2390.5);             // infers Pair<String, Double>
String sym = p.first();                        // no cast needed
double px = p.second();                        // unboxed

public record Box<T>(T value) {}               // records can be generic too

public class Arrays2 {
    // A generic method declares its parameter before the return type
    public static <T> void swap(T[] xs, int i, int j) {
        T tmp = xs[i];
        xs[i] = xs[j];
        xs[j] = tmp;
    }

    public static <T> List<T> twice(T x) { return List.of(x, x); }
}

String[] names = {"a", "b"};
Arrays2.swap(names, 0, 1);                     // T inferred as String
var strs = Arrays2.<String>twice("x");         // an explicit type argument (rarely needed)` },
        { kind: 'list', items: [
          'Conventional names: `T` type, `E` element, `K`/`V` key and value, `R` result.',
          'Before generics (Java 5), `List` held `Object`, and each read needed a cast that might fail at runtime. Generics move that failure to compile time.',
          'The `<>` diamond infers type arguments from context. Leaving it off (`new ArrayList()`) creates a **raw type**, which disables checking. Never write raw types in new code.',
        ] },
        { kind: 'check', q: 'What is the difference between these two?', code: `List<String> a = new ArrayList<>();
List<String> b = new ArrayList();`, options: ['No difference', '`b` uses a raw type: it compiles with a warning, and the type checks are lost on that expression', '`a` does not compile', '`b` is faster'], answer: 1, hint: 'What does leaving off `<>` turn off?', explain: 'A raw `ArrayList` exists only for compatibility with pre-generics code. Always write the diamond.' },
      ],
    },
    {
      id: 'bounds',
      title: 'Type bounds',
      blocks: [
        { kind: 'analogy', text: "A plain type parameter can be anything, so you can't do much with it: a box labelled \"something\" can only be stored and passed on. A bound is a job requirement: \"must hold a forklift licence\". Now you know every applicant can drive a forklift, so you're allowed to ask them to." },
        { kind: 'code', code: `// T must be Comparable to itself, so compareTo is available
public static <T extends Comparable<T>> T max(List<T> xs) {
    T best = xs.getFirst();
    for (T x : xs) {
        if (x.compareTo(best) > 0) best = x;
    }
    return best;
}

// Several bounds: at most one class, listed first, then interfaces
public static <T extends Number & Comparable<T>> double spread(T a, T b) {
    return a.compareTo(b) > 0
        ? a.doubleValue() - b.doubleValue()
        : b.doubleValue() - a.doubleValue();
}

// A bound on a class
public class NumericColumn<N extends Number> {
    private final List<N> values = new ArrayList<>();
    public void add(N n) { values.add(n); }
    public double sum() {
        double s = 0;
        for (N n : values) s += n.doubleValue();   // the bound permits this
        return s;
    }
}` },
        { kind: 'p', text: 'The keyword is always `extends` here, whether the bound is a class or an interface. `T extends Comparable<T>` reads as "T can be compared with other T values".' },
        { kind: 'compare',
          python: `from typing import Protocol

class Comparable(Protocol):
    def __lt__(self, other, /) -> bool: ...

def largest[T: Comparable](xs: list[T]) -> T:
    return max(xs)`,
          cpp: `template <std::totally_ordered T>
T largest(const std::vector<T>& xs) {
    return *std::ranges::max_element(xs);
}`,
          go: `func Largest[T cmp.Ordered](xs []T) T {
    return slices.Max(xs)
}`,
          ts: `function largest<T extends { compareTo(o: T): number }>(xs: T[]): T {
  return xs.reduce((a, b) => a.compareTo(b) > 0 ? a : b)
}`,
          java: `public static <T extends Comparable<T>> T max(List<T> xs) {
    T best = xs.getFirst();
    for (T x : xs) if (x.compareTo(best) > 0) best = x;
    return best;
}`,
          note: 'C++ stamps out one copy of the code per type. Java compiles one version that works on references, which matters next.' },
        { kind: 'check', q: 'Why can `max` call `x.compareTo(best)`?', options: ['Every object has `compareTo`', 'The bound `T extends Comparable<T>` guarantees it', 'Generics allow any method call', 'It is checked only at runtime'], answer: 1, hint: 'Without the bound, what would the compiler know about `T`?', explain: 'An unbounded `T` is only known to be an `Object`. The bound supplies the methods you may call.' },
      ],
    },
    {
      id: 'variance',
      title: 'Variance & wildcards',
      blocks: [
        { kind: 'analogy', text: "A bag of apples is not a bag of fruit. If it were, someone holding the \"bag of fruit\" could drop in a banana, and now the apple-only bag has a banana in it. But you can safely read fruit from a bag of apples, and you can safely add apples to a bag of fruit. Wildcards let you say which of these you are doing." },
        { kind: 'code', code: `List<Integer> ints = new ArrayList<>(List.of(1, 2));
// List<Number> nums = ints;       // compile error: generics are invariant

// PRODUCER: reads T out. Accepts List<Integer>, List<Double>, ...
public static double sum(List<? extends Number> xs) {
    double total = 0;
    for (Number n : xs) total += n.doubleValue();    // reading as Number is safe
    // xs.add(1);                                    // compile error: which list is it?
    return total;
}

// CONSUMER: writes T in. Accepts List<Integer>, List<Number>, List<Object>
public static void fill(List<? super Integer> out) {
    out.add(42);                                     // adding an Integer is safe
    Object o = out.get(0);                           // reads only give Object
}

// UNBOUNDED: the element type doesn't matter
public static int count(List<?> xs) { return xs.size(); }

// All together, as in the real signature of Collections.copy
public static <T> void copy(List<? super T> dest, List<? extends T> src) {
    for (T x : src) dest.add(x);
}` },
        { kind: 'list', items: [
          '**PECS: Producer Extends, Consumer Super.** If a parameter gives you values, use `? extends T`. If it accepts values, use `? super T`.',
          'Generics are **invariant**: `List<Integer>` is not a `List<Number>`, even though `Integer` is a `Number`.',
          'Wildcards belong in method parameters. Avoid them in return types, since they push the awkwardness on to every caller.',
          'Library example: `Collections.sort(List<T>)` requires `T extends Comparable<? super T>`, so a class can use a comparison inherited from its superclass.',
        ] },
        { kind: 'pitfall', text: 'Arrays are the opposite: they are **covariant**, so `Object[] a = new String[1];` compiles. Then `a[0] = 1;` compiles too, and throws `ArrayStoreException` at runtime. That design flaw is exactly what invariant generics avoid.' },
        { kind: 'code', code: `Object[] objs = new String[1];     // compiles: arrays are covariant
objs[0] = 1;                       // ArrayStoreException at runtime

// List<Object> list = new ArrayList<String>();   // refused at compile time` },
        { kind: 'check', q: 'Which signature should a method have if it only reads numbers from a list?', options: ['`void f(List<Number> xs)`', '`void f(List<? extends Number> xs)`', '`void f(List<? super Number> xs)`', '`void f(List xs)`'], answer: 1, hint: 'Producer Extends, Consumer Super.', explain: 'The list produces values for you, so `? extends`. It then accepts a `List<Integer>` or `List<Double>` as well.' },
      ],
    },
    {
      id: 'erasure',
      title: 'Generics in the JVM',
      blocks: [
        { kind: 'analogy', text: "Generics are a security guard who checks everyone at the door and then goes home. The compiler checks all type labels and then removes them before the program runs. Inside the building (at runtime), a `List<String>` and a `List<Integer>` are the same plain `List`." },
        { kind: 'code', code: `// You write:
public class Box<T extends Comparable<T>> {
    private T value;
    public T get() { return value; }
}
String s = new Box<String>().get();

// After erasure, the JVM effectively sees:
//   class Box { private Comparable value; public Comparable get() {...} }
//   String s = (String) new Box().get();   // the compiler inserts the cast

List<String> a = new ArrayList<>();
List<Integer> b = new ArrayList<>();
System.out.println(a.getClass() == b.getClass());   // true: one ArrayList class` },
        { kind: 'list', items: [
          '**Erasure** replaces each type parameter with its first bound, or `Object` if it has none.',
          'The compiler adds casts where needed. The JVM runs one shared copy of the code.',
          'It was chosen so that generic code would interoperate with the older libraries that were already compiled, when generics arrived in Java 5.',
          'The compiler generates **bridge methods** to preserve overriding after erasure. They show up in stack traces and reflection output.',
          'The cost of this design: `List<int>` isn\'t possible, so primitives get boxed. `IntStream` and `int[]` exist to avoid that cost.',
        ] },
        { kind: 'compare',
          cpp: `// One instantiation per type: vector<int> and vector<string>
// are entirely separate classes, and int values sit directly in the array.
std::vector<int> v{1, 2, 3};`,
          go: `// Instantiated by the compiler (with some sharing by "GC shape").
// []int stores its ints directly, with no boxing.
xs := []int{1, 2, 3}`,
          python: `# Type hints are not enforced at runtime at all.
xs: list[int] = ["surprise"]   # runs fine; a checker would flag it`,
          ts: `// Types vanish at compile time, as in Java,
// but TypeScript inserts no runtime casts.
const xs: number[] = [1, 2, 3]`,
          java: `// One class, with elements as Object references: each int gets boxed.
List<Integer> xs = List.of(1, 2, 3);`,
          note: 'Java sits between C++ (full specialisation) and TypeScript (types vanish, no checks). The inserted casts catch mismatches at runtime.' },
        { kind: 'check', q: 'What does `new ArrayList<String>().getClass() == new ArrayList<Integer>().getClass()` give?', options: ['`true`', '`false`', 'A compile error', 'A `ClassCastException`'], answer: 0, hint: 'Do type arguments exist at runtime?', explain: 'Erasure means there is a single runtime class, `ArrayList`. The type argument is not part of it.' },
      ],
    },
    {
      id: 'restrictions',
      title: 'Restrictions on generics',
      blocks: [
        { kind: 'analogy', text: "Since the labels are gone at runtime, you can't ask any question at runtime that needs to read a label. Every restriction here is a form of the same rule: at runtime, nobody knows what `T` is." },
        { kind: 'code', code: `public class Stack<T> {
    // new T();                          // illegal: which constructor?
    // new T[10];                        // illegal: array of what?
    // static T shared;                  // illegal: one static, many Ts
    // obj instanceof T                  // illegal: T is unknown at runtime
    // obj instanceof List<String>       // illegal unless safely provable

    private final List<T> items = new ArrayList<>();   // the normal answer: use a list

    // Supply what's missing with a lambda or a Class token
    public static <T> List<T> fill(int n, Supplier<T> make) {
        var out = new ArrayList<T>();
        for (int i = 0; i < n; i++) out.add(make.get());
        return out;
    }

    public static <T> T[] toArray(List<T> xs, IntFunction<T[]> mk) {
        return xs.toArray(mk.apply(xs.size()));
    }
}

List<StringBuilder> sbs = Stack.fill(3, StringBuilder::new);
String[] arr = Stack.toArray(List.of("a"), String[]::new);` },
        { kind: 'list', items: [
          'No primitive type arguments: use `List<Integer>`, or a primitive array or stream.',
          'No `new T()` or `new T[n]`. Pass a `Supplier<T>` or an `IntFunction<T[]>`.',
          'No generic exception classes: `catch` happens at runtime, when the type argument is unknown.',
          'You can\'t have overloads that differ only in type arguments: `f(List<String>)` and `f(List<Integer>)` both erase to `f(List)`.',
          '`@SuppressWarnings("unchecked")` silences a warning about a cast the compiler can\'t verify. Use it on the smallest possible scope, and only when you can prove the code is safe.',
        ] },
        { kind: 'pitfall', text: 'A varargs generic method such as `List.of(T...)` creates an array of an erased type internally. That is why you see "unchecked generic array creation" warnings, and why library methods carry `@SafeVarargs`.' },
        { kind: 'check', q: 'Why is `new T()` illegal?', options: ['`T` might be abstract, and more fundamentally, its class is unknown at runtime', 'Only `new T[]` is allowed', '`new` cannot appear in generic classes', 'It is legal'], answer: 0, hint: 'What does erasure replace `T` with?', explain: 'At runtime `T` is erased to its bound, so the JVM has no idea which class to construct. Pass a `Supplier<T>` instead.' },
      ],
    },
    {
      id: 'reflect-generics',
      title: 'Reflection & generics',
      blocks: [
        { kind: 'analogy', text: "Erasure removes labels from objects, but declarations are different. It's like a form that says \"this field holds a list of strings\": the printed form still says so, even though the filing cabinet behind it doesn't care. Reflection can read the form." },
        { kind: 'code', code: `public class Repo {
    public List<String> names;
    public Map<String, Integer> counts() { return Map.of(); }
}

var field = Repo.class.getField("names");
System.out.println(field.getGenericType());
// java.util.List<java.lang.String>: the declaration keeps it

var method = Repo.class.getMethod("counts");
if (method.getGenericReturnType() instanceof ParameterizedType pt) {
    for (Type arg : pt.getActualTypeArguments()) {
        System.out.println(arg);      // class java.lang.String, class java.lang.Integer
    }
}

// A Class<T> token brings the type back at runtime
public static <T> T as(Object o, Class<T> type) {
    return type.cast(o);              // a checked cast
}
String s = as("text", String.class);` },
        { kind: 'list', items: [
          'Fields, method signatures, and class headers keep their generic signatures in the class file. Individual objects do not.',
          'JSON libraries use this: from the `List<Order>` in a field declaration, they know to build `Order` objects.',
          'A **type token** (`Class<T>`) is the standard way to pass a type to generic code at runtime.',
          'Libraries also use anonymous subclasses, as in `new TypeReference<List<Order>>() {}`, since a class records the generic type it extends.',
        ] },
        { kind: 'check', q: 'Which of these does survive erasure and can be read through reflection?', options: ['The type argument of a local `List<String>` object', 'The generic type in a field\'s declaration', 'Nothing generic at all', 'The element type stored inside each `ArrayList` object'], answer: 1, hint: 'Declarations, not objects.', explain: 'Signatures in class files keep generic information, available through `getGenericType()`. The objects themselves carry none.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does `<>` in `new ArrayList<>()` do?', options: ['Creates a raw type', 'Infers the type arguments from context', 'Means any type', 'Allows primitives'], answer: 1, explain: 'It\'s called the diamond. It avoids repeating the type arguments while keeping full checking.' },
    { q: 'Is `List<Integer>` a subtype of `List<Number>`?', options: ['Yes', 'No: generics are invariant', 'Only with a cast', 'Only for records'], answer: 1, explain: 'If it were, you could add a `Double` to a list of `Integer`. Use `List<? extends Number>` to read.' },
    { q: 'What does PECS stand for?', options: ['Public Extends, Class Super', 'Producer Extends, Consumer Super', 'Primitive Elements, Class Storage', 'Parameter Erasure, Cast Safety'], answer: 1, explain: 'Use `extends` for sources you read from and `super` for destinations you write to.' },
    { q: 'What can you add to a `List<? extends Number>`?', options: ['Any `Number`', 'Only `null`, as the actual element type is unknown', 'Any `Integer`', 'Any `Object`'], answer: 1, explain: 'It may really be a `List<Double>`, so the compiler can\'t allow an `Integer` in.' },
    { q: 'What does erasure replace an unbounded `T` with?', options: ['`Object`', '`void`', '`T`', 'The first type argument used'], answer: 0, explain: 'A bounded type parameter is replaced with its first bound instead.' },
    { q: 'Why is `List<int>` illegal?', options: ['`int` is too small', 'Type arguments must be references, because erased code works in terms of object references', 'It is legal in Java 27', 'Lists cannot hold numbers'], answer: 1, explain: 'Use `List<Integer>`, or `int[]` and `IntStream` to avoid boxing.' },
    { q: 'Why can\'t these both exist in one class: `void f(List<String>)` and `void f(List<Integer>)`?', options: ['Overloading is not allowed', 'They have the same erasure, `f(List)`', 'The names are too short', 'They can'], answer: 1, explain: 'After erasure the two signatures clash, so the compiler rejects them.' },
    { q: 'Which is a safe way to create instances of `T` in a generic method?', options: ['`new T()`', 'Accept a `Supplier<T>` and call `get()`', '`T.class.newInstance()`', 'Cast `new Object()`'], answer: 1, explain: 'The caller knows the actual type, and passes `Foo::new`.' },
  ],
}
