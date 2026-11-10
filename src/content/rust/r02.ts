import type { Module } from '../types'

export const r02: Module = {
  n: 2,
  title: 'Ownership and Borrowing',
  tour: '4 · Understanding Ownership',
  summary: 'The idea that sets Rust apart: ownership, moves, clones, references, borrowing rules, slices, and how the compiler uses them to remove whole classes of bugs.',
  topics: ['Stack & heap', 'Ownership & moves', 'References & borrowing', 'Slices', 'Non-lexical lifetimes'],
  cpp23: [
    '`get_disjoint_mut` borrows several elements of a slice or `HashMap` mutably at once, after checking the indices do not overlap (Rust 1.86).',
    'Precise capturing with `use<..>` in `impl Trait` return types controls which lifetimes a returned type holds on to (Rust 1.82). In the 2024 edition, return-position `impl Trait` captures all in-scope lifetimes by default.',
    '`Option::take_if` and `Vec::pop_if` give a safe way to remove a value conditionally while holding `&mut` (Rust 1.80 and 1.86).',
  ],
  lessons: [
    {
      id: 'stack-heap',
      title: 'Stack, heap and why ownership exists',
      blocks: [
        { kind: 'analogy', text: "The stack is a tidy pile of plates: you put one on top and take it off the top, and everything is exactly where you expect, so it is fast. The heap is a warehouse. You ask for a space of a given size, you are handed a **ticket** (a pointer), and someone must eventually return that space. In C you remember to return it, in Java and Python a janitor (the garbage collector) does it later, and in Rust the **ticket has exactly one holder**, and when that holder goes out of scope the space is returned, automatically and immediately." },
        { kind: 'list', items: [
          'Values with a size known at compile time (integers, tuples, arrays, structs of those) can live on the **stack**. Pushing and popping them costs almost nothing.',
          'Values that grow or whose size is only known at run time (`String`, `Vec`, `Box`) keep a small header on the stack (pointer, length, capacity) and their contents on the **heap**.',
          'Every language has to answer one question: *who frees the heap memory, and when?* C: you, by hand (and you forget, or free twice). Java, Go and Python: a garbage collector, at some later time, at a runtime cost. C++: destructors, but nothing stops two owners sharing a raw pointer. **Rust: the compiler tracks a single owner at compile time and inserts the free for you.**',
          'The result is deterministic cleanup with no garbage collector, no runtime cost and no use-after-free, double free or dangling pointer in safe code.',
        ] },
        { kind: 'p', text: 'These are the three rules. Everything in this module is a consequence of them:' },
        { kind: 'list', items: [
          'Each value has exactly one **owner**.',
          'There can only be one owner at a time.',
          'When the owner goes out of scope, the value is **dropped** (its destructor runs and its memory is freed).',
        ] },
        { kind: 'code', code: `{
    let s = String::from("hello");   // s owns a heap buffer
    println!("{s}");
}                                    // s goes out of scope: the buffer is freed right here

struct Guard(&'static str);
impl Drop for Guard {
    fn drop(&mut self) { println!("drop {}", self.0); }
}
fn main() {
    let _a = Guard("a");
    let _b = Guard("b");
    println!("end of main");
}   // prints: end of main, drop b, drop a   (locals drop in reverse order)` },
        { kind: 'compare',
          cpp: `{
    std::string s = "hello";   // RAII: the destructor frees the buffer
}                              // same idea, but copying a std::string is allowed
                               // and moves leave a valid-but-unspecified object`,
          go: `s := "hello"       // strings are immutable values; the GC reclaims them
b := make([]byte, 10)  // freed some time after the last reference disappears`,
          python: `s = "hello"        # reference counted plus a cycle collector
del s              # the object is freed when the count hits zero`,
          java: `String s = "hello";     // freed by the GC at an unspecified time
// try-with-resources for files, sockets: manual and easy to forget`,
          ts: `let s = "hello"     // freed by the GC; no deterministic destruction`,
          rust: `{
    let s = String::from("hello");
}   // freed here, deterministically, at the closing brace`,
          note: 'Rust is closest to C++ RAII, but the compiler also enforces that nothing outlives the value it points at. C++ leaves that to discipline.' },
        { kind: 'check', q: 'When is the heap buffer inside a `String` freed?', options: ['At the next garbage collection', 'When the owning variable goes out of scope', 'When you call `free`', 'When the program exits'], answer: 1, hint: 'There is no collector and no manual free.', explain: 'The owner runs `Drop` at the closing brace of its scope, so the buffer is freed at a precise, predictable point.' },
      ],
    },
    {
      id: 'moves',
      title: 'Ownership, moves and clones',
      blocks: [
        { kind: 'analogy', text: "Handing someone a house key is a **move**: you no longer have access, they do. If you want both people to be able to enter you must cut a second key (`clone`) at a cost, or share the house under shared rules (references, next lesson). Small, cheap-to-copy things like a bus ticket number (`i32`) are photocopied freely: that is the `Copy` trait." },
        { kind: 'stepper', title: 'A move, then a clone', code: [
          'let s1 = String::from("hi");',
          'let s2 = s1;',
          'println!("{s2}");',
          'let s3 = s2.clone();',
        ], steps: [
          { line: 1, note: '`s1` owns a heap buffer. The stack holds a pointer, a length and a capacity.', memory: [{ name: 's1', value: 'ptr, len 2, cap 2', kind: 'ptr' }, { name: 'heap#1', value: '"hi"', kind: 'heap' }] },
          { line: 2, note: 'A **move**. The three header words are copied to `s2`, and `s1` is marked as moved-from. Nothing on the heap is copied, so it is cheap, and only one owner remains.', memory: [{ name: 's1', value: 'moved', kind: 'dead' }, { name: 's2', value: 'ptr, len 2, cap 2', kind: 'ptr' }, { name: 'heap#1', value: '"hi"', kind: 'heap' }] },
          { line: 3, note: 'Using `s2` is fine. Using `s1` here would be a compile error: "borrow of moved value".', memory: [{ name: 's1', value: 'moved', kind: 'dead' }, { name: 's2', value: 'ptr, len 2, cap 2', kind: 'ptr' }, { name: 'heap#1', value: '"hi"', kind: 'heap' }] },
          { line: 4, note: '`clone` makes a **deep copy**: a new buffer and a new owner. It is explicit in the source, so costs are visible.', memory: [{ name: 's2', value: 'ptr → heap#1', kind: 'ptr' }, { name: 's3', value: 'ptr → heap#2', kind: 'ptr' }, { name: 'heap#1', value: '"hi"', kind: 'heap' }, { name: 'heap#2', value: '"hi"', kind: 'heap' }] },
        ] },
        { kind: 'code', code: `fn takes(s: String) { println!("{s}"); }     // takes ownership; dropped at the end
fn gives() -> String { String::from("new") } // ownership moves out to the caller
fn both(s: String) -> (String, usize) {
    let n = s.len();
    (s, n)                                    // hand it back with the result
}

let a = String::from("x");
takes(a);                    // a is moved into takes
// println!("{a}");          // error[E0382]: borrow of moved value: \`a\`

let x = 5;
let y = x;                   // i32 is Copy: both are usable
println!("{x} {y}");` },
        { kind: 'list', items: [
          '**Assignment, passing to a function and returning all move** a non-`Copy` value. After a move the old name cannot be used. The compiler tracks this precisely, even through branches and loops.',
          '`Copy` types are duplicated bit for bit instead of moved: integers, floats, `bool`, `char`, shared references `&T`, and tuples or arrays made only of `Copy` types. A type that owns a resource (`String`, `Vec`, `Box`, file handles) can never be `Copy`.',
          '`#[derive(Clone, Copy)]` opts a small plain-data struct into `Copy`. `#[derive(Clone)]` alone makes `.clone()` available when a deep copy is needed.',
          'A move out of **part** of a struct (a partial move) is allowed, but then the struct as a whole can no longer be used. A `Vec` element cannot be moved out by indexing: use `remove`, `swap_remove`, `std::mem::take` or iterate by value.',
          '`std::mem::take(&mut x)` replaces `x` with its default and returns the old value. `mem::replace(&mut x, new)` and `mem::swap(&mut a, &mut b)` are the way to move out of something you only have a `&mut` to.',
        ] },
        { kind: 'pitfall', text: 'Cloning to silence the borrow checker is the classic beginner habit. It compiles, but you may be copying large buffers and hiding a design problem. Reach for a reference first, and clone when you genuinely need an independent value.' },
        { kind: 'compare',
          cpp: `std::string a = "x";
std::string b = a;               // deep copy by default (implicit!)
std::string c = std::move(a);    // a is "valid but unspecified": still usable`,
          go: `a := []int{1, 2}
b := a                           // copies the slice header: both share the array`,
          python: `a = [1, 2]
b = a                            # same object, two names`,
          java: `List<Integer> a = new ArrayList<>();
List<Integer> b = a;             // two references to one object`,
          ts: `const a = [1, 2]
const b = a                      // two references to one array`,
          rust: `let a = String::from("x");
let b = a;                       // move: a is gone, b owns it
let c = b.clone();               // explicit deep copy`,
          note: 'The default in C++ is copy, in Rust it is move. Copying is always spelled `.clone()`, so you can grep for every place that might be expensive.' },
        { kind: 'check', q: 'Which line fails to compile?', code: 'let a = String::from("x");\nlet b = a;\nlet n = 5;\nlet m = n;\nprintln!("{a} {n}");', options: ['`let b = a;`', '`let m = n;`', 'The `println!`, because `a` was moved', 'None of them'], answer: 2, hint: 'Which of `a` and `n` is `Copy`?', explain: '`i32` is `Copy`, so `n` stays usable. `String` is not, so `let b = a;` moves it, and using `a` afterwards is "borrow of moved value".' },
        { kind: 'check', q: 'What does `let c = b.clone();` cost?', options: ['Nothing: it moves', 'A new heap allocation and a copy of the contents', 'A compile error', 'A reference count increment'], answer: 1, hint: 'Think about what "deep copy" means for a `String`.', explain: '`String::clone` allocates a new buffer and copies the bytes. (Only `Rc` and `Arc` clones are cheap reference-count bumps, module 10.)' },
      ],
    },
    {
      id: 'references',
      title: 'References and borrowing',
      blocks: [
        { kind: 'analogy', text: "A library lends you a book rather than giving it to you. Many people can **read** the same book at the same time (`&T`). But if someone wants to **annotate** it (`&mut T`), nobody else may read or write at that moment, or they would see half-finished notes. The library also never lets a loan outlive the book: you cannot keep a reference after the owner has gone." },
        { kind: 'code', code: `fn len(s: &String) -> usize { s.len() }        // borrows: reads only
fn add_bang(s: &mut String) { s.push('!'); }   // borrows exclusively: may modify

let mut s = String::from("hi");
let n = len(&s);            // a shared borrow, ends when len returns
add_bang(&mut s);           // an exclusive borrow, ends when add_bang returns
println!("{s} {n}");        // s was never moved

let r1 = &s;
let r2 = &s;                // any number of shared borrows
println!("{r1} {r2}");

let w = &mut s;             // fine: r1 and r2 are no longer used
w.push('?');` },
        { kind: 'p', text: 'This is the rule the borrow checker enforces. It is often summed up as **aliasing XOR mutation**:' },
        { kind: 'list', items: [
          'At any moment you may have **either** any number of shared references (`&T`) **or** exactly one exclusive reference (`&mut T`) to a value, never both.',
          'References must always be **valid**: a reference cannot outlive the value it refers to.',
          'A shared reference is read-only (except for interior mutability, module 10). A `&mut` reference is the only way to modify through a reference, and it is a unique pointer, so the compiler can assume no one else sees the data.',
          'Methods take `&self` (read), `&mut self` (modify) or `self` (consume). The signature tells the caller which one it is.',
          'Auto-deref: `r.len()` works whether `r` is a `String`, a `&String` or a `&&String`. You rarely write `*r` except to assign through a `&mut`: `*count += 1`.',
        ] },
        { kind: 'stepper', title: 'Shared, then exclusive', code: [
          'let mut s = String::from("a");',
          'let r1 = &s;',
          'let r2 = &s;',
          'println!("{r1} {r2}");',
          'let r3 = &mut s;',
          'r3.push(\'b\');',
        ], steps: [
          { line: 1, note: '`s` owns the buffer and is mutable.', memory: [{ name: 's', value: '"a"', kind: 'heap' }] },
          { line: 2, note: 'A shared borrow. While it lives, `s` cannot be modified.', memory: [{ name: 's', value: '"a"', kind: 'heap' }, { name: 'r1', value: '&s', kind: 'ref' }] },
          { line: 3, note: 'A second shared borrow is fine: both only read.', memory: [{ name: 's', value: '"a"', kind: 'heap' }, { name: 'r1', value: '&s', kind: 'ref' }, { name: 'r2', value: '&s', kind: 'ref' }] },
          { line: 4, note: 'Last use of `r1` and `r2`. The borrows end here, not at the closing brace.', memory: [{ name: 's', value: '"a"', kind: 'heap' }, { name: 'r1', value: 'done', kind: 'dead' }, { name: 'r2', value: 'done', kind: 'dead' }] },
          { line: 5, note: 'An exclusive borrow is now allowed because no shared borrow is still alive.', memory: [{ name: 's', value: '"a"', kind: 'heap' }, { name: 'r3', value: '&mut s', kind: 'ref' }] },
          { line: 6, note: 'Modifying through the unique reference. Nobody else can observe `s` mid-change.', memory: [{ name: 's', value: '"ab"', kind: 'heap' }, { name: 'r3', value: '&mut s', kind: 'ref' }] },
        ] },
        { kind: 'code', code: `// What the compiler rejects, and why:
let mut v = vec![1, 2, 3];
let first = &v[0];           // shared borrow into v's buffer
v.push(4);                   // error[E0502]: cannot borrow \`v\` as mutable
println!("{first}");         // ...because push may reallocate and leave \`first\` dangling

fn dangle() -> &String {     // error[E0106]: missing lifetime specifier
    let s = String::from("x");
    &s                       // s is dropped at the end of the function
}                            // so this reference would point at freed memory` },
        { kind: 'pitfall', text: 'The `v.push(4)` error is the iterator-invalidation bug from C++ (`for (auto& x : v) v.push_back(x)`), caught at compile time. If you really need both, finish with the first reference before mutating, copy the value out (`let first = v[0];`), or restructure with indices.' },
        { kind: 'compare',
          cpp: `int& first = v[0];
v.push_back(4);                 // compiles. \`first\` may now dangle: undefined behaviour
std::cout << first;`,
          go: `first := &v[0]
v = append(v, 4)                // compiles; first may point to the old array
fmt.Println(*first)`,
          python: `first = v[0]
v.append(4)                     # no pointers into the list, so no problem (and no speed)`,
          java: `int first = v.get(0);
v.add(4);                       // copies the value; ConcurrentModificationException in iteration`,
          ts: `const first = v[0]
v.push(4)                       // values are copied or references are GC-managed`,
          rust: `let first = &v[0];
v.push(4);                      // compile error: cannot borrow as mutable
println!("{first}");`,
          note: 'Rust keeps the speed of pointers into a buffer and rejects the one program that would be unsound. Other languages get safety by copying or by tracking at run time.' },
        { kind: 'check', q: 'Why does this fail to compile?', code: 'let mut s = String::from("a");\nlet r = &s;\ns.push(\'b\');\nprintln!("{r}");', options: ['`r` is not mutable', 'A shared borrow is still alive when `s` is mutated', 'Strings cannot be borrowed', '`push` takes ownership'], answer: 1, hint: 'Which line uses `r` last?', explain: '`r` is used after `s.push`, so the shared borrow overlaps the mutation. If the `println!` came first, it would compile.' },
        { kind: 'check', q: 'How many `&mut T` references to one value can be alive at the same time?', options: ['As many as you like', 'Exactly one, and no shared references alongside it', 'One per thread', 'Two: one read and one write'], answer: 1, hint: 'Aliasing XOR mutation.', explain: 'An exclusive borrow is unique. This is what lets the compiler (and you) assume that nothing else changes the data during the borrow.' },
      ],
    },
    {
      id: 'slices',
      title: 'Slices',
      blocks: [
        { kind: 'analogy', text: "A slice is a window cut into a longer document. It does not copy the text: it shows a stretch of the original, with a start and a length. Because the window is a borrow, the document cannot be edited or thrown away while the window is open." },
        { kind: 'code', code: `let s = String::from("hello world");
let hello: &str = &s[0..5];          // a string slice: pointer + length
let world = &s[6..];
let all = &s[..];

let a = [1, 2, 3, 4, 5];
let mid: &[i32] = &a[1..4];          // [2, 3, 4], a slice of any contiguous data

fn first_word(s: &str) -> &str {     // takes &str: accepts &String and literals too
    s.split_whitespace().next().unwrap_or("")
}
let w = first_word(&s);              // borrows s
// s.clear();                        // error: cannot borrow \`s\` as mutable while w is alive
println!("{w}");` },
        { kind: 'list', items: [
          '`&str` is a borrowed view of UTF-8 text, and `&[T]` is a borrowed view of a sequence. Both are a pointer plus a length (a "fat pointer"), and neither owns anything.',
          'String literals are `&\'static str`: slices into the program\'s read-only data, valid for the whole run.',
          '**Accept `&str` and `&[T]` in function parameters**, not `&String` and `&Vec<T>`. Callers can pass strings, literals, arrays and vectors alike (deref coercion).',
          'Slicing a string at an index that is not a UTF-8 character boundary **panics**: `&"héllo"[0..2]` splits the two-byte `é`. Use `char_indices` or `.get(0..2)` (returns `Option`) when the input is untrusted.',
          'Slices have many methods: `len`, `is_empty`, `first`, `last`, `split_at`, `chunks`, `windows`, `iter`, `contains`, `binary_search`, `sort` (for `&mut [T]`), `to_vec`.',
          'A `&mut [T]` lets you modify elements in place, but not change the length. `split_at_mut` gives two non-overlapping mutable halves, which is how the borrow rules are respected safely.',
        ] },
        { kind: 'new23', text: '`get_disjoint_mut` returns several `&mut` references to different elements at once, after checking at runtime that the indices are distinct. It replaces a lot of `split_at_mut` gymnastics:' },
        { kind: 'code', code: `let mut v = vec![10, 20, 30, 40];
if let Ok([a, b]) = v.get_disjoint_mut([0, 3]) {
    std::mem::swap(a, b);
}
assert_eq!(v, [40, 20, 30, 10]);

// Overlapping or out-of-range indices return Err instead of aliasing:
assert!(v.get_disjoint_mut([1, 1]).is_err());` },
        { kind: 'compare',
          cpp: `std::string_view hello = std::string_view(s).substr(0, 5);  // view; dangles if s changes
std::span<const int> mid{a.data() + 1, 3};                  // view; no lifetime checking`,
          go: `hello := s[0:5]        // shares memory with s; a later append to s may or may not alias
mid := a[1:4]          // shares memory and keeps the whole array alive`,
          python: `hello = s[0:5]         # a copy (str) or a copy (list)`,
          java: `String hello = s.substring(0, 5);   // a copy (since Java 7)
List<Integer> mid = a.subList(1, 4); // a live view`,
          ts: `const hello = s.slice(0, 5)        // a copy`,
          rust: `let hello = &s[0..5];   // a borrowed view: the compiler guarantees it cannot dangle
let mid = &a[1..4];`,
          note: 'Rust slices are `string_view` and `span` with the lifetime checking they lack: the original cannot be modified or dropped while the slice lives.' },
        { kind: 'check', q: 'Which parameter type is the most flexible for a function that only reads text?', options: ['`String`', '`&String`', '`&str`', '`&mut String`'], answer: 2, hint: 'What can you pass to it?', explain: '`&str` accepts string literals, `&String` (by deref coercion) and slices of other strings. `String` would force a move and `&String` would reject literals.' },
      ],
    },
    {
      id: 'nll',
      title: 'How the borrow checker thinks',
      blocks: [
        { kind: 'analogy', text: "The borrow checker is a strict but fair building inspector. It does not mind how long a scaffold is *declared* to stand: it only cares how long it is actually *used*. As soon as a reference is not needed any more, the loan is returned, so you can reuse the ground right away." },
        { kind: 'list', items: [
          '**Non-lexical lifetimes (NLL):** a borrow lasts from where it is created to its **last use**, not to the end of the block. That is why shared references in the earlier stepper stopped mattering after the `println!`.',
          '**Two-phase borrows:** `v.push(v.len())` compiles. The `&mut v` for `push` is reserved first and activated only after the argument `v.len()` (a shared read) is evaluated.',
          'Borrows through function calls follow the signature. `fn f(a: &mut Vec<i32>) -> &i32` returns a reference tied to the `&mut`, so `a` stays borrowed as long as the result is alive. (That is a lifetime relation, module 7.)',
          'Moving a value into a closure or thread (`move ||`) transfers ownership. The closure then owns it, and the original name is unusable.',
          'When the checker refuses a program, it is almost always telling you about a real **ownership design question**: who owns this, who may change it, and for how long? Answers: restructure, borrow for shorter, pass ownership, or share ownership (`Rc`/`Arc`).',
        ] },
        { kind: 'code', code: `let mut scores = vec![1, 2, 3];

// OK: borrow ends at its last use
let total: i32 = scores.iter().sum();
scores.push(total);

// OK: two-phase borrow
scores.push(scores.len() as i32);

// Fix for "cannot borrow as mutable because it is also borrowed as immutable":
let first = scores[0];       // copy the value out (i32 is Copy)
scores.push(first);

// Fix by scoping: take the borrow in a smaller block
{
    let last = scores.last().unwrap();
    println!("{last}");
}
scores.clear();` },
        { kind: 'pitfall', text: 'Do not fight the checker with `unsafe` or by cloning everything. Shorten the borrow, copy the small value out, split a struct into independent fields (the checker tracks fields separately), or use indices instead of references. These almost always resolve the error and leave the design better.' },
        { kind: 'check', q: 'Does this compile?', code: 'let mut v = vec![1, 2, 3];\nlet n = v.len();\nv.push(n as i32);\nlet r = &v;\nprintln!("{}", r.len());\nv.push(0);', options: ['No: `r` is still alive at the last line', 'Yes: `r` is last used before the final `push`', 'No: `v` is moved by `len`', 'Only in release mode'], answer: 1, hint: 'Where is the last use of `r`?', explain: 'With NLL the shared borrow `r` ends after `println!`, so the later `push` is fine. `len` only borrows.' },
      ],
    },
  ],
  quiz: [
    { q: 'What are the three ownership rules?', options: ['Every value has one owner; one owner at a time; the value is dropped when the owner leaves scope', 'Every value is reference counted; owners are tracked at runtime; values are freed by the GC', 'Values are copied on assignment; owners are optional; values live forever', 'Only the stack can own values'], answer: 0, explain: 'These three rules let the compiler insert the free call exactly once, at a known point, with no collector.' },
    { q: 'What happens to `a` after `let b = a;` when `a` is a `String`?', options: ['Both stay valid', '`a` is moved: using it is a compile error', '`a` is set to an empty string', 'The program panics at runtime'], answer: 1, explain: 'Ownership moved to `b`. The compiler rejects any later use of `a` with "borrow of moved value".' },
    { q: 'Which of these types is `Copy`?', options: ['`String`', '`Vec<i32>`', '`(i32, bool)`', '`Box<i32>`'], answer: 2, explain: 'Tuples of `Copy` types are `Copy`. Types that own heap memory (`String`, `Vec`, `Box`) are not.' },
    { q: 'Which combination of borrows is allowed at the same time?', options: ['Two `&mut T`', 'One `&mut T` and one `&T`', 'Three `&T`', 'One `&mut T` per method call'], answer: 2, explain: 'Any number of shared references are fine. An exclusive reference must be alone.' },
    { q: 'Why does `let first = &v[0]; v.push(4); println!("{first}");` fail?', options: ['`v` is not declared mutable', '`push` may reallocate, which would leave `first` dangling', 'You cannot index a Vec', '`first` is a copy'], answer: 1, explain: 'The shared borrow `first` is still used after the mutable borrow for `push`, which could move the buffer.' },
    { q: 'What does a borrow last under non-lexical lifetimes?', options: ['Until the end of the enclosing block', 'Until the end of the function', 'Until its last use', 'Until the owner is dropped'], answer: 2, explain: 'NLL ends a borrow after its last use, which accepts many programs the older block-based rule rejected.' },
    { q: 'Which parameter is best for a function that reads a sequence of `i32` values?', options: ['`Vec<i32>`', '`&Vec<i32>`', '`&[i32]`', '`&mut Vec<i32>`'], answer: 2, explain: '`&[i32]` accepts arrays, vectors and sub-slices without taking ownership.' },
    { q: 'What happens when you slice `&"héllo"[0..2]`?', options: ['It returns "h"', 'It returns "hé"', 'It panics: 2 is not a character boundary', 'It returns a copy of the bytes'], answer: 2, explain: '`é` takes two bytes (bytes 1 and 2), so index 2 falls in the middle of a character. `str::get` returns `None` instead of panicking.' },
    { q: 'In what order are locals dropped at the end of a scope?', options: ['In declaration order', 'In reverse declaration order', 'In random order', 'Largest first'], answer: 1, explain: 'Later variables may borrow from earlier ones, so they are dropped first.' },
    { q: 'What does `std::mem::take(&mut x)` do?', options: ['Moves `x` into a new thread', 'Returns the old value of `x` and leaves `Default::default()` behind', 'Copies `x`', 'Drops `x` and invalidates it'], answer: 1, explain: 'It is the safe way to move a value out of something you only hold by `&mut`, because something valid is left behind.' },
  ],
}
