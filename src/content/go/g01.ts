import type { Module } from '../types'

export const g01: Module = {
  n: 1,
  title: 'Tutorial',
  tour: '1 · Tutorial',
  summary: 'A fast first lap: the toolchain and modules, loops and command-line arguments, reading input, fetching URLs concurrently and serving HTTP.',
  topics: ['Packages & the go tool', 'Command-line arguments', 'Reading input & maps', 'Fetching URLs concurrently', 'A web server'],
  cpp23: [
    'Go modules (`go.mod`) replaced GOPATH, which the book assumes (Go 1.11–1.16).',
    '`for i := range 10` ranges over an integer (Go 1.22).',
    '`http.ServeMux` routes on method and path wildcards: `"GET /items/{id}"` (Go 1.22).',
    'Each loop iteration gets its own copy of the loop variable, so closures and goroutines capture the right value (Go 1.22).',
  ],
  lessons: [
    {
      id: 'hello',
      title: 'Hello, toolchain',
      blocks: [
        { kind: 'analogy', text: "Go ships as one toolbox with every tool already in it: compiler, formatter, test runner, dependency manager and documentation, all behind a single `go` command. You don't choose a build system or a formatter. The toolbox has already chosen, and every Go project looks the same because of it." },
        { kind: 'code', code: `// main.go
package main            // package main + func main = an executable

import "fmt"            // standard library package

func main() {
    fmt.Println("Hello, 世界")   // source is UTF-8; strings are too
}`, caption: 'Set up once with `go mod init example.com/hello`, then `go run .` to compile and run, or `go build` for a binary.' },
        { kind: 'list', items: [
          '`go mod init <path>` creates `go.mod`, which names your module and records the Go version and dependencies. `go get pkg@version` adds a dependency.',
          '`go run .` compiles to a temporary binary and runs it. `go build` leaves a single static binary, and cross-compiling is just `GOOS=linux GOARCH=arm64 go build`.',
          '`gofmt` (or `go fmt`) formats code in the one official style. Teams don\'t argue about braces in Go.',
          '`go vet` catches suspicious code, `go test` runs tests, and `go doc fmt.Println` shows documentation.',
        ] },
        { kind: 'p', text: "Go compiles ahead of time to native code, but the binary includes a small **runtime**: a garbage collector and a scheduler for goroutines. That is the trade: C-like deployment (one file, no interpreter) with automatic memory management." },
        { kind: 'pitfall', text: "An unused import or unused local variable is a **compile error**, not a warning. It feels harsh at first and keeps codebases clean. Use `_` to ignore a value on purpose: `_, err := f()`." },
        { kind: 'new23', text: "The book predates **modules**. It describes `GOPATH`, a single shared workspace. Since Go 1.16, module mode is the default: each project has its own `go.mod`, lives anywhere on disk, and pins its dependencies in `go.sum`." },
        { kind: 'check', q: 'What makes a Go program an executable rather than a library?', options: ['A `main.go` filename', '`package main` with a `func main()`', 'A `go.mod` file', 'The `-exe` build flag'], answer: 1, hint: 'It is about the package name and one function, not the file.', explain: 'Any package named `main` that declares `func main()` builds into a binary. Every other package name is a library.' },
      ],
    },
    {
      id: 'args',
      title: 'Command-line arguments & loops',
      blocks: [
        { kind: 'analogy', text: "Go has exactly one loop keyword, `for`, the way a Swiss army knife has one handle. It folds out into a counting loop, a `while`, an infinite loop or a `range` over a collection. There's less to remember, and every loop is spelled the same way." },
        { kind: 'code', code: `package main

import (
    "fmt"
    "os"
    "strings"
)

func main() {
    // os.Args[0] is the program name; the rest are the arguments
    for i, arg := range os.Args[1:] {          // range gives index and value
        fmt.Println(i, arg)
    }

    s, sep := "", ""
    for i := 1; i < len(os.Args); i++ {         // the C-style form
        s += sep + os.Args[i]
        sep = " "
    }

    fmt.Println(strings.Join(os.Args[1:], " ")) // the idiomatic version
}` },
        { kind: 'code', code: `for cond { }              // "while"
for { }                   // forever: leave with break or return
for i := range 10 { }     // 0..9 (Go 1.22)
for _, v := range xs { }  // _ discards the index` },
        { kind: 'compare',
          python: `import sys
for i, arg in enumerate(sys.argv[1:]):
    print(i, arg)
print(" ".join(sys.argv[1:]))`,
          ts: `const args = process.argv.slice(2)
args.forEach((arg, i) => console.log(i, arg))
console.log(args.join(" "))`,
          java: `public static void main(String[] args) {
    for (int i = 0; i < args.length; i++)
        System.out.println(i + " " + args[i]);
    System.out.println(String.join(" ", args));
}`,
          cpp: `int main(int argc, char* argv[]) {
    for (int i = 1; i < argc; ++i)
        std::println("{} {}", i - 1, argv[i]);
}`,
          go: `for i, arg := range os.Args[1:] {
    fmt.Println(i, arg)
}
fmt.Println(strings.Join(os.Args[1:], " "))`,
          note: '`range` works on slices, arrays, strings, maps, channels, integers and (since Go 1.23) iterator functions.' },
        { kind: 'pitfall', text: '`s += ...` in a loop builds a brand-new string every time, because strings are immutable. That is fine for a handful of arguments and quadratic for big inputs. Use `strings.Join` or a `strings.Builder` (module 3).' },
        { kind: 'check', q: 'Which of these is NOT valid Go?', options: ['`for i := 0; i < 3; i++ {}`', '`for x < 10 {}`', '`while x < 10 {}`', '`for i := range 3 {}`'], answer: 2, hint: 'Count the loop keywords Go has.', explain: 'Go has no `while`. `for cond {}` does that job.' },
      ],
    },
    {
      id: 'dup',
      title: 'Reading input & maps',
      blocks: [
        { kind: 'analogy', text: "`bufio.Scanner` is a conveyor belt that hands you one line at a time from any source: a file, standard input or a network stream. A map is a tally sheet: each new line either gets a fresh row or a tick on its existing one." },
        { kind: 'code', code: `// dup: print lines that appear more than once in stdin, with counts
package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    counts := make(map[string]int)       // a map from string to int
    input := bufio.NewScanner(os.Stdin)
    for input.Scan() {                   // false at end of input
        counts[input.Text()]++           // missing keys read as 0
    }
    if err := input.Err(); err != nil {
        fmt.Fprintln(os.Stderr, "dup:", err)
        os.Exit(1)
    }
    for line, n := range counts {        // iteration order is random, on purpose
        if n > 1 {
            fmt.Printf("%d\\t%s\\n", n, line)
        }
    }
}` },
        { kind: 'list', items: [
          '`make(map[K]V)` creates a map. Reading a missing key gives the **zero value** (0, "", nil), so `counts[k]++` just works.',
          '`v, ok := m[k]` tells you whether the key existed (the "comma ok" idiom).',
          'Map iteration order is **deliberately randomised**. If you need order, sort the keys (module 4).',
          '`fmt.Printf` verbs: `%d` integer, `%s` string, `%v` any value, `%+v` struct with field names, `%T` type, `%q` quoted string.',
        ] },
        { kind: 'p', text: 'To read files instead of stdin, open each one with `os.Open`, which returns an `*os.File` and an `error`. You must check the error and `defer f.Close()`. For whole small files, `os.ReadFile` returns all the bytes at once.' },
        { kind: 'code', code: `f, err := os.Open(name)
if err != nil {
    fmt.Fprintf(os.Stderr, "dup: %v\\n", err)
    continue
}
defer f.Close()          // runs when the surrounding function returns
countLines(f, counts)    // *os.File satisfies io.Reader, so any reader works` },
        { kind: 'check', q: 'What does `counts["new"]++` do when "new" isn\'t in the map yet?', options: ['Panics', 'Sets it to 1', 'Returns an error', 'Does nothing'], answer: 1, hint: 'What value does a missing key read as?', explain: 'The missing key reads as 0, so `++` stores 1. (Writing to a **nil** map, one never made with `make`, would panic.)' },
      ],
    },
    {
      id: 'fetch',
      title: 'Fetching URLs concurrently',
      blocks: [
        { kind: 'analogy', text: "A goroutine is an errand runner you can hire for almost nothing; thousands are fine. A channel is the pigeonhole they drop results into. You send out one runner per URL, then wait at the pigeonhole and collect each result as it arrives." },
        { kind: 'code', code: `func main() {
    start := time.Now()
    ch := make(chan string)                 // an unbuffered channel of strings
    for _, url := range os.Args[1:] {
        go fetch(url, ch)                   // "go" starts a goroutine
    }
    for range os.Args[1:] {
        fmt.Println(<-ch)                   // receive: blocks until a result arrives
    }
    fmt.Printf("%.2fs elapsed\\n", time.Since(start).Seconds())
}

func fetch(url string, ch chan<- string) {  // chan<- : this function may only send
    start := time.Now()
    resp, err := http.Get(url)
    if err != nil {
        ch <- fmt.Sprint(err)               // send
        return
    }
    defer resp.Body.Close()
    n, err := io.Copy(io.Discard, resp.Body)   // count bytes, discard them
    if err != nil {
        ch <- fmt.Sprintf("while reading %s: %v", url, err)
        return
    }
    ch <- fmt.Sprintf("%.2fs %7d %s", time.Since(start).Seconds(), n, url)
}` },
        { kind: 'list', items: [
          'Total time ≈ the **slowest** fetch, not the sum, because all requests run at once.',
          'A send on an unbuffered channel waits until someone receives. Here, that sync point is what makes `main` wait for every goroutine.',
          'Goroutines are multiplexed onto a few OS threads by the Go runtime. They start with a few KB of stack, which is why you can run hundreds of thousands.',
        ] },
        { kind: 'pitfall', text: 'If `main` returns, the program exits and running goroutines are killed mid-flight. Something must wait for them: receiving from a channel, a `sync.WaitGroup`, or `errgroup` (module 8).' },
        { kind: 'check', q: 'Five URLs take 1s, 1s, 2s, 1s and 3s. About how long does the program run?', options: ['8s', '3s', '1s', 'It depends on GOMAXPROCS'], answer: 1, hint: 'They all start together. When does the last one finish?', explain: 'All fetches run concurrently, so the total is roughly the slowest one: 3s.' },
      ],
    },
    {
      id: 'server',
      title: 'A web server',
      blocks: [
        { kind: 'analogy', text: "`net/http` is a restaurant where the standard library already hired the waiters. You only write the recipes (handlers) and pin them to the menu (routes). Each customer is served on their own goroutine automatically, which also means you must lock the till (shared state)." },
        { kind: 'code', code: `var (
    mu    sync.Mutex
    count int
)

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("GET /", handler)                 // method + path patterns (Go 1.22)
    mux.HandleFunc("GET /prices/{sym}", price)       // path wildcard
    mux.HandleFunc("GET /count", counter)
    log.Fatal(http.ListenAndServe("localhost:8000", mux))
}

func handler(w http.ResponseWriter, r *http.Request) {
    mu.Lock()
    count++                                          // every request runs on its own goroutine
    mu.Unlock()
    fmt.Fprintf(w, "URL.Path = %q\\n", r.URL.Path)
}

func price(w http.ResponseWriter, r *http.Request) {
    sym := r.PathValue("sym")                        // the {sym} part of the URL
    fmt.Fprintf(w, "price of %s\\n", sym)
}

func counter(w http.ResponseWriter, r *http.Request) {
    mu.Lock()
    defer mu.Unlock()
    fmt.Fprintf(w, "Count %d\\n", count)
}` },
        { kind: 'p', text: '`fmt.Fprintf` writes to any `io.Writer`: a file, `os.Stdout` or an HTTP response. That one small interface is why the same formatting code works everywhere. Interfaces get a whole module (7).' },
        { kind: 'new23', text: "Since Go 1.22, the standard `ServeMux` understands methods and wildcards (`\"POST /orders/{id}\"`, `r.PathValue(\"id\")`, and `{path...}` for the rest of the path). Many projects that once needed a router library now don't." },
        { kind: 'check', q: 'Why does the handler lock a mutex before `count++`?', options: ['HTTP requires it', 'Requests are served concurrently on separate goroutines, so unsynchronised `count++` is a data race', 'To make the server slower on purpose', 'Mutexes speed up integer increments'], answer: 1, hint: 'How many requests might be inside `handler` at the same moment?', explain: 'The server runs each request on its own goroutine. Concurrent `count++` without synchronisation is a data race (module 9).' },
      ],
    },
  ],
  quiz: [
    { q: 'What file defines a Go module and its dependencies?', options: ['`package.json`', '`go.mod`', '`Gopkg.toml`', '`main.go`'], answer: 1, explain: '`go.mod` (with checksums in `go.sum`).' },
    { q: 'An unused local variable in Go is…', options: ['a warning', 'a compile error', 'silently removed', 'a vet warning only'], answer: 1, explain: 'Unused imports and locals don\'t compile. Discard values on purpose with `_`.' },
    { q: 'How do you write a while loop in Go?', options: ['`while cond {}`', '`for cond {}`', '`loop cond {}`', '`do {} while cond`'], answer: 1, explain: '`for` is the only loop keyword.' },
    { q: 'What does reading a missing key from a map return?', options: ['nil always', 'The zero value of the value type', 'A panic', 'An error'], answer: 1, explain: 'Use `v, ok := m[k]` when you need to know if it was present.' },
    { q: 'What does `go f(x)` do?', options: ['Calls f and waits', 'Starts f in a new goroutine and continues immediately', 'Compiles f', 'Defers f'], answer: 1, explain: 'The caller doesn\'t wait; use channels or a WaitGroup to collect results.' },
    { q: 'What does a send on an unbuffered channel do?', options: ['Returns immediately', 'Blocks until a receiver takes the value', 'Panics if nobody is listening', 'Drops the value'], answer: 1, explain: 'Unbuffered channels synchronise sender and receiver.' },
    { q: 'What happens when `main` returns while goroutines are still running?', options: ['main waits for them', 'The program exits and they stop', 'They become daemons', 'Panic'], answer: 1, explain: 'Wait explicitly with a channel, WaitGroup or errgroup.' },
    { q: 'How do you read the `{sym}` wildcard in a Go 1.22+ handler?', options: ['`r.URL.Query()["sym"]`', '`r.PathValue("sym")`', '`mux.Vars(r)["sym"]`', '`r.Param("sym")`'], answer: 1, explain: '`mux.Vars` is the third-party gorilla/mux API; the standard library uses `PathValue`.' },
  ],
}
