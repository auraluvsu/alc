import type { Module } from '../types'

export const f02: Module = {
  n: 2,
  title: 'Values, Types & Variables',
  tour: 'Basics',
  summary: 'The data programs work with: numbers, text and true/false values, what a type is, storing values in named variables, changing them, and turning one type into another.',
  topics: ['Values & types', 'Variables', 'Changing a variable', 'Naming things well', 'Converting between types'],
  cpp23: ['Python, TypeScript and Go can often work out a variable\'s type for you; Java and C++ can too with `var` and `auto`.'],
  lessons: [
    {
      id: 'types',
      title: 'Values & types',
      blocks: [
        { kind: 'analogy', text: "A value is a single piece of information: 42, \"Ada\", true. Its type says what kind of thing it is and therefore what you can do with it. You can add two numbers, but \"adding\" two names means sticking them together, and you can't divide a name by three. The type is like the label on a container: \"liquid\", \"fragile\", \"perishable\". It tells everyone how to handle it." },
        { kind: 'list', items: [
          '**Integer**: a whole number. `42`, `-7`, `0`.',
          '**Decimal (floating-point) number**: a number with a fractional part. `3.14`, `-0.5`, `2385.1`.',
          '**String**: text, written in quotes. `"Ada"`, `"XAU/USD"`, `""` (the empty string).',
          '**Boolean**: true or false. Named after the mathematician George Boole. Used for yes/no decisions.',
        ] },
        { kind: 'poly',
          pseudo: `display 42            # an integer
display 3.14          # a decimal number
display "Ada"         # a string (text)
display true          # a boolean`,
          python: `print(42)        # int
print(3.14)      # float
print("Ada")     # str
print(True)      # bool (capital T in Python)
print(type(3.14))   # <class 'float'>`,
          ts: `console.log(42);        // number
console.log(3.14);      // number (JS has one number type)
console.log("Ada");     // string
console.log(true);      // boolean
console.log(typeof 3.14);   // number`,
          go: `fmt.Println(42)        // int
fmt.Println(3.14)      // float64
fmt.Println("Ada")     // string
fmt.Println(true)      // bool
fmt.Printf("%T\\n", 3.14)   // float64`,
          java: `System.out.println(42);      // int
System.out.println(3.14);    // double
System.out.println("Ada");   // String
System.out.println(true);    // boolean`,
          cpp: `std::cout << 42 << '\\n';                       // int
std::cout << 3.14 << '\\n';                     // double
std::cout << "Ada" << '\\n';                    // text
std::cout << std::boolalpha << true << '\\n';   // bool (prints "true")`,
          caption: 'The `#` and `//` parts are comments: notes for humans that the computer ignores.' },
        { kind: 'check', q: 'What type is `"42"` (with quotes)?', options: ['Integer', 'String', 'Boolean', 'Decimal'], answer: 1, hint: 'Quotes mean text.', explain: '"42" is the characters 4 and 2, not the number forty-two.' },
      ],
    },
    {
      id: 'variables',
      title: 'Variables',
      blocks: [
        { kind: 'analogy', text: "A variable is a labelled box. You put a value in the box and write a name on the label, so later you can say \"the price\" instead of remembering 2385.1. The program keeps the box in memory and finds it by its name whenever you mention it." },
        { kind: 'poly',
          pseudo: `set price to 2385.1
set quantity to 2
set symbol to "XAU"
display symbol
display price * quantity`,
          python: `price = 2385.1
quantity = 2
symbol = "XAU"
print(symbol)
print(price * quantity)     # 4770.2`,
          ts: `const price = 2385.1;
const quantity = 2;
const symbol = "XAU";
console.log(symbol);
console.log(price * quantity);   // 4770.2`,
          go: `price := 2385.1
quantity := 2.0
symbol := "XAU"
fmt.Println(symbol)
fmt.Println(price * quantity)   // 4770.2`,
          java: `double price = 2385.1;
int quantity = 2;
String symbol = "XAU";
System.out.println(symbol);
System.out.println(price * quantity);   // 4770.2`,
          cpp: `double price = 2385.1;
int quantity = 2;
std::string symbol = "XAU";
std::cout << symbol << '\\n';
std::cout << price * quantity << '\\n';   // 4770.2`,
          caption: 'Java and C++ make you state the type (`double`, `int`). Python, TypeScript and Go work it out from the value.' },
        { kind: 'p', text: 'The `=` sign (or "set … to") means **assignment**: put the value on the right into the box named on the left. It is not the maths "equals". `x = x + 1` is perfectly sensible in code: take what\'s in x, add one, put it back.' },
        { kind: 'check', q: 'What does `total = total + 5` do?', options: ['Nothing: it\'s impossible', 'Adds 5 to the current value of total and stores the result in total', 'Checks whether total equals total + 5', 'Creates a second total'], answer: 1, hint: 'Assignment, not maths equality.', explain: 'Right side first, then store in the box on the left.' },
      ],
    },
    {
      id: 'changing',
      title: 'Changing a variable',
      blocks: [
        { kind: 'analogy', text: "A variable's box can be emptied and refilled as the program runs: that's why it's called a *variable*. Some languages also let you make a box with a lock on it (a constant), for values that should never change, like the number of seconds in a minute." },
        { kind: 'stepper', title: 'Step through: a running balance', code: [
          'set balance to 100',
          'set balance to balance - 30',
          'set balance to balance + 50',
          'display balance',
        ], steps: [
          { line: 1, note: 'A box called balance is created and 100 is put in it.', memory: [{ name: 'balance', value: '100' }] },
          { line: 2, note: 'First work out the right side: 100 − 30 = 70. Then put 70 in the box, replacing 100.', memory: [{ name: 'balance', value: '70' }] },
          { line: 3, note: 'Right side: 70 + 50 = 120. Store it.', memory: [{ name: 'balance', value: '120' }] },
          { line: 4, note: 'Shows 120. The old values 100 and 70 are gone: a box holds one value at a time.', memory: [{ name: 'balance', value: '120', kind: 'heap' }] },
        ] },
        { kind: 'poly',
          pseudo: `set balance to 100
set balance to balance - 30
add 50 to balance
display balance              # 120
constant FEE is 2            # can never be changed`,
          python: `balance = 100
balance = balance - 30
balance += 50          # shorthand for balance = balance + 50
print(balance)         # 120
FEE = 2                # by convention, CAPITALS mean "don't change this"`,
          ts: `let balance = 100;       // let: can change
balance = balance - 30;
balance += 50;
console.log(balance);    // 120
const FEE = 2;           // const: can't be reassigned`,
          go: `balance := 100
balance = balance - 30     // := creates, = updates
balance += 50
fmt.Println(balance)       // 120
const fee = 2`,
          java: `int balance = 100;
balance = balance - 30;
balance += 50;
System.out.println(balance);   // 120
final int FEE = 2;             // final: can't be changed`,
          cpp: `int balance = 100;
balance = balance - 30;
balance += 50;
std::cout << balance << '\\n';   // 120
const int fee = 2;              // const: can't be changed` },
        { kind: 'check', q: 'After `set x to 5`, `set x to x * 2`, `set x to x - 1`, what is x?', options: ['5', '10', '9', '4'], answer: 2, hint: 'One step at a time, like the stepper.', explain: '5 → 10 → 9.' },
      ],
    },
    {
      id: 'naming',
      title: 'Naming things well',
      blocks: [
        { kind: 'analogy', text: "Names are for the next person to read your code, and that person is usually you, six months later, having forgotten everything. A box labelled `x` tells them nothing; a box labelled `monthly_rent` tells them everything." },
        { kind: 'list', items: [
          '**Be descriptive**: `total_price` beats `tp`; `is_market_open` beats `flag`.',
          '**Follow each language\'s style**: Python and C++ often use `snake_case`; TypeScript, Java and Go use `camelCase`.',
          '**Rules**: names can\'t contain spaces, can\'t start with a digit, and can\'t be a reserved word like `if` or `for`.',
          '**Case matters**: `Price` and `price` are different boxes in every language here.',
          '**Booleans read as questions**: `is_valid`, `has_paid`, `can_trade`.',
        ] },
        { kind: 'check', q: 'Which is the best variable name for the number of unread emails?', options: ['n', 'x2', 'unread_count', 'the number of unread emails'], answer: 2, hint: 'Descriptive, no spaces.', explain: 'Spaces aren\'t allowed; single letters say nothing.' },
      ],
    },
    {
      id: 'converting',
      title: 'Converting between types',
      blocks: [
        { kind: 'analogy', text: "Text that looks like a number isn't a number until you convert it, like a cheque isn't cash until you pay it in. Anything typed by a user or read from a file arrives as text, so converting it is one of the most common things programs do, and one of the most common sources of errors." },
        { kind: 'poly',
          pseudo: `set typed to "42"
set amount to typed converted to a number
display amount + 8               # 50
display "Total: " + (amount as text)`,
          python: `typed = "42"
amount = int(typed)          # "42" → 42
print(amount + 8)            # 50
print(typed + "8")           # 428: joining text!
print("Total: " + str(amount))
print(float("2385.1"))       # 2385.1`,
          ts: `const typed = "42";
const amount = Number(typed);    // "42" → 42
console.log(amount + 8);         // 50
console.log(typed + "8");        // 428: joining text!
console.log("Total: " + String(amount));`,
          go: `typed := "42"
amount, err := strconv.Atoi(typed)   // returns an error if it isn't a number
if err == nil {
    fmt.Println(amount + 8)          // 50
}
fmt.Println(typed + "8")             // 428
fmt.Println("Total: " + strconv.Itoa(amount))`,
          java: `String typed = "42";
int amount = Integer.parseInt(typed);   // "42" → 42
System.out.println(amount + 8);         // 50
System.out.println(typed + "8");        // 428
System.out.println("Total: " + amount); // Java converts automatically when joining`,
          cpp: `std::string typed = "42";
int amount = std::stoi(typed);          // "42" → 42
std::cout << amount + 8 << '\\n';        // 50
std::cout << typed + "8" << '\\n';       // 428
std::cout << "Total: " + std::to_string(amount) << '\\n';`,
          caption: '`+` means "add" for numbers but "join" for text: the same symbol does different things depending on the type.' },
        { kind: 'pitfall', text: 'Converting text that isn\'t a number, like "forty-two" or "", fails: Python raises an error, Go returns an error value, TypeScript\'s `Number("abc")` gives `NaN` (not a number). Always expect bad input from users and files (module 9).' },
        { kind: 'check', q: 'In Python, what is `"3" + "4"`?', options: ['7', '"34"', 'An error', '12'], answer: 1, hint: 'Both are text.', explain: 'Joining two strings. int("3") + int("4") would be 7.' },
      ],
    },
  ],
  quiz: [
    { q: 'Which value is a boolean?', options: ['"true"', 'true', '1.0', '"yes"'], answer: 1, explain: '"true" in quotes is a string.' },
    { q: 'Which is a decimal (floating-point) number?', options: ['7', '"7.5"', '7.5', 'true'], answer: 2, explain: 'No quotes, has a fractional part.' },
    { q: 'A variable is best described as…', options: ['A fixed number', 'A named box holding a value that can change', 'A type of loop', 'A comment'], answer: 1, explain: 'Assignment fills the box.' },
    { q: 'In code, `=` usually means…', options: ['Is equal to', 'Store the right-hand value in the left-hand variable', 'Compare', 'Add'], answer: 1, explain: 'Comparison is `==` (module 3).' },
    { q: 'What does a constant prevent?', options: ['Reading the value', 'Changing the value later', 'Using it in maths', 'Printing it'], answer: 1, explain: 'const / final / CAPITALS by convention.' },
    { q: 'Which is NOT a valid variable name in most languages?', options: ['total_cost', 'totalCost', '2nd_place', 'is_ready'], answer: 2, explain: 'Names can\'t start with a digit.' },
    { q: 'Text typed by a user arrives as…', options: ['A number', 'A string', 'A boolean', 'Nothing'], answer: 1, explain: 'Convert it before doing arithmetic.' },
    { q: 'In Python, `int("12") + 3` is…', options: ['"123"', '15', 'An error', '12'], answer: 1, explain: 'Converted to a number first.' },
  ],
}
