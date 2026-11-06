import type { Module } from '../types'

export const j11: Module = {
  n: 11,
  title: 'Annotations',
  tour: '11 · Annotations',
  summary: 'Metadata on code: how to use annotations, how to define your own, the ones in the Java API, how to read them at runtime through reflection, and how to process them at compile time.',
  topics: ['Using annotations', 'Defining annotations', 'Annotations in the API', 'Runtime processing', 'Source-level processing'],
  cpp23: [
    'Since Java 23, `javac` no longer runs annotation processors it merely finds on the class path. Name them explicitly, or pass `-proc:full`.',
    'The Class-File API (Java 24) offers a standard alternative for tools that generate or inspect bytecode.',
  ],
  lessons: [
    {
      id: 'using',
      title: 'Using annotations',
      blocks: [
        { kind: 'analogy', text: "Annotations are sticky labels on code. They don't change what the code does: a \"fragile\" label doesn't make a parcel fragile. They only matter when someone reads them: the compiler, a test runner, a framework. A label nobody reads does nothing." },
        { kind: 'code', code: `public class OrderTest {
    @Test                                      // a marker: no elements
    void rejectsZeroQty() { }

    @Test(timeout = 1000)                      // a named element
    void isFast() { }

    @SuppressWarnings("unchecked")             // the single element called "value"
    List<String> raw() { return (List<String>) (Object) new ArrayList<>(); }

    @Author(name = "Nas", year = 2026)         // several elements
    @Author(name = "Sam", year = 2025)         // repeating, if the type allows it
    void shared() { }
}

// They can go in many places:
@Entity public class Trade { }                         // a class
@Inject private PriceFeed feed;                        // a field
void save(@NonNull String id) { }                      // a parameter

// Type annotations (Java 8+): on a use of a type
List<@NonNull String> names = new ArrayList<>();
String @NonNull [] arr = new String[0];                // a non-null array of strings` },
        { kind: 'list', items: [
          'Element values must be compile-time constants, class literals, enums, other annotations, or arrays of these.',
          'If the only element is named `value`, you can omit the name: `@SuppressWarnings("unused")`.',
          'A single-item array needs no braces: `@SuppressWarnings({"a", "b"})` or `@SuppressWarnings("a")`.',
          'Testing frameworks (JUnit), web frameworks (Spring) and persistence (JPA) drive almost all their configuration from annotations.',
        ] },
        { kind: 'compare',
          python: `@dataclass              # a decorator RUNS, and can change the class
class Trade:
    sym: str`,
          cpp: `[[nodiscard]] int f();  // attributes hint to the compiler
[[deprecated("use g")]] void old();`,
          go: `type Trade struct {
    Sym string \`json:"sym"\`  // struct tags: strings read through reflection
}`,
          ts: `@Injectable()           // decorators run when the class is defined
class Service {}`,
          java: `@Entity                 // pure metadata: it does nothing by itself
public record Trade(@Id String sym) {}`,
          note: 'A key difference from Python decorators: a Java annotation does not wrap or run anything. Some tool has to read it.' },
        { kind: 'check', q: 'What does an annotation do by itself at runtime?', options: ['Wraps the method', 'Nothing: it is metadata until a tool or library reads it', 'Runs before the method', 'Generates a subclass'], answer: 1, hint: 'Compare this with a Python decorator.', explain: 'An annotation is data attached to a declaration. The compiler, a framework or your own reflection gives it meaning.' },
      ],
    },
    {
      id: 'defining',
      title: 'Defining annotations',
      blocks: [
        { kind: 'analogy', text: "Defining an annotation is printing a new kind of label. Meta-annotations are the instructions printed on the roll: which things it may stick to, and how long it stays on (just while drafting, into the shipped box, or still visible once it's in use)." },
        { kind: 'code', code: `import java.lang.annotation.*;

@Target({ElementType.METHOD, ElementType.TYPE})    // where it may appear
@Retention(RetentionPolicy.RUNTIME)                // how long it is kept
@Documented                                        // show it in javadoc
public @interface Audited {
    String value() default "general";              // elements look like methods
    int level() default 1;
    Class<? extends Exception>[] ignore() default {};
}

@Audited                                 // all defaults
class A { }

@Audited("payments")                     // value = "payments"
class B { }

@Audited(value = "payments", level = 3, ignore = IllegalStateException.class)
class C { }

// Repeatable requires a container annotation
@Repeatable(Tags.class)
@Retention(RetentionPolicy.RUNTIME)
@interface Tag { String value(); }

@Retention(RetentionPolicy.RUNTIME)
@interface Tags { Tag[] value(); }

@Tag("fast") @Tag("smoke")
class Check { }` },
        { kind: 'list', items: [
          '`@interface` declares an annotation type. Each element is written as a method with no parameters, with an optional `default`.',
          'Elements can\'t be `null`. Use an empty string or a sentinel to mean "not set".',
          'Retention: `SOURCE` (dropped by the compiler), `CLASS` (the default: kept in the class file, not visible at runtime), `RUNTIME` (visible through reflection).',
          '`@Inherited` makes a class annotation visible on subclasses. It doesn\'t apply to methods or interfaces.',
        ] },
        { kind: 'pitfall', text: 'The most common reason an annotation "doesn\'t work" with reflection: you left off `@Retention(RetentionPolicy.RUNTIME)`. The default retention is `CLASS`, and `getAnnotation` returns `null`.' },
        { kind: 'check', q: 'Which retention lets you read an annotation with reflection?', options: ['`SOURCE`', '`CLASS`', '`RUNTIME`', 'All of them'], answer: 2, hint: 'Which one is still there when the program runs?', explain: '`SOURCE` is discarded by the compiler, and `CLASS` is not loaded by the VM into the reflection API.' },
      ],
    },
    {
      id: 'api',
      title: 'Annotations in the Java API',
      blocks: [
        { kind: 'analogy', text: "These are the standard labels the compiler itself reads, the equivalent of \"this way up\" on a shipping box. Most are short instructions that catch mistakes at compile time rather than letting them reach you in production." },
        { kind: 'code', code: `class Base {
    @Deprecated(since = "21", forRemoval = true)     // warns everyone who uses it
    public void oldApi() { }
    public void run() { }
}

class Sub extends Base {
    @Override public void run() { }                  // the compiler checks that this overrides
    // @Override public void runn() { }              // compile error: catches the typo
}

@FunctionalInterface                                  // must have one abstract method
interface Rule { boolean allows(double px); }

class Lists {
    @SafeVarargs                                      // promises no heap pollution
    static <T> List<T> listOf(T... xs) { return List.of(xs); }

    @SuppressWarnings("deprecation")                  // on the smallest scope possible
    void useOld(Base b) { b.oldApi(); }
}` },
        { kind: 'list', items: [
          '`@Override`: catches mistyped names or wrong parameter types.',
          '`@Deprecated`: `since` and `forRemoval` say how urgent it is. `javac -Xlint:deprecation` shows the details.',
          '`@FunctionalInterface`: guards a lambda-friendly interface against someone adding a second method.',
          '`@SafeVarargs`: on `final`, `static` or `private` methods with generic varargs.',
          '`@SuppressWarnings`: common values are `"unchecked"`, `"deprecation"` and `"removal"`.',
          'Meta-annotations: `@Target`, `@Retention`, `@Documented`, `@Inherited`, `@Repeatable`.',
        ] },
        { kind: 'pitfall', text: 'Without `@Override`, a slip like `public boolean equals(Money other)` silently creates an **overload**, and `HashSet` keeps calling the original `equals(Object)`. Writing `@Override` turns that into a compile error.' },
        { kind: 'check', q: 'What does `@Override` protect you from?', options: ['Slow method calls', 'A method that you believed overrides something but does not', 'Null pointers', 'Concurrency bugs'], answer: 1, hint: 'What if you misspell the method name?', explain: 'The compiler checks that a matching method exists in a supertype, and reports an error otherwise.' },
      ],
    },
    {
      id: 'runtime',
      title: 'Processing annotations at runtime',
      blocks: [
        { kind: 'analogy', text: "This is what a framework actually does. It walks along the shelves with a torch (reflection), reads each label, and acts on it. Writing a tiny test runner makes frameworks seem much less magical, because the core of JUnit is exactly this loop." },
        { kind: 'code', code: `import java.lang.annotation.*;
import java.lang.reflect.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@interface Check {
    Class<? extends Throwable> expect() default None.class;
    class None extends Throwable { }
}

class OrderChecks {
    @Check void acceptsLot() { }

    @Check(expect = IllegalArgumentException.class)
    void rejectsZero() { throw new IllegalArgumentException("qty"); }

    void helper() { }                         // not annotated: skipped
}

class MiniRunner {
    public static void main(String[] args) throws Exception {
        var instance = new OrderChecks();
        for (Method m : OrderChecks.class.getDeclaredMethods()) {
            Check c = m.getAnnotation(Check.class);
            if (c == null) continue;
            m.setAccessible(true);
            try {
                m.invoke(instance);
                System.out.println((c.expect() == Check.None.class ? "PASS " : "FAIL ") + m.getName());
            } catch (InvocationTargetException e) {
                boolean ok = c.expect().isInstance(e.getCause());
                System.out.println((ok ? "PASS " : "FAIL ") + m.getName());
            }
        }
    }
}` },
        { kind: 'list', items: [
          '`isAnnotationPresent(T.class)` is a yes/no test, and `getAnnotation(T.class)` returns the annotation or `null`.',
          'An annotation you read back is an object implementing the annotation interface: call `c.expect()` to get an element.',
          '`getAnnotationsByType(T.class)` understands repeating annotations, looking through the container.',
          '`invoke` wraps exceptions from the called method in `InvocationTargetException`. Call `getCause()` for the original.',
          'Reflection is the usual approach, but scanning classes at startup takes time. That\'s why many modern frameworks moved this work to compile time.',
        ] },
        { kind: 'check', q: 'What does `m.getAnnotation(Check.class)` return if the method has no `@Check`?', options: ['An empty annotation', '`null`', 'Throws an exception', 'A default `Check`'], answer: 1, hint: 'See how the loop handles it.', explain: 'It returns `null`, so test for that, or use `isAnnotationPresent` first.' },
      ],
    },
    {
      id: 'source',
      title: 'Source-level processing',
      blocks: [
        { kind: 'analogy', text: "An annotation processor is a helper who reads the labels **while the factory is being built**, and writes new blueprints to add to the set. It can't alter the ones that exist, only add new ones. It's how a single `@Builder` label ends up as a whole new `OrderBuilder` class." },
        { kind: 'code', code: `import javax.annotation.processing.*;
import javax.lang.model.SourceVersion;
import javax.lang.model.element.*;
import java.util.Set;

@SupportedAnnotationTypes("com.example.GenerateBuilder")
@SupportedSourceVersion(SourceVersion.RELEASE_21)
public class BuilderProcessor extends AbstractProcessor {
    @Override
    public boolean process(Set<? extends TypeElement> annos, RoundEnvironment env) {
        for (TypeElement anno : annos) {
            for (Element e : env.getElementsAnnotatedWith(anno)) {
                processingEnv.getMessager().printMessage(
                    javax.tools.Diagnostic.Kind.NOTE, "Found " + e.getSimpleName());
                // Filer: write a new source file, and it joins the compilation
                // processingEnv.getFiler().createSourceFile("...");
            }
        }
        return true;
    }
}`, caption: 'Run with `javac -processor com.example.BuilderProcessor -processorpath proc.jar Order.java`. Generated files are compiled in a further round.' },
        { kind: 'list', items: [
          'Processors run inside `javac`, in rounds, until no new files are generated.',
          'They work on a model of the source (`Element`, `TypeMirror`), not on loaded classes.',
          'They can report errors at a particular line, which makes them effective for custom checks.',
          'Real examples: **MapStruct** (mappers), **Dagger** (dependency injection), **Immutables**. Lombok is a special case, as it modifies the compiler\'s internal tree rather than just adding files.',
          'Compile-time generation means no reflection cost at startup, and problems show up in the build rather than in production.',
        ] },
        { kind: 'new23', text: "Implicit annotation processing was a hidden way for a dependency on the class path to run code in your compiler. Recent JDKs moved away from this: from **Java 23** onwards, you pass `-proc:full`, or name the processors or their path, to opt in. If an older build's generated classes vanish after an upgrade, look here first." },
        { kind: 'check', q: 'What can a standard annotation processor do?', options: ['Change the source of existing classes', 'Generate new source files and report compile errors', 'Run after the program starts', 'Modify running objects'], answer: 1, hint: 'It may add, but not alter.', explain: 'The official API only allows new files and diagnostics. It cannot rewrite the classes being compiled.' },
      ],
    },
  ],
  quiz: [
    { q: 'What keyword declares an annotation type?', options: ['`annotation`', '`@interface`', '`@class`', '`interface @`'], answer: 1, explain: 'Elements are declared like no-argument methods.' },
    { q: 'What is the default retention policy?', options: ['`SOURCE`', '`CLASS`', '`RUNTIME`', 'There is none'], answer: 1, explain: 'It is kept in the class file, but not available through reflection.' },
    { q: 'Which meta-annotation limits where an annotation may be used?', options: ['`@Retention`', '`@Target`', '`@Documented`', '`@Repeatable`'], answer: 1, explain: '`@Target` lists the allowed `ElementType`s.' },
    { q: 'Which is NOT allowed as an annotation element value?', options: ['A string constant', 'A class literal', '`null`', 'An enum constant'], answer: 2, explain: 'Element values cannot be `null`. Use a sentinel.' },
    { q: 'What do you need to use `@Tag` twice on one class?', options: ['Nothing', '`@Repeatable` and a container annotation', '`@Inherited`', 'A subclass'], answer: 1, explain: 'The compiler wraps the repeats in the container type.' },
    { q: 'What is the benefit of `@FunctionalInterface`?', options: ['It makes lambdas faster', 'The compiler reports an error if the interface stops having one abstract method', 'It adds a default method', 'It is required for all lambdas'], answer: 1, explain: 'It is optional, but protects the interface\'s intended use.' },
    { q: 'When does an annotation processor run?', options: ['At class load', 'During compilation', 'When a method runs', 'At JVM shutdown'], answer: 1, explain: 'It runs in `javac`, in rounds, and can add generated sources.' },
    { q: 'When a reflected method throws, what do you catch from `invoke`?', options: ['The original exception directly', '`InvocationTargetException`, whose cause is the original', '`ClassCastException`', 'Nothing is thrown'], answer: 1, explain: 'Call `getCause()` on it to get the exception thrown by the target method.' },
  ],
}
