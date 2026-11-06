import type { Module } from '../types'

export const j09: Module = {
  n: 9,
  title: 'Processing Input and Output',
  tour: '9 · Processing Input and Output',
  summary: 'Bytes and characters, readers and writers, paths and files, talking HTTP, regular expressions, object serialisation with its risks, and an added lesson on dates and times.',
  topics: ['Streams, readers & writers', 'Paths & Files', 'The HTTP client', 'Regular expressions', 'Serialization', 'Dates & times'],
  cpp23: [
    'The HTTP client supports HTTP/3 (Java 26).',
    'UTF-8 is the default charset on every platform (since Java 18), which the book assumes.',
    '`Reader.of(CharSequence)` gives a lightweight reader over a string (Java 24).',
  ],
  lessons: [
    {
      id: 'streams-readers',
      title: 'Bytes, characters & readers',
      blocks: [
        { kind: 'analogy', text: "An `InputStream` is a pipe carrying raw bytes, and it has no idea what they mean. A `Reader` is the same pipe with a translator on the end who speaks a particular character encoding. Sending text through without stating the encoding is like asking the translator to guess the language." },
        { kind: 'code', code: `// BYTES: InputStream and OutputStream
try (InputStream in = Files.newInputStream(Path.of("data.bin"));
     OutputStream out = Files.newOutputStream(Path.of("copy.bin"))) {
    in.transferTo(out);                               // copies it all
}
byte[] all = Files.readAllBytes(Path.of("data.bin"));

// CHARACTERS: Reader and Writer, with an encoding
try (BufferedReader r = Files.newBufferedReader(Path.of("in.txt"), StandardCharsets.UTF_8)) {
    String line;
    while ((line = r.readLine()) != null) {
        System.out.println(line);
    }
}

// Bridging bytes to characters, as with a network stream
try (var r = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8))) {
    r.lines().forEach(System.out::println);
}

// Writing text
try (PrintWriter w = new PrintWriter(Files.newBufferedWriter(Path.of("out.txt")))) {
    w.printf("%s,%d%n", "XAU", 10);
}

// The one-liners for small files
String text = Files.readString(Path.of("in.txt"));
List<String> lines = Files.readAllLines(Path.of("in.txt"));
Files.writeString(Path.of("out.txt"), "hello\\n");
Files.write(Path.of("out.txt"), List.of("a", "b"), StandardOpenOption.APPEND);` },
        { kind: 'list', items: [
          'Java\'s I/O uses the **decorator pattern**: wrap a simple stream in another to add a feature, as in `new BufferedInputStream(in)`.',
          'A buffer avoids a system call per byte, and is a large speedup. `Files.newBufferedReader` provides one for you.',
          'Always close streams, using try-with-resources. Closing a wrapper closes what it wraps.',
          '`DataInputStream` and `DataOutputStream` read and write binary numbers in big-endian format. `ByteBuffer` handles other layouts.',
        ] },
        { kind: 'new23', text: "**UTF-8 is the default charset** everywhere since Java 18, so `Files.readString` and `new FileReader` behave the same across operating systems. It's still good practice to state the charset for data crossing a system boundary. Since **Java 24**, `Reader.of(\"text\")` gives a simple reader over a string." },
        { kind: 'pitfall', text: 'Java `InputStream` has nothing to do with the `Stream` API from module 8. They share only a word. Also, `Files.readAllLines` loads everything into memory: use `Files.lines` for large files.' },
        { kind: 'check', q: 'What is the main difference between `InputStream` and `Reader`?', options: ['`Reader` is always faster', '`InputStream` reads bytes; `Reader` reads characters decoded with a charset', '`Reader` only works on files', 'They are the same'], answer: 1, hint: 'Which one understands text?', explain: '`InputStreamReader` is the bridge between them: it decodes bytes into characters.' },
      ],
    },
    {
      id: 'paths-files',
      title: 'Paths, files & directories',
      blocks: [
        { kind: 'analogy', text: "A `Path` is an address written on an envelope: you can edit the address, combine it with others and tidy it up, all without anyone checking whether the house exists. `Files` is the postal worker who actually goes and knocks." },
        { kind: 'code', code: `Path base = Path.of("data", "2026");          // data/2026
Path file = base.resolve("trades.csv");        // data/2026/trades.csv
Path abs = file.toAbsolutePath();
Path sibling = file.resolveSibling("fills.csv");
Path parent = file.getParent();                // data/2026
Path name = file.getFileName();                // trades.csv
Path clean = Path.of("a/./b/../c").normalize();    // a/c

boolean there = Files.exists(file);
boolean isDir = Files.isDirectory(base);
long bytes = there ? Files.size(file) : 0;

Files.createDirectories(base);                 // like mkdir -p
Files.copy(file, base.resolve("backup.csv"), StandardCopyOption.REPLACE_EXISTING);
Files.move(file, sibling);
Files.deleteIfExists(sibling);
Path tmp = Files.createTempFile("trades", ".csv");

// Listing a directory: these streams hold OS resources, so close them
try (Stream<Path> entries = Files.list(base)) {
    entries.filter(p -> p.toString().endsWith(".csv")).forEach(System.out::println);
}

// Walking a whole tree
try (Stream<Path> tree = Files.walk(base)) {
    long total = tree.filter(Files::isRegularFile)
                     .mapToLong(p -> p.toFile().length())
                     .sum();
}` },
        { kind: 'list', items: [
          '`Path` and `Files` (package `java.nio.file`) replace the older `java.io.File`, whose methods often return `false` on failure instead of explaining why.',
          'A `Path` is just a value. `Path.of("nope.txt")` always succeeds, and only `Files` calls touch the disk.',
          'Paths are portable: use `resolve` rather than building strings with `/`.',
          'Between checking `Files.exists` and acting on it, the world can change. Just attempt the operation and handle the `IOException`.',
        ] },
        { kind: 'compare',
          python: `from pathlib import Path

file = Path("data") / "2026" / "trades.csv"
text = file.read_text()`,
          cpp: `namespace fs = std::filesystem;
fs::path file = fs::path{"data"} / "2026" / "trades.csv";
bool there = fs::exists(file);`,
          go: `file := filepath.Join("data", "2026", "trades.csv")
data, err := os.ReadFile(file)`,
          ts: `const file = path.join("data", "2026", "trades.csv")
const text = await fs.readFile(file, "utf8")`,
          java: `Path file = Path.of("data", "2026", "trades.csv");
String text = Files.readString(file);`,
          note: 'Same design as Python\'s `pathlib`, except Java separates the address (`Path`) from the operations (`Files`).' },
        { kind: 'check', q: 'What does `Path.of("does-not-exist.txt")` do?', options: ['Throws `FileNotFoundException`', 'Returns a `Path`: it does not touch the disk', 'Creates the file', 'Returns `null`'], answer: 1, hint: 'Is a Path a file, or an address?', explain: 'A `Path` is only a description. `Files.readString(path)` is what would throw `NoSuchFileException`.' },
      ],
    },
    {
      id: 'http',
      title: 'HTTP connections',
      blocks: [
        { kind: 'analogy', text: "`HttpClient` is the company's mailroom: set it up once, and it handles the connections, pooling and protocol. `HttpRequest` is one letter. A `BodyHandler` tells the mailroom what to do with the reply: bring it to me as a string, save it to a file, or pass it along line by line." },
        { kind: 'code', code: `try (HttpClient client = HttpClient.newBuilder()      // closeable since Java 21
        .connectTimeout(Duration.ofSeconds(5))
        .followRedirects(HttpClient.Redirect.NORMAL)
        .build()) {

    HttpRequest get = HttpRequest.newBuilder(URI.create("https://example.com/prices"))
        .timeout(Duration.ofSeconds(10))
        .header("Accept", "application/json")
        .GET()
        .build();

    HttpResponse<String> res = client.send(get, HttpResponse.BodyHandlers.ofString());
    System.out.println(res.statusCode());
    System.out.println(res.body());

    HttpRequest post = HttpRequest.newBuilder(URI.create("https://example.com/orders"))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString("""
            {"sym": "XAU", "qty": 10}
            """))
        .build();

    // Asynchronous: returns a CompletableFuture immediately (module 10)
    client.sendAsync(post, HttpResponse.BodyHandlers.ofString())
          .thenApply(HttpResponse::body)
          .thenAccept(System.out::println)
          .join();
}` },
        { kind: 'list', items: [
          '`java.net.http.HttpClient` handles HTTP/1.1 and HTTP/2, and replaces the clumsy `HttpURLConnection`.',
          'A non-2xx response is **not** an exception. Always check `statusCode()`.',
          'Create one client and reuse it, since it pools connections.',
          'For JSON, the JDK has no parser in the standard library. Use Jackson or Gson.',
        ] },
        { kind: 'new23', text: "**Java 26** added HTTP/3 support: ask for it by calling `.version(Version.HTTP_3)` on the client builder. The default stays HTTP/2, with a fallback if the server doesn't support the newer protocol." },
        { kind: 'pitfall', text: 'A timeout isn\'t set by default: without `.timeout(...)`, a stuck server can hang your thread indefinitely. Set both a connect timeout on the client and a request timeout.' },
        { kind: 'check', q: 'A server replies with 404. What does `client.send(...)` do?', options: ['Throws `FileNotFoundException`', 'Returns a response whose `statusCode()` is 404', 'Returns `null`', 'Retries automatically'], answer: 1, hint: 'Did the HTTP exchange itself work?', explain: 'Only transport failures throw. An HTTP error status is a normal response, and you must check it.' },
      ],
    },
    {
      id: 'regex',
      title: 'Regular expressions',
      blocks: [
        { kind: 'analogy', text: "A regex is a stencil you slide along the text, looking for places where it fits. `Pattern` is the stencil, cut once and reusable. `Matcher` is one trip along one piece of text, remembering where it found a fit." },
        { kind: 'code', code: `// Precompile: making a Pattern is relatively expensive, and it's thread-safe
private static final Pattern ORDER =
    Pattern.compile("(?<side>BUY|SELL)\\\\s+(?<sym>[A-Z]{3})\\\\s+(?<qty>\\\\d+)");

Matcher m = ORDER.matcher("BUY XAU 10");
if (m.matches()) {                             // the whole string must match
    String side = m.group("side");             // named group
    int qty = Integer.parseInt(m.group("qty"));
    String all = m.group();                    // the whole match
}

// find(): each match anywhere in the text
Matcher nums = Pattern.compile("\\\\d+").matcher("10 at 2390, 5 at 2401");
while (nums.find()) {
    System.out.println(nums.group());
}

// Results as a stream
List<String> found = Pattern.compile("\\\\d+")
    .matcher("10 at 2390")
    .results()
    .map(MatchResult::group)
    .toList();

// On String directly (compiles a new Pattern on most calls)
"a1b2".replaceAll("\\\\d", "#");                 // a#b#
"2026-11-06".replaceAll("(\\\\d+)-(\\\\d+)-(\\\\d+)", "$3/$2/$1");   // 06/11/2026
"a, b;c".split("[,;]\\\\s*");                    // [a, b, c]
"XAU".matches("[A-Z]+");                       // true

// Flags
Pattern.compile("xau", Pattern.CASE_INSENSITIVE);` },
        { kind: 'list', items: [
          '`matches` requires the entire string to match. `find` looks for any occurrence. `lookingAt` matches from the start.',
          'Regex syntax has backslashes, and Java string literals have backslashes too, so `\\\\d` in source is the regex `\\d`.',
          'Common syntax: `.` any character, `\\d` digit, `\\w` word character, `\\s` whitespace, `*` zero or more, `+` one or more, `?` optional, `{n,m}` repetition, `[abc]` a set, `(...)` a group, `^` and `$` anchors.',
          '`Pattern.quote(s)` treats a string as literal, which is essential for user-provided text.',
        ] },
        { kind: 'pitfall', text: '`split` drops trailing empty strings: `"a,b,,".split(",")` has only two elements. Use `split(",", -1)` to keep them. And since `split` takes a regex, `"1.5".split(".")` returns an empty array: write `split("\\\\.")`.' },
        { kind: 'check', q: 'What does this return?', code: `"BUY XAU".matches("XAU")`, options: ['`true`, since XAU appears in the string', '`false`, since `matches` must cover the whole string', 'A `Matcher`', 'It throws'], answer: 1, hint: 'What is the difference between `matches` and `find`?', explain: '`matches` needs the entire input to fit. For "contains", compile a `Pattern` and call `find()` on its matcher.' },
      ],
    },
    {
      id: 'serialization',
      title: 'Serialization',
      blocks: [
        { kind: 'analogy', text: "Java serialisation freeze-dries an object graph into bytes, and rehydrates it elsewhere, without running the normal constructor. It's like a teleporter that rebuilds a person directly from a parcel of atoms, skipping the front desk. So if somebody tampers with the parcel, nobody at the front desk ever checks who walks out." },
        { kind: 'code', code: `public record Position(String sym, int qty) implements Serializable {}

// Write
try (var out = new ObjectOutputStream(Files.newOutputStream(Path.of("pos.bin")))) {
    out.writeObject(new Position("XAU", 10));
}

// Read
try (var in = new ObjectInputStream(Files.newInputStream(Path.of("pos.bin")))) {
    in.setObjectInputFilter(ObjectInputFilter.Config.createFilter(
        "com.example.*;java.base/*;!*"));        // an allow-list
    Position p = (Position) in.readObject();
}

public class Session implements Serializable {
    private static final long serialVersionUID = 1L;  // a version you control
    private String user;
    private transient Socket socket;                  // transient: not saved
}` },
        { kind: 'list', items: [
          '`Serializable` is a marker interface, with no methods. All non-`transient` fields must be serializable too.',
          'Regular classes are rebuilt without running their constructors. Records go through their canonical constructor, which makes them safer.',
          'Without an explicit `serialVersionUID`, almost any change to the class breaks reading old data.',
          'For most data exchange, use a documented format instead: JSON, Protocol Buffers or Avro.',
        ] },
        { kind: 'pitfall', text: 'Never call `readObject` on bytes from an untrusted source. Deserialisation attacks have led to remote code execution in many real systems. If you must deserialise, use an `ObjectInputFilter` allow-list.' },
        { kind: 'check', q: 'What does `transient` do on a field?', options: ['Makes it thread-safe', 'Excludes it from serialisation', 'Makes it final', 'Deletes it after use'], answer: 1, hint: 'Think about a `Socket` field.', explain: 'Transient fields are skipped when saved, and get their default value when read back.' },
      ],
    },
    {
      id: 'dates',
      title: 'Dates & times',
      blocks: [
        { kind: 'analogy', text: "A date on a birthday card and a moment on a stopwatch are different things. \"6 November\" means a different instant in Tokyo and in London, whereas a stopwatch reading is the same instant everywhere. `java.time` gives each idea its own type, so the compiler stops you from confusing them." },
        { kind: 'code', code: `LocalDate day = LocalDate.of(2026, 11, 6);          // a calendar date, no zone
LocalDate later = day.plusMonths(1);                // immutable: returns a new object
LocalTime open = LocalTime.of(9, 30);
LocalDateTime when = day.atTime(open);              // still no zone

Instant now = Instant.now();                        // a point on the UTC timeline
Duration took = Duration.between(now, Instant.now());    // hours, minutes, seconds
Period gap = Period.between(day, later);            // years, months, days

ZonedDateTime ny = when.atZone(ZoneId.of("America/New_York"));
ZonedDateTime ldn = ny.withZoneSameInstant(ZoneId.of("Europe/London"));

var fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
String text = day.format(fmt);                      // 06/11/2026
LocalDate back = LocalDate.parse("06/11/2026", fmt);` },
        { kind: 'list', items: [
          '`Instant` for machine timestamps, `LocalDate` for calendar dates, and `ZonedDateTime` when a wall-clock time in a real place matters.',
          '`Duration` measures exact time, and `Period` measures calendar units. A month has no fixed number of seconds.',
          'Every type is immutable and thread-safe, including `DateTimeFormatter`.',
          'Avoid the legacy `java.util.Date`, `Calendar` and `SimpleDateFormat`: mutable, error-prone, and with months numbered from 0.',
          'Store and transmit UTC instants, and convert to a zone only for display.',
        ] },
        { kind: 'pitfall', text: 'A day isn\'t always 24 hours. Across a daylight-saving change, `plusDays(1)` on a `ZonedDateTime` keeps the wall-clock time, but `plus(Duration.ofHours(24))` keeps the elapsed time, so the two can differ by an hour.' },
        { kind: 'check', q: 'Which type represents a single moment, independent of any time zone?', options: ['`LocalDateTime`', '`LocalDate`', '`Instant`', '`Period`'], answer: 2, hint: 'Which one is a point on the UTC timeline?', explain: '`Instant` is a timestamp. `LocalDateTime` has no zone, so by itself it does not identify a moment.' },
      ],
    },
  ],
  quiz: [
    { q: 'What should you use to read a large file line by line?', options: ['`Files.readAllLines`', '`Files.lines` or `BufferedReader`', '`Files.readAllBytes`', '`Path.of`'], answer: 1, explain: 'They read lazily, so memory use stays small. Close the stream.' },
    { q: 'What is the default charset in modern Java?', options: ['Whatever the platform uses', 'UTF-8', 'ASCII', 'UTF-16'], answer: 1, explain: 'It has been UTF-8 by default since Java 18.' },
    { q: 'Which class holds operations such as copy, move and read?', options: ['`Path`', '`Files`', '`File`', '`Paths`'], answer: 1, explain: '`Path` describes a location, and `Files` acts on it.' },
    { q: 'What needs try-with-resources?', options: ['`List.stream()`', '`Files.list(dir)`', '`Stream.of(1, 2)`', '`IntStream.range(0, 3)`'], answer: 1, explain: 'Streams that are backed by OS resources must be closed.' },
    { q: 'What does the HTTP client do on a 500 response?', options: ['Throws an exception', 'Returns a normal response; you check `statusCode()`', 'Returns `null`', 'Exits'], answer: 1, explain: 'Status codes are data. Only transport failures throw.' },
    { q: 'What is `\\\\d+` in a Java string?', options: ['Two backslashes in the regex', 'The regex `\\d+`: one or more digits', 'A compile error', 'A literal "d+"'], answer: 1, explain: 'The string literal consumes one level of escaping.' },
    { q: 'Why not use `readObject` on untrusted input?', options: ['It is slow', 'It can run dangerous code paths during deserialisation', 'It is deprecated', 'It only reads text'], answer: 1, explain: 'Deserialisation bypasses constructors and has caused many remote-code-execution flaws.' },
    { q: 'What is the difference between `find()` and `matches()`?', options: ['None', '`find` looks for any occurrence; `matches` requires the whole input to match', '`matches` is faster', '`find` needs a group'], answer: 1, explain: 'Call `find` in a loop to walk through each match.' },
  ],
}
