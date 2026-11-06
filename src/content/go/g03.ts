import type { Module } from '../types'

export const g03: Module = {
  n: 3,
  title: 'Basic Data Types',
  tour: '3 · Basic Data Types',
  summary: 'Integers and how they overflow, floating point and complex numbers, booleans, strings as UTF-8 bytes and runes, conversions, and constants including iota.',
  topics: ['Integers', 'Floats & complex', 'Booleans', 'Strings, bytes & runes', 'strconv & builders', 'Constants & iota'],
  cpp23: [
    'Built-in `min`, `max` and `clear` (Go 1.21).',
    'Iterator helpers on strings: `strings.Lines`, `strings.SplitSeq`, `strings.FieldsSeq` (Go 1.24).',
    '`strings.CutLast` / `bytes.CutLast` (Go 1.27) to go with `strings.Cut` (Go 1.18).',
  ],
  lessons: [
    {
      id: 'ints',
      title: 'Integers',
      blocks: [
        { kind: 'analogy', text: "Go's integers are odometers of fixed sizes. An `int8` rolls over after 127 back to -128, like an old car's mileage counter. The roll-over is defined and predictable, never a crash and never undefined. Go also refuses to let you add an `int32` to an `int64` without saying so." },
        { kind: 'code', code: `var a int        // 32 or 64 bits depending on platform (64 on everything modern)
var b int64      // also int8, int16, int32 and unsigned uint8..uint64
var c uint       // unsigned: same size as int
var d byte       // alias for uint8
var r rune       // alias for int32: a Unicode code point
var u uintptr    // pointer-sized, for low-level code only

var x int8 = 127
x++              // -128: wraps, defined behaviour
// var y int64 = a   // compile error: int and int64 are different types
var y int64 = int64(a)

fmt.Println(7 / 2, -7 / 2, 7 % 3, -7 % 3)   // 3 -3 1 -1: division truncates toward zero
fmt.Println(min(3, 1, 2), max(2.5, 1))      // 1 2.5 (built-ins since Go 1.21)` },
        { kind: 'list', items: [
          'There are **no implicit conversions** between numeric types, even `int` → `int64`. Every conversion is visible.',
          'Bit operators: `&`, `|`, `^` (xor, or unary not), `&^` (AND NOT: bit clear), `<<`, `>>`.',
          'Integer division by a variable zero **panics** at runtime. Division by a constant zero doesn\'t compile.',
          'Use `int` for counts and indices. Reach for sized types for binary formats, and `uint` mostly for bit sets.',
        ] },
        { kind: 'pitfall', text: '`len(s) - 1` on an empty slice is `-1`, which is fine because `len` returns `int`. That is exactly why Go uses signed `int` for lengths: an unsigned length would wrap to a huge number, a classic C/C++ bug.' },
        { kind: 'check', q: 'What does this print?', code: `var b uint8 = 250
b += 10
fmt.Println(b)`, options: ['260', '4', 'Panic', 'Compile error'], answer: 1, hint: 'An odometer that only goes up to 255.', explain: '260 mod 256 = 4. Overflow on variables wraps silently in Go. (The constant expression `uint8(250) + 10` would not compile, because constants are checked exactly.)' },
      ],
    },
    {
      id: 'floats',
      title: 'Floats, complex & booleans',
      blocks: [
        { kind: 'analogy', text: "Floating point is a ruler with markings that get further apart the bigger the numbers get. Most values sit between two markings and are rounded to the nearest one, which is why 0.1 + 0.2 lands a hair away from 0.3." },
        { kind: 'code', code: `var f float64 = 0.1 + 0.2
fmt.Println(f == 0.3)                 // false
fmt.Printf("%.17f %g %e\\n", f, f, f)  // 0.30000000000000004 0.30000000000000004 3.000000e-01

z := 1.0 / 0.0                         // compile error: division by constant zero
zero := 0.0
fmt.Println(1/zero, -1/zero, zero/zero)   // +Inf -Inf NaN
math.IsNaN(zero / zero)                // NaN != NaN, so use IsNaN
math.MaxFloat64; math.Inf(1); math.Sqrt2

c := complex(1, 2)                      // complex128
fmt.Println(c*c, real(c), imag(c), cmplx.Abs(c))   // (-3+4i) 1 2 2.236...

ok := price > 0 && qty > 0              // && and || short-circuit
// if qty { }                            // compile error: int is not bool` },
        { kind: 'list', items: [
          'Prefer `float64`. `float32` loses precision fast and is mostly for big arrays such as graphics and ML weights.',
          'For money, use integer minor units (pence, cents, ticks), not floats.',
          'Booleans are not numbers: no `if count {}`, and no adding `true + true`.',
        ] },
        { kind: 'check', q: 'What does `1.0 / zero` give when `zero` is a float64 variable equal to 0?', options: ['Panic', '+Inf', '0', 'NaN'], answer: 1, hint: 'Integer and float division by zero behave differently.', explain: 'Floats follow IEEE 754: positive / 0 is +Inf, and 0/0 is NaN. Only **integer** division by zero panics.' },
      ],
    },
    {
      id: 'strings',
      title: 'Strings, bytes & runes',
      blocks: [
        { kind: 'analogy', text: "A Go string is a sealed envelope of bytes, usually UTF-8 text. `len` counts the bytes in the envelope, not the letters. Some letters, like é or 世, take several bytes. A `rune` is one letter (Unicode code point), and `range` over a string opens the envelope letter by letter." },
        { kind: 'code', code: `s := "héllo, 世界"
fmt.Println(len(s))                    // 14 bytes, not 9 characters
fmt.Println(utf8.RuneCountInString(s)) // 9
fmt.Println(s[0], s[1])                // 104 195: bytes, not characters
fmt.Println(s[:2])                     // "h\\xc3": slicing cuts bytes and can split a rune!

for i, r := range s {                  // range decodes UTF-8: i is a byte offset
    fmt.Printf("%d:%c ", i, r)         // 0:h 1:é 3:l 4:l 5:o 6:, 7:  8:世 11:界
}

b := []byte(s)                         // copy into a mutable byte slice
rs := []rune(s)                        // copy into code points: rs[1] == 'é'
s2 := string(rs[1:3])                  // "él"` },
        { kind: 'list', items: [
          'Strings are **immutable**. `s[0] = \'H\'` doesn\'t compile. Build new strings, or work in a `[]byte`.',
          'Substrings `s[i:j]` share memory with the original, so they are cheap. But a tiny substring keeps the whole big string alive; `strings.Clone` copies it out.',
          'Double-quoted strings process escapes such as `\\n`. Back-quoted **raw strings** don\'t, and can span several lines, which makes them ideal for regular expressions, JSON and file paths.',
          'Packages: `strings` (Contains, Split, Fields, Cut, Builder…), `bytes` (the same for `[]byte`), `unicode`, `unicode/utf8`, `strconv`.',
        ] },
        { kind: 'compare',
          python: `s = "héllo"
len(s)              # 5 characters (code points)
s.encode("utf-8")   # bytes: 6 of them
for ch in s: ...    # characters`,
          ts: `const s = "héllo"
s.length            // 5 (UTF-16 code units!)
new TextEncoder().encode(s).length  // 6 bytes
for (const ch of s) {}              // code points`,
          java: `String s = "héllo";
s.length();          // 5 (UTF-16 units)
s.getBytes(UTF_8).length;           // 6
s.codePoints().forEach(cp -> {});`,
          cpp: `std::string s = "héllo";
s.size();            // 6: bytes, like Go
// no built-in UTF-8 decoding loop`,
          go: `s := "héllo"
len(s)                      // 6 bytes
utf8.RuneCountInString(s)   // 5
for _, r := range s {}      // decodes runes`,
          note: 'Go strings are bytes (like C++), but Go gives you UTF-8 decoding in the language via `range` and `rune`.' },
        { kind: 'check', q: 'What does `len("€")` return in Go?', options: ['1', '2', '3', '4'], answer: 2, hint: 'The euro sign is U+20AC. How many bytes does UTF-8 need above U+07FF?', explain: '`len` counts bytes, and € takes 3 bytes in UTF-8.' },
      ],
    },
    {
      id: 'strconv',
      title: 'Conversions & building strings',
      blocks: [
        { kind: 'analogy', text: "`strconv` is the customs desk between numbers and text: every crossing is explicit and can be refused, returning an error. `strings.Builder` is a notepad you keep writing on, rather than recopying the whole page each time you add a word." },
        { kind: 'code', code: `n, err := strconv.Atoi("42")             // string → int
if err != nil { /* "x" → strconv.ErrSyntax */ }
px, err := strconv.ParseFloat("2390.5", 64)
s := strconv.Itoa(42)                      // int → string
s = strconv.FormatFloat(2390.5, 'f', 2, 64)  // "2390.50"
q := strconv.Quote("hi\\n")                  // "\\"hi\\\\n\\""

// string(65) == "A": converts a code point, NOT "65". go vet warns about this.

var sb strings.Builder
for i := range 3 {
    fmt.Fprintf(&sb, "%d,", i)             // Builder is an io.Writer
}
sb.WriteString("end")
out := sb.String()                         // "0,1,2,end"

base, quote, ok := strings.Cut("XAU/USD", "/")   // "XAU" "USD" true` },
        { kind: 'pitfall', text: '`string(n)` for an integer `n` gives the **character** with that code point, not its decimal digits. `string(65)` is "A". Use `strconv.Itoa(65)` or `fmt.Sprint(65)` for "65".' },
        { kind: 'check', q: 'What is `string(rune(0x4E16))`?', options: ['"19990"', '"世"', '"0x4E16"', 'Compile error'], answer: 1, hint: 'Converting an integer to string reads it as a code point.', explain: 'U+4E16 is 世. For digits, use `strconv`.' },
      ],
    },
    {
      id: 'consts',
      title: 'Constants & iota',
      blocks: [
        { kind: 'analogy', text: "Untyped constants are numbers written in pencil: they have arbitrary precision and no fixed type until you use them, then they take whatever type the context needs. `iota` is a ticket dispenser inside a `const` block: 0, 1, 2… one ticket per line." },
        { kind: 'code', code: `const Pi = 3.14159265358979323846264338327950288   // untyped: exact, high precision
var f32 float32 = Pi        // becomes float32 here
var f64 float64 = Pi        // and float64 here; no conversion needed

const big = 1 << 100        // fine as a constant...
// var n int = big          // ...compile error: overflows int
fmt.Println(big >> 98)      // 4: arithmetic on constants is exact

type Weekday int
const (
    Sunday Weekday = iota    // 0
    Monday                    // 1: the expression repeats with iota incremented
    Tuesday                   // 2
)

type ByteSize float64
const (
    _           = iota        // skip 0
    KB ByteSize = 1 << (10 * iota)   // 1 << 10
    MB                                // 1 << 20
    GB                                // 1 << 30
)

type Flags uint
const (
    FlagUp Flags = 1 << iota  // 1
    FlagBroadcast             // 2
    FlagLoopback              // 4
)` },
        { kind: 'list', items: [
          'Constants are evaluated at compile time and can only be numbers, strings, booleans or runes.',
          'Untyped constants are why `var p Price = 1.5` works without a conversion while `p = someFloat64` doesn\'t.',
          '`iota` resets to 0 in each `const ( ... )` block and increases by one per line.',
        ] },
        { kind: 'check', q: 'What is `Tuesday` here?', code: `const (
    _ = iota
    Monday
    Tuesday
)`, options: ['1', '2', '3', '0'], answer: 1, hint: 'iota counts lines in the block, starting at 0, including the skipped one.', explain: '`_` takes 0, Monday 1, Tuesday 2.' },
      ],
    },
  ],
  quiz: [
    { q: 'What happens when `int8(127)` (a variable) is incremented?', options: ['Panic', 'It becomes -128 (wraps)', 'Undefined behaviour', 'Compile error'], answer: 1, explain: 'Go defines overflow as wrapping for both signed and unsigned types.' },
    { q: 'Can you assign an `int` variable to an `int64` without conversion?', options: ['Yes, it widens', 'No: explicit conversion is required', 'Only on 64-bit platforms', 'Only with untyped constants'], answer: 1, explain: 'There are no implicit numeric conversions between named types.' },
    { q: 'What is `len("héllo")`?', options: ['5', '6', '10', '12'], answer: 1, explain: 'é takes 2 bytes in UTF-8.' },
    { q: 'What does `for i, r := range s` give you?', options: ['Each byte', 'Byte offsets and decoded runes', 'Character indices and bytes', 'Lines'], answer: 1, explain: 'The index jumps by each rune\'s byte length.' },
    { q: 'What is `string(65)`?', options: ['"65"', '"A"', 'Compile error', '"6"'], answer: 1, explain: 'It converts the code point; use `strconv.Itoa` for digits.' },
    { q: 'Integer division by a zero variable…', options: ['returns 0', 'returns +Inf', 'panics at runtime', 'is undefined'], answer: 2, explain: 'Float division gives ±Inf or NaN; integer division panics.' },
    { q: 'What is special about untyped constants?', options: ['They are slower', 'Arbitrary precision; they take a type from the context they are used in', 'They live on the heap', 'They can hold structs'], answer: 1, explain: 'That is why `1 << 100` is a legal constant.' },
    { q: 'Efficient way to build a long string in a loop?', options: ['`s += piece`', '`strings.Builder`', '`fmt.Sprint` each time', 'A `[]rune`'], answer: 1, explain: '`+=` copies the whole string every time.' },
  ],
}
