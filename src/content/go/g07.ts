import type { Module } from '../types'

export const g07: Module = {
  n: 7,
  title: 'Interfaces',
  tour: '7 · Interfaces',
  summary: 'Implicitly satisfied interfaces, the io.Reader/Writer family, what an interface value really holds (and the nil trap), type assertions and switches, and how to design small interfaces.',
  topics: ['Interfaces as contracts', 'Interface values & nil', 'Standard interfaces', 'Type assertions & switches', 'Designing interfaces'],
  cpp23: [
    '`any` is an alias for `interface{}` (Go 1.18).',
    'Interfaces can list type sets (`~int | ~float64`) when used as generic constraints (Go 1.18).',
    '`errors.AsType` (Go 1.26) is a generic alternative to asserting on error types.',
  ],
  lessons: [
    {
      id: 'contracts',
      title: 'Interfaces as contracts',
      blocks: [
        { kind: 'analogy', text: "An interface is a job description that lists skills, not qualifications. \"Must be able to Write bytes.\" Anyone with that skill gets the job automatically, without applying or signing anything. A file, a network connection, an HTTP response and a hash function all qualify for the \"writer\" job without ever having heard of it." },
        { kind: 'code', code: `type Writer interface {                       // from package io
    Write(p []byte) (n int, err error)
}

// ByteCounter satisfies io.Writer just by having the method. No "implements".
type ByteCounter int

func (c *ByteCounter) Write(p []byte) (int, error) {
    *c += ByteCounter(len(p))
    return len(p), nil
}

var c ByteCounter
fmt.Fprintf(&c, "hello, %s", "Dolly")        // Fprintf accepts any io.Writer
fmt.Println(c)                               // 12

var _ io.Writer = (*ByteCounter)(nil)        // compile-time check that it still satisfies` },
        { kind: 'list', items: [
          'Satisfaction is **implicit** and checked at compile time wherever a value is assigned to an interface type.',
          'Interfaces can embed other interfaces: `type ReadWriter interface { Reader; Writer }`.',
          'The method set matters. Here only `*ByteCounter` has `Write` (pointer receiver), so a plain `ByteCounter` value doesn\'t satisfy `io.Writer`.',
          'The `var _ I = (*T)(nil)` line is an idiom that turns "T stopped satisfying I" into a compile error right next to the type.',
        ] },
        { kind: 'compare',
          python: `class ByteCounter:          # duck typing: anything
    def __init__(self):     # with write() works,
        self.n = 0          # checked only at runtime
    def write(self, s):
        self.n += len(s)
print("hello", file=ByteCounter())`,
          ts: `interface Writer { write(p: Uint8Array): number }
class ByteCounter {          // structural: no "implements"
  n = 0                      // needed, like Go
  write(p: Uint8Array) { this.n += p.length; return p.length }
}
const w: Writer = new ByteCounter()`,
          java: `interface Writer { int write(byte[] p); }
class ByteCounter implements Writer {   // must declare it
    int n;
    public int write(byte[] p) { n += p.length; return p.length; }
}`,
          cpp: `struct Writer {                      // nominal: must inherit
    virtual std::size_t write(std::span<const std::byte>) = 0;
    virtual ~Writer() = default;
};
struct ByteCounter : Writer { /* ... */ };`,
          go: `type ByteCounter int

func (c *ByteCounter) Write(p []byte) (int, error) {
    *c += ByteCounter(len(p))
    return len(p), nil
}
var w io.Writer = new(ByteCounter)   // satisfied implicitly`,
          note: 'Go interfaces are structural like TypeScript\'s, but checked at compile time and dispatched at runtime.' },
        { kind: 'check', q: '`type T struct{}` has `func (t *T) Write(p []byte) (int, error)`. Which assignment compiles?', options: ['`var w io.Writer = T{}`', '`var w io.Writer = &T{}`', 'Both', 'Neither'], answer: 1, hint: 'Which type has the Write method in its method set?', explain: 'Pointer-receiver methods belong to `*T`, not `T`. Only `&T{}` has `Write`.' },
      ],
    },
    {
      id: 'values',
      title: 'Interface values & the nil trap',
      blocks: [
        { kind: 'analogy', text: "An interface value is a two-part label on a box: **what kind of thing is inside** (the dynamic type) and **where the thing is** (the dynamic value). An interface is nil only when **both** parts are blank. A box labelled \"*Buffer\" with nothing in it is still a labelled box, not an empty one." },
        { kind: 'stepper', title: 'Step through: a nil pointer inside a non-nil interface', code: [
          'var buf *bytes.Buffer        // nil pointer',
          'var w io.Writer              // nil interface',
          'w = buf                      // store the nil pointer',
          'fmt.Println(w == nil)        // ???',
          'w.Write([]byte("hi"))        // ???',
        ], steps: [
          { line: 1, note: '`buf` is a nil `*bytes.Buffer`.', memory: [{ name: 'buf', value: 'nil', kind: 'ptr' }] },
          { line: 2, note: 'A fresh interface: **type = nil, value = nil**, so `w == nil` is true.', memory: [{ name: 'buf', value: 'nil', kind: 'ptr' }, { name: 'w', value: 'type: nil | value: nil' }] },
          { line: 3, note: 'Assigning fills in the type part. The value part is still a nil pointer.', memory: [{ name: 'buf', value: 'nil', kind: 'ptr' }, { name: 'w', value: 'type: *bytes.Buffer | value: nil', kind: 'ptr' }] },
          { line: 4, note: 'Prints **false**: the interface has a type, so it isn\'t nil, even though the pointer inside is.', memory: [{ name: 'w == nil', value: 'false', note: 'the classic Go gotcha' }] },
          { line: 5, note: 'Dispatch works (it knows the type), then `(*bytes.Buffer).Write` dereferences nil and **panics**.', memory: [{ name: 'result', value: 'panic: nil pointer dereference', kind: 'dead' }] },
        ] },
        { kind: 'pitfall', text: "The most common form: a function declared to return `error` does `var err *MyErr; ...; return err`. The caller's `if err != nil` is then **always true**, even on success. Return a literal `nil` for the interface, never a typed nil pointer." },
        { kind: 'list', items: [
          'Two interface values are `==` when both their types and values are equal. Comparing interfaces holding uncomparable types (slices, maps) panics.',
          'Calling a method on an interface costs one indirect call, similar to a C++ virtual call.',
          'Storing a non-pointer value in an interface may allocate, which matters in hot paths.',
        ] },
        { kind: 'check', q: 'What does this print?', code: `func find() error {
    var e *os.PathError
    return e
}
fmt.Println(find() == nil)`, options: ['`true`', '`false`', 'Compile error', 'Panic'], answer: 1, hint: 'Which half of the label got filled in on return?', explain: 'The returned interface has type `*os.PathError` and a nil value, so it isn\'t nil. Return plain `nil` instead.' },
      ],
    },
    {
      id: 'standard',
      title: 'The standard interfaces',
      blocks: [
        { kind: 'analogy', text: "A handful of tiny interfaces are the standard plug sockets of Go. Once your type fits the socket (`io.Reader`, `io.Writer`, `fmt.Stringer`, `error`, `http.Handler`, `sort.Interface`), it plugs straight into hundreds of library functions you never had to adapt." },
        { kind: 'code', code: `// io.Reader / io.Writer: the universal byte stream
func countLines(r io.Reader) (int, error) {            // files, sockets, gzip, strings...
    sc := bufio.NewScanner(r)
    n := 0
    for sc.Scan() { n++ }
    return n, sc.Err()
}
countLines(os.Stdin)
countLines(strings.NewReader("a\\nb\\n"))
gz, _ := gzip.NewReader(file); countLines(gz)        // readers wrap readers

// fmt.Stringer: how fmt prints your type
type Side int
func (s Side) String() string { return [...]string{"BUY", "SELL"}[s] }
fmt.Println(Side(1))                                   // SELL

// http.Handler: anything that can serve a request
type health struct{}
func (health) ServeHTTP(w http.ResponseWriter, r *http.Request) { w.Write([]byte("ok")) }
http.Handle("/health", health{})

// sort.Interface (older style; slices.SortFunc is usually simpler now)
type byPx []Trade
func (s byPx) Len() int           { return len(s) }
func (s byPx) Less(i, j int) bool { return s[i].Px < s[j].Px }
func (s byPx) Swap(i, j int)      { s[i], s[j] = s[j], s[i] }
sort.Sort(byPx(trades))` },
        { kind: 'p', text: 'Composition is the point. `io.MultiWriter`, `io.TeeReader`, `io.LimitReader`, `bufio.Writer`, `gzip.Writer` and `hash.Hash` all take and return these small interfaces, so pipelines click together: read a file, decompress it, hash it and count it in one pass, with no intermediate buffers.' },
        { kind: 'check', q: 'Why can `countLines` accept a file, a string reader and a gzip stream?', options: ['They share a base class', 'Each has a `Read([]byte) (int, error)` method, so each satisfies io.Reader', 'Go converts them automatically', 'Reflection'], answer: 1, hint: 'Same socket, different appliances.', explain: 'The function depends only on the one-method interface, so any reader works.' },
      ],
    },
    {
      id: 'assertions',
      title: 'Type assertions & type switches',
      blocks: [
        { kind: 'analogy', text: "A type assertion is opening the box and asking \"is this a *specific* thing?\". With the comma-ok form you peek politely and get `false` if wrong. Without it you insist, and the program panics if you're wrong. A type switch is a sorting desk that routes each box by what is inside." },
        { kind: 'code', code: `var v any = 42

n := v.(int)               // insist: panics if v isn't an int
s, ok := v.(string)        // peek: ok == false, s == ""

// Asserting to an interface: "does it ALSO have these methods?"
if sw, ok := w.(io.StringWriter); ok {
    sw.WriteString("fast path")          // avoid a []byte conversion
}

func describe(x any) string {
    switch x := x.(type) {               // x has the matched type in each case
    case nil:
        return "nil"
    case int, int64:
        return fmt.Sprintf("integer %v", x)   // multiple types: x stays 'any'
    case string:
        return "string of " + strconv.Itoa(len(x))
    case error:
        return "error: " + x.Error()
    default:
        return fmt.Sprintf("other %T", x)
    }
}` },
        { kind: 'list', items: [
          'Asserting to an **interface** type is how libraries discover optional capabilities, e.g. `io.Copy` checks for `WriterTo` / `ReaderFrom` to skip a buffer.',
          'Heavy use of type switches over many concrete types usually means a method should be on an interface instead.',
          'For error types, prefer `errors.As` / `errors.AsType`, which also look through wrapping.',
        ] },
        { kind: 'check', q: 'What happens with `var v any = "hi"; n := v.(int)`?', options: ['n is 0', 'Panic', 'Compile error', 'n is 2'], answer: 1, hint: 'Single-value assertion form.', explain: 'The single-result form panics on mismatch. Use `n, ok := v.(int)` to test safely.' },
      ],
    },
    {
      id: 'design',
      title: 'Designing interfaces',
      blocks: [
        { kind: 'analogy', text: "Good Go interfaces are written by the **customer**, not the supplier. The function that needs \"something I can read prices from\" declares a one-method interface for exactly that, and every existing type that happens to fit can be used, including fakes in tests." },
        { kind: 'code', code: `// In the package that USES the dependency:
type PriceSource interface {
    Price(ctx context.Context, sym string) (float64, error)
}

type Strategy struct{ src PriceSource }

func (s *Strategy) Signal(ctx context.Context) (Side, error) {
    px, err := s.src.Price(ctx, "XAU")
    // ...
}

// Production: a real API client with 20 methods satisfies it automatically.
// Tests: a tiny fake.
type fakeSource map[string]float64
func (f fakeSource) Price(_ context.Context, sym string) (float64, error) { return f[sym], nil }

s := &Strategy{src: fakeSource{"XAU": 2390.5}}` },
        { kind: 'list', items: [
          '**"Accept interfaces, return structs."** Take the narrowest interface you need; return concrete types so callers get every method.',
          '**Keep them small.** The bigger the interface, the weaker the abstraction. One- and two-method interfaces are the norm.',
          'Don\'t create an interface until there are two implementations, or a test needs a fake.',
          'Name single-method interfaces after the method plus "-er": `Reader`, `Stringer`, `Pricer`.',
        ] },
        { kind: 'check', q: 'Where should the `PriceSource` interface be declared?', options: ['Next to the API client that implements it', 'In the package that consumes it', 'In a shared `interfaces` package', 'Anywhere: it doesn\'t matter'], answer: 1, hint: 'Who knows which methods are actually needed?', explain: 'Implicit satisfaction lets consumers define the minimal interface they need, with no dependency on the implementer.' },
      ],
    },
  ],
  quiz: [
    { q: 'How does a type satisfy an interface?', options: ['With `implements`', 'By having all of its methods', 'By embedding the interface', 'By registration'], answer: 1, explain: 'Satisfaction is implicit and structural.' },
    { q: 'What does an interface value hold?', options: ['Only a pointer', 'A dynamic type and a dynamic value', 'A vtable only', 'A copy of the interface definition'], answer: 1, explain: 'It is nil only when both are nil.' },
    { q: 'What does `var p *T = nil; var i I = p; i == nil` give?', options: ['true', 'false', 'Compile error', 'Panic'], answer: 1, explain: 'The type part is set, so the interface isn\'t nil.' },
    { q: 'What happens with `x.(T)` when x doesn\'t hold a T?', options: ['Returns the zero value', 'Panics', 'Compile error', 'Returns nil'], answer: 1, explain: 'The comma-ok form `v, ok := x.(T)` doesn\'t panic.' },
    { q: 'Which interface does `fmt` use to print a custom type?', options: ['`fmt.Printer`', '`fmt.Stringer` (`String() string`)', '`io.Writer`', '`encoding.TextMarshaler` only'], answer: 1, explain: '`error` values are printed via `Error()`.' },
    { q: 'What does "accept interfaces, return structs" mean?', options: ['Never return interfaces', 'Take the narrowest behaviour you need; give callers the concrete type', 'Structs must embed interfaces', 'Use any everywhere'], answer: 1, explain: 'It keeps dependencies minimal and APIs flexible.' },
    { q: 'What is `any`?', options: ['A keyword for generics only', 'An alias for `interface{}`', 'A reflect type', 'A deprecated type'], answer: 1, explain: 'Since Go 1.18.' },
    { q: 'What does `var _ io.Writer = (*T)(nil)` do?', options: ['Allocates a T', 'Asserts at compile time that *T satisfies io.Writer', 'Registers T with io', 'Nothing useful'], answer: 1, explain: 'It costs nothing at runtime.' },
  ],
}
