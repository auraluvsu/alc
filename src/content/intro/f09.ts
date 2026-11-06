import type { Module } from '../types'

export const f09: Module = {
  n: 9,
  title: 'Errors & Debugging',
  tour: 'Skills',
  summary: 'Everyone\'s code breaks. The three kinds of error, reading an error message calmly, handling expected failures (bad input, missing files) instead of crashing, tracing code by hand, and writing small tests that catch mistakes automatically.',
  topics: ['Three kinds of error', 'Reading error messages', 'Handling expected failures', 'Tracing & print debugging', 'Writing tests'],
  cpp23: ['Error styles differ: Python, TypeScript, Java and C++ use exceptions (`try`/`catch`); Go returns an error value you check with `if err != nil`.'],
  lessons: [
    {
      id: 'kinds',
      title: 'Three kinds of error',
      blocks: [
        { kind: 'analogy', text: "Think of a recipe again. A **syntax error** is a sentence so garbled the chef can't read it at all, so nothing gets cooked. A **runtime error** is a step that can't be done when you reach it (\"take the eggs out of the fridge\", but there are no eggs) and cooking stops. A **logic error** is a recipe that runs perfectly but makes the wrong dish: salt instead of sugar. Logic errors are the sneakiest, because nothing complains." },
        { kind: 'poly',
          pseudo: `# Syntax error: the language can't even read it
display "unfinished

# Runtime error: valid, but fails while running
set prices to []
display first item of prices          # there isn't one

# Logic error: runs fine, wrong answer
set average to total / 2              # should divide by the count`,
          python: `# Syntax error: SyntaxError before anything runs
# print("unfinished

# Runtime error: IndexError while running
prices = []
# print(prices[0])

# Logic error: runs fine, wrong answer
prices = [10, 20, 30]
average = sum(prices) / 2       # should be len(prices)
print(average)                  # 30.0, but the true average is 20.0`,
          ts: `// Syntax error: the compiler refuses
// console.log("unfinished

// Runtime error
const prices: number[] = [];
// prices[0].toFixed(2)   → TypeError: Cannot read properties of undefined

// Logic error
const ps = [10, 20, 30];
const average = ps.reduce((a, b) => a + b, 0) / 2;   // should be ps.length
console.log(average);                                 // 30`,
          go: `// Syntax error: go build refuses
// fmt.Println("unfinished

// Runtime error: panic: index out of range [0] with length 0
prices := []int{}
_ = prices
// fmt.Println(prices[0])

// Logic error
ps := []float64{10, 20, 30}
average := (ps[0] + ps[1] + ps[2]) / 2     // should divide by len(ps)
fmt.Println(average)                       // 30`,
          java: `// Syntax error: javac refuses
// System.out.println("unfinished

// Runtime error: IndexOutOfBoundsException
List<Integer> prices = new ArrayList<>();
// prices.get(0);

// Logic error
double[] ps = {10, 20, 30};
double average = (ps[0] + ps[1] + ps[2]) / 2;   // should be ps.length
System.out.println(average);                    // 30.0`,
          cpp: `// Syntax error: the compiler refuses
// std::cout << "unfinished

// Runtime error: with .at() → std::out_of_range; with [] → undefined behaviour
std::vector<int> prices;
// prices.at(0);

// Logic error
std::vector<double> ps = {10, 20, 30};
double average = (ps[0] + ps[1] + ps[2]) / 2;   // should be ps.size()
std::cout << average << '\\n';                   // 30` },
        { kind: 'check', q: 'A program runs without any error message but prints the wrong total. What kind of error is it?', options: ['Syntax', 'Runtime', 'Logic', 'Hardware'], answer: 2, hint: 'Salt instead of sugar.', explain: 'Only tests and careful checking catch these.' },
      ],
    },
    {
      id: 'messages',
      title: 'Reading error messages',
      blocks: [
        { kind: 'analogy', text: "An error message is not a telling-off; it's a note from a very precise colleague saying exactly what went wrong and where. Beginners panic and skim; experienced programmers read the last line first (what happened), then find the line number (where), then read the code around it. The answer is in the message surprisingly often." },
        { kind: 'code', code: `Traceback (most recent call last):
  File "shop.py", line 12, in <module>
    print(checkout(basket))
  File "shop.py", line 8, in checkout
    return subtotal / len(items)
ZeroDivisionError: division by zero

# How to read it:
# 1. LAST line: what went wrong → dividing by zero
# 2. The line just above it: where → shop.py, line 8, in checkout
# 3. The lines above that: how we got there → called from line 12
# 4. Question: why was len(items) zero? → the basket was empty`, caption: 'A Python traceback. Other languages show similar "stack traces".' },
        { kind: 'list', items: [
          '**Read the whole message**, slowly, starting from the bottom in Python (top in Java/C#).',
          '**Go to the exact line** it names and look at the values involved.',
          '**Copy the key phrase** (e.g. "ZeroDivisionError: division by zero") into a search engine: someone has had it before.',
          '**Compiler errors**: fix the *first* one first. Later errors are often knock-on effects of the first.',
        ] },
        { kind: 'check', q: 'In a Python traceback, where is the actual error type and message?', options: ['The first line', 'The last line', 'The middle', 'It isn\'t shown'], answer: 1, hint: 'Read from the bottom.', explain: 'The lines above show the path that led there.' },
      ],
    },
    {
      id: 'handling',
      title: 'Handling expected failures',
      blocks: [
        { kind: 'analogy', text: "Some failures aren't bugs: they're part of normal life. Users type \"ten\" instead of 10, files go missing, networks drop. A good program expects these and handles them gracefully (\"Please enter a number\") instead of crashing, like a shop assistant who says \"we're out of that, can I suggest another?\" rather than walking off." },
        { kind: 'poly',
          pseudo: `function read_quantity(text)
    try
        return text converted to a number
    if that fails
        display "Please enter a whole number"
        return 0
    end try
end function

display read_quantity("12")      # 12
display read_quantity("ten")     # message, then 0`,
          python: `def read_quantity(text):
    try:
        return int(text)
    except ValueError:
        print("Please enter a whole number")
        return 0

print(read_quantity("12"))     # 12
print(read_quantity("ten"))    # Please enter a whole number / 0`,
          ts: `function readQuantity(text: string): number {
    const n = Number(text);
    if (!Number.isInteger(n)) {          // Number("ten") is NaN, not an exception
        console.log("Please enter a whole number");
        return 0;
    }
    return n;
}

console.log(readQuantity("12"));    // 12
console.log(readQuantity("ten"));   // Please enter a whole number / 0`,
          go: `package main

import (
    "fmt"
    "strconv"
)

func readQuantity(text string) int {
    n, err := strconv.Atoi(text)     // Go returns an error value instead of throwing
    if err != nil {
        fmt.Println("Please enter a whole number")
        return 0
    }
    return n
}

func main() {
    fmt.Println(readQuantity("12"))    // 12
    fmt.Println(readQuantity("ten"))   // Please enter a whole number / 0
}`,
          java: `public class Main {
    static int readQuantity(String text) {
        try {
            return Integer.parseInt(text);
        } catch (NumberFormatException e) {
            System.out.println("Please enter a whole number");
            return 0;
        }
    }

    public static void main(String[] args) {
        System.out.println(readQuantity("12"));    // 12
        System.out.println(readQuantity("ten"));   // Please enter a whole number / 0
    }
}`,
          cpp: `#include <iostream>
#include <stdexcept>
#include <string>

int readQuantity(const std::string& text) {
    try {
        return std::stoi(text);
    } catch (const std::invalid_argument&) {
        std::cout << "Please enter a whole number\\n";
        return 0;
    }
}

int main() {
    std::cout << readQuantity("12") << '\\n';    // 12
    std::cout << readQuantity("ten") << '\\n';   // Please enter a whole number / 0
}` },
        { kind: 'pitfall', text: 'Don\'t catch every error and carry on silently (`except: pass`). That hides real bugs. Catch the specific failures you expect (bad number, missing file), handle them sensibly, and let genuine bugs crash loudly so you notice and fix them.' },
        { kind: 'check', q: 'Which situation should be handled rather than treated as a bug?', options: ['A typo in a variable name', 'A user typing letters where a number is expected', 'Dividing by the wrong value', 'Forgetting to call a function'], answer: 1, hint: 'Normal life vs your mistake.', explain: 'Users make mistakes; programs should cope.' },
      ],
    },
    {
      id: 'tracing',
      title: 'Tracing & print debugging',
      blocks: [
        { kind: 'analogy', text: "When the answer is wrong, become the computer: go through the code line by line with pencil and paper, writing down every variable's value as it changes, exactly like the step-through panels in this course. The moment your paper disagrees with what you expected is where the bug is. Print statements do the same thing automatically: they show you what the values really are at each point." },
        { kind: 'stepper', title: 'Step through: find the bug in an average', code: [
          'set numbers to [4, 8, 6]',
          'set total to 0',
          'for each n in numbers',
          '    set total to n',
          'end for',
          'display total / 3',
        ], steps: [
          { line: 1, note: 'Three numbers. Their real average is (4 + 8 + 6) / 3 = 6.', memory: [{ name: 'numbers', value: '[4, 8, 6]' }] },
          { line: 2, note: 'total starts at 0.', memory: [{ name: 'total', value: '0' }] },
          { line: 4, note: 'First pass: n = 4. total becomes… 4. Fine so far.', memory: [{ name: 'n', value: '4' }, { name: 'total', value: '4' }] },
          { line: 4, note: 'Second pass: n = 8. total becomes 8, not 12! We expected 4 + 8. Found it: the line says "set total to n" instead of "add n to total".', memory: [{ name: 'n', value: '8' }, { name: 'total', value: '8', note: 'expected 12', kind: 'dead' }] },
          { line: 4, note: 'Third pass: total becomes 6.', memory: [{ name: 'n', value: '6' }, { name: 'total', value: '6' }] },
          { line: 6, note: 'Displays 2 instead of 6. Tracing pinpointed exactly which line was wrong.', memory: [{ name: 'output', value: '2', kind: 'dead' }] },
        ] },
        { kind: 'list', items: [
          '**Print debugging**: add temporary prints of the variables you suspect (`print("total is", total)`), run, compare with what you expected, then remove them.',
          '**Debuggers** (in VS Code and every IDE) let you pause the program on a line (a breakpoint) and step through it, inspecting every variable. Same idea, no editing.',
          '**Rubber-duck debugging**: explain the code out loud, line by line, to anyone or anything. You\'ll often hear the mistake as you say it.',
        ] },
        { kind: 'check', q: 'What\'s the core idea of tracing?', options: ['Rewriting the program', 'Following the code step by step and recording each variable\'s value to find where reality differs from expectation', 'Running it faster', 'Deleting lines at random'], answer: 1, hint: 'Become the computer.', explain: 'Where your trace and your expectation first differ, the bug is close.' },
      ],
    },
    {
      id: 'tests',
      title: 'Writing tests',
      blocks: [
        { kind: 'analogy', text: "A test is a tiny program that checks your program: \"if I give `average` the numbers 4, 8 and 6, I expect 6\". Run all the tests after every change and you'll know within seconds if you broke something that used to work, like a smoke alarm for code." },
        { kind: 'poly',
          pseudo: `function average(numbers)
    return sum of numbers / length of numbers
end function

check average([4, 8, 6]) = 6
check average([5]) = 5
check average([1, 2]) = 1.5
display "all tests passed"`,
          python: `def average(numbers):
    return sum(numbers) / len(numbers)

assert average([4, 8, 6]) == 6
assert average([5]) == 5
assert average([1, 2]) == 1.5
print("all tests passed")
# Real projects use pytest: put these in test_average.py functions and run "pytest".`,
          ts: `function average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

console.assert(average([4, 8, 6]) === 6, "three numbers");
console.assert(average([5]) === 5, "one number");
console.assert(average([1, 2]) === 1.5, "decimal result");
console.log("all tests passed");
// Real projects use a test runner such as Vitest or Jest.`,
          go: `package main

import "fmt"

func average(numbers []float64) float64 {
    total := 0.0
    for _, n := range numbers {
        total += n
    }
    return total / float64(len(numbers))
}

func check(got, want float64) {
    if got != want {
        panic(fmt.Sprintf("got %v, want %v", got, want))
    }
}

func main() {
    check(average([]float64{4, 8, 6}), 6)
    check(average([]float64{5}), 5)
    check(average([]float64{1, 2}), 1.5)
    fmt.Println("all tests passed")
}
// Real projects put TestAverage(t *testing.T) in average_test.go and run "go test".`,
          java: `public class Main {
    static double average(double[] numbers) {
        double total = 0;
        for (double n : numbers) total += n;
        return total / numbers.length;
    }

    static void check(double got, double want) {
        if (got != want) throw new AssertionError("got " + got + ", want " + want);
    }

    public static void main(String[] args) {
        check(average(new double[]{4, 8, 6}), 6);
        check(average(new double[]{5}), 5);
        check(average(new double[]{1, 2}), 1.5);
        System.out.println("all tests passed");
    }
}
// Real projects use JUnit.`,
          cpp: `#include <cassert>
#include <iostream>
#include <vector>

double average(const std::vector<double>& numbers) {
    double total = 0;
    for (double n : numbers) total += n;
    return total / numbers.size();
}

int main() {
    assert(average({4, 8, 6}) == 6);
    assert(average({5}) == 5);
    assert(average({1, 2}) == 1.5);
    std::cout << "all tests passed\\n";
}
// Real projects use GoogleTest or Catch2.` },
        { kind: 'p', text: 'What about `average([])`, an empty list? Python raises ZeroDivisionError, TypeScript, Java and Go give NaN ("not a number"), C++ gives NaN too. Writing the test forces you to decide what *should* happen, which is half the value of testing.' },
        { kind: 'check', q: 'What\'s the main benefit of automated tests?', options: ['They make code faster', 'They catch mistakes, including ones introduced by later changes, in seconds', 'They replace thinking', 'They\'re required to run code'], answer: 1, hint: 'A smoke alarm for code.', explain: 'Run them after every change.' },
      ],
    },
  ],
  quiz: [
    { q: 'A missing closing quote is a…', options: ['Logic error', 'Syntax error', 'Runtime error', 'Network error'], answer: 1, explain: 'The code can\'t even be read.' },
    { q: 'Dividing by zero while the program runs is a…', options: ['Syntax error', 'Runtime error', 'Style error', 'Compile error always'], answer: 1, explain: 'Valid code that fails when run.' },
    { q: 'Which error produces no error message?', options: ['Syntax', 'Runtime', 'Logic', 'All produce messages'], answer: 2, explain: 'The program just gives wrong results.' },
    { q: 'With several compiler errors, fix…', options: ['The last one first', 'The first one first', 'Any random one', 'None'], answer: 1, explain: 'Later ones are often knock-on effects.' },
    { q: 'try/catch (or try/except) is for…', options: ['Speeding up code', 'Handling failures you expect, like bad input', 'Hiding every error', 'Looping'], answer: 1, explain: 'Catch specific errors.' },
    { q: 'How does Go usually report errors?', options: ['Exceptions', 'An extra error return value checked with if err != nil', 'Printing only', 'It can\'t'], answer: 1, explain: 'Explicit error values.' },
    { q: 'A breakpoint…', options: ['Crashes the program', 'Pauses it at a line so you can inspect variables', 'Deletes a line', 'Ends a loop'], answer: 1, explain: 'Used in debuggers.' },
    { q: 'An `assert` in a test…', options: ['Prints a value', 'Stops with an error if a condition you expect isn\'t true', 'Loops', 'Formats text'], answer: 1, explain: 'An automated check.' },
  ],
}
