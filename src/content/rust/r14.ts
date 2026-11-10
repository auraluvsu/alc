import type { Module } from '../types'

export const r14: Module = {
  n: 14,
  title: 'Advanced Rust',
  tour: '20 · Advanced Features',
  summary: 'Unsafe Rust, advanced traits and types, function pointers, and macros: declarative `macro_rules!` and a tour of procedural macros.',
  topics: ['Unsafe Rust', 'Advanced traits', 'Advanced types', 'Function pointers', 'Macros'],
  cpp23: [
    'In the 2024 edition `extern` blocks must be written `unsafe extern`, attributes like `no_mangle` become `#[unsafe(no_mangle)]`, `unsafe_op_in_unsafe_fn` warns by default, and taking a reference to a `static mut` is denied by default.',
    '`&raw const` and `&raw mut` create raw pointers without going through a reference, and items in an `unsafe extern` block can be marked `safe` (Rust 1.82).',
    '`std::hint::black_box`, `core::mem::offset_of!` and `MaybeUninit` helpers make low-level code and benchmarks safer to write and measure.',
    'Inline `const { }` blocks and more `const fn` in the standard library push computation to compile time (Rust 1.79 onward).',
  ],
  lessons: [
    {
      id: 'unsafe',
      title: 'Unsafe Rust',
      blocks: [
        { kind: 'analogy', text: "Safe Rust is a **building with a safety inspector at every door**. `unsafe` is a sign that says the inspector stays outside, and I personally promise that what happens in this room is safe. The room still has walls and the rest of the building is still inspected. You are not allowed to do just anything: you are given exactly five extra tools, each with rules you must follow by yourself. Good Rust keeps these rooms tiny and puts a safe door in front of each one." },
        { kind: 'code', code: `// The five "unsafe superpowers":
// 1. Dereference a raw pointer      2. Call an unsafe function or method
// 3. Access or modify a mutable static   4. Implement an unsafe trait   5. Access union fields

let mut n = 5;
let r1 = &raw const n;                  // raw pointers: *const T and *mut T (Rust 1.82 syntax)
let r2 = &raw mut n;                    // no reference is created, so no aliasing rules are tripped
unsafe {
    *r2 += 1;                           // dereferencing a raw pointer needs unsafe
    println!("{}", *r1);                // 6
}

unsafe fn dangerous(p: *const i32) -> i32 { unsafe { *p } }     // callers must uphold a contract
let v = unsafe { dangerous(r1) };

// A safe abstraction over unsafe code: split_at_mut, written by hand
use std::slice;
fn split_at_mut(values: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = values.len();
    let ptr = values.as_mut_ptr();
    assert!(mid <= len);                // the check that makes the unsafe block below sound
    // SAFETY: the two halves do not overlap, and both are within the original slice.
    unsafe {
        (slice::from_raw_parts_mut(ptr, mid), slice::from_raw_parts_mut(ptr.add(mid), len - mid))
    }
}

// Calling C: the 2024 edition spells it \`unsafe extern\`
unsafe extern "C" {
    pub safe fn abs(x: i32) -> i32;                              // declared safe: any argument is fine
    pub unsafe fn strlen(s: *const std::ffi::c_char) -> usize;   // caller must pass a valid C string
}
let a = abs(-3);                                                 // no unsafe block needed
let c = std::ffi::CString::new("hello").unwrap();
let len = unsafe { strlen(c.as_ptr()) };

// Exposing Rust to C
#[unsafe(no_mangle)]                                             // 2024: the attribute itself is unsafe
pub extern "C" fn add_ints(a: i32, b: i32) -> i32 { a + b }

// Mutable statics: a data race waiting to happen. Prefer atomics, Mutex, or OnceLock.
static mut COUNTER: u32 = 0;
unsafe { COUNTER += 1; }                                         // 2024: taking &COUNTER or printing it directly is a deny-by-default error` },
        { kind: 'list', items: [
          '`unsafe` does **not** turn off the borrow checker or type checking. It only unlocks the five operations. Everything else is checked as normal.',
          '**Your promise:** an `unsafe` block says "I have verified the preconditions the compiler cannot." **Undefined behaviour (UB)** is what you risk if you are wrong: dangling or misaligned pointers, data races, invalid values (a `bool` that is 3), broken aliasing rules (two live `&mut` to one place). UB can silently corrupt unrelated code.',
          'Write a `// SAFETY:` comment on every block explaining why it is sound, and a `# Safety` section in the docs of every `unsafe fn` stating what callers must guarantee. Clippy\'s `undocumented_unsafe_blocks` lint can enforce it.',
          '**Keep unsafe small, and wrap it in a safe API** whose public interface cannot be misused. The standard library is built this way (`Vec`, `Rc`, `Mutex`, `split_at_mut`). Your users never need to write `unsafe`.',
          'In the **2024 edition** `unsafe_op_in_unsafe_fn` warns: the body of an `unsafe fn` is not automatically an unsafe block, so each risky operation is wrapped in its own small `unsafe { }`.',
          '**Test unsafe code under Miri** (`cargo +nightly miri test`), an interpreter that detects UB such as out-of-bounds access, use-after-free and aliasing violations. Also use sanitizers and fuzzing.',
          'Reach for `unsafe` last: FFI to C libraries, hardware access, building a data structure the borrow checker cannot express, or a measured hot spot (`get_unchecked`). If a safe API exists, even slightly slower, prefer it.',
        ] },
        { kind: 'code', code: `// Other low-level tools you will meet
use std::mem::{self, MaybeUninit};

let p = Box::into_raw(Box::new(42));           // hand ownership to a raw pointer (for FFI)
let b = unsafe { Box::from_raw(p) };           // and take it back, so it is freed exactly once

let mut buf = [MaybeUninit::<u8>::uninit(); 4];   // memory that is not yet initialised, safely typed
let n = mem::size_of::<u64>();                    // 8
let off = mem::offset_of!(Header, len);           // byte offset of a field

#[repr(C)] struct Header { tag: u8, len: u32 }    // C-compatible layout (Rust's default layout is unspecified)
// mem::transmute reinterprets bits. Almost always wrong, so prefer from_le_bytes, as casts or bytemuck.

union IntOrFloat { i: u32, f: f32 }               // reading a field is unsafe: you must know which is live` },
        { kind: 'compare',
          cpp: `// the whole language is "unsafe": any pointer may dangle, any cast may lie
int* p = new int(1); delete p; *p = 2;   // undefined behaviour, compiles without a warning`,
          go: `import "unsafe"      // unsafe.Pointer: rare; the GC and bounds checks remain elsewhere`,
          python: `import ctypes       # FFI escape hatch; a wrong signature can crash the interpreter`,
          java: `sun.misc.Unsafe / Foreign Function & Memory API (Java 22)   # off-heap memory, native calls`,
          ts: `// WebAssembly or native addons for low-level work`,
          rust: `unsafe { *ptr = 2; }   // a small, visible, auditable region. Everywhere else is checked.`,
          note: 'C and C++ are unsafe by default and you search for the dangerous parts. Rust is safe by default, and `grep unsafe` finds every place that needs a human audit.' },
        { kind: 'pitfall', text: '"It works on my machine" is the most dangerous sentence in `unsafe` code. UB may behave perfectly in debug mode and break after an optimiser change or a new compiler version. Verify with Miri, document the contract and prefer well-tested crates (`bytemuck`, `zerocopy`) to hand-rolled transmutes.' },
        { kind: 'check', q: 'What does an `unsafe` block let you do that safe code cannot?', options: ['Disable the borrow checker', 'Perform one of five specific operations, such as dereferencing a raw pointer or calling an unsafe fn', 'Skip type checking', 'Use `goto`'], answer: 1, hint: 'The checks are not switched off; a few extra abilities are unlocked.', explain: 'Unsafe allows five extra operations. Borrow and type checking still apply, and you are responsible for the safety conditions.' },
      ],
    },
    {
      id: 'adv-traits',
      title: 'Advanced traits',
      blocks: [
        { kind: 'analogy', text: "Basic traits are job descriptions. The **advanced** features are the finer print: a job description that comes with its own named tools (associated types), sensible defaults for the tools (default type parameters), a way to say which department's \"report\" you mean when two departments use the same word (fully qualified syntax), and a loophole for dressing a foreign type up in your own uniform (newtype) so you may give it a job." },
        { kind: 'code', code: `// Associated types: one implementation per type, no extra generic parameter to repeat
pub trait Iterator { type Item; fn next(&mut self) -> Option<Self::Item>; }
// vs. a generic trait, which can be implemented many times for the same type
trait Convert<T> { fn convert(&self) -> T; }
impl Convert<f64> for i32 { fn convert(&self) -> f64 { *self as f64 } }
impl Convert<String> for i32 { fn convert(&self) -> String { self.to_string() } }

// Default generic parameter: Add<Rhs = Self>
use std::ops::Add;
#[derive(Debug, Clone, Copy, PartialEq)] struct Millimetres(u32);
#[derive(Debug, Clone, Copy, PartialEq)] struct Metres(u32);
impl Add for Millimetres { type Output = Millimetres; fn add(self, o: Self) -> Self { Millimetres(self.0 + o.0) } }
impl Add<Metres> for Millimetres {                          // a different right-hand side
    type Output = Millimetres;
    fn add(self, o: Metres) -> Self { Millimetres(self.0 + o.0 * 1000) }
}

// Fully qualified syntax: disambiguate identical method names
trait Pilot { fn fly(&self); }
trait Wizard { fn fly(&self); }
struct Human;
impl Pilot for Human { fn fly(&self) { println!("captain speaking"); } }
impl Wizard for Human { fn fly(&self) { println!("up!"); } }
impl Human { fn fly(&self) { println!("*waving arms*"); } }
let h = Human;
h.fly();                       // the inherent method wins
Pilot::fly(&h);                // pick a trait explicitly
<Human as Wizard>::fly(&h);    // fully qualified: <Type as Trait>::function

trait Animal { fn baby_name() -> String; }                 // associated function, no self
struct Dog;
impl Dog { fn baby_name() -> String { "Spot".into() } }
impl Animal for Dog { fn baby_name() -> String { "puppy".into() } }
let a = <Dog as Animal>::baby_name();                      // "puppy"

// Supertrait with a requirement on Display
use std::fmt;
trait OutlinePrint: fmt::Display {
    fn outline(&self) {
        let s = self.to_string();
        let w = s.len();
        println!("{}\\n* {s} *\\n{}", "*".repeat(w + 4), "*".repeat(w + 4));
    }
}

// Newtype to implement a foreign trait on a foreign type (orphan rule workaround)
struct Wrapper(Vec<String>);
impl fmt::Display for Wrapper {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { write!(f, "[{}]", self.0.join(", ")) }
}` },
        { kind: 'list', items: [
          '**Associated types vs generic parameters:** use an associated type when there is exactly one sensible choice per implementing type (`Iterator::Item`, `Deref::Target`). Use a generic parameter when a type can implement the trait several ways (`From<T>`, `Add<Rhs>`, `PartialEq<Other>`).',
          '**Default type parameters** (`trait Add<Rhs = Self>`) make the common case terse and still allow the general one. Operator traits use them to let `Millimetres + Metres` coexist with `Millimetres + Millimetres`.',
          '**Fully qualified syntax** `<Type as Trait>::method(args)` is needed when two traits or an inherent method share a name, or when a function has no `self` so the compiler cannot infer the type.',
          '**Supertraits** (`trait A: B`) let default methods in `A` call methods from `B`. They state a requirement, but do not give you subtyping or inherited data.',
          '**Newtype** wrappers also circumvent the orphan rule. The cost is delegating methods, and you can implement `Deref` on a newtype that truly is a smart wrapper. They are zero cost at run time.',
          'More power tools: **generic associated types** (GATs) for lending iterators, `where Self: Sized` to exclude methods from dyn-compatibility, `impl Trait for T where T: OtherTrait` blanket impls, and **const generics** in trait impls.',
        ] },
        { kind: 'compare',
          cpp: `template <typename T> struct Iter { using value_type = T; };   // associated types are nested typedefs
// operator overloading: free or member functions; no orphan rule, but ADL surprises`,
          go: `type Iterator[T any] interface { Next() (T, bool) }     // generics instead of associated types`,
          python: `class Shape(Protocol): ...   # no associated types; use Generic[T]`,
          java: `interface Iterator<T> { T next(); }       // generics only; no associated types`,
          ts: `interface Container<T> { first(): T }      // generics only`,
          rust: `trait Iterator { type Item; }             // associated types (and generics when needed)
<Dog as Animal>::baby_name()                 // an explicit way to choose which trait`,
          note: 'Associated types are the main thing Java and Go interfaces lack. They keep trait signatures short and inference simple.' },
        { kind: 'check', q: 'When should a trait use an associated type rather than a generic parameter?', options: ['When a type may implement the trait many times with different types', 'When there is a single logical type per implementation, like `Iterator::Item`', 'Never', 'Only for async traits'], answer: 1, hint: 'Think about `Iterator<Item = i32>` versus `From<T>`.', explain: 'An associated type fixes one choice per implementor. A generic parameter allows several implementations on the same type.' },
      ],
    },
    {
      id: 'adv-types',
      title: 'Advanced types',
      blocks: [
        { kind: 'analogy', text: "Types are the **shipping labels** on every parcel. Aliases are nicknames for a long label. The never type is the label on a parcel that is never delivered, because the courier was lost (a `panic!`). Dynamically sized types are parcels whose size is only written on the box at the last moment, so you can only handle them by the **handle** (a reference or `Box`), never by value." },
        { kind: 'code', code: `// Type aliases: a nickname, NOT a new type
type Kilometres = i32;
type Thunk = Box<dyn Fn() + Send + 'static>;
type Result<T> = std::result::Result<T, MyError>;          // the io::Result<T> trick
let x: Kilometres = 5; let y: i32 = 6; let z = x + y;        // fine: same type

// The never type !  ("diverges")
fn bar() -> ! { panic!("never returns") }
let guess: u32 = match s.parse() {
    Ok(n) => n,
    Err(_) => continue,       // \`continue\` has type !, which coerces to u32, so the arms agree
};
// loop {} has type !. process::exit has type !. unreachable!() has type !.

// Dynamically sized types (DSTs): str, [T], dyn Trait. Size known only at run time.
// let s: str = *"hi";                 // error: size cannot be known at compile time
let s: &str = "hi";                   // a reference to a DST is a "fat pointer": address + length
let b: Box<str> = "hi".into();       // owned DST behind a pointer
let t: &dyn std::fmt::Debug = &5;    // fat pointer: address + vtable

// The Sized trait: every generic parameter is T: Sized by default
fn generic<T>(t: T) {}                // means: T: Sized
fn generic_flexible<T: ?Sized>(t: &T) {}   // "maybe Sized": accepts str, [u8], dyn Trait (behind a reference)

// Zero-sized types: unit (), unit structs, PhantomData, empty arrays. They take no space.
struct Marker;
assert_eq!(std::mem::size_of::<Marker>(), 0);
assert_eq!(std::mem::size_of::<Option<Box<i32>>>(), std::mem::size_of::<Box<i32>>());   // niche optimisation

// Newtype for type safety and encapsulation
struct Meters(f64);  struct Seconds(f64);
fn speed(d: Meters, t: Seconds) -> f64 { d.0 / t.0 }       // swapping the arguments is a compile error

// impl Trait in type aliases and associated types (type_alias_impl_trait) is still unstable;
// stable alternative: name the type with Box<dyn ...> or a helper struct.` },
        { kind: 'list', items: [
          '**Type aliases** reduce repetition (`type Result<T> = std::result::Result<T, MyError>`). They create no new type and no new safety. For safety use a newtype.',
          '**The never type `!`** is the type of expressions that never produce a value (`panic!`, `loop {}`, `return`, `break`, `continue`, `exit`). Because it can coerce to any type, it fits in any `match` arm.',
          '**DSTs** (`str`, `[T]`, `dyn Trait`) can only be used behind a pointer: `&str`, `Box<[T]>`, `Rc<dyn Trait>`. The pointer carries the extra data (length or vtable): a **fat pointer** is two words.',
          '**`Sized` and `?Sized`:** the compiler adds `T: Sized` to every generic parameter. Write `T: ?Sized` when the function only uses `T` through a reference and should accept `str`, `[u8]` or `dyn Trait`.',
          '**Zero-sized types** exist and cost nothing: `HashSet<T>` is `HashMap<T, ()>`, and `PhantomData` is zero-sized. **Niche optimisation** makes `Option<&T>`, `Option<Box<T>>` and `Option<NonZeroU32>` the same size as the bare type.',
          '`#[repr(u8)]`, `#[repr(C)]`, `#[repr(transparent)]` and `#[repr(align(64))]` pin the memory layout. Without one, Rust may reorder fields to shrink a struct.',
        ] },
        { kind: 'compare',
          cpp: `using Kilometres = int;                // alias, as in Rust
[[noreturn]] void bar();               // the never type, as an attribute
// no DST concept: string_view and span are "fat pointer" structs by hand`,
          go: `type Kilometres int                    // a NEW distinct type (unlike a Rust alias); \`type K = int\` is an alias`,
          python: `Kilometres = int           # alias (a plain assignment)
def bar() -> NoReturn: ...             # typing.NoReturn is the never type`,
          java: `// no aliases; no never type; no DSTs: every object is behind a reference`,
          ts: `type Kilometres = number      // alias
function bar(): never { throw new Error() }   // never exists in TypeScript too`,
          rust: `type Kilometres = i32;         // alias
fn bar() -> ! { panic!() }
&str, &[T], &dyn Trait         // fat pointers`,
          note: 'TypeScript\'s `never` and Rust\'s `!` are the same idea: the type with no values, which is why it is allowed anywhere.' },
        { kind: 'check', q: 'Why can `Err(_) => continue` appear in a `match` whose other arm returns a `u32`?', options: ['`continue` returns zero', '`continue` has the never type `!`, which coerces to any type', 'The match ignores types', 'It does not compile'], answer: 1, hint: 'It never produces a value.', explain: 'Expressions that diverge have type `!`, which can be converted to any type, so the arms agree.' },
      ],
    },
    {
      id: 'fn-pointers',
      title: 'Function pointers and returning closures',
      blocks: [
        { kind: 'analogy', text: "A closure is a **tool you built with your own supplies**. A function pointer is a **page number in a manual**: it names a procedure, but carries nothing of its own with it. Many places that want a tool will accept either, because the manual page can pretend to be a closure that captures nothing. The reverse is not true: a tool that captures supplies cannot be reduced to a page number." },
        { kind: 'code', code: `fn add_one(x: i32) -> i32 { x + 1 }

fn do_twice(f: fn(i32) -> i32, arg: i32) -> i32 { f(arg) + f(arg) }     // f: a function pointer (lowercase fn)
println!("{}", do_twice(add_one, 5));                                    // 12
println!("{}", do_twice(|x| x * 3, 5));                                  // a non-capturing closure coerces to fn

// fn pointers implement Fn, FnMut and FnOnce, so a generic bound accepts them too
fn apply<F: Fn(i32) -> i32>(f: F) -> i32 { f(1) }
apply(add_one); apply(|x| x + 1);
// Prefer F: Fn(...) in your own APIs. Use fn(...) when talking to C or when you need a plain pointer.

// Names of functions and tuple-struct / enum-variant constructors are functions too
let strs: Vec<String> = vec![1, 2, 3].iter().map(ToString::to_string).collect();
#[derive(Debug)] enum Status { Value(u32), Stop }
let list: Vec<Status> = (0u32..3).map(Status::Value).collect();         // the variant is a fn(u32) -> Status

// Returning closures: impl Fn (one type) or Box<dyn Fn> (several)
fn make_adder(n: i32) -> impl Fn(i32) -> i32 { move |x| x + n }
fn make_op(kind: &str) -> Box<dyn Fn(i32, i32) -> i32> {
    match kind { "add" => Box::new(|a, b| a + b), "mul" => Box::new(|a, b| a * b), _ => Box::new(|_, _| 0) }
}

// A table of handlers keyed by name
use std::collections::HashMap;
let mut table: HashMap<&str, fn(f64) -> f64> = HashMap::new();
table.insert("sqrt", f64::sqrt);
table.insert("neg", |x| -x);
let r = table["sqrt"](16.0);                                            // 4.0

// extern "C" function pointers for callbacks into C
extern "C" fn on_event(code: i32) { println!("event {code}"); }
let cb: extern "C" fn(i32) = on_event;
cb(7);` },
        { kind: 'list', items: [
          '`fn(i32) -> i32` (lowercase) is a **type**: a pointer to a function. `Fn(i32) -> i32` is a **trait**: anything callable that way. A function pointer implements all three `Fn*` traits, so it can be passed anywhere a closure is expected.',
          'Only **closures that capture nothing** convert to a `fn` pointer. If a closure uses a local variable it needs `Fn`/`impl Fn`/`Box<dyn Fn>`.',
          '**Prefer generics bounded by `Fn`** in your own APIs: they inline and accept captures. Use `fn(...)` for C interop, static tables of handlers, and when you need a `Copy`, `Eq`, `Hash`-able pointer.',
          'Enum variants and tuple structs are **constructor functions**: `.map(Some)`, `.map(Status::Value)`, `.map(String::from)`, `.map(Box::new)`. It reads well and avoids a closure.',
          'To return a closure use `impl Fn...` for one concrete closure, or `Box<dyn Fn...>` when you return different closures from different branches or store them in collections (module 9).',
          'Function pointers in a `static` table (`static OPS: [(&str, fn(f64) -> f64); 2] = [...]`) give a cheap, allocation-free dispatch for fixed command sets.',
        ] },
        { kind: 'compare',
          cpp: `int (*fp)(int) = add_one;               // C function pointers
std::function<int(int)> f = [=](int x) { return x + n; };   // type-erased, may allocate`,
          go: `var f func(int) int = addOne            // one function type covers named functions and closures`,
          python: `f = add_one                              # functions are objects; no distinction`,
          java: `Function<Integer,Integer> f = Main::addOne;   // method references`,
          ts: `const f: (x: number) => number = addOne`,
          rust: `let f: fn(i32) -> i32 = add_one;       // pointer, no captures
let g = move |x| x + n;                  // closure: carries n`,
          note: 'Go has a single function type, but Rust separates the zero-state pointer (`fn`) from capturing closures (`Fn*`), which is why a `fn` is a plain pointer for C interop.' },
        { kind: 'check', q: 'Which of these converts to `fn(i32) -> i32`?', options: ['`|x| x + n` where `n` is a local', '`|x| x * 2`', '`move |x| x + n`', 'A `Box<dyn Fn(i32) -> i32>`'], answer: 1, hint: 'It must capture nothing.', explain: 'Only non-capturing closures coerce to function pointers. The others carry state and need `Fn` traits.' },
      ],
    },
    {
      id: 'macros',
      title: 'Macros',
      blocks: [
        { kind: 'analogy', text: "A function runs at **run time** on values. A macro runs at **compile time** on code: it is a **rubber stamp with blanks** that expands into real source before the compiler checks it. `macro_rules!` is a stamp you carve by showing the shapes of input it accepts and the code to produce. Procedural macros are a **tiny program you write that reads code and writes code**, like the `#[derive(Debug)]` you have been using since module 3." },
        { kind: 'code', code: `// Declarative macro: pattern => template
macro_rules! hashmap {
    // zero or more "key => value" pairs separated by commas, with an optional trailing comma
    ($($k:expr => $v:expr),* $(,)?) => {{
        let mut m = ::std::collections::HashMap::new();
        $( m.insert($k, $v); )*              // the template repeats once per matched pair
        m
    }};
}
let prices = hashmap! { "XAU" => 2390.5, "EUR" => 1.08, };

macro_rules! square { ($x:expr) => { $x * $x }; }       // careful: square!(1 + 2) = (1 + 2) * (1 + 2) here,
                                                         // because $x:expr is parsed as a whole expression: 9

// Several arms, like match, and recursion
macro_rules! max {
    ($x:expr) => { $x };
    ($x:expr, $($rest:expr),+) => {{ let a = $x; let b = max!($($rest),+); if a > b { a } else { b } }};
}
let m = max!(3, 9, 4);        // 9

// Generate repetitive items
macro_rules! make_struct {
    ($name:ident { $($field:ident : $ty:ty),* }) => {
        #[derive(Debug, Default)] struct $name { $($field: $ty),* }
    };
}
make_struct!(Quote { bid: f64, ask: f64, sym: String });

// Fragment types: expr, ident, ty, pat, stmt, block, item, path, tt (any single token tree), literal, lifetime, vis, meta` },
        { kind: 'stepper', title: 'How hashmap! expands', code: [
          'hashmap! { "a" => 1, "b" => 2 }',
          '// pattern: $( $k:expr => $v:expr ),*',
          '// $k = "a", $v = 1   then   $k = "b", $v = 2',
          '// template: $( m.insert($k, $v); )*',
        ], steps: [
          { line: 1, note: 'The compiler sees a macro call and looks for the macro by name. It does not parse the tokens as a function call.', memory: [{ name: 'input', value: '"a" => 1, "b" => 2' }] },
          { line: 2, note: 'The matcher tries each arm. `$( ... ),*` means "the group inside, repeated zero or more times, separated by commas".', memory: [{ name: 'pattern', value: '$k:expr => $v:expr' }] },
          { line: 3, note: 'Two repetitions matched. Each binds a fresh `$k` and `$v` to an expression.', memory: [{ name: 'rep #1', value: '$k = "a", $v = 1' }, { name: 'rep #2', value: '$k = "b", $v = 2' }] },
          { line: 4, note: 'The transcriber repeats the template once per match, so the call expands into `let mut m = HashMap::new(); m.insert("a", 1); m.insert("b", 2); m`. Only then is the code type-checked.', memory: [{ name: 'expanded', value: 'm.insert("a", 1); m.insert("b", 2);', kind: 'heap' }] },
        ] },
        { kind: 'code', caption: 'Procedural macros: a derive macro in its own crate.', code: `// my_derive/Cargo.toml:   [lib] proc-macro = true     deps: syn, quote
// my_derive/src/lib.rs
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(Describe)]
pub fn derive_describe(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);      // parse the struct or enum definition
    let name = &ast.ident;
    quote! {                                                  // generate code as tokens
        impl Describe for #name {
            fn describe(&self) -> String { format!("I am a {}", stringify!(#name)) }
        }
    }.into()
}

// In an application crate
#[derive(Describe)]
struct Trade;
// Trade.describe() == "I am a Trade"

// The three kinds of procedural macro:
// #[derive(Name)]        custom derive: attach to a struct/enum, generate impls (serde::Serialize)
// #[route(GET, "/")]     attribute-like: transforms the item it is attached to (tokio::main, test)
// sql!(SELECT * FROM t)  function-like: looks like macro_rules! but is arbitrary Rust code` },
        { kind: 'list', items: [
          '**Macros vs functions:** macros take a **variable number** of arguments (`println!`), generate **items** (structs, impls, tests), and can inspect code **syntactically**. Functions are easier to write, read, debug and type-check. Reach for a macro only when a function or generic cannot do the job.',
          '**Hygiene:** local variables introduced inside a `macro_rules!` template (`m` above) do not clash with the caller\'s variables of the same name. But paths do resolve at the call site, so use `$crate::` and absolute paths (`::std::...`) inside exported macros.',
          '**Fragment gotcha:** `$x:expr` captures a complete expression, so `square!(1 + 2)` is `(1 + 2) * (1 + 2)`, not `1 + 2 * 1 + 2`. That is the opposite of C preprocessor macros, which paste text and need parentheses everywhere.',
          '**Procedural macros** run arbitrary Rust at compile time. Use `syn` to parse, `quote` to generate and `proc-macro2` to test. Common ones: `serde` derives, `clap` derive, `thiserror`, `tokio::main`, `sqlx::query!`, `tracing::instrument`.',
          'Debug with `cargo expand` (shows the expanded code) and `trybuild` (tests that macros give the right compile errors). Good error spans (`syn::Error::new_spanned`) make macros pleasant to use.',
          'Cost: macros slow compilation, obscure error messages and are hard for tools to understand. A small amount of well-chosen macro use is great. Heavy macro metaprogramming usually is not.',
        ] },
        { kind: 'compare',
          cpp: `#define SQUARE(x) ((x) * (x))   // text substitution: no hygiene, no types, classic pitfalls
// templates, constexpr and (future) reflection are the proper tools`,
          go: `// no macros: go generate and code generators produce source files`,
          python: `# decorators and metaclasses transform code at import time, at run time`,
          java: `// annotation processors (Lombok, Dagger, MapStruct) generate code at compile time`,
          ts: `// no macros: decorators (runtime), code generators, and compiler plugins`,
          rust: `macro_rules! square { ($x:expr) => { $x * $x }; }    // hygienic, token-based
#[derive(Serialize)] struct S;                         // procedural: real Rust code at compile time`,
          note: 'Rust macros operate on syntax trees, not text, so they avoid the preprocessor\'s classic bugs. Procedural macros fill the role of Java\'s annotation processors, but are written in Rust itself.' },
        { kind: 'pitfall', text: 'Writing a `macro_rules!` to avoid typing a few lines usually ends in cryptic errors for everyone who calls it. Try a generic function, a closure, or a helper trait first. If you do write a macro, write a function underneath and let the macro be a thin wrapper.' },
        { kind: 'check', q: 'What does `$( m.insert($k, $v); )*` do in a `macro_rules!` template?', options: ['Loops at run time', 'Repeats the enclosed code once for each repetition matched in the pattern, at compile time', 'Inserts into a HashMap once', 'Declares a function'], answer: 1, hint: '`$( ... )*` is a repetition, and macros run at compile time.', explain: 'The transcriber emits the group once per matched `$k`/`$v` pair, producing straight-line code before type checking.' },
        { kind: 'check', q: 'Which kind of procedural macro is `#[derive(Debug)]`?', options: ['Function-like', 'Attribute-like', 'Custom derive', 'Declarative'], answer: 2, hint: 'It is attached to a struct or enum and generates an `impl`.', explain: 'Derive macros receive the item\'s definition and generate extra items such as trait impls.' },
      ],
    },
  ],
  quiz: [
    { q: 'Which of these is NOT one of the five unsafe superpowers?', options: ['Dereference a raw pointer', 'Call an unsafe function', 'Disable the borrow checker', 'Access a mutable static'], answer: 2, explain: 'The borrow checker stays on in unsafe blocks. Unsafe only unlocks five extra operations.' },
    { q: 'What is the recommended way to use unsafe code?', options: ['Spread it through the program for speed', 'Keep it small and wrap it in a safe API that cannot be misused', 'Avoid documenting it', 'Use it in place of generics'], answer: 1, explain: 'Encapsulate: a sound safe abstraction means users never write unsafe themselves.' },
    { q: 'What tool detects undefined behaviour in Rust unit tests?', options: ['Clippy', 'Miri', 'rustfmt', 'cargo doc'], answer: 1, explain: 'Miri interprets MIR and reports out-of-bounds access, use-after-free and aliasing violations.' },
    { q: 'What does the 2024 edition require for `extern "C" { ... }` blocks?', options: ['Nothing', 'They must be written `unsafe extern "C" { ... }`', 'They are removed', 'They need `async`'], answer: 1, explain: 'The `unsafe` keyword makes explicit that the declarations are promises about foreign code.' },
    { q: 'When should a trait use an associated type?', options: ['When a type may implement it many times', 'When there is one natural choice per implementor, such as `Iterator::Item`', 'Never', 'Only in macros'], answer: 1, explain: 'Associated types fix one type per impl, and generic parameters allow several.' },
    { q: 'What does `<Dog as Animal>::baby_name()` do?', options: ['Calls `Dog`\'s inherent method', 'Calls the `Animal` trait\'s implementation for `Dog`', 'Casts a `Dog` to an `Animal`', 'Creates a Dog'], answer: 1, explain: 'Fully qualified syntax picks the trait\'s function explicitly.' },
    { q: 'Which statement about type aliases is true?', options: ['They create a new distinct type', 'They are only another name for the same type', 'They enforce units', 'They are runtime wrappers'], answer: 1, explain: 'For distinct types use a newtype struct.' },
    { q: 'What is the type of `panic!()`?', options: ['`()`', '`!` (never), which coerces to any type', '`Result`', '`Option`'], answer: 1, explain: 'Diverging expressions have type `!`.' },
    { q: 'Which closure converts to a `fn(i32) -> i32` pointer?', options: ['`move |x| x + n` capturing `n`', '`|x| x * 2` with no captures', 'Any closure', 'A boxed closure'], answer: 1, explain: 'Only non-capturing closures can become plain function pointers.' },
    { q: 'What is the main difference between a macro and a function?', options: ['Macros are faster at run time', 'Macros run at compile time on syntax and can take variable arguments or generate items', 'Macros cannot be recursive', 'There is no difference'], answer: 1, explain: 'Macros expand into code before type checking, which allows things functions cannot do.' },
  ],
}
