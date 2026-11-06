import type { Module } from '../types'

export const g15: Module = {
  n: 15,
  title: 'Iterators',
  tour: 'Added · Iterators',
  summary: 'Range-over-func iterators, iter.Seq and Seq2, writing and composing iterators, early exit, pull iterators, and the iterator APIs across the standard library.',
  topics: ['Range over functions', 'iter.Seq & Seq2', 'Writing iterators', 'Composing & early exit', 'Pull iterators', 'Iterators in the standard library'],
  cpp23: [
    'Range over func and the `iter` package (Go 1.23).',
    '`slices.All`, `Values`, `Collect`, `Sorted`, `Chunk`; `maps.Keys`, `Values`, `All` (Go 1.23).',
    '`strings.Lines`, `SplitSeq`, `FieldsSeq`; `bytes` equivalents (Go 1.24).',
    '`reflect` iterator methods (Go 1.26).',
  ],
  lessons: [
    {
      id: 'range',
      title: 'Range over functions',
      blocks: [
        { kind: 'analogy', text: "An iterator in Go is a vending machine you give a callback to: \"each time you have an item, hand it to this function\". The callback is `yield`. The `for ... range` loop is that callback, written as an ordinary loop body. If the loop `break`s, `yield` returns false and the machine stops dispensing." },
        { kind: 'code', code: `// An iterator is just a function that takes a yield callback
func Countdown(n int) iter.Seq[int] {           // iter.Seq[int] = func(yield func(int) bool)
    return func(yield func(int) bool) {
        for i := n; i > 0; i-- {
            if !yield(i) {                       // consumer broke out: stop
                return
            }
        }
    }
}

for i := range Countdown(3) {
    fmt.Println(i)                               // 3 2 1
}

// The compiler rewrites the loop above roughly into:
Countdown(3)(func(i int) bool {
    fmt.Println(i)
    return true                                  // false if the body did break / return
})` },
        { kind: 'list', items: [
          'Three function shapes can be ranged over: `func(yield func() bool)`, `func(yield func(V) bool)` and `func(yield func(K, V) bool)`.',
          '`iter.Seq[V]` and `iter.Seq2[K, V]` are named types for the last two.',
          'Iterators are **push** style: the iterator drives the loop and calls your body. That makes them easy to write, even for recursive structures like trees.',
        ] },
        { kind: 'compare',
          python: `def countdown(n):
    while n > 0:
        yield n          # generator: pauses here
        n -= 1
for i in countdown(3): print(i)`,
          ts: `function* countdown(n: number) {
  for (let i = n; i > 0; i--) yield i
}
for (const i of countdown(3)) console.log(i)`,
          java: `IntStream.iterate(3, i -> i > 0, i -> i - 1)
         .forEach(System.out::println);`,
          cpp: `std::generator<int> countdown(int n) {
    for (int i = n; i > 0; --i) co_yield i;
}
for (int i : countdown(3)) std::println("{}", i);`,
          go: `func Countdown(n int) iter.Seq[int] {
    return func(yield func(int) bool) {
        for i := n; i > 0; i-- {
            if !yield(i) { return }
        }
    }
}`,
          note: 'Go needs no coroutine machinery: `yield` is a plain function call, and the loop body becomes the callback.' },
        { kind: 'pitfall', text: 'Ignoring `yield`\'s return value and calling it again after the loop broke out causes a runtime panic ("range function continued iteration after function for loop body returned false"). Always `if !yield(v) { return }`.' },
        { kind: 'check', q: 'The loop body executes `break` on the first element. What does the iterator see?', options: ['Nothing; it keeps going', '`yield` returns false, so the iterator should return', 'A panic immediately', 'An error value'], answer: 1, hint: 'What does the compiler make the callback return when the body breaks?', explain: 'Break, return or goto out of the body make `yield` return false. The iterator must stop calling it.' },
      ],
    },
    {
      id: 'writing',
      title: 'Writing iterators',
      blocks: [
        { kind: 'analogy', text: "Writing an iterator is describing a walk: \"go through the tree left, middle, right, and hand over each value\". Because yield is just a callback, the walk can be recursive, can hold resources with `defer`, and can stop the moment the reader has seen enough." },
        { kind: 'code', code: `// Seq2: key/value pairs, e.g. index and bar
func (s *Series) All() iter.Seq2[int, Bar] {
    return func(yield func(int, Bar) bool) {
        for i, b := range s.bars {
            if !yield(i, b) { return }
        }
    }
}
for i, bar := range series.All() { ... }

// In-order tree walk: recursion is natural with push iterators
func (t *Tree[T]) Walk() iter.Seq[T] {
    return func(yield func(T) bool) { t.walk(yield) }
}
func (t *Tree[T]) walk(yield func(T) bool) bool {
    if t == nil { return true }
    return t.Left.walk(yield) && yield(t.Val) && t.Right.walk(yield)
}

// Reading lines lazily, with cleanup guaranteed even on early break
func Lines(path string) iter.Seq2[string, error] {
    return func(yield func(string, error) bool) {
        f, err := os.Open(path)
        if err != nil { yield("", err); return }
        defer f.Close()                          // runs when the loop ends, however it ends
        sc := bufio.NewScanner(f)
        for sc.Scan() {
            if !yield(sc.Text(), nil) { return }
        }
        if err := sc.Err(); err != nil { yield("", err) }
    }
}` },
        { kind: 'list', items: [
          'By convention, a type\'s main iterator method is named `All`, with variants like `Values`, `Keys` and `Backward`.',
          'An iterator can be single-use (reading a file) or reusable (walking a slice). Document which.',
          'Yielding `(value, error)` pairs with `Seq2[T, error]` is the common pattern for fallible streams.',
        ] },
        { kind: 'check', q: 'Why is `defer f.Close()` inside the iterator function safe even if the loop breaks early?', options: ['It isn\'t', 'yield returns false, the iterator returns, and its defers run', 'The GC closes files', 'Go closes files at the end of main'], answer: 1, hint: 'Follow the path after the body breaks.', explain: 'Early exit is just the iterator function returning, so deferred cleanup happens normally.' },
      ],
    },
    {
      id: 'compose',
      title: 'Composing iterators',
      blocks: [
        { kind: 'analogy', text: "Iterator adapters are pipe fittings: one takes a stream and only lets matching values through (filter), another reshapes each value (map), and another stops after N (take). Screw them together and data flows one value at a time from source to tap, with no intermediate slices." },
        { kind: 'code', code: `func Filter[V any](seq iter.Seq[V], keep func(V) bool) iter.Seq[V] {
    return func(yield func(V) bool) {
        for v := range seq {
            if keep(v) && !yield(v) { return }
        }
    }
}

func Map[V, W any](seq iter.Seq[V], f func(V) W) iter.Seq[W] {
    return func(yield func(W) bool) {
        for v := range seq {
            if !yield(f(v)) { return }
        }
    }
}

func Take[V any](seq iter.Seq[V], n int) iter.Seq[V] {
    return func(yield func(V) bool) {
        if n <= 0 { return }
        i := 0
        for v := range seq {
            if !yield(v) { return }
            if i++; i == n { return }
        }
    }
}

big := Take(Filter(slices.Values(trades), func(t Trade) bool { return t.Qty > 100 }), 5)
top := slices.Collect(Map(big, func(t Trade) string { return t.Sym }))   // materialise` },
        { kind: 'p', text: 'The standard library deliberately doesn\'t ship `Filter`, `Map` and `Take` yet; they are a few lines each, as above. `slices.Collect` turns any `iter.Seq` into a slice, and `slices.Sorted` collects and sorts.' },
        { kind: 'check', q: 'How many trades does the `Take(..., 5)` pipeline inspect if the first 5 trades all have Qty > 100?', options: ['All of them', 'Exactly 5', '6', '0 until Collect is called, then all'], answer: 1, hint: 'What happens to the source once Take stops yielding?', explain: 'Take returns after 5 values; Filter\'s yield returns false, and the source loop stops. Iterators are lazy end to end.' },
      ],
    },
    {
      id: 'pull',
      title: 'Pull iterators',
      blocks: [
        { kind: 'analogy', text: "Push iterators are a conveyor belt that runs until you shout stop. Sometimes you need to take items yourself, one at a time, from **two** belts at once, e.g. merging two sorted price feeds. `iter.Pull` turns a belt into a \"next please\" button you press when you want the next item." },
        { kind: 'code', code: `// Merge two sorted streams of timestamps
func Merge(a, b iter.Seq[int64]) iter.Seq[int64] {
    return func(yield func(int64) bool) {
        nextA, stopA := iter.Pull(a)
        defer stopA()                          // always release the pull iterator
        nextB, stopB := iter.Pull(b)
        defer stopB()

        va, okA := nextA()
        vb, okB := nextB()
        for okA || okB {
            if okA && (!okB || va <= vb) {
                if !yield(va) { return }
                va, okA = nextA()
            } else {
                if !yield(vb) { return }
                vb, okB = nextB()
            }
        }
    }
}` },
        { kind: 'list', items: [
          '`iter.Pull` returns `next()` (value, ok) and `stop()`. Call `stop` when you finish early, or resources leak.',
          'Pull iterators cost more than plain range loops (they run the source on a separate coroutine-like goroutine), so use them only when you need to interleave several sources.',
          '`iter.Pull2` is the version for `Seq2`.',
        ] },
        { kind: 'check', q: 'When do you need `iter.Pull` instead of `for range`?', options: ['Always, for performance', 'When you must advance several iterators independently, e.g. merging', 'For Seq2 only', 'To make an iterator reusable'], answer: 1, hint: 'A range loop lets the iterator drive. When can\'t you let it?', explain: 'Merging or zipping needs you to decide which source to advance next.' },
      ],
    },
    {
      id: 'stdlib',
      title: 'Iterators in the standard library',
      blocks: [
        { kind: 'analogy', text: "Since Go 1.23 the standard library speaks iterators natively, like a building retrofitted with the same plug socket everywhere. Slices, maps, strings and even reflection now offer `…Seq` methods, so data flows between them without building temporary slices." },
        { kind: 'code', code: `for i, v := range slices.All(xs) {}             // index, value
for v := range slices.Values(xs) {}             // values only
for i, v := range slices.Backward(xs) {}        // reverse
ys := slices.Collect(seq)                        // iterator → slice
zs := slices.Sorted(maps.Keys(m))                // keys, sorted
for batch := range slices.Chunk(orders, 100) {} // sub-slices of up to 100

for k, v := range maps.All(m) {}
m2 := maps.Collect(seq2)                         // Seq2 → map

for line := range strings.Lines(text) {}        // Go 1.24: keeps the "\\n"
for f := range strings.FieldsSeq(row) {}        // no []string allocated
for part := range strings.SplitSeq(csv, ",") {}

for f := range reflect.TypeFor[Order]().Fields() {}   // Go 1.26` },
        { kind: 'list', items: [
          'Prefer the `…Seq` forms when you only loop once over the pieces: they avoid allocating a whole slice.',
          'Keep returning slices from your own APIs when callers need random access or `len`. Return iterators for large, lazy or streaming data.',
          '`for i := range 10` (Go 1.22) and range-over-func (1.23) together mean `range` now covers almost every looping need.',
        ] },
        { kind: 'check', q: 'What does `strings.FieldsSeq(s)` give you compared with `strings.Fields(s)`?', options: ['Different splitting rules', 'The same fields lazily, without allocating a []string', 'Sorted fields', 'Only the first field'], answer: 1, hint: 'Seq = sequence = iterator.', explain: 'It yields each field as it is found, which is useful in hot parsing loops.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is `iter.Seq[V]`?', options: ['A slice type', '`func(yield func(V) bool)`', 'A channel', 'An interface with Next()'], answer: 1, explain: 'A function you can range over.' },
    { q: 'What should an iterator do when `yield` returns false?', options: ['Retry', 'Stop and return', 'Panic', 'Yield again'], answer: 1, explain: 'Calling yield again panics at runtime.' },
    { q: 'Since which version can you `range` over functions?', options: ['1.18', '1.21', '1.23', '1.27'], answer: 2, explain: 'Go 1.23 (August 2024).' },
    { q: 'What does `slices.Collect(seq)` do?', options: ['Sorts', 'Gathers an iterator\'s values into a slice', 'Removes duplicates', 'Counts'], answer: 1, explain: '`slices.Sorted` collects and sorts.' },
    { q: 'What is the difference between push and pull iterators?', options: ['There is none', 'Push: the iterator calls your body. Pull: you call next() yourself', 'Pull is faster', 'Push needs goroutines'], answer: 1, explain: 'Range loops use push; `iter.Pull` converts to pull.' },
    { q: 'What must you do with the `stop` function from `iter.Pull`?', options: ['Nothing', 'Call it (usually deferred) to release resources', 'Pass it to yield', 'Call it before next()'], answer: 1, explain: 'Forgetting it leaks the underlying iterator.' },
    { q: 'What is the conventional name for a type\'s main iterator method?', options: ['`Iter`', '`All`', '`Each`', '`Range`'], answer: 1, explain: 'e.g. `slices.All`, `maps.All`, `series.All()`.' },
    { q: 'What makes iterator pipelines efficient?', options: ['Parallelism', 'Laziness: values flow one at a time with no intermediate slices', 'Caching', 'SIMD'], answer: 1, explain: 'Each stage pulls only what the next stage asks for.' },
  ],
}
