import type { Module } from '../types'

export const g06: Module = {
  n: 6,
  title: 'Methods',
  tour: '6 · Methods',
  summary: 'Attaching behaviour to types, value vs pointer receivers, composing types by embedding, method values and expressions, encapsulation, and Go 1.27\'s generic methods.',
  topics: ['Method declarations', 'Pointer receivers', 'Embedding & promotion', 'Method values & expressions', 'Encapsulation', 'Generic methods'],
  cpp23: [
    'Methods may declare their own type parameters: `func (r *Rand) N[T intType](n T) T` (Go 1.27).',
    'Generic types have been able to have (non-generic) methods since Go 1.18.',
  ],
  lessons: [
    {
      id: 'decl',
      title: 'Method declarations',
      blocks: [
        { kind: 'analogy', text: "A method is an ordinary function with a name tag pinned to a type, the **receiver**. `p.Distance(q)` is just friendlier spelling for \"call `Distance` with `p` as the first argument\". There are no classes: any type you define in your package can wear methods, including a number or a slice." },
        { kind: 'code', code: `type Point struct{ X, Y float64 }

func (p Point) Distance(q Point) float64 {     // (p Point) is the receiver
    return math.Hypot(q.X-p.X, q.Y-p.Y)
}

type Path []Point                              // methods on a slice type

func (path Path) Distance() float64 {
    sum := 0.0
    for i := range path[1:] {
        sum += path[i].Distance(path[i+1])
    }
    return sum
}

type Celsius float64
func (c Celsius) String() string { return fmt.Sprintf("%.1f°C", float64(c)) }

p, q := Point{1, 2}, Point{4, 6}
fmt.Println(p.Distance(q))                      // 5
fmt.Println(Path{p, q, p}.Distance())           // 10` },
        { kind: 'list', items: [
          'You can declare methods on any **defined type in the same package**, but not on `int` itself or on types from other packages.',
          'Method names only need to be unique per type: `Point.Distance` and `Path.Distance` coexist.',
          'By convention the receiver name is a short abbreviation (`p`, `path`, `c`), never `self` or `this`.',
        ] },
        { kind: 'compare',
          python: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def distance(self, q):
        return math.hypot(q.x - self.x, q.y - self.y)`,
          ts: `class Point {
  constructor(public x: number, public y: number) {}
  distance(q: Point) {
    return Math.hypot(q.x - this.x, q.y - this.y)
  }
}`,
          java: `record Point(double x, double y) {
    double distance(Point q) {
        return Math.hypot(q.x() - x, q.y() - y);
    }
}`,
          cpp: `struct Point {
    double x, y;
    double distance(Point q) const {
        return std::hypot(q.x - x, q.y - y);
    }
};`,
          go: `type Point struct{ X, Y float64 }

func (p Point) Distance(q Point) float64 {
    return math.Hypot(q.X-p.X, q.Y-p.Y)
}`,
          note: 'In Go, methods are declared outside the type, next to it, with an explicit receiver instead of a hidden `this`.' },
        { kind: 'check', q: 'Can you add a method to `time.Time` in your own package?', options: ['Yes', 'No: methods must be declared in the same package as the type', 'Only value receivers', 'Only with embedding'], answer: 1, hint: 'Who owns the type?', explain: 'Define your own type (`type MyTime time.Time`) or embed `time.Time` in a struct to extend it.' },
      ],
    },
    {
      id: 'pointers',
      title: 'Value vs pointer receivers',
      blocks: [
        { kind: 'analogy', text: "A value receiver gets a **photocopy** of the object: scribble on it all you like, the original is untouched. A pointer receiver gets the **original's address**, so changes stick. Pick pointer receivers whenever the method must change the object, or the object is too big to photocopy cheaply." },
        { kind: 'stepper', title: 'Step through: a value receiver changes a copy', code: [
          'type Counter struct{ n int }',
          'func (c Counter) IncVal()  { c.n++ }',
          'func (c *Counter) IncPtr() { c.n++ }',
          'var c Counter',
          'c.IncVal()',
          'c.IncPtr()',
        ], steps: [
          { line: 4, note: '`c` starts at its zero value.', memory: [{ name: 'c', value: '{n: 0}' }] },
          { line: 5, note: '`IncVal` receives a **copy**. It increments the copy, and the copy is thrown away.', memory: [{ name: 'c', value: '{n: 0}', note: 'unchanged' }, { name: 'copy inside IncVal', value: '{n: 1}', kind: 'dead' }] },
          { line: 6, note: '`IncPtr` needs `*Counter`. Since `c` is addressable, Go passes `&c` automatically.', memory: [{ name: 'c', value: '{n: 1}' }, { name: 'receiver in IncPtr', value: '→ c', kind: 'ptr' }] },
        ] },
        { kind: 'list', items: [
          'Go inserts `&` and `*` for you: `c.IncPtr()` works on an addressable value, and `p.IncVal()` works on a pointer.',
          'Be consistent: if any method needs a pointer receiver, give them all pointer receivers.',
          'Types containing a `sync.Mutex` must use pointer receivers. Copying a mutex copies its lock state, and `go vet` flags it.',
          'A nil pointer is a valid receiver. Methods can treat nil as an empty value: `func (l *List) Len() int { if l == nil { return 0 } ... }`.',
        ] },
        { kind: 'pitfall', text: "A **map element** isn't addressable, so `m[k].IncPtr()` doesn't compile. Store pointers in the map (`map[string]*Counter`) or read, modify and write back." },
        { kind: 'check', q: 'What does this print?', code: `type Acct struct{ bal int }
func (a Acct) Deposit(x int) { a.bal += x }

acc := Acct{}
acc.Deposit(100)
fmt.Println(acc.bal)`, options: ['100', '0', 'Compile error', 'Panic'], answer: 1, hint: 'Did `Deposit` get the original or a photocopy?', explain: 'A value receiver works on a copy. `Deposit` needs `func (a *Acct)` to change `acc`.' },
      ],
    },
    {
      id: 'embedding',
      title: 'Composition by embedding',
      blocks: [
        { kind: 'analogy', text: "Embedding is hiring a specialist and putting their name on your door. Customers can ask your firm to do anything the specialist does (promoted methods), and you can step in and do some jobs yourself instead (shadowing). But your firm isn't the specialist, and you can't be passed off as one." },
        { kind: 'code', code: `type Point struct{ X, Y float64 }
func (p Point) Distance(q Point) float64 { return math.Hypot(q.X-p.X, q.Y-p.Y) }
func (p *Point) ScaleBy(f float64)       { p.X *= f; p.Y *= f }

type ColoredPoint struct {
    Point                  // embedded: its fields AND methods are promoted
    Color color.RGBA
}

var cp ColoredPoint
cp.X = 1
cp.ScaleBy(2)              // promoted from *Point
d := cp.Distance(Point{})  // promoted; note the argument must be a Point
// cp.Distance(cp)         // compile error: a ColoredPoint is NOT a Point
d = cp.Distance(cp.Point)  // pass the embedded value explicitly

// Classic idiom: embed a mutex so the struct "is lockable"
var cache = struct {
    sync.Mutex
    m map[string]string
}{m: make(map[string]string)}

cache.Lock()
cache.m["k"] = "v"
cache.Unlock()` },
        { kind: 'list', items: [
          'Promotion is just the compiler writing forwarding calls for you. There is no subtyping and no virtual dispatch.',
          'If the outer type declares a method with the same name, it **shadows** the embedded one.',
          'Embedding is how types gain interface methods (module 7): `ColoredPoint` satisfies any interface that `Point`\'s methods satisfy.',
        ] },
        { kind: 'check', q: 'Can a `ColoredPoint` be passed to `func f(p Point)`?', options: ['Yes, by promotion', 'No: pass `cp.Point` explicitly', 'Only by pointer', 'Only if Point is an interface'], answer: 1, hint: 'Hiring a specialist doesn\'t make you one.', explain: 'Embedding is composition. Only interfaces (module 7) give "accept anything with these methods".' },
      ],
    },
    {
      id: 'values',
      title: 'Method values & encapsulation',
      blocks: [
        { kind: 'analogy', text: "A method value is a remote control pre-paired with one particular TV: `p.Distance` is a function you can hand to someone else, and it always operates on `p`. A method expression, `Point.Distance`, is an unpaired remote: you tell it which TV each time you press a button." },
        { kind: 'code', code: `p := Point{1, 2}
distFromP := p.Distance              // method value: receiver bound now
distFromP(Point{4, 6})               // 5

dist := Point.Distance               // method expression: func(Point, Point) float64
dist(p, Point{4, 6})                 // 5

time.AfterFunc(10*time.Second, rocket.Launch)   // handy for callbacks` },
        { kind: 'h', text: 'Encapsulation' },
        { kind: 'p', text: "Go's only access control is capitalisation, at package level. To hide a type's internals, make the fields lowercase and expose methods. A struct with unexported fields can't be built field by field from outside the package, so constructor functions (`NewX`) are the norm." },
        { kind: 'code', code: `package book

type OrderBook struct {
    bids, asks []Level         // unexported: callers can't break the ordering invariant
}

func New() *OrderBook { return &OrderBook{} }

func (b *OrderBook) Add(o Order) error { /* keeps levels sorted */ return nil }
func (b *OrderBook) BestBid() (Level, bool) {
    if len(b.bids) == 0 { return Level{}, false }
    return b.bids[0], true
}` },
        { kind: 'check', q: 'What is the type of `Point.Distance` (with a value receiver)?', options: ['`func(Point) float64`', '`func(Point, Point) float64`', '`method`', 'It is not valid Go'], answer: 1, hint: 'The receiver becomes the first parameter.', explain: 'A method expression turns the receiver into an explicit first argument.' },
      ],
    },
    {
      id: 'generic',
      title: 'Generic methods',
      blocks: [
        { kind: 'analogy', text: "Until 2026, a Go method could use its type's type parameters but couldn't introduce new ones of its own, like a shop assistant who could only sell what was already on the shelf. Go 1.27 lets a method declare its own type parameters, so it can take whatever type the job needs." },
        { kind: 'code', code: `type Stack[T any] struct{ items []T }       // generic type (Go 1.18+)
func (s *Stack[T]) Push(x T) { s.items = append(s.items, x) }
func (s *Stack[T]) Pop() (T, bool) {
    var zero T
    if len(s.items) == 0 { return zero, false }
    x := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return x, true
}

// Go 1.27: a method with its OWN type parameter U
func (s *Stack[T]) Map[U any](f func(T) U) *Stack[U] {
    out := &Stack[U]{}
    for _, x := range s.items { out.Push(f(x)) }
    return out
}

prices := &Stack[float64]{}
prices.Push(2390.5)
labels := prices.Map(func(p float64) string { return fmt.Sprintf("$%.2f", p) })   // *Stack[string]

r := rand.New(rand.NewPCG(1, 2))
n := r.N(10 * time.Second)          // the standard library's own generic method (Go 1.27)` },
        { kind: 'list', items: [
          'Before 1.27, `Map` had to be a package-level function: `func MapStack[T, U any](s *Stack[T], f func(T) U) *Stack[U]`.',
          '**Restrictions**: interface methods can\'t declare type parameters, and a generic method can\'t be used to satisfy an interface method.',
          'Generics get a full module later (14). This is just a preview of how they meet methods.',
        ] },
        { kind: 'new23', text: "Generic methods arrived in **Go 1.27** (August 2026), years after the book and well after generics themselves (1.18). Older codebases and tutorials will show the package-level-function workaround everywhere. Recognise it, and prefer the method form in new code that targets 1.27+." },
        { kind: 'check', q: 'Which is still NOT allowed in Go 1.27?', options: ['`func (s *Stack[T]) Push(x T)`', '`func (s *Stack[T]) Map[U any](f func(T) U) *Stack[U]`', 'An interface method with its own type parameters', 'A generic struct type'], answer: 2, hint: 'Generic methods came with two restrictions, both about interfaces.', explain: 'Interface methods can\'t declare type parameters, and generic methods can\'t implement interface methods.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is a method in Go?', options: ['A function inside a class', 'A function with a receiver parameter bound to a defined type', 'A closure', 'An interface'], answer: 1, explain: 'Go has no classes; any defined type in your package can have methods.' },
    { q: 'When should you use a pointer receiver?', options: ['Never', 'When the method modifies the receiver, or the receiver is large', 'Only for slices', 'Only for interfaces'], answer: 1, explain: 'And keep receivers consistent across a type.' },
    { q: 'Why can\'t you call a pointer method on `m["k"]`?', options: ['Maps are immutable', 'Map elements aren\'t addressable', 'Pointer methods need a constructor', 'You can'], answer: 1, explain: 'Store pointers in the map, or copy-modify-store.' },
    { q: 'What does embedding a type do?', options: ['Makes the outer type a subtype', 'Promotes the inner type\'s fields and methods (composition)', 'Copies methods into a vtable', 'Creates an interface'], answer: 1, explain: 'There is no is-a relationship.' },
    { q: 'What is `p.Distance` without parentheses?', options: ['A syntax error', 'A method value: a func with p already bound', 'A method expression', 'A pointer'], answer: 1, explain: '`Point.Distance` is the method expression form.' },
    { q: 'What is Go\'s encapsulation unit?', options: ['The type', 'The package', 'The file', 'The module'], answer: 1, explain: 'Unexported names are visible to every file in the package.' },
    { q: 'What did Go 1.27 add to methods?', options: ['Overloading', 'Their own type parameters (generic methods)', 'Default arguments', 'Virtual dispatch'], answer: 1, explain: 'Interface methods still can\'t have type parameters.' },
    { q: 'Is a nil pointer a valid receiver?', options: ['No, it always panics', 'Yes: the method runs, and can check for nil', 'Only for value receivers', 'Only in tests'], answer: 1, explain: 'It only panics if the method dereferences it.' },
  ],
}
