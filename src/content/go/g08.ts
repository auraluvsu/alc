import type { Module } from '../types'

export const g08: Module = {
  n: 8,
  title: 'Goroutines & Channels',
  tour: '8 · Goroutines and Channels',
  summary: 'Goroutines, unbuffered and buffered channels, closing and ranging, pipelines, fan-out with WaitGroup and errgroup, select, and cancellation with context.',
  topics: ['Goroutines', 'Channels', 'Pipelines & closing', 'Looping in parallel', 'select', 'Cancellation & leaks'],
  cpp23: [
    '`context` for cancellation and deadlines (Go 1.7) replaces the book\'s hand-made "done" channels.',
    '`sync.WaitGroup.Go(f)` (Go 1.25) replaces Add / go / Done.',
    '`golang.org/x/sync/errgroup` is the standard pattern for "run these, stop on first error".',
    'Per-iteration loop variables (Go 1.22) mean `go func() { use(v) }()` in a loop is safe.',
  ],
  lessons: [
    {
      id: 'goroutines',
      title: 'Goroutines',
      blocks: [
        { kind: 'analogy', text: "Goroutines are a kitchen with a few chefs (OS threads) and an unlimited stack of order tickets (goroutines). The head chef (the Go scheduler) hands a ticket to whichever chef is free. When a dish has to wait in the oven (I/O, a channel), that chef simply picks up another ticket. Hiring a ticket costs almost nothing." },
        { kind: 'code', code: `func spinner(delay time.Duration) {
    for {
        for _, r := range \`-\\|/\` {
            fmt.Printf("\\r%c", r)
            time.Sleep(delay)
        }
    }
}

func main() {
    go spinner(100 * time.Millisecond)   // runs alongside main
    n := slowFib(45)
    fmt.Printf("\\rfib(45) = %d\\n", n)   // when main returns, spinner dies too
}` },
        { kind: 'list', items: [
          'A goroutine starts with a ~2 KB stack that grows and shrinks as needed, so hundreds of thousands are practical.',
          'The scheduler multiplexes goroutines onto `GOMAXPROCS` OS threads (default: the CPU count, container-aware since Go 1.25).',
          'Blocking is fine and expected. A goroutine waiting on I/O, a channel or a lock costs no thread.',
          'There is no way to kill a goroutine from outside. It must notice a signal (a closed channel or a cancelled context) and return.',
        ] },
        { kind: 'compare',
          python: `import asyncio
async def fetch(url): ...
async def main():
    await asyncio.gather(*(fetch(u) for u in urls))
# needs async/await all the way down`,
          ts: `// single thread + event loop; functions must be async
const results = await Promise.all(urls.map(u => fetch(u)))`,
          java: `try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    for (var u : urls) ex.submit(() -> fetch(u));
}   // Java 21 virtual threads ≈ goroutines`,
          cpp: `std::vector<std::jthread> ts;
for (const auto& u : urls) ts.emplace_back(fetch, u);
// OS threads: far heavier than goroutines`,
          go: `var wg sync.WaitGroup
for _, u := range urls {
    wg.Go(func() { fetch(u) })   // ordinary blocking code
}
wg.Wait()`,
          note: 'No "function colouring": the same blocking function can be called normally or with `go`.' },
        { kind: 'check', q: 'How do you stop a running goroutine from the outside?', options: ['`goroutine.Kill()`', 'You can\'t directly; it must watch for a signal (a channel or context) and return', '`runtime.Goexit(g)`', 'Close its stack'], answer: 1, hint: 'There are no goroutine handles in Go.', explain: 'Cancellation is cooperative, usually via `ctx.Done()`.' },
      ],
    },
    {
      id: 'channels',
      title: 'Channels',
      blocks: [
        { kind: 'analogy', text: "An unbuffered channel is a hand-to-hand relay baton: the runner can't let go until the next runner grabs it, so both are in the same place at the same moment. A buffered channel is a pigeonhole rack with N slots: you can drop items off without waiting until it's full." },
        { kind: 'stepper', title: 'Step through: an unbuffered hand-off', code: [
          'ch := make(chan int)',
          'go func() { ch <- 42 }()   // sender',
          'time.Sleep(time.Second)',
          'v := <-ch                  // receiver',
          'fmt.Println(v)',
        ], steps: [
          { line: 1, note: 'An unbuffered channel: zero storage.', memory: [{ name: 'ch', value: 'unbuffered, empty' }] },
          { line: 2, note: 'The sender reaches `ch <- 42` and **blocks**: nobody is receiving yet.', memory: [{ name: 'sender', value: 'blocked on send', kind: 'ptr' }, { name: 'ch', value: 'unbuffered, empty' }] },
          { line: 3, note: 'main sleeps for a second; the sender is still parked, costing no thread.', memory: [{ name: 'sender', value: 'blocked on send', kind: 'ptr' }] },
          { line: 4, note: 'The receive meets the waiting sender: the value passes **directly** and both continue. That moment is a synchronisation point.', memory: [{ name: 'v', value: '42' }, { name: 'sender', value: 'finished', kind: 'dead' }] },
          { line: 5, note: 'Prints 42. Everything the sender did before its send is guaranteed visible to main after the receive.', memory: [{ name: 'output', value: '42' }] },
        ] },
        { kind: 'code', code: `ch := make(chan string)        // unbuffered
buf := make(chan string, 3)    // buffered: 3 slots
buf <- "a"; buf <- "b"         // don't block (room left)
len(buf); cap(buf)             // 2 3

func producer(out chan<- int) {}   // send-only
func consumer(in <-chan int) {}    // receive-only: the compiler enforces direction

var nilCh chan int             // nil channel: send and receive block FOREVER` },
        { kind: 'pitfall', text: '"all goroutines are asleep - deadlock!" is the runtime telling you every goroutine is blocked on a channel no one will ever use, often a send with no receiver. Deadlocks involving only *some* goroutines aren\'t detected: those goroutines just leak.' },
        { kind: 'check', q: 'What happens in `main` with just `ch := make(chan int); ch <- 1; fmt.Println(<-ch)`?', options: ['Prints 1', 'Fatal error: all goroutines are asleep (deadlock)', 'Prints 0', 'Compile error'], answer: 1, hint: 'Who could receive while main is stuck on the send?', explain: 'The unbuffered send blocks main, and no other goroutine exists to receive. With `make(chan int, 1)` it would print 1.' },
      ],
    },
    {
      id: 'pipelines',
      title: 'Pipelines, closing & parallel loops',
      blocks: [
        { kind: 'analogy', text: "A pipeline is an assembly line of goroutines joined by channels: one makes numbers, the next squares them, the last prints them. Closing a channel is the foreman calling \"that's the last one\". Everyone downstream finishes what's on the belt and goes home." },
        { kind: 'code', code: `func gen(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)                 // signal: no more values
        for _, n := range nums { out <- n }
    }()
    return out
}

func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {              // range ends when 'in' is closed and drained
            out <- n * n
        }
    }()
    return out
}

for v := range square(square(gen(1, 2, 3))) {
    fmt.Println(v)                       // 1 16 81
}` },
        { kind: 'list', items: [
          'Only the **sender** closes a channel, and only when receivers need to know "no more". Sending on a closed channel panics.',
          'Receiving from a closed channel returns the zero value immediately; `v, ok := <-ch` gives `ok == false`.',
          'You don\'t have to close every channel. Unreachable channels are garbage collected.',
        ] },
        { kind: 'h', text: 'Looping in parallel' },
        { kind: 'code', code: `// Fan out, collect results by index (no shared writes to the same element)
results := make([]Result, len(symbols))
var wg sync.WaitGroup
for i, sym := range symbols {
    wg.Go(func() { results[i] = backtest(sym) })   // Go 1.25
}
wg.Wait()

// Stop at the first error, cancel the rest, and cap concurrency
g, ctx := errgroup.WithContext(ctx)
g.SetLimit(runtime.NumCPU())
for _, sym := range symbols {
    g.Go(func() error { return fetchBars(ctx, sym) })
}
if err := g.Wait(); err != nil { return err }` },
        { kind: 'check', q: 'What does receiving from a closed, empty channel do?', options: ['Blocks forever', 'Panics', 'Returns the zero value immediately (ok == false)', 'Returns an error'], answer: 2, hint: 'This is what makes `for v := range ch` terminate.', explain: 'Closed channels never block receivers. It is *sending* on one that panics.' },
      ],
    },
    {
      id: 'select',
      title: 'select & multiplexing',
      blocks: [
        { kind: 'analogy', text: "`select` is a receptionist watching several phone lines at once: whichever line rings first gets answered. If several ring together, one is picked at random so none is starved. Add `default` and the receptionist doesn't wait at all: \"nobody calling? fine, carry on\"." },
        { kind: 'code', code: `ticker := time.NewTicker(time.Second)
defer ticker.Stop()
for {
    select {
    case px := <-prices:
        book.Update(px)
    case <-ticker.C:
        report(book)
    case <-ctx.Done():
        return ctx.Err()                     // cancelled or timed out
    }
}

// Timeout on a single operation
select {
case res := <-resultCh:
    use(res)
case <-time.After(2 * time.Second):
    return errors.New("timed out")
}

// Non-blocking send: drop the update if the consumer is busy
select {
case updates <- u:
default:
}` },
        { kind: 'list', items: [
          'A `nil` channel in a select never fires, so setting a channel variable to nil is how you switch a case off.',
          '`select {}` with no cases blocks forever.',
          'In long-running loops, use a `time.Ticker` rather than `time.After` on every iteration.',
        ] },
        { kind: 'check', q: 'Two cases in a `select` are both ready. Which runs?', options: ['The first listed', 'The last listed', 'One chosen pseudo-randomly', 'Both'], answer: 2, hint: 'Fairness.', explain: 'Random choice prevents one busy channel from starving the others.' },
      ],
    },
    {
      id: 'cancel',
      title: 'Cancellation, context & leaks',
      blocks: [
        { kind: 'analogy', text: "A `context.Context` is a radio handed down the chain of command. When headquarters says \"abort\" (cancel, or the deadline passes), every soldier holding a radio from that chain hears it at once and packs up. Soldiers without a radio keep fighting forever: that's a goroutine leak." },
        { kind: 'code', code: `func fetchAll(ctx context.Context, urls []string) error {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()                                     // always release resources

    errc := make(chan error, len(urls))                // buffered: senders never get stuck
    for _, u := range urls {
        go func() { errc <- fetch(ctx, u) }()
    }
    for range urls {
        if err := <-errc; err != nil {
            return err                                 // cancel() stops the others
        }
    }
    return nil
}

func fetch(ctx context.Context, url string) error {
    req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
    if err != nil { return err }
    resp, err := http.DefaultClient.Do(req)            // aborts when ctx is done
    if err != nil { return err }
    defer resp.Body.Close()
    _, err = io.Copy(io.Discard, resp.Body)
    return err
}` },
        { kind: 'list', items: [
          'Pass `ctx` as the **first parameter** of anything that does I/O or might take a while. Don\'t store it in structs.',
          '`WithCancel`, `WithTimeout`, `WithDeadline` and `WithCancelCause` all derive child contexts; cancelling a parent cancels its children.',
          'Leak check: every goroutine you start needs a guaranteed way to finish. Unbuffered sends to a receiver that has already returned are the classic leak, which is why `errc` is buffered above.',
        ] },
        { kind: 'pitfall', text: 'If `fetchAll` returned early on the first error with an **unbuffered** `errc`, the remaining goroutines would block forever on their sends: a leak that grows with every call. Buffer the channel to the number of senders, or use `errgroup`.' },
        { kind: 'check', q: 'Why is `defer cancel()` important after `context.WithTimeout`?', options: ['It is required to compile', 'It releases the context\'s timer and resources as soon as the function finishes', 'It makes the timeout longer', 'It restarts the context'], answer: 1, hint: '`go vet` warns when you forget it.', explain: 'Otherwise the context and its timer live until the deadline passes.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does a goroutine cost to start?', options: ['A full OS thread', 'A few KB of growable stack', '1 MB fixed', 'A process'], answer: 1, explain: 'That is why fan-out to thousands is normal.' },
    { q: 'What does a send on an unbuffered channel do?', options: ['Returns immediately', 'Blocks until a receiver takes it', 'Panics without a receiver', 'Drops the value'], answer: 1, explain: 'It is a rendezvous.' },
    { q: 'Who should close a channel?', options: ['The receiver', 'The sender, when no more values will be sent', 'Anyone', 'The garbage collector'], answer: 1, explain: 'Sending on a closed channel panics.' },
    { q: 'What does `for v := range ch` do?', options: ['Loops forever', 'Receives until ch is closed and drained', 'Iterates the buffer once', 'Is invalid'], answer: 1, explain: 'It is the idiomatic consumer loop.' },
    { q: 'What happens when you send or receive on a nil channel?', options: ['Panics', 'Blocks forever', 'Returns zero', 'Compile error'], answer: 1, explain: 'This is useful for disabling select cases.' },
    { q: 'What does `default` in a select do?', options: ['Runs last always', 'Runs when no other case is ready, making the select non-blocking', 'Handles errors', 'Required syntax'], answer: 1, explain: 'It is used for try-send and try-receive.' },
    { q: 'What is a goroutine leak?', options: ['A stack overflow', 'A goroutine blocked forever (e.g. on a channel no one will use)', 'A memory leak in maps', 'A data race'], answer: 1, explain: 'Contexts and buffered channels prevent most leaks.' },
    { q: 'What does `errgroup.WithContext` give you?', options: ['Retries', 'A group that cancels the shared context on the first error and returns it from Wait', 'Thread pools', 'Deadlock detection'], answer: 1, explain: '`SetLimit` also caps concurrency.' },
  ],
}
