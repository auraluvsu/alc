import type { Module } from '../types'

export const g02: Module = {
  n: 2,
  title: 'Program Structure',
  tour: '2 · Program Structure',
  summary: 'Names and visibility, the four kinds of declaration, variables and zero values, pointers and where variables actually live, named types, packages and scope.',
  topics: ['Names & declarations', 'Variables & zero values', 'Pointers & new', 'Lifetime & escape analysis', 'Type declarations', 'Packages, init & scope'],
  cpp23: [
    '`new` accepts an expression: `p := new(42)` returns a `*int` pointing at 42 (Go 1.26).',
    'Loop variables are per-iteration, which removed the most famous Go closure bug (Go 1.22).',
    'Generic type aliases: `type Set[T comparable] = map[T]struct{}` (Go 1.24).',
  ],
  lessons: [
    {
      id: 'names',
      title: 'Names & declarations',
      blocks: [
        { kind: 'analogy', text: "In Go, a name's first letter is its door sign. Capitalised means \"open to visitors\" (exported from the package); lowercase means \"staff only\". There are no `public` or `private` keywords to remember, because the name itself says it." },
        { kind: 'code', code: `package tempconv

const Boiling = 100.0          // exported: other packages use tempconv.Boiling
var cache = map[string]float64{}   // unexported: only this package sees it

type Celsius float64           // exported type
func CToF(c Celsius) Fahrenheit { return Fahrenheit(c*9/5 + 32) }   // exported func
func round(x float64) float64 { ... }                                 // internal helper` },
        { kind: 'list', items: [
          'There are four kinds of declaration: `var`, `const`, `type` and `func`.',
          'Visibility is per **package**, not per type. Every file in the same package sees every unexported name.',
          'By convention, names are short where the scope is small (`i`, `buf`) and descriptive where it is large. Use camelCase, and keep acronyms upper-case: `ServeHTTP`, `userID`.',
          'Package-level declarations can appear in any order. Inside functions, declare before use.',
        ] },
        { kind: 'check', q: 'Package `prices` declares `func latest()`. Can package `main` call it as `prices.latest()`?', options: ['Yes', 'No: lowercase names are unexported', 'Only in the same module', 'Only with an import alias'], answer: 1, hint: 'Read the door sign.', explain: 'Only names starting with an upper-case letter are visible outside their package.' },
      ],
    },
    {
      id: 'variables',
      title: 'Variables & zero values',
      blocks: [
        { kind: 'analogy', text: "Every Go variable is born holding something sensible, never garbage: 0 for numbers, \"\" for strings, false for bools, and nil for pointers, slices, maps, channels, funcs and interfaces. It is like a hotel that always makes the bed before you arrive." },
        { kind: 'code', code: `var s string              // "" (zero value)
var n int = 42            // explicit type and value
var a, b, c = 1, "two", 3.0   // types inferred per variable

x := 10                   // short declaration: only inside functions
f, err := os.Open(path)   // declare several from a multi-value call
i, j = j, i               // tuple assignment: swap, no temp needed` },
        { kind: 'list', items: [
          '`:=` declares **and** assigns. It needs at least one new variable on the left; the others are just assigned.',
          '`var x T` gives the zero value. Design types so their zero value is useful: a zero `sync.Mutex` is unlocked and ready, and a zero `bytes.Buffer` is an empty buffer.',
          'Every declared local must be used, or it doesn\'t compile.',
        ] },
        { kind: 'compare',
          python: `name = ""        # no declarations; any type later
count = 0
a, b = b, a      # swap`,
          ts: `let name = ""          // inferred string
let count: number      // undefined until set!
;[a, b] = [b, a]       // swap via destructuring`,
          java: `String name = "";
int count;             // fields default to 0; locals
                       // must be assigned before use
int t = a; a = b; b = t;`,
          cpp: `std::string name;      // "" (class types initialise)
int count;             // GARBAGE for locals!
std::swap(a, b);`,
          go: `var name string        // ""
var count int          // 0, always
a, b = b, a            // tuple assignment`,
          note: 'Go guarantees zero values everywhere: locals, fields, array elements and map lookups. There is no uninitialised memory to read.' },
        { kind: 'pitfall', text: '**Shadowing with `:=`** is a classic Go bug. Inside an `if` or `for` block, `x, err := f()` declares a **new** `err` that hides the outer one, so the outer `err` is never set. Use `=` when you mean to assign to existing variables.' },
        { kind: 'check', q: 'What does this print?', code: `var err error
if true {
    _, err := strconv.Atoi("x")
    _ = err
}
fmt.Println(err == nil)`, options: ['`true`', '`false`', 'Compile error', 'Panic'], answer: 0, hint: 'Which `err` did the `:=` inside the block assign to?', explain: 'The inner `:=` declared a new `err` scoped to the `if` block. The outer `err` is still nil.' },
      ],
    },
    {
      id: 'pointers',
      title: 'Pointers & where variables live',
      blocks: [
        { kind: 'analogy', text: "A pointer is a slip of paper with a variable's address on it. Go's pointers can't do arithmetic (you can't walk to the next house), and the garbage collector keeps the house standing as long as anyone holds a slip. So you can safely hand out the address of a local variable, which is a classic crash in C." },
        { kind: 'code', code: `x := 1
p := &x          // p is a *int pointing at x
*p = 2           // x is now 2

func incr(p *int) int { *p++; return *p }
incr(&x)         // 3

q := new(int)    // a pointer to a new, zero-valued int
r := new(42)     // Go 1.26: pointer to an int holding 42` },
        { kind: 'stepper', title: 'Step through: returning a pointer to a local', code: [
          'func newCounter() *int {',
          '    v := 0',
          '    return &v',
          '}',
          'c := newCounter()',
          '*c++',
        ], steps: [
          { line: 5, note: '`newCounter` is called.', memory: [] },
          { line: 2, note: '`v` is a local. In C or C++ it would live on the stack and die when the function returns.', memory: [{ name: 'v', value: '0' }] },
          { line: 3, note: 'The compiler\'s **escape analysis** sees `&v` leaving the function, so it allocates `v` on the **heap** instead.', memory: [{ name: 'v (heap)', value: '0', kind: 'heap', note: 'escaped to the heap' }] },
          { line: 5, note: '`c` holds the address. The GC keeps `v` alive while anything refers to it.', memory: [{ name: 'c', value: '→ v', kind: 'ptr' }, { name: 'v (heap)', value: '0', kind: 'heap' }] },
          { line: 6, note: 'Perfectly safe. No dangling pointer is possible.', memory: [{ name: 'c', value: '→ v', kind: 'ptr' }, { name: 'v (heap)', value: '1', kind: 'heap' }] },
        ] },
        { kind: 'list', items: [
          'You never choose stack vs heap. The compiler decides, and `go build -gcflags=-m` shows its escape decisions.',
          'Heap allocation costs GC work later. In hot paths, avoiding needless pointers (and needless escapes) is a real optimisation.',
          'There is no pointer arithmetic. The `unsafe` package (module 13) exists for the rare exceptions.',
        ] },
        { kind: 'new23', text: "`new(expr)` (Go 1.26) creates a variable initialised to an expression's value and returns its address. That is handy for optional pointer fields: `Person{Age: new(yearsSince(born))}` instead of declaring a temporary first." },
        { kind: 'check', q: 'Is returning `&local` from a Go function safe?', options: ['No, it dangles like in C', 'Yes: escape analysis moves it to the heap if needed', 'Only for structs', 'Only with `new`'], answer: 1, hint: 'Who keeps the house standing while someone holds the slip?', explain: 'The compiler heap-allocates escaping variables, and the GC frees them when unreachable.' },
      ],
    },
    {
      id: 'types',
      title: 'Type declarations',
      blocks: [
        { kind: 'analogy', text: "`type Celsius float64` is like printing a new label for an existing jar. Underneath it is the same float64, but the label stops you pouring Fahrenheit into the Celsius jar without explicitly converting first." },
        { kind: 'code', code: `type Celsius float64
type Fahrenheit float64

func CToF(c Celsius) Fahrenheit { return Fahrenheit(c*9/5 + 32) }

var c Celsius = 100
var f Fahrenheit = 212
// fmt.Println(c == f)            // compile error: mismatched types
fmt.Println(c == Celsius(f))      // explicit conversion: allowed (but meaningless here!)

func (c Celsius) String() string { return fmt.Sprintf("%.1f°C", c) }   // types can have methods
fmt.Println(c)                    // "100.0°C": fmt uses the String method` },
        { kind: 'list', items: [
          'A **defined type** (`type T U`) is distinct from its underlying type: no implicit mixing, conversion with `T(x)`.',
          'Defined types can have methods (module 6). That is how `time.Duration` (an `int64`) prints as `1.5s`.',
          'A **type alias** (`type A = B`) is just another name for the same type. It is mainly used for gradual refactors.',
        ] },
        { kind: 'pitfall', text: "Conversion doesn't check meaning: `Celsius(f)` relabels 212 as 212°C. The type system stops accidents, not deliberate nonsense." },
        { kind: 'check', q: 'With `type Price float64` and `var p Price; var x float64 = 1.5`, which compiles?', options: ['`p = x`', '`p = Price(x)`', 'Both', 'Neither'], answer: 1, hint: 'Is `Price` the same type as `float64`?', explain: 'A defined type needs an explicit conversion. (Untyped constants like `p = 1.5` are fine, as module 3 explains.)' },
      ],
    },
    {
      id: 'packages',
      title: 'Packages, init & scope',
      blocks: [
        { kind: 'analogy', text: "A package is a department: every file in the folder belongs to it, shares its private notes, and is imported by its path, like an address. `init` functions are the department's opening routine, run automatically before anyone else's code (and before `main`)." },
        { kind: 'code', code: `// file: internal/tempconv/conv.go
package tempconv

var table [256]byte

func init() {                  // runs once, automatically, before main
    for i := range table {
        table[i] = byte(i * 2)
    }
}

// file: main.go
import (
    "fmt"
    tc "example.com/app/internal/tempconv"   // optional alias
)` },
        { kind: 'list', items: [
          'One folder = one package. The import path is the module path plus the folder.',
          '`internal/` directories can only be imported from inside the parent tree, which enforces a private API.',
          'Initialisation order: package-level variables (in dependency order), then `init()` functions, imported packages first. Keep `init` small and side-effect-light, because it makes testing harder.',
          'Scope runs universe → package → file (imports are file-scoped) → function → block. Each `if`, `for` and `switch` opens an implicit block.',
        ] },
        { kind: 'new23', text: "Before Go 1.22, `for i := ...` reused **one** variable for the whole loop, so `go func() { use(i) }()` in a loop often saw the last value. Since 1.22 each iteration gets a fresh variable, and that bug class is gone (for modules declaring `go 1.22` or later)." },
        { kind: 'check', q: 'In Go 1.22+, what does this print (in some order)?', code: `var wg sync.WaitGroup
for i := range 3 {
    wg.Add(1)
    go func() { defer wg.Done(); fmt.Print(i) }()
}
wg.Wait()`, options: ['333', '0, 1 and 2 (in some order)', '000', 'Compile error'], answer: 1, hint: 'How many distinct `i` variables exist since Go 1.22?', explain: 'Each iteration has its own `i`, so each goroutine prints a different value. Before 1.22, "333" was a common result.' },
      ],
    },
  ],
  quiz: [
    { q: 'What makes a Go identifier exported?', options: ['The `export` keyword', 'Starting with an upper-case letter', 'Declaring it in main.go', 'A `public` modifier'], answer: 1, explain: 'Visibility comes from capitalisation, at package level.' },
    { q: 'What is the zero value of a pointer, slice or map?', options: ['0', '`nil`', 'An empty allocation', 'Undefined'], answer: 1, explain: 'All reference-like types default to nil.' },
    { q: 'Where can `x := 1` be used?', options: ['Anywhere', 'Only inside functions', 'Only at package level', 'Only in for loops'], answer: 1, explain: 'Package level needs `var`.' },
    { q: 'Who decides whether a variable lives on the stack or the heap?', options: ['You, with `new`', 'The compiler (escape analysis)', 'The GC at runtime', 'The OS'], answer: 1, explain: '`new` and `&` don\'t force heap allocation; escape analysis decides.' },
    { q: 'What does `type Celsius float64` create?', options: ['An alias of float64', 'A distinct defined type with float64 as its underlying type', 'A struct', 'A generic type'], answer: 1, explain: '`type A = B` would be an alias.' },
    { q: 'What does `p := new(42)` do in Go 1.26+?', options: ['Compile error', 'Allocates an int initialised to 42 and returns *int', 'Allocates 42 bytes', 'Creates a slice of 42 ints'], answer: 1, explain: '`new` now accepts an expression as well as a type.' },
    { q: 'When do `init` functions run?', options: ['When first called', 'Automatically, after package variables are initialised and before main', 'Only in tests', 'After main returns'], answer: 1, explain: 'Imported packages initialise first.' },
    { q: 'Why is `x, err := g()` inside an `if` block risky?', options: ['It is a syntax error', 'It may shadow an outer `err`, leaving the outer one unchanged', 'It allocates on the heap', 'It disables escape analysis'], answer: 1, explain: 'Use `=` to assign to existing variables.' },
  ],
}
