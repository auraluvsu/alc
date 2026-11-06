import type { DictEntry } from '../types'

export const GO_DICT: DictEntry[] = [
  // ---------- Basics ----------
  { term: 'package / import', cat: 'Basics', module: 1, desc: 'Every file starts with its package name. `package main` with `func main()` builds an executable. Imports are full paths.', syntax: `package main

import (
    "fmt"
    "net/http"
    tc "example.com/app/tempconv"   // alias
)` },
  { term: 'go mod init / go get', cat: 'Tooling', module: 1, desc: 'Create a module (`go.mod`) and add dependencies. Dependencies are pinned and checksummed in `go.sum`.', syntax: `go mod init example.com/pricer
go get github.com/shopspring/decimal@latest
go mod tidy        # add missing, remove unused` },
  { term: 'go run / build / test / vet', cat: 'Tooling', module: 1, desc: 'The everyday commands. `go build` produces one static binary; cross-compile with GOOS/GOARCH.', syntax: `go run .
go build -o pricer ./cmd/pricer
GOOS=linux GOARCH=arm64 go build
go test ./...
go vet ./...` },
  { term: 'for / range', cat: 'Basics', module: 1, desc: 'The only loop keyword. `range` iterates slices, arrays, strings (runes), maps, channels, integers (1.22) and iterator functions (1.23).', syntax: `for i := 0; i < n; i++ {}
for cond {}
for {}
for i, v := range xs {}
for i := range 10 {}
for k, v := range m {}` },
  { term: 'if with init / switch', cat: 'Basics', module: 1, desc: '`if` and `switch` accept a short statement first. `switch` cases don\'t fall through, and a bare `switch` replaces if/else chains.', syntax: `if v, ok := m[k]; ok { use(v) }

switch {
case px > hi: sell()
case px < lo: buy()
default:      hold()
}` },
  { term: ':= vs var', cat: 'Basics', module: 2, desc: '`:=` declares and assigns (functions only, at least one new name). `var` works anywhere and gives the zero value if there is no initialiser.', syntax: `x := 42
var name string     // ""
var a, b = 1, 2
f, err := os.Open(p)` },
  { term: 'Zero values', cat: 'Basics', module: 2, desc: 'Every variable starts initialised: 0, "", false or nil. Design types so their zero value is useful.', syntax: `var n int         // 0
var s []int       // nil (append works)
var m map[string]int   // nil (reads ok, writes panic)
var mu sync.Mutex      // ready to use` },
  { term: 'Exported names', cat: 'Basics', module: 2, desc: 'Capitalised identifiers are visible outside the package; lowercase ones are package-private.', syntax: `func Parse() {}   // exported
func parse() {}   // package-private
type Order struct{ ID string; qty int }` },
  { term: 'Pointers & new', cat: 'Basics', module: 2, desc: '`&x` takes an address and `*p` dereferences. There is no pointer arithmetic. `new(T)` allocates a zero T; `new(expr)` (1.26) an initialised one.', since: 'Go 1.26', syntax: `p := &x
*p = 2
q := new(int)
r := new(42)      // *int → 42 (Go 1.26)` },
  { term: 'type T U', cat: 'Types', module: 2, desc: 'Defines a new distinct type with the same underlying type. It needs explicit conversion and can have methods. `type A = B` is an alias.', syntax: `type Celsius float64
type Fahrenheit float64
f := Fahrenheit(c*9/5 + 32)
type Set[T comparable] = map[T]struct{}   // generic alias (1.24)` },
  { term: 'const & iota', cat: 'Types', module: 3, desc: 'Compile-time constants. Untyped constants have arbitrary precision. `iota` counts lines within a const block.', syntax: `const (
    Buy Side = iota   // 0
    Sell              // 1
)
const KB = 1 << 10` },
  { term: 'Numeric types & conversion', cat: 'Types', module: 3, desc: 'int, int8–64, uint…, float32/64, complex128, byte (=uint8), rune (=int32). There are no implicit conversions; overflow wraps.', syntax: `var n int = 7
f := float64(n) / 2
b := byte('A')
min(a, b, c); max(x, y)   // built-ins (1.21)` },
  { term: 'string, byte, rune', cat: 'Types', module: 3, desc: 'Strings are immutable bytes (UTF-8 by convention). `len` counts bytes, and `range` decodes runes.', syntax: `s := "héllo"
len(s)                       // 6
utf8.RuneCountInString(s)    // 5
for i, r := range s {}       // byte offset, rune
[]byte(s); []rune(s); string(rs)` },
  { term: 'Arrays', cat: 'Composite', module: 4, desc: 'Fixed-length values; the length is part of the type. They copy on assignment and are comparable with `==`.', syntax: `var a [3]int
b := [...]string{"a", "b"}
c := a        // full copy` },
  { term: 'Slices', cat: 'Composite', module: 4, desc: 'A view (pointer, len, cap) onto an array. Slicing shares memory. Always assign the result of `append`.', syntax: `s := []int{1, 2, 3}
s = append(s, 4)
t := s[1:3]          // shares memory
u := make([]int, 0, 100)
v := slices.Clone(s)` },
  { term: 'Maps', cat: 'Composite', module: 4, desc: 'Hash maps with comparable keys and random iteration order. Writing to a nil map panics. Not safe for concurrent writes.', syntax: `m := map[string]int{"a": 1}
m["b"]++
v, ok := m["c"]
delete(m, "a")
clear(m)            // 1.21` },
  { term: 'Structs', cat: 'Composite', module: 4, desc: 'Typed fields, copied by value. Comparable if all fields are. Use `%+v` to print with field names.', syntax: `type Trade struct {
    Sym string
    Px  float64
}
t := Trade{Sym: "XAU", Px: 2390.5}
p := &Trade{"XAG", 28.1}` },
  { term: 'Embedding', cat: 'Composite', module: 4, desc: 'Include a type without a field name to promote its fields and methods. Composition, not inheritance.', syntax: `type ColoredPoint struct {
    Point
    Color string
}
cp.X = 1          // promoted
cp.ScaleBy(2)     // promoted method` },
  { term: 'Struct tags', cat: 'Composite', module: 4, desc: 'String metadata on fields, read via reflection by encoders such as encoding/json.', syntax: `type T struct {
    Name string \`json:"name"\`
    Qty  int    \`json:"qty,omitempty"\`
}` },
  { term: 'Functions', cat: 'Functions', module: 5, desc: 'Multiple results, optional named results, pass-by-value. No overloading or default arguments.', syntax: `func divmod(a, b int) (q, r int) {
    return a / b, a % b
}
q, r := divmod(7, 2)` },
  { term: 'error', cat: 'Errors', module: 5, desc: 'A built-in interface with `Error() string`. Functions return it last; nil means success.', syntax: `v, err := strconv.Atoi(s)
if err != nil {
    return fmt.Errorf("parse qty: %w", err)
}` },
  { term: 'errors.Is / As / AsType', cat: 'Errors', module: 5, desc: 'Inspect wrapped errors: `Is` for specific values, `As`/`AsType` (1.26) to extract a typed error.', since: 'Go 1.26', syntax: `if errors.Is(err, os.ErrNotExist) {}
var pe *fs.PathError
if errors.As(err, &pe) {}
if pe, ok := errors.AsType[*fs.PathError](err); ok {}` },
  { term: 'Closures', cat: 'Functions', module: 5, desc: 'Function literals capture variables by reference. Since 1.22, each loop iteration has its own loop variable.', syntax: `n := 0
inc := func() int { n++; return n }
for i := range 3 {
    go func() { fmt.Println(i) }()
}` },
  { term: 'Variadic ...', cat: 'Functions', module: 5, desc: 'The last parameter can take any number of arguments as a slice. Spread a slice with `s...`.', syntax: `func sum(xs ...int) int { ... }
sum(1, 2, 3)
sum(nums...)` },
  { term: 'defer', cat: 'Functions', module: 5, desc: 'Schedules a call for when the function returns, in LIFO order. Arguments are evaluated immediately.', syntax: `f, err := os.Open(p)
if err != nil { return err }
defer f.Close()

mu.Lock()
defer mu.Unlock()` },
  { term: 'panic / recover', cat: 'Errors', module: 5, desc: 'panic aborts the goroutine, running defers. recover (inside a deferred func) stops it. Use panic for bugs only.', syntax: `defer func() {
    if r := recover(); r != nil {
        log.Println("recovered:", r)
    }
}()` },
  { term: 'Methods', cat: 'Methods', module: 6, desc: 'Functions with a receiver, declared on any defined type in the same package.', syntax: `func (p Point) Dist(q Point) float64 { ... }
func (c Celsius) String() string { ... }` },
  { term: 'Pointer receivers', cat: 'Methods', module: 6, desc: 'Use `*T` receivers to modify the receiver or avoid copying. Go takes the address automatically for addressable values.', syntax: `func (c *Counter) Inc() { c.n++ }
var c Counter
c.Inc()        // (&c).Inc()` },
  { term: 'Generic methods', cat: 'Methods', module: 6, desc: 'Methods may declare their own type parameters (Go 1.27). Interface methods still can\'t.', since: 'Go 1.27', syntax: `func (s *Stack[T]) Map[U any](f func(T) U) *Stack[U] {
    ...
}` },
  { term: 'Interfaces', cat: 'Interfaces', module: 7, desc: 'Method sets satisfied implicitly by any type that has the methods. Keep them small.', syntax: `type Reader interface {
    Read(p []byte) (n int, err error)
}
var r io.Reader = os.Stdin` },
  { term: 'Type assertion / switch', cat: 'Interfaces', module: 7, desc: 'Recover the concrete type from an interface value. The comma-ok form avoids a panic.', syntax: `s, ok := v.(string)
switch x := v.(type) {
case int:    use(x)
case string: use(x)
}` },
  { term: 'any', cat: 'Interfaces', module: 7, desc: 'An alias for `interface{}`: holds a value of any type. Prefer concrete types or generics.', syntax: `var v any = 42
m := map[string]any{"qty": 1}` },
  { term: 'go statement', cat: 'Concurrency', module: 8, desc: 'Starts a function in a new goroutine. Goroutines are cheap and scheduled by the runtime.', syntax: `go fetch(url, ch)
go func() { work() }()` },
  { term: 'Channels', cat: 'Concurrency', module: 8, desc: 'Typed conduits between goroutines. Unbuffered channels synchronise; buffered ones queue. Close to signal "no more values".', syntax: `ch := make(chan int)
buf := make(chan int, 100)
ch <- 1          // send
v := <-ch        // receive
v, ok := <-ch    // ok false once closed and drained
close(ch)` },
  { term: 'select', cat: 'Concurrency', module: 8, desc: 'Waits on several channel operations at once; `default` makes it non-blocking.', syntax: `select {
case v := <-prices:  handle(v)
case <-ctx.Done():   return ctx.Err()
case <-time.After(time.Second): timeout()
}` },
  { term: 'context.Context', cat: 'Concurrency', module: 8, desc: 'Carries cancellation, deadlines and request-scoped values. Pass it as the first parameter.', syntax: `ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
defer cancel()
req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)` },
  { term: 'sync.WaitGroup', cat: 'Concurrency', module: 8, desc: 'Waits for a set of goroutines to finish. `wg.Go(f)` (1.25) does Add, go and Done in one call.', since: 'Go 1.25', syntax: `var wg sync.WaitGroup
for _, u := range urls {
    wg.Go(func() { fetch(u) })
}
wg.Wait()` },
  { term: 'sync.Mutex / RWMutex', cat: 'Concurrency', module: 9, desc: 'Mutual exclusion. Lock and `defer Unlock`. RWMutex allows many readers or one writer. Not reentrant.', syntax: `var mu sync.Mutex
mu.Lock()
defer mu.Unlock()
balance += x` },
  { term: 'sync/atomic', cat: 'Concurrency', module: 9, desc: 'Lock-free counters and pointers with typed wrappers (1.19+).', syntax: `var hits atomic.Int64
hits.Add(1)
n := hits.Load()` },
  { term: 'sync.Once / OnceValue', cat: 'Concurrency', module: 9, desc: 'Run initialisation exactly once, safely across goroutines.', syntax: `var loadConfig = sync.OnceValue(func() Config {
    return mustLoad()
})
cfg := loadConfig()` },
  { term: 'Testing', cat: 'Tooling', module: 11, desc: 'Files ending in `_test.go` with `TestXxx(t *testing.T)` functions. Table-driven tests are idiomatic.', syntax: `func TestAdd(t *testing.T) {
    if got := Add(2, 3); got != 5 {
        t.Errorf("Add(2,3) = %d, want 5", got)
    }
}` },
  { term: 'Benchmarks', cat: 'Tooling', module: 11, desc: '`BenchmarkXxx(b *testing.B)` run with `go test -bench=.`. Use `b.Loop()` (1.24).', since: 'Go 1.24', syntax: `func BenchmarkParse(b *testing.B) {
    for b.Loop() {
        Parse(input)
    }
}` },
  { term: 'Type parameters', cat: 'Generics', module: 14, desc: 'Generic functions and types with constraints.', syntax: `func Map[T, U any](xs []T, f func(T) U) []U { ... }
type Stack[T any] struct{ items []T }` },
  { term: 'Constraints & type sets', cat: 'Generics', module: 14, desc: 'Interfaces used as constraints can list types; `~T` includes types whose underlying type is T.', syntax: `type Number interface {
    ~int | ~int64 | ~float64
}
func Sum[T Number](xs []T) T { ... }` },
  { term: 'cmp.Ordered / cmp.Compare', cat: 'Generics', module: 14, desc: 'A constraint for types supporting `<`, and a three-way compare for sort comparators.', syntax: `func Max[T cmp.Ordered](a, b T) T { ... }
slices.SortFunc(ts, func(a, b T) int { return cmp.Compare(a.Px, b.Px) })` },
  { term: 'Range over func', cat: 'Iterators', module: 15, desc: 'Functions of the form `func(yield func(V) bool)` can be ranged over (1.23).', since: 'Go 1.23', syntax: `func Countdown(n int) iter.Seq[int] {
    return func(yield func(int) bool) {
        for i := n; i > 0; i-- {
            if !yield(i) { return }
        }
    }
}
for i := range Countdown(3) {}` },
  { term: 'unsafe', cat: 'Low-level', module: 13, desc: 'Bypasses the type system: sizes, offsets, raw pointer conversion. Rarely needed.', syntax: `unsafe.Sizeof(x)
unsafe.Offsetof(t.Px)
b := unsafe.Slice(ptr, n)` },
]
