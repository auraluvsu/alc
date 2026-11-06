import type { Module } from '../types'

export const g05: Module = {
  n: 5,
  title: 'Functions',
  tour: '5 · Functions',
  summary: 'Multiple results, errors as values and how to wrap and inspect them, functions as values and closures, variadic functions, defer, and panic/recover.',
  topics: ['Declarations & multiple results', 'Errors', 'Function values & closures', 'Variadic functions', 'defer', 'panic & recover'],
  cpp23: [
    'Error wrapping with `%w`, `errors.Is` and `errors.As` (Go 1.13).',
    '`errors.Join` and multiple `%w` verbs (Go 1.20).',
    '`errors.AsType[T](err)`: a generic, type-safe `errors.As` (Go 1.26).',
    'Per-iteration loop variables fix the classic closure-in-a-loop bug (Go 1.22).',
  ],
  lessons: [
    {
      id: 'decl',
      title: 'Declarations & multiple results',
      blocks: [
        { kind: 'analogy', text: "A Go function can hand back several things at once, like a cashier giving you the change **and** the receipt. The convention is that the last thing handed over is the error: check it before trusting the rest." },
        { kind: 'code', code: `func hypot(x, y float64) float64 {          // consecutive params can share a type
    return math.Sqrt(x*x + y*y)
}

func divmod(a, b int) (q, r int) {          // named results start at their zero values
    q = a / b
    r = a % b
    return                                   // "bare return" returns q and r
}

func parse(s string) (Order, error) {       // the universal Go shape: value, error
    var o Order
    if s == "" {
        return Order{}, errors.New("empty order")
    }
    // ...
    return o, nil
}

q, r := divmod(17, 5)
o, err := parse(line)
if err != nil {
    return fmt.Errorf("parse line %d: %w", n, err)
}` },
        { kind: 'list', items: [
          'Arguments are passed **by value**. Slices, maps, pointers and channels are small headers, so passing them is cheap and the callee can change what they point to.',
          'There are no default arguments, no overloading and no named arguments. Use different names, options structs, or variadic "functional options".',
          'Bare `return` is fine in tiny functions, but in long ones it hides what is returned.',
        ] },
        { kind: 'check', q: 'A function receives a `[]int` and sets `s[0] = 9`. Does the caller see the change?', options: ['No: arguments are copied', 'Yes: the copied slice header points at the same array', 'Only if passed as *[]int', 'Only for arrays'], answer: 1, hint: 'What exactly is copied when you pass a slice?', explain: 'The header (pointer, len, cap) is copied, but it still points at the caller\'s array. An `append` that reallocates would not be seen by the caller, though.' },
      ],
    },
    {
      id: 'errors',
      title: 'Errors',
      blocks: [
        { kind: 'analogy', text: "Go treats errors as ordinary parcels in the post, not fire alarms. Every function that can fail hands you one, and you open it right there. To add context, you put the original parcel inside a bigger box with a note on it (wrapping). Whoever opens it later can still check what is inside." },
        { kind: 'code', code: `var ErrNotFound = errors.New("not found")       // sentinel error: compare by identity

type RateLimitError struct{ RetryAfter time.Duration }   // custom error type
func (e *RateLimitError) Error() string { return "rate limited" }

func fetch(sym string) (Quote, error) {
    q, err := api.Get(sym)
    if err != nil {
        return Quote{}, fmt.Errorf("fetch %s: %w", sym, err)   // wrap with context
    }
    return q, nil
}

_, err := fetch("XAU")
if errors.Is(err, ErrNotFound) { /* matches anywhere in the wrap chain */ }

var rl *RateLimitError
if errors.As(err, &rl) { time.Sleep(rl.RetryAfter) }       // extract a typed error

if rl, ok := errors.AsType[*RateLimitError](err); ok {      // Go 1.26: no pre-declared variable
    time.Sleep(rl.RetryAfter)
}

err = errors.Join(err1, err2)                               // several errors in one` },
        { kind: 'list', items: [
          '`error` is an interface with one method: `Error() string`. Anything with that method is an error.',
          '`%w` wraps, keeping the original inspectable. `%v` only formats it into the text, so the chain is lost.',
          'Use `errors.Is` for "is it this specific error?" and `errors.As` / `AsType` for "is it this kind, and give me its details". Never compare `err.Error()` strings.',
          'Error messages are lowercase with no trailing punctuation, because they get chained: `open config: parse line 3: unexpected EOF`.',
        ] },
        { kind: 'compare',
          python: `try:
    q = fetch("XAU")
except NotFoundError:
    ...
except RateLimitError as e:
    time.sleep(e.retry_after)`,
          ts: `try {
  const q = await fetch("XAU")
} catch (e) {
  if (e instanceof RateLimitError) await sleep(e.retryAfter)
  else throw e
}`,
          java: `try {
    Quote q = fetch("XAU");
} catch (NotFoundException e) {
    // ...
} catch (RateLimitException e) {
    Thread.sleep(e.retryAfter());
}`,
          cpp: `auto q = fetch("XAU");        // std::expected<Quote, Error>
if (!q) {
    if (q.error().kind == Error::RateLimited)
        std::this_thread::sleep_for(q.error().retry_after);
}`,
          go: `q, err := fetch("XAU")
if errors.Is(err, ErrNotFound) {
    // ...
} else if rl, ok := errors.AsType[*RateLimitError](err); ok {
    time.Sleep(rl.RetryAfter)
}`,
          note: 'Go makes failure part of the signature and the control flow is visible on the page. The cost is the famous `if err != nil` repetition.' },
        { kind: 'check', q: 'Which preserves the original error so `errors.Is` can still find it?', options: ['`fmt.Errorf("load: %v", err)`', '`fmt.Errorf("load: %w", err)`', '`errors.New("load: " + err.Error())`', 'All of them'], answer: 1, hint: 'One verb wraps, the others only format text.', explain: '`%w` records the wrapped error; `%v` and string concatenation keep only its text.' },
      ],
    },
    {
      id: 'closures',
      title: 'Function values & closures',
      blocks: [
        { kind: 'analogy', text: "Functions are values you can put in variables, pass around and return, like recipe cards. A closure is a recipe card with a small pocket that holds the ingredients it was written next to. Each card made from the same template gets its own pocket." },
        { kind: 'code', code: `func counter() func() int {
    n := 0
    return func() int { n++; return n }   // captures n by reference: it lives on
}
next := counter()
next(); next()          // 1, 2
other := counter()
other()                 // 1: a separate n

apply := func(xs []float64, f func(float64) float64) {
    for i := range xs { xs[i] = f(xs[i]) }
}
apply(prices, math.Round)

slices.SortFunc(trades, func(a, b Trade) int {   // comparator returns <0, 0, >0
    return cmp.Compare(a.Price, b.Price)
})` },
        { kind: 'list', items: [
          'Closures capture variables, not values. Changes are shared between the closure and the enclosing function.',
          'Function types compare only to `nil`. You can\'t check whether two funcs are "the same".',
          'Recursive anonymous functions need declaring first: `var visit func(n *Node); visit = func(n *Node) { ... visit(c) ... }`.',
        ] },
        { kind: 'check', q: 'What does this print?', code: `x := 1
f := func() int { return x * 10 }
x = 5
fmt.Println(f())`, options: ['10', '50', '0', 'Compile error'], answer: 1, hint: 'Does the closure hold a copy of x or x itself?', explain: 'Closures capture the variable, so `f` reads x\'s current value: 5.' },
      ],
    },
    {
      id: 'defer',
      title: 'Variadic functions & defer',
      blocks: [
        { kind: 'analogy', text: "`defer` is a sticky note on the exit door: \"on your way out, close the file\". However you leave the function (normal return, early return, panic), you pass the door and do what the notes say, most recent note first." },
        { kind: 'code', code: `func sum(vals ...int) int {         // variadic: vals is a []int
    total := 0
    for _, v := range vals { total += v }
    return total
}
sum()                // 0
sum(1, 2, 3)         // 6
nums := []int{4, 5}
sum(nums...)         // spread a slice

func copyFile(dst, src string) (err error) {
    in, err := os.Open(src)
    if err != nil { return err }
    defer in.Close()                   // runs when copyFile returns

    out, err := os.Create(dst)
    if err != nil { return err }
    defer func() {                     // a deferred closure can update named results
        if cerr := out.Close(); err == nil { err = cerr }
    }()

    _, err = io.Copy(out, in)
    return err
}` },
        { kind: 'stepper', title: 'Step through: defer order and argument timing', code: [
          'func demo() {',
          '    for i := range 3 {',
          '        defer fmt.Print(i, " ")',
          '    }',
          '    fmt.Print("body ")',
          '}',
        ], steps: [
          { line: 2, note: 'The loop starts.', memory: [] },
          { line: 3, note: 'i = 0: the call `fmt.Print(0, " ")` is **pushed** onto the defer stack. Its arguments are evaluated **now**.', memory: [{ name: 'defer stack', value: '[Print(0)]' }] },
          { line: 3, note: 'i = 1 and i = 2: two more deferred calls are pushed.', memory: [{ name: 'defer stack', value: '[Print(0), Print(1), Print(2)]' }] },
          { line: 5, note: 'The body prints "body ".', memory: [{ name: 'output', value: 'body ' }, { name: 'defer stack', value: '[Print(0), Print(1), Print(2)]' }] },
          { line: 6, note: 'On return, deferred calls run **last-in, first-out**.', memory: [{ name: 'output', value: 'body 2 1 0 ' }, { name: 'defer stack', value: 'empty', kind: 'dead' }] },
        ] },
        { kind: 'pitfall', text: '`defer` runs at **function** exit, not block or loop-iteration exit. Deferring `f.Close()` inside a loop over 10,000 files keeps all 10,000 open until the function returns. Move the loop body into its own function.' },
        { kind: 'check', q: 'What does this print?', code: `x := 1
defer fmt.Println(x)
x = 2`, options: ['1', '2', 'Nothing', 'Compile error'], answer: 0, hint: 'When are a deferred call\'s arguments evaluated?', explain: 'Arguments are evaluated when `defer` executes (x = 1); only the call is postponed. Use a closure, `defer func() { fmt.Println(x) }()`, to see 2.' },
      ],
    },
    {
      id: 'panic',
      title: 'panic & recover',
      blocks: [
        { kind: 'analogy', text: "A panic is pulling the emergency brake: the train stops, every carriage runs its deferred safety checks on the way down, and if nobody catches it the journey ends with a crash report. `recover` is a conductor stationed in a deferred call who can stop the crash and log what happened." },
        { kind: 'code', code: `func mustPositive(x int) int {
    if x <= 0 {
        panic(fmt.Sprintf("mustPositive(%d)", x))   // for bugs, not for expected failures
    }
    return x
}

// Catch panics at a boundary, e.g. so one bad request can't kill a server
func safeHandle(w http.ResponseWriter, r *http.Request) {
    defer func() {
        if p := recover(); p != nil {               // only works inside a deferred function
            log.Printf("panic: %v", p)
            http.Error(w, "internal error", http.StatusInternalServerError)
        }
    }()
    handle(w, r)
}

var re = regexp.MustCompile(\`^[A-Z]{3}/[A-Z]{3}$\`)   // "Must" = panic on bad input at startup` },
        { kind: 'list', items: [
          'Runtime panics include nil map writes, out-of-range indexes, nil pointer dereferences and failed type assertions.',
          '**Errors** are for expected failures (bad input, network down). **Panics** are for programmer mistakes and impossible states.',
          '`recover` returns nil unless called directly in a deferred function during a panic.',
          'Don\'t use panic/recover as exceptions for control flow. Idiomatic APIs return errors; `Must…` helpers are for startup-time constants.',
        ] },
        { kind: 'check', q: 'Where does `recover()` actually stop a panic?', options: ['Anywhere in the panicking goroutine', 'Only when called directly inside a deferred function', 'In main only', 'In any goroutine'], answer: 1, hint: 'Who is still running while the stack unwinds?', explain: 'During a panic only deferred functions run, so `recover` must be called from one of them, in the same goroutine.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is the idiomatic shape of a fallible Go function?', options: ['It throws an exception', 'It returns `(value, error)`, with error last', 'It returns `-1` on failure', 'It panics'], answer: 1, explain: 'Callers check `if err != nil` right away.' },
    { q: 'What does `%w` in `fmt.Errorf` do?', options: ['Prints a warning', 'Wraps the error so `errors.Is` / `As` can find it', 'Formats width', 'Discards the error'], answer: 1, explain: '`%v` would only keep the text.' },
    { q: 'How should you check for a sentinel error through wrapping?', options: ['`err == ErrNotFound`', '`errors.Is(err, ErrNotFound)`', '`err.Error() == "not found"`', '`errors.As(err, ErrNotFound)`'], answer: 1, explain: '`==` fails once the error has been wrapped.' },
    { q: 'What does `errors.AsType[*MyErr](err)` return (Go 1.26)?', options: ['bool only', '(*MyErr, bool)', 'error', 'It panics if not found'], answer: 1, explain: 'It is the generic form of `errors.As`, with no out-parameter.' },
    { q: 'In what order do deferred calls run?', options: ['FIFO', 'LIFO (last deferred, first run)', 'Random', 'Alphabetical'], answer: 1, explain: 'It is a stack.' },
    { q: 'When are a deferred call\'s arguments evaluated?', options: ['When the function returns', 'When the defer statement executes', 'Lazily on first use', 'At compile time'], answer: 1, explain: 'Wrap in a closure to read the variables later.' },
    { q: 'How do you pass a slice to a variadic `func f(xs ...int)`?', options: ['`f(s)`', '`f(s...)`', '`f(*s)`', '`f([]s)`'], answer: 1, explain: 'The `...` spreads the slice.' },
    { q: 'When should you use panic?', options: ['For any error', 'For programmer bugs and impossible states', 'Instead of returning errors from libraries', 'To exit loops'], answer: 1, explain: 'Expected failures are errors.' },
  ],
}
