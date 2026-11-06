import type { Module } from './types'

export const m10: Module = {
  n: 10,
  title: 'Strings & Regular Expressions',
  tour: '10 · Strings and Regular Expressions',
  summary: 'Owning strings, cheap non-owning views of text, fast number parsing, and pattern matching with regular expressions.',
  topics: ['std::string', 'std::string_view', 'Parsing numbers', 'Regular expressions'],
  cpp23: [
    '`str.contains("x")` on both `string` and `string_view`.',
    '`string::resize_and_overwrite` for filling a buffer without zero-initialising it first.',
    'Constructing a `string` or `string_view` from `nullptr` is now a compile error instead of a crash.',
    '`std::string_view` can be constructed from a contiguous range.',
  ],
  lessons: [
    {
      id: 'string',
      title: 'std::string',
      blocks: [
        { kind: 'analogy', text: "A `std::string` is a notebook you own: you can write, erase and tear out pages, and when you are done it goes in the bin with you. Short notes fit on a sticky label kept inside the cover (small-string optimisation), so they need no separate notebook at all." },
        { kind: 'code', code: `std::string sym = "XAU";
sym += "/USD";                         // append (mutates in place)
std::string pair = sym + " spot";      // concatenation makes a new string

sym.size();                            // 7: bytes, not characters
sym[0] = 'x';                          // strings are mutable
sym.substr(4, 3);                      // "USD": a new string
sym.find('/');                         // 3, or std::string::npos if absent
sym.starts_with("xau");                // true (C++20)
sym.contains("USD");                   // true (C++23)
sym.replace(0, 3, "XAG");              // "XAG/USD"

if (sym == "XAG/USD") {}               // == compares contents` },
        { kind: 'list', items: [
          'A `std::string` owns a contiguous, mutable sequence of `char`. Copying it copies the characters (value semantics).',
          '**Small-string optimisation (SSO)**: short strings (typically ≤15 bytes) are stored inside the object itself, with no heap allocation.',
          'It holds **bytes**, not characters. UTF-8 text works fine for storage, but `size()` counts bytes, and indexing can split a multi-byte character.',
          '`s.c_str()` gives a null-terminated `const char*` for C APIs.',
        ] },
        { kind: 'pitfall', text: '`"a" + "b"` doesn\'t compile: both are `const char*`. At least one side must be a `std::string`: `"a"s + "b"` (with `using namespace std::literals`) or `std::string{"a"} + "b"`.' },
        { kind: 'new23', text: '`s.resize_and_overwrite(n, op)` grows a string and lets `op` write straight into the buffer, skipping the zero-fill that `resize` does. It is a niche but real win when building large strings, e.g. serialising market data.' },
        { kind: 'check', q: 'What is `std::string{"café"}.size()` with UTF-8 source?', options: ['4', '5', '6', 'Depends on locale'], answer: 1, hint: 'How many bytes does "é" take in UTF-8?', explain: '"é" is 2 bytes in UTF-8, so 3 + 2 = 5. `std::string` counts bytes.' },
      ],
    },
    {
      id: 'view',
      title: 'std::string_view',
      blocks: [
        { kind: 'analogy', text: "A `string_view` is a magnifying glass held over someone else's notebook: a pointer to where the text starts, plus a length. It is tiny and free to copy, and it can look at any text without copying it. But if the notebook is thrown away, you're holding a magnifying glass over nothing." },
        { kind: 'code', code: `int count_commas(std::string_view line) {    // accepts string, literal, char*, substring...
    return std::ranges::count(line, ',');
}
count_commas("a,b,c");                        // no std::string created
count_commas(some_std_string);

std::string_view sv = "2024-11-05,2390.50";
auto date = sv.substr(0, 10);                 // still a view: no allocation
sv.remove_prefix(11);                          // now "2390.50"` },
        { kind: 'list', items: [
          'Use `std::string_view` for **read-only parameters**. It accepts every kind of string without copying.',
          '`substr` on a view returns another view, so splitting and parsing allocate nothing.',
          'A view is **not** null-terminated, so don\'t pass `sv.data()` to a C function expecting a C string.',
        ] },
        { kind: 'stepper', title: 'Step through: a view that outlives its string', code: [
          'std::string_view first_word(const std::string& s) {',
          '    return std::string_view{s}.substr(0, s.find(\' \'));',
          '}',
          'auto w = first_word(std::string{"gold rally"});',
          'std::println("{}", w);   // ???',
        ], steps: [
          { line: 4, note: 'A **temporary** `std::string` is created to pass to `first_word`.', memory: [{ name: 'temporary string', value: '"gold rally"', kind: 'heap' }] },
          { line: 2, note: 'The function returns a view pointing into the temporary\'s characters.', memory: [{ name: 'temporary string', value: '"gold rally"', kind: 'heap' }, { name: 'returned view', value: 'ptr → "gold", len 4', kind: 'ptr' }] },
          { line: 4, note: 'End of the full expression: the temporary is **destroyed**. `w` still points at its old memory.', memory: [{ name: 'temporary string', value: 'destroyed', kind: 'dead' }, { name: 'w', value: 'ptr → freed memory, len 4', kind: 'ptr', note: 'dangling' }] },
          { line: 5, note: 'Reading `w` is undefined behaviour. It may print "gold", garbage, or crash.', memory: [{ name: 'w', value: 'dangling', kind: 'dead' }] },
        ] },
        { kind: 'pitfall', text: 'Never **return** a `string_view` into a local or temporary string, and never store a view in a struct unless something else guarantees the text outlives it. Views are for passing down the call stack, not up.' },
        { kind: 'check', q: 'Best type to **store** a symbol name in a long-lived `Order` struct?', options: ['`std::string_view`', '`std::string`', '`const char*`', '`std::string&`'], answer: 1, hint: 'Who keeps the characters alive?', explain: 'The struct must own its text. A view or pointer would dangle once the source string goes away.' },
      ],
    },
    {
      id: 'numbers',
      title: 'Numbers ↔ text',
      blocks: [
        { kind: 'analogy', text: "There are three tools for turning text into numbers. `std::stoi` and friends are a friendly clerk who complains loudly (throws) when confused. Streams are a whole post office. `std::from_chars` is a barcode scanner: no fuss, no locale, no allocation, and the fastest of the three by a wide margin." },
        { kind: 'code', code: `// Convenient, throws std::invalid_argument / std::out_of_range:
int    q = std::stoi("42");
double p = std::stod("2390.5");

// Fast, no exceptions, no allocation, locale-independent:
std::string_view field = "2390.50";
double px{};
auto [ptr, ec] = std::from_chars(field.data(), field.data() + field.size(), px);
if (ec == std::errc{} && ptr == field.data() + field.size()) {
    // parsed the whole field
}

// Numbers to text:
std::string s = std::to_string(42);                 // simple
std::string f = std::format("{:.2f}", 2390.5);      // "2390.50", with control (module 11)` },
        { kind: 'p', text: "For parsing files with millions of rows (tick data, CSVs), `from_chars` over `string_view` slices is the standard high-performance pattern: no allocation per field." },
        { kind: 'check', q: 'Why is `ptr` checked against the end in the `from_chars` example?', options: ['To detect overflow', 'To make sure the whole field was a number, not just a prefix like "12abc"', 'It is required to free memory', 'For thread safety'], answer: 1, hint: '`from_chars` stops at the first character it can\'t use.', explain: 'It parses the longest valid prefix and reports where it stopped. Trailing junk is only caught if you check `ptr`.' },
      ],
    },
    {
      id: 'regex',
      title: 'Regular expressions',
      blocks: [
        { kind: 'analogy', text: "A regex is a stencil you slide over text to find the shapes that fit. `std::regex` is a correct, general-purpose stencil kit, but a slow one. Fine for config files and tools, wrong for a hot loop." },
        { kind: 'code', code: `// Raw string literals R"(...)" avoid escaping every backslash
std::regex pat {R"((\\w+)/(\\w+)\\s+(\\d+\\.\\d+))"};     // e.g. "XAU/USD 2390.50"

std::smatch m;
std::string line = "XAU/USD 2390.50";
if (std::regex_search(line, m, pat)) {
    std::println("base={} quote={} px={}", m[1].str(), m[2].str(), m[3].str());
}

bool ok = std::regex_match("2024-11-05", std::regex{R"(\\d{4}-\\d{2}-\\d{2})"});   // whole string

// iterate over every match
std::string text = "AAPL 189.2, MSFT 410.1, NVDA 135.7";
std::regex tick {R"(([A-Z]+) (\\d+\\.\\d))"};
for (const auto& mm : std::ranges::subrange(
         std::sregex_iterator(text.begin(), text.end(), tick), std::sregex_iterator{}))
    std::println("{} -> {}", mm[1].str(), mm[2].str());` },
        { kind: 'list', items: [
          '`regex_match`: the **whole** string must match. `regex_search`: find a match **anywhere**.',
          'The default syntax is ECMAScript, essentially JavaScript regex syntax.',
          'Construct a `std::regex` once and reuse it. Construction is expensive.',
        ] },
        { kind: 'pitfall', text: '`std::regex` is notoriously slow and can\'t be fixed without breaking compatibility. For performance-sensitive work, use CTRE (compile-time regex) or RE2, or hand-write the parser with `string_view` + `from_chars`.' },
        { kind: 'check', q: 'Which call fails to match "Price: 42"?', options: ['`regex_search(s, std::regex{R"(\\d+)"})`', '`regex_match(s, std::regex{R"(\\d+)"})`', 'Both match', 'Neither matches'], answer: 1, hint: 'One of them insists on the entire string.', explain: '`regex_match` requires the whole string to be digits. `regex_search` finds "42" inside it.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does small-string optimisation do?', options: ['Compresses strings', 'Stores short strings inside the object, avoiding heap allocation', 'Shares identical strings', 'Uses UTF-16'], answer: 1, explain: 'Typical inline capacity is around 15 (libstdc++) to 22 (libc++) bytes.' },
    { q: '`std::string_view` is best for…', options: ['storing text long-term', 'read-only string parameters', 'building strings', 'thread-safe sharing'], answer: 1, explain: 'It is a non-owning (pointer, length) pair.' },
    { q: 'Which is null-terminated?', options: ['`string_view::data()`', '`string::c_str()`', 'Both', 'Neither'], answer: 1, explain: 'Only `std::string` guarantees a terminator; a view may point into the middle of text.' },
    { q: 'What does `std::from_chars` do on invalid input?', options: ['Throws', 'Returns an error code in its result', 'Returns 0 silently', 'Aborts'], answer: 1, explain: 'It reports `std::errc::invalid_argument` or `result_out_of_range`, with no exceptions.' },
    { q: 'Which line correctly produces the string "ab"?', options: ['`auto s = "a" + "b";`', '`auto s = std::string{"a"} + "b";`', '`std::string s = \'a\' + "b";`', 'All of them'], answer: 1, explain: 'Adding two string literals is a compile error. `\'a\' + "b"` compiles, but it is pointer arithmetic (97 bytes past "b"), which is UB. Only a `std::string` on one side concatenates.' },
    { q: '`regex_match` vs `regex_search`:', options: ['Identical', 'match = whole string, search = any substring', 'match is faster always', 'search requires anchors'], answer: 1, explain: 'Use search to find, match to validate.' },
    { q: 'Which C++23 member was added to `std::string`?', options: ['`split()`', '`contains()`', '`trim()`', '`format()`'], answer: 1, explain: '`contains` joined `starts_with`/`ends_with` (C++20). There is still no standard trim or split member.' },
    { q: 'What is `std::string{"€"}.size()` in UTF-8?', options: ['1', '2', '3', '4'], answer: 2, explain: 'The euro sign takes 3 bytes in UTF-8.' },
  ],
}
