import type { StdEntry } from '../standard'

// The most useful functions and methods in Go's standard library.
export const GO_STANDARD: StdEntry[] = [
  // ---------------- Formatting & text ----------------
  {
    name: 'fmt.Printf / Sprintf / Fprintf', header: 'fmt', cat: 'Formatting & text', module: 1,
    summary: 'Formatted output to stdout, a string, or any writer.',
    what: '`Printf` writes to stdout, `Sprintf` returns a string, `Fprintf` writes to any `io.Writer` (a file, an HTTP response, a buffer). Verbs: `%v` value, `%+v` with field names, `%T` type, `%q` quoted, `%d`, `%s`, `%.2f`, `%x`.',
    code: `fmt.Printf("%s x %d @ %.2f\\n", sym, qty, px)
msg := fmt.Sprintf("%-8s|%8.2f", sym, px)
fmt.Fprintf(w, "hello %s\\n", name)     // w: http.ResponseWriter, *os.File, ...
fmt.Printf("%+v %T\\n", trade, trade)   // {Sym:XAU Px:2390.5} main.Trade`,
    when: 'Any formatted output. `%v` and `%+v` are the fastest way to inspect values while debugging.',
  },
  {
    name: 'strings.Split / Fields / Join', header: 'strings', cat: 'Formatting & text', module: 3,
    summary: 'Break a string into pieces, or glue pieces back together.',
    what: '`Split(s, sep)` splits on an exact separator, `Fields(s)` splits on any run of whitespace, `Join(xs, sep)` concatenates. `SplitSeq` and `FieldsSeq` (1.24) return iterators instead of allocating a slice.',
    code: `parts := strings.Split("XAU,XAG,EUR", ",")   // [XAU XAG EUR]
words := strings.Fields("  buy   10  XAU ")     // [buy 10 XAU]
line  := strings.Join(parts, " | ")

for part := range strings.SplitSeq(big, "\\n") { // no slice allocated (Go 1.24)
    process(part)
}`,
    when: 'Parsing simple text formats, command input and CSV-ish lines (use `encoding/csv` for real CSV).',
  },
  {
    name: 'strings.Cut / CutPrefix / CutLast', header: 'strings', cat: 'Formatting & text', module: 3,
    summary: 'Split around the first (or last) separator, in one call.',
    what: '`Cut(s, sep)` returns `before, after, found`. `CutPrefix` and `CutSuffix` strip a known prefix or suffix and report whether it was there. `CutLast` (1.27) splits around the last occurrence.',
    code: `base, quote, ok := strings.Cut("XAU/USD", "/")         // "XAU" "USD" true
key, val, _ := strings.Cut("timeout=30s", "=")
rest, ok := strings.CutPrefix(line, "PRICE ")
dir, file, _ := strings.CutLast("a/b/c.csv", "/")       // "a/b" "c.csv" (Go 1.27)`,
    when: 'key=value parsing, symbol pairs, stripping prefixes. It replaces most `Index` + slicing code.',
    since: 'Go 1.27',
  },
  {
    name: 'strings.Contains / HasPrefix / Index', header: 'strings', cat: 'Formatting & text', module: 3,
    summary: 'Test for or locate a substring.',
    what: '`Contains`, `HasPrefix` and `HasSuffix` return bools. `Index` returns the byte offset of the first match, or -1. `EqualFold` compares case-insensitively.',
    code: `if strings.HasPrefix(sym, "XA") {}
if strings.Contains(msg, "error") {}
i := strings.Index(line, ",")
strings.EqualFold("Gold", "GOLD")   // true
strings.ToUpper(s); strings.TrimSpace(s); strings.ReplaceAll(s, "-", "")`,
    when: 'Filtering and validating text.',
  },
  {
    name: 'strings.Builder', header: 'strings', cat: 'Formatting & text', module: 3,
    summary: 'Build a long string efficiently.',
    what: 'An append-only buffer that implements `io.Writer`. It avoids the quadratic copying of `s += x` in loops.',
    code: `var sb strings.Builder
sb.Grow(1024)                       // optional pre-size
for _, t := range trades {
    fmt.Fprintf(&sb, "%s,%.2f\\n", t.Sym, t.Px)
}
csv := sb.String()`,
    when: 'Generating reports, CSV, SQL or any string assembled from many parts.',
  },
  {
    name: 'strconv.Atoi / ParseFloat / Itoa', header: 'strconv', cat: 'Formatting & text', module: 3,
    summary: 'Convert between strings and numbers, with errors.',
    what: '`Atoi` and `ParseInt` parse integers, `ParseFloat` parses floats, `ParseBool` parses bools. All return an error on bad input. `Itoa` and `FormatFloat` go the other way.',
    code: `qty, err := strconv.Atoi("42")
px, err := strconv.ParseFloat("2390.5", 64)
if err != nil { return fmt.Errorf("bad price %q: %w", s, err) }
s := strconv.Itoa(42)
s = strconv.FormatFloat(px, 'f', 2, 64)   // "2390.50"`,
    when: 'Parsing user input, CSV fields or query parameters. Never use `string(n)` to get digits.',
  },

  // ---------------- Collections ----------------
  {
    name: 'append / copy / make', header: 'built-in', cat: 'Collections', module: 4,
    summary: 'Grow slices, copy between them, and pre-allocate.',
    what: '`append` adds elements and may reallocate, so always assign its result. `copy(dst, src)` copies min(len) elements. `make([]T, len, cap)` pre-allocates.',
    code: `out := make([]float64, 0, len(in))   // room for all, len 0
for _, x := range in {
    out = append(out, x*2)
}
out = append(out, more...)           // append a whole slice
n := copy(dst, src)`,
    when: 'Building result slices. Pre-allocating capacity avoids repeated growth.',
  },
  {
    name: 'slices.Sort / SortFunc', header: 'slices', cat: 'Collections', module: 4,
    summary: 'Sort a slice naturally or with a comparator.',
    what: '`Sort` sorts ordered element types. `SortFunc` takes a comparator returning negative/zero/positive, usually built with `cmp.Compare`. `SortStableFunc` keeps equal elements in order.',
    code: `slices.Sort(prices)
slices.SortFunc(trades, func(a, b Trade) int {
    return cmp.Compare(a.Px, b.Px)
})
slices.SortFunc(trades, func(a, b Trade) int {      // multi-key
    return cmp.Or(cmp.Compare(a.Sym, b.Sym), cmp.Compare(a.Px, b.Px))
})`,
    when: 'Ranking and ordering output. It replaces the older `sort.Slice` and `sort.Interface`.',
  },
  {
    name: 'slices.Contains / Index / IndexFunc', header: 'slices', cat: 'Collections', module: 4,
    summary: 'Search a slice.',
    what: '`Contains` reports membership, `Index` returns the position (or -1), and `IndexFunc` / `ContainsFunc` use a predicate. `BinarySearch` works on sorted slices.',
    code: `if slices.Contains(watchlist, "XAU") {}
i := slices.Index(syms, "EUR")
j := slices.IndexFunc(trades, func(t Trade) bool { return t.Qty > 100 })
pos, found := slices.BinarySearch(sortedIDs, 42)`,
    when: 'Membership tests on small slices. For many lookups, use a map instead.',
  },
  {
    name: 'slices.Max / Min / Reverse / Compact', header: 'slices', cat: 'Collections', module: 4,
    summary: 'Common slice utilities.',
    what: '`Max`/`Min` (they panic on an empty slice), `Reverse` in place, `Compact` (removes adjacent duplicates, so sort first), `Equal`, `Clone`, `Insert`, `Delete`.',
    code: `hi := slices.Max(prices)
slices.Reverse(xs)
slices.Sort(ids); ids = slices.Compact(ids)   // de-duplicate
same := slices.Equal(a, b)
xs = slices.Insert(xs, 1, 99)`,
    when: 'Everyday slice work without writing loops.',
  },
  {
    name: 'maps.Keys + slices.Sorted', header: 'maps, slices', cat: 'Collections', module: 4,
    summary: 'Iterate a map in a predictable order.',
    what: '`maps.Keys(m)` returns an iterator over the keys (1.23), and `slices.Sorted` collects and sorts them. `maps.Clone` copies a map and `maps.Equal` compares two.',
    code: `for _, sym := range slices.Sorted(maps.Keys(prices)) {
    fmt.Println(sym, prices[sym])
}
backup := maps.Clone(prices)`,
    when: 'Deterministic output (reports, tests, logs) from a map, whose own order is random.',
    since: 'Go 1.23',
  },
  {
    name: 'make(map) / delete / clear', header: 'built-in', cat: 'Collections', module: 4,
    summary: 'Create, shrink and empty maps.',
    what: '`make(map[K]V, hint)` creates a map (the hint pre-sizes it). `delete(m, k)` removes one key; `clear(m)` (1.21) removes all. `v, ok := m[k]` tests presence.',
    code: `seen := make(map[string]struct{}, len(syms))
for _, s := range syms { seen[s] = struct{}{} }
if _, ok := seen["XAU"]; ok {}
delete(seen, "XAU")
clear(seen)`,
    when: 'Sets, counters, indexes and caches.',
  },

  // ---------------- Errors ----------------
  {
    name: 'fmt.Errorf("%w") / errors.Is', header: 'fmt, errors', cat: 'Errors', module: 5,
    summary: 'Add context to errors and test for specific ones.',
    what: '`fmt.Errorf` with `%w` wraps an error with context while keeping it inspectable. `errors.Is` checks the whole wrap chain for a specific error value.',
    code: `if err != nil {
    return fmt.Errorf("load %s: %w", path, err)
}
if errors.Is(err, os.ErrNotExist) {
    useDefaults()
}`,
    when: 'Every error return path. Context like "load prices.csv:" makes logs readable.',
  },
  {
    name: 'errors.As / errors.AsType', header: 'errors', cat: 'Errors', module: 5,
    summary: 'Extract a typed error to read its details.',
    what: 'Finds the first error in the chain of a given type. `AsType` (1.26) returns it directly instead of filling an out-variable.',
    code: `if pe, ok := errors.AsType[*fs.PathError](err); ok {
    log.Println("failed path:", pe.Path)
}

var ne net.Error          // pre-1.26 style
if errors.As(err, &ne) && ne.Timeout() { retry() }`,
    when: 'Reacting to error details: retry on timeouts, report the failing path.',
    since: 'Go 1.26',
  },

  // ---------------- I/O & files ----------------
  {
    name: 'os.ReadFile / WriteFile', header: 'os', cat: 'I/O & files', module: 1,
    summary: 'Read or write a whole file in one call.',
    what: '`ReadFile` returns all the bytes; `WriteFile` creates or truncates a file with the given permissions.',
    code: `data, err := os.ReadFile("config.json")
if err != nil { return err }
err = os.WriteFile("out.csv", []byte(csv), 0o644)`,
    when: 'Small files: configs and outputs. Stream big files with `os.Open` + `bufio`.',
  },
  {
    name: 'os.Open + bufio.Scanner', header: 'os, bufio', cat: 'I/O & files', module: 1,
    summary: 'Read a file line by line.',
    what: '`os.Open` returns an `*os.File` (an `io.Reader`). `bufio.Scanner` splits it into lines (or words). Check `Err()` after the loop.',
    code: `f, err := os.Open("ticks.csv")
if err != nil { return err }
defer f.Close()

sc := bufio.NewScanner(f)
sc.Buffer(make([]byte, 1<<20), 1<<20)    // allow lines up to 1 MiB
for sc.Scan() {
    line := sc.Text()
    _ = line
}
return sc.Err()`,
    when: 'Processing large text files without loading them fully into memory.',
  },
  {
    name: 'io.Copy / io.ReadAll', header: 'io', cat: 'I/O & files', module: 1,
    summary: 'Move bytes between any reader and writer.',
    what: '`io.Copy(dst, src)` streams everything from a reader to a writer. `io.ReadAll` reads a reader to the end into memory.',
    code: `resp, err := http.Get(url)
if err != nil { return err }
defer resp.Body.Close()
_, err = io.Copy(file, resp.Body)        // download to disk, streaming

body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))`,
    when: 'Downloads, proxies and file copies. It works with anything that implements Reader/Writer.',
  },
  {
    name: 'json.Marshal / Unmarshal', header: 'encoding/json', cat: 'I/O & files', module: 4,
    summary: 'Convert between structs and JSON.',
    what: 'Uses struct tags to map fields. Only exported fields are included. `NewDecoder(r).Decode(&v)` streams from a reader.',
    code: `type Quote struct {
    Sym string  \`json:"sym"\`
    Px  float64 \`json:"px"\`
}
data, err := json.Marshal(q)
var q2 Quote
err = json.Unmarshal(data, &q2)
err = json.NewDecoder(resp.Body).Decode(&q2)`,
    when: 'APIs, configs and storage. Go 1.27 adds `encoding/json/v2` for stricter and faster handling.',
  },

  // ---------------- Time ----------------
  {
    name: 'time.Now / Since / Duration', header: 'time', cat: 'Time', module: 1,
    summary: 'Measure elapsed time and work with durations.',
    what: '`time.Since(start)` gives a `Duration`. Durations are typed (`time.Second`, `500*time.Millisecond`) and print nicely (`1.5s`).',
    code: `start := time.Now()
runBacktest()
fmt.Println("took", time.Since(start))      // e.g. "took 842ms"

timeout := 2*time.Second + 500*time.Millisecond
time.Sleep(100 * time.Millisecond)`,
    when: 'Timing, timeouts and rate limiting.',
  },
  {
    name: 'time.Parse / Format', header: 'time', cat: 'Time', module: 3,
    summary: 'Parse and print dates using the reference layout.',
    what: 'Layouts are written as the reference time **Mon Jan 2 15:04:05 MST 2006**. Constants such as `time.RFC3339` and `time.DateOnly` cover common formats.',
    code: `t, err := time.Parse(time.DateOnly, "2024-11-05")
ts, err := time.Parse(time.RFC3339, "2024-11-05T14:30:00Z")
fmt.Println(t.Format("02 Jan 2006 15:04"))   // "05 Nov 2024 00:00"
loc, _ := time.LoadLocation("Europe/London")
fmt.Println(ts.In(loc))`,
    when: 'Reading timestamps from files and APIs, and printing dates.',
  },

  // ---------------- Concurrency ----------------
  {
    name: 'sync.WaitGroup.Go', header: 'sync', cat: 'Concurrency', module: 8,
    summary: 'Run goroutines and wait for all of them.',
    what: '`wg.Go(f)` (1.25) starts `f` in a goroutine and tracks it; `wg.Wait()` blocks until all are done. Before 1.25: `Add(1)`, `go`, `defer Done()`.',
    code: `var wg sync.WaitGroup
results := make([]float64, len(paths))
for i, p := range paths {
    wg.Go(func() { results[i] = simulate(p) })   // each writes its own index
}
wg.Wait()`,
    when: 'Fan-out of independent work: per-symbol backtests, Monte Carlo paths, parallel fetches.',
    since: 'Go 1.25',
  },
  {
    name: 'errgroup.Group', header: 'golang.org/x/sync/errgroup', cat: 'Concurrency', module: 8,
    summary: 'Run goroutines, stop on the first error, and return it.',
    what: 'Like a WaitGroup that collects the first error and (with `WithContext`) cancels the others. `SetLimit` caps how many run concurrently.',
    code: `g, ctx := errgroup.WithContext(ctx)
g.SetLimit(8)
for _, u := range urls {
    g.Go(func() error { return fetch(ctx, u) })
}
if err := g.Wait(); err != nil { return err }`,
    when: 'Concurrent work where any failure should abort the batch. It lives in the x/ (extended) libraries, not the standard library proper.',
  },
  {
    name: 'context.WithTimeout / WithCancel', header: 'context', cat: 'Concurrency', module: 8,
    summary: 'Cancel work or give it a deadline.',
    what: 'Derives a context that is cancelled when the timeout passes or `cancel()` is called. Functions watch `ctx.Done()` and return `ctx.Err()`.',
    code: `ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
defer cancel()
req, _ := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
resp, err := http.DefaultClient.Do(req)    // aborted after 3s`,
    when: 'Every network call and long operation, so it can be cancelled or timed out.',
  },
  {
    name: 'sync.Mutex', header: 'sync', cat: 'Concurrency', module: 9,
    summary: 'Protect shared data from concurrent access.',
    what: 'Only one goroutine holds the lock at a time. Lock, then `defer Unlock`. The zero value is ready to use, but never copy a Mutex after first use.',
    code: `type Book struct {
    mu   sync.Mutex
    bids map[float64]int
}
func (b *Book) Add(px float64, qty int) {
    b.mu.Lock()
    defer b.mu.Unlock()
    b.bids[px] += qty
}`,
    when: 'Shared maps, counters and caches touched by multiple goroutines.',
  },

  // ---------------- Networking ----------------
  {
    name: 'http.HandleFunc / ListenAndServe', header: 'net/http', cat: 'Networking', module: 1,
    summary: 'A production-grade HTTP server in a few lines.',
    what: '`ServeMux` routes by method and path, with wildcards (1.22). Each request runs on its own goroutine.',
    code: `mux := http.NewServeMux()
mux.HandleFunc("GET /prices/{sym}", func(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(prices[r.PathValue("sym")])
})
log.Fatal(http.ListenAndServe(":8080", mux))`,
    when: 'APIs, dashboards and webhooks. Most Go services start here.',
  },
  {
    name: 'http.Get / Client.Do', header: 'net/http', cat: 'Networking', module: 1,
    summary: 'Make HTTP requests.',
    what: '`http.Get` for quick requests. For real code, build a request with a context and use a `Client` with a timeout. Always close the body.',
    code: `client := &http.Client{Timeout: 5 * time.Second}
req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
req.Header.Set("Authorization", "Bearer "+token)
resp, err := client.Do(req)
if err != nil { return err }
defer resp.Body.Close()
if resp.StatusCode != http.StatusOK { return fmt.Errorf("status %s", resp.Status) }`,
    when: 'Calling APIs such as market data, webhooks and services. The default client has **no timeout**, so set one.',
  },
  {
    name: 'log/slog', header: 'log/slog', cat: 'Networking', module: 10,
    summary: 'Structured logging with levels and key/value pairs.',
    what: 'Logs records with a level, a message and attributes, as text or JSON. It is the standard library\'s structured logger (1.21).',
    code: `logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
logger.Info("order filled", "sym", "XAU", "qty", 10, "px", 2390.5)
// {"time":"...","level":"INFO","msg":"order filled","sym":"XAU","qty":10,"px":2390.5}
slog.Error("fetch failed", "url", u, "err", err)`,
    when: 'Services where logs are searched or shipped to a log system. Prefer it over `log.Printf` for new code.',
  },
]
