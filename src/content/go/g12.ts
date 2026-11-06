import type { Module } from '../types'

export const g12: Module = {
  n: 12,
  title: 'Reflection',
  tour: '12 · Reflection',
  summary: 'Inspecting and modifying values whose types aren\'t known at compile time: reflect.Type and reflect.Value, a recursive value printer, setting values, reading struct tags, calling methods, and when not to use any of it.',
  topics: ['reflect.Type & Value', 'Kinds & a value printer', 'Setting values', 'Struct tags', 'Methods', 'Cautions'],
  cpp23: [
    'Iterator methods `Type.Fields`, `Type.Methods`, `Value.Fields`, `Value.Methods` (Go 1.26).',
    '`reflect.TypeFor[T]()` (Go 1.22) avoids the `TypeOf((*T)(nil)).Elem()` dance.',
    'Generics (Go 1.18) replaced many former uses of reflection.',
  ],
  lessons: [
    {
      id: 'basics',
      title: 'reflect.Type & reflect.Value',
      blocks: [
        { kind: 'analogy', text: "Reflection is an X-ray machine at customs. Normally you only know a box is \"any\" (an interface). Pass it through the scanner and you can see what is really inside (`reflect.Type`), and with the right permit, reach in and change it (`reflect.Value`). It is powerful, slow, and not for everyday use." },
        { kind: 'code', code: `x := 3.4
t := reflect.TypeOf(x)        // reflect.Type: float64
v := reflect.ValueOf(x)       // reflect.Value holding 3.4

fmt.Println(t, t.Kind())      // float64 float64
fmt.Println(v.Float())        // 3.4
fmt.Println(v.Type() == t)    // true

type Trade struct{ Sym string; Px float64 }
tt := reflect.TypeOf(Trade{})
fmt.Println(tt.Name(), tt.Kind(), tt.NumField())     // Trade struct 2

et := reflect.TypeFor[error]()                        // Go 1.22: a type value for an interface
fmt.Println(et.Kind())                                // interface` },
        { kind: 'list', items: [
          '**Type** answers "what is it?": name, kind, fields, methods, element type.',
          '**Value** answers "what does it hold?" and lets you read (`.Int()`, `.String()`, `.Field(i)`) and, sometimes, write.',
          '`reflect.ValueOf(x).Interface()` turns a Value back into an `any`.',
        ] },
        { kind: 'check', q: 'For `type Celsius float64`, what are `TypeOf(c).Name()` and `.Kind()`?', options: ['"float64", Float64', '"Celsius", Float64', '"Celsius", Struct', '"Celsius", Celsius'], answer: 1, hint: 'Name is the defined type; Kind is the underlying category.', explain: 'Kind groups types by representation: there is a fixed set (Int, Float64, Struct, Slice, Map…).' },
      ],
    },
    {
      id: 'display',
      title: 'Kinds & a recursive printer',
      blocks: [
        { kind: 'analogy', text: "`Kind` is the shape category on the X-ray: a box of boxes (struct), a row (slice), a lookup table (map), an arrow (pointer). A generic printer only needs a rule for each shape, then calls itself on whatever is inside. That is exactly how `fmt`'s `%v` and `encoding/json` work." },
        { kind: 'code', code: `func display(path string, v reflect.Value) {
    switch v.Kind() {
    case reflect.Invalid:
        fmt.Printf("%s = invalid\\n", path)
    case reflect.Slice, reflect.Array:
        for i := range v.Len() {
            display(fmt.Sprintf("%s[%d]", path, i), v.Index(i))
        }
    case reflect.Struct:
        for i := range v.NumField() {
            display(path+"."+v.Type().Field(i).Name, v.Field(i))
        }
    case reflect.Map:
        for _, k := range v.MapKeys() {
            display(fmt.Sprintf("%s[%v]", path, k), v.MapIndex(k))
        }
    case reflect.Pointer, reflect.Interface:
        if v.IsNil() {
            fmt.Printf("%s = nil\\n", path)
        } else {
            display("(*"+path+")", v.Elem())
        }
    default:
        fmt.Printf("%s = %v\\n", path, v)
    }
}

display("book", reflect.ValueOf(Book{Sym: "XAU", Bids: []Level{{2390.5, 10}}}))
// book.Sym = XAU
// book.Bids[0].Px = 2390.5
// book.Bids[0].Qty = 10` },
        { kind: 'pitfall', text: 'A naive recursive printer loops forever on cyclic data (a linked list that points back to itself). Real encoders track which pointers they have already visited.' },
        { kind: 'check', q: 'Which method unwraps a pointer or interface Value to what it refers to?', options: ['`.Deref()`', '`.Elem()`', '`.Inner()`', '`.Value()`'], answer: 1, hint: 'Same name as the Type method that gives a slice\'s element type.', explain: '`Elem()` follows pointers and interfaces, and on Types gives the element type of slices, arrays, maps and channels.' },
      ],
    },
    {
      id: 'setting',
      title: 'Setting values & struct tags',
      blocks: [
        { kind: 'analogy', text: "Looking at an X-ray of a **photocopy** won't let you change the original. To modify something through reflection you must hand over its **address** (a pointer), then step through to the real thing with `.Elem()`. Only then is the value \"settable\"." },
        { kind: 'code', code: `x := 2
v := reflect.ValueOf(x)
fmt.Println(v.CanSet())               // false: v holds a copy
// v.SetInt(3)                        // panic: unaddressable value

p := reflect.ValueOf(&x).Elem()       // the variable itself
p.SetInt(3)
fmt.Println(x)                        // 3

// Reading struct tags: how encoding/json, ORMs and validators work
type Order struct {
    Sym string  \`csv:"symbol" validate:"required"\`
    Qty int     \`csv:"qty"\`
    note string \`csv:"note"\`              // unexported: can be read, never set
}

func csvHeader(v any) []string {
    t := reflect.TypeOf(v)
    var cols []string
    for f := range t.Fields() {           // Go 1.26 iterator; before: for i := range t.NumField()
        if !f.IsExported() { continue }
        if name, ok := f.Tag.Lookup("csv"); ok {
            cols = append(cols, name)
        }
    }
    return cols
}
csvHeader(Order{})                        // [symbol qty]` },
        { kind: 'list', items: [
          '`CanSet()` requires an addressable value obtained through a pointer and an exported field.',
          'Tags are plain strings in `key:"value"` form; `Tag.Get` and `Tag.Lookup` parse them.',
          'Unexported fields can be read via reflection but never set; that respects package encapsulation.',
        ] },
        { kind: 'check', q: 'Why does `reflect.ValueOf(x).SetInt(5)` panic?', options: ['x is not an int', 'The Value holds a copy of x, so it isn\'t addressable', 'SetInt doesn\'t exist', 'Reflection is read-only'], answer: 1, hint: 'Photocopy vs original.', explain: 'Use `reflect.ValueOf(&x).Elem().SetInt(5)`.' },
      ],
    },
    {
      id: 'cautions',
      title: 'Methods & cautions',
      blocks: [
        { kind: 'analogy', text: "Reflection turns compile-time checks into runtime surprises. It is like replacing a building's labelled wiring diagram with a technician who works out each wire's purpose live. It works, but it is slower, and when it's wrong you find out in production." },
        { kind: 'code', code: `v := reflect.ValueOf(time.Hour)
for i := range v.NumMethod() {
    m := v.Type().Method(i)
    fmt.Println(m.Name, m.Type)          // Abs func(time.Duration) time.Duration ...
}
out := v.MethodByName("String").Call(nil)
fmt.Println(out[0].String())             // 1h0m0s` },
        { kind: 'list', items: [
          '**Fragile**: errors that the compiler would catch (wrong type, missing field) become runtime panics.',
          '**Slow**: often 10–100× slower than direct code, with extra allocations.',
          '**Opaque**: tooling (refactors, find-references) can\'t see through it.',
          '**Prefer, in order**: concrete types → interfaces → generics → code generation (`go generate`) → reflection.',
          'Good uses: general-purpose encoders and decoders, ORMs, validators, `fmt` itself. That is library territory, rarely application code.',
        ] },
        { kind: 'check', q: 'You need a `Max` that works for ints, floats and strings. Best tool?', options: ['Reflection', 'Generics with `cmp.Ordered`', 'Type switch on any', 'Code generation'], answer: 1, hint: 'Which option keeps compile-time type checking?', explain: '`func Max[T cmp.Ordered](a, b T) T` is fast, type-safe and simple. Reflection would be slow and error-prone here.' },
      ],
    },
  ],
  quiz: [
    { q: 'What do `reflect.TypeOf` and `reflect.ValueOf` take?', options: ['A type name string', 'An interface value (`any`)', 'A pointer only', 'A struct only'], answer: 1, explain: 'They inspect the dynamic type and value inside the interface.' },
    { q: 'What is a `reflect.Kind`?', options: ['The defined type name', 'The underlying category: Int, Struct, Slice, Map, Pointer…', 'A struct tag', 'A method set'], answer: 1, explain: 'Many named types share one Kind.' },
    { q: 'How do you get a settable Value for variable x?', options: ['`reflect.ValueOf(x)`', '`reflect.ValueOf(&x).Elem()`', '`reflect.New(x)`', '`reflect.Set(x)`'], answer: 1, explain: 'It must be addressable.' },
    { q: 'Can reflection set an unexported struct field?', options: ['Yes, always', 'No', 'Only in the same file', 'Only with unsafe'], answer: 1, explain: 'It can read, but `CanSet` is false (without unsafe tricks).' },
    { q: 'How do you read the `csv` tag of a field?', options: ['`f.Tags["csv"]`', '`f.Tag.Get("csv")` or `f.Tag.Lookup("csv")`', '`reflect.Tag(f, "csv")`', '`f.Annotation("csv")`'], answer: 1, explain: '`Lookup` also reports presence.' },
    { q: 'What does `t.Fields()` (Go 1.26) return?', options: ['A slice', 'An iterator over the struct\'s fields', 'A map', 'The field count'], answer: 1, explain: 'Use it with `for f := range t.Fields()`.' },
    { q: 'Main downside of reflection?', options: ['It doesn\'t work with structs', 'Runtime errors instead of compile errors, plus slower code', 'It requires cgo', 'It is deprecated'], answer: 1, explain: 'Prefer generics or interfaces when they fit.' },
    { q: 'Which standard packages are built on reflection?', options: ['strings and bytes', 'fmt and encoding/json', 'sync and atomic', 'math and sort'], answer: 1, explain: 'That is why they work with any type.' },
  ],
}
