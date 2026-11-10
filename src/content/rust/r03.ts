import type { Module } from '../types'

export const r03: Module = {
  n: 3,
  title: 'Structs, Enums and Pattern Matching',
  tour: '5, 6, 19 · Structs; Enums and Pattern Matching; Patterns',
  summary: 'Modelling data with structs and enums, methods, `Option`, `match`, `if let`, and the full pattern syntax.',
  topics: ['Structs & methods', 'Enums & Option', 'match & exhaustiveness', 'if let, let else & let chains', 'Pattern syntax'],
  cpp23: [
    'Let chains: `if let Some(x) = a && x > 0 { }` (Rust 1.88, 2024 edition).',
    'Exclusive range patterns: `0..10` in a `match` arm (Rust 1.80).',
    '`Option::is_none_or` and `is_some_and` for readable predicates on options (Rust 1.82 and 1.70).',
    'The 2024 edition forbids redundant `&`, `ref` and `mut` inside a pattern that already matches through a reference (stricter match ergonomics).',
  ],
  lessons: [
    {
      id: 'structs',
      title: 'Structs and methods',
      blocks: [
        { kind: 'analogy', text: "A struct is a form with labelled boxes: one box for the symbol, one for the price, one for the quantity. An `impl` block is the clerk's handbook: it says what you may do with a filled-in form. And because every box has a type, a form with a missing or wrongly filled box never leaves the desk." },
        { kind: 'code', code: `#[derive(Debug, Clone, PartialEq)]
struct Trade {
    sym: String,
    px: f64,
    qty: u32,
}

impl Trade {
    // associated function (no self): called as Trade::new(...)
    fn new(sym: &str, px: f64, qty: u32) -> Self {
        Self { sym: sym.to_string(), px, qty }       // field init shorthand: px, qty
    }
    // methods take self in one of three ways
    fn notional(&self) -> f64 { self.px * self.qty as f64 }   // read
    fn scale(&mut self, k: u32) { self.qty *= k; }            // modify
    fn into_sym(self) -> String { self.sym }                  // consume
}

let mut t = Trade::new("XAU", 2390.5, 10);
t.scale(2);
println!("{:?} worth {:.1}", t, t.notional());      // Debug output with {:?}
let t2 = Trade { px: 2400.0, ..t.clone() };         // struct update: the rest from t

struct Meters(f64);              // tuple struct: a distinct type ("newtype")
struct Marker;                   // unit struct: no data
let m = Meters(3.5); let Meters(inner) = m;` },
        { kind: 'list', items: [
          '**Mutability applies to the whole value**, not to single fields: `let mut t` makes every field assignable. There is no per-field `mut`.',
          '`&self`, `&mut self` and `self` in a signature say how a method uses the value. The caller can tell from the call site whether it may change or consume the thing.',
          '`Self` is the type being implemented. Associated functions without a receiver are Rust\'s constructors, and by convention `new` is the common one. There are no special constructors, no default arguments and no overloading: use `Default`, builders or several named functions.',
          '`..other` struct update syntax **moves** the non-`Copy` fields it takes. After `..t` (without `clone`), `t.sym` is moved out, and `t` is partly unusable.',
          '`#[derive(Debug)]` gives `{:?}` and `{:#?}` (pretty). `dbg!(x)` prints the file, line, expression and value to stderr and gives the value back, which is better than `println!` for quick debugging.',
          '**Newtypes** (`struct Meters(f64)`) cost nothing at runtime and stop you from passing metres where seconds are expected.',
          'Methods can be split over several `impl` blocks, and fields are private to the module by default (module 4).',
        ] },
        { kind: 'compare',
          cpp: `struct Trade {
    std::string sym; double px; unsigned qty;
    double notional() const { return px * qty; }   // const-correctness by convention
};
Trade t{"XAU", 2390.5, 10};`,
          go: `type Trade struct { Sym string; Px float64; Qty uint32 }
func (t Trade) Notional() float64 { return t.Px * float64(t.Qty) }
func (t *Trade) Scale(k uint32)   { t.Qty *= k }`,
          python: `@dataclass
class Trade:
    sym: str; px: float; qty: int
    def notional(self) -> float: return self.px * self.qty`,
          java: `record Trade(String sym, double px, int qty) {
    double notional() { return px * qty; }
}`,
          ts: `interface Trade { sym: string; px: number; qty: number }
const notional = (t: Trade) => t.px * t.qty`,
          rust: `struct Trade { sym: String, px: f64, qty: u32 }
impl Trade {
    fn notional(&self) -> f64 { self.px * self.qty as f64 }
}`,
          note: 'Data and behaviour are declared separately in Rust, as in Go. Unlike Java records, fields are not immutable by default: mutability is a property of the binding.' },
        { kind: 'pitfall', text: 'Writing `fn notional(self)` by habit consumes the trade, so the caller cannot use it again. Default to `&self` for reads and `&mut self` for changes, and take `self` only when the method turns the value into something else (a builder\'s `build`, a conversion).' },
        { kind: 'check', q: 'Which receiver lets a method change the struct without taking ownership?', options: ['`self`', '`&self`', '`&mut self`', '`mut self`'], answer: 2, hint: 'You need an exclusive borrow.', explain: '`&mut self` borrows the value exclusively and lets the method modify it. `self` consumes it, and `&self` only reads.' },
      ],
    },
    {
      id: 'enums',
      title: 'Enums and Option',
      blocks: [
        { kind: 'analogy', text: "A struct says *this and this and this*. An enum says *this or that or the other*, and each choice may carry its own luggage. A parcel is either `Letter`, or `Box { weight }`, or `Pallet { count, weight }`. Once you know which kind it is, you know exactly what fields exist. There is no way to read a pallet's count from a letter." },
        { kind: 'code', code: `enum Order {
    Market { sym: String, qty: u32 },          // named fields
    Limit { sym: String, qty: u32, px: f64 },
    Cancel(u64),                               // tuple variant: an order id
    CancelAll,                                 // no data
}

let o = Order::Limit { sym: "XAU".into(), qty: 5, px: 2390.0 };
let c = Order::Cancel(42);

impl Order {
    fn describe(&self) -> String {
        match self {
            Order::Market { sym, qty } => format!("buy {qty} {sym} at market"),
            Order::Limit { sym, qty, px } => format!("buy {qty} {sym} at {px}"),
            Order::Cancel(id) => format!("cancel #{id}"),
            Order::CancelAll => "cancel everything".to_string(),
        }
    }
}` },
        { kind: 'list', items: [
          'Rust enums are **tagged unions** (sum types, algebraic data types). The compiler stores a tag and just enough space for the biggest variant, and `match` is the only safe way to get the data out.',
          'Together, structs (product types: "and") and enums (sum types: "or") model almost any domain precisely. Make illegal states unrepresentable: a `Connection` that is `Open { socket }` or `Closed` cannot have a socket while closed.',
          'There is **no `null`**. The standard library has `enum Option<T> { None, Some(T) }`. A `T` is always a real value, and an `Option<T>` forces you to handle `None` before you can touch the inside.',
          '`Option` is so common its variants are in scope everywhere (`Some`, `None`). It has dozens of helpers: `map`, `and_then`, `unwrap_or`, `unwrap_or_else`, `unwrap_or_default`, `ok_or`, `filter`, `take`, `is_some_and`, `is_none_or`, `?`.',
          'C-like enums can have explicit numbers: `enum Color { Red = 1, Green = 2 }` with `Color::Red as i32`. Going the other way needs `TryFrom` (or a crate like `num_enum`) because arbitrary integers are not valid variants.',
          '`Result<T, E>` is the sibling for fallible work: `Ok(T)` or `Err(E)` (module 6).',
        ] },
        { kind: 'code', code: `fn find_px(book: &[(String, f64)], sym: &str) -> Option<f64> {
    book.iter().find(|(s, _)| s == sym).map(|(_, px)| *px)
}

let px = find_px(&book, "XAU");
let value = px.map(|p| p * 10.0).unwrap_or(0.0);   // transform, with a default
let big = px.is_some_and(|p| p > 2000.0);          // bool test without unwrapping
let ok = px.is_none_or(|p| p > 0.0);               // true for None or a positive price

// let x: i32 = px;      // error: expected i32, found Option<f64>. The type forces the check.` },
        { kind: 'compare',
          cpp: `std::variant<Letter, Box, Pallet> p;       // visit with std::visit, no exhaustiveness check by default
std::optional<double> px = find(book, "XAU");
double v = *px;                              // undefined behaviour if empty!`,
          go: `// no sum types: structs with a Kind field, or interfaces + type switch
px, ok := find(book, "XAU")                  // the (value, bool) idiom`,
          python: `Order = Market | Limit | Cancel            # union of classes
px: float | None = find(book, "XAU")         # checked only by tools`,
          java: `sealed interface Order permits Market, Limit {}   // Java 17+
Optional<Double> px = find(book, "XAU");`,
          ts: `type Order = { kind: "market"; qty: number } | { kind: "cancel"; id: number }
const px: number | undefined = find(book, "XAU")`,
          rust: `enum Order { Market { qty: u32 }, Cancel(u64) }
let px: Option<f64> = find(&book, "XAU");    // must be matched or mapped`,
          note: 'Rust enums combine C++ `variant`, Java sealed types and TypeScript discriminated unions, with exhaustive checking built in and the data stored inline.' },
        { kind: 'check', q: 'What does `let x: i32 = maybe;` do when `maybe` is an `Option<i32>`?', options: ['Unwraps it, panicking on `None`', 'Fails to compile: the types differ', 'Gives 0 if `None`', 'Compiles but warns'], answer: 1, hint: 'There is no implicit unwrapping.', explain: '`Option<i32>` and `i32` are different types. You must handle `None` explicitly: `match`, `if let`, `unwrap_or`, or `?`.' },
      ],
    },
    {
      id: 'match',
      title: 'match and exhaustiveness',
      blocks: [
        { kind: 'analogy', text: "`match` is a sorting machine with a labelled chute for every kind of parcel. The compiler checks that every possible shape has a chute: if you add a new kind of parcel to the enum, the build fails until you decide where it goes. A `_` chute is the catch-all bin, useful, but it also silences that safety check." },
        { kind: 'code', code: `let n = 7;
let kind = match n {
    0 => "zero",
    1 | 2 | 3 => "small",            // or-pattern
    4..=9 => "medium",               // inclusive range
    10..100 => "large",              // exclusive range (Rust 1.80)
    x if x < 0 => "negative",        // guard: an extra condition
    _ => "huge",                     // catch-all
};

match order {
    Order::Limit { qty, px, .. } if px > 3000.0 => println!("pricey {qty}"),
    Order::Limit { qty: q @ 1..=10, .. } => println!("small limit of {q}"),  // @ binds and tests
    Order::Cancel(id) => println!("cancel {id}"),
    other => println!("other: {}", other.describe()),                       // bind the rest
}

let parity = match (n % 2, n > 5) {   // match on a tuple of conditions
    (0, _) => "even",
    (_, true) => "odd and big",
    (_, false) => "odd and small",
};` },
        { kind: 'list', items: [
          'A `match` must be **exhaustive**: every possible value is covered. This is checked at compile time, including across nested enums, integer ranges and booleans.',
          '`match` is an expression, and every arm must give the same type. An arm can `return`, `break`, `continue` or `panic!`, since those have type `!`.',
          'Arms are tried **top to bottom**, so put specific patterns before general ones. Unreachable arms are warned about.',
          'Matching moves or borrows depending on how you match. `match self { Order::Cancel(id) => ... }` on a `&self` binds `id` as `&u64` (a reference), and matching an owned value moves non-`Copy` fields out.',
          '`matches!(value, Order::Cancel(_) | Order::CancelAll)` is a one-line boolean for "is it one of these".',
          'Prefer matching explicitly over `_` for your own enums: when you add a variant, the compiler lists every `match` that needs updating. Types from other crates marked `#[non_exhaustive]` need a `_` arm by design.',
        ] },
        { kind: 'new23', text: 'The 2024 edition tightened match ergonomics. When a pattern is already matching through a reference, writing `&`, `ref` or `mut` inside it is an error. Drop them and let the compiler infer the binding mode:' },
        { kind: 'code', code: `let pair = &(String::from("a"), 5);
let (name, n) = pair;          // name: &String, n: &i32 (default binding mode)
// let (ref name, n) = pair;   // 2024 edition: error, "ref" is redundant here` },
        { kind: 'pitfall', text: 'A wildcard `_ =>` arm on an enum you own turns the compiler\'s "you missed a case" error into silence. Use it for open-ended things like integers and strings, and list enum variants out when correctness matters.' },
        { kind: 'compare',
          cpp: `switch (kind) { case A: ...; break; case B: ...; break; }   // fallthrough, no exhaustiveness error
std::visit(overloaded{[](Limit& l){}, [](Cancel& c){}}, order);`,
          go: `switch kind { case A: ...; case B: ...; default: ... }   // no exhaustiveness check`,
          python: `match order:
    case Limit(px=p) if p > 3000: ...
    case Cancel(id=i): ...
    case _: ...`,
          java: `switch (order) {                          // exhaustive over sealed types
    case Limit l when l.px() > 3000 -> ...
    case Cancel c -> ...
}`,
          ts: `switch (o.kind) { case "market": ...; case "cancel": ... }   // add a never check by hand`,
          rust: `match order {
    Order::Limit { px, .. } if px > 3000.0 => {}
    Order::Cancel(id) => {}
    _ => {}
}`,
          note: 'Rust, Java 21+ and Python 3.10+ all have pattern matching, but only Rust and Java check exhaustiveness at compile time.' },
        { kind: 'check', q: 'What happens if you add a new variant to an enum and some `match` has no `_` arm?', options: ['It silently ignores the new variant', 'The compiler reports a non-exhaustive match', 'It panics at runtime', 'The new variant is unreachable'], answer: 1, hint: 'This is the main reason to avoid `_` on your own enums.', explain: 'Exhaustiveness is a compile-time rule, so every `match` that needs updating is flagged for you.' },
      ],
    },
    {
      id: 'if-let',
      title: 'if let, let else and let chains',
      blocks: [
        { kind: 'analogy', text: "Sometimes a full sorting machine is too much, you only care about one kind of parcel. `if let` is a quick glance: \"if this is a Letter, read it, otherwise carry on.\" `let else` is a bouncer: \"you must be on the list, or you leave now\". And a **let chain** lets the bouncer check several things in a single pass." },
        { kind: 'code', code: `// if let: one pattern, optional else
if let Some(px) = book.get("XAU") {
    println!("gold {px}");
} else {
    println!("no gold");
}

// while let: loop as long as the pattern matches
let mut stack = vec![1, 2, 3];
while let Some(top) = stack.pop() { println!("{top}"); }

// let else: bail out, keep the happy path flat
fn parse_qty(s: &str) -> Option<u32> {
    let Some(rest) = s.strip_prefix("qty=") else { return None };
    rest.parse().ok()
}

// let chains (2024 edition, Rust 1.88): patterns and conditions with &&
if let Some(px) = book.get("XAU") && *px > 2000.0 && let Some(q) = qty_for("XAU") && q > 0 {
    println!("trade {q} at {px}");
}` },
        { kind: 'list', items: [
          '`if let PATTERN = EXPR` is sugar for a `match` with one arm and a wildcard. Reach for it when you only handle one case.',
          '`let ... else { diverge }` requires that the else block never falls through (`return`, `break`, `continue` or `panic!`). The bound names live on in the enclosing scope.',
          '**Let chains** use `&&` to combine `let` patterns with ordinary boolean conditions in `if` and `while`. Earlier bindings are visible in later parts of the chain. Chains need edition 2024, and `||` is not supported.',
          'In an `if let` scrutinee temporaries now drop **before** the `else` block in the 2024 edition, which fixes a famous lock-held-in-else surprise.',
          'For `Option`/`Result` there is often a method that does it better: `opt.map(f)`, `opt.unwrap_or(d)`, `res.ok()`. Use `if let` when the body has side effects or early returns.',
        ] },
        { kind: 'check', q: 'What must the else block of `let Some(x) = opt else { ... };` do?', options: ['Return a default value for `x`', 'Diverge: return, break, continue or panic', 'Assign to `x`', 'Nothing special'], answer: 1, hint: 'After the statement, `x` must be valid.', explain: 'Since `x` has to be bound after the statement, the else branch must not fall through.' },
      ],
    },
    {
      id: 'patterns',
      title: 'Pattern syntax',
      blocks: [
        { kind: 'analogy', text: "Patterns are stencils. You lay the stencil over a value; where its shape fits, the holes let you pick out pieces and name them. The same stencil language works in `match`, `let`, `if let`, function parameters and `for` loops, so learning it once pays off everywhere." },
        { kind: 'code', code: `// Everywhere a pattern is allowed
let (a, b) = (1, 2);                          // let
for (i, c) in "ab".chars().enumerate() {}     // for
fn dist(&(x, y): &(f64, f64)) -> f64 { x.hypot(y) }   // function parameter
let [first, .., last] = [1, 2, 3, 4];         // arrays and slices: .. skips

// Destructure nested data
struct Point { x: i32, y: i32 }
enum Shape { Circle { c: Point, r: u32 }, Rect(Point, Point) }
match shape {
    Shape::Circle { c: Point { x: 0, y }, r } => println!("on y-axis at {y}, r={r}"),
    Shape::Circle { r, .. } => println!("radius {r}"),   // .. ignores other fields
    Shape::Rect(Point { x: x1, .. }, Point { x: x2, .. }) => println!("width {}", x2 - x1),
}

// Slice patterns
match v.as_slice() {
    [] => "empty",
    [x] => "one",
    [first, rest @ ..] => "many",      // rest binds the remaining slice
}

// Refutable vs irrefutable: let needs a pattern that can never fail
// let Some(x) = opt;        // error: refutable pattern in let (use let else)` },
        { kind: 'list', items: [
          '**Literals** (`1`, `"a"`, `\'x\'`), **ranges** (`1..=5`), **names** (bind), **`_`** (ignore one value), **`..`** (ignore the rest), **`|`** (or), **`x @ pat`** (bind and test), **`if`** (guard), `ref`/`ref mut` (only needed for explicit binding modes in older code).',
          '**Irrefutable** patterns always match (`let (a, b) = pair`), so they are allowed in `let`, `for` and parameters. **Refutable** ones can fail (`Some(x)`), so they belong in `match`, `if let`, `while let` and `let else`.',
          '`_x` binds the value but silences the unused warning, while `_` does not bind at all. The difference matters for ownership: `let _ = s;` does **not** move `s`, but `let _x = s;` does.',
          'Binding modes: matching a `&T` with `Some(x)` binds `x` as a reference to the inner value. Matching an owned value moves the inner value out. This is why you can `match &opt { Some(s) => ... }` and keep `opt`.',
          '**Constants** can be patterns (`const MAX: u32 = 5; match n { MAX => ... }`), but a lowercase name is always a new binding, not a comparison. The compiler warns when a binding shadows a constant by accident.',
        ] },
        { kind: 'compare',
          cpp: `auto [a, b] = pair;                 // structured bindings only; no refutable patterns
if (auto* p = std::get_if<Cancel>(&order)) { }`,
          go: `a, b := pair()                      // multiple return values; no destructuring of structs`,
          python: `a, b = pair
match v:
    case [first, *rest]: ...`,
          java: `if (obj instanceof Point(int x, int y)) { }   // record patterns, Java 21+`,
          ts: `const { x, y } = point
const [first, ...rest] = arr`,
          rust: `let Point { x, y } = point;
let [first, rest @ ..] = v.as_slice() else { return };`,
          note: 'Rust patterns are the most general of these: they work on nested enums, structs, tuples, slices, references and ranges, in every binding position.' },
        { kind: 'check', q: 'What is the difference between `let _ = s;` and `let _x = s;` when `s` is a `String`?', options: ['None', '`let _ = s;` does not move `s`, `let _x = s;` does', '`let _ = s;` moves, `let _x = s;` copies', 'Both are compile errors'], answer: 1, hint: '`_` does not bind anything.', explain: 'A bare `_` is a wildcard that never binds, so nothing is moved. `_x` is a real binding that merely silences the unused-variable warning.' },
        { kind: 'check', q: 'Which pattern is irrefutable (allowed in a plain `let`)?', options: ['`Some(x)`', '`(a, b)` against a tuple', '`Ok(v)`', '`0..=9`'], answer: 1, hint: 'Which one can never fail to match?', explain: 'A tuple pattern always matches a tuple. `Some`, `Ok` and ranges can fail, so they need `if let`, `match` or `let else`.' },
      ],
    },
  ],
  quiz: [
    { q: 'How do you create a struct instance from another with one field changed?', options: ['`Trade { px: 1.0, ..old }`', '`old.with(px: 1.0)`', '`Trade(old, px = 1.0)`', '`old.clone(px = 1.0)`'], answer: 0, explain: 'Struct update syntax copies or moves the remaining fields from `old`. Non-`Copy` fields are moved.' },
    { q: 'Which receiver consumes the value?', options: ['`&self`', '`&mut self`', '`self`', '`Self`'], answer: 2, explain: '`self` takes ownership, so the caller cannot use the value afterwards.' },
    { q: 'Rust has no `null`. What replaces it?', options: ['`Nil`', '`Option<T>` with `Some` and `None`', 'Zero values', '`Result<T, ()>` only'], answer: 1, explain: 'Absence is expressed in the type, so you must handle `None` before using the value.' },
    { q: 'What does it mean for a `match` to be exhaustive?', options: ['Every arm is tested at runtime', 'Every possible value is covered by some arm', 'It uses `_` as its last arm', 'It returns a value'], answer: 1, explain: 'The compiler checks that no input can fall through. Adding an enum variant breaks matches that omit it.' },
    { q: 'What does `x @ 1..=5` do in a pattern?', options: ['Compares x to 1 through 5 and discards it', 'Binds the value to `x` and requires it to lie in 1..=5', 'Creates an array', 'Is a syntax error'], answer: 1, explain: '`@` lets you name a value and also test it against a sub-pattern.' },
    { q: 'Which is true of `let Some(x) = opt else { return };`?', options: ['It panics when `opt` is `None`', 'The else block must diverge', '`x` is only visible inside the else block', 'It requires edition 2015'], answer: 1, explain: 'On a failed match the else block runs and must not fall through. On success, `x` is bound in the enclosing scope.' },
    { q: 'What does `matches!(v, Shape::Rect(..))` return?', options: ['The inner values', 'A `bool`', 'An `Option`', 'Nothing: it is a statement'], answer: 1, explain: '`matches!` expands to a `match` that gives `true` or `false`.' },
    { q: 'Which pattern can appear in a plain `let` without `else`?', options: ['`Some(x)`', '`Ok(v)`', '`(a, b)`', '`Err(e)`'], answer: 2, explain: 'Only irrefutable patterns can be used there. A tuple pattern always matches a tuple.' },
    { q: 'In a `match`, what does a guard like `x if x < 0 =>` add?', options: ['A type annotation', 'An extra boolean condition that must hold for the arm to run', 'A loop', 'A default value'], answer: 1, explain: 'The arm matches only when the pattern matches and the guard is true. Exhaustiveness checking ignores guards, so you still need a fallback arm.' },
    { q: 'What do let chains (2024 edition) allow?', options: ['`if let Some(x) = a && x > 0 { }`', '`if let Some(x) = a || let Some(y) = b { }`', 'Chaining method calls with `let`', 'Multiple `else` blocks'], answer: 0, explain: 'Chains join `let` patterns and booleans with `&&`. `||` is not supported.' },
  ],
}
