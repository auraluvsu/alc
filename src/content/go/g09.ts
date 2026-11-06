import type { Module } from '../types'

export const g09: Module = {
  n: 9,
  title: 'Concurrency with Shared Variables',
  tour: '9 · Concurrency with Shared Variables',
  summary: 'Race conditions and how to avoid them, mutexes and read/write locks, atomics, memory synchronisation, lazy initialisation with sync.Once, the race detector, and how goroutines differ from threads.',
  topics: ['Race conditions', 'sync.Mutex & RWMutex', 'Atomics', 'sync.Once & lazy init', 'The race detector', 'Goroutines vs threads'],
  cpp23: [
    'Typed atomics: `atomic.Int64`, `atomic.Bool`, `atomic.Pointer[T]` (Go 1.19).',
    '`sync.OnceFunc`, `OnceValue`, `OnceValues` (Go 1.21).',
    '`testing/synctest` for deterministic tests of concurrent code (Go 1.25).',
    'GOMAXPROCS respects container CPU limits (Go 1.25).',
  ],
  lessons: [
    {
      id: 'races',
      title: 'Race conditions',
      blocks: [
        { kind: 'analogy', text: "A data race is two people editing the same line of a shared document at the same instant without talking. Each reads \"balance: 100\", each adds their deposit, each writes back, and one deposit vanishes. Nothing crashed, and the numbers are just wrong, intermittently." },
        { kind: 'stepper', title: 'Step through: a lost deposit', code: [
          'var balance int',
          'func Deposit(x int) { balance = balance + x }',
          '// goroutine A: Deposit(200)   goroutine B: Deposit(100)',
          'A reads balance (0)',
          'B reads balance (0)',
          'A writes 0 + 200',
          'B writes 0 + 100',
        ], steps: [
          { line: 2, note: '`balance = balance + x` is a read, then an add, then a write. Another goroutine can run between them.', memory: [{ name: 'balance', value: '0' }] },
          { line: 4, note: 'A reads 0.', memory: [{ name: 'balance', value: '0' }, { name: 'A sees', value: '0' }] },
          { line: 5, note: 'B also reads 0, before A writes.', memory: [{ name: 'balance', value: '0' }, { name: 'A sees', value: '0' }, { name: 'B sees', value: '0' }] },
          { line: 6, note: 'A writes 200.', memory: [{ name: 'balance', value: '200' }, { name: 'B sees', value: '0' }] },
          { line: 7, note: 'B writes 100, overwriting A\'s deposit. Expected 300, got 100.', memory: [{ name: 'balance', value: '100', note: '200 lost' }] },
        ] },
        { kind: 'p', text: 'There are three ways to avoid a data race, in rough order of preference:' },
        { kind: 'list', items: [
          '**Don\'t write**: initialise data before starting goroutines, then only read it.',
          '**Don\'t share**: confine a variable to one goroutine and talk to it through channels. ("Don\'t communicate by sharing memory; share memory by communicating.")',
          '**Share with mutual exclusion**: a mutex, so only one goroutine touches the data at a time.',
        ] },
        { kind: 'pitfall', text: 'Concurrent writes to a Go **map** aren\'t just wrong, they **crash** the program with "fatal error: concurrent map writes", and that can\'t be recovered. Protect maps with a mutex or use `sync.Map` for its narrow use cases.' },
        { kind: 'check', q: 'Which approach avoids races without any locking?', options: ['Using a bigger buffer', 'Confining the variable to one goroutine and communicating via channels', 'Using `volatile`', 'Increasing GOMAXPROCS'], answer: 1, hint: 'One owner, messages instead of shared edits.', explain: 'A "monitor" goroutine owns the state; others send it requests over channels.' },
      ],
    },
    {
      id: 'mutex',
      title: 'Mutexes',
      blocks: [
        { kind: 'analogy', text: "A mutex is the single key to a meeting room. Take the key, use the room, hang the key back up, and the next person waits by the door until then. `defer mu.Unlock()` is a rule that the key goes back on its hook whenever you leave, however you leave." },
        { kind: 'code', code: `type Account struct {
    mu      sync.Mutex      // guards balance
    balance int
}

func (a *Account) Deposit(x int) {
    a.mu.Lock()
    defer a.mu.Unlock()
    a.balance += x
}

func (a *Account) Withdraw(x int) bool {
    a.mu.Lock()
    defer a.mu.Unlock()
    if a.balance < x { return false }
    a.balance -= x             // check-and-act inside ONE critical section
    return true
}

// Many readers, occasional writers
type Prices struct {
    mu sync.RWMutex
    m  map[string]float64
}
func (p *Prices) Get(s string) float64 { p.mu.RLock(); defer p.mu.RUnlock(); return p.m[s] }
func (p *Prices) Set(s string, v float64) { p.mu.Lock(); defer p.mu.Unlock(); p.m[s] = v }` },
        { kind: 'list', items: [
          'Go mutexes are **not reentrant**: calling `Lock` again in the same goroutine deadlocks. Split code into a locked exported method and an unlocked internal helper.',
          'Never copy a struct containing a mutex after first use. Use pointer receivers; `go vet` flags copies.',
          '`RWMutex` only pays off with many concurrent readers and little contention. A plain `Mutex` is often faster.',
          'Document which fields each mutex guards, and keep the lock next to them.',
        ] },
        { kind: 'pitfall', text: 'Checking under one lock and acting under another (`if a.Balance() >= x { a.Withdraw(x) }`) is still a race: another goroutine can drain the account between the two calls. The check and the action must share one critical section.' },
        { kind: 'check', q: 'What happens if a method that holds `mu` calls another method that also does `mu.Lock()`?', options: ['It works: locks are reentrant', 'Deadlock', 'Panic', 'The second Lock is ignored'], answer: 1, hint: 'Is the key already in your pocket?', explain: 'Go mutexes aren\'t reentrant, so the goroutine waits for itself forever.' },
      ],
    },
    {
      id: 'atomics',
      title: 'Atomics & memory synchronisation',
      blocks: [
        { kind: 'analogy', text: "Each CPU core keeps its own notepad (cache) and may jot things down in a different order than you wrote them. Synchronisation (a mutex, a channel operation, an atomic) is a meeting where everyone compares notepads. Without one, another goroutine may never see your write, or may see your writes out of order." },
        { kind: 'code', code: `var requests atomic.Int64          // typed atomics (Go 1.19)
requests.Add(1)
n := requests.Load()

var ready atomic.Bool
var cfg atomic.Pointer[Config]
cfg.Store(loadConfig())              // swap a whole config atomically
c := cfg.Load()

// WRONG: no synchronisation, so main may spin forever or see a stale msg
var done bool
var msg string
go func() { msg = "hi"; done = true }()
for !done {}                         // data race: undefined results

// RIGHT: a channel (or atomic.Bool) creates a happens-before edge
ch := make(chan struct{})
go func() { msg = "hi"; close(ch) }()
<-ch
fmt.Println(msg)                     // guaranteed "hi"` },
        { kind: 'list', items: [
          'Atomics suit single values: counters, flags, pointer swaps. For anything involving two related fields, use a mutex.',
          'Go\'s memory model: a send happens-before the corresponding receive completes; `Unlock` happens-before the next `Lock`; a close happens-before a receive that sees it.',
          'Go atomics are sequentially consistent, which is simpler than C++\'s menu of memory orders.',
        ] },
        { kind: 'check', q: 'Why is `for !done {}` (with done set by another goroutine) broken?', options: ['It is too slow', 'It is a data race: with no synchronisation the loop may never see the write', 'Booleans can\'t be shared', 'It isn\'t broken'], answer: 1, hint: 'Did anyone call a meeting to compare notepads?', explain: 'Use `atomic.Bool`, a channel or a mutex to establish happens-before.' },
      ],
    },
    {
      id: 'once',
      title: 'sync.Once & the race detector',
      blocks: [
        { kind: 'analogy', text: "`sync.Once` is a single-use pull cord: the first goroutine to pull it runs the setup, and everyone who arrives at the same time waits until it's done, then gets the finished result. The race detector is a CCTV system you switch on during testing that flags every unsynchronised access it sees." },
        { kind: 'code', code: `// Lazy, concurrency-safe initialisation
var icons = sync.OnceValue(func() map[string]image.Image {   // Go 1.21
    return loadIcons()                   // runs exactly once, on first call
})
img := icons()["gold"]

var loadDB = sync.OnceValues(func() (*sql.DB, error) {
    return sql.Open("postgres", dsn)
})
db, err := loadDB()

// Find races: build with the detector during tests and dev runs
//   go test -race ./...
//   go run -race .
// WARNING: DATA RACE
// Write at 0x00c0000a4010 by goroutine 7: main.Deposit() bank.go:12
// Previous read at 0x00c0000a4010 by goroutine 6: main.Balance() bank.go:16` },
        { kind: 'list', items: [
          'The race detector only reports races that actually happen in that run, so exercise concurrent paths in tests.',
          'Expect 2–10× slowdown and extra memory; use it in CI, not production.',
          '`testing/synctest` (Go 1.25) runs goroutines in a "bubble" with a fake clock, so time-based concurrent code can be tested deterministically.',
        ] },
        { kind: 'h', text: 'Goroutines vs OS threads' },
        { kind: 'list', items: [
          '**Stacks**: threads get a fixed stack (often 1–8 MB); goroutines start at ~2 KB and grow.',
          '**Scheduling**: the Go runtime schedules M goroutines onto N threads (`GOMAXPROCS`) without kernel context switches for most hand-offs.',
          '**No identity**: there is no goroutine ID or thread-local storage, by design. Pass what you need (often a `context`) explicitly.',
        ] },
        { kind: 'check', q: 'Does `go test -race` passing prove your code is race-free?', options: ['Yes', 'No: it only detects races that occur during that execution', 'Only with -count=100', 'Only on Linux'], answer: 1, hint: 'CCTV only records what happens in front of it.', explain: 'It has no false positives, but it can miss races on paths the test never runs concurrently.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is a data race?', options: ['Two goroutines reading a variable', 'Concurrent access to a variable where at least one is a write, without synchronisation', 'A slow channel', 'A deadlock'], answer: 1, explain: 'Reads alone are safe.' },
    { q: 'Are Go mutexes reentrant?', options: ['Yes', 'No', 'Only RWMutex', 'Only with defer'], answer: 1, explain: 'Locking twice from the same goroutine deadlocks.' },
    { q: 'What happens with concurrent writes to a plain map?', options: ['Last write wins', 'Can crash the program with a fatal error', 'Silently corrupt only that key', 'Compile error'], answer: 1, explain: 'The runtime detects them and aborts.' },
    { q: 'Best tool for a simple shared counter?', options: ['A plain int', '`atomic.Int64`', 'A buffered channel', '`sync.Once`'], answer: 1, explain: 'A mutex also works; an atomic is lighter for one value.' },
    { q: 'What does `sync.OnceValue(f)` return?', options: ['f\'s result immediately', 'A function that calls f once and caches its result', 'A channel', 'A mutex'], answer: 1, explain: 'It is safe to call from many goroutines.' },
    { q: 'How do you enable the race detector?', options: ['`GORACE=1`', 'The `-race` flag on go test / build / run', 'It is always on', 'Import a package'], answer: 1, explain: 'Use it in tests and CI.' },
    { q: 'What establishes happens-before between goroutines?', options: ['time.Sleep', 'Channel operations, mutex Unlock→Lock, atomics', 'Printing', 'Calling runtime.Gosched'], answer: 1, explain: 'Sleeping guarantees nothing.' },
    { q: 'Why shouldn\'t you copy a struct containing a sync.Mutex?', options: ['It is too big', 'The copy duplicates lock state, so the two halves no longer protect the same data', 'It is a compile error', 'GC issues'], answer: 1, explain: 'Use pointer receivers; vet catches it.' },
  ],
}
