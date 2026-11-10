import type { Module } from '../types'

export const r10: Module = {
  n: 10,
  title: 'Smart Pointers',
  tour: '15 · Smart Pointers',
  summary: 'Box, Deref and Drop, reference counting with Rc and Arc, interior mutability with Cell and RefCell, and reference cycles.',
  topics: ['Box<T>', 'Deref & Drop', 'Rc & Arc', 'Cell & RefCell', 'Reference cycles & Weak'],
  cpp23: [
    '`LazyCell` and `LazyLock` (Rust 1.80) and `OnceCell` / `OnceLock` (Rust 1.70) replace most uses of the `once_cell` and `lazy_static` crates.',
    '`Cell::update` applies a function to the contained value in place (Rust 1.88).',
    '`Rc::new_cyclic` and `Arc::new_cyclic` build self-referential graphs safely using a `Weak` to the value being created (Rust 1.60).',
    '`Rc::make_mut` and `Arc::make_mut` give copy-on-write sharing, cloning the data only if other owners exist.',
  ],
  lessons: [
    {
      id: 'box',
      title: 'Box<T>: one owner on the heap',
      blocks: [
        { kind: 'analogy', text: "A `Box<T>` is a **claim ticket for a locker**. The ticket (a pointer-sized value) is what you carry and pass around, and the item stays in the locker (the heap). Whoever holds the ticket owns the locker, and when the ticket is thrown away, the locker is emptied." },
        { kind: 'code', code: `let b = Box::new(5);                 // an i32 on the heap: rarely useful on its own
println!("{}", *b + 1);              // * follows the pointer; method calls auto-deref

// 1. Recursive types need a known size, and Box gives a pointer-sized stand-in
enum List { Cons(i32, Box<List>), Nil }
use List::{Cons, Nil};
let list = Cons(1, Box::new(Cons(2, Box::new(Nil))));

struct Node { val: i32, left: Option<Box<Node>>, right: Option<Box<Node>> }   // a binary tree

// 2. Trait objects: the size of a dyn Trait is unknown, so it must sit behind a pointer
let shapes: Vec<Box<dyn Shape>> = vec![Box::new(Circle(1.0)), Box::new(Square(2.0))];

// 3. Moving a big value cheaply: only the pointer is copied
let big = Box::new([0u8; 1_000_000]);
let moved = big;                     // moves 8 bytes, not a megabyte

// Dereferencing moves the contents out and consumes the box
let s = Box::new(String::from("hi"));
let inner: String = *s;              // s is gone` },
        { kind: 'list', items: [
          '`Box<T>` is the simplest smart pointer: **single ownership**, allocated on the heap, freed when it goes out of scope. It is pointer-sized and has no runtime overhead beyond the allocation.',
          'Use `Box` when: a type\'s size cannot be known at compile time (**recursive types**), you want a `dyn Trait` value, or you want to **transfer ownership of a large value without copying** it.',
          '`Option<Box<T>>` is the same size as a plain pointer: `None` is the null pointer (a "niche" optimisation). That is why linked structures with `Option<Box<Node>>` are compact.',
          'A smart pointer is a struct that owns data and also acts like a pointer, via the `Deref` and `Drop` traits. `Vec` and `String` are smart pointers too.',
          'Do not box by habit. A `Vec<Box<i32>>` is slower than a `Vec<i32>`. Box exists for the specific cases above.',
        ] },
        { kind: 'compare',
          cpp: `auto p = std::make_unique<Node>();   // std::unique_ptr: the same idea, and nullable
std::unique_ptr<Shape> s = std::make_unique<Circle>(1.0);`,
          go: `p := &Node{}   // escape analysis decides stack or heap; the GC frees it`,
          python: `node = Node()   # every object is on the heap, behind a reference`,
          java: `Node p = new Node();   // every object is on the heap, behind a reference`,
          ts: `const p = { val: 1 }   // every object is on the heap`,
          rust: `let p = Box::new(Node { val: 1, left: None, right: None });   // explicit and owned`,
          note: '`Box<T>` is `unique_ptr<T>` that cannot be null and cannot be forgotten: moves are the default and checked by the compiler.' },
        { kind: 'check', q: 'Why does `enum List { Cons(i32, List), Nil }` not compile?', options: ['`i32` is not allowed in enums', 'The type has infinite size; use `Box<List>`', 'Nil is reserved', 'Enums cannot be recursive'], answer: 1, hint: 'How many bytes would one `List` need?', explain: 'A `List` would contain a `List`, which contains a `List`, and so on. A `Box<List>` has a fixed pointer size, which breaks the infinite regress.' },
      ],
    },
    {
      id: 'deref-drop',
      title: 'Deref and Drop',
      blocks: [
        { kind: 'analogy', text: "`Deref` is the **\"see-through\" label** on a smart pointer: it tells the compiler \"when someone treats me as the thing inside, hand them the inside\". That is why you can call `s.len()` on a `Box<String>` without writing `(**s).len()`. `Drop` is the **checkout procedure**: when the owner leaves, this code runs and tidies up, automatically, every time." },
        { kind: 'code', code: `use std::ops::{Deref, DerefMut};

struct MyBox<T>(T);
impl<T> MyBox<T> { fn new(x: T) -> MyBox<T> { MyBox(x) } }

impl<T> Deref for MyBox<T> {
    type Target = T;
    fn deref(&self) -> &T { &self.0 }
}
impl<T> DerefMut for MyBox<T> {
    fn deref_mut(&mut self) -> &mut T { &mut self.0 }
}

fn hello(name: &str) { println!("Hello, {name}!"); }
let m = MyBox::new(String::from("Rust"));
hello(&m);            // &MyBox<String> -> &String -> &str: deref coercion chains automatically

// Drop: run code when a value goes out of scope
struct Conn { id: u32 }
impl Drop for Conn {
    fn drop(&mut self) { println!("closing connection {}", self.id); }
}
let a = Conn { id: 1 };
{
    let b = Conn { id: 2 };
}                              // prints: closing connection 2
drop(a);                       // std::mem::drop: drop early. (You cannot call a.drop() directly.)
println!("end");               // closing connection 1 was printed before this line` },
        { kind: 'list', items: [
          '**Deref coercion**: the compiler converts `&T` to `&U` when `T: Deref<Target = U>`, repeatedly if needed. It is why `&String` works for `&str`, `&Vec<T>` for `&[T]` and `&Box<T>` for `&T`. It happens at compile time and costs nothing.',
          '`DerefMut` does the same for `&mut`. Rule: from `&T` to `&U` needs `Deref`, from `&mut T` to `&mut U` needs `DerefMut`, and from `&mut T` to `&U` is always allowed.',
          'Implement `Deref` only for **smart-pointer-like wrappers**. Using it to fake inheritance (a `Dog` deref-ing to `Animal`) is a known anti-pattern, because it hides what is going on.',
          '`Drop::drop` runs when the owner goes out of scope, in reverse order of declaration, and for struct fields in declaration order. It is how `Box`, `Vec`, `File`, `MutexGuard` and `Rc` clean up.',
          'Call `std::mem::drop(x)` (in the prelude as `drop`) to release something early, such as a lock guard or a file. `mem::forget(x)` skips the destructor (safe, but leaks).',
          'A type cannot be both `Copy` and `Drop`. A type that owns a resource must have exactly one owner, or reference counting.',
        ] },
        { kind: 'new23', text: 'RAII guards compose with `?` and early return. A `MutexGuard`, a `File` or a transaction handle is released on every exit path, with no `finally` and no `defer`. In the 2024 edition, temporaries in the tail expression of a block are dropped **before** the block\'s locals, which fixes a class of "borrowed value does not live long enough" surprises with guards:' },
        { kind: 'code', code: `fn latest(m: &std::sync::Mutex<Vec<i32>>) -> usize {
    m.lock().unwrap().len()     // 2024: the guard temporary is dropped before locals, so it can never outlive them
}` },
        { kind: 'compare',
          cpp: `struct Conn { ~Conn() { std::puts("closing"); } };   // destructors: the same RAII idea
// operator*() and operator->() make smart pointers`,
          go: `defer conn.Close()           // must be written at every acquisition; run at function exit, not scope exit`,
          python: `with open(p) as f: ...      # context manager; __del__ is unreliable`,
          java: `try (var f = new FileInputStream(p)) { }   // try-with-resources; finalizers are deprecated`,
          ts: `using f = openFile(p)        // explicit resource management (newer); else try/finally`,
          rust: `{ let f = File::open(p)?; }   // closed automatically at the closing brace (Drop)`,
          note: 'Drop makes cleanup the default for every type, with no keyword to remember. That is why Rust has no `finally` or `defer`.' },
        { kind: 'check', q: 'How do you release a value (and run its destructor) before the end of the scope?', options: ['`value.drop()`', '`drop(value)`', '`free(value)`', '`value = null`'], answer: 1, hint: 'You cannot call the `Drop::drop` method yourself.', explain: '`std::mem::drop(value)` takes ownership and lets it go out of scope immediately. Calling `.drop()` directly is a compile error.' },
      ],
    },
    {
      id: 'rc',
      title: 'Rc<T> and Arc<T>: shared ownership',
      blocks: [
        { kind: 'analogy', text: "Normally a value has one owner, like a single house key. `Rc<T>` is a **shared flat with a head count**: every resident (clone) increments the count, and when the last one leaves, the flat is demolished. It lets several parts of a program own the same data when you cannot say which will finish last. `Arc<T>` is the same, but the head count is atomic, so it is safe when residents live on different threads." },
        { kind: 'stepper', title: 'Reference counting in action', code: [
          'let a = Rc::new(String::from("shared"));',
          'let b = Rc::clone(&a);',
          '{ let c = Rc::clone(&a); }',
          'drop(b);',
          'drop(a);',
        ], steps: [
          { line: 1, note: 'The `String` is allocated on the heap with a strong count of 1. `a` owns one share.', memory: [{ name: 'a', value: 'Rc → box#1', kind: 'ptr' }, { name: 'box#1', value: 'strong = 1, "shared"', kind: 'heap' }] },
          { line: 2, note: '`Rc::clone` copies the pointer and bumps the count. **No deep copy**: it is cheap. Both point at the same data.', memory: [{ name: 'a', value: 'Rc → box#1', kind: 'ptr' }, { name: 'b', value: 'Rc → box#1', kind: 'ptr' }, { name: 'box#1', value: 'strong = 2', kind: 'heap' }] },
          { line: 3, note: 'A third share, `c`, exists only inside the block. When the block ends, `c` drops and the count goes back to 2.', memory: [{ name: 'a', value: 'Rc → box#1', kind: 'ptr' }, { name: 'b', value: 'Rc → box#1', kind: 'ptr' }, { name: 'box#1', value: 'strong = 2 (3 inside the block)', kind: 'heap' }] },
          { line: 4, note: 'Dropping `b` decrements the count to 1. The data survives.', memory: [{ name: 'a', value: 'Rc → box#1', kind: 'ptr' }, { name: 'box#1', value: 'strong = 1', kind: 'heap' }] },
          { line: 5, note: 'The last owner is dropped. The count reaches 0, the `String` is dropped and the memory freed.', memory: [{ name: 'box#1', value: 'freed', kind: 'dead' }] },
        ] },
        { kind: 'code', code: `use std::rc::Rc;
use std::sync::Arc;
use std::thread;

let shared = Rc::new(vec![1, 2, 3]);
let a = Rc::clone(&shared);                     // idiom: Rc::clone(&x), not x.clone(), to signal "cheap"
println!("{}", Rc::strong_count(&shared));      // 2
println!("{}", a.len());                        // auto-deref to the Vec; read-only!
// a.push(4);                                   // error: Rc gives shared (immutable) access

// Arc: the thread-safe version
let data = Arc::new(vec![10, 20, 30]);
let handles: Vec<_> = (0..3).map(|i| {
    let d = Arc::clone(&data);
    thread::spawn(move || d[i] * 2)
}).collect();
let results: Vec<i32> = handles.into_iter().map(|h| h.join().unwrap()).collect();   // [20, 40, 60]

// Copy on write: clone the data only if it is shared
let mut cow = Arc::new(vec![1, 2]);
let other = Arc::clone(&cow);
Arc::make_mut(&mut cow).push(3);                // other still sees [1, 2]; cow has its own copy [1, 2, 3]` },
        { kind: 'list', items: [
          '`Rc<T>` is for **single-threaded** shared ownership. It is not `Send`, so the compiler refuses to send it across threads. `Arc<T>` uses atomic counters and **is** `Send + Sync` when `T` is, at a small cost per clone and drop.',
          'An `Rc` gives **immutable** access. To mutate shared data, combine it with interior mutability: `Rc<RefCell<T>>` (single thread) or `Arc<Mutex<T>>` (multiple threads) (next lesson, and module 11).',
          '`Rc::strong_count`, `Rc::ptr_eq`, `Rc::try_unwrap` (get the inner value if you are the last owner), `Rc::get_mut` (mutable access if unique) and `Rc::make_mut` (copy-on-write) are the useful associated functions. They are not methods, to avoid clashing with the inner type\'s methods.',
          'Reach for `Rc`/`Arc` when ownership really is shared: a graph, a cache, a config read by many tasks. If a clear owner exists, borrow instead. **Don\'t use `Rc` to escape the borrow checker** on ordinary code.',
          'Cloning an `Rc` is one increment. Cloning the *contents* needs `(*rc).clone()` or `rc.as_ref().clone()`.',
        ] },
        { kind: 'compare',
          cpp: `auto a = std::make_shared<std::string>("x");   // shared_ptr: atomic counts always, even single-threaded
auto b = a;                                     // implicit copy of the pointer`,
          go: `// the GC shares objects implicitly; there is no explicit reference count`,
          python: `a = "x"; b = a   # CPython reference counts every object, implicitly`,
          java: `String b = a;   // the GC tracks sharing`,
          ts: `const b = a   // the GC tracks sharing`,
          rust: `let a = Rc::new(String::from("x"));
let b = Rc::clone(&a);   // explicit, and the type tells you the thread-safety (Rc vs Arc)`,
          note: 'In C++ `shared_ptr` is always atomic. Rust splits it into `Rc` (cheap, one thread) and `Arc` (atomic, many), and the compiler enforces which you may use where.' },
        { kind: 'check', q: 'Which type do you need to share read-only data between threads?', options: ['`Rc<T>`', '`Arc<T>`', '`Box<T>`', '`RefCell<T>`'], answer: 1, hint: 'One of them has atomic counts.', explain: '`Rc` is not `Send`, so the compiler rejects it across threads. `Arc` uses atomic reference counting and is safe to share.' },
      ],
    },
    {
      id: 'refcell',
      title: 'Interior mutability: Cell and RefCell',
      blocks: [
        { kind: 'analogy', text: "Normally Rust checks the borrow rules **at the door** (compile time): no two writers, no writer with readers. **Interior mutability** is a meeting room with a sign-in sheet checked **at the door at run time**: you may be allowed a mutable borrow even though you only hold `&self`, but if two people try to write at once, the room panics. Use it when the compiler's check is too coarse, but you know you are following the rules." },
        { kind: 'code', code: `use std::cell::{Cell, RefCell};
use std::rc::Rc;

// Cell<T>: for Copy types. get/set by value. No references handed out, so always safe.
let hits = Cell::new(0u32);
hits.set(hits.get() + 1);                 // mutation through &Cell
hits.update(|n| n + 1);                   // Rust 1.88: in-place update
let old = hits.replace(10);

// RefCell<T>: for any T. Borrow rules enforced at run time.
let log = RefCell::new(Vec::<String>::new());
log.borrow_mut().push("start".into());    // a RefMut guard: exclusive
println!("{}", log.borrow().len());       // a Ref guard: shared
// let a = log.borrow_mut(); let b = log.borrow_mut();   // PANIC: already borrowed (BorrowMutError)
if let Ok(mut g) = log.try_borrow_mut() { g.push("safe".into()); }   // non-panicking version

// The common pattern: shared and mutable, single-threaded
let shared = Rc::new(RefCell::new(vec![1, 2]));
let other = Rc::clone(&shared);
other.borrow_mut().push(3);
println!("{:?}", shared.borrow());        // [1, 2, 3]

// A struct with a &self method that updates an internal cache
struct Memo { cache: RefCell<std::collections::HashMap<u64, u64>> }
impl Memo {
    fn fib(&self, n: u64) -> u64 {
        if n < 2 { return n; }
        if let Some(&v) = self.cache.borrow().get(&n) { return v; }
        let v = self.fib(n - 1) + self.fib(n - 2);
        self.cache.borrow_mut().insert(n, v);     // the earlier borrow() ended with the if-let
        v
    }
}` },
        { kind: 'list', items: [
          '**`Cell<T>`**: replaces the value (`set`, `replace`, `take`, `update`) and, for `Copy`, reads it (`get`). It never hands out a reference, so there is no borrow to track. No run-time cost beyond a normal write.',
          '**`RefCell<T>`**: `borrow()` returns a `Ref<T>` and `borrow_mut()` a `RefMut<T>`. The rules (many readers or one writer) are checked as the guards are created and dropped, and a violation **panics**. It is single-threaded: `RefCell` is not `Sync`.',
          'The multi-threaded counterparts: `Mutex<T>` and `RwLock<T>` (block instead of panic), and atomics for integers (module 11). `OnceCell` / `OnceLock` set a value once, and `LazyCell` / `LazyLock` compute it on first use.',
          '`Rc<RefCell<T>>` = **shared ownership + mutation**, checked at run time. It is the workaround for graph-like or observer-like structures, but a signal that you should first consider a different design (indices into a `Vec`, an arena, or message passing).',
          'Keep guards short-lived: a `Ref` alive across a call that tries `borrow_mut()` is the usual cause of panics. Bind results to a variable and let the guard drop, or scope it in a block.',
        ] },
        { kind: 'new23', text: '`LazyLock` and `LazyCell` build a value on first access, which makes global tables and regexes simple without a crate:' },
        { kind: 'code', code: `use std::sync::{LazyLock, OnceLock, Mutex};
use std::collections::HashMap;

static TABLE: LazyLock<HashMap<&'static str, u32>> = LazyLock::new(|| {
    HashMap::from([("XAU", 1), ("EUR", 2)])          // runs once, on first use, thread-safely
});
static CONFIG: OnceLock<String> = OnceLock::new();    // set once at startup
static COUNTER: Mutex<u64> = Mutex::new(0);           // Mutex::new is const, so no lazy wrapper is needed

fn id(sym: &str) -> Option<u32> { TABLE.get(sym).copied() }
fn init(c: String) { CONFIG.set(c).expect("already set"); }` },
        { kind: 'pitfall', text: 'Two `borrow_mut()` guards alive at once panic at **run time**, and the compiler cannot warn you. Typical trap: `let v = cell.borrow_mut(); helper(&cell);` where `helper` borrows again. Shorten the guard\'s life with a block, or restructure so the mutation happens in one place.' },
        { kind: 'compare',
          cpp: `mutable int cache_hits;   // const member functions may modify \`mutable\` fields
// no run-time borrow checking: races and aliasing are your job`,
          go: `// every pointer is mutable through any alias; use sync.Mutex for concurrency`,
          python: `self.cache = {}   # everything is mutable through any reference`,
          java: `private final Map<K,V> cache = new HashMap<>();   // final reference, mutable object`,
          ts: `const cache = new Map()   // const binding, mutable object`,
          rust: `cache: RefCell<HashMap<K, V>>   // &self methods can mutate, with checks at run time`,
          note: 'In most languages every object is mutable through any reference. In Rust mutation is exceptional and visible in the type: `Cell`, `RefCell`, `Mutex`, atomics.' },
        { kind: 'check', q: 'What happens if you call `borrow_mut()` twice on the same `RefCell` while the first guard is alive?', options: ['A compile error', 'A run-time panic', 'The second call waits', 'It returns `None`'], answer: 1, hint: 'The check is at run time.', explain: '`RefCell` enforces the borrow rules dynamically and panics on violation. `try_borrow_mut` returns a `Result` instead.' },
        { kind: 'check', q: 'Which pair gives shared, mutable ownership across threads?', options: ['`Rc<RefCell<T>>`', '`Arc<Mutex<T>>`', '`Box<Cell<T>>`', '`Arc<RefCell<T>>`'], answer: 1, hint: 'Both parts must be thread-safe.', explain: '`Arc` shares ownership atomically and `Mutex` provides run-time-checked exclusive access that blocks. `Rc` and `RefCell` are single-threaded.' },
      ],
    },
    {
      id: 'cycles',
      title: 'Reference cycles and Weak',
      blocks: [
        { kind: 'analogy', text: "Two friends each hold the other's flat keys and neither will leave until the other does. Both flats stay occupied forever. That is a **reference cycle**: `Rc` counts never reach zero, so the memory is never freed. `Weak` is a **\"visitor\" key**: it lets you find the flat if it is still there, but it does not count as a resident, so it never keeps the flat alive." },
        { kind: 'code', code: `use std::cell::RefCell;
use std::rc::{Rc, Weak};

#[derive(Debug)]
struct Node {
    name: String,
    parent: RefCell<Weak<Node>>,              // weak: a child must not keep its parent alive
    children: RefCell<Vec<Rc<Node>>>,         // strong: the parent owns its children
}

let leaf = Rc::new(Node { name: "leaf".into(), parent: RefCell::new(Weak::new()), children: RefCell::new(vec![]) });
println!("{:?}", leaf.parent.borrow().upgrade().map(|p| p.name.clone()));   // None

{
    let branch = Rc::new(Node { name: "branch".into(), parent: RefCell::new(Weak::new()),
                                children: RefCell::new(vec![Rc::clone(&leaf)]) });
    *leaf.parent.borrow_mut() = Rc::downgrade(&branch);     // set the back-pointer weakly
    println!("{:?}", leaf.parent.borrow().upgrade().map(|p| p.name.clone()));   // Some("branch")
    println!("strong={} weak={}", Rc::strong_count(&branch), Rc::weak_count(&branch));   // 1, 1
}
println!("{:?}", leaf.parent.borrow().upgrade().map(|p| p.name.clone()));   // None: branch was freed
` },
        { kind: 'list', items: [
          '`Rc::downgrade(&rc)` creates a `Weak<T>`. It does not keep the value alive. `weak.upgrade()` returns `Option<Rc<T>>`: `Some` while at least one strong owner remains, `None` afterwards.',
          'Each `Rc` allocation keeps a **strong count** and a **weak count**. The value is dropped when strong reaches 0, and the allocation is freed when weak reaches 0 as well.',
          '**Memory leaks are memory-safe** in Rust. A cycle of `Rc`s leaks, but cannot cause use-after-free. `mem::forget` and `Box::leak` also leak deliberately.',
          'Design rule: **owners point down with `Rc`, back-references point up with `Weak`** (parent pointers, observers, caches that should not keep things alive). The same applies to `Arc` and `sync::Weak`.',
          '`Rc::new_cyclic(|weak| ...)` constructs a value that needs a `Weak` to itself during creation (Rust 1.60). It avoids the `RefCell<Weak>` dance for self-referencing structures.',
          'Often the best answer to a cyclic structure is **no pointers at all**: store nodes in a `Vec` and refer to them with indices (`NodeId`), or use an arena crate. It is faster, cache-friendlier, and sidesteps the whole problem.',
        ] },
        { kind: 'code', code: `// Index-based graph: no Rc, no cycles, no RefCell
struct Graph { nodes: Vec<NodeData> }
struct NodeData { name: String, parent: Option<usize>, children: Vec<usize> }
impl Graph {
    fn add_child(&mut self, parent: usize, name: &str) -> usize {
        let id = self.nodes.len();
        self.nodes.push(NodeData { name: name.into(), parent: Some(parent), children: vec![] });
        self.nodes[parent].children.push(id);
        id
    }
}

// Cow: borrow when you can, clone when you must
use std::borrow::Cow;
fn normalise(s: &str) -> Cow<'_, str> {
    if s.contains(' ') { Cow::Owned(s.replace(' ', "_")) } else { Cow::Borrowed(s) }   // allocates only if needed
}` },
        { kind: 'compare',
          cpp: `std::weak_ptr<Node> parent;       // identical idea: weak_ptr::lock() returns a shared_ptr or empty`,
          go: `// the GC handles cycles: no weak references needed, except runtime weak pointers (Go 1.24)`,
          python: `import weakref; ref = weakref.ref(obj)   # the cycle collector also finds cycles`,
          java: `WeakReference<Node> parent = new WeakReference<>(p);   // the GC collects cycles`,
          ts: `const ref = new WeakRef(obj)   // the GC collects cycles`,
          rust: `parent: RefCell<Weak<Node>>   // reference counting cannot collect cycles, so Weak is your tool`,
          note: 'Tracing garbage collectors find cycles for you. Reference counting (Rust, C++, Swift) does not, so you break cycles by design with weak links.' },
        { kind: 'check', q: 'A tree where children hold `Rc` to the parent, and the parent holds `Rc` to children. What happens?', options: ['It works perfectly', 'A reference cycle: neither side\'s count reaches 0 so the memory leaks', 'A compile error', 'A panic on creation'], answer: 1, hint: 'Think about the strong counts.', explain: 'Each node keeps the other alive forever. Make the back-pointer a `Weak`, so only the parent-to-child direction counts.' },
      ],
    },
  ],
  quiz: [
    { q: 'When is `Box<T>` the right tool?', options: ['Always, for any struct', 'For recursive types, trait objects, and moving large values cheaply', 'For sharing between threads', 'For interior mutability'], answer: 1, explain: 'Box gives single ownership on the heap, which solves unknown-size problems.' },
    { q: 'What does `Deref` enable?', options: ['Dereferencing with `*` and deref coercion of `&Wrapper` to `&Inner`', 'Cloning', 'Dropping', 'Thread safety'], answer: 0, explain: 'It makes a smart pointer behave like a reference to the value inside.' },
    { q: 'In what order are locals dropped at the end of a scope?', options: ['Declaration order', 'Reverse declaration order', 'Alphabetical', 'Unspecified'], answer: 1, explain: 'Later variables may borrow earlier ones, so they go first.' },
    { q: 'What does `Rc::clone(&a)` do?', options: ['Deep-copies the value', 'Increments the strong count and copies the pointer', 'Moves `a`', 'Creates a `Weak`'], answer: 1, explain: 'Cloning an `Rc` is cheap: the data is shared.' },
    { q: 'Why can\'t you send an `Rc<T>` to another thread?', options: ['It is too big', 'Its count is not atomic, so it is not `Send`', 'It borrows', 'Threads forbid heap data'], answer: 1, explain: 'Non-atomic counts could be corrupted by two threads. Use `Arc`.' },
    { q: 'What is interior mutability?', options: ['Mutating through a `&` reference by checking the rules at runtime or using a restricted API', 'Mutating private fields', 'Unsafe pointers', 'Mutable statics'], answer: 0, explain: '`Cell`, `RefCell`, `Mutex` and atomics allow mutation behind shared references.' },
    { q: 'What happens on a conflicting `RefCell` borrow?', options: ['Compile error', 'Panic at run time', 'Silent data race', 'The second borrow blocks'], answer: 1, explain: '`RefCell` tracks borrows dynamically and panics on violation (`try_borrow*` return a `Result`).' },
    { q: 'What does `weak.upgrade()` return?', options: ['`Rc<T>`', '`Option<Rc<T>>`: `None` if the value was dropped', '`&T`', '`Result<T, E>`'], answer: 1, explain: 'A weak pointer does not keep the value alive, so it may be gone.' },
    { q: 'Which design avoids both cycles and `Rc<RefCell<..>>` in a graph?', options: ['`Weak` everywhere', 'Store nodes in a `Vec` and refer to them by index', 'Use `unsafe` raw pointers', 'Use `Box` for every link'], answer: 1, explain: 'Index-based graphs have no ownership cycles, are cache-friendly and are simple to borrow-check.' },
    { q: 'What does `LazyLock` provide?', options: ['A lock that is slow', 'A value computed once on first access, safely across threads', 'A lazy iterator', 'A deferred drop'], answer: 1, explain: 'It is the standard-library replacement for `lazy_static` and `once_cell::Lazy` in statics (Rust 1.80).' },
  ],
}
