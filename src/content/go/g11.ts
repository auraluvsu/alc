import type { Module } from '../types'

export const g11: Module = {
  n: 11,
  title: 'Testing',
  tour: '11 · Testing',
  summary: 'The go test tool, table-driven tests and subtests, test helpers and fakes, coverage, benchmarks, example functions and fuzzing.',
  topics: ['go test', 'Table-driven tests', 'Helpers, fakes & httptest', 'Coverage', 'Benchmarks', 'Examples & fuzzing'],
  cpp23: [
    'Subtests with `t.Run` and `t.Parallel` (Go 1.7+).',
    'Native fuzzing with `FuzzXxx` (Go 1.18).',
    '`b.Loop()` for benchmarks and `t.Context()` (Go 1.24).',
    '`testing/synctest` (Go 1.25) and `T.ArtifactDir` (Go 1.26).',
  ],
  lessons: [
    {
      id: 'basics',
      title: 'go test',
      blocks: [
        { kind: 'analogy', text: "Go's test framework is a measuring tape that ships in the same toolbox as the saw. There is nothing to install: files ending in `_test.go` sit next to the code they test, functions named `TestXxx` are found automatically, and `go test` runs them." },
        { kind: 'code', code: `// file: pricing/pricing_test.go
package pricing

import "testing"

func TestCallAtTheMoney(t *testing.T) {
    got := Call(100, 100, 1, 0, 0.2)
    want := 7.9656
    if math.Abs(got-want) > 1e-4 {
        t.Errorf("Call(100,100,1,0,0.2) = %.4f, want %.4f", got, want)   // record failure, keep going
    }
}

func TestRequiresPositiveVol(t *testing.T) {
    if _, err := Price(Params{Sigma: -1}); err == nil {
        t.Fatal("expected error for negative sigma")                       // stop this test now
    }
}

// go test ./...             all packages
// go test -run CallAt -v    filter by name, verbose
// go test -count=1          bypass the result cache` },
        { kind: 'list', items: [
          '`t.Errorf` marks failure and continues; `t.Fatalf` stops the current test. Use Fatal when continuing makes no sense.',
          'There is no assertion library in the standard toolkit. Plain `if` plus a message stating **got** and **want** is the idiom.',
          'A test file in `package pricing` sees unexported names. Use `package pricing_test` to test only the public API, as an outside user would.',
        ] },
        { kind: 'compare',
          python: `def test_call_atm():
    assert abs(call(100, 100, 1, 0, .2) - 7.9656) < 1e-4
# pytest discovers test_* functions`,
          ts: `test("call at the money", () => {
  expect(call(100, 100, 1, 0, 0.2)).toBeCloseTo(7.9656, 4)
})   // vitest / jest`,
          java: `@Test
void callAtTheMoney() {
    assertEquals(7.9656, call(100, 100, 1, 0, 0.2), 1e-4);
}   // JUnit 5`,
          cpp: `TEST(Pricing, CallAtTheMoney) {
    EXPECT_NEAR(call(100, 100, 1, 0, 0.2), 7.9656, 1e-4);
}   // GoogleTest`,
          go: `func TestCallAtTheMoney(t *testing.T) {
    if got := Call(100, 100, 1, 0, 0.2); math.Abs(got-7.9656) > 1e-4 {
        t.Errorf("got %.4f, want 7.9656", got)
    }
}`,
          note: 'Go favours plain code over a matcher vocabulary; libraries like testify exist if you want assertions.' },
        { kind: 'check', q: 'What is the difference between `t.Error` and `t.Fatal`?', options: ['None', 'Error records failure and continues; Fatal records failure and stops the test', 'Fatal exits the whole process', 'Error is for warnings only'], answer: 1, hint: 'Should the test keep going after this check?', explain: 'Fatal stops only the current test (or subtest), not the whole run.' },
      ],
    },
    {
      id: 'tables',
      title: 'Table-driven tests & subtests',
      blocks: [
        { kind: 'analogy', text: "A table-driven test is a marking sheet: one row per case (input and expected answer) and one loop that marks every row. Adding a case means adding a line, not copying a test function, and `t.Run` gives each row its own name in the results." },
        { kind: 'code', code: `func TestParseSide(t *testing.T) {
    tests := []struct {
        name    string
        in      string
        want    Side
        wantErr bool
    }{
        {"buy", "BUY", Buy, false},
        {"lowercase", "sell", Sell, false},
        {"empty", "", 0, true},
        {"junk", "hold", 0, true},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel()                                    // rows run concurrently
            got, err := ParseSide(tt.in)
            if (err != nil) != tt.wantErr {
                t.Fatalf("ParseSide(%q) error = %v, wantErr %v", tt.in, err, tt.wantErr)
            }
            if got != tt.want {
                t.Errorf("ParseSide(%q) = %v, want %v", tt.in, got, tt.want)
            }
        })
    }
}
// go test -run 'TestParseSide/lowercase'   run one row` },
        { kind: 'p', text: 'Before Go 1.22, `t.Parallel()` in this loop was a famous bug: every subtest saw the last row unless you wrote `tt := tt`. Per-iteration loop variables made that line unnecessary, though you will still see it in older code.' },
        { kind: 'check', q: 'What does `t.Run(name, f)` give you over a plain loop?', options: ['Faster execution', 'Named subtests that can be run, filtered and reported individually', 'Automatic retries', 'Mocking'], answer: 1, hint: 'Look at the `-run` example.', explain: 'Each subtest gets its own pass/fail line and can be selected with `-run Parent/child`.' },
      ],
    },
    {
      id: 'helpers',
      title: 'Helpers, fakes & HTTP tests',
      blocks: [
        { kind: 'analogy', text: "Testing code with dependencies is like rehearsing a play with stand-ins. You swap the real exchange connection for an actor who reads from a script (a fake that satisfies the same small interface), so the rehearsal is fast, repeatable and never touches real money." },
        { kind: 'code', code: `func mustDecimal(t *testing.T, s string) decimal.Decimal {
    t.Helper()                                 // failures point at the CALLER's line
    d, err := decimal.NewFromString(s)
    if err != nil { t.Fatal(err) }
    return d
}

type fakeFeed struct{ px map[string]float64 }
func (f fakeFeed) Price(_ context.Context, s string) (float64, error) { return f.px[s], nil }

func TestStrategyBuysDip(t *testing.T) {
    s := NewStrategy(fakeFeed{px: map[string]float64{"XAU": 2300}})
    if got := s.Signal(t.Context()); got != Buy {   // t.Context: cancelled at test end (Go 1.24)
        t.Errorf("Signal = %v, want Buy", got)
    }
    dir := t.TempDir()                              // auto-cleaned temp directory
    _ = dir
}

func TestPriceHandler(t *testing.T) {
    req := httptest.NewRequest("GET", "/prices/XAU", nil)
    rec := httptest.NewRecorder()
    newMux().ServeHTTP(rec, req)                    // no network needed
    if rec.Code != http.StatusOK { t.Fatalf("status %d", rec.Code) }
}` },
        { kind: 'list', items: [
          'Small consumer-side interfaces (module 7) are what make fakes trivial. No mocking framework is required.',
          '`t.Cleanup(f)` registers teardown; `t.Setenv` sets an env var for one test only.',
          '`testdata/` folders hold fixtures; golden files compare output against a stored "known good" file.',
        ] },
        { kind: 'check', q: 'What does `t.Helper()` change?', options: ['It makes the function run in parallel', 'Failure messages report the caller\'s line instead of the helper\'s', 'It skips the test', 'It retries on failure'], answer: 1, hint: 'Where do you want the error to point?', explain: 'Without it, every failure would point inside the helper, which is useless in a table test.' },
      ],
    },
    {
      id: 'bench',
      title: 'Coverage & benchmarks',
      blocks: [
        { kind: 'analogy', text: "Coverage is a highlighter run over your code by the tests: the unhighlighted lines are the ones no test ever executed. A benchmark is a stopwatch that runs a function thousands of times so the timing is statistically meaningful rather than a single lucky lap." },
        { kind: 'code', code: `// go test -cover ./...                       percentage per package
// go test -coverprofile=c.out && go tool cover -html=c.out   highlighted source

func BenchmarkParseTick(b *testing.B) {
    line := []byte("XAUUSD,2390.50,2390.70,1730812800")
    b.ReportAllocs()
    for b.Loop() {                               // Go 1.24: manages b.N and timing for you
        ParseTick(line)
    }
}

// go test -bench=ParseTick -benchmem
// BenchmarkParseTick-8   21304512   56.2 ns/op   0 B/op   0 allocs/op
//
// Compare two versions statistically:
// go test -bench=. -count=10 > old.txt   (change code)   ... > new.txt
// benchstat old.txt new.txt` },
        { kind: 'list', items: [
          'Coverage measures what ran, not what was checked. 100% coverage with weak assertions proves little.',
          '`b.Loop()` (Go 1.24) also stops the compiler optimising away the call under test, a classic benchmark pitfall with the old `for i := 0; i < b.N; i++`.',
          '`allocs/op` is often the number to watch in Go hot paths: fewer allocations means less GC work.',
          'Profile with `-cpuprofile` / `-memprofile` and `go tool pprof` to find out *why*.',
        ] },
        { kind: 'check', q: 'What does "0 allocs/op" in benchmark output tell you?', options: ['The function uses no memory', 'The function made no heap allocations per call', 'The benchmark failed', 'GC is disabled'], answer: 1, hint: 'Stack use isn\'t counted.', explain: 'Heap allocations create GC pressure; zero per call is a good sign in hot code.' },
      ],
    },
    {
      id: 'examples',
      title: 'Examples & fuzzing',
      blocks: [
        { kind: 'analogy', text: "An Example function is documentation that grades itself: it appears on pkg.go.dev as usage and fails the test run if its printed output ever changes. A fuzz test is a monkey at a typewriter, feeding your parser millions of mutated inputs looking for the one that crashes it." },
        { kind: 'code', code: `func ExampleCall() {
    fmt.Printf("%.2f\\n", pricing.Call(100, 100, 1, 0, 0.2))
    // Output: 7.97
}

func FuzzParseTick(f *testing.F) {
    f.Add([]byte("XAUUSD,2390.50,2390.70,1730812800"))   // seed corpus
    f.Fuzz(func(t *testing.T, data []byte) {
        tick, err := ParseTick(data)
        if err != nil { return }                         // invalid input is fine...
        if tick.Bid > tick.Ask {                         // ...but valid output must be sane
            t.Errorf("bid %v > ask %v for %q", tick.Bid, tick.Ask, data)
        }
    })
}
// go test -fuzz=FuzzParseTick -fuzztime=30s
// failing inputs are saved to testdata/fuzz/ and become regression tests` },
        { kind: 'list', items: [
          'Examples without an `// Output:` comment are compiled but not run.',
          'Fuzzing finds panics, infinite loops and broken invariants in parsers and decoders: exactly the code that handles untrusted market data.',
          '`testing/synctest` (Go 1.25) tests time- and goroutine-heavy code with a fake clock.',
        ] },
        { kind: 'check', q: 'When does an Example function fail?', options: ['Never: it is documentation', 'When its printed output doesn\'t match its `// Output:` comment', 'When it panics only', 'When coverage drops'], answer: 1, hint: 'It grades itself.', explain: 'go test runs examples that have an Output comment and compares stdout exactly.' },
      ],
    },
  ],
  quiz: [
    { q: 'How are test functions discovered?', options: ['Registered in main', 'Functions named `TestXxx(t *testing.T)` in `_test.go` files', 'Annotated with @test', 'Listed in go.mod'], answer: 1, explain: 'There is no configuration.' },
    { q: 'What is a table-driven test?', options: ['A test reading a CSV', 'A slice of cases looped over with one test body', 'A database test', 'A benchmark'], answer: 1, explain: 'Combine with `t.Run` for named subtests.' },
    { q: 'What is `package foo_test` used for?', options: ['Benchmarks only', 'Black-box tests that only see foo\'s exported API', 'Generated tests', 'Integration tests only'], answer: 1, explain: 'It lives in the same directory as a separate package.' },
    { q: 'What does `go test -cover` report?', options: ['Bugs found', 'The percentage of statements executed by tests', 'Benchmarks', 'Races'], answer: 1, explain: 'Use `-coverprofile` for the line-by-line view.' },
    { q: 'What is the modern benchmark loop (Go 1.24)?', options: ['`for i := 0; i < b.N; i++`', '`for b.Loop()`', '`b.Run(f)`', '`b.Repeat(n)`'], answer: 1, explain: 'It also prevents dead-code elimination of the call.' },
    { q: 'What does `-benchmem` add?', options: ['Memory limits', 'Bytes and allocations per operation', 'GC traces', 'Heap dumps'], answer: 1, explain: '`b.ReportAllocs()` does the same per benchmark.' },
    { q: 'Where are failing fuzz inputs saved?', options: ['/tmp', '`testdata/fuzz/<FuzzName>/`', 'go.sum', 'They aren\'t saved'], answer: 1, explain: 'They become permanent regression cases.' },
    { q: 'Why define small interfaces for dependencies?', options: ['Faster compiles', 'Tests can pass simple fakes without a mocking framework', 'Required by go test', 'Reflection needs them'], answer: 1, explain: 'This is consumer-side interface design (module 7).' },
  ],
}
