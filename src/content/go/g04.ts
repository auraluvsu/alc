import type { Module } from '../types'

export const g04: Module = {
  n: 4,
  title: 'Composite Types',
  tour: '4 · Composite Types',
  summary: 'Arrays as values, slices as windows onto shared arrays, maps, structs and embedding, and turning structs into JSON.',
  topics: ['Arrays', 'Slices', 'Maps', 'Structs & embedding', 'JSON'],
  cpp23: [
    '`slices` and `maps` packages: `slices.Sort`, `slices.Contains`, `slices.Index`, `maps.Clone`… (Go 1.21).',
    'Iterators: `slices.Collect`, `slices.Sorted(maps.Keys(m))` (Go 1.23).',
    'The `omitzero` JSON tag option (Go 1.24) and the new `encoding/json/v2` (Go 1.27).',
    'Struct literals may set promoted fields of embedded structs directly (Go 1.27).',
  ],
  lessons: [
    {
      id: 'arrays',
      title: 'Arrays',
      blocks: [
        { kind: 'analogy', text: "A Go array is an egg box with a fixed number of slots printed on the lid: `[3]int` and `[4]int` are different boxes entirely. Hand someone the box and they get **their own copy** of every egg." },
        { kind: 'code', code: `var a [3]int                 // [0 0 0]
b := [...]string{"XAU", "XAG"}   // length from the literal: [2]string
c := [5]int{1: 10, 4: 40}    // [0 10 0 0 40]: indexed elements

d := a                       // copies all 3 ints
d[0] = 99                    // a is unchanged
fmt.Println(a == d)          // false: arrays are comparable with ==

func zero(p *[32]byte) { *p = [32]byte{} }   // pass a pointer to avoid copying big arrays` },
        { kind: 'p', text: 'Arrays are rarely used directly because their size is part of the type. Their real job is to sit **underneath slices**, which are what you use every day.' },
        { kind: 'check', q: 'Is `[3]int` the same type as `[4]int`?', options: ['Yes', 'No: the length is part of the type', 'Only if both are empty', 'Only via a slice'], answer: 1, hint: 'Look at the lid of the egg box.', explain: 'Array length is part of the type, which is why functions usually take slices instead.' },
      ],
    },
    {
      id: 'slices',
      title: 'Slices',
      blocks: [
        { kind: 'analogy', text: "A slice is a **window** onto an array: a pointer to where the window starts, how many slots you can see (`len`), and how far the wall extends to the right (`cap`). Two slices can be windows onto the same wall, so painting through one shows in the other. That is the single most important thing to understand about Go slices." },
        { kind: 'code', code: `months := [...]string{"Jan", "Feb", "Mar", "Apr", "May", "Jun"}
q1 := months[0:3]        // [Jan Feb Mar], len 3, cap 6
q2 := months[3:6]        // [Apr May Jun], len 3, cap 3

var s []int              // nil slice: len 0, and append works on it
s = append(s, 1, 2, 3)   // ALWAYS assign append's result back
t := make([]int, 0, 100) // len 0, cap 100: room to grow without reallocating
u := slices.Clone(s)     // an independent copy
copy(u, s)               // copy into an existing slice (min of the lengths)` },
        { kind: 'stepper', title: 'Step through: two slices, one array', code: [
          'a := []int{1, 2, 3, 4}       // len 4, cap 4',
          'b := a[:2]                   // len 2, cap 4',
          'b = append(b, 99)            // room in the array?',
          'fmt.Println(a)               // ???',
          'b = append(b, 7, 8)          // now beyond cap',
          'b[0] = -1',
        ], steps: [
          { line: 1, note: '`a` is a header (pointer, len, cap) pointing at a backing array.', memory: [{ name: 'a', value: 'ptr → arr, len 4, cap 4', kind: 'ptr' }, { name: 'arr', value: '[1 2 3 4]', kind: 'heap' }] },
          { line: 2, note: '`b` is a **second window on the same array**, showing 2 elements but with capacity 4.', memory: [{ name: 'a', value: 'ptr → arr, len 4, cap 4', kind: 'ptr' }, { name: 'b', value: 'ptr → arr, len 2, cap 4', kind: 'ptr' }, { name: 'arr', value: '[1 2 3 4]', kind: 'heap' }] },
          { line: 3, note: 'There\'s spare capacity, so `append` writes 99 **into the shared array**, overwriting `a[2]`.', memory: [{ name: 'a', value: 'ptr → arr, len 4, cap 4', kind: 'ptr' }, { name: 'b', value: 'ptr → arr, len 3, cap 4', kind: 'ptr' }, { name: 'arr', value: '[1 2 99 4]', kind: 'heap', note: 'a sees the change' }] },
          { line: 4, note: 'Prints `[1 2 99 4]`. A surprise if you thought `b` was a copy.', memory: [{ name: 'arr', value: '[1 2 99 4]', kind: 'heap' }] },
          { line: 5, note: 'Needs 5 slots, cap is 4: `append` allocates a **new, bigger array**, copies, and returns a header pointing there.', memory: [{ name: 'a', value: 'ptr → arr, len 4', kind: 'ptr' }, { name: 'arr', value: '[1 2 99 4]', kind: 'heap' }, { name: 'b', value: 'ptr → arr2, len 5, cap 8', kind: 'ptr' }, { name: 'arr2', value: '[1 2 99 7 8 _ _ _]', kind: 'heap' }] },
          { line: 6, note: 'Now `a` and `b` are independent. Whether two slices share memory depends on capacity, which is easy to forget.', memory: [{ name: 'arr', value: '[1 2 99 4]', kind: 'heap', note: 'a: unchanged' }, { name: 'arr2', value: '[-1 2 99 7 8 _ _ _]', kind: 'heap', note: 'b only' }] },
        ] },
        { kind: 'list', items: [
          '`append` may or may not reallocate, so always write `s = append(s, ...)`.',
          'A full slice expression `a[lo:hi:max]` caps the capacity, so a later `append` must copy instead of overwriting the caller\'s data.',
          'Slices aren\'t comparable with `==` (except to `nil`). Use `slices.Equal`.',
          '`slices` package: `Sort`, `SortFunc`, `BinarySearch`, `Contains`, `Index`, `Reverse`, `Max`, `Compact`, `Insert`, `Delete`.',
        ] },
        { kind: 'compare',
          python: `a = [1, 2, 3, 4]
b = a[:2]        # slicing COPIES in Python
b.append(99)
print(a)         # [1, 2, 3, 4]`,
          ts: `const a = [1, 2, 3, 4]
const b = a.slice(0, 2)   // copy
b.push(99)
console.log(a)            // [1, 2, 3, 4]`,
          java: `List<Integer> a = new ArrayList<>(List.of(1, 2, 3, 4));
List<Integer> b = a.subList(0, 2);  // a VIEW, like Go
b.add(99);
System.out.println(a);              // [1, 2, 99, 3, 4]`,
          cpp: `std::vector<int> a {1, 2, 3, 4};
std::span<int> b {a.data(), 2};      // a view, but can't grow
b[0] = -1;                           // a[0] is now -1`,
          go: `a := []int{1, 2, 3, 4}
b := a[:2]       // a view onto a's array
b = append(b, 99)
fmt.Println(a)   // [1 2 99 4]`,
          note: 'A Go slice is a growable view: it shares memory until a growth forces a copy.' },
        { kind: 'check', q: 'What does this print?', code: `s := make([]int, 3, 10)
t := append(s, 4)
s = append(s, 5)
fmt.Println(t[3])`, options: ['4', '5', '0', 'Panic'], answer: 1, hint: 'Both appends had spare capacity in the same backing array.', explain: 'Both `t` and the new `s` write to index 3 of the same array; the second append overwrote 4 with 5.' },
      ],
    },
    {
      id: 'maps',
      title: 'Maps',
      blocks: [
        { kind: 'analogy', text: "A map is a cloakroom: hand over a ticket (key), get your coat (value). Asking for a ticket that was never issued gets you an empty hanger (the zero value) rather than an argument, unless you ask \"was this ticket real?\" with comma-ok." },
        { kind: 'code', code: `ages := map[string]int{"alice": 31, "bob": 34}
ages["carol"] = 27
delete(ages, "bob")            // no-op if missing
n := ages["dave"]              // 0: missing keys read as the zero value
if age, ok := ages["dave"]; !ok {
    fmt.Println("no dave")
}
clear(ages)                    // remove everything (Go 1.21)

for _, name := range slices.Sorted(maps.Keys(ages)) {   // sorted iteration (Go 1.23)
    fmt.Println(name, ages[name])
}

var m map[string]int           // nil map: reads OK, len 0...
// m["x"] = 1                  // ...but writing PANICS: make it first
seen := make(map[string]struct{})   // a set: struct{} takes zero bytes
seen["XAU"] = struct{}{}` },
        { kind: 'list', items: [
          'Keys must be **comparable** (`==`): numbers, strings, pointers, arrays and structs of comparables. Slices, maps and functions can\'t be keys.',
          'Iteration order is randomised on purpose, so never rely on it.',
          '`&m[k]` is illegal: map entries move when the map grows.',
          'Maps are **not safe for concurrent writes**. Concurrent map writes crash the program; use a mutex or `sync.Map` (module 9).',
        ] },
        { kind: 'check', q: 'What happens here?', code: `var counts map[string]int
counts["a"]++`, options: ['counts["a"] becomes 1', 'Panic: assignment to entry in nil map', 'Compile error', 'Nothing'], answer: 1, hint: 'Was the cloakroom ever built?', explain: 'A nil map can be read but not written. Initialise with `make(map[string]int)` or a literal.' },
      ],
    },
    {
      id: 'structs',
      title: 'Structs & embedding',
      blocks: [
        { kind: 'analogy', text: "A struct is a form with labelled boxes. Embedding one struct in another is stapling a whole form inside a bigger one: you can fill in the inner form's boxes as if they belonged to the outer form (promotion). But it is still composition, not inheritance; nobody becomes a subclass." },
        { kind: 'code', code: `type Point struct{ X, Y int }

type Circle struct {
    Point          // embedded: no field name, just the type
    Radius int
}

var c Circle
c.X = 8            // promoted: same as c.Point.X
c.Radius = 5

c2 := Circle{Point: Point{X: 1, Y: 2}, Radius: 5}
c3 := Circle{X: 1, Y: 2, Radius: 5}        // Go 1.27: promoted fields as keys

p := &Point{1, 2}  // pointer to a struct literal; p.X auto-dereferences
fmt.Println(Point{1, 2} == Point{1, 2})     // true: structs of comparables compare with ==
fmt.Printf("%+v\\n", c2)                     // {Point:{X:1 Y:2} Radius:5}` },
        { kind: 'list', items: [
          'Fields follow the same capitalisation rule: `X` is exported and `x` isn\'t. That is the only access control there is.',
          'Struct values copy on assignment and when passed. Use pointers to share or to avoid copying big structs.',
          'Embedding also promotes **methods** (module 6), which is how Go types compose behaviour.',
          'An empty struct `struct{}` takes zero bytes. It is used for sets and for signal-only channels.',
        ] },
        { kind: 'new23', text: "Go 1.27 lets a struct literal set promoted fields directly, so `Circle{X: 1, Y: 2, Radius: 5}` works. It isn't allowed through an embedded **pointer**, or when the same literal also sets the embedded struct itself (`Circle{Point: p, X: 1}` is an error)." },
        { kind: 'check', q: 'Given the `Circle` above, what does `c.X` refer to?', options: ['A compile error', 'c.Point.X, via promotion', 'A copy of Point', 'A method'], answer: 1, hint: 'The inner form\'s boxes can be filled in from outside.', explain: 'Fields of embedded structs are promoted to the outer struct, unless the name is ambiguous.' },
      ],
    },
    {
      id: 'json',
      title: 'JSON',
      blocks: [
        { kind: 'analogy', text: "Struct tags are luggage labels tied to each field: \"when you travel as JSON, call yourself `symbol`, and don't bother packing if you're empty\". `encoding/json` reads the labels with reflection and does the packing and unpacking for you." },
        { kind: 'code', code: `type Trade struct {
    Symbol string    \`json:"symbol"\`
    Price  float64   \`json:"price"\`
    Qty    int       \`json:"qty,omitempty"\`     // dropped when 0
    Venue  *string   \`json:"venue,omitzero"\`    // Go 1.24: dropped when zero (nil)
    secret string                               // unexported: never encoded
}

data, err := json.Marshal(Trade{Symbol: "XAU", Price: 2390.5})
// {"symbol":"XAU","price":2390.5}
pretty, _ := json.MarshalIndent(trades, "", "  ")

var t Trade
if err := json.Unmarshal(data, &t); err != nil { /* malformed or wrong types */ }

dec := json.NewDecoder(resp.Body)   // stream from any io.Reader
err = dec.Decode(&t)` },
        { kind: 'list', items: [
          'Only **exported** fields are encoded. A lowercase field silently disappears from the output, which is a classic first-day bug.',
          'Unknown JSON fields are ignored by default. `dec.DisallowUnknownFields()` makes them errors.',
          'Decode into `map[string]any` when the shape is unknown, then type-assert (module 7).',
        ] },
        { kind: 'new23', text: "Go 1.27 adds `encoding/json/v2` and `encoding/json/jsontext`, a faster and stricter redesign: invalid UTF-8 and duplicate keys are errors by default. The original `encoding/json` now runs on the v2 engine and keeps its old behaviour, so existing code keeps working." },
        { kind: 'check', q: 'A struct field is declared as `price float64` with the tag `json:"price"`. What appears in the `json.Marshal` output?', options: ['"price": the value', 'Nothing: unexported fields are skipped', 'A compile error', '"Price": the value'], answer: 1, hint: 'Look at the first letter of the field name.', explain: 'The tag doesn\'t matter; `encoding/json` can only see exported fields. Rename it `Price`.' },
      ],
    },
  ],
  quiz: [
    { q: 'What happens when you assign one array to another?', options: ['Both refer to the same storage', 'All elements are copied', 'Compile error', 'Only the header is copied'], answer: 1, explain: 'Arrays are values in Go.' },
    { q: 'A slice consists of…', options: ['a pointer only', 'pointer, length and capacity', 'a copy of the array', 'a linked list'], answer: 1, explain: 'It is a small header viewing a backing array.' },
    { q: 'Why must you write `s = append(s, x)`?', options: ['Style rule', 'append may return a header pointing at a new array', 'append is a method', 'To avoid a vet warning only'], answer: 1, explain: 'If capacity runs out, the result refers to new memory.' },
    { q: 'What does writing to a nil map do?', options: ['Creates the map', 'Panics', 'Is ignored', 'Is a compile error'], answer: 1, explain: 'Reads are fine; writes need `make` or a literal.' },
    { q: 'What is the map iteration order?', options: ['Insertion order', 'Sorted by key', 'Deliberately unspecified and randomised', 'Hash order, stable between runs'], answer: 2, explain: 'Sort the keys when order matters: `slices.Sorted(maps.Keys(m))`.' },
    { q: 'What is struct embedding?', options: ['Inheritance', 'Composition with promoted fields and methods', 'Copying a struct\'s fields by hand', 'A generic type'], answer: 1, explain: 'There is no subtype relationship: a Circle is not a Point.' },
    { q: 'Which fields does `encoding/json` encode?', options: ['All fields', 'Exported fields only', 'Tagged fields only', 'Fields with `json:"-"`'], answer: 1, explain: '`json:"-"` actually excludes a field.' },
    { q: 'How do you compare two slices for equal contents?', options: ['`a == b`', '`slices.Equal(a, b)`', '`reflect.Same(a, b)`', 'You can\'t'], answer: 1, explain: '`==` only compares a slice with nil.' },
  ],
}
