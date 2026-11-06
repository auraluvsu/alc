import type { Module } from '../types'

export const f03: Module = {
  n: 3,
  title: 'Expressions & Logic',
  tour: 'Basics',
  summary: 'Combining values with operators: arithmetic and its surprises (integer division, remainders, rounding), comparing values, and combining true/false conditions with and, or and not.',
  topics: ['Arithmetic', 'Division & remainders', 'Comparisons', 'and, or & not', 'Order of operations'],
  cpp23: ['Python and TypeScript have a separate `**` power operator; Go, Java and C++ use a library function (`math.Pow`, `Math.pow`, `std::pow`).'],
  lessons: [
    {
      id: 'arith',
      title: 'Arithmetic',
      blocks: [
        { kind: 'analogy', text: "An expression is anything that works out to a value, like a sum on a calculator: `price * quantity + fee`. The computer evaluates it, replacing the whole thing with the answer, and then you can store, display or compare that answer." },
        { kind: 'poly',
          pseudo: `set price to 20
set quantity to 3
set fee to 2
display price * quantity + fee   # 62
display price - fee              # 18`,
          python: `price, quantity, fee = 20, 3, 2
print(price * quantity + fee)    # 62
print(price - fee)               # 18
print(2 ** 10)                   # 1024: power`,
          ts: `const price = 20, quantity = 3, fee = 2;
console.log(price * quantity + fee);   // 62
console.log(price - fee);              // 18
console.log(2 ** 10);                  // 1024`,
          go: `price, quantity, fee := 20, 3, 2
fmt.Println(price*quantity + fee)   // 62
fmt.Println(price - fee)            // 18
fmt.Println(math.Pow(2, 10))        // 1024`,
          java: `int price = 20, quantity = 3, fee = 2;
System.out.println(price * quantity + fee);   // 62
System.out.println(price - fee);              // 18
System.out.println(Math.pow(2, 10));          // 1024.0`,
          cpp: `int price = 20, quantity = 3, fee = 2;
std::cout << price * quantity + fee << '\\n';   // 62
std::cout << price - fee << '\\n';              // 18
std::cout << std::pow(2, 10) << '\\n';          // 1024` },
        { kind: 'check', q: 'What is `10 + 2 * 3`?', options: ['36', '16', '15', '12'], answer: 1, hint: 'Multiplication before addition, as in maths.', explain: '2 * 3 = 6, then 10 + 6.' },
      ],
    },
    {
      id: 'division',
      title: 'Division & remainders',
      blocks: [
        { kind: 'analogy', text: "Sharing 7 sweets between 2 children: each gets 3 whole sweets and 1 is left over. Programming has both answers: the whole-number share (integer division) and what's left (the remainder, written `%`). The remainder is surprisingly useful: it tells you whether a number is even, which day of the week comes next, or every how-many-th item you're on." },
        { kind: 'poly',
          pseudo: `display 7 / 2                   # 3.5
display 7 divided by 2, whole   # 3
display remainder of 7 / 2      # 1
if remainder of n / 2 is 0 then display "even"`,
          python: `print(7 / 2)     # 3.5  (always a decimal)
print(7 // 2)    # 3    (whole-number division)
print(7 % 2)     # 1    (remainder)
n = 10
print(n % 2 == 0)   # True: even`,
          ts: `console.log(7 / 2);              // 3.5
console.log(Math.floor(7 / 2));  // 3
console.log(7 % 2);              // 1
const n = 10;
console.log(n % 2 === 0);        // true`,
          go: `fmt.Println(7 / 2)       // 3: both are integers, so the result is too!
fmt.Println(7.0 / 2)     // 3.5
fmt.Println(7 % 2)       // 1
n := 10
fmt.Println(n%2 == 0)    // true`,
          java: `System.out.println(7 / 2);     // 3: integer division
System.out.println(7.0 / 2);   // 3.5
System.out.println(7 % 2);     // 1
int n = 10;
System.out.println(n % 2 == 0);   // true`,
          cpp: `std::cout << 7 / 2 << '\\n';     // 3: integer division
std::cout << 7.0 / 2 << '\\n';   // 3.5
std::cout << 7 % 2 << '\\n';     // 1
int n = 10;
std::cout << (n % 2 == 0) << '\\n';   // 1 (true)` },
        { kind: 'pitfall', text: 'In Go, Java and C++, dividing one whole number by another throws away the fraction: `7 / 2` is `3`, and `1 / 3` is `0`. Write `7.0 / 2` (or convert first) when you want the decimal answer. Python\'s `/` always gives a decimal; `//` gives the whole-number part.' },
        { kind: 'check', q: 'What is `17 % 5`?', options: ['3.4', '3', '2', '5'], answer: 2, hint: '5 goes into 17 three times, with some left over.', explain: '17 = 5 × 3 + 2.' },
      ],
    },
    {
      id: 'compare',
      title: 'Comparisons',
      blocks: [
        { kind: 'analogy', text: "A comparison asks a yes/no question about two values (is the balance at least the price? is the name equal to \"admin\"?) and the answer is a boolean: true or false. These answers drive every decision a program makes (module 4)." },
        { kind: 'poly',
          pseudo: `set balance to 50
set price to 30
display balance >= price     # true
display price = 30           # true
display price ≠ 30           # false`,
          python: `balance, price = 50, 30
print(balance >= price)   # True
print(price == 30)        # True: two = signs to compare
print(price != 30)        # False: "not equal"
print("abc" < "abd")      # True: text compares alphabetically`,
          ts: `const balance = 50, price = 30;
console.log(balance >= price);   // true
console.log(price === 30);       // true: use three = in JS/TS
console.log(price !== 30);       // false`,
          go: `balance, price := 50, 30
fmt.Println(balance >= price)   // true
fmt.Println(price == 30)        // true
fmt.Println(price != 30)        // false`,
          java: `int balance = 50, price = 30;
System.out.println(balance >= price);   // true
System.out.println(price == 30);        // true
System.out.println("abc".equals("abc")); // compare text with .equals in Java`,
          cpp: `int balance = 50, price = 30;
std::cout << std::boolalpha;
std::cout << (balance >= price) << '\\n';   // true
std::cout << (price == 30) << '\\n';        // true
std::cout << (price != 30) << '\\n';        // false`,
          caption: 'Operators: `<` less than, `<=` at most, `>` greater than, `>=` at least, `==` equal, `!=` not equal.' },
        { kind: 'pitfall', text: '`=` stores, `==` compares. Writing `if x = 5` when you meant `if x == 5` is one of the most famous bugs in programming. Python and Go refuse to run it; C++ happily runs it and silently does the wrong thing.' },
        { kind: 'check', q: 'What does `5 != 5` evaluate to?', options: ['true', 'false', '0', 'An error'], answer: 1, hint: '!= means "is not equal to".', explain: '5 is equal to 5, so "not equal" is false.' },
      ],
    },
    {
      id: 'logic',
      title: 'and, or & not',
      blocks: [
        { kind: 'analogy', text: "Real rules combine conditions. \"You can enter if you have a ticket **and** you're over 18.\" \"Free delivery if you spend over £50 **or** you're a member.\" \"Show the warning if the form is **not** complete.\" These three words let you build any rule from simple yes/no questions." },
        { kind: 'poly',
          pseudo: `set has_ticket to true
set age to 17
display has_ticket and age >= 18     # false
display has_ticket or age >= 18      # true
display not has_ticket               # false`,
          python: `has_ticket = True
age = 17
print(has_ticket and age >= 18)   # False
print(has_ticket or age >= 18)    # True
print(not has_ticket)             # False`,
          ts: `const hasTicket = true;
const age = 17;
console.log(hasTicket && age >= 18);   // false   (&& = and)
console.log(hasTicket || age >= 18);   // true    (|| = or)
console.log(!hasTicket);               // false   (! = not)`,
          go: `hasTicket := true
age := 17
fmt.Println(hasTicket && age >= 18)   // false
fmt.Println(hasTicket || age >= 18)   // true
fmt.Println(!hasTicket)               // false`,
          java: `boolean hasTicket = true;
int age = 17;
System.out.println(hasTicket && age >= 18);   // false
System.out.println(hasTicket || age >= 18);   // true
System.out.println(!hasTicket);               // false`,
          cpp: `bool hasTicket = true;
int age = 17;
std::cout << std::boolalpha;
std::cout << (hasTicket && age >= 18) << '\\n';   // false
std::cout << (hasTicket || age >= 18) << '\\n';   // true
std::cout << (!hasTicket) << '\\n';               // false` },
        { kind: 'list', items: [
          '**and** is true only if **both** sides are true.',
          '**or** is true if **at least one** side is true.',
          '**not** flips true to false and false to true.',
          'Most languages stop early: in `a and b`, if `a` is false, `b` is never checked (short-circuiting). Handy for `count > 0 and total / count > 10`.',
        ] },
        { kind: 'check', q: '`(age >= 18) or (has_parent)` with age 15 and has_parent true is…', options: ['true', 'false', 'An error', '15'], answer: 0, hint: 'Or needs only one side.', explain: 'false or true = true.' },
      ],
    },
    {
      id: 'order',
      title: 'Order of operations',
      blocks: [
        { kind: 'analogy', text: "Just like BIDMAS (or PEMDAS) at school, languages have rules about what's worked out first: brackets, then multiplication and division, then addition and subtraction, then comparisons, then not, and, or. When in doubt, add brackets. They cost nothing and make your intent obvious to the next reader." },
        { kind: 'poly',
          pseudo: `display 2 + 3 * 4           # 14
display (2 + 3) * 4         # 20
display 1 + 1 = 2 and 3 > 4 # false`,
          python: `print(2 + 3 * 4)            # 14
print((2 + 3) * 4)          # 20
print(1 + 1 == 2 and 3 > 4) # False: arithmetic, then compare, then and`,
          ts: `console.log(2 + 3 * 4);              // 14
console.log((2 + 3) * 4);            // 20
console.log(1 + 1 === 2 && 3 > 4);   // false`,
          go: `fmt.Println(2 + 3*4)               // 14 (gofmt spaces show the grouping)
fmt.Println((2 + 3) * 4)           // 20
fmt.Println(1+1 == 2 && 3 > 4)     // false`,
          java: `System.out.println(2 + 3 * 4);              // 14
System.out.println((2 + 3) * 4);            // 20
System.out.println(1 + 1 == 2 && 3 > 4);    // false`,
          cpp: `std::cout << 2 + 3 * 4 << '\\n';                        // 14
std::cout << (2 + 3) * 4 << '\\n';                      // 20
std::cout << std::boolalpha << (1 + 1 == 2 && 3 > 4) << '\\n';   // false` },
        { kind: 'check', q: 'What is `(10 - 4) / 2 + 1`?', options: ['2', '4', '3.5', '8'], answer: 1, hint: 'Brackets first.', explain: '6 / 2 = 3, then + 1 = 4.' },
      ],
    },
  ],
  quiz: [
    { q: '`3 + 4 * 2` equals…', options: ['14', '11', '10', '9'], answer: 1, explain: 'Multiply first.' },
    { q: 'In Go, Java or C++, `7 / 2` with two integers gives…', options: ['3.5', '3', '4', 'An error'], answer: 1, explain: 'Integer division drops the fraction.' },
    { q: 'What does `%` give?', options: ['Percentage', 'The remainder after division', 'Division', 'Power'], answer: 1, explain: '7 % 3 = 1.' },
    { q: 'How do you test if n is even?', options: ['n / 2 == 0', 'n % 2 == 0', 'n == 2', 'n * 2 == 0'], answer: 1, explain: 'No remainder when divided by 2.' },
    { q: 'Which operator tests equality in Python?', options: ['=', '==', '===', 'equals'], answer: 1, explain: 'TypeScript uses ===.' },
    { q: '`true and false` is…', options: ['true', 'false', 'Error', 'Both'], answer: 1, explain: 'And needs both.' },
    { q: '`not (5 > 3)` is…', options: ['true', 'false', '2', 'Error'], answer: 1, explain: '5 > 3 is true; not flips it.' },
    { q: 'When unsure of precedence, you should…', options: ['Guess', 'Add brackets', 'Avoid the expression', 'Use strings'], answer: 1, explain: 'Clear and free.' },
  ],
}
