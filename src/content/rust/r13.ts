import type { Module } from '../types'

export const r13: Module = {
  n: 13,
  title: 'Object-Oriented Design in Rust',
  tour: '18 · Object-Oriented Programming Features',
  summary: 'What Rust takes from object orientation and leaves behind: encapsulation, traits as interfaces, trait objects, composition over inheritance, state and type-state patterns.',
  topics: ['Encapsulation', 'Traits vs. inheritance', 'Trait objects', 'State pattern', 'Type-state & builders'],
  cpp23: [
    'Trait upcasting makes `dyn` hierarchies easier: a `&dyn Sub` coerces to `&dyn Super`, including `&dyn Any` when `Sub: Any` (Rust 1.86), so the manual `as_any` method is often unnecessary.',
    '`impl Trait` in more positions, `async fn` in traits and precise capturing (`use<..>`) reduce the need for boxing in object-style APIs (Rust 1.75 to 1.82).',
    '`#[must_use]` on types and functions, plus `#[non_exhaustive]`, let library authors enforce correct use of builders and error enums.',
  ],
  lessons: [
    {
      id: 'encapsulation',
      title: 'Encapsulation',
      blocks: [
        { kind: 'analogy', text: "A vending machine shows you buttons and a slot, never its coin mechanism. You cannot reach in and set the stock to a million, so every snack it gives out is one it has really counted. **Encapsulation** is the same promise: hide the fields, expose a few safe operations, and the rule that \"the count is never negative\" holds for every instance in the whole program, because only the machine's own code can break it." },
        { kind: 'code', code: `pub mod account {
    #[derive(Debug)]
    pub struct Account {
        owner: String,          // private: cannot be set directly from outside the module
        balance_cents: i64,     // invariant: never below zero
    }

    #[derive(Debug, PartialEq)]
    pub enum WithdrawError { Insufficient { needed: i64, available: i64 }, NonPositive }

    impl Account {
        pub fn open(owner: impl Into<String>, deposit_cents: i64) -> Option<Account> {
            (deposit_cents >= 0).then(|| Account { owner: owner.into(), balance_cents: deposit_cents })
        }
        pub fn owner(&self) -> &str { &self.owner }                       // getter: borrow, do not clone
        pub fn balance(&self) -> i64 { self.balance_cents }

        pub fn deposit(&mut self, cents: i64) { assert!(cents > 0); self.balance_cents += cents; }

        pub fn withdraw(&mut self, cents: i64) -> Result<(), WithdrawError> {
            if cents <= 0 { return Err(WithdrawError::NonPositive); }
            if cents > self.balance_cents {
                return Err(WithdrawError::Insufficient { needed: cents, available: self.balance_cents });
            }
            self.balance_cents -= cents;
            Ok(())
        }
    }
}

use account::Account;
let mut a = Account::open("Aurora", 10_000).unwrap();
// a.balance_cents = -5;              // error: field \`balance_cents\` is private
a.withdraw(2_500).unwrap();` },
        { kind: 'list', items: [
          '**Fields are private by default**, and privacy is per module (module 4). Put the type and its `impl` in one module and expose only what callers need with `pub`.',
          'A **smart constructor** (`open`) is the only way to build an `Account`, so every value starts valid. `&mut self` methods then keep it valid. This is how you "make illegal states unrepresentable".',
          'Return **borrows** from getters (`&str`, `&[T]`), not clones. Rust has no automatic getters/setters. Add one only when it is part of the API, and prefer **behaviour** (`withdraw`) over a raw setter (`set_balance`).',
          '**Newtypes** extend encapsulation to primitives: `struct Cents(i64)`, `struct UserId(u64)`, `struct Email(String)` (validated on creation). Passing a `UserId` where an `OrderId` is expected becomes a compile error, at zero runtime cost.',
          'Public fields are fine for plain **data** types (`Point { x, y }`) with no invariants. Hide fields exactly when something has to stay true.',
          '`pub(crate)` is the usual "internal API" level. `#[non_exhaustive]` on a public struct or enum lets you add fields or variants later without breaking dependents.',
          '**Sealed traits** stop outsiders implementing your trait: put a private supertrait in a private module (`pub trait Foo: private::Sealed {}`), so you can add methods without a breaking change.',
        ] },
        { kind: 'compare',
          cpp: `class Account { double balance_; public: bool withdraw(double v); double balance() const; };   // access is per class`,
          go: `type Account struct { owner string; balance int64 }   // lower-case fields are private to the package
func (a *Account) Withdraw(c int64) error`,
          python: `class Account:
    def __init__(self): self._balance = 0   # a convention only; nothing enforces it`,
          java: `public final class Account { private long balanceCents; public void withdraw(long c) throws InsufficientFunds { ... } }`,
          ts: `class Account { #balance = 0; withdraw(c: number) { ... } }   // # is truly private at runtime`,
          rust: `pub struct Account { owner: String, balance_cents: i64 }   // private to the module
impl Account { pub fn withdraw(&mut self, c: i64) -> Result<(), WithdrawError> { ... } }`,
          note: 'The visibility unit is the module, not the class. Everything in one module is a "friend", so keep modules small and focused.' },
        { kind: 'check', q: 'What does a smart constructor like `Account::open` achieve?', options: ['It is faster than a struct literal', 'It guarantees every value starts in a valid state, since outsiders cannot build one with a literal', 'It enables inheritance', 'It makes the struct `Copy`'], answer: 1, hint: 'The fields are private.', explain: 'With private fields, the module controls how values come into existence, so invariants are checked once at the door.' },
      ],
    },
    {
      id: 'composition',
      title: 'Traits, composition and inheritance',
      blocks: [
        { kind: 'analogy', text: "Inheritance is **\"a Dog is an Animal, so it gets all of Animal's insides\"**, and when the family tree grows, you inherit things you never wanted. Composition is **building a Dog from parts**: a `Barker`, a `Walker`, and a name tag. Each part is small and replaceable. Rust has no struct inheritance. Instead you describe what something can do with a trait, and what it is made of with fields." },
        { kind: 'code', code: `// Behaviour: traits (like interfaces, with default methods)
trait Describe {
    fn name(&self) -> String;
    fn describe(&self) -> String { format!("This is {}", self.name()) }   // default method: shared behaviour
}

// Reuse of state and behaviour: composition + delegation
struct Engine { hp: u32 }
impl Engine { fn start(&self) -> String { format!("vroom {} hp", self.hp) } }

struct Car { name: String, engine: Engine }                   // has-a, not is-a
impl Car {
    fn start(&self) -> String { self.engine.start() }          // explicit delegation
}
impl Describe for Car { fn name(&self) -> String { self.name.clone() } }

// Supertraits express "is a kind of" at the interface level
trait Vehicle: Describe { fn wheels(&self) -> u32; }
impl Vehicle for Car { fn wheels(&self) -> u32 { 4 } }

fn show(v: &dyn Vehicle) { println!("{} with {} wheels", v.describe(), v.wheels()); }   // Describe methods available too

// Blanket implementation: every Vehicle gets a free method
trait Summarise { fn summary(&self) -> String; }
impl<T: Vehicle + ?Sized> Summarise for T { fn summary(&self) -> String { format!("[{}]", self.describe()) } }

// Anti-pattern: using Deref to fake inheritance (surprising, and breaks trait resolution)
// impl Deref for Dog { type Target = Animal; ... }   // avoid: Deref is for smart pointers` },
        { kind: 'list', items: [
          'Rust has **no implementation inheritance** between structs: a type cannot extend another type\'s fields or methods. This avoids the fragile base class problem, the diamond problem, and the rigid hierarchies of deep taxonomies.',
          '**Interface inheritance** exists through supertraits (`trait Vehicle: Describe`), and **code sharing** through default methods, blanket impls, generics and plain delegation.',
          '"**Favour composition over inheritance**" (Gang of Four) is not advice in Rust, it is the only option. Group related fields into small structs and embed them. Delegation is explicit, and crates like `delegate` or `ambassador` remove the boilerplate.',
          'Go has the closest cousin: struct embedding promotes methods. Rust deliberately does not, since explicit delegation keeps the call path visible.',
          '**Overriding** is just a trait impl choosing its own `describe`. There is no `super.method()` call: call the trait\'s default explicitly through a helper function if you need it.',
          'Do not use `Deref` to simulate subtyping. It gives surprising method resolution and does not give you subtype polymorphism (`&Dog` still does not coerce where an `&dyn Animal` is expected unless `Dog: Animal`).',
        ] },
        { kind: 'compare',
          cpp: `class Dog : public Animal { };            // inheritance: Dog is-a Animal; virtual functions override
class Car { Engine engine; };              // composition`,
          go: `type Car struct { Engine; Name string }    // embedding: Engine's methods are promoted to Car`,
          python: `class Dog(Animal): ...                  # multiple inheritance, MRO`,
          java: `class Dog extends Animal implements Pet { }   // single class inheritance + many interfaces`,
          ts: `class Dog extends Animal implements Pet { }`,
          rust: `struct Dog { animal: Animal }          // composition
impl Pet for Dog { ... }                // behaviour via traits
// no "extends"`,
          note: 'Java and C++ give you both. Rust keeps only the half most style guides recommend: interfaces (traits) and composition.' },
        { kind: 'pitfall', text: 'When you miss inheritance, ask what you were really reusing: data (embed a struct), behaviour with defaults (trait default methods), or the ability to treat several types alike (trait objects or an enum). Each has a clean Rust answer, and a clumsy `Deref` hack is never the right one.' },
        { kind: 'check', q: 'How do you share implementation between `Car` and `Truck` in Rust?', options: ['`Truck extends Car`', 'Compose a shared struct (for example `Engine`) in both, and share behaviour via trait default methods', 'Use `Deref` to inherit', 'Impossible'], answer: 1, hint: 'There is no `extends`.', explain: 'Shared state goes in an embedded struct, and shared behaviour in trait defaults or blanket impls.' },
      ],
    },
    {
      id: 'polymorphism',
      title: 'Polymorphism: generics, trait objects and enums',
      blocks: [
        { kind: 'analogy', text: "You are running a repair shop. **Generics**: you specialise a workshop for each make of car, so the work is fast but you need to know the make in advance. **Trait objects**: one general workshop with a manual that every car's maker has filled in, and you look up the procedure by car at run time. **Enums**: you only ever work on the five cars on the price list, so you know every one of them by heart, and the compiler tells you if a sixth arrives." },
        { kind: 'code', code: `trait Shape { fn area(&self) -> f64; fn name(&self) -> &str; }
struct Circle(f64);  struct Rect(f64, f64);
impl Shape for Circle { fn area(&self) -> f64 { 3.14159 * self.0 * self.0 } fn name(&self) -> &str { "circle" } }
impl Shape for Rect   { fn area(&self) -> f64 { self.0 * self.1 }           fn name(&self) -> &str { "rect" } }

// 1. Generics (static dispatch): open set of types, fastest, one copy of code per type
fn total_area<S: Shape>(shapes: &[S]) -> f64 { shapes.iter().map(|s| s.area()).sum() }   // all the same type!

// 2. Trait objects (dynamic dispatch): open set, mixed in one collection, vtable call
fn total_area_dyn(shapes: &[Box<dyn Shape>]) -> f64 { shapes.iter().map(|s| s.area()).sum() }
let mixed: Vec<Box<dyn Shape>> = vec![Box::new(Circle(1.0)), Box::new(Rect(2.0, 3.0))];

// 3. Enum (closed set): fastest for dispatch, exhaustive match, inline storage, no allocation
enum ShapeE { Circle(f64), Rect(f64, f64) }
impl ShapeE {
    fn area(&self) -> f64 { match self { ShapeE::Circle(r) => 3.14159 * r * r, ShapeE::Rect(w, h) => w * h } }
}

// Downcasting a trait object when you really must (Rust 1.86: dyn Any upcasting)
use std::any::Any;
trait Component: Any { fn update(&mut self); }
fn find<T: Component>(parts: &[Box<dyn Component>]) -> Option<&T> {
    parts.iter().find_map(|p| (p.as_ref() as &dyn Any).downcast_ref::<T>())   // upcast dyn Component -> dyn Any
}` },
        { kind: 'list', items: [
          '**The expression problem**: with a trait you can **add new types** (new `impl Shape for Triangle`) without touching old code, but adding a new operation means editing every impl. With an enum you can **add new operations** (another `match`) freely, but a new variant breaks every existing `match` until updated. Pick the axis that will change.',
          '**Use an `enum`** when the set of variants is closed and known to you (AST nodes, protocol messages, order types, state). You get exhaustiveness checks, no heap allocation and fast dispatch.',
          '**Use `dyn Trait`** when the set is **open** (plugins, user-supplied handlers, test doubles) or heterogeneous collections must be built at run time, and when you want to hide a big generic type or cut compile time.',
          '**Use generics (`T: Trait`, `impl Trait`)** by default for functions: static dispatch, inlining, and no allocation. The cost is code size, and a collection of generics holds only one concrete type.',
          'Replace the **Visitor** pattern with `match` on an enum. You do not need double dispatch to add an operation: write a new function with a `match`.',
          'Make a trait dyn-compatible by avoiding `Self` returns and generic methods, or opt specific methods out with `where Self: Sized`. Forward `Box<dyn Trait>` to `impl Trait` with a blanket impl so boxed values pass generic code.',
        ] },
        { kind: 'code', code: `// Forwarding impl: let Box<dyn Shape> be used wherever a generic S: Shape is expected
impl<S: Shape + ?Sized> Shape for Box<S> {
    fn area(&self) -> f64 { (**self).area() }
    fn name(&self) -> &str { (**self).name() }
}
let boxed: Vec<Box<dyn Shape>> = vec![Box::new(Circle(1.0))];
let t = total_area(&boxed);          // works: Box<dyn Shape> implements Shape` },
        { kind: 'compare',
          cpp: `struct Shape { virtual double area() const = 0; };   // virtual: dynamic dispatch only
std::variant<Circle, Rect> v; std::visit(f, v);        // closed set`,
          go: `type Shape interface { Area() float64 }    // dynamic; generics for static`,
          python: `class Shape(Protocol): def area(self) -> float: ...   # duck-typed, dynamic`,
          java: `sealed interface Shape permits Circle, Rect {}   // closed set (Java 17+), switch patterns
interface Shape { double area(); }                  // open set`,
          ts: `type Shape = { kind: "circle"; r: number } | { kind: "rect"; w: number; h: number }   // closed set
interface Shape { area(): number }                                                          // open set`,
          rust: `enum Shape { Circle(f64), Rect(f64, f64) }    // closed
trait Shape { fn area(&self) -> f64; }          // open: dyn or generic`,
          note: 'Rust makes the three choices explicit in the syntax. Java 17 added sealed types for the closed case. The default in Java, C++ and Python is open and dynamic.' },
        { kind: 'check', q: 'A drawing program lets users load plugins that add new shape types. Which design suits it?', options: ['An `enum` of all shapes', '`Vec<Box<dyn Shape>>`', 'A generic `Vec<S>`', 'A `match` on strings'], answer: 1, hint: 'The set of types is open at compile time.', explain: 'Plugins add types the compiler has never seen, so you need dynamic dispatch through a trait object.' },
        { kind: 'check', q: 'Which choice gives you compile-time exhaustiveness checking when you add a case?', options: ['`Box<dyn Trait>`', '`enum` with `match`', 'Generics', 'Inheritance'], answer: 1, hint: 'The compiler lists every `match` that is missing a variant.', explain: 'Adding an enum variant makes every non-exhaustive `match` fail to compile.' },
      ],
    },
    {
      id: 'state',
      title: 'The state pattern',
      blocks: [
        { kind: 'analogy', text: "A blog post moves through **Draft, Pending review, Published**. In the classic object-oriented \"State\" pattern, the post hands each request to a **current state object** (\"what do I do when asked to publish?\") and the state either returns itself (nothing happens) or the next state. The post never needs an `if status == ...` chain, because each state knows its own rules." },
        { kind: 'code', code: `pub struct Post {
    state: Option<Box<dyn State>>,          // Option so we can take() the state out and replace it
    content: String,
}

impl Post {
    pub fn new() -> Post { Post { state: Some(Box::new(Draft)), content: String::new() } }
    pub fn add_text(&mut self, text: &str) { self.content.push_str(text); }
    pub fn content(&self) -> &str { self.state.as_ref().unwrap().content(self) }

    pub fn request_review(&mut self) {
        if let Some(s) = self.state.take() {            // move the state out of self...
            self.state = Some(s.request_review());      // ...and put the successor back
        }
    }
    pub fn approve(&mut self) {
        if let Some(s) = self.state.take() { self.state = Some(s.approve()); }
    }
}

trait State {
    fn request_review(self: Box<Self>) -> Box<dyn State>;     // self: Box<Self>: consumes the state
    fn approve(self: Box<Self>) -> Box<dyn State>;
    fn content<'a>(&self, _post: &'a Post) -> &'a str { "" }   // default: nothing visible
}

struct Draft;
struct Pending;
struct Published;

impl State for Draft {
    fn request_review(self: Box<Self>) -> Box<dyn State> { Box::new(Pending) }
    fn approve(self: Box<Self>) -> Box<dyn State> { self }          // not reviewed yet: stay a draft
}
impl State for Pending {
    fn request_review(self: Box<Self>) -> Box<dyn State> { self }
    fn approve(self: Box<Self>) -> Box<dyn State> { Box::new(Published) }
}
impl State for Published {
    fn request_review(self: Box<Self>) -> Box<dyn State> { self }
    fn approve(self: Box<Self>) -> Box<dyn State> { self }
    fn content<'a>(&self, post: &'a Post) -> &'a str { &post.content }   // only now visible
}` },
        { kind: 'stepper', title: 'A transition: why Option::take()', code: [
          'let mut post = Post::new();',
          'post.add_text("hello");',
          'post.request_review();',
          'post.approve();',
          'println!("{}", post.content());',
        ], steps: [
          { line: 1, note: 'The post holds `Some(Box<Draft>)`.', memory: [{ name: 'post.state', value: 'Some(Draft)', kind: 'heap' }, { name: 'post.content', value: '""' }] },
          { line: 2, note: 'Adding text does not change state.', memory: [{ name: 'post.state', value: 'Some(Draft)', kind: 'heap' }, { name: 'post.content', value: '"hello"' }] },
          { line: 3, note: '`take()` moves the `Draft` out of the post and leaves `None` for a moment. `request_review(self: Box<Self>)` **consumes** the old state, so nobody can keep using a stale `Draft`. The result is stored back.', memory: [{ name: 'post.state', value: 'Some(Pending)', kind: 'heap' }, { name: 'old Draft', value: 'consumed', kind: 'dead' }] },
          { line: 4, note: 'The same dance moves `Pending` to `Published`.', memory: [{ name: 'post.state', value: 'Some(Published)', kind: 'heap' }] },
          { line: 5, note: 'Only `Published` returns the content, so calling it earlier would have returned an empty string.', memory: [{ name: 'content()', value: '"hello"' }] },
        ] },
        { kind: 'list', items: [
          '**State as trait objects** is the textbook OO pattern. The post is the context and each state is a small type with its own behaviour. Adding a state means a new struct and an impl.',
          '`self: Box<Self>` is a method receiver that takes ownership of the boxed state. After `request_review`, the old state value is gone, which models "the state transitions" accurately.',
          '`Option` plus `take()` is the idiom for swapping out a field you must consume: you cannot move out of `&mut self`, so you take it, transform it and put the next one back.',
          'The cost: invalid operations compile but do nothing at run time (approving a draft just returns `self`). The runtime checks live in the code and not in the type system.',
          'An **enum with a `match`** is often simpler: `enum State { Draft, Pending, Published }` and `fn approve(self) -> State`. Use trait objects only when states are an open set or carry very different data and behaviour.',
          'The next lesson shows a stricter alternative, where invalid transitions **do not compile**.',
        ] },
        { kind: 'code', code: `// The same thing as a plain enum: shorter, and exhaustive
#[derive(Clone, Copy, PartialEq, Debug)]
enum Status { Draft, Pending, Published }
impl Status {
    fn request_review(self) -> Status { if self == Status::Draft { Status::Pending } else { self } }
    fn approve(self) -> Status { if self == Status::Pending { Status::Published } else { self } }
}` },
        { kind: 'compare',
          cpp: `struct State { virtual std::unique_ptr<State> approve() = 0; };   // the same GoF pattern`,
          go: `type State interface { Approve() State }   // each state is a small struct`,
          python: `class Draft: def approve(self): return self   # states as classes, post.state = post.state.approve()`,
          java: `interface State { State approve(); }   // GoF State: the context holds a State field and reassigns it`,
          ts: `type State = { approve(): State }`,
          rust: `trait State { fn approve(self: Box<Self>) -> Box<dyn State>; }   // the transition consumes the old state`,
          note: 'Java\'s version leaves the old state to the garbage collector. Rust\'s `self: Box<Self>` makes the transition explicit and prevents reuse of the old state.' },
        { kind: 'check', q: 'Why does the `Post` keep its state in an `Option<Box<dyn State>>`?', options: ['Because states may be absent', 'So the state can be moved out with `take()`, consumed by a transition method, and replaced', 'For thread safety', 'Because `Box` cannot be stored directly'], answer: 1, hint: 'You cannot move out of `&mut self` and leave a hole.', explain: '`take()` leaves `None` temporarily, which lets the transition method take ownership of the old state.' },
      ],
    },
    {
      id: 'typestate',
      title: 'Type-state, builders and other patterns',
      blocks: [
        { kind: 'analogy', text: "The state pattern is a **door that politely does nothing** if you push it at the wrong time. **Type-state** is **a corridor with no door in the wrong place**: a draft post simply does not have a `publish` method, so the mistake cannot be typed. You encode the state in the type, and each transition consumes the old value and returns a value of the new type." },
        { kind: 'code', code: `// Type-state: states are different types; invalid transitions do not compile
pub struct DraftPost { content: String }
pub struct PendingPost { content: String }
pub struct Post { content: String }

impl Post {
    pub fn new() -> DraftPost { DraftPost { content: String::new() } }
    pub fn content(&self) -> &str { &self.content }        // only a published Post can show content
}
impl DraftPost {
    pub fn add_text(&mut self, t: &str) { self.content.push_str(t); }
    pub fn request_review(self) -> PendingPost { PendingPost { content: self.content } }   // consumes the draft
}
impl PendingPost {
    pub fn approve(self) -> Post { Post { content: self.content } }
}

let mut d = Post::new();
d.add_text("hello");
let p = d.request_review();
// d.add_text("x");              // error: \`d\` was moved. You cannot edit after submitting.
// p.content();                  // error: no method \`content\` on PendingPost
let live = p.approve();
println!("{}", live.content());` },
        { kind: 'code', caption: 'Builder pattern, with a type-state twist that forces required fields.', code: `pub struct NoSymbol;  pub struct HasSymbol(String);

#[derive(Debug)]
pub struct Order { sym: String, qty: u32, limit: Option<f64> }

pub struct OrderBuilder<S> { sym: S, qty: u32, limit: Option<f64> }

impl OrderBuilder<NoSymbol> {
    pub fn new() -> Self { OrderBuilder { sym: NoSymbol, qty: 1, limit: None } }
    pub fn symbol(self, s: &str) -> OrderBuilder<HasSymbol> {
        OrderBuilder { sym: HasSymbol(s.into()), qty: self.qty, limit: self.limit }
    }
}
impl<S> OrderBuilder<S> {                              // optional settings available in any state
    pub fn qty(mut self, q: u32) -> Self { self.qty = q; self }
    pub fn limit(mut self, px: f64) -> Self { self.limit = Some(px); self }
}
impl OrderBuilder<HasSymbol> {
    pub fn build(self) -> Order { Order { sym: self.sym.0, qty: self.qty, limit: self.limit } }   // only with a symbol
}

let o = OrderBuilder::new().qty(10).symbol("XAU").limit(2390.0).build();
// OrderBuilder::new().build();        // error: no method \`build\` for OrderBuilder<NoSymbol>` },
        { kind: 'code', caption: 'Other patterns, as Rust writes them.', code: `// Strategy: a closure or a trait object instead of a class hierarchy
fn price_with<F: Fn(f64) -> f64>(base: f64, strategy: F) -> f64 { strategy(base) }
let with_tax = price_with(100.0, |p| p * 1.2);

// Observer: a list of callbacks
struct Bus { handlers: Vec<Box<dyn Fn(&str)>> }
impl Bus {
    fn on(&mut self, f: impl Fn(&str) + 'static) { self.handlers.push(Box::new(f)); }
    fn emit(&self, ev: &str) { for h in &self.handlers { h(ev); } }
}

// Command / undo: an enum of operations, a Vec as history
enum Cmd { Insert(usize, char), Delete(usize) }
struct Doc { text: String, history: Vec<Cmd> }

// RAII guard: acquire in a constructor, release in Drop
struct Timer(std::time::Instant, &'static str);
impl Drop for Timer { fn drop(&mut self) { println!("{} took {:?}", self.1, self.0.elapsed()); } }
fn work() { let _t = Timer(std::time::Instant::now(), "work"); /* ... */ }

// Dependency injection for testing: depend on a trait, not a concrete type
trait Clock { fn now(&self) -> u64; }
struct Engine<C: Clock> { clock: C }

// Newtype + From: validated, self-describing types
struct Email(String);
impl TryFrom<&str> for Email {
    type Error = &'static str;
    fn try_from(s: &str) -> Result<Self, Self::Error> { s.contains('@').then(|| Email(s.into())).ok_or("missing @") }
}` },
        { kind: 'list', items: [
          '**Type-state** moves "is this operation valid now?" from a run-time check to a **compile-time** one. Cost: more types and some duplication. It shines for protocols and resources with a lifecycle: connections, transactions, builders, file handles, hardware registers.',
          'A **consuming method** (`fn approve(self) -> Post`) invalidates the old value, so stale handles cannot be used. Mark builders and states `#[must_use]` so an ignored result produces a warning.',
          '`PhantomData<S>` carries a type parameter that takes no space, which is the cheap way to implement type-state when the states have no data of their own.',
          'The **builder** replaces missing default arguments and overloaded constructors. `Default` plus struct update syntax (`..Default::default()`) is a lighter alternative for plain config structs.',
          '**Strategy, Observer, Command, Visitor and Iterator** are mostly language features: closures, `Vec<Box<dyn Fn>>`, enums with `match`, and the `Iterator` trait. Reach for classes-and-interfaces designs only when the problem calls for them.',
          'A good rule of thumb for OO design in Rust: **data in structs, behaviour in traits and impls, closed variants in enums, shared ownership only when needed, and composition everywhere.**',
        ] },
        { kind: 'compare',
          cpp: `// builders return *this; type-state is possible with templates but is rarely used`,
          go: `// functional options: NewServer(WithPort(80), WithTLS(cfg))`,
          python: `# keyword arguments and dataclasses replace most builders`,
          java: `new Order.Builder().symbol("XAU").qty(10).build();   // missing symbol is a run-time exception`,
          ts: `// object literals with optional properties; discriminated unions for states`,
          rust: `OrderBuilder::new().qty(10).symbol("XAU").build()   // missing symbol: compile error`,
          note: 'Java builders validate at `build()` time, and Rust can refuse to compile calls that would fail. The same idea models connection states, transactions and protocol handshakes.' },
        { kind: 'pitfall', text: 'Type-state is powerful but easy to overdo. If a state machine has many states, runtime-chosen transitions or needs to be stored in a collection, a plain `enum` with checked transitions is simpler. Use type-state where a wrong order is a bug the caller can prevent statically.' },
        { kind: 'check', q: 'What does consuming `self` in `fn request_review(self) -> PendingPost` prevent?', options: ['Cloning', 'Using the old `DraftPost` after it has been submitted', 'Thread safety', 'Returning a value'], answer: 1, hint: 'Think about ownership after a move.', explain: 'After the call, the draft is moved. The compiler rejects any later use, so you cannot edit a post that is under review.' },
        { kind: 'check', q: 'In the type-state builder, why does `OrderBuilder::new().build()` not compile?', options: ['`build` is private', '`build` is only defined for `OrderBuilder<HasSymbol>`, and `new()` gives `OrderBuilder<NoSymbol>`', 'It needs `qty`', 'Builders cannot be called in a chain'], answer: 1, hint: 'Look at which `impl` block defines `build`.', explain: 'The method lives in an `impl` for the `HasSymbol` state only, which makes "required field missing" a compile-time error.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is the privacy boundary in Rust?', options: ['The class', 'The module', 'The file', 'The crate always'], answer: 1, explain: 'Items are private to the module they are declared in (and its children).' },
    { q: 'What does a smart constructor protect?', options: ['Performance', 'Invariants: only valid values can be constructed', 'Thread safety', 'Lifetimes'], answer: 1, explain: 'With private fields and a validating constructor, every value is valid by construction.' },
    { q: 'Does Rust support implementation inheritance between structs?', options: ['Yes, with `extends`', 'No: use composition, traits and default methods', 'Only with `Deref`', 'Only for enums'], answer: 1, explain: 'Rust has no struct inheritance. Traits describe behaviour and composition shares state.' },
    { q: 'Why is using `Deref` to simulate inheritance discouraged?', options: ['It is slow', 'It is meant for smart pointers and produces surprising method resolution', 'It is unsafe', 'It does not compile'], answer: 1, explain: 'It hides what is going on and does not give real subtyping.' },
    { q: 'Which is the best fit for a closed set of message types that you control?', options: ['`Box<dyn Message>`', 'An `enum`', 'Inheritance', 'A generic `T`'], answer: 1, explain: 'Enums give exhaustive matching, inline storage and fast dispatch.' },
    { q: 'What is the expression problem?', options: ['Parsing arithmetic', 'The trade-off between adding new types and adding new operations: traits favour the first, enums the second', 'A borrow-checker error', 'A formatting issue'], answer: 1, explain: 'Each approach makes one kind of extension easy and the other hard.' },
    { q: 'What does `fn approve(self: Box<Self>) -> Box<dyn State>` express?', options: ['A borrow of the state', 'The transition consumes the old boxed state and returns the next one', 'A clone', 'A static method'], answer: 1, explain: 'It takes ownership so the old state cannot be reused.' },
    { q: 'Why `Option<Box<dyn State>>` plus `take()` in the state pattern?', options: ['It is faster', 'You cannot move out of `&mut self`, so you take the value, transform it and store the successor', 'To support null', 'To enable cloning'], answer: 1, explain: '`take()` replaces the field with `None` so the old value can be consumed.' },
    { q: 'What is the main benefit of type-state over the dynamic state pattern?', options: ['Smaller binaries', 'Invalid transitions become compile-time errors', 'It avoids generics', 'It is thread-safe'], answer: 1, explain: 'A `DraftPost` simply has no `content()` or `approve()` method.' },
    { q: 'How does Rust usually replace the Visitor pattern?', options: ['With macros', 'With an `enum` and `match` expressions', 'With inheritance', 'With `unsafe`'], answer: 1, explain: 'A new operation is just a new function matching on the enum, so no double dispatch is needed.' },
  ],
}
