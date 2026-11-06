import type { Module } from '../types'

export const f04: Module = {
  n: 4,
  title: 'Making Decisions',
  tour: 'Control flow',
  summary: 'Making programs choose: if, else and else-if chains, nesting decisions, choosing between many options, and testing every path so you know each branch actually works.',
  topics: ['if', 'if / else', 'else if chains', 'Nested decisions', 'Testing every branch'],
  cpp23: ['Python 3.10+ has `match`; Java 21+ has pattern-matching `switch`; Go, TypeScript and C++ have `switch`. All are tidier ways to write long else-if chains.'],
  lessons: [
    {
      id: 'if',
      title: 'if',
      blocks: [
        { kind: 'analogy', text: "Until now, programs ran every line from top to bottom. An `if` adds a fork in the road: \"if it's raining, take an umbrella\". The condition (a boolean from module 3) is checked; if it's true, the indented or bracketed block runs; if not, it's skipped entirely." },
        { kind: 'poly',
          pseudo: `set temperature to 8
if temperature < 10 then
    display "Wear a coat"
end if
display "Have a nice day"`,
          python: `temperature = 8
if temperature < 10:
    print("Wear a coat")       # indented = inside the if
print("Have a nice day")       # not indented = always runs`,
          ts: `const temperature = 8;
if (temperature < 10) {
    console.log("Wear a coat");
}
console.log("Have a nice day");`,
          go: `temperature := 8
if temperature < 10 {
    fmt.Println("Wear a coat")
}
fmt.Println("Have a nice day")`,
          java: `int temperature = 8;
if (temperature < 10) {
    System.out.println("Wear a coat");
}
System.out.println("Have a nice day");`,
          cpp: `int temperature = 8;
if (temperature < 10) {
    std::cout << "Wear a coat\\n";
}
std::cout << "Have a nice day\\n";`,
          caption: 'Python uses indentation to show what\'s inside the `if`; the others use curly braces `{ }`. Indent consistently in every language: it\'s how humans read structure.' },
        { kind: 'check', q: 'With temperature 15, what does the program print?', options: ['Wear a coat, then Have a nice day', 'Only Have a nice day', 'Only Wear a coat', 'Nothing'], answer: 1, hint: 'Is 15 < 10?', explain: 'The condition is false, so the block is skipped.' },
      ],
    },
    {
      id: 'else',
      title: 'if / else',
      blocks: [
        { kind: 'analogy', text: "`else` is the other branch of the fork: exactly one of the two paths is taken, never both, never neither. \"If you're 18 or over, you may enter; otherwise, you may not.\"" },
        { kind: 'poly',
          pseudo: `set balance to 40
set price to 55
if balance >= price then
    display "Purchase approved"
else
    display "Insufficient funds"
end if`,
          python: `balance, price = 40, 55
if balance >= price:
    print("Purchase approved")
else:
    print("Insufficient funds")`,
          ts: `const balance = 40, price = 55;
if (balance >= price) {
    console.log("Purchase approved");
} else {
    console.log("Insufficient funds");
}`,
          go: `balance, price := 40, 55
if balance >= price {
    fmt.Println("Purchase approved")
} else {
    fmt.Println("Insufficient funds")
}`,
          java: `int balance = 40, price = 55;
if (balance >= price) {
    System.out.println("Purchase approved");
} else {
    System.out.println("Insufficient funds");
}`,
          cpp: `int balance = 40, price = 55;
if (balance >= price) {
    std::cout << "Purchase approved\\n";
} else {
    std::cout << "Insufficient funds\\n";
}` },
        { kind: 'check', q: 'In an if/else, how many of the two blocks run?', options: ['Both', 'Exactly one', 'Neither', 'Depends on the language'], answer: 1, hint: 'A fork in the road.', explain: 'If the condition is true, the first; otherwise, the else.' },
      ],
    },
    {
      id: 'elseif',
      title: 'else if chains',
      blocks: [
        { kind: 'analogy', text: "Some decisions have more than two outcomes, like grading an exam or charging different delivery rates. An else-if chain checks conditions in order and takes the **first** one that's true, like a receptionist going down a list: \"Over 70? Distinction. Otherwise, over 50? Pass. Otherwise, fail.\" Order matters." },
        { kind: 'poly',
          pseudo: `set score to 64
if score >= 70 then
    display "Distinction"
else if score >= 50 then
    display "Pass"
else
    display "Fail"
end if`,
          python: `score = 64
if score >= 70:
    print("Distinction")
elif score >= 50:          # Python spells it elif
    print("Pass")
else:
    print("Fail")`,
          ts: `const score = 64;
if (score >= 70) {
    console.log("Distinction");
} else if (score >= 50) {
    console.log("Pass");
} else {
    console.log("Fail");
}`,
          go: `score := 64
if score >= 70 {
    fmt.Println("Distinction")
} else if score >= 50 {
    fmt.Println("Pass")
} else {
    fmt.Println("Fail")
}`,
          java: `int score = 64;
if (score >= 70) {
    System.out.println("Distinction");
} else if (score >= 50) {
    System.out.println("Pass");
} else {
    System.out.println("Fail");
}`,
          cpp: `int score = 64;
if (score >= 70) {
    std::cout << "Distinction\\n";
} else if (score >= 50) {
    std::cout << "Pass\\n";
} else {
    std::cout << "Fail\\n";
}` },
        { kind: 'pitfall', text: 'Put the most specific condition first. If the chain started with `score >= 50`, a score of 90 would be labelled "Pass" because that check comes first and is already true, so "Distinction" would never be reached.' },
        { kind: 'check', q: 'With score 85, which branch runs?', options: ['Distinction', 'Pass', 'Fail', 'Distinction and Pass'], answer: 0, hint: 'The first true condition wins.', explain: 'Only one branch of a chain ever runs.' },
      ],
    },
    {
      id: 'nested',
      title: 'Nested decisions',
      blocks: [
        { kind: 'analogy', text: "Decisions can sit inside other decisions, like a flowchart with branches off branches: \"If the shop is open: if the item is in stock, sell it; otherwise, offer to order it. Otherwise, say we're closed.\" Deep nesting gets hard to read quickly, so combining conditions with and/or or checking the bad cases first often keeps code flatter." },
        { kind: 'poly',
          pseudo: `set is_open to true
set in_stock to false
if not is_open then
    display "Sorry, we're closed"
else if in_stock then
    display "Here you go"
else
    display "We can order it for you"
end if`,
          python: `is_open, in_stock = True, False
if not is_open:
    print("Sorry, we're closed")
elif in_stock:
    print("Here you go")
else:
    print("We can order it for you")`,
          ts: `const isOpen = true, inStock = false;
if (!isOpen) {
    console.log("Sorry, we're closed");
} else if (inStock) {
    console.log("Here you go");
} else {
    console.log("We can order it for you");
}`,
          go: `isOpen, inStock := true, false
if !isOpen {
    fmt.Println("Sorry, we're closed")
} else if inStock {
    fmt.Println("Here you go")
} else {
    fmt.Println("We can order it for you")
}`,
          java: `boolean isOpen = true, inStock = false;
if (!isOpen) {
    System.out.println("Sorry, we're closed");
} else if (inStock) {
    System.out.println("Here you go");
} else {
    System.out.println("We can order it for you");
}`,
          cpp: `bool isOpen = true, inStock = false;
if (!isOpen) {
    std::cout << "Sorry, we're closed\\n";
} else if (inStock) {
    std::cout << "Here you go\\n";
} else {
    std::cout << "We can order it for you\\n";
}`,
          caption: 'Handling the "closed" case first avoids putting the stock check inside another if. Programmers call this a guard clause.' },
        { kind: 'check', q: 'With is_open false and in_stock true, what prints?', options: ['Here you go', 'Sorry, we\'re closed', 'We can order it for you', 'Nothing'], answer: 1, hint: 'Which condition is checked first?', explain: 'The first branch is true, so the rest are skipped.' },
      ],
    },
    {
      id: 'testing',
      title: 'Testing every branch',
      blocks: [
        { kind: 'analogy', text: "A fork in the road is only safe if you've walked every path. For each decision, pick test values that take each branch, plus the values right on the boundary (exactly 50, exactly 70), where off-by-one mistakes like `>` instead of `>=` hide." },
        { kind: 'list', items: [
          '**One test per branch**: for the grading chain, try 85, 64 and 20.',
          '**Boundaries**: try 70, 69, 50 and 49. Is 70 a distinction? The spec should say, and the code should agree.',
          '**Odd inputs**: negative scores, 101, or no score at all. What should happen?',
          'Module 9 shows how to turn these checks into automatic tests that run every time you change the code.',
        ] },
        { kind: 'check', q: 'Which set of test scores best checks the grading chain?', options: ['85 only', '85, 64, 20', '70, 69, 50, 49, 85, 20', '100, 100, 100'], answer: 2, hint: 'Every branch and both boundaries.', explain: 'Boundaries are where `>` vs `>=` bugs live.' },
      ],
    },
  ],
  quiz: [
    { q: 'An if block runs when its condition is…', options: ['false', 'true', 'a string', 'zero'], answer: 1, explain: 'Otherwise it\'s skipped.' },
    { q: 'How does Python mark what\'s inside an if?', options: ['Curly braces', 'Indentation', 'The word end', 'Semicolons'], answer: 1, explain: 'Others use { }.' },
    { q: 'With if/else, …', options: ['Both blocks may run', 'Exactly one block runs', 'Neither may run', 'else runs first'], answer: 1, explain: 'Two paths, one taken.' },
    { q: 'In an else-if chain, which branch runs?', options: ['All true ones', 'The first true one', 'The last true one', 'A random true one'], answer: 1, explain: 'Order matters.' },
    { q: 'Python\'s spelling of else-if is…', options: ['elseif', 'else if', 'elif', 'elsif'], answer: 2, explain: 'Short for else if.' },
    { q: 'A guard clause…', options: ['Locks a variable', 'Handles a special or bad case early to avoid deep nesting', 'Is a loop', 'Is a comment'], answer: 1, explain: 'Keeps code flat.' },
    { q: 'Why test boundary values like exactly 50?', options: ['They\'re rare', 'Off-by-one mistakes (> vs >=) show up there', 'They\'re faster', 'They\'re required by Python'], answer: 1, explain: 'Edges hide bugs.' },
    { q: 'If the chain checks `score >= 50` before `score >= 70`, a score of 90 gets…', options: ['Distinction', 'Pass', 'Fail', 'Both'], answer: 1, explain: 'The first true condition wins.' },
  ],
}
