import type { Module } from '../types'

export const g14: Module = {
  n: 14,
  title: 'Generics',
  tour: 'Added · Generics',
  summary: 'Type parameters, constraints and type sets, generic types and methods, the slices/maps/cmp packages, and a practical sense of when generics are the right tool.',
  topics: ['Type parameters', 'Constraints & type sets', 'Generic types', 'Generic methods & aliases', 'slices, maps & cmp', 'When to use generics'],
  cpp23: [
    'Generics arrived in Go 1.18 (2022), seven years after the book.',
    'Generic type aliases (Go 1.24).',
    'Constraints may refer to the type being constrained: `type Adder[A Adder[A]] interface{ Add(A) A }` (Go 1.26).',
    'Methods with their own type parameters (Go 1.27).',
  ],
  lessons: [
    {
      id: 'params',
      title: 'Type parameters',
      blocks: [
        { kind: 'analogy', text: "A generic function is a stencil with a blank shape: \"draw a box around anything ordered\". The square brackets say which shapes the stencil accepts (the constraint), and the compiler checks each use. You write it once instead of copy-pasting `MaxInt`, `MaxFloat` and `MaxString`." },
        { kind: 'code', code: `func Max[T cmp.Ordered](a, b T) T {          // T is a type parameter, cmp.Ordered its constraint
    if a > b { return a }
    return b
}

Max(3, 7)                 // T inferred as int
Max(2.5, 1.0)             // float64
Max("XAU", "XAG")         // string
Max[float64](3, 2.5)      // explicit instantiation

func Map[T, U any](xs []T, f func(T) U) []U {
    out := make([]U, 0, len(xs))
    for _, x := range xs { out = append(out, f(x)) }
    return out
}
labels := Map([]float64{1.5, 2}, func(p float64) string { return fmt.Sprint(p) })

func Keys[M ~map[K]V, K comparable, V any](m M) []K { ... }   // type params can depend on each other` },
        { kind: 'compare',
          python: `from typing import TypeVar
T = TypeVar("T", int, float, str)
def max_(a: T, b: T) -> T:
    return a if a > b else b    # hints only`,
          ts: `function max<T extends number | string>(a: T, b: T): T {
  return a > b ? a : b
}   // types erased at runtime`,
          java: `static <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) > 0 ? a : b;
}   // erased; no primitives (boxing)`,
          cpp: `template<std::totally_ordered T>
T max_of(T a, T b) { return a > b ? a : b; }
// one instantiation per type`,
          go: `func Max[T cmp.Ordered](a, b T) T {
    if a > b { return a }
    return b
}`,
          note: 'Go generics are checked at compile time like C++, work on primitives without boxing unlike Java, and keep code size down by sharing code between types with the same memory "shape".' },
        { kind: 'check', q: 'What does `Max(3, 2.5)` do with `func Max[T cmp.Ordered](a, b T) T`?', options: ['Returns 3', 'Infers T = float64 and returns 3', 'Compile error: mismatched types int and float64', 'Returns 2.5'], answer: 1, hint: 'Both arguments are untyped constants.', explain: 'Untyped constants unify: 3 can be a float64, so T is float64 and the result is 3.0. With typed variables `int` and `float64` it would be a compile error.' },
      ],
    },
    {
      id: 'constraints',
      title: 'Constraints & type sets',
      blocks: [
        { kind: 'analogy', text: "A constraint is a guest list for the stencil. It can list skills (methods) like an ordinary interface, or list names directly (`int | float64`). The tilde, `~float64`, means \"anyone whose underlying type is float64\", so your `Celsius` and `Price` types get in too." },
        { kind: 'code', code: `type Number interface {
    ~int | ~int32 | ~int64 | ~float32 | ~float64     // a type set
}

func Sum[T Number](xs []T) T {
    var s T
    for _, x := range xs { s += x }                  // + allowed: every type in the set supports it
    return s
}

type Price float64
Sum([]Price{1.5, 2.5})                               // OK thanks to ~float64

type Stringish interface {
    ~string
    Len() int                                        // type set AND method requirement
}

// Built-in constraints:
//   any          anything
//   comparable   supports == and != (map keys)
//   cmp.Ordered  supports < <= > >= (ints, floats, strings)

type Adder[A Adder[A]] interface { Add(A) A }        // Go 1.26: self-referential constraint
func SumAll[A Adder[A]](xs []A) A { ... }` },
        { kind: 'list', items: [
          'Interfaces with type sets (`int | float64`) can only be used as constraints, never as ordinary variable types.',
          'Operators work on `T` only if every type in the constraint\'s set supports them.',
          'Prefer standard constraints (`cmp.Ordered`, `comparable`) over custom ones when they fit.',
        ] },
        { kind: 'check', q: 'With `type Number interface{ int | float64 }` (no tildes), can you call `Sum([]Price{...})` where `type Price float64`?', options: ['Yes', 'No: Price is a different type; you need ~float64', 'Only with a conversion of each element', 'Only in Go 1.27'], answer: 1, hint: 'What does the tilde add?', explain: '`float64` matches only float64 itself; `~float64` matches every type whose underlying type is float64.' },
      ],
    },
    {
      id: 'types',
      title: 'Generic types & methods',
      blocks: [
        { kind: 'analogy', text: "A generic type is a container mould: `Ring[T]` is the mould, and `Ring[float64]` is a mould filled with prices. From Go 1.27 its methods can even bring their own extra blanks to fill in, such as converting a `Ring[float64]` into a `Ring[string]`." },
        { kind: 'code', code: `// A fixed-size ring buffer: e.g. the last N prices for a rolling average
type Ring[T any] struct {
    buf  []T
    next int
    full bool
}

func NewRing[T any](n int) *Ring[T] { return &Ring[T]{buf: make([]T, n)} }

func (r *Ring[T]) Push(x T) {
    r.buf[r.next] = x
    r.next = (r.next + 1) % len(r.buf)
    if r.next == 0 { r.full = true }
}

func (r *Ring[T]) Values() []T {
    if !r.full { return slices.Clone(r.buf[:r.next]) }
    return append(slices.Clone(r.buf[r.next:]), r.buf[:r.next]...)
}

// Go 1.27: a method with its own type parameter
func (r *Ring[T]) Map[U any](f func(T) U) []U {
    return Map(r.Values(), f)
}

last20 := NewRing[float64](20)
last20.Push(2390.5)

type Set[T comparable] = map[T]struct{}     // Go 1.24: generic type alias` },
        { kind: 'list', items: [
          'Methods of a generic type repeat the type parameter in the receiver: `func (r *Ring[T]) ...`.',
          'Interface methods still can\'t have type parameters, and a generic method can\'t satisfy an interface method.',
          'Zero value of T: `var zero T`. It is the idiom for "return nothing" in generic code.',
        ] },
        { kind: 'check', q: 'How do you write the zero value of a type parameter T?', options: ['`nil`', '`T{}`', '`var zero T` (then use zero)', '`T(0)`'], answer: 2, hint: 'It must work for ints, strings, structs and pointers alike.', explain: '`nil` only fits some types and `T{}` only composite ones; a declared variable always works.' },
      ],
    },
    {
      id: 'stdlib',
      title: 'slices, maps & cmp',
      blocks: [
        { kind: 'analogy', text: "The `slices`, `maps` and `cmp` packages are the generic toolbox that ships in the box, so you rarely need to write your own `Contains` or `Max` again. They replaced a decade of copy-pasted helper loops." },
        { kind: 'code', code: `slices.Contains(syms, "XAU")
slices.Index(syms, "EUR")
slices.Max(prices)
slices.Sort(prices)
slices.SortFunc(trades, func(a, b Trade) int { return cmp.Compare(a.Px, b.Px) })
slices.BinarySearch(sorted, 42)
slices.Equal(a, b)
slices.Compact(slices.Sorted(slices.Values(ids)))   // sort + dedupe
slices.Chunk(orders, 100)                            // iterator over batches (1.23)

maps.Clone(m)
maps.Equal(a, b)
for k := range maps.Keys(m) {}                       // iterator (1.23)

cmp.Compare(a, b)                                     // -1, 0, +1
cmp.Or(cmp.Compare(a.Sym, b.Sym), cmp.Compare(a.Px, b.Px))   // first non-zero: multi-key sort
min(a, b, c); max(x, y)                               // built-ins, also generic` },
        { kind: 'check', q: 'What does `cmp.Or(x, y, z)` return?', options: ['x || y || z as booleans', 'The first argument that isn\'t the zero value', 'The smallest argument', 'A combined hash'], answer: 1, hint: 'Look at how it builds a multi-key comparator.', explain: 'With comparison results, the first non-zero one decides the order.' },
      ],
    },
    {
      id: 'when',
      title: 'When to use generics',
      blocks: [
        { kind: 'analogy', text: "Generics are a power tool: perfect for the job they're built for, and a mess when used for everything. If you're writing the **same code** for different element types, reach for generics. If you need **different behaviour** per type, that's what interfaces are for." },
        { kind: 'list', items: [
          '**Good fits**: functions over slices, maps and channels of any element type; data structures (sets, trees, ring buffers, caches); helpers like `Map`, `Filter`, `Reduce`.',
          '**Use interfaces instead** when each type does something different (a `Strategy` with `Signal()`, an `io.Reader`).',
          '**Don\'t** add a type parameter just to avoid writing an interface method call; it rarely gets faster and it does get harder to read.',
          'Start concrete. Make it generic when the second or third copy appears.',
        ] },
        { kind: 'code', code: `// Interface: different BEHAVIOUR per type
type Strategy interface{ Signal(bars []Bar) Side }

// Generic: same ALGORITHM, different element types
func Filter[T any](xs []T, keep func(T) bool) []T {
    var out []T
    for _, x := range xs {
        if keep(x) { out = append(out, x) }
    }
    return out
}` },
        { kind: 'check', q: 'You need a cache keyed by any comparable type. Generics or interfaces?', options: ['Interfaces', 'Generics: `type Cache[K comparable, V any] struct{...}`', 'Reflection', 'Code generation'], answer: 1, hint: 'Same code, different element types.', explain: 'The cache logic is identical for every key and value type: a classic generic data structure.' },
      ],
    },
  ],
  quiz: [
    { q: 'How are type parameters written in Go?', options: ['`<T>`', '`[T constraint]`', '`(T)`', '`{T}`'], answer: 1, explain: 'e.g. `func Max[T cmp.Ordered](a, b T) T`.' },
    { q: 'What does `~int` mean in a constraint?', options: ['Not int', 'Any type whose underlying type is int', 'Approximately int', 'int or nil'], answer: 1, explain: 'It admits defined types like `type Qty int`.' },
    { q: 'Which built-in constraint allows `==`?', options: ['any', 'comparable', 'cmp.Ordered only', 'equatable'], answer: 1, explain: 'Map keys need `comparable`.' },
    { q: 'Can an interface with a type set (`int | float64`) be used as a variable type?', options: ['Yes', 'No: only as a constraint', 'Only in Go 1.27', 'Only with any'], answer: 1, explain: 'Type-set interfaces are constraint-only.' },
    { q: 'What did Go 1.27 add to generics?', options: ['Specialisation', 'Methods with their own type parameters', 'Variadic type parameters', 'Operator overloading'], answer: 1, explain: 'Interface methods still can\'t declare them.' },
    { q: 'How does Go compile generic code?', options: ['Erases types like Java', 'One full copy per type like C++', 'Shares code between types with the same "GC shape", plus a dictionary', 'Interprets it'], answer: 2, explain: 'It is a middle ground between compile time, binary size and speed.' },
    { q: 'What is the idiomatic zero value in generic code?', options: ['nil', '`var zero T`', '`T{}`', '`new(T)`'], answer: 1, explain: 'It works for every T.' },
    { q: 'When should you prefer an interface over generics?', options: ['Never', 'When each type needs different behaviour', 'For slices', 'For performance always'], answer: 1, explain: 'Generics are for the same algorithm over different types.' },
  ],
}
