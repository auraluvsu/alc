import type { Module } from '../types'

export const f05: Module = {
  n: 5,
  title: 'Repetition: Loops',
  tour: 'Control flow',
  summary: 'Doing things many times without writing them many times: while loops, counting loops, looping over a collection, building up a running total, stopping early with break, and avoiding loops that never end.',
  topics: ['while loops', 'Counting loops', 'Running totals', 'break & continue', 'Infinite loops'],
  cpp23: ['Every language here has a "for each" loop over a collection: `for x in xs` (Python), `for (const x of xs)` (TS), `for _, x := range xs` (Go), `for (var x : xs)` (Java), `for (auto x : xs)` (C++).'],
  lessons: [
    {
      id: 'while',
      title: 'while loops',
      blocks: [
        { kind: 'analogy', text: "A `while` loop is \"keep stirring while the sauce is lumpy\". Check the condition; if it's true, do the body, then come back and check again. The moment the condition is false, carry on with the rest of the program. Something in the body must eventually make the condition false, or you'll be stirring forever." },
        { kind: 'poly',
          pseudo: `set savings to 0
set months to 0
while savings < 1000
    add 150 to savings
    add 1 to months
end while
display months           # 7`,
          python: `savings = 0
months = 0
while savings < 1000:
    savings += 150
    months += 1
print(months)            # 7`,
          ts: `let savings = 0;
let months = 0;
while (savings < 1000) {
    savings += 150;
    months += 1;
}
console.log(months);     // 7`,
          go: `savings := 0
months := 0
for savings < 1000 {        // Go has no "while": a for with just a condition
    savings += 150
    months++
}
fmt.Println(months)         // 7`,
          java: `int savings = 0;
int months = 0;
while (savings < 1000) {
    savings += 150;
    months++;
}
System.out.println(months);   // 7`,
          cpp: `int savings = 0;
int months = 0;
while (savings < 1000) {
    savings += 150;
    months++;
}
std::cout << months << '\\n';   // 7`,
          caption: '`months++` is shorthand for "add 1 to months" in TypeScript, Go, Java and C++.' },
        { kind: 'check', q: 'Saving £150 a month, after how many months do you first have at least £1,000?', options: ['6', '7', '8', '1000'], answer: 1, hint: '6 × 150 = 900.', explain: '7 × 150 = 1,050.' },
      ],
    },
    {
      id: 'counting',
      title: 'Counting loops',
      blocks: [
        { kind: 'analogy', text: "When you know how many times to repeat, a counting loop keeps the counter for you: \"do 10 press-ups, counting 1 to 10\". Programmers usually count from 0 (module 6 explains why), so \"5 times\" is usually written as 0, 1, 2, 3, 4." },
        { kind: 'stepper', title: 'Step through: for i from 1 to 3', code: [
          'set total to 0',
          'for i from 1 to 3',
          '    add i to total',
          'end for',
          'display total',
        ], steps: [
          { line: 1, note: 'Start the running total at zero.', memory: [{ name: 'total', value: '0' }] },
          { line: 2, note: 'The loop starts: i is 1.', memory: [{ name: 'total', value: '0' }, { name: 'i', value: '1' }] },
          { line: 3, note: 'total becomes 0 + 1 = 1.', memory: [{ name: 'total', value: '1' }, { name: 'i', value: '1' }] },
          { line: 2, note: 'Back to the top: i becomes 2.', memory: [{ name: 'total', value: '1' }, { name: 'i', value: '2' }] },
          { line: 3, note: 'total becomes 1 + 2 = 3.', memory: [{ name: 'total', value: '3' }, { name: 'i', value: '2' }] },
          { line: 2, note: 'i becomes 3, the last value.', memory: [{ name: 'total', value: '3' }, { name: 'i', value: '3' }] },
          { line: 3, note: 'total becomes 3 + 3 = 6.', memory: [{ name: 'total', value: '6' }, { name: 'i', value: '3' }] },
          { line: 5, note: 'The loop is finished. Display 6.', memory: [{ name: 'total', value: '6', kind: 'heap' }] },
        ] },
        { kind: 'poly',
          pseudo: `for i from 0 to 4
    display "Press-up number " + i
end for`,
          python: `for i in range(5):          # 0, 1, 2, 3, 4  (5 is NOT included)
    print("Press-up number", i)`,
          ts: `for (let i = 0; i < 5; i++) {     // start; keep going while; step
    console.log("Press-up number", i);
}`,
          go: `for i := 0; i < 5; i++ {
    fmt.Println("Press-up number", i)
}`,
          java: `for (int i = 0; i < 5; i++) {
    System.out.println("Press-up number " + i);
}`,
          cpp: `for (int i = 0; i < 5; i++) {
    std::cout << "Press-up number " << i << '\\n';
}`,
          caption: 'The C-style `for (start; condition; step)` is a while loop with the counter bookkeeping packed into one line.' },
        { kind: 'check', q: 'In Python, how many times does `for i in range(5)` repeat?', options: ['4', '5', '6', 'Forever'], answer: 1, hint: '0 up to but not including 5.', explain: 'i takes 0, 1, 2, 3, 4.' },
      ],
    },
    {
      id: 'totals',
      title: 'Looping over a collection & running totals',
      blocks: [
        { kind: 'analogy', text: "The most common loop of all: go through a list one item at a time and do something with each, like a cashier scanning every item in a basket and keeping a running total on the till. The variable outside the loop remembers the total between items." },
        { kind: 'poly',
          pseudo: `set prices to [3, 12, 7, 20]
set total to 0
set most_expensive to 0
for each price in prices
    add price to total
    if price > most_expensive then
        set most_expensive to price
    end if
end for
display total             # 42
display most_expensive    # 20`,
          python: `prices = [3, 12, 7, 20]
total = 0
most_expensive = 0
for price in prices:
    total += price
    if price > most_expensive:
        most_expensive = price
print(total)              # 42
print(most_expensive)     # 20
print(sum(prices), max(prices))   # built-ins do the same`,
          ts: `const prices = [3, 12, 7, 20];
let total = 0;
let mostExpensive = 0;
for (const price of prices) {
    total += price;
    if (price > mostExpensive) mostExpensive = price;
}
console.log(total);           // 42
console.log(mostExpensive);   // 20`,
          go: `prices := []int{3, 12, 7, 20}
total := 0
mostExpensive := 0
for _, price := range prices {    // range gives index and value; _ ignores the index
    total += price
    if price > mostExpensive {
        mostExpensive = price
    }
}
fmt.Println(total)           // 42
fmt.Println(mostExpensive)   // 20`,
          java: `int[] prices = {3, 12, 7, 20};
int total = 0;
int mostExpensive = 0;
for (int price : prices) {
    total += price;
    if (price > mostExpensive) mostExpensive = price;
}
System.out.println(total);           // 42
System.out.println(mostExpensive);   // 20`,
          cpp: `std::vector<int> prices = {3, 12, 7, 20};
int total = 0;
int mostExpensive = 0;
for (int price : prices) {
    total += price;
    if (price > mostExpensive) mostExpensive = price;
}
std::cout << total << '\\n';           // 42
std::cout << mostExpensive << '\\n';   // 20` },
        { kind: 'check', q: 'Why is `total` created before the loop rather than inside it?', options: ['Style only', 'Inside the loop it would be reset to 0 for every item', 'Loops can\'t create variables', 'It\'s faster'], answer: 1, hint: 'The till keeps its total between items.', explain: 'Accumulators live outside the loop.' },
      ],
    },
    {
      id: 'break',
      title: 'break & continue',
      blocks: [
        { kind: 'analogy', text: "Sometimes you don't need to finish the whole list. `break` is \"found my keys, stop searching\": it leaves the loop immediately. `continue` is \"this one's no good, skip to the next\": it jumps straight to the next item without running the rest of the body." },
        { kind: 'poly',
          pseudo: `set names to ["Ann", "Bo", "", "Cy", "Dee"]
for each name in names
    if name is empty then
        skip to the next name        # continue
    end if
    if name = "Cy" then
        display "Found Cy!"
        stop the loop                # break
    end if
    display "Checked " + name
end for`,
          python: `names = ["Ann", "Bo", "", "Cy", "Dee"]
for name in names:
    if name == "":
        continue
    if name == "Cy":
        print("Found Cy!")
        break
    print("Checked", name)
# Checked Ann / Checked Bo / Found Cy!`,
          ts: `const names = ["Ann", "Bo", "", "Cy", "Dee"];
for (const name of names) {
    if (name === "") continue;
    if (name === "Cy") {
        console.log("Found Cy!");
        break;
    }
    console.log("Checked", name);
}`,
          go: `names := []string{"Ann", "Bo", "", "Cy", "Dee"}
for _, name := range names {
    if name == "" {
        continue
    }
    if name == "Cy" {
        fmt.Println("Found Cy!")
        break
    }
    fmt.Println("Checked", name)
}`,
          java: `String[] names = {"Ann", "Bo", "", "Cy", "Dee"};
for (String name : names) {
    if (name.isEmpty()) continue;
    if (name.equals("Cy")) {
        System.out.println("Found Cy!");
        break;
    }
    System.out.println("Checked " + name);
}`,
          cpp: `std::vector<std::string> names = {"Ann", "Bo", "", "Cy", "Dee"};
for (const auto& name : names) {
    if (name.empty()) continue;
    if (name == "Cy") {
        std::cout << "Found Cy!\\n";
        break;
    }
    std::cout << "Checked " << name << '\\n';
}` },
        { kind: 'check', q: 'In the example, is "Dee" ever checked?', options: ['Yes', 'No: the loop stopped at Cy', 'Only if Cy is missing', 'Twice'], answer: 1, hint: 'What does break do?', explain: 'break leaves the loop entirely.' },
      ],
    },
    {
      id: 'infinite',
      title: 'Infinite loops',
      blocks: [
        { kind: 'analogy', text: "A loop whose condition never becomes false runs forever, like a washing machine stuck on rinse. Usually it's a forgotten update (\"keep stirring while lumpy\", but the stirring never happens). Some programs loop forever on purpose, like a game loop or a server waiting for requests, and leave with `break` or when the program is stopped." },
        { kind: 'poly',
          pseudo: `set count to 10
while count > 0
    display count
    # forgot: subtract 1 from count   ← runs forever
end while`,
          python: `count = 10
while count > 0:
    print(count)
    count -= 1       # without this line the loop never ends (stop it with Ctrl+C)
print("Lift-off!")`,
          ts: `let count = 10;
while (count > 0) {
    console.log(count);
    count -= 1;      // remove this and the loop never ends
}
console.log("Lift-off!");`,
          go: `count := 10
for count > 0 {
    fmt.Println(count)
    count--
}
fmt.Println("Lift-off!")`,
          java: `int count = 10;
while (count > 0) {
    System.out.println(count);
    count--;
}
System.out.println("Lift-off!");`,
          cpp: `int count = 10;
while (count > 0) {
    std::cout << count << '\\n';
    count--;
}
std::cout << "Lift-off!\\n";`,
          caption: 'If a program seems frozen, press Ctrl+C in the terminal to stop it.' },
        { kind: 'check', q: 'A while loop never ends. What\'s the most likely cause?', options: ['The computer is slow', 'Nothing in the body makes the condition become false', 'Too many variables', 'The loop is too short'], answer: 1, hint: 'The stirring never happens.', explain: 'Check that the loop variable is updated.' },
      ],
    },
  ],
  quiz: [
    { q: 'A while loop repeats…', options: ['A fixed number of times', 'As long as its condition is true', 'Once', 'Forever always'], answer: 1, explain: 'Checked before each pass.' },
    { q: 'Go\'s equivalent of while is…', options: ['while', 'loop', 'for with only a condition', 'repeat'], answer: 2, explain: '`for cond { }`.' },
    { q: '`range(3)` in Python produces…', options: ['1, 2, 3', '0, 1, 2', '0, 1, 2, 3', '3'], answer: 1, explain: 'Stops before 3.' },
    { q: 'Where should a running total be created?', options: ['Inside the loop', 'Before the loop', 'After the loop', 'Anywhere'], answer: 1, explain: 'Or it resets each time.' },
    { q: 'break…', options: ['Skips one item', 'Exits the loop immediately', 'Restarts the loop', 'Pauses'], answer: 1, explain: 'continue skips one item.' },
    { q: 'continue…', options: ['Exits the loop', 'Skips the rest of this pass and moves to the next item', 'Ends the program', 'Repeats the item'], answer: 1, explain: '"Next, please".' },
    { q: 'How do you stop a runaway program in a terminal?', options: ['Ctrl+S', 'Ctrl+C', 'Delete', 'Esc'], answer: 1, explain: 'Interrupts it.' },
    { q: '`for (int i = 0; i < 5; i++)` runs the body how many times?', options: ['4', '5', '6', '0'], answer: 1, explain: 'i = 0…4.' },
  ],
}
