import type { Module } from '../types'

export const r09: Module = {
  n: 9,
  title: 'Closures and Iterators',
  tour: '13 · Functional Language Features',
  summary: 'Closures and how they capture, the `Fn` traits, the `Iterator` trait, adapters and consumers, and zero-cost abstraction.',
  topics: ['Closures', 'Fn, FnMut & FnOnce', 'Iterator trait', 'Adapters & consumers', 'Zero-cost abstraction'],
  cpp23: [
    'Async closures: `async |x| { ... }` and the `AsyncFn`, `AsyncFnMut` and `AsyncFnOnce` traits (Rust 1.85).',
    'Disjoint closure captures: a closure captures only the fields it uses, not the whole struct (2021 edition onward).',
    '`Iterator::is_sorted`, `std::iter::repeat_n` and `slice::chunk_by` (Rust 1.82 and 1.77).',
    '`Option::is_none_or`, `Iterator::map_while`, and `std::array::from_fn` fill out the toolbox for functional style.',
  ],
  lessons: [
    {
      id: 'closures',
      title: 'Closures',
      blocks: [
        { kind: 'analogy', text: "A closure is a **sticky note with instructions that remembers where it was written**. \"Add the tax rate to this price\" is a function, but \"add the tax rate we have right now to this price\" is a closure: it carries a copy (or a loan) of `tax_rate` with it wherever it goes. You can hand the note to somebody else, and it still works." },
        { kind: 'code', code: `let tax = 0.2;
let add_tax = |price: f64| price * (1.0 + tax);          // captures \`tax\` by reference
let double = |x| x * 2;                                    // types inferred from first use
let verbose = |x: i32| -> i32 { let y = x + 1; y * y };   // block body

println!("{}", add_tax(100.0));                            // 120.0

let mut count = 0;
let mut bump = || { count += 1; count };                   // captures count by mutable reference
bump(); bump();
println!("{count}");                                       // 2 (the borrow ended after the last call)

let name = String::from("ALC");
let greet = move || println!("hello {name}");              // \`move\`: takes ownership of captures
greet();
// println!("{name}");                                     // error: name was moved into the closure

let words = vec!["bb", "a", "ccc"];
let mut sorted = words.clone();
sorted.sort_by_key(|w| w.len());                           // closures as arguments
let longest = words.iter().max_by_key(|w| w.len());` },
        { kind: 'list', items: [
          'Syntax: `|params| expr` or `|params| { ... }`. Parameter and return types are inferred, but fixed after the first use, so `let id = |x| x; id(1); id("a")` fails.',
          'A closure **captures** variables from its environment in the lightest way it can: shared borrow if it only reads, mutable borrow if it modifies, move/copy if it consumes the value. `move` forces ownership, which is required when the closure outlives the scope (threads, returned closures).',
          'Every closure has its **own unnameable type**. You refer to it through a generic bound (`F: Fn(i32) -> i32`) or `impl Fn`, or box it (`Box<dyn Fn(i32) -> i32>`).',
          'Since the 2021 edition closures capture **disjoint fields**: using `self.a` in a closure does not borrow `self.b`, so `self.items.iter().map(|x| x * self.scale)` works.',
          'A closure that captures nothing coerces to a plain function pointer `fn(i32) -> i32`, which is what C APIs expect.',
          'Method references: you can pass a function or a method where a closure is expected: `.map(str::trim)`, `.filter(Option::is_some)`, `.map(String::from)`, `.for_each(drop)`.',
        ] },
        { kind: 'compare',
          cpp: `auto add_tax = [tax](double p) { return p * (1 + tax); };   // explicit capture list: [=], [&], [x], [&x]
int n = 0; auto bump = [&n] { return ++n; };`,
          go: `addTax := func(p float64) float64 { return p * (1 + tax) }   // captures by reference, always
bump := func() int { n++; return n }`,
          python: `add_tax = lambda p: p * (1 + tax)   # captures variables by name (late binding surprises)`,
          java: `DoubleUnaryOperator addTax = p -> p * (1 + tax);   // captured variables must be effectively final`,
          ts: `const addTax = (p: number) => p * (1 + tax)   // captures by reference, and sees later changes`,
          rust: `let add_tax = |p: f64| p * (1.0 + tax);   // capture mode is inferred and checked by the borrow checker`,
          note: 'C++ makes you list captures, and Java forbids mutation. Rust infers the capture mode and uses the borrow rules to keep it safe, so you get neither dangling references nor surprising late binding.' },
        { kind: 'check', q: 'What does the `move` keyword do on a closure?', options: ['Makes it run on another thread', 'Makes the closure take ownership of the variables it uses', 'Makes it a function pointer', 'Moves the closure to the heap'], answer: 1, hint: 'Think of what a thread needs.', explain: '`move` captures by value (moving or copying), so the closure does not borrow from the enclosing scope and can outlive it.' },
      ],
    },
    {
      id: 'fn-traits',
      title: 'Fn, FnMut and FnOnce',
      blocks: [
        { kind: 'analogy', text: "Three kinds of recipe card. **`Fn`** can be cooked over and over without changing anything, like a cold salad. **`FnMut`** changes the kitchen each time it runs, like a recipe that uses up part of a shared jar. **`FnOnce`** uses an ingredient that no longer exists after the first go: you can only cook it once. A function that accepts a card must say which kind it needs." },
        { kind: 'code', code: `fn call_twice<F: Fn(i32) -> i32>(f: F) -> i32 { f(1) + f(2) }         // can call many times, shared
fn run_counter<F: FnMut()>(mut f: F) { f(); f(); }                     // may mutate captured state
fn consume<F: FnOnce() -> String>(f: F) -> String { f() }              // may move captures out; call once

let k = 10;
call_twice(|x| x + k);                      // only reads k: Fn

let mut log = Vec::new();
run_counter(|| log.push("tick"));           // mutates log: FnMut

let owned = String::from("hi");
consume(move || owned);                     // returns the captured String: FnOnce

// Storing and returning closures
fn adder(n: i32) -> impl Fn(i32) -> i32 { move |x| x + n }             // static: one concrete closure type
fn pick(neg: bool) -> Box<dyn Fn(i32) -> i32> {                         // dynamic: different closures
    if neg { Box::new(|x| -x) } else { Box::new(|x| x) }
}

struct Button { on_click: Box<dyn FnMut()> }                             // a callback field
let mut presses = 0;
let mut b = Button { on_click: Box::new(move || { presses += 1; println!("{presses}"); }) };
(b.on_click)();` },
        { kind: 'list', items: [
          'The traits form a chain: every `Fn` is also `FnMut`, and every `FnMut` is also `FnOnce`. So **accept the most general bound that works**: `FnOnce` if you call it once, `FnMut` if several times with mutation, `Fn` if the callee needs to call it repeatedly through a shared reference or concurrently.',
          'The compiler picks which traits a closure implements from **what the body does**, not from how it is written. Reading captured data gives `Fn`, modifying gives `FnMut`, and moving a captured value out gives only `FnOnce`.',
          '`move` affects how things are captured, but not which trait the closure implements. A `move` closure that only reads its owned data is still `Fn`.',
          '`impl Fn` is static dispatch with no allocation. `Box<dyn Fn>` is dynamic, needed for heterogeneous collections, struct fields, or choosing a closure at run time.',
          'Function pointers `fn(i32) -> i32` implement all three traits, so a plain function can go anywhere a closure is expected.',
          'In the standard library, `thread::spawn` takes `FnOnce + Send + \'static`, `Iterator::map` takes `FnMut`, `Option::map` takes `FnOnce`, and `sort_by_key` takes `FnMut`.',
        ] },
        { kind: 'new23', text: 'Async closures (Rust 1.85) can borrow from their captures across `.await` points, which a closure returning an `async` block cannot. They have their own traits: `AsyncFn`, `AsyncFnMut` and `AsyncFnOnce`.' },
        { kind: 'code', code: `async fn retry<F>(mut f: F, n: u32) -> Option<u32> where F: AsyncFnMut() -> Option<u32> {
    for _ in 0..n {
        if let Some(v) = f().await { return Some(v); }
    }
    None
}

let mut tries = 0;
let got = retry(async || { tries += 1; (tries == 3).then_some(tries) }, 5).await;   // borrows tries across awaits` },
        { kind: 'compare',
          cpp: `template <typename F> int call(F&& f);      // any callable, constrained by concepts if you add them
std::function<int(int)> g = [](int x) { return x; };   // type-erased: allocates, always dynamic`,
          go: `func call(f func(int) int) int { return f(1) }   // func types: always dynamic`,
          python: `def call(f): return f(1)   # anything callable`,
          java: `static int call(IntUnaryOperator f) { return f.applyAsInt(1); }   // functional interfaces: dynamic`,
          ts: `function call(f: (x: number) => number) { return f(1) }`,
          rust: `fn call<F: Fn(i32) -> i32>(f: F) -> i32 { f(1) }   // static, inlinable
fn call_dyn(f: &dyn Fn(i32) -> i32) -> i32 { f(1) }   // dynamic, when needed`,
          note: 'Rust distinguishes callables that may be called once, mutably, or shared. That is what keeps callbacks memory-safe without a garbage collector.' },
        { kind: 'pitfall', text: 'If a closure `move`s a captured `String` out (returns it), it is `FnOnce`, and passing it to a function that needs `Fn` fails with "expected a closure that implements `Fn`, but this closure only implements `FnOnce`". Clone the value inside, or return a reference.' },
        { kind: 'check', q: 'A closure pushes to a captured `Vec`. Which trait does it implement (at minimum)?', options: ['`Fn`', '`FnMut`', '`FnOnce` only', 'None'], answer: 1, hint: 'It changes captured state, but does not consume it.', explain: 'Mutating a captured variable requires `FnMut`. It also implements `FnOnce`, but not `Fn`.' },
        { kind: 'check', q: 'What is the right return type for a function that returns one of two different closures chosen at run time?', options: ['`impl Fn(i32) -> i32`', '`Box<dyn Fn(i32) -> i32>`', '`fn`', 'Both closures cannot be returned'], answer: 1, hint: 'Each closure has its own concrete type.', explain: '`impl Trait` stands for a single concrete type. Two closures differ, so box them as trait objects.' },
      ],
    },
    {
      id: 'iterator',
      title: 'The Iterator trait',
      blocks: [
        { kind: 'analogy', text: "An iterator is a **conveyor belt with a lazy worker**. Nothing moves until someone at the end asks for the next item (`next()`). Each station on the belt (map, filter) only does work on an item when it is asked for. And the belt can stop early: if you only want three items, the factory never makes the fourth." },
        { kind: 'code', code: `pub trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;        // the only required method
    // ... ~75 provided methods (map, filter, sum, collect, ...) built on top of next
}

let v = vec![10, 20, 30];
let mut it = v.iter();                // yields &i32
assert_eq!(it.next(), Some(&10));
assert_eq!(it.next(), Some(&20));
assert_eq!(it.next(), Some(&30));
assert_eq!(it.next(), None);          // exhausted

// Three ways to get an iterator from a collection
for x in &v {}                        // v.iter():      borrow each element (&T)
for x in v.iter_mut() {}              // iter_mut():    mutable borrow of each (&mut T) (needs mut v)
for x in v {}                         // into_iter():   take ownership of each (T); v is moved

// Implementing Iterator for your own type
struct Countdown(u32);
impl Iterator for Countdown {
    type Item = u32;
    fn next(&mut self) -> Option<u32> {
        if self.0 == 0 { None } else { self.0 -= 1; Some(self.0 + 1) }
    }
}
let c: Vec<u32> = Countdown(3).collect();      // [3, 2, 1]
let big: u32 = Countdown(5).filter(|n| n % 2 == 1).sum();   // all the adapters work for free` },
        { kind: 'list', items: [
          '`for x in iterable` calls `into_iter()` and then `next()` until `None`. A `for` loop is the standard way to consume an iterator.',
          '`iter()`, `iter_mut()` and `into_iter()` differ in **ownership of the items**: shared refs, mutable refs, or owned values. For `&v`, `&mut v` and `v`, `for` picks the right one.',
          'Iterators are **lazy**: adapters like `map` and `filter` do nothing until a **consumer** like `collect`, `sum` or a `for` loop drives them. The compiler warns with `#[must_use]` if you create an adapter and drop it.',
          'Implement `IntoIterator` for your collection to make `for x in &my_coll` work. Implement `FromIterator` so `.collect::<MyColl>()` works, and `Extend` for `.extend(...)`.',
          '`DoubleEndedIterator` adds `next_back` (so `.rev()` works), `ExactSizeIterator` gives `len()`, and `Peekable` lets you look ahead one item.',
          'Free functions create iterators from scratch: `std::iter::repeat(x)`, `repeat_n(x, n)`, `once(x)`, `empty()`, `from_fn(|| ...)`, `successors(first, |prev| next)`, and `array::from_fn(|i| ...)`.',
        ] },
        { kind: 'stepper', title: 'Lazy evaluation, one item at a time', code: [
          'let r: Vec<i32> = (1..10)',
          '    .map(|x| x * 2)',
          '    .filter(|x| x % 3 == 0)',
          '    .take(2)',
          '    .collect();',
        ], steps: [
          { line: 1, note: 'A range is an iterator. No numbers exist yet, only a start and an end.', memory: [{ name: 'range', value: '1..10 (at 1)' }] },
          { line: 2, note: '`map` wraps the range. Still no work has been done. The same for `filter` and `take` on the next lines: the pipeline is just a nested value.', memory: [{ name: 'pipeline', value: 'Take<Filter<Map<Range>>>', kind: 'heap' }] },
          { line: 5, note: '`collect` starts pulling. 1 becomes 2 (not divisible by 3: dropped). 2 becomes 4 (dropped). 3 becomes 6: kept.', memory: [{ name: 'pulled', value: '1,2,3' }, { name: 'out', value: '[6]', kind: 'heap' }] },
          { line: 5, note: 'Continue: 4 becomes 8, 5 becomes 10, 6 becomes 12: kept. `take(2)` is satisfied, so the pipeline **stops**. Items 7, 8 and 9 are never produced.', memory: [{ name: 'pulled', value: '1..6' }, { name: 'out', value: '[6, 12]', kind: 'heap' }] },
        ] },
        { kind: 'compare',
          cpp: `for (auto& x : v) {}                                       // range-for
auto r = v | std::views::transform(f) | std::views::filter(p);   // C++20 ranges: lazy views`,
          go: `for _, x := range v {}
for x := range seq {}              // Go 1.23 iterator functions (range-over-func)`,
          python: `for x in v: ...
it = (x * 2 for x in v if x > 0)   # a lazy generator expression`,
          java: `v.stream().map(f).filter(p).toList();   // streams are lazy, but single-use`,
          ts: `[...v].map(f).filter(p)         // eager: builds an array at each step
function* gen() { yield 1 }          // generators for laziness`,
          rust: `v.iter().map(f).filter(p).collect::<Vec<_>>()   // lazy, and compiled to one loop`,
          note: 'Rust iterators are the lazy pipelines of Java streams and Python generators, but statically typed and fully inlinable, so they cost the same as a hand-written loop.' },
        { kind: 'check', q: 'What does `let it = v.iter().map(|x| x * 2);` do by itself?', options: ['Doubles every element', 'Nothing yet: it builds a lazy iterator that does no work until consumed', 'Panics', 'Allocates a new Vec'], answer: 1, hint: 'Iterators are lazy.', explain: 'Adapters only describe the computation. A consumer such as `collect`, `sum` or `for` runs it.' },
        { kind: 'check', q: 'Which loop consumes the vector (moves it)?', options: ['`for x in &v`', '`for x in v.iter()`', '`for x in v`', '`for x in v.iter_mut()`'], answer: 2, hint: 'Look at which form does not borrow.', explain: '`for x in v` calls `into_iter()` on the owned `Vec`, yielding owned items and moving `v`.' },
      ],
    },
    {
      id: 'adapters',
      title: 'Adapters and consumers',
      blocks: [
        { kind: 'analogy', text: "Adapters are the **stations on the conveyor** (cut, filter, label), and consumers are the **packing table at the end** (count them, add them up, put them in a box). You compose the stations like Lego, and the whole line is checked by the compiler for compatible plugs." },
        { kind: 'code', code: `let nums = vec![1, 2, 3, 4, 5, 6];
let words = vec!["apple", "bob", "cat"];

// Adapters: lazy, return another iterator
let a = nums.iter().map(|x| x * x);                       // transform
let b = nums.iter().filter(|x| **x % 2 == 0);             // keep some
let c = nums.iter().enumerate();                          // (index, item)
let d = nums.iter().zip(words.iter());                    // pair up, stops at the shorter
let e = nums.iter().skip(1).step_by(2).take(2);           // 2, 4
let f = nums.iter().rev();                                // reverse (double-ended)
let g = words.iter().flat_map(|w| w.chars());             // map, then flatten
let h = vec![vec![1], vec![2, 3]].into_iter().flatten();  // flatten nested
let i = nums.iter().take_while(|x| **x < 4);              // 1,2,3
let j = nums.iter().copied().scan(0, |acc, x| { *acc += x; Some(*acc) });   // running sum
let k = nums.iter().chain([7, 8].iter());                 // concatenate
let l = nums.iter().inspect(|x| eprintln!("saw {x}"));    // peek for debugging
let mut m = nums.iter().peekable();                       // look ahead: m.peek()

// Consumers: run the pipeline and produce a value
let total: i32 = nums.iter().sum();
let count = nums.iter().filter(|x| **x > 2).count();
let biggest = nums.iter().max();                          // Option<&i32>
let best = words.iter().max_by_key(|w| w.len());
let found = nums.iter().find(|x| **x > 3);                // first match: Option<&i32>
let at = nums.iter().position(|x| *x == 4);               // Option<usize>
let any = nums.iter().any(|x| *x > 5);   let all = nums.iter().all(|x| *x > 0);
let folded = nums.iter().fold(String::new(), |acc, n| format!("{acc}{n}"));   // "123456"
let (evens, odds): (Vec<i32>, Vec<i32>) = nums.iter().partition(|x| **x % 2 == 0);
let (xs, ys): (Vec<_>, Vec<_>) = [(1, 'a'), (2, 'b')].into_iter().unzip();
let sorted = nums.is_sorted();                            // stable since Rust 1.82
let v2: Vec<i32> = a.collect();
let s: String = words.iter().map(|w| w.to_uppercase()).collect::<Vec<_>>().join("-");
let m: std::collections::HashMap<&str, usize> = words.iter().map(|w| (*w, w.len())).collect();
let r: Result<Vec<u8>, _> = ["1", "2"].iter().map(|s| s.parse::<u8>()).collect();` },
        { kind: 'list', items: [
          '**`collect()`** is the most versatile consumer: it builds a `Vec`, `String`, `HashMap`, `HashSet`, `BTreeMap`, `Result<Vec<_>, _>`, `Option<Vec<_>>` or anything implementing `FromIterator`. Tell the compiler the target type with an annotation or turbofish: `collect::<Vec<_>>()`.',
          '`iter()` yields references, so you often see `**x` or `.copied()` / `.cloned()` to get values. `into_iter()` on an owned `Vec` yields values directly.',
          '`map` takes `FnMut`, so it may keep state, but prefer pure functions. For side effects, use a `for` loop or `for_each`, which signals intent more clearly.',
          '`filter_map(f)` combines filter and map when `f` returns `Option`. `find_map`, `flat_map` and `map_while` are variants. `fold` and `try_fold` are the general reducers, and `reduce` has no initial value.',
          '`sum` and `product` need a type: `let s: f64 = xs.iter().sum();` or `sum::<f64>()`. `min` and `max` need `Ord`, so floats use `fold(f64::NAN, f64::max)` or `max_by(|a, b| a.total_cmp(b))`.',
          '`windows(n)` and `chunks(n)` are **slice** methods that return iterators of overlapping or disjoint sub-slices. `chunk_by` groups consecutive equal items (Rust 1.77).',
        ] },
        { kind: 'code', code: `// A realistic pipeline: VWAP of trades above a size, by symbol
use std::collections::HashMap;
struct Trade { sym: &'static str, px: f64, qty: f64 }

fn vwap_by_symbol(trades: &[Trade], min_qty: f64) -> HashMap<&'static str, f64> {
    let mut sums: HashMap<&str, (f64, f64)> = HashMap::new();        // (notional, qty)
    for t in trades.iter().filter(|t| t.qty >= min_qty) {
        let e = sums.entry(t.sym).or_default();
        e.0 += t.px * t.qty;
        e.1 += t.qty;
    }
    sums.into_iter().map(|(s, (n, q))| (s, n / q)).collect()
}

// Returns from prices: windows + map + collect
fn returns(px: &[f64]) -> Vec<f64> { px.windows(2).map(|w| w[1] / w[0] - 1.0).collect() }` },
        { kind: 'compare',
          cpp: `std::accumulate(v.begin(), v.end(), 0);   // algorithms on iterator pairs
auto r = v | std::views::filter(p) | std::ranges::to<std::vector>();   // C++23 ranges::to`,
          go: `// slices.Collect, maps.Keys etc. since 1.23, but no map/filter chain in the standard library`,
          python: `sum(x for x in v if x > 0)
list(map(f, filter(p, v)))
[f(x) for x in v if p(x)]`,
          java: `v.stream().filter(p).map(f).collect(Collectors.toList());`,
          ts: `v.filter(p).map(f).reduce((a, b) => a + b, 0)`,
          rust: `v.iter().filter(p).map(f).sum::<i32>()`,
          note: 'Rust has the full set of functional operations in the standard library, with the performance of the loop you would otherwise write.' },
        { kind: 'pitfall', text: 'Annotation errors like "type annotations needed" after `.collect()` or `.sum()` just mean the compiler cannot guess the target. Add `::<Vec<_>>` or a typed `let`. And writing `v.iter().map(f);` as a statement does nothing at all (the warning "unused `Map` that must be used" tells you).' },
        { kind: 'check', q: 'What is the type of `nums.iter().filter(|x| **x > 2).count()`?', options: ['`Vec<i32>`', '`usize`', '`i32`', '`Option<usize>`'], answer: 1, hint: 'It counts items.', explain: '`count` consumes the iterator and returns the number of items as `usize`.' },
        { kind: 'check', q: 'Why do you need a type annotation for `let v = it.collect();`?', options: ['`collect` is unsafe', '`collect` can build many collection types, and the compiler cannot guess which', 'Iterators have no type', 'It is a naming rule'], answer: 1, hint: 'Vec, HashSet, String, Result...', explain: '`collect` is generic over `FromIterator`. Give the target with `let v: Vec<_>` or `collect::<Vec<_>>()`.' },
      ],
    },
    {
      id: 'zero-cost',
      title: 'Loops vs iterators: zero-cost abstraction',
      blocks: [
        { kind: 'analogy', text: "A zero-cost abstraction is a **power tool that is as quick as the hand tool**: you get the nicer handle and safety guard, but cut as fast. Bjarne Stroustrup's rule of thumb was: what you don't use, you don't pay for, and what you do use, you couldn't hand-code any better. Rust's iterators hold to that: a long chain compiles down to the same machine code as a hand-written loop, sometimes better." },
        { kind: 'code', code: `// These two compile to essentially the same machine code
fn sum_sq_loop(v: &[i64]) -> i64 {
    let mut total = 0;
    for i in 0..v.len() {
        if v[i] % 2 == 0 { total += v[i] * v[i]; }
    }
    total
}

fn sum_sq_iter(v: &[i64]) -> i64 {
    v.iter().filter(|x| **x % 2 == 0).map(|x| x * x).sum()
}` },
        { kind: 'list', items: [
          '**Monomorphisation + inlining**: every adapter is a generic struct and every closure has a unique type, so the compiler sees the whole pipeline at once. There are no virtual calls or temporary collections in the way.',
          'The iterator version often runs **faster**, because it skips the bounds check on each `v[i]` and can vectorise with SIMD. Indexed loops make the compiler prove the index is in range every time.',
          'The shape of a chain matters: prefer one pass (`filter().map().sum()`) over intermediate `collect()` calls into temporary `Vec`s. Each `collect` allocates.',
          'Laziness lets you stop early with `take`, `take_while`, `find` and `any`, and process data larger than memory by streaming (for example `BufReader::lines()`).',
          '`Box<dyn Iterator>` is dynamic dispatch and **does** cost an indirect call per item: use it only when you must return different iterator types.',
          '**Measure** with `cargo bench` (criterion or divan) in `--release`. Debug builds do not optimise iterator chains, so they can look slow there.',
        ] },
        { kind: 'code', code: `// Rayon: change iter() to par_iter() to run the pipeline on all cores
use rayon::prelude::*;
let total: i64 = v.par_iter().filter(|x| **x % 2 == 0).map(|x| x * x).sum();` },
        { kind: 'compare',
          cpp: `// "zero-overhead abstraction": templates and ranges give the same property`,
          go: `// No generic iterator pipeline in std, and no inlining of closures across calls as aggressive as Rust's`,
          python: `sum(x * x for x in v if x % 2 == 0)   # generators run one interpreted step at a time`,
          java: `v.stream().filter(...).mapToLong(...).sum();   // JIT can fuse it after warm-up; boxes without mapToLong`,
          ts: `v.filter(...).map(...)   // allocates an array per step`,
          rust: `v.iter().filter(...).map(...).sum()   // one fused loop, ahead of time`,
          note: 'Python and TypeScript pay per step. Java pays warm-up and boxing. Rust and C++ give the fused loop at compile time.' },
        { kind: 'check', q: 'Why can an iterator chain be as fast as a hand-written loop?', options: ['Iterators skip safety checks', 'Generics are monomorphised and closures inlined, so the compiler sees and fuses the whole pipeline', 'Iterators always run in parallel', 'The standard library is written in assembly'], answer: 1, hint: 'Every closure has a unique concrete type.', explain: 'Because everything is concrete at compile time, the optimiser inlines and fuses stages. No dynamic dispatch or temporary collections are involved.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does `let f = |x| x + 1;` produce?', options: ['A function pointer', 'A closure with its own unique anonymous type', 'A `Box<dyn Fn>`', 'A macro'], answer: 1, explain: 'Each closure expression has a distinct unnameable type implementing the relevant `Fn*` traits.' },
    { q: 'Which closure capture is used when the closure only reads a variable?', options: ['Move', 'Shared borrow', 'Mutable borrow', 'Clone'], answer: 1, explain: 'The compiler uses the least demanding capture that the body requires.' },
    { q: 'A closure moves a captured `String` out by returning it. Which trait does it implement?', options: ['`Fn` and `FnMut` and `FnOnce`', '`FnOnce` only', '`FnMut` only', '`Fn` only'], answer: 1, explain: 'It can only be called once, since the value is gone afterwards.' },
    { q: 'What is the required method of the `Iterator` trait?', options: ['`map`', '`next`', '`collect`', '`iter`'], answer: 1, explain: '`next(&mut self) -> Option<Self::Item>`. Everything else is provided.' },
    { q: 'Which of these is true of `iter().map(f)`?', options: ['It runs `f` immediately on all items', 'It is lazy: `f` runs only when a consumer pulls items', 'It mutates the original', 'It requires `Copy` items'], answer: 1, explain: 'Adapters build a new iterator. Consumers drive it.' },
    { q: 'What does `iter()` on a `Vec<String>` yield?', options: ['`String`', '`&String`', '`&mut String`', '`&str` always'], answer: 1, explain: '`iter()` borrows: items are shared references. `into_iter()` on an owned vec yields `String`.' },
    { q: 'How do you turn an iterator of `Result<T, E>` into a `Result<Vec<T>, E>`?', options: ['`.collect::<Result<Vec<_>, _>>()`', '`.sum()`', '`.unwrap()` each', 'You cannot'], answer: 0, explain: '`Result` implements `FromIterator`, stopping at the first error.' },
    { q: 'What does `.fold(0, |acc, x| acc + x)` do?', options: ['Returns the first item', 'Combines items into one value, starting from 0', 'Filters items', 'Folds the Vec in half'], answer: 1, explain: '`fold` is the general reduction: the closure takes the accumulator and the next item.' },
    { q: 'Why is `Box<dyn Iterator>` slower than `impl Iterator`?', options: ['It copies items', 'Each `next` is an indirect call through a vtable and cannot be inlined', 'It allocates for every item', 'It is not lazy'], answer: 1, explain: 'Dynamic dispatch prevents inlining and fusion. Use it only when different iterator types must be returned.' },
    { q: 'What did Rust 1.85 add for closures?', options: ['Async closures with `AsyncFn` traits', 'Closures that return `!`', 'Variadic closures', 'Const closures'], answer: 0, explain: '`async || { ... }` closures can borrow from their environment across `.await`, with `AsyncFn`, `AsyncFnMut` and `AsyncFnOnce`.' },
  ],
}
