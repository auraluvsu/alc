import type { Module } from '../types'

export const j01: Module = {
  n: 1,
  title: 'Fundamental Programming Structures',
  tour: '1 · Fundamental Programming Structures',
  summary: 'The first lap: how Java source becomes running bytecode, primitive types and arithmetic, strings, input and output, control flow, arrays, array lists and methods.',
  topics: ['javac, java & the JVM', 'Primitive types & variables', 'Arithmetic & strings', 'Input, output & control flow', 'Arrays & ArrayList', 'Methods'],
  cpp23: [
    'Compact source files and instance main methods: `void main() { IO.println("hi"); }` is a complete program (Java 25).',
    'The `java.lang.IO` class gives beginners `IO.println` and `IO.readln` with no imports (Java 25).',
    '`java Main.java` can launch programs spread over several source files without running `javac` first (Java 22).',
    'G1 is now the default garbage collector in every environment, and compact object headers are on by default (Java 27).',
  ],
  lessons: [
    {
      id: 'first',
      title: 'Your first program & the JVM',
      blocks: [
        { kind: 'analogy', text: "A Java program ships in a universal language, the way a travelling musician carries sheet music rather than a recording. `javac` writes the sheet music (bytecode). Each machine has its own orchestra (the JVM) that reads it, and the orchestra gets better as it plays: it notices the hot passages and rewrites them into native code while the program runs." },
        { kind: 'code', code: `// HelloWorld.java: the file name must match the public class
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, world");
    }
}`, caption: 'Compile with `javac HelloWorld.java` (producing `HelloWorld.class`), then run with `java HelloWorld`. Note: no `.class` on the second command.' },
        { kind: 'list', items: [
          '`public class HelloWorld`: all classic Java code lives inside a class. A public class must sit in a file with the same name.',
          '`static`: `main` belongs to the class itself, so the JVM can call it before any object exists.',
          '`System.out.println`: `System` is a class, `out` is a static field holding a `PrintStream`, and `println` is a method on that object.',
          'Bytecode (`.class` files) runs on any JVM. The JVM first interprets it, then its JIT compiler turns frequently run methods into optimised machine code.',
          '`jshell` is a built-in REPL for trying snippets, and `java HelloWorld.java` compiles in memory and runs in a single step.',
        ] },
        { kind: 'p', text: "The garbage collector reclaims objects nothing refers to any more, so you never free memory. The JVM also checks bytecode as it loads, checks every array index and null dereference at runtime, and throws an exception rather than corrupting memory." },
        { kind: 'new23', text: "The book's first program is the classic class. Since **Java 25**, a file can be just `void main() { IO.println(\"Hello, world\"); }`. The compiler wraps it in an implicit final class, and the file automatically sees everything exported by `java.base`. This is for scripts and for learning: real libraries still use named classes in packages. The JVM's defaults also moved on: **G1** is the default collector everywhere (Java 27), and compact object headers are on by default, shrinking most objects." },
        { kind: 'code', code: `// Hello.java: a complete Java 25+ program. Run it with: java Hello.java
void main() {
    var name = IO.readln("Your name? ");
    IO.println("Hello, " + name);
}` },
        { kind: 'compare',
          python: `print("Hello, world")`,
          cpp: `#include <print>
int main() {
    std::println("Hello, world");
}`,
          go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, world")
}`,
          ts: `console.log("Hello, world")`,
          java: `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, world");
    }
}`,
          note: 'The ceremony pays for itself later: every piece (class, `static`, the argument array) is the same mechanism you will use everywhere else.' },
        { kind: 'pitfall', text: 'Unlike C++, `args[0]` is the first real argument, not the program name. And `java HelloWorld.class` fails: the `java` command takes a class name, or a source file ending in `.java`.' },
        { kind: 'check', q: 'What does `javac` produce?', options: ['A native executable for your machine', 'Bytecode in a `.class` file that a JVM runs', 'A JavaScript bundle', 'A running process'], answer: 1, hint: 'Think about what lets one compiled file run on Linux and on macOS.', explain: '`javac` compiles to JVM bytecode. The JVM interprets and JIT-compiles that bytecode at runtime.' },
      ],
    },
    {
      id: 'primitives',
      title: 'Primitive types & variables',
      blocks: [
        { kind: 'analogy', text: "Java has two kinds of variable, like the difference between a coin in your hand and a coat-check ticket. A primitive holds the value itself: the coin. Any other variable holds a reference: a ticket that points at the coat (the object) stored elsewhere. Copying a coin gives you another coin. Copying a ticket gives you two tickets for one coat." },
        { kind: 'code', code: `int count = 42;                 // 32 bits, the everyday integer
long big = 3_000_000_000L;      // 64 bits; the L is required past int range
byte b = 127;                   // 8 bits, signed
short s = 30_000;               // 16 bits, signed
double px = 2390.5;             // 64-bit floating point, the default
float f = 1.5F;                 // 32 bits; the F is required
char c = 'J';                   // one UTF-16 code unit, 16 bits unsigned
boolean ok = true;              // only true or false, never an int

var trades = 10;                // type inferred (int); still statically typed
final int MAX = 100;            // cannot be reassigned` },
        { kind: 'list', items: [
          'Sizes are **fixed by the language** on every platform. `int` is always 32 bits, and all integer types except `char` are signed. Java has no `unsigned` keyword.',
          'Local variables must be assigned before use, or the program will not compile. Fields get defaults instead: `0`, `false` or `null`.',
          'Conversion is automatic only when widening (`int` to `long`, `int` to `double`). Narrowing needs a cast: `int n = (int) 3.9;` gives `3`.',
          '`var` works for local variables with an initialiser. It is inference, not dynamic typing: the type is fixed at compile time.',
          '`final` means the variable cannot be reassigned. On a reference it does **not** freeze the object it points at.',
          'Naming convention: `camelCase` for variables and methods, `PascalCase` for classes, `UPPER_SNAKE` for constants.',
        ] },
        { kind: 'code', code: `Integer boxed = 42;             // the object wrapper around int (autoboxing)
int plain = boxed;              // unboxing happens automatically
Integer missing = null;         // wrappers can be null; primitives cannot
int crash = missing;            // NullPointerException at runtime` },
        { kind: 'pitfall', text: 'Every primitive has a wrapper class (`Integer`, `Double`, `Boolean`…), and collections can only store objects. Autoboxing hides the conversion, but it is not free: it can allocate, and unboxing `null` throws. Never compare wrappers with `==` (next lesson).' },
        { kind: 'check', q: 'Which line does NOT compile?', options: ['`long a = 5;`', '`double b = 5;`', '`int c = 5.0;`', '`float d = 5;`'], answer: 2, hint: 'Which conversion could lose information?', explain: '`double` to `int` narrows and needs a cast. The others are all widening conversions from `int`.' },
      ],
    },
    {
      id: 'arith-strings',
      title: 'Arithmetic & strings',
      blocks: [
        { kind: 'analogy', text: "A Java `String` is a printed page: you can read it, photocopy it or cut pieces out to make a new page, but never change the ink. `s.toUpperCase()` hands you a new page and leaves the original untouched. That is what makes strings safe to share everywhere." },
        { kind: 'code', code: `System.out.println(7 / 2);          // 3: int division truncates
System.out.println(7 / 2.0);        // 3.5
System.out.println(-7 / 2);         // -3: truncates toward zero
System.out.println(-7 % 3);         // -1: the sign follows the dividend
System.out.println(Math.floorMod(-7, 3));  // 2
System.out.println(Integer.MAX_VALUE + 1); // -2147483648: overflow wraps silently
System.out.println(Math.addExact(1, 2));   // 3; throws ArithmeticException on overflow
System.out.println(0.1 + 0.2);      // 0.30000000000000004
System.out.println(1.0 / 0);        // Infinity
// System.out.println(1 / 0);       // throws ArithmeticException` },
        { kind: 'p', text: 'For money, floating point rounding is a bug, so use `java.math.BigDecimal`. Create it from a string, as in `new BigDecimal("0.1")`, because `new BigDecimal(0.1)` faithfully captures the binary error of the double.' },
        { kind: 'code', code: `String sym = "XAU";
String line = sym + " x " + 10;           // + converts other operands to String
int n = line.length();                    // 8: UTF-16 code units
String head = line.substring(0, 3);       // "XAU": start inclusive, end exclusive
boolean same = sym.equals("XAU");         // compare contents with equals
boolean ci = sym.equalsIgnoreCase("xau");
String[] parts = "a,b,c".split(",");
String joined = String.join("-", parts);  // "a-b-c"
String clean = "  hi  ".strip();          // "hi"
String msg = "%s at %.2f".formatted(sym, 2390.5);

StringBuilder sb = new StringBuilder();   // mutable: use it for building in loops
for (int i = 0; i < 3; i++) sb.append(i).append(' ');
String built = sb.toString();             // "0 1 2 "

String json = """
    {
      "sym": "XAU",
      "qty": 10
    }
    """;                                  // text block: indentation is stripped` },
        { kind: 'pitfall', text: "On objects, `==` **compares references, not contents**. `new String(\"a\") == \"a\"` is `false`. Two identical string literals do share one object, so `==` can appear to work in small tests and then fail on strings built at runtime. Always use `equals`. The same trap applies to wrappers: `Integer` values from -128 to 127 are cached, so `==` happens to work for small numbers and then fails at 1000." },
        { kind: 'code', code: `String a = "hello";
String b = "hel" + "lo";            // compile-time constant, same object
String c = new StringBuilder("hello").toString();
System.out.println(a == b);         // true
System.out.println(a == c);         // false: a different object
System.out.println(a.equals(c));    // true

Integer x = 127, y = 127, p = 1000, q = 1000;
System.out.println(x == y);         // true: from the small-value cache
System.out.println(p == q);         // false: two separate objects` },
        { kind: 'check', q: 'What does this print?', code: `String s = "java";
s.toUpperCase();
System.out.println(s);`, options: ['`JAVA`', '`java`', 'A compile error', '`null`'], answer: 1, hint: 'Can a String change after it is created?', explain: 'Strings are immutable. `toUpperCase` returns a new string, and this code discards it. You would write `s = s.toUpperCase();`.' },
      ],
    },
    {
      id: 'control',
      title: 'Input, output & control flow',
      blocks: [
        { kind: 'analogy', text: "Old `switch` is a staircase with no landings: enter at one step and you keep falling through the steps below unless you remember to `break`. Modern `switch` with arrows is a row of separate doors. You go through exactly one, and the whole thing can hand you back a value." },
        { kind: 'code', code: `import java.util.Scanner;

public class Tally {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int sum = 0;
        while (in.hasNextInt()) {             // stops at a non-number or end of input
            sum += in.nextInt();
        }
        System.out.printf("Sum: %d%n", sum);  // %n is the platform's line ending
    }
}` },
        { kind: 'code', code: `int score = 72;

if (score >= 70) System.out.println("pass");
else System.out.println("fail");

for (int i = 0; i < 3; i++) { }           // classic counting loop
int[] xs = {1, 2, 3};
for (int x : xs) { }                      // enhanced for: arrays and any Iterable
do { score--; } while (score > 60);       // the body runs at least once

outer:                                    // labels let break leave nested loops
for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        if (i * j == 2) break outer;
    }
}

String day = "SAT";
int hours = switch (day) {                // a switch expression yields a value
    case "SAT", "SUN" -> 0;
    case "FRI" -> { int base = 8; yield base - 2; }   // yield from a block
    default -> 8;
};` },
        { kind: 'list', items: [
          '`if` conditions must be `boolean`. `if (count)` does not compile, which eliminates a whole family of C bugs.',
          '`&&` and `||` short-circuit. `&` and `|` on booleans evaluate both sides.',
          'A switch expression must be **exhaustive**: every possible value handled, usually with `default`. Arrow cases never fall through.',
          '`System.out.printf` verbs: `%d` integer, `%s` string, `%.2f` fixed decimals, `%,d` thousands separators, `%n` newline.',
        ] },
        { kind: 'pitfall', text: 'With the older colon form, `case 1:` falls through into the next case unless you write `break`. Prefer the arrow form in new code: it cannot fall through.' },
        { kind: 'check', q: 'What is `hours` when `day` is `"SUN"`?', code: `int hours = switch (day) {
    case "SAT", "SUN" -> 0;
    default -> 8;
};`, options: ['`0`', '`8`', 'It falls through to `8`', 'A compile error: there is no `break`'], answer: 0, hint: 'Do arrow cases fall through?', explain: 'Arrow cases run exactly one branch and never fall through, so the result is `0`.' },
      ],
    },
    {
      id: 'arrays',
      title: 'Arrays & array lists',
      blocks: [
        { kind: 'analogy', text: "An array is a row of numbered lockers bolted to the floor: the count is fixed the day it is installed. `ArrayList` is the same row run by a manager who, when it fills up, moves everything to a bigger row and tells you nothing about it. You almost always want the manager." },
        { kind: 'code', code: `int[] primes = {2, 3, 5, 7};
int[] zeros = new int[4];                // all elements start at 0
String[] names = new String[2];          // both start as null
primes[0] = 1;
int len = primes.length;                 // a field, no parentheses

int[] alias = primes;                    // same array, two references
int[] copy = Arrays.copyOf(primes, primes.length);   // a real copy
Arrays.sort(copy);
System.out.println(Arrays.toString(copy));   // [1, 3, 5, 7]

int[][] grid = new int[3][4];            // really an array of arrays
grid[1][2] = 9;` },
        { kind: 'code', code: `import java.util.ArrayList;
import java.util.List;

ArrayList<String> syms = new ArrayList<>();   // <> infers String
syms.add("XAU");
syms.add("EUR");
syms.set(0, "XAG");
String first = syms.get(0);                   // no [] on lists
int size = syms.size();                       // a method here, not a field
syms.remove("EUR");

ArrayList<Integer> nums = new ArrayList<>();  // not ArrayList<int>
nums.add(5);                                  // autoboxed to Integer

List<String> fixed = List.of("a", "b");       // an unmodifiable list` },
        { kind: 'list', items: [
          'Length is spelled three ways: `arr.length` (field), `str.length()` (method), `list.size()` (method). Everyone mixes them up at first.',
          'Indexing out of range throws `ArrayIndexOutOfBoundsException` or `IndexOutOfBoundsException`. It never reads stray memory.',
          'Printing an array directly shows something like `[I@1b6d3586`. Use `Arrays.toString`, or `Arrays.deepToString` for nested arrays.',
          'Reach for arrays when you want primitives packed tightly or a fixed size. Use `ArrayList` otherwise. A `double[]` stores numbers directly, while an `ArrayList<Double>` stores references to boxed objects.',
        ] },
        { kind: 'pitfall', text: '`list.remove(1)` on an `ArrayList<Integer>` removes the element at **index** 1, because the `int` overload wins. To remove the value 1, write `list.remove(Integer.valueOf(1))`.' },
        { kind: 'check', q: 'After this code, what is `a[0]`?', code: `int[] a = {1, 2};
int[] b = a;
b[0] = 9;`, options: ['`1`', '`9`', '`0`', 'A compile error'], answer: 1, hint: 'Did the second line create a new array?', explain: 'Array variables hold references. `b = a` copies the reference, so both names point at the same array.' },
      ],
    },
    {
      id: 'methods',
      title: 'Methods',
      blocks: [
        { kind: 'analogy', text: "Calling a Java method hands it photocopies of your slips of paper. If the slip says `5`, changing the copy changes nothing for you. If the slip is a coat-check ticket, the method can't swap your ticket, but it can walk to the coat room and sew a patch on your coat." },
        { kind: 'code', code: `public class Stats {
    public static double average(double... values) {   // varargs: really a double[]
        double sum = 0;
        for (double v : values) sum += v;
        return values.length == 0 ? 0 : sum / values.length;
    }

    static void reassign(int[] xs) { xs = new int[] {9}; }  // only the copy changes
    static void mutate(int[] xs)   { xs[0] = 9; }           // the caller sees this

    static int max(int a, int b) { return a > b ? a : b; }  // overloads: same name,
    static double max(double a, double b) { return a > b ? a : b; } // different parameters

    public static void main(String[] args) {
        System.out.println(average(1, 2, 3));   // 2.0
        int[] data = {1};
        reassign(data);
        System.out.println(data[0]);            // 1
        mutate(data);
        System.out.println(data[0]);            // 9
    }
}` },
        { kind: 'list', items: [
          '**Java is always pass-by-value.** For objects, the value being copied is the reference. A method can change the object, but it can never make your variable point somewhere else.',
          'Overloading picks a method at compile time from the argument types. Return type alone cannot distinguish overloads.',
          'There are no default parameter values and no named arguments. Overloads or a builder object fill that gap (module 13).',
          'Methods can only return one value. Return a `record` (module 2) when you need several.',
        ] },
        { kind: 'compare',
          python: `def average(*values):
    return sum(values) / len(values) if values else 0`,
          cpp: `double average(std::span<const double> v) {
    if (v.empty()) return 0;
    return std::accumulate(v.begin(), v.end(), 0.0) / v.size();
}`,
          go: `func average(values ...float64) float64 {
    if len(values) == 0 { return 0 }
    sum := 0.0
    for _, v := range values { sum += v }
    return sum / float64(len(values))
}`,
          ts: `const average = (...values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0`,
          java: `static double average(double... values) {
    double sum = 0;
    for (double v : values) sum += v;
    return values.length == 0 ? 0 : sum / values.length;
}`,
          note: 'Varargs must be the last parameter, and the compiler packs the arguments into an array for you.' },
        { kind: 'check', q: 'After `swap(x, y)`, do the caller\'s `x` and `y` point at swapped strings?', code: `static void swap(String a, String b) {
    String t = a; a = b; b = t;
}`, options: ['Yes, objects are passed by reference', 'No: only the method\'s copies of the references were swapped', 'Yes, but only for strings', 'It does not compile'], answer: 1, hint: 'What exactly gets copied when a method is called?', explain: 'Java copies references by value. Reassigning a parameter only changes the local copy, so a swap method like this cannot work.' },
      ],
    },
  ],
  quiz: [
    { q: 'What runs a `.class` file?', options: ['The operating system directly', 'The JVM', '`javac`', 'A C++ runtime'], answer: 1, explain: 'The JVM loads and verifies bytecode, interprets it, and JIT-compiles the hot parts.' },
    { q: 'How do you compare the contents of two strings?', options: ['`a == b`', '`a.equals(b)`', '`a = b`', '`a.same(b)`'], answer: 1, explain: '`==` compares references. `equals` compares characters.' },
    { q: 'What does `7 / 2` evaluate to?', options: ['`3.5`', '`3`', '`4`', 'A compile error'], answer: 1, explain: 'Both operands are `int`, so the division truncates. Use `7 / 2.0` for `3.5`.' },
    { q: 'What happens with `Integer.MAX_VALUE + 1`?', options: ['It throws an exception', 'It wraps around to a negative number', 'It widens to `long`', 'It does not compile'], answer: 1, explain: 'Integer arithmetic wraps silently. `Math.addExact` throws on overflow if you want that.' },
    { q: 'Which correctly gets the size of `ArrayList<String> xs`?', options: ['`xs.length`', '`xs.length()`', '`xs.size()`', '`xs.count`'], answer: 2, explain: 'Lists use `size()`, strings use `length()`, and arrays use the `length` field.' },
    { q: 'Why is `ArrayList<int>` illegal?', options: ['`int` is too small', 'Type arguments must be reference types, so you use `Integer`', 'Only arrays may hold numbers', 'It is legal'], answer: 1, explain: 'Generics work only with reference types. Autoboxing converts between `int` and `Integer`.' },
    { q: 'How does Java pass arguments?', options: ['Primitives by value, objects by reference', 'Always by value, and object arguments are copied references', 'Always by reference', 'It depends on `final`'], answer: 1, explain: 'A method can mutate the object through its copy of the reference, but cannot rebind the caller\'s variable.' },
    { q: 'What does `final List<String> xs` guarantee?', options: ['The list\'s contents can never change', '`xs` can never be reassigned to another list', 'The list is thread-safe', 'The list is a constant known at compile time'], answer: 1, explain: '`final` applies to the variable. The object it refers to can still be mutated unless it is itself immutable.' },
  ],
}
