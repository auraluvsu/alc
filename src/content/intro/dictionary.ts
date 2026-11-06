import type { DictEntry } from '../types'

// Beginner glossary. Syntax is shown in this course's pseudocode, with real-language spellings where useful.
export const INTRO_DICT: DictEntry[] = [
  // ---------- Basics ----------
  { term: 'Program', cat: 'Basics', module: 1, desc: 'A precise list of instructions a computer follows, top to bottom, one step at a time.', syntax: `display "Hello, world!"` },
  { term: 'Source code', cat: 'Basics', module: 1, desc: 'The human-readable text of a program, saved in files such as main.py or main.go.', syntax: `main.py · main.ts · main.go · Main.java · main.cpp` },
  { term: 'Compiler / interpreter', cat: 'Basics', module: 1, desc: 'A compiler translates the whole program to machine code before it runs (Go, C++, Java to bytecode); an interpreter runs it line by line (Python).', syntax: `g++ main.cpp -o main && ./main   ·   python3 main.py` },
  { term: 'Pseudocode', cat: 'Basics', module: 1, desc: 'Plain-English steps written like code but not tied to any language. Used to plan before programming.', syntax: `if balance < 0 then display "overdrawn"` },
  { term: 'Comment', cat: 'Basics', module: 1, desc: 'A note for humans that the computer ignores.', syntax: `# Python, pseudocode   ·   // TypeScript, Go, Java, C++` },
  // ---------- Values ----------
  { term: 'Variable', cat: 'Values', module: 2, desc: 'A named box holding a value that can change while the program runs.', syntax: `set price to 2385.5` },
  { term: 'Type', cat: 'Values', module: 2, desc: 'The kind of value: whole number, decimal number, text, true/false. It decides what operations make sense.', syntax: `int · float/double · string · bool` },
  { term: 'Integer', cat: 'Values', module: 2, desc: 'A whole number with no fractional part.', syntax: `set shares to 100` },
  { term: 'Floating-point number', cat: 'Values', module: 2, desc: 'A number with a decimal point. Stored approximately, so 0.1 + 0.2 is not exactly 0.3.', syntax: `set rate to 0.035` },
  { term: 'String', cat: 'Values', module: 2, desc: 'Text: a sequence of characters inside quotes.', syntax: `set symbol to "XAU"` },
  { term: 'Boolean', cat: 'Values', module: 2, desc: 'A value that is either true or false. The result of every comparison.', syntax: `set is_open to true` },
  { term: 'Type conversion', cat: 'Values', module: 2, desc: 'Turning a value of one type into another, e.g. the text "42" into the number 42. Can fail.', syntax: `int("42") · Number("42") · strconv.Atoi("42")` },
  { term: 'Constant', cat: 'Values', module: 2, desc: 'A named value that never changes once set.', syntax: `const VAT = 0.2` },
  // ---------- Logic ----------
  { term: 'Expression', cat: 'Logic', module: 3, desc: 'Anything that produces a value: 2 + 3, price * qty, age >= 18.', syntax: `price * quantity + fee` },
  { term: 'Operator', cat: 'Logic', module: 3, desc: 'A symbol that combines values: + - * / % for arithmetic, == != < > for comparison.', syntax: `10 % 3   # 1 (remainder)` },
  { term: 'and / or / not', cat: 'Logic', module: 3, desc: 'Combine true/false values. and: both true. or: at least one true. not: flips it.', syntax: `if age >= 18 and has_id then …   ·   && || !` },
  { term: 'Operator precedence', cat: 'Logic', module: 3, desc: 'The order operators are applied: * and / before + and −. Brackets override it.', syntax: `2 + 3 * 4   # 14   ·   (2 + 3) * 4   # 20` },
  // ---------- Control flow ----------
  { term: 'if / else', cat: 'Control flow', module: 4, desc: 'Runs one block of code or another depending on a condition.', syntax: `if x > 0 then … else if x = 0 then … else … end if` },
  { term: 'Condition', cat: 'Control flow', module: 4, desc: 'An expression that is true or false, deciding which branch runs or whether a loop continues.', syntax: `balance >= price` },
  { term: 'Block / indentation', cat: 'Control flow', module: 4, desc: 'A group of lines that belong together. Python uses indentation; the others use { braces }.', syntax: `if ok:\n    do_this()       # Python\nif (ok) { doThis(); }   // others` },
  { term: 'while loop', cat: 'Control flow', module: 5, desc: 'Repeats while a condition is true. Something inside must eventually make it false.', syntax: `while balance < target … end while` },
  { term: 'for loop', cat: 'Control flow', module: 5, desc: 'Repeats a fixed number of times or once per item in a collection.', syntax: `for i from 0 to 4 … end for   ·   for each x in xs` },
  { term: 'Infinite loop', cat: 'Control flow', module: 5, desc: 'A loop whose condition never becomes false, so the program never moves on. Stop it with Ctrl+C.', syntax: `while true …   # needs a break` },
  { term: 'break / continue', cat: 'Control flow', module: 5, desc: 'break leaves a loop immediately; continue skips to the next round.', syntax: `if x < 0 then continue` },
  // ---------- Data ----------
  { term: 'List / array', cat: 'Data', module: 6, desc: 'An ordered collection of values, each at a numbered position (index) starting from 0.', syntax: `set prices to [10, 20, 30]` },
  { term: 'Index', cat: 'Data', module: 6, desc: 'The position of an item in a list or string. The first item is at index 0.', syntax: `prices[0]   # 10` },
  { term: 'Map / dictionary', cat: 'Data', module: 6, desc: 'A collection of key → value pairs; look values up by key instead of position.', syntax: `set prices to {"XAU": 2385, "XAG": 28}` },
  { term: 'Set', cat: 'Data', module: 10, desc: 'A collection of unique values with very fast "is this in here?" checks.', syntax: `set seen to an empty set` },
  { term: 'Slice / substring', cat: 'Data', module: 8, desc: 'A piece of a list or string, from a start index up to (not including) an end index.', syntax: `"trading"[0:4]   # "trad"` },
  { term: 'CSV', cat: 'Data', module: 8, desc: 'Comma-separated values: a plain-text table with one record per line.', syntax: `XAU,2,2385.5` },
  { term: 'File', cat: 'Data', module: 8, desc: 'Data stored on disk that survives after the program ends.', syntax: `open "trades.csv" for reading` },
  // ---------- Structure ----------
  { term: 'Function', cat: 'Structure', module: 7, desc: 'A named, reusable block of steps. Defining it stores the steps; calling it runs them.', syntax: `function greet(name) … end function\ngreet("Ada")` },
  { term: 'Parameter / argument', cat: 'Structure', module: 7, desc: 'Parameters are the named inputs in a function definition; arguments are the actual values passed when calling it.', syntax: `function area(w, h)   ·   area(3, 4)` },
  { term: 'Return value', cat: 'Structure', module: 7, desc: 'The value a function hands back to its caller. return also ends the function.', syntax: `return price * 1.2` },
  { term: 'Scope', cat: 'Structure', module: 7, desc: 'Where a variable can be used. Variables made inside a function are local to it.', syntax: `function f() set total to 0 …   # total exists only in f` },
  { term: 'Record / struct', cat: 'Structure', module: 11, desc: 'A group of named fields describing one thing.', syntax: `record Trade: symbol, quantity, price` },
  { term: 'Class / object', cat: 'Structure', module: 11, desc: 'A class is a blueprint combining data and methods; an object is one thing built from it.', syntax: `set acct to new Account("Nas")` },
  { term: 'Method', cat: 'Structure', module: 11, desc: 'A function that belongs to an object and works on its data.', syntax: `acct.deposit(50)` },
  { term: 'Encapsulation', cat: 'Structure', module: 11, desc: 'An object keeps its data private and changes it only through methods that enforce the rules.', syntax: `private balance` },
  { term: 'Module / import', cat: 'Structure', module: 11, desc: 'Code split into separate files; import brings another file\'s or library\'s code into this one.', syntax: `from pricing import with_vat   ·   import "fmt"` },
  { term: 'Library', cat: 'Structure', module: 11, desc: 'Reusable code written by others. The standard library ships with the language.', syntax: `import math · Math.sqrt · java.time` },
  // ---------- Skills ----------
  { term: 'Bug', cat: 'Skills', module: 9, desc: 'A mistake in a program that makes it fail or behave wrongly.', syntax: `set average to total / 2   # should be / count` },
  { term: 'Syntax / runtime / logic error', cat: 'Skills', module: 9, desc: 'Syntax: code can\'t be read. Runtime: fails while running. Logic: runs but gives the wrong answer.', syntax: `SyntaxError · IndexError · wrong total` },
  { term: 'Exception / try-catch', cat: 'Skills', module: 9, desc: 'A signal that something went wrong at runtime; try/catch handles it instead of crashing. Go returns error values instead.', syntax: `try … if that fails … end try   ·   if err != nil` },
  { term: 'Stack trace / traceback', cat: 'Skills', module: 9, desc: 'The error report listing where the failure happened and the chain of calls that led there.', syntax: `File "shop.py", line 8, in checkout` },
  { term: 'Debugger / breakpoint', cat: 'Skills', module: 9, desc: 'A tool that pauses your program at a line so you can inspect variables and step through.', syntax: `F5 in VS Code` },
  { term: 'Test / assert', cat: 'Skills', module: 9, desc: 'Code that checks other code produces the expected result.', syntax: `check average([4, 8, 6]) = 6` },
  { term: 'Algorithm', cat: 'Skills', module: 10, desc: 'A step-by-step method for solving a problem, independent of language.', syntax: `linear search · binary search · insertion sort` },
  { term: 'Edge case', cat: 'Skills', module: 10, desc: 'An unusual input that often breaks naive code: empty lists, zero, ties, negative numbers.', syntax: `largest([])` },
  { term: 'Binary search', cat: 'Skills', module: 10, desc: 'Finds an item in a sorted list by repeatedly halving the range. About 20 steps for a million items.', syntax: `set mid to (low + high) / 2` },
  { term: 'Big-O', cat: 'Skills', module: 10, desc: 'Describes how work grows as data grows: O(1), O(log n), O(n), O(n log n), O(n²).', syntax: `pairs: O(n²) · set: O(n)` },
  // ---------- Tools ----------
  { term: 'Terminal', cat: 'Tools', module: 12, desc: 'A text interface for running commands and programs.', syntax: `pwd · ls · cd · mkdir` },
  { term: 'Git / commit', cat: 'Tools', module: 12, desc: 'Version control: a commit is a saved snapshot of the project with a message.', syntax: `git add . && git commit -m "Add checkout"` },
  { term: 'Branch', cat: 'Tools', module: 12, desc: 'A parallel line of work in git that can be merged back later.', syntax: `git switch -c try-discounts` },
  { term: 'Package manager', cat: 'Tools', module: 12, desc: 'Installs third-party libraries and records exact versions for the project.', syntax: `pip · npm · go get · Maven · vcpkg` },
]
