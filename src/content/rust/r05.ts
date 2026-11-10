import type { Module } from '../types'

export const r05: Module = {
  n: 5,
  title: 'Collections and Strings',
  tour: '8 · Common Collections',
  summary: 'Vec, String and HashMap in depth: growth, indexing, UTF-8, the Entry API, and choosing between collections.',
  topics: ['Vec', 'String & &str', 'HashMap & Entry', 'BTreeMap & others', 'Choosing a collection'],
  cpp23: [
    '`Vec::extract_if(range, pred)` removes matching elements and yields them (Rust 1.87). `HashMap::extract_if` and `HashSet::extract_if` followed in Rust 1.88.',
    '`Vec::pop_if` pops the last element only if a predicate holds (Rust 1.86), and `slice::as_chunks` splits a slice into fixed-size arrays (Rust 1.88).',
    '`BTreeMap::pop_first` / `pop_last` and `first_key_value` give an ordered queue without a second structure (Rust 1.66).',
    '`HashMap::get_disjoint_mut` borrows several values mutably at once (Rust 1.86).',
  ],
  lessons: [
    {
      id: 'vec',
      title: 'Vec: the workhorse',
      blocks: [
        { kind: 'analogy', text: "A `Vec` is a bookshelf that you own. The shelf has a fixed number of slots at any moment (**capacity**), and the books actually on it are its **length**. When the shelf is full and you add another book, Rust builds a bigger shelf (usually twice the size), moves all the books across and throws the old one away. That is why you must not hold a reference to a book on the old shelf while adding: the borrow checker enforces it." },
        { kind: 'code', code: `let mut v: Vec<i32> = Vec::new();      // empty, no allocation yet
let mut w = vec![1, 2, 3];              // macro for a literal vec
let mut big = Vec::with_capacity(1000); // allocate once, up front

v.push(10);                             // amortised O(1)
w.extend([4, 5]);
let last = w.pop();                     // Some(5)
w.insert(1, 99);                        // O(n): shifts later elements
let x = w.remove(0);                    // O(n)
let y = w.swap_remove(0);               // O(1): swaps with the last element, order not kept

let a = w[1];                           // panics if out of range
let b = w.get(10);                      // None if out of range: no panic
for x in &w { println!("{x}"); }        // borrow each
for x in &mut w { *x += 1; }            // modify each in place
for x in w { println!("{x}"); }         // consume: w is moved

w.retain(|x| x % 2 == 0);               // keep only evens
w.sort();  w.dedup();                   // sort, remove adjacent duplicates
w.truncate(2);  w.clear();
let firsts: Vec<i32> = w.drain(..2).collect();   // remove a range and iterate over it` },
        { kind: 'stepper', title: 'Growth and reallocation', code: [
          'let mut v = Vec::with_capacity(2);',
          'v.push(1);',
          'v.push(2);',
          'v.push(3);',
        ], steps: [
          { line: 1, note: 'One allocation with room for two elements. Length is 0, capacity is 2.', memory: [{ name: 'v', value: 'len 0, cap 2', kind: 'ptr' }, { name: 'buf#1', value: '[_, _]', kind: 'heap' }] },
          { line: 2, note: 'There is room, so `push` just writes the element. No allocation.', memory: [{ name: 'v', value: 'len 1, cap 2', kind: 'ptr' }, { name: 'buf#1', value: '[1, _]', kind: 'heap' }] },
          { line: 3, note: 'Still room. The buffer is now full.', memory: [{ name: 'v', value: 'len 2, cap 2', kind: 'ptr' }, { name: 'buf#1', value: '[1, 2]', kind: 'heap' }] },
          { line: 4, note: 'Full: Rust allocates a larger buffer (at least double), moves the elements, and frees the old one. Any reference into `buf#1` would now dangle, which is exactly what the borrow checker prevents.', memory: [{ name: 'v', value: 'len 3, cap 4', kind: 'ptr' }, { name: 'buf#1', value: 'freed', kind: 'dead' }, { name: 'buf#2', value: '[1, 2, 3, _]', kind: 'heap' }] },
        ] },
        { kind: 'list', items: [
          'Elements are stored **contiguously**, so iteration is cache-friendly. This is why `Vec` is the right default for almost every sequence.',
          '`v[i]` panics on a bad index. `v.get(i)` returns an `Option` and is the choice when the index comes from input. Use `first`, `last`, `split_first` for the ends.',
          '`Vec::with_capacity(n)` avoids repeated reallocation when you know the size, and `reserve` does the same for an existing vector. `shrink_to_fit` gives back unused space.',
          '`Vec<T>` derefs to a slice `[T]`, so every slice method (module 2) works on it: `sort`, `iter`, `windows`, `binary_search`, `contains`, `join`, `concat`.',
          'To store different types in one `Vec`, use an enum (closed set of variants) or `Vec<Box<dyn Trait>>` (open set, module 7).',
          '`sort` is stable, `sort_unstable` is usually faster and does not preserve the order of equal items. Floats need `sort_by(f64::total_cmp)` because they are not `Ord`. `sort_by_key` and `sort_by_cached_key` sort by a computed key.',
        ] },
        { kind: 'new23', text: 'Removing elements while keeping them is a common need. `extract_if` yields the removed items, and `pop_if` conditionally pops:' },
        { kind: 'code', code: `let mut v = vec![1, 2, 3, 4, 5, 6];
let evens: Vec<i32> = v.extract_if(.., |x| *x % 2 == 0).collect();   // Rust 1.87
assert_eq!(v, [1, 3, 5]);
assert_eq!(evens, [2, 4, 6]);

let mut s = vec![1, 2, 3];
let popped = s.pop_if(|last| *last > 2);                              // Rust 1.86: Some(3)

let data = [1, 2, 3, 4, 5, 6, 7];
let (chunks, rest) = data.as_chunks::<3>();                           // Rust 1.88
// chunks: &[[i32; 3]] = [[1,2,3],[4,5,6]], rest: &[i32] = [7]` },
        { kind: 'compare',
          cpp: `std::vector<int> v;  v.push_back(1);
v.at(10);              // throws; v[10] is undefined behaviour
v.erase(std::remove_if(v.begin(), v.end(), pred), v.end());   // erase-remove idiom`,
          go: `v := []int{}; v = append(v, 1)
x := v[10]             // runtime panic
v = slices.DeleteFunc(v, pred)`,
          python: `v = []; v.append(1)
v[10]                  # IndexError
v = [x for x in v if keep(x)]`,
          java: `List<Integer> v = new ArrayList<>(); v.add(1);
v.get(10);             // IndexOutOfBoundsException
v.removeIf(pred);`,
          ts: `const v: number[] = []; v.push(1)
v[10]                  // undefined, silently`,
          rust: `let mut v = vec![1];
v.get(10);             // None; v[10] panics
v.retain(|x| keep(x));`,
          note: '`Vec` is `std::vector` with checked indexing, a safe borrowing model, and `retain` instead of the erase-remove idiom.' },
        { kind: 'check', q: 'Which call returns an `Option` instead of panicking on a bad index?', options: ['`v[5]`', '`v.get(5)`', '`v.remove(5)`', '`v.swap_remove(5)`'], answer: 1, hint: 'The name says "try to get".', explain: '`get` returns `None` if the index is out of range. Indexing, `remove` and `swap_remove` all panic.' },
        { kind: 'check', q: 'Why must you not hold `&v[0]` across a `v.push(...)`?', options: ['`push` is unsafe', 'The push may reallocate and move the elements, leaving the reference dangling', 'References are copies', 'Vec is immutable'], answer: 1, hint: 'Look at the stepper.', explain: 'When capacity is exceeded the buffer moves. The borrow checker prevents the dangling pointer at compile time.' },
      ],
    },
    {
      id: 'strings',
      title: 'Strings and UTF-8',
      blocks: [
        { kind: 'analogy', text: "Text is a string of beads where the beads have different widths: a plain `a` is one bead, `é` is two, a Japanese character is three, and an emoji is four. If someone asks for the third bead you can find it by counting, but asking for the third centimetre of the string may land in the middle of a bead. That is why Rust refuses to let you write `s[2]`." },
        { kind: 'code', code: `let mut s = String::new();             // owned, growable, UTF-8
let a = "literal";                      // &'static str: a view into the binary
let b = String::from("owned");
let c = "from".to_string();             // also: "x".to_owned(), "x".into()

s.push_str("hello");  s.push(' ');  s += "world";
let joined = format!("{s}-{b}");        // does not take ownership of its arguments
let t = b + "!" + &c;                   // + moves the left String, borrows the right

println!("{}", "héllo".len());          // 6 bytes
println!("{}", "héllo".chars().count()); // 5 chars (Unicode scalar values)
// let x = s[0];                        // error: strings cannot be indexed by integer

for ch in "héllo".chars() {}            // chars (scalar values)
for b in "héllo".bytes() {}             // raw UTF-8 bytes
for (i, ch) in "héllo".char_indices() {} // byte offset + char
let first = "héllo".chars().next();     // Some('h')
let bit = &"héllo"[0..1];               // "h": slicing by byte range must hit boundaries

let up = s.to_uppercase();
let parts: Vec<&str> = "a,b,,c".split(',').collect();     // ["a", "b", "", "c"]
let trimmed = "  x ".trim();
let has = s.contains("lo");  let starts = s.starts_with("he");
let replaced = s.replace("l", "L");
let n: i32 = "42".parse().unwrap();
for line in "one\ntwo".lines() {}` },
        { kind: 'list', items: [
          '`String` is a `Vec<u8>` that is guaranteed to hold valid UTF-8. `&str` is the borrowed slice of that. Use `&str` for parameters and `String` when you need to own or modify the text.',
          '`.len()` is the **number of bytes**, not characters. `.chars().count()` is the number of Unicode scalar values. A user-perceived character (a **grapheme cluster**, like a flag or an accented letter built from two scalars) needs the `unicode-segmentation` crate.',
          'Why no `s[i]`? It would be O(1) for bytes but ambiguous (a byte? a char?) and could land inside a character. Rust makes you pick: `.as_bytes()[i]`, `.chars().nth(i)` or a checked slice.',
          '`+` takes ownership of the left operand (it reuses its buffer) and borrows the right: `a + &b`. For more than two pieces, `format!` or repeated `push_str` is clearer and avoids moves.',
          '`OsString`/`OsStr` and `Path`/`PathBuf` are separate types for file-system strings that may not be valid UTF-8. `CString` is for C interop. Never use `String` for file paths in robust tools.',
          'Parsing is `str::parse::<T>()`, and printing is `Display`: `to_string()` works for anything implementing it.',
        ] },
        { kind: 'pitfall', text: '`&s[0..n]` with a byte count `n` from user input will panic when `n` falls inside a multi-byte character. Use `s.get(0..n)` (returns `Option`), or `s.char_indices().nth(n)` to find a real boundary.' },
        { kind: 'compare',
          cpp: `std::string s = "héllo";
s.size();                          // 6 bytes; no Unicode awareness at all
s[1];                              // a byte`,
          go: `s := "héllo"
len(s)                             // 6 bytes
for i, r := range s {}             // runes: i is the byte offset
s[1]                               // a byte`,
          python: `s = "héllo"
len(s)                             # 5 code points
s[1]                               # "é": O(1) because of the internal representation`,
          java: `String s = "héllo";
s.length();                        // 5 UTF-16 code units
s.charAt(1);                       // a UTF-16 unit; surrogate pairs split emojis`,
          ts: `"héllo".length                // UTF-16 units
"héllo"[1]                         // a UTF-16 unit`,
          rust: `let s = "héllo";
s.len();                           // 6 bytes
s.chars().count();                 // 5 scalar values
// s[1] is a compile error`,
          note: 'Rust treats text as UTF-8 end to end and makes the unit explicit every time. Go is closest, and Python hides the question with a heavier representation.' },
        { kind: 'check', q: 'What is `"é".len()`?', options: ['1', '2', '4', 'It does not compile'], answer: 1, hint: 'The length is in bytes of UTF-8.', explain: '`é` (U+00E9) takes two bytes in UTF-8. `.chars().count()` is 1.' },
        { kind: 'check', q: 'Which expression is invalid?', options: ['`s.chars().nth(2)`', '`&s[0..2]` on ASCII text', '`s[2]`', '`s.as_bytes()[2]`'], answer: 2, hint: 'Strings cannot be indexed by integer.', explain: 'Direct integer indexing is rejected. Use bytes, chars or a slice range.' },
      ],
    },
    {
      id: 'hashmap',
      title: 'HashMap and the Entry API',
      blocks: [
        { kind: 'analogy', text: "A `HashMap` is a coat check. You hand over a coat and receive a numbered ticket (the hash decides the hook), and later the ticket gets the coat back in one step, no matter how many coats are in the room. The **Entry API** is the attendant who says: \"is there already a coat for this name? If so, hand me that one, and if not, hang up this new one\", all in a single visit." },
        { kind: 'code', code: `use std::collections::HashMap;

let mut px: HashMap<String, f64> = HashMap::new();
px.insert("XAU".to_string(), 2390.5);       // returns the old value as an Option
px.insert("EUR".to_string(), 1.08);

let a = px.get("XAU");                      // Option<&f64>: borrow, any &str works as key
let b = px["XAU"];                          // panics if the key is missing
if let Some(v) = px.get_mut("EUR") { *v *= 1.01; }
px.remove("EUR");
let has = px.contains_key("XAU");

// Entry API: one lookup for "insert if missing, then update"
let mut counts: HashMap<char, u32> = HashMap::new();
for ch in "mississippi".chars() {
    *counts.entry(ch).or_insert(0) += 1;                  // or_default() for Default::default()
}

let mut groups: HashMap<u8, Vec<&str>> = HashMap::new();
for w in ["a", "bb", "cc", "d"] {
    groups.entry(w.len() as u8).or_default().push(w);     // build a Vec per key
}
px.entry("GBP".into()).and_modify(|v| *v += 0.1).or_insert(1.27);

for (k, v) in &px { println!("{k}: {v}"); }              // order is arbitrary and may change per run
let from_pairs = HashMap::from([("a", 1), ("b", 2)]);
let collected: HashMap<_, _> = vec![("x", 1)].into_iter().collect();` },
        { kind: 'list', items: [
          'Keys must implement `Eq` and `Hash`: integers, strings, tuples, and structs with `#[derive(Hash, Eq, PartialEq)]`. `f64` is not `Hash` or `Eq` because of NaN, so wrap it or use integers (ticks, cents) as keys.',
          '**Ownership:** `insert` moves the key and value into the map. For `Copy` types they are copied. A map owns its keys and values.',
          '`get` takes a **borrowed form** of the key: a `HashMap<String, _>` can be queried with `&str`, avoiding an allocation per lookup.',
          'The default hasher (SipHash) resists hash-flooding attacks but is slower than necessary for trusted keys. In hot paths people use `rustc_hash::FxHashMap` or `ahash`, and pre-size with `HashMap::with_capacity`.',
          'Iteration order is **unspecified and can differ between runs**. If you need order, use `BTreeMap`, or sort the keys, or an `IndexMap` from the `indexmap` crate.',
          'The **Entry API** (`entry(k).or_insert(v)`, `or_insert_with`, `or_default`, `and_modify`) does one hash lookup where "check, then insert, then get" would do three. It is also the only way to update a value in place that satisfies the borrow checker without a second lookup.',
        ] },
        { kind: 'compare',
          cpp: `std::unordered_map<std::string, double> m;
m["XAU"] = 2390.5;                 // operator[] inserts a default if missing!
auto it = m.find("EUR");           // iterator or end()`,
          go: `m := map[string]float64{}
m["XAU"] = 2390.5
v, ok := m["EUR"]                  // zero value + ok flag
// concurrent writes without a lock crash the program`,
          python: `m = {}
m["XAU"] = 2390.5
m.get("EUR")                       # None
from collections import Counter, defaultdict`,
          java: `Map<String, Double> m = new HashMap<>();
m.put("XAU", 2390.5);
m.merge("EUR", 1.0, Double::sum);  // the Entry API of Java`,
          ts: `const m = new Map<string, number>()
m.set("XAU", 2390.5)
m.get("EUR")                       // undefined`,
          rust: `let mut m = HashMap::new();
m.insert("XAU", 2390.5);
m.get("EUR");                      // None
*m.entry("EUR").or_insert(0.0) += 1.0;`,
          note: 'Rust\'s `entry` does what `defaultdict`, `Counter`, `merge` and `computeIfAbsent` do, in one tool, and `m[k]` never inserts silently the way C++ `operator[]` does.' },
        { kind: 'check', q: 'What does `*counts.entry(ch).or_insert(0) += 1;` do?', options: ['Panics if the key is missing', 'Inserts 0 if missing, then increments the value in the map', 'Replaces the value with 1 always', 'Creates a copy of the map'], answer: 1, hint: '`or_insert` returns a mutable reference.', explain: '`or_insert(0)` returns `&mut V` (inserting the default first if needed), and `*... += 1` modifies it in place.' },
        { kind: 'check', q: 'Why can\'t `f64` be a `HashMap` key?', options: ['It is too large', 'It does not implement `Eq` and `Hash` because of NaN', 'Floats are always unequal', 'Only strings can be keys'], answer: 1, hint: 'NaN != NaN.', explain: 'A key must have reflexive equality (`a == a`). NaN breaks that, so `f64` implements neither `Eq` nor `Hash`.' },
      ],
    },
    {
      id: 'others',
      title: 'BTreeMap, sets, deques and heaps',
      blocks: [
        { kind: 'analogy', text: "The standard library is a toolbox. `HashMap` is a pigeonhole wall (fast, unordered). `BTreeMap` is a filing cabinet in alphabetical order (a little slower, but you can ask for \"everything from M to P\"). `VecDeque` is a queue at a bus stop (add at the back, leave from the front). `BinaryHeap` is a to-do pile where the most urgent item is always on top." },
        { kind: 'code', code: `use std::collections::{BTreeMap, BTreeSet, BinaryHeap, HashSet, VecDeque};
use std::cmp::Reverse;

// BTreeMap: sorted by key, range queries
let mut book: BTreeMap<u32, u32> = BTreeMap::new();     // price ticks -> size
book.insert(9950, 10);  book.insert(9951, 5);  book.insert(9948, 7);
let best = book.last_key_value();                        // Some((&9951, &5))
for (px, sz) in book.range(9949..) { println!("{px} {sz}"); }   // ascending from 9949
let worst = book.pop_first();                            // remove the smallest

// Sets
let mut seen: HashSet<&str> = HashSet::new();
let fresh = seen.insert("XAU");                          // true if it was new
let a: HashSet<i32> = [1, 2, 3].into();  let b: HashSet<i32> = [2, 3, 4].into();
let both: Vec<_> = a.intersection(&b).collect();        // also union, difference
let sorted: BTreeSet<_> = a.iter().copied().collect();

// VecDeque: a ring buffer with O(1) at both ends
let mut q: VecDeque<i32> = VecDeque::new();
q.push_back(1);  q.push_back(2);  q.push_front(0);
let next = q.pop_front();                                // Some(0)

// BinaryHeap: a max-heap. Reverse(x) turns it into a min-heap.
let mut heap = BinaryHeap::new();
heap.push(Reverse((5, "e")));  heap.push(Reverse((1, "a")));
let Reverse((prio, name)) = heap.pop().unwrap();         // (1, "a")` },
        { kind: 'list', items: [
          '**HashMap / HashSet**: O(1) average insert and lookup, unordered. The default choice for a lookup table.',
          '**BTreeMap / BTreeSet**: O(log n), always sorted, with `range`, `first_key_value`, `last_key_value`, `pop_first` and `pop_last`. The right choice for an order book, a time series index, or anything where you need the nearest key or sorted iteration. It is also cache-friendlier than a binary tree because nodes hold many keys.',
          '**VecDeque**: a growable ring buffer. O(1) at both ends, indexable. Use it for queues, sliding windows and BFS. `Vec` is a bad queue because removing from the front is O(n).',
          '**BinaryHeap**: O(log n) push and pop of the largest item, O(1) peek. Use `Reverse` for a min-heap. It gives the next item to process in priority-queue scheduling and Dijkstra. Iterating it is **not** sorted order.',
          '**LinkedList** exists but is almost never right: poor cache behaviour and no real benefit in safe Rust.',
          'All of these live in `std::collections`, own their elements, and implement `IntoIterator`, `FromIterator` and `Extend`.',
        ] },
        { kind: 'check', q: 'You need the smallest key and ordered traversal of a map. Which collection?', options: ['`HashMap`', '`BTreeMap`', '`VecDeque`', '`HashSet`'], answer: 1, hint: 'Which one keeps keys sorted?', explain: '`BTreeMap` keeps keys sorted and offers `first_key_value`, `range` and ordered iteration.' },
        { kind: 'check', q: 'How do you get a min-heap from `BinaryHeap`?', options: ['`BinaryHeap::min()`', 'Wrap items in `Reverse`', 'Sort the heap', 'It is not possible'], answer: 1, hint: 'The heap always pops the largest by `Ord`.', explain: '`Reverse<T>` flips the ordering, so the "largest" is the smallest underlying value.' },
      ],
    },
    {
      id: 'choosing',
      title: 'Choosing a collection',
      blocks: [
        { kind: 'analogy', text: "Picking a collection is like picking a vehicle: a delivery van (`Vec`) handles most trips, a filing cabinet on wheels (`BTreeMap`) when order matters, and a lookup desk (`HashMap`) when you only ever ask for one thing by name. A sports car is no use in a field, so decide by the journey: how will I read, insert, remove, and in what order?" },
        { kind: 'list', items: [
          '**Default to `Vec`.** Contiguous memory beats most fancier structures until you have thousands of elements and a profile saying otherwise. Even membership tests on a few dozen items are often faster in a `Vec` than in a `HashSet`.',
          'Need lookup by key? `HashMap`. Need keys sorted or range queries? `BTreeMap`. Need uniqueness only? `HashSet` or `BTreeSet`.',
          'Need FIFO or a sliding window? `VecDeque`. Need "most urgent next"? `BinaryHeap`.',
          'Need a fixed number of items known at compile time? An array `[T; N]`: no heap allocation at all.',
          'Need to keep insertion order and key lookup? The `indexmap` crate. Need a small sorted list searched by `binary_search`? A sorted `Vec`.',
          'For repeated lookups of strings, keys of type `&str` into a `HashMap<&str, _>` avoid allocating, as long as the source text outlives the map.',
          '**Measure** before swapping: write a benchmark with `criterion` or `divan` on realistic data sizes, in release mode.',
        ] },
        { kind: 'code', code: `// Example: top-N most frequent words
use std::collections::HashMap;

fn top_words(text: &str, n: usize) -> Vec<(&str, usize)> {
    let mut counts: HashMap<&str, usize> = HashMap::new();
    for w in text.split_whitespace() {
        *counts.entry(w).or_default() += 1;       // borrows from text: no String allocation
    }
    let mut v: Vec<_> = counts.into_iter().collect();
    v.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(b.0)));   // by count desc, then word asc
    v.truncate(n);
    v
}` },
        { kind: 'pitfall', text: 'Reaching for `HashMap<String, Vec<String>>` everywhere is Python habit. In Rust, borrowing (`&str`) and plain `Vec` of structs are cheaper and often clearer. Ask who owns the data and how long it must live before choosing owned types.' },
        { kind: 'check', q: 'You will process items first-in, first-out and push and pop millions of times. Which collection?', options: ['`Vec`', '`VecDeque`', '`BTreeMap`', '`HashSet`'], answer: 1, hint: 'Removing from the front of a `Vec` shifts everything.', explain: '`VecDeque` is a ring buffer with O(1) push and pop at both ends.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is the difference between a `Vec`\'s length and capacity?', options: ['They are the same', 'Length is the number of elements, capacity is the allocated room', 'Capacity is the number of bytes', 'Length is the allocated room'], answer: 1, explain: 'Pushing beyond the capacity reallocates. `with_capacity` avoids that.' },
    { q: 'What does `v.get(10)` return when `v` has 3 elements?', options: ['A panic', 'The last element', '`None`', '0'], answer: 2, explain: '`get` is the non-panicking accessor and returns an `Option<&T>`.' },
    { q: 'Why is `s[0]` not allowed on a `String`?', options: ['Strings are immutable', 'Characters have different byte widths in UTF-8, so the meaning is ambiguous', 'It is slow', 'Strings have no length'], answer: 1, explain: 'A byte index may land inside a character, and "the first character" would not be O(1). Choose bytes, chars or a checked slice.' },
    { q: 'What does `let c = a + &b;` do for `String`s?', options: ['Copies both', 'Moves `a` (reusing its buffer) and borrows `b`', 'Borrows both', 'Does not compile'], answer: 1, explain: '`+` takes the left operand by value. Afterwards `a` is unusable.' },
    { q: 'What is `"héllo".chars().count()`?', options: ['5', '6', '7', '4'], answer: 0, explain: 'It counts Unicode scalar values. `.len()` would give 6 bytes.' },
    { q: 'Which is true of `HashMap` iteration order?', options: ['Insertion order', 'Sorted by key', 'Unspecified and can change between runs', 'Reverse insertion order'], answer: 2, explain: 'Use `BTreeMap` for sorted order, or `indexmap` for insertion order.' },
    { q: 'What is the advantage of the Entry API?', options: ['It is shorter only', 'It does one lookup for the check, insert and update', 'It allows duplicate keys', 'It avoids hashing'], answer: 1, explain: '`entry(k).or_insert(v)` finds the slot once and returns a mutable reference to the value.' },
    { q: 'Which collection supports `range(a..b)` queries on keys?', options: ['`HashMap`', '`BTreeMap`', '`VecDeque`', '`BinaryHeap`'], answer: 1, explain: 'Sorted structure: `BTreeMap` and `BTreeSet` provide ordered `range` iteration.' },
    { q: 'What does `BinaryHeap::pop` return by default?', options: ['The smallest item', 'The largest item', 'The oldest item', 'A random item'], answer: 1, explain: 'It is a max-heap. Wrap items in `std::cmp::Reverse` to get min-heap behaviour.' },
    { q: 'Which is the best default collection when in doubt?', options: ['`LinkedList`', '`Vec`', '`HashMap`', '`BinaryHeap`'], answer: 1, explain: 'Contiguous storage is cache-friendly, and most workloads never need more.' },
  ],
}
