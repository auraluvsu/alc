import type { Module } from '../types'

export const r07: Module = {
  n: 7,
  title: 'Generics, Traits and Lifetimes',
  tour: '10 · Generic Types, Traits, and Lifetimes',
  summary: 'Writing code once for many types: generics, traits, trait bounds, `impl Trait`, trait objects, and lifetime annotations.',
  topics: ['Generics', 'Traits & bounds', 'impl Trait & dyn', 'Lifetimes', 'Elision rules'],
  cpp23: [
    '`async fn` and return-position `impl Trait` in traits work without the `async-trait` crate (Rust 1.75).',
    'Trait upcasting: a `&dyn Sub` coerces to `&dyn Super` (Rust 1.86).',
    'Precise capturing `impl Trait + use<\'a, T>` states which generics a returned opaque type captures (Rust 1.82). In the 2024 edition return-position `impl Trait` captures all in-scope lifetimes by default.',
    'Generic associated types (GATs) allow lending iterators and families of types (Rust 1.65). Inferred const arguments `_` work in generic positions (Rust 1.89).',
  ],
  lessons: [
    {
      id: 'generics',
      title: 'Generics',
      blocks: [
        { kind: 'analogy', text: "A generic function is a cookie cutter with an empty slot where the dough goes. You write the shape once, and the compiler stamps out a **separate, specialised cutter for every dough you actually use**. That is why generic code in Rust is as fast as code you wrote by hand for each type: the stamping (monomorphisation) happens at compile time, so there is nothing to look up at run time." },
        { kind: 'code', code: `fn largest<T: PartialOrd>(items: &[T]) -> &T {      // T must support comparison
    let mut best = &items[0];
    for it in items { if it > best { best = it; } }
    best
}
let a = largest(&[3, 9, 2]);              // T = i32
let b = largest(&["x", "z", "y"]);        // T = &str. Two separate compiled copies.

struct Point<T> { x: T, y: T }
impl<T> Point<T> { fn x(&self) -> &T { &self.x } }
impl Point<f64> {                         // only exists for f64
    fn dist0(&self) -> f64 { self.x.hypot(self.y) }
}

enum Maybe<T> { Nothing, Just(T) }        // Option and Result are just generic enums

// Two type parameters, and a where clause for readability
fn pair_up<A, B>(a: A, b: B) -> (A, B) where A: Clone, B: Clone { (a, b) }

// Const generics: a value as a parameter
struct Ring<T, const N: usize> { buf: [Option<T>; N] }
fn sum_all<const N: usize>(a: [i32; N]) -> i32 { a.iter().sum() }
let s = sum_all([1, 2, 3]);               // N = 3 inferred` },
        { kind: 'list', items: [
          '**Monomorphisation**: the compiler generates one version of the function per concrete type used. No runtime cost, no boxing, and full inlining. The price is compile time and binary size when you instantiate many types.',
          'Without a bound, a generic `T` can do almost nothing (you cannot compare, print or copy it). **Bounds** say what a `T` can do: `T: PartialOrd + Copy`.',
          'A `where` clause (`where T: Display, U: Clone + Debug`) is the same as inline bounds, but tidier when there are several.',
          'The compiler usually infers `T` from arguments. When it cannot (as in `"5".parse::<i32>()` or `Vec::<u8>::new()`) you use the **turbofish** `::<T>`.',
          '**Const generics** let you parameterise by a number, such as an array length, so `[f64; 3]` and `[f64; 4]` are separate types and `fn dot<const N: usize>(a: [f64; N], b: [f64; N])` rejects mismatched lengths at compile time.',
          'Generics in structs are separate from generics in methods: `impl<T> Point<T>` declares `T` for the whole block, and a method may add its own `<U>`.',
        ] },
        { kind: 'compare',
          cpp: `template <typename T>
const T& largest(const std::vector<T>& v) { /* ... */ }   // duck-typed: errors appear at instantiation
template <std::totally_ordered T> ...                       // C++20 concepts, opt-in`,
          go: `func Largest[T cmp.Ordered](xs []T) T { ... }   // Go 1.18; GC-shape stenciling, not full monomorphisation`,
          python: `def largest(xs: list[T]) -> T: ...   # TypeVar; checked by mypy only, no runtime effect`,
          java: `static <T extends Comparable<T>> T largest(List<T> xs) { ... }   // erased: one version, boxed values`,
          ts: `function largest<T extends number | string>(xs: T[]): T { ... }   // erased after type-checking`,
          rust: `fn largest<T: PartialOrd>(xs: &[T]) -> &T { ... }   // checked at the definition, stamped per type`,
          note: 'Rust generics are C++ templates with the type checking that concepts add, but **always on**: a generic function is checked once against its bounds and never produces an error at a distant call site.' },
        { kind: 'check', q: 'What does the compiler do with `largest::<i32>` and `largest::<&str>`?', options: ['Boxes both and calls one function', 'Generates a separate specialised version of each', 'Uses a vtable at run time', 'Erases the types'], answer: 1, hint: 'The word is "monomorphisation".', explain: 'Every concrete type gets its own compiled copy, so calls are direct and inlinable with no indirection.' },
      ],
    },
    {
      id: 'traits',
      title: 'Traits and bounds',
      blocks: [
        { kind: 'analogy', text: "A trait is a job description. \"Must be able to `summarise()`\" says nothing about *who* the worker is. Any type may apply by providing the methods (`impl Summary for Tweet`). A function that asks for `T: Summary` is hiring anyone qualified, and is guaranteed that every applicant can do the job. A **default method** is a duty the employer provides by default, which an applicant may override." },
        { kind: 'code', code: `trait Summary {
    fn author(&self) -> String;                          // required
    fn summarise(&self) -> String {                      // default, may be overridden
        format!("(read more from {}...)", self.author())
    }
}

struct Tweet { user: String, text: String }
struct Article { title: String, by: String }

impl Summary for Tweet {
    fn author(&self) -> String { format!("@{}", self.user) }
}
impl Summary for Article {
    fn author(&self) -> String { self.by.clone() }
    fn summarise(&self) -> String { format!("{} by {}", self.title, self.by) }   // override
}

fn notify(item: &impl Summary) { println!("{}", item.summarise()); }    // sugar for a generic
fn notify2<T: Summary>(item: &T) { println!("{}", item.summarise()); }  // same, with a name

fn both<T>(a: &T) -> String where T: Summary + std::fmt::Debug { format!("{a:?} {}", a.summarise()) }

// Associated types and constants
trait Shape { const SIDES: u32; type Unit; fn area(&self) -> f64; }

// Supertrait: Pretty requires Display
trait Pretty: std::fmt::Display { fn pretty(&self) -> String { format!("<<{self}>>") } }

// Blanket implementation: every type that is Display gets Pretty
impl<T: std::fmt::Display> Pretty for T {}` },
        { kind: 'list', items: [
          '**Orphan rule**: you may implement a trait for a type only if your crate defines the trait **or** the type. You cannot implement `Display` for `Vec<T>`. The workaround is a newtype: `struct Wrapper(Vec<String>); impl Display for Wrapper`.',
          'Traits are **not inherited**. A type either has an `impl` or it does not. Reuse comes from default methods, supertraits and blanket impls, not from base classes (module 13).',
          'Trait methods must be **in scope** to call: `use std::io::Write;` is needed to call `.write_all`. Method-resolution errors like "no method named write_all" are usually a missing `use`.',
          '**Associated types** (`type Item;` in `Iterator`) are chosen by the implementor, so there is exactly one per type. **Generic parameters** (`trait From<T>`) can have many impls for one type. Use an associated type when the relationship is one-to-one.',
          'The standard traits you will implement most: `Debug`, `Display`, `Clone`, `Copy`, `PartialEq`, `Eq`, `PartialOrd`, `Ord`, `Hash`, `Default`, `From`/`Into`, `Iterator`, `Drop`, `Deref`, `Add` and friends (operator overloading), `AsRef`, `FromStr`.',
          '**Derive** generates the obvious implementation: `#[derive(Debug, Clone, PartialEq, Eq, Hash, PartialOrd, Ord, Default)]`.',
          '**Blanket impls** make `x.to_string()` work for anything with `Display`, because the standard library wrote `impl<T: Display> ToString for T`.',
        ] },
        { kind: 'code', code: `// Operator overloading is just traits
use std::ops::{Add, Mul};
#[derive(Debug, Clone, Copy, PartialEq)]
struct V2 { x: f64, y: f64 }
impl Add for V2 { type Output = V2; fn add(self, o: V2) -> V2 { V2 { x: self.x + o.x, y: self.y + o.y } } }
impl Mul<f64> for V2 { type Output = V2; fn mul(self, k: f64) -> V2 { V2 { x: self.x * k, y: self.y * k } } }
let v = V2 { x: 1.0, y: 2.0 } + V2 { x: 0.5, y: 0.5 } * 2.0;` },
        { kind: 'compare',
          cpp: `template <typename T> concept Summary = requires(T t) { t.author(); };   // structural: no declaration needed
struct Tweet { std::string author() const; };   // matches the concept just by having the method`,
          go: `type Summary interface { Author() string }     // implemented implicitly by any type with the method`,
          python: `class Summary(Protocol):                        # structural, checked by tools only
    def author(self) -> str: ...`,
          java: `interface Summary { String author(); default String summarise() { ... } }
class Tweet implements Summary { ... }`,
          ts: `interface Summary { author(): string }          // structural typing`,
          rust: `trait Summary { fn author(&self) -> String; }
impl Summary for Tweet { fn author(&self) -> String { ... } }   // explicit, and can be added from outside`,
          note: 'Rust is nominal like Java, yet you can add an `impl` for your trait to **any** type you can name, including `i32` and types from other crates. Java interfaces cannot be retrofitted like that.' },
        { kind: 'pitfall', text: 'Calling a trait method fails with "no method named `x` found" when the trait is not imported. The error often helpfully suggests `use some::Trait;`. This commonly bites with `std::io::{Read, Write, BufRead}` and `std::fmt::Write`.' },
        { kind: 'check', q: 'Which is allowed by the orphan rule?', options: ['`impl Display for Vec<i32>` in your crate', '`impl MyTrait for Vec<i32>` in your crate', '`impl Iterator for String` in your crate', 'None of these'], answer: 1, hint: 'Your crate must own the trait or the type.', explain: '`MyTrait` is yours, so you may implement it for any type. `Display` and `Vec` are both foreign, so that combination is forbidden.' },
      ],
    },
    {
      id: 'dispatch',
      title: 'impl Trait and dyn Trait',
      blocks: [
        { kind: 'analogy', text: "**Static dispatch** is booking a specific plumber by name: fast and exact, but you must know who it is when you write the schedule. **Dynamic dispatch** is calling a dispatcher who looks at the job and picks from the van fleet at the last minute: a little slower (one extra lookup), but one list can hold many kinds of plumber. `impl Trait` says \"some one plumber, I won't say which\", and `dyn Trait` says \"any plumber from the fleet\"." },
        { kind: 'code', code: `// Static: impl Trait in argument and return position
fn describe(x: &impl Summary) -> String { x.summarise() }
fn evens(limit: u32) -> impl Iterator<Item = u32> { (0..limit).filter(|n| n % 2 == 0) }   // an unnameable type

// Dynamic: a trait object. A fat pointer holds (data ptr, vtable ptr).
fn feed(items: &[Box<dyn Summary>]) {
    for it in items { println!("{}", it.summarise()); }      // vtable lookup per call
}
let items: Vec<Box<dyn Summary>> = vec![
    Box::new(Tweet { user: "a".into(), text: "hi".into() }),
    Box::new(Article { title: "T".into(), by: "B".into() }),     // different types, one Vec
];

fn by_ref(x: &dyn Summary) {}                                // borrowed trait object, no allocation

// Returning different types needs a trait object (or an enum)
fn make(kind: &str) -> Box<dyn Summary> {
    if kind == "tweet" { Box::new(Tweet { user: "a".into(), text: "".into() }) }
    else { Box::new(Article { title: "T".into(), by: "B".into() }) }
}` },
        { kind: 'list', items: [
          '**`impl Trait`** (static): the concrete type is known to the compiler, so calls inline. In return position it hides the type, which is how closures and iterator chains are returned without naming them. The function must return **one** concrete type.',
          '**`dyn Trait`** (dynamic): a fat pointer with a vtable. It allows heterogeneous collections and runtime-chosen behaviour, at the price of an indirect call and no inlining. Always behind a pointer: `&dyn T`, `Box<dyn T>`, `Rc<dyn T>`.',
          'A trait is **dyn-compatible** (previously "object-safe") if its methods can be called through a vtable: no `Self` in return position, no generic methods without `where Self: Sized`, and a receiver like `&self`. `Clone` is not dyn-compatible, since `fn clone(&self) -> Self` returns `Self`.',
          '**Which to pick?** Default to generics or `impl Trait`. Reach for `dyn` for plugin-like sets of types, a heterogeneous `Vec`, to cut compile time and code size, or recursive structures. For a **closed** set of variants, an `enum` is often faster and clearer than `Box<dyn Trait>`.',
          '`Box<dyn Fn(i32) -> i32>` stores a closure of unknown type. `impl Fn(i32) -> i32` accepts or returns one without boxing (module 9).',
          '`dyn Any` and `downcast_ref` let you recover a concrete type when you must, though it is usually a sign to use an enum.',
        ] },
        { kind: 'new23', text: 'Trait upcasting (Rust 1.86) lets you hand a `dyn Sub` to something that wants `dyn Super`. Before this you needed a manual `as_super` method. And `async fn` in traits (1.75) works directly, although such traits are not dyn-compatible without help:' },
        { kind: 'code', code: `trait Animal { fn name(&self) -> String; }
trait Dog: Animal { fn fetch(&self); }

fn greet(a: &dyn Animal) { println!("{}", a.name()); }
fn play(d: &dyn Dog) {
    d.fetch();
    greet(d);                 // upcast: &dyn Dog -> &dyn Animal (Rust 1.86)
}

trait Feed { async fn latest(&self, sym: &str) -> f64; }     // Rust 1.75: no async-trait crate
fn evens_up_to(n: u32) -> impl Iterator<Item = u32> + use<> { (0..n).filter(|x| x % 2 == 0) }   // captures nothing` },
        { kind: 'compare',
          cpp: `struct Shape { virtual double area() const = 0; virtual ~Shape() = default; };   // always dynamic
template <typename S> double area(const S& s) { return s.area(); }                  // static via templates`,
          go: `var s Shape = Circle{}      // interfaces are always dynamic (itab); generics for static`,
          python: `def area(s: Shape) -> float: return s.area()   # always dynamic dispatch`,
          java: `Shape s = new Circle();   // always dynamic (JIT may devirtualise)`,
          ts: `const s: Shape = new Circle()   // always dynamic`,
          rust: `fn area(s: &impl Shape) -> f64 { s.area() }     // static: monomorphised
fn area_dyn(s: &dyn Shape) -> f64 { s.area() }      // dynamic: vtable`,
          note: 'Rust makes you choose per use-site. Most languages give you only dynamic dispatch and hope the optimiser removes it.' },
        { kind: 'check', q: 'You need a `Vec` that holds both `Circle` and `Square` values. Which fits best?', options: ['`Vec<impl Shape>`', '`Vec<Box<dyn Shape>>` or an enum of the shapes', '`Vec<Shape>`', '`Vec<T>` where `T: Shape`'], answer: 1, hint: 'All elements of a Vec have one concrete type.', explain: '`impl Shape` and `T` are each one concrete type. Heterogeneous contents need a trait object, or an enum for a closed set.' },
      ],
    },
    {
      id: 'lifetimes',
      title: 'Lifetimes',
      blocks: [
        { kind: 'analogy', text: "A lifetime is the **due date** stamped in a library book. When a function hands you a reference, the compiler asks: *whose book is this, and when is it due back?* Lifetime annotations (`'a`) do not change how long anything lives. They are labels that let the signature say \"the answer is borrowed from this argument, so it is only valid as long as that book stays out\"." },
        { kind: 'code', code: `// The returned reference lives no longer than the shorter of the two inputs
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() >= y.len() { x } else { y }
}

fn first<'a, 'b>(x: &'a str, _y: &'b str) -> &'a str { x }   // only tied to x

let outer = String::from("long string");
let result;
{
    let inner = String::from("xyz");
    result = longest(outer.as_str(), inner.as_str());
    println!("{result}");             // fine: inner is still alive
}
// println!("{result}");             // error: \`inner\` does not live long enough` },
        { kind: 'stepper', title: 'Why the compiler wants a lifetime', code: [
          'let a = String::from("long");',
          'let r;',
          '{ let b = String::from("xy");',
          '  r = longest(&a, &b); }',
          'println!("{r}");',
        ], steps: [
          { line: 1, note: '`a` lives until the end of the function.', memory: [{ name: 'a', value: '"long"', kind: 'heap' }] },
          { line: 2, note: '`r` is declared but not yet assigned.', memory: [{ name: 'a', value: '"long"', kind: 'heap' }, { name: 'r', value: '(unset)' }] },
          { line: 3, note: '`b` lives only inside the inner block.', memory: [{ name: 'a', value: '"long"', kind: 'heap' }, { name: 'b', value: '"xy"', kind: 'heap' }, { name: 'r', value: '(unset)' }] },
          { line: 4, note: '`longest` ties its result to **both** inputs (`\'a`). So `r` is only valid while both `a` and `b` are. The block ends and `b` is dropped.', memory: [{ name: 'a', value: '"long"', kind: 'heap' }, { name: 'b', value: 'dropped', kind: 'dead' }, { name: 'r', value: '&a or &b ?', kind: 'ref' }] },
          { line: 5, note: '`r` might point at the dropped `b`. The compiler rejects this line: "`b` does not live long enough". The lifetime annotation made the risk visible.', memory: [{ name: 'r', value: 'would dangle', kind: 'dead' }] },
        ] },
        { kind: 'code', code: `// A struct that borrows must say so
struct Parser<'a> { input: &'a str, pos: usize }

impl<'a> Parser<'a> {
    fn new(input: &'a str) -> Self { Parser { input, pos: 0 } }
    fn next_word(&mut self) -> Option<&'a str> {         // result borrowed from the input, not from self
        let rest = &self.input[self.pos..];
        let word = rest.split_whitespace().next()?;
        self.pos += rest.find(word)? + word.len();
        Some(word)
    }
}

let text = String::from("alpha beta");
let mut p = Parser::new(&text);
let w = p.next_word();                  // w can outlive p, but not text

// 'static: valid for the whole program (string literals, leaked or owned-by-static data)
let s: &'static str = "always valid";
fn spawnable<T: Send + 'static>(t: T) {}   // T owns its data: contains no short-lived borrows` },
        { kind: 'list', items: [
          'Lifetimes appear **only when references are involved**: in function signatures that return a reference and in structs/enums that hold one. Inside a function body the compiler infers everything.',
          '`<\'a>` declares a lifetime *parameter*, like a type parameter. `&\'a T` says "a reference valid for at least `\'a`". The signature `fn f<\'a>(x: &\'a str) -> &\'a str` states that the output is borrowed from the input.',
          'An annotation **never extends** a lifetime. It documents the relationship so the compiler can verify callers and the body.',
          '`\'static` means "can live for the entire program". String literals are `&\'static str`. `T: \'static` does **not** mean the value lives forever, only that it holds no non-static borrows, so `String` is `\'static`.',
          'A struct holding a reference cannot outlive it: `Parser<\'a>` is tied to its input. If the lifetime parameters spread through your code, consider owning the data (`String`, `Vec`) or using indices instead of references.',
          'Returning a reference to a local variable is the classic mistake. The fix is to return the **owned** value (`String`) rather than a reference.',
        ] },
        { kind: 'pitfall', text: 'When lifetime errors multiply, resist adding `\'a` everywhere until it compiles. Ask first: should this struct own its data? Often `String` instead of `&str` in a struct field removes the whole class of problems at the cost of one allocation.' },
        { kind: 'check', q: 'What does `fn longest<\'a>(x: &\'a str, y: &\'a str) -> &\'a str` promise?', options: ['The result lives forever', 'The result is valid only as long as both inputs are', 'The result is a copy', 'The inputs are mutable'], answer: 1, hint: 'Same label on all three references.', explain: 'The single `\'a` ties the result to the overlap of both inputs, so the compiler rejects uses after either one is gone.' },
        { kind: 'check', q: 'Does `T: \'static` mean the value lives forever?', options: ['Yes', 'No: it means the type contains no borrowed data with a shorter lifetime', 'Only for `&str`', 'Only in async code'], answer: 1, hint: '`String` satisfies it.', explain: 'An owned `String` can be dropped at any time yet is `\'static`, because nothing it holds can dangle. `thread::spawn` needs this bound.' },
      ],
    },
    {
      id: 'elision',
      title: 'Lifetime elision and bounds',
      blocks: [
        { kind: 'analogy', text: "Most library books are borrowed in the obvious way, so the librarian does not stamp the due date every time: if there is only one book in the bag, the answer must come from that book. These shortcuts are the **elision rules**. You only write `'a` when the answer is genuinely ambiguous." },
        { kind: 'code', code: `// You write                                  // The compiler reads
fn first_word(s: &str) -> &str                 // fn first_word<'a>(s: &'a str) -> &'a str
fn pick(s: &str, n: usize) -> &str             // one reference input: output uses its lifetime
impl Parser<'_> { fn pos(&self) -> usize }      // '_ : an anonymous, elided lifetime

fn name(&self) -> &str                          // methods: the output gets self's lifetime
fn pair(a: &str, b: &str) -> &str               // error: two inputs, which one? Annotate it.

// Lifetime bounds
struct Ref<'a, T: 'a> { r: &'a T }              // T must outlive 'a (inferred since 2018)
fn print_all<T>(items: &[T]) where T: std::fmt::Debug + 'static {}

// Higher-ranked bound: works for any lifetime the callee chooses
fn apply<F>(f: F) where F: for<'x> Fn(&'x str) -> &'x str {}   // what Fn(&str) -> &str means` },
        { kind: 'list', items: [
          '**Rule 1**: each reference parameter gets its own lifetime. **Rule 2**: if there is exactly one input lifetime, it is given to all outputs. **Rule 3**: if one parameter is `&self` or `&mut self`, its lifetime is given to all outputs.',
          'If an output lifetime is not determined after those rules, you must write it. That is the "missing lifetime specifier" error (E0106).',
          '`\'_` is the placeholder for an elided lifetime in a type: `Parser<\'_>`, `Ref<\'_, T>`. It signals "there is a borrow here" without naming it. The `elided_lifetimes_in_paths` lint encourages it.',
          'Multiple lifetimes in a signature (`<\'a, \'b>`) are needed when outputs depend on only some inputs. Keep it simple. If your signature needs many, the design may want owned values.',
          'In the 2024 edition, `impl Trait` in return position captures **all** in-scope lifetimes by default, matching async functions. Use `use<..>` to capture less.',
          'Common trait-bound combinations in practice: `T: Send + \'static` for spawning threads, `T: Clone + Debug`, `F: Fn(A) -> B + Sync`, and `T: AsRef<str>` for flexible string arguments.',
        ] },
        { kind: 'code', code: `// Flexible function arguments
fn shout<S: AsRef<str>>(s: S) -> String { s.as_ref().to_uppercase() }
shout("a"); shout(String::from("b"));       // both work

fn add_all<I>(it: I) -> i32 where I: IntoIterator<Item = i32> { it.into_iter().sum() }
add_all(vec![1, 2]); add_all([3, 4]); add_all(1..=3);

fn log(msg: impl Into<String>) { let owned: String = msg.into(); println!("{owned}"); }` },
        { kind: 'compare',
          cpp: `const std::string& first(const std::string& s);   // may dangle: nothing checks it
std::string_view pick(std::string_view s);        // the caller's responsibility`,
          go: `func first(s string) string   // the GC keeps anything referenced alive: no lifetimes at all`,
          python: `def first(s: str) -> str: ...   # the garbage collector keeps it alive`,
          java: `String first(String s)          // the garbage collector keeps it alive`,
          ts: `function first(s: string): string   // the garbage collector keeps it alive`,
          rust: `fn first(s: &str) -> &str      // the compiler verifies the return cannot dangle`,
          note: 'Lifetimes are the price of memory safety without a garbage collector. Elision means you pay it only where the relationship is truly ambiguous.' },
        { kind: 'check', q: 'Why does `fn pick(a: &str, b: &str) -> &str` not compile?', options: ['`&str` cannot be returned', 'Two input lifetimes and no `self`: elision cannot choose the output lifetime', 'Strings are immutable', 'It needs `mut`'], answer: 1, hint: 'Count the input references.', explain: 'Rule 2 needs exactly one input lifetime and rule 3 needs a `self` receiver. With two inputs, you must name the relationship: `fn pick<\'a>(a: &\'a str, b: &str) -> &\'a str`.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is monomorphisation?', options: ['Boxing generic values', 'Generating a specialised copy of generic code for each concrete type used', 'Erasing type parameters at runtime', 'Converting traits to enums'], answer: 1, explain: 'It is why generic Rust code has no runtime overhead: every call is to concrete, inlinable code.' },
    { q: 'What does `T: PartialOrd + Copy` mean?', options: ['`T` is any type', '`T` must be comparable and copyable', '`T` is an enum', '`T` is a reference'], answer: 1, explain: 'Bounds list the capabilities a type parameter must have.' },
    { q: 'You want to implement `Display` for `Vec<String>` in your crate. What stops you and what is the workaround?', options: ['Nothing stops you', 'The orphan rule; wrap it in a newtype', 'Display is private', 'Vec is not generic'], answer: 1, explain: 'Both the trait and the type are foreign. A local newtype struct can implement a foreign trait.' },
    { q: 'Which is dynamic dispatch?', options: ['`fn f(x: &impl Shape)`', '`fn f<T: Shape>(x: &T)`', '`fn f(x: &dyn Shape)`', '`fn f(x: Circle)`'], answer: 2, explain: '`dyn Shape` is a trait object: a pointer plus a vtable, resolved at run time.' },
    { q: 'Why is `Clone` not dyn-compatible?', options: ['It is too common', '`fn clone(&self) -> Self` returns `Self`, whose size is unknown behind a vtable', 'It needs a lifetime', 'It is unsafe'], answer: 1, explain: 'A trait object does not know its concrete type, so methods returning `Self` cannot be called through it.' },
    { q: 'What does a lifetime annotation do?', options: ['Extends how long a value lives', 'Describes the relationship between references so the compiler can check it', 'Allocates memory', 'Makes a reference mutable'], answer: 1, explain: 'Annotations never change lifetimes. They describe which borrows a result depends on.' },
    { q: 'What is the type of a string literal?', options: ['`String`', '`&\'static str`', '`&mut str`', '`Box<str>`'], answer: 1, explain: 'Literals live in the program\'s read-only data for the whole run.' },
    { q: 'When can you omit lifetime annotations on a function?', options: ['Never', 'When the elision rules determine the output lifetimes unambiguously', 'Only in `main`', 'Only for `&mut` references'], answer: 1, explain: 'One input lifetime, or a `&self` receiver, lets the compiler infer the output.' },
    { q: 'A function returns different concrete types depending on a runtime flag. What must its return type be?', options: ['`impl Trait`', 'A trait object such as `Box<dyn Trait>` (or an enum)', 'A generic `T`', 'It cannot be done'], answer: 1, explain: '`impl Trait` stands for one hidden concrete type. Different types need dynamic dispatch or an enum.' },
    { q: 'Which statement about trait upcasting (Rust 1.86) is true?', options: ['`&dyn Sub` can be used where `&dyn Super` is expected', 'Traits can inherit state', 'It removes the orphan rule', 'It makes all traits dyn-compatible'], answer: 0, explain: 'A trait object of a subtrait coerces to its supertrait object.' },
  ],
}
