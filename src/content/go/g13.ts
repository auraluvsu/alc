import type { Module } from '../types'

export const g13: Module = {
  n: 13,
  title: 'Low-Level Programming',
  tour: '13 · Low-Level Programming',
  summary: 'Memory layout, size and alignment, struct padding, unsafe.Pointer and its rules, zero-copy conversions, calling C with cgo, and SIMD.',
  topics: ['Sizes & alignment', 'Struct padding', 'unsafe.Pointer', 'Zero-copy conversions', 'cgo', 'SIMD & cautions'],
  cpp23: [
    '`unsafe.Slice`, `unsafe.SliceData`, `unsafe.String`, `unsafe.StringData` (Go 1.17–1.20) replace `reflect.SliceHeader` tricks.',
    'Experimental `simd` and `simd/archsimd` packages behind `GOEXPERIMENT=simd` (Go 1.26–1.27).',
  ],
  lessons: [
    {
      id: 'layout',
      title: 'Sizes, alignment & padding',
      blocks: [
        { kind: 'analogy', text: "Memory is a car park whose spaces are numbered in bytes, and some vehicles may only park at spaces divisible by their length: an 8-byte float64 must start on a multiple of 8. Park a 1-byte bool, then an 8-byte float, and the 7 spaces between are wasted (padding). Reordering the vehicles reclaims them." },
        { kind: 'code', code: `type Bad struct {
    Active bool      // 1 byte + 7 bytes padding
    Price  float64   // 8
    Flag   bool      // 1 byte + 7 bytes padding (struct size rounds up to alignment 8)
}                    // unsafe.Sizeof == 24

type Good struct {
    Price  float64   // 8
    Active bool      // 1
    Flag   bool      // 1 + 6 padding
}                    // unsafe.Sizeof == 16

fmt.Println(unsafe.Sizeof(Bad{}), unsafe.Sizeof(Good{}))   // 24 16
fmt.Println(unsafe.Alignof(Good{}.Price))                  // 8
fmt.Println(unsafe.Offsetof(Good{}.Active))                // 8

unsafe.Sizeof("")          // 16: a string header (pointer + length)
unsafe.Sizeof([]int{})     // 24: a slice header (pointer + len + cap)
unsafe.Sizeof(any(nil))    // 16: an interface (type word + data word)` },
        { kind: 'list', items: [
          '`Sizeof`, `Alignof` and `Offsetof` are evaluated at compile time and are safe to use; nothing "unsafe" happens.',
          'Ordering fields largest-first usually minimises padding. It matters for millions of elements in a slice (tick data, order books), not for one-off structs.',
          'The `fieldalignment` analyser (from x/tools) reports structs that could shrink.',
        ] },
        { kind: 'check', q: 'Why is `Bad` 24 bytes but `Good` only 16?', options: ['bools are 8 bytes in Bad', 'Padding inserted to keep float64 8-byte aligned, which field order changes', 'The compiler is inconsistent', 'Good uses bit-packing'], answer: 1, hint: 'Where do the wasted spaces fall?', explain: 'Go doesn\'t reorder fields for you, so field order decides where padding goes.' },
      ],
    },
    {
      id: 'unsafe',
      title: 'unsafe.Pointer',
      blocks: [
        { kind: 'analogy', text: "`unsafe.Pointer` is a master key that opens any door regardless of the sign on it. With it you can treat a float64's bytes as a uint64, or walk to a field by its offset. The garbage collector and the type system both trust you completely, so if you are wrong, nothing warns you." },
        { kind: 'code', code: `// Reinterpret bits (math.Float64bits does exactly this, safely)
f := 1.5
bits := *(*uint64)(unsafe.Pointer(&f))
fmt.Printf("%#016x\\n", bits)            // 0x3ff8000000000000

// Zero-copy []byte ↔ string (Go 1.20+): only if the bytes are never modified afterwards
b := []byte("XAUUSD")
s := unsafe.String(unsafe.SliceData(b), len(b))   // no allocation
bb := unsafe.Slice(unsafe.StringData(s), len(s))  // never write to bb!

// Pointer arithmetic: legal only as ONE expression
type Tick struct{ Bid, Ask float64 }
t := Tick{1, 2}
askPtr := (*float64)(unsafe.Add(unsafe.Pointer(&t), unsafe.Offsetof(t.Ask)))
*askPtr = 2.5` },
        { kind: 'list', items: [
          'The `unsafe` package documentation lists the **only** valid conversion patterns. Anything else is invalid even if it seems to work.',
          'Never store a `uintptr` and convert it back later: the GC doesn\'t treat a `uintptr` as a reference, and the object may move or be freed.',
          'Modifying memory behind a string made with `unsafe.String` breaks the immutability every other piece of code relies on.',
          'Prefer safe equivalents: `math.Float64bits`, `encoding/binary`, `strings.Builder`.',
        ] },
        { kind: 'pitfall', text: 'Code using `unsafe` may break with a new Go release or architecture, which is why the package is outside the Go 1 compatibility promise. Isolate it in one small, well-tested file.' },
        { kind: 'check', q: 'Why is `p := uintptr(unsafe.Pointer(&x)); ...; q := (*int)(unsafe.Pointer(p))` across statements unsafe?', options: ['It doesn\'t compile', 'A uintptr is just a number; the GC may move or free x between the statements', 'uintptr is too small', 'It is always fine'], answer: 1, hint: 'Does the GC know that number refers to x?', explain: 'Conversions through uintptr must happen within a single expression so the object stays alive and in place.' },
      ],
    },
    {
      id: 'cgo',
      title: 'Calling C with cgo',
      blocks: [
        { kind: 'analogy', text: "cgo is an embassy between two countries with different laws. Goods (data) can cross, but every crossing involves paperwork (copying and conversions) and a fee (~tens of nanoseconds per call). Things that are legal in Go, like moving memory around, aren't understood on the C side, so strict rules govern what may cross." },
        { kind: 'code', code: `package main

/*
#cgo LDFLAGS: -lm
#include <math.h>
#include <stdlib.h>

static double scale(double x, double k) { return x * k; }
*/
import "C"                                  // must follow the preamble directly
import (
    "fmt"
    "unsafe"
)

func main() {
    fmt.Println(float64(C.sqrt(2)))         // call libm
    fmt.Println(float64(C.scale(1.5, 2)))   // call C from the preamble

    cs := C.CString("XAUUSD")               // malloc'd C copy of a Go string
    defer C.free(unsafe.Pointer(cs))        // C memory: YOU must free it
    _ = cs
}` },
        { kind: 'list', items: [
          'Costs: slower builds, no easy cross-compilation (you need a C toolchain for the target), and per-call overhead. Batch work into fewer, bigger calls.',
          'C must not keep Go pointers after a call returns (the cgo pointer-passing rules). `runtime.Pinner` helps in the rare cases where it must.',
          'C++ libraries are reached through an `extern "C"` wrapper.',
          'A pure-Go alternative is often better. Many Go projects deliberately keep `CGO_ENABLED=0` for static, portable binaries.',
        ] },
        { kind: 'check', q: 'Who frees memory returned by `C.CString`?', options: ['The Go GC', 'You, with `C.free`', 'C automatically', 'Nobody: it is on the stack'], answer: 1, hint: 'Which side of the embassy allocated it?', explain: 'It is allocated with C malloc, which the Go GC doesn\'t manage. `defer C.free(...)` right away.' },
      ],
    },
    {
      id: 'simd',
      title: 'SIMD & when to go low-level',
      blocks: [
        { kind: 'analogy', text: "SIMD is a stamping press that stamps eight coins at once instead of one. Go has historically relied on the compiler and hand-written assembly for this. The new experimental `simd` package lets ordinary Go code ask for wide operations directly." },
        { kind: 'list', items: [
          '`GOEXPERIMENT=simd` enables `simd/archsimd` (architecture-specific: amd64 since 1.26; arm64 and wasm added in 1.27) and, in Go 1.27, a portable vector-size-agnostic `simd` package. The APIs are **not yet stable**.',
          'Before reaching for unsafe, cgo or SIMD: profile (`pprof`), remove allocations, fix data layout (slices of structs vs struct of slices), and let the compiler do bounds-check elimination.',
          'Go\'s assembler (Plan 9 syntax, `.s` files) is how the standard library speeds up crypto and `math/big`. It is rarely worth it in application code.',
        ] },
        { kind: 'code', code: `// Usually the first big win: memory layout, not intrinsics.
// "Array of structs" — each loop touches 32 bytes per tick to read 8
type Tick struct{ Ts int64; Bid, Ask float64; Vol int64 }
var ticks []Tick

// "Struct of arrays" — a loop over bids reads one contiguous, cache-friendly slice
type Ticks struct {
    Ts       []int64
    Bid, Ask []float64
    Vol      []int64
}

func meanBid(t *Ticks) float64 {
    s := 0.0
    for _, b := range t.Bid { s += b }   // the compiler can vectorise simple loops like this
    return s / float64(len(t.Bid))
}` },
        { kind: 'check', q: 'Before writing unsafe or SIMD code for speed, what should you do first?', options: ['Rewrite in C', 'Profile, then cut allocations and improve data layout', 'Increase GOMAXPROCS', 'Disable the GC'], answer: 1, hint: 'Measure first.', explain: 'Most Go performance wins come from fewer allocations and cache-friendly layout, which `pprof` will point you to.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does `unsafe.Sizeof` evaluate?', options: ['The size at runtime including referenced data', 'The compile-time size of the value\'s type (not what it points to)', 'Heap usage', 'Stack usage'], answer: 1, explain: 'A slice is 24 bytes however many elements it has.' },
    { q: 'Why can field order change a struct\'s size?', options: ['Compression', 'Alignment padding between and after fields', 'GC headers', 'It can\'t'], answer: 1, explain: 'Go keeps declared order and pads to satisfy alignment.' },
    { q: 'What is `unsafe.Sizeof("")` on a 64-bit platform?', options: ['0', '8', '16', '24'], answer: 2, explain: 'A string header is a pointer plus a length.' },
    { q: 'Safe standard way to get a float64\'s bits?', options: ['`*(*uint64)(unsafe.Pointer(&f))`', '`math.Float64bits(f)`', '`uint64(f)`', '`reflect.Bits(f)`'], answer: 1, explain: '`uint64(f)` converts the value (1.5 → 1), not the bits.' },
    { q: 'What may a `uintptr` NOT be used for?', options: ['Printing an address', 'Storing a pointer to convert back later', 'Arithmetic in one expression', 'Comparisons'], answer: 1, explain: 'The GC doesn\'t track uintptrs.' },
    { q: 'What does `import "C"` require?', options: ['A go.mod flag', 'cgo with a C toolchain; the preamble comment must directly precede the import', 'Nothing special', 'A C++ compiler'], answer: 1, explain: 'It also complicates cross-compiling.' },
    { q: 'Who frees `C.CString` results?', options: ['The Go GC', 'You, with C.free', 'They are stack-allocated', 'C\'s GC'], answer: 1, explain: 'Pair every allocation with a defer.' },
    { q: 'What is the status of Go\'s `simd` packages in Go 1.27?', options: ['Stable', 'Experimental, behind GOEXPERIMENT=simd', 'Removed', 'cgo-only'], answer: 1, explain: 'The API may change.' },
  ],
}
