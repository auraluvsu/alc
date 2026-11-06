import type { Module } from '../types'

export const f08: Module = {
  n: 8,
  title: 'Text & Files',
  tour: 'Data',
  summary: 'Working with text: strings as sequences of characters, common string operations, formatting numbers into readable output, reading input from the user, and saving to and reading from files so data outlives the program.',
  topics: ['Strings as sequences', 'Everyday string operations', 'Formatting output', 'Reading input', 'Reading & writing files'],
  cpp23: ['Python f-strings, TypeScript template literals, Go `fmt.Sprintf`, Java `String.format` and C++20 `std::format` all do the same job: put values into text.'],
  lessons: [
    {
      id: 'sequence',
      title: 'Strings as sequences',
      blocks: [
        { kind: 'analogy', text: "A string is a list of characters, like beads on a thread. So everything you learned about lists mostly applies: it has a length, you can get the character at position 0, and you can take a slice from the middle. Unlike most lists, though, strings usually can't be changed in place; operations give you a new string." },
        { kind: 'poly',
          pseudo: `set word to "trading"
display length of word        # 7
display character 0 of word   # t
display characters 0 to 3     # trad`,
          python: `word = "trading"
print(len(word))       # 7
print(word[0])         # t
print(word[0:4])       # trad: positions 0, 1, 2, 3
print(word[-3:])       # ing`,
          ts: `const word = "trading";
console.log(word.length);        // 7
console.log(word[0]);            // t
console.log(word.slice(0, 4));   // trad
console.log(word.slice(-3));     // ing`,
          go: `word := "trading"
fmt.Println(len(word))         // 7 (bytes; fine for plain English text)
fmt.Println(string(word[0]))   // t
fmt.Println(word[0:4])         // trad
fmt.Println(word[len(word)-3:]) // ing`,
          java: `String word = "trading";
System.out.println(word.length());          // 7
System.out.println(word.charAt(0));         // t
System.out.println(word.substring(0, 4));   // trad
System.out.println(word.substring(word.length() - 3));   // ing`,
          cpp: `std::string word = "trading";
std::cout << word.size() << '\\n';                   // 7
std::cout << word[0] << '\\n';                       // t
std::cout << word.substr(0, 4) << '\\n';             // trad
std::cout << word.substr(word.size() - 3) << '\\n';  // ing`,
          caption: 'Slices are "from the start index up to, but not including, the end index", just like `range` in loops.' },
        { kind: 'check', q: 'What is `"London"[0:3]` in Python?', options: ['Lon', 'Lond', 'ond', 'L'], answer: 0, hint: 'Indexes 0, 1, 2.', explain: 'The end index is not included.' },
      ],
    },
    {
      id: 'ops',
      title: 'Everyday string operations',
      blocks: [
        { kind: 'analogy', text: "Real-world text is messy: extra spaces, inconsistent capitals, comma-separated values to split apart. A handful of operations handle most of it: change case, trim spaces, check contents, split into pieces and join pieces back together." },
        { kind: 'poly',
          pseudo: `set raw to "  XAU, XAG ,XPT  "
set clean to trim spaces from raw, then uppercase
set symbols to split clean on ","
trim each symbol
display symbols                   # XAU, XAG, XPT
display join symbols with " | "   # XAU | XAG | XPT`,
          python: `raw = "  xau, xag ,xpt  "
clean = raw.strip().upper()           # "XAU, XAG ,XPT"
symbols = [s.strip() for s in clean.split(",")]
print(symbols)                        # ['XAU', 'XAG', 'XPT']
print(" | ".join(symbols))            # XAU | XAG | XPT
print("XAG" in clean, clean.startswith("XAU"))   # True True
print(clean.replace(",", ";"))        # XAU; XAG ;XPT`,
          ts: `const raw = "  xau, xag ,xpt  ";
const clean = raw.trim().toUpperCase();
const symbols = clean.split(",").map((s) => s.trim());
console.log(symbols);                  // [ 'XAU', 'XAG', 'XPT' ]
console.log(symbols.join(" | "));      // XAU | XAG | XPT
console.log(clean.includes("XAG"), clean.startsWith("XAU"));   // true true`,
          go: `raw := "  xau, xag ,xpt  "
clean := strings.ToUpper(strings.TrimSpace(raw))
symbols := strings.Split(clean, ",")
for i := range symbols {
    symbols[i] = strings.TrimSpace(symbols[i])
}
fmt.Println(symbols)                          // [XAU XAG XPT]
fmt.Println(strings.Join(symbols, " | "))     // XAU | XAG | XPT
fmt.Println(strings.Contains(clean, "XAG"))   // true`,
          java: `String raw = "  xau, xag ,xpt  ";
String clean = raw.strip().toUpperCase();
List<String> symbols = new ArrayList<>();
for (String s : clean.split(",")) symbols.add(s.strip());
System.out.println(symbols);                     // [XAU, XAG, XPT]
System.out.println(String.join(" | ", symbols)); // XAU | XAG | XPT
System.out.println(clean.contains("XAG"));       // true`,
          cpp: `std::string raw = "  xau, xag ,xpt  ";
auto trim = [](std::string s) {
    s.erase(0, s.find_first_not_of(' '));
    s.erase(s.find_last_not_of(' ') + 1);
    return s;
};
std::string clean = trim(raw);
for (char& c : clean) c = std::toupper(c);
std::vector<std::string> symbols;
std::stringstream ss(clean);
for (std::string part; std::getline(ss, part, ',');) symbols.push_back(trim(part));
for (const auto& s : symbols) std::cout << s << ' ';   // XAU XAG XPT
std::cout << '\\n';`,
          caption: 'C++\'s standard library is famously thin on string helpers; real projects add small utilities or libraries for this.' },
        { kind: 'check', q: 'What does `"a,b,c".split(",")` produce?', options: ['"abc"', '["a", "b", "c"]', '3', '"a b c"'], answer: 1, hint: 'Split turns one string into a list.', explain: 'join does the reverse.' },
      ],
    },
    {
      id: 'format',
      title: 'Formatting output',
      blocks: [
        { kind: 'analogy', text: "Joining text with `+` gets clumsy fast. Formatting is a fill-in-the-blanks template: \"Bought {quantity} {symbol} at {price}\". You can also say how each blank should look: two decimal places, a thousands separator, padded to line up in a column." },
        { kind: 'poly',
          pseudo: `set symbol to "XAU"
set price to 2385.5
set quantity to 3
display "Bought {quantity} {symbol} at {price, 2 decimals}"
display "Total: {price * quantity, 2 decimals}"`,
          python: `symbol, price, quantity = "XAU", 2385.5, 3
print(f"Bought {quantity} {symbol} at {price:.2f}")   # Bought 3 XAU at 2385.50
print(f"Total: {price * quantity:,.2f}")              # Total: 7,156.50
print(f"{symbol:<6}|{price:>10.2f}|")                 # XAU   |   2385.50|`,
          ts: `const symbol = "XAU", price = 2385.5, quantity = 3;
console.log(\`Bought \${quantity} \${symbol} at \${price.toFixed(2)}\`);   // Bought 3 XAU at 2385.50
console.log(\`Total: \${(price * quantity).toLocaleString("en-GB", { minimumFractionDigits: 2 })}\`);
// Total: 7,156.50`,
          go: `symbol, price, quantity := "XAU", 2385.5, 3
fmt.Printf("Bought %d %s at %.2f\\n", quantity, symbol, price)   // Bought 3 XAU at 2385.50
fmt.Printf("Total: %.2f\\n", price*float64(quantity))            // Total: 7156.50
fmt.Printf("%-6s|%10.2f|\\n", symbol, price)                     // XAU   |   2385.50|`,
          java: `String symbol = "XAU";
double price = 2385.5;
int quantity = 3;
System.out.printf("Bought %d %s at %.2f%n", quantity, symbol, price);   // Bought 3 XAU at 2385.50
System.out.printf("Total: %,.2f%n", price * quantity);                  // Total: 7,156.50
System.out.printf("%-6s|%10.2f|%n", symbol, price);                     // XAU   |   2385.50|`,
          cpp: `std::string symbol = "XAU";
double price = 2385.5;
int quantity = 3;
std::cout << std::format("Bought {} {} at {:.2f}\\n", quantity, symbol, price);   // C++20
std::cout << std::format("Total: {:.2f}\\n", price * quantity);                    // Total: 7156.50
std::cout << std::format("{:<6}|{:>10.2f}|\\n", symbol, price);                    // XAU   |   2385.50|`,
          caption: '`.2f` means "a decimal number with 2 digits after the point". `<` and `>` align left or right within a width.' },
        { kind: 'check', q: 'In Python, what does `f"{3.14159:.2f}"` produce?', options: ['3.14159', '3.14', '3', '3.1'], answer: 1, hint: 'Two digits after the point.', explain: 'The value is rounded for display only.' },
      ],
    },
    {
      id: 'input',
      title: 'Reading input',
      blocks: [
        { kind: 'analogy', text: "Input turns a program from a recording into a conversation. The program pauses, the user types and presses Enter, and the program receives what they typed, always as text, so numbers must be converted (module 2) and the conversion might fail." },
        { kind: 'poly',
          pseudo: `display "What's your name?"
set name to what the user types
display "How many shares?"
set shares to what the user types, as a number
display "Thanks " + name + ", ordering " + shares`,
          python: `name = input("What's your name? ")
shares = int(input("How many shares? "))     # fails if they type "lots"
print(f"Thanks {name}, ordering {shares}")`,
          ts: `// Node.js
import * as readline from "node:readline/promises";
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const name = await rl.question("What's your name? ");
const shares = Number(await rl.question("How many shares? "));
console.log(\`Thanks \${name}, ordering \${shares}\`);
rl.close();`,
          go: `reader := bufio.NewReader(os.Stdin)
fmt.Print("What's your name? ")
name, _ := reader.ReadString('\\n')
name = strings.TrimSpace(name)
fmt.Print("How many shares? ")
line, _ := reader.ReadString('\\n')
shares, err := strconv.Atoi(strings.TrimSpace(line))
if err != nil {
    fmt.Println("That's not a whole number")
    return
}
fmt.Printf("Thanks %s, ordering %d\\n", name, shares)`,
          java: `Scanner in = new Scanner(System.in);
System.out.print("What's your name? ");
String name = in.nextLine();
System.out.print("How many shares? ");
int shares = Integer.parseInt(in.nextLine().strip());
System.out.println("Thanks " + name + ", ordering " + shares);`,
          cpp: `std::string name;
int shares = 0;
std::cout << "What's your name? ";
std::getline(std::cin, name);
std::cout << "How many shares? ";
if (!(std::cin >> shares)) {
    std::cout << "That's not a whole number\\n";
    return 1;
}
std::cout << "Thanks " << name << ", ordering " << shares << '\\n';`,
          caption: 'The Go and C++ versions check whether the number conversion worked. Module 9 shows how to do that in every language.' },
        { kind: 'check', q: 'What type is the value returned by Python\'s `input()`?', options: ['int', 'str', 'float', 'It depends on what was typed'], answer: 1, hint: 'Typed by a human at a keyboard.', explain: 'Always text; convert it yourself.' },
      ],
    },
    {
      id: 'files',
      title: 'Reading & writing files',
      blocks: [
        { kind: 'analogy', text: "Variables live in memory and vanish when the program ends, like writing on a whiteboard. Files are the notebook: they stay on disk. Writing a file saves results; reading one loads data someone (or some program) saved earlier. CSV files, plain text with one record per line and commas between fields, are the everyday format for tables of data." },
        { kind: 'poly',
          pseudo: `open "trades.csv" for writing
write "XAU,2,2385.5" as a line
write "XAG,100,28.4" as a line
close the file

open "trades.csv" for reading
for each line in the file
    split line on "," into symbol, quantity, price
    display symbol + " costs " + (quantity × price)
end for`,
          python: `with open("trades.csv", "w") as f:        # "with" closes the file for you
    f.write("XAU,2,2385.5\\n")
    f.write("XAG,100,28.4\\n")

with open("trades.csv") as f:
    for line in f:
        symbol, qty, price = line.strip().split(",")
        print(symbol, "costs", int(qty) * float(price))
# XAU costs 4771.0
# XAG costs 2840.0`,
          ts: `import { writeFileSync, readFileSync } from "node:fs";

writeFileSync("trades.csv", "XAU,2,2385.5\\nXAG,100,28.4\\n");

for (const line of readFileSync("trades.csv", "utf8").trim().split("\\n")) {
    const [symbol, qty, price] = line.split(",");
    console.log(symbol, "costs", Number(qty) * Number(price));
}`,
          go: `os.WriteFile("trades.csv", []byte("XAU,2,2385.5\\nXAG,100,28.4\\n"), 0644)

data, err := os.ReadFile("trades.csv")
if err != nil {
    fmt.Println("could not read file:", err)
    return
}
for _, line := range strings.Split(strings.TrimSpace(string(data)), "\\n") {
    parts := strings.Split(line, ",")
    qty, _ := strconv.Atoi(parts[1])
    price, _ := strconv.ParseFloat(parts[2], 64)
    fmt.Println(parts[0], "costs", float64(qty)*price)
}`,
          java: `Files.writeString(Path.of("trades.csv"), "XAU,2,2385.5\\nXAG,100,28.4\\n");

for (String line : Files.readAllLines(Path.of("trades.csv"))) {
    String[] parts = line.split(",");
    double cost = Integer.parseInt(parts[1]) * Double.parseDouble(parts[2]);
    System.out.println(parts[0] + " costs " + cost);
}`,
          cpp: `{
    std::ofstream out("trades.csv");          // closed automatically at the closing brace
    out << "XAU,2,2385.5\\n" << "XAG,100,28.4\\n";
}
std::ifstream in("trades.csv");
for (std::string line; std::getline(in, line);) {
    std::stringstream ss(line);
    std::string symbol, qty, price;
    std::getline(ss, symbol, ',');
    std::getline(ss, qty, ',');
    std::getline(ss, price, ',');
    std::cout << symbol << " costs " << std::stoi(qty) * std::stod(price) << '\\n';
}` },
        { kind: 'pitfall', text: 'Opening a file for writing ("w") wipes whatever was in it. Use append mode ("a") to add to the end. And always close files, or let the language do it (`with` in Python, scope in C++): unclosed files can lose the last data written.' },
        { kind: 'check', q: 'Why save data to a file?', options: ['Files are faster than variables', 'So it survives after the program ends', 'Required to print', 'To convert types'], answer: 1, hint: 'Whiteboard vs notebook.', explain: 'Memory is cleared when the program stops.' },
      ],
    },
  ],
  quiz: [
    { q: 'A string is…', options: ['A number', 'A sequence of characters', 'A boolean', 'A loop'], answer: 1, explain: 'Like a list of characters.' },
    { q: '`len("hello")` is…', options: ['4', '5', '6', '0'], answer: 1, explain: 'Five characters.' },
    { q: 'What does `.strip()` / `.trim()` remove?', options: ['All letters', 'Spaces from both ends', 'Commas', 'Capitals'], answer: 1, explain: 'Leading and trailing whitespace.' },
    { q: '`" - ".join(["a", "b"])` in Python gives…', options: ['"ab"', '"a - b"', '["a - b"]', '"a b"'], answer: 1, explain: 'Join puts the separator between items.' },
    { q: '`f"{2.5:.2f}"` displays…', options: ['2.5', '2.50', '3', '2'], answer: 1, explain: 'Two decimal places.' },
    { q: 'Input typed by the user arrives as…', options: ['A number', 'Text', 'A list', 'A boolean'], answer: 1, explain: 'Convert as needed.' },
    { q: 'Opening an existing file in write mode ("w")…', options: ['Appends', 'Erases its contents first', 'Fails', 'Reads it'], answer: 1, explain: 'Use "a" to append.' },
    { q: 'CSV stands for…', options: ['Computer Saved Values', 'Comma-Separated Values', 'Character String Variables', 'Column Sorted View'], answer: 1, explain: 'One record per line.' },
  ],
}
