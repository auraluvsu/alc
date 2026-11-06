import type { Module } from '../types'

export const f07: Module = {
  n: 7,
  title: 'Functions',
  tour: 'Structure',
  summary: 'Packaging steps under a name so you can reuse them: defining and calling functions, parameters and arguments, return values, scope (which variables a function can see), and breaking big problems into small functions.',
  topics: ['Defining & calling', 'Parameters & arguments', 'Return values', 'Scope', 'Breaking problems down'],
  cpp23: ['These examples are complete programs: functions live outside `main` in Go, Java and C++.'],
  lessons: [
    {
      id: 'define',
      title: 'Defining & calling',
      blocks: [
        { kind: 'analogy', text: "A function is a recipe card with a name on it. Writing the card (defining the function) cooks nothing. Later, anywhere in the program, you say the name (call the function) and the steps run. Write it once, use it a hundred times, and if the recipe needs fixing, you fix it in one place." },
        { kind: 'poly',
          pseudo: `function greet()
    display "Good morning!"
    display "Markets open at 8."
end function

greet()
greet()`,
          python: `def greet():
    print("Good morning!")
    print("Markets open at 8.")

greet()       # the brackets mean "run it now"
greet()`,
          ts: `function greet(): void {
    console.log("Good morning!");
    console.log("Markets open at 8.");
}

greet();
greet();`,
          go: `package main

import "fmt"

func greet() {
    fmt.Println("Good morning!")
    fmt.Println("Markets open at 8.")
}

func main() {
    greet()
    greet()
}`,
          java: `public class Main {
    static void greet() {
        System.out.println("Good morning!");
        System.out.println("Markets open at 8.");
    }

    public static void main(String[] args) {
        greet();
        greet();
    }
}`,
          cpp: `#include <iostream>

void greet() {
    std::cout << "Good morning!\\n";
    std::cout << "Markets open at 8.\\n";
}

int main() {
    greet();
    greet();
}`,
          caption: '`void` (TypeScript, Java, C++) means the function gives nothing back. Lesson 3 covers functions that do.' },
        { kind: 'check', q: 'What happens when a function is defined but never called?', options: ['It runs once automatically', 'Nothing: its steps never run', 'An error', 'It runs at the end'], answer: 1, hint: 'Writing the recipe card cooks nothing.', explain: 'Calling it, with brackets, runs it.' },
      ],
    },
    {
      id: 'params',
      title: 'Parameters & arguments',
      blocks: [
        { kind: 'analogy', text: "Parameters are blanks on the recipe card: \"bake for ___ minutes\". Each time you call the function you fill in the blanks with arguments: \"bake for 20 minutes\". The same function now does slightly different work depending on what you pass in." },
        { kind: 'poly',
          pseudo: `function greet(name, hour)
    if hour < 12 then
        display "Good morning, " + name
    else
        display "Good afternoon, " + name
    end if
end function

greet("Ada", 9)
greet("Linus", 15)`,
          python: `def greet(name, hour):          # name and hour are parameters
    if hour < 12:
        print("Good morning, " + name)
    else:
        print("Good afternoon, " + name)

greet("Ada", 9)                 # "Ada" and 9 are arguments
greet("Linus", 15)`,
          ts: `function greet(name: string, hour: number): void {
    if (hour < 12) console.log("Good morning, " + name);
    else console.log("Good afternoon, " + name);
}

greet("Ada", 9);
greet("Linus", 15);`,
          go: `package main

import "fmt"

func greet(name string, hour int) {
    if hour < 12 {
        fmt.Println("Good morning, " + name)
    } else {
        fmt.Println("Good afternoon, " + name)
    }
}

func main() {
    greet("Ada", 9)
    greet("Linus", 15)
}`,
          java: `public class Main {
    static void greet(String name, int hour) {
        if (hour < 12) System.out.println("Good morning, " + name);
        else System.out.println("Good afternoon, " + name);
    }

    public static void main(String[] args) {
        greet("Ada", 9);
        greet("Linus", 15);
    }
}`,
          cpp: `#include <iostream>
#include <string>

void greet(const std::string& name, int hour) {
    if (hour < 12) std::cout << "Good morning, " << name << '\\n';
    else std::cout << "Good afternoon, " << name << '\\n';
}

int main() {
    greet("Ada", 9);
    greet("Linus", 15);
}`,
          caption: 'TypeScript, Go, Java and C++ state each parameter\'s type, so calling `greet(9, "Ada")` is caught before the program runs.' },
        { kind: 'check', q: 'In `greet("Ada", 9)`, what is "Ada"?', options: ['A parameter', 'An argument', 'A return value', 'A type'], answer: 1, hint: 'The value filled into the blank.', explain: 'Parameters are the blanks in the definition; arguments are the values passed in.' },
      ],
    },
    {
      id: 'return',
      title: 'Return values',
      blocks: [
        { kind: 'analogy', text: "Some recipes produce something you take away: a cake. `return` hands a value back to whoever called the function, so the call itself becomes a value you can store, print or use in a bigger expression, like `total = price_with_vat(100) + delivery`. `return` also ends the function immediately." },
        { kind: 'poly',
          pseudo: `function with_vat(price)
    return price * 1.2
end function

set total to with_vat(100) + 5
display total                 # 125`,
          python: `def with_vat(price):
    return price * 1.2

total = with_vat(100) + 5
print(total)             # 125.0
print(with_vat(50))      # 60.0`,
          ts: `function withVat(price: number): number {
    return price * 1.2;
}

const total = withVat(100) + 5;
console.log(total);           // 125
console.log(withVat(50));     // 60`,
          go: `package main

import "fmt"

func withVat(price float64) float64 {
    return price * 1.2
}

func main() {
    total := withVat(100) + 5
    fmt.Println(total)         // 125
    fmt.Println(withVat(50))   // 60
}`,
          java: `public class Main {
    static double withVat(double price) {
        return price * 1.2;
    }

    public static void main(String[] args) {
        double total = withVat(100) + 5;
        System.out.println(total);         // 125.0
        System.out.println(withVat(50));   // 60.0
    }
}`,
          cpp: `#include <iostream>

double withVat(double price) {
    return price * 1.2;
}

int main() {
    double total = withVat(100) + 5;
    std::cout << total << '\\n';         // 125
    std::cout << withVat(50) << '\\n';   // 60
}` },
        { kind: 'pitfall', text: 'Printing is not returning. A function that `print`s its answer shows it on screen but hands nothing back, so `total = with_vat(100) + 5` would fail. Functions that calculate should usually return the result and let the caller decide whether to print it.' },
        { kind: 'check', q: 'What does `return` do?', options: ['Prints a value', 'Hands a value back to the caller and ends the function', 'Repeats the function', 'Restarts the program'], answer: 1, hint: 'The cake you take away.', explain: 'The call expression becomes that value.' },
      ],
    },
    {
      id: 'scope',
      title: 'Scope',
      blocks: [
        { kind: 'analogy', text: "Variables created inside a function are private to it, like notes on a chef's own notepad: they exist while the recipe is being cooked and are thrown away afterwards, and no other chef can read them. That's a feature: functions can't accidentally overwrite each other's variables, and you can reuse names like `total` in many functions safely." },
        { kind: 'poly',
          pseudo: `function average(numbers)
    set total to 0                  # local to average
    for each n in numbers
        add n to total
    end for
    return total / length of numbers
end function

display average([2, 4, 9])           # 5
# display total   → error: total only exists inside average`,
          python: `def average(numbers):
    total = 0                       # local variable
    for n in numbers:
        total += n
    return total / len(numbers)

print(average([2, 4, 9]))           # 5.0
# print(total)  → NameError: name 'total' is not defined`,
          ts: `function average(numbers: number[]): number {
    let total = 0;                    // local variable
    for (const n of numbers) total += n;
    return total / numbers.length;
}

console.log(average([2, 4, 9]));     // 5
// console.log(total);  → error: Cannot find name 'total'`,
          go: `package main

import "fmt"

func average(numbers []float64) float64 {
    total := 0.0                    // local variable
    for _, n := range numbers {
        total += n
    }
    return total / float64(len(numbers))
}

func main() {
    fmt.Println(average([]float64{2, 4, 9}))   // 5
    // fmt.Println(total)  → compile error: undefined: total
}`,
          java: `public class Main {
    static double average(double[] numbers) {
        double total = 0;            // local variable
        for (double n : numbers) total += n;
        return total / numbers.length;
    }

    public static void main(String[] args) {
        System.out.println(average(new double[]{2, 4, 9}));   // 5.0
    }
}`,
          cpp: `#include <iostream>
#include <vector>

double average(const std::vector<double>& numbers) {
    double total = 0;                // local variable
    for (double n : numbers) total += n;
    return total / numbers.size();
}

int main() {
    std::cout << average({2, 4, 9}) << '\\n';   // 5
}` },
        { kind: 'check', q: 'Can code outside `average` use its variable `total`?', options: ['Yes, always', 'No: it\'s local to the function', 'Only after calling it', 'Only in Python'], answer: 1, hint: 'The chef\'s private notepad.', explain: 'Return the value instead.' },
      ],
    },
    {
      id: 'decompose',
      title: 'Breaking problems down',
      blocks: [
        { kind: 'analogy', text: "A big task like \"run a restaurant\" becomes manageable when split into named jobs: take orders, cook, serve, take payment. Each job is small enough to understand and test on its own. Good functions do **one** thing, have a name that says what that is, and are short enough to read in one go." },
        { kind: 'poly',
          pseudo: `function subtotal(prices)
    return sum of prices
end function

function delivery(amount)
    if amount >= 50 then return 0 else return 4.99
end function

function checkout(prices)
    set amount to subtotal(prices)
    return amount + delivery(amount)
end function

display checkout([20, 15])     # 39.99
display checkout([30, 25])     # 55`,
          python: `def subtotal(prices):
    return sum(prices)

def delivery(amount):
    return 0 if amount >= 50 else 4.99

def checkout(prices):
    amount = subtotal(prices)
    return amount + delivery(amount)

print(checkout([20, 15]))     # 39.99
print(checkout([30, 25]))     # 55`,
          ts: `const subtotal = (prices: number[]) => prices.reduce((a, b) => a + b, 0);
const delivery = (amount: number) => (amount >= 50 ? 0 : 4.99);

function checkout(prices: number[]): number {
    const amount = subtotal(prices);
    return amount + delivery(amount);
}

console.log(checkout([20, 15]));   // 39.99
console.log(checkout([30, 25]));   // 55`,
          go: `package main

import "fmt"

func subtotal(prices []float64) float64 {
    total := 0.0
    for _, p := range prices {
        total += p
    }
    return total
}

func delivery(amount float64) float64 {
    if amount >= 50 {
        return 0
    }
    return 4.99
}

func checkout(prices []float64) float64 {
    amount := subtotal(prices)
    return amount + delivery(amount)
}

func main() {
    fmt.Println(checkout([]float64{20, 15}))   // 39.99
    fmt.Println(checkout([]float64{30, 25}))   // 55
}`,
          java: `public class Main {
    static double subtotal(double[] prices) {
        double total = 0;
        for (double p : prices) total += p;
        return total;
    }
    static double delivery(double amount) { return amount >= 50 ? 0 : 4.99; }
    static double checkout(double[] prices) {
        double amount = subtotal(prices);
        return amount + delivery(amount);
    }
    public static void main(String[] args) {
        System.out.println(checkout(new double[]{20, 15}));   // 39.99
        System.out.println(checkout(new double[]{30, 25}));   // 55.0
    }
}`,
          cpp: `#include <iostream>
#include <vector>

double subtotal(const std::vector<double>& prices) {
    double total = 0;
    for (double p : prices) total += p;
    return total;
}
double delivery(double amount) { return amount >= 50 ? 0 : 4.99; }
double checkout(const std::vector<double>& prices) {
    double amount = subtotal(prices);
    return amount + delivery(amount);
}

int main() {
    std::cout << checkout({20, 15}) << '\\n';   // 39.99
    std::cout << checkout({30, 25}) << '\\n';   // 55
}`,
          caption: '`condition ? a : b` (and Python\'s `a if condition else b`) is a compact if/else that produces a value.' },
        { kind: 'check', q: 'What makes a good function?', options: ['As long as possible', 'Does one clear job and is named after it', 'Uses many global variables', 'Prints everything'], answer: 1, hint: 'Take orders, cook, serve.', explain: 'Small, named, testable pieces.' },
      ],
    },
  ],
  quiz: [
    { q: 'Defining a function…', options: ['Runs it', 'Gives a name to steps so they can be run later', 'Deletes it', 'Creates a variable only'], answer: 1, explain: 'Calling runs it.' },
    { q: 'In `def area(w, h):`, w and h are…', options: ['Arguments', 'Parameters', 'Return values', 'Globals'], answer: 1, explain: 'Arguments are the values passed in a call.' },
    { q: 'What does `return` do to the rest of the function?', options: ['Runs it anyway', 'Skips it: the function ends', 'Repeats it', 'Nothing'], answer: 1, explain: 'Return ends the function.' },
    { q: 'A function that only prints its result…', options: ['Also returns it', 'Returns nothing usable', 'Is faster', 'Is required'], answer: 1, explain: 'Return values to reuse them.' },
    { q: 'A variable created inside a function is…', options: ['Global', 'Local to that function', 'Shared by all functions', 'Constant'], answer: 1, explain: 'Scope.' },
    { q: '`void` in Java, C++ and TypeScript means…', options: ['Empty string', 'The function returns nothing', 'Error', 'Any type'], answer: 1, explain: 'No return value.' },
    { q: 'Why split code into several small functions?', options: ['It runs slower', 'Each piece is easier to understand, test and reuse', 'Languages require it', 'To use more memory'], answer: 1, explain: 'Decomposition.' },
    { q: '`x if cond else y` in Python means…', options: ['A loop', 'x when cond is true, otherwise y', 'Always x', 'A function'], answer: 1, explain: 'Like cond ? x : y.' },
  ],
}
