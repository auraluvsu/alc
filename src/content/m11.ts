import type { Module } from './types'

export const m11: Module = {
  n: 11,
  title: 'Input & Output',
  tour: '11 · Input and Output',
  summary: 'Formatted printing, streams and their error states, printing your own types, files, in-memory streams and the filesystem library.',
  topics: ['Formatted output', 'Streams & I/O state', 'I/O of user-defined types', 'Files & string streams', 'std::filesystem', 'C-style I/O'],
  cpp23: [
    '`std::print` / `std::println` print straight to stdout (or any `FILE*` / `ostream`), handling Unicode properly on Windows consoles.',
    'Ranges, `pair`, `tuple` and containers can be formatted directly: `std::println("{}", vec)` prints `[1, 2, 3]`.',
    '`<spanstream>`: streams over a fixed buffer you provide, with no allocation.',
  ],
  lessons: [
    {
      id: 'format',
      title: 'Formatted output',
      blocks: [
        { kind: 'analogy', text: "A format string is a printed form with blanks: `\"{} bought {} at {:.2f}\"`. You hand over the values and the form is filled in, with each blank knowing how to display its value. The compiler even checks that you supplied the right number of values." },
        { kind: 'code', code: `std::println("Hello, {}!", name);
std::println("{} x {} @ {:.2f}", sym, qty, px);        // positional, in order
std::println("{1} then {0}", "a", "b");                  // explicit indices: "b then a"
std::println("|{:>10}|{:<10}|{:^10}|", "r", "l", "c");   // align right/left/centre in width 10
std::println("{:08.3f}", 3.14159);                       // 0003.142: zero-pad, width 8
std::println("{:+}", 5);                                  // +5
std::println("{:#x} {:b} {:e}", 255, 5, 1234.5);          // 0xff 101 1.234500e+03
std::println("{:%Y-%m-%d}", std::chrono::system_clock::now());  // dates too

std::string s = std::format("{:>8.2f}", 2390.5);          // format to a string
std::println(stderr, "warning: {}", msg);                 // to stderr` },
        { kind: 'p', text: "The format spec after `:` reads `[fill][align][sign][#][0][width][.precision][type]`. The format string is checked at **compile time**: too few arguments, or `{:d}` on a string, is a compile error." },
        { kind: 'new23', text: "C++23 formats ranges and tuples directly: `std::println(\"{}\", std::vector{1, 2, 3})` prints `[1, 2, 3]`, and a `std::map` prints `{\"a\": 1}`. `{:n}` drops the brackets. Before this you needed a loop or a library." },
        { kind: 'compare',
          python: `print(f"{sym} x {qty} @ {px:.2f}")
print(f"|{'r':>10}|{'l':<10}|")
print([1, 2, 3])`,
          ts: "console.log(`${sym} x ${qty} @ ${px.toFixed(2)}`)\nconsole.log(`|${'r'.padStart(10)}|`)\nconsole.log([1, 2, 3])",
          go: `fmt.Printf("%s x %d @ %.2f\\n", sym, qty, px)
fmt.Printf("|%10s|%-10s|\\n", "r", "l")
fmt.Println([]int{1, 2, 3})`,
          java: `System.out.printf("%s x %d @ %.2f%n", sym, qty, px);
System.out.printf("|%10s|%-10s|%n", "r", "l");
System.out.println(List.of(1, 2, 3));`,
          cpp: `std::println("{} x {} @ {:.2f}", sym, qty, px);
std::println("|{:>10}|{:<10}|", "r", "l");
std::println("{}", std::vector{1, 2, 3});   // [1, 2, 3]`,
          note: "The `{}` mini-language was borrowed from Python's `str.format`, so Python developers will find it familiar." },
        { kind: 'check', q: 'What does `std::println("[{:>6.1f}]", 3.14159)` print?', options: ['`[3.1]`', '`[   3.1]`', '`[3.1   ]`', '`[ 3.14]`'], answer: 1, hint: 'Width 6, right-aligned, one decimal place.', explain: '"3.1" is 3 characters, right-aligned in 6, so three leading spaces.' },
      ],
    },
    {
      id: 'streams',
      title: 'Streams & I/O state',
      blocks: [
        { kind: 'analogy', text: "A stream is a conveyor belt of characters with a status light. Green means all good. If you ask for a number and a word comes along, the light turns red (`fail`) and the belt stops until you reset it. At the end of the belt, the light shows `eof`." },
        { kind: 'code', code: `std::cout << "qty? ";                 // the classic output stream
int qty;
if (std::cin >> qty) {                 // >> skips whitespace, reads an int
    std::println("got {}", qty);
} else {
    std::cin.clear();                  // reset the error state
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\\n');   // discard the bad line
}

std::string line;
while (std::getline(std::cin, line)) {  // read whole lines until EOF
    // process line
}` },
        { kind: 'list', items: [
          'States: `good()`, `eof()` (end reached), `fail()` (format error, e.g. letters for an int), `bad()` (the stream itself is broken).',
          'A stream converts to `bool` (true while good), which is why `while (std::getline(in, line))` is the idiomatic read loop.',
          '`>>` reads whitespace-separated tokens. `std::getline` reads a whole line, including spaces.',
          '`std::cout` is buffered. `std::endl` flushes on every use, which is slow in loops. Use `\'\\n\'`.',
        ] },
        { kind: 'pitfall', text: "Mixing `std::cin >> x` and `std::getline` trips everyone up once: `>>` leaves the newline in the buffer, so the next `getline` reads an empty line. Call `std::cin.ignore()` or read everything with `getline` and parse it." },
        { kind: 'check', q: 'Input is "abc". What state is `std::cin` in after `int n; std::cin >> n;`?', options: ['good, n = 0', 'fail', 'eof', 'bad'], answer: 1, hint: 'Letters arrived where a number was expected.', explain: 'A format mismatch sets `failbit`, and further reads do nothing until you `clear()`. (Since C++11, `n` is set to 0.)' },
      ],
    },
    {
      id: 'udt',
      title: 'Printing your own types',
      blocks: [
        { kind: 'analogy', text: "To let the form-filler handle your type, you hand it a small instruction card: \"for a `Money`, show the pence as pounds with two decimals\". There are two kinds of card: one for streams (`operator<<`) and one for `std::format`/`println` (a `std::formatter` specialisation)." },
        { kind: 'code', code: `struct Money { std::int64_t pence; };

// 1. For streams
std::ostream& operator<<(std::ostream& os, Money m) {
    return os << "£" << m.pence / 100 << '.' << std::setw(2) << std::setfill('0') << m.pence % 100;
}

// 2. For std::format / std::println: reuse double's formatter, so specs like {:>10.2f} still work
template<>
struct std::formatter<Money> : std::formatter<double> {
    auto format(Money m, std::format_context& ctx) const {
        return std::formatter<double>::format(m.pence / 100.0, ctx);
    }
};

Money m {239050};
std::cout << m << '\\n';          // £2390.50
std::println("{:>10.2f}", m);     //    2390.50` },
        { kind: 'p', text: "Reading works the same way with `operator>>(std::istream&, T&)`. When parsing fails, set the stream's failbit (`is.setstate(std::ios::failbit)`) so callers see the error the normal way." },
        { kind: 'check', q: 'Why does `operator<<` return `std::ostream&`?', options: ['Required by the compiler', 'So calls can be chained: `os << a << b`', 'To flush the stream', 'To report errors'], answer: 1, hint: 'What is `(os << a)` used as in `os << a << b`?', explain: 'Each `<<` returns the stream, which becomes the left operand of the next `<<`.' },
      ],
    },
    {
      id: 'files',
      title: 'Files, string streams & the filesystem',
      blocks: [
        { kind: 'analogy', text: "File streams are the same conveyor belt plugged into a file instead of the keyboard. String streams plug it into a string in memory. `std::filesystem` is the building plan: which rooms (directories) and boxes (files) exist, how big they are, and how to move them." },
        { kind: 'code', code: `// Read a CSV of prices: RAII closes the file automatically
std::ifstream in {"prices.csv"};
if (!in) throw std::runtime_error{"can't open prices.csv"};
std::vector<double> closes;
for (std::string line; std::getline(in, line);) {
    std::istringstream row {line};           // a stream over one line
    std::string date, close;
    std::getline(row, date, ',');
    std::getline(row, close, ',');
    closes.push_back(std::stod(close));
}

std::ofstream out {"report.txt"};           // truncates; std::ios::app to append
std::println(out, "{} rows", closes.size()); // println works on ostreams too (C++23)` },
        { kind: 'code', code: `namespace fs = std::filesystem;

fs::path dir = "data";
fs::create_directories(dir / "2024");        // operator/ joins paths portably
for (const auto& e : fs::recursive_directory_iterator(dir)) {
    if (e.is_regular_file() && e.path().extension() == ".csv")
        std::println("{} ({} bytes)", e.path().string(), e.file_size());
}
if (fs::exists("old.csv")) fs::rename("old.csv", dir / "old.csv");` },
        { kind: 'new23', text: "`<spanstream>`'s `std::ispanstream` / `std::ospanstream` work over a `std::span<char>` you supply: stream formatting into a fixed buffer with no heap allocation. They replace the long-deprecated `strstream`." },
        { kind: 'h', text: 'C-style I/O' },
        { kind: 'p', text: "`printf`/`scanf` from `<cstdio>` still work and you will see them in older code. They aren't type-safe: `printf(\"%d\", 2.5)` compiles and prints garbage. `std::print` gives the same speed with compile-time checking, so prefer it for new code." },
        { kind: 'check', q: 'How do you join a directory and filename portably?', options: ['`dir + "/" + name`', '`dir / name` with `std::filesystem::path`', '`path.join(dir, name)`', '`dir.append_str(name)`'], answer: 1, hint: 'Windows uses a different separator.', explain: '`operator/` on `fs::path` inserts the right separator for the platform.' },
      ],
    },
  ],
  quiz: [
    { q: 'When is a `std::format` string checked?', options: ['At runtime', 'At compile time', 'Never', 'At link time'], answer: 1, explain: 'A mismatched or invalid format string is a compile error.' },
    { q: 'What prints `[1, 2, 3]` in C++23?', options: ['`std::cout << vec;`', '`std::println("{}", vec);`', '`printf("%v", vec);`', '`std::print(vec);`'], answer: 1, explain: 'Range formatting arrived in C++23; streams still have no `<<` for vectors.' },
    { q: 'What is the idiomatic loop for reading lines?', options: ['`while (!in.eof()) getline(in, l);`', '`while (std::getline(in, line))`', '`for (;;) in >> line;`', '`in.read_lines()`'], answer: 1, explain: 'Testing `eof()` first processes the last line twice or reads garbage; test the read itself.' },
    { q: 'After a failed `>>`, what must you do before reading again?', options: ['Nothing', 'Call `clear()` (and usually discard the bad input)', 'Reopen the stream', 'Call `flush()`'], answer: 1, explain: 'A failed stream ignores all operations until its state is cleared.' },
    { q: 'Why avoid `std::endl` in tight loops?', options: ['It is deprecated', 'It flushes the buffer every time', 'It doesn\'t print a newline on Windows', 'It throws'], answer: 1, explain: "Use '\\n' and flush once at the end, or let the stream do it." },
    { q: 'How do you make `std::println("{}", myType)` work?', options: ['Overload `operator<<` only', 'Specialise `std::formatter<MyType>`', 'Add a `toString()` method', 'Inherit from `std::formattable`'], answer: 1, explain: 'The format library uses formatter specialisations, not stream operators.' },
    { q: 'What does `std::ifstream` do if the file is missing?', options: ['Throws by default', 'Its state is set to fail; check with `if (!in)`', 'Creates the file', 'Crashes'], answer: 1, explain: 'Streams report errors through state unless you enable exceptions with `in.exceptions(...)`.' },
    { q: 'Main problem with `printf`?', options: ['Too slow', 'Not type-safe: format/argument mismatches are UB', 'Can\'t print floats', 'Not in C++'], answer: 1, explain: '`std::print` checks types and argument counts at compile time.' },
  ],
}
