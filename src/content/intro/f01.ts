import type { Module } from '../types'

export const f01: Module = {
  n: 1,
  title: 'What a Program Is',
  tour: 'Start here',
  summary: 'What programming actually is, how a computer follows instructions, what happens between writing code and seeing a result, and your first program in pseudocode and five real languages.',
  topics: ['Instructions for a very literal machine', 'Input, processing, output', 'From source code to running program', 'Your first program', 'How to use this course'],
  cpp23: ['Every code block has a "Show code in" picker. Pseudocode is the gentle default; switch to Python when you want to start writing real code. Your choice is remembered across the course.'],
  lessons: [
    {
      id: 'literal',
      title: 'Instructions for a very literal machine',
      blocks: [
        { kind: 'analogy', text: "Imagine writing directions for a friend who follows them *exactly*, never guesses, never fills a gap with common sense, and does it a billion times a second. \"Make a cup of tea\" means nothing to them. \"Fill the kettle to the line, switch it on, wait until it clicks…\" works. A program is that kind of recipe, and a computer is that kind of friend." },
        { kind: 'p', text: 'Programming is breaking a task into steps small and precise enough that a machine can carry them out. The hard part is rarely the typing. It\'s working out the steps: what information you have, what you want at the end, and what has to happen in between. The language is just how you write the steps down.' },
        { kind: 'list', items: [
          '**A program** is a list of instructions, written in a programming language.',
          '**Source code** is the text you write. It\'s for humans as much as for machines.',
          '**Running** (or executing) a program means the computer carries out the instructions, one after another.',
          '**A bug** is a mistake in the instructions. The computer does exactly what you wrote, not what you meant.',
        ] },
        { kind: 'check', q: 'A program does something you didn\'t intend. What\'s almost always the cause?', options: ['The computer made a random error', 'The instructions said something different from what you meant', 'The computer is too slow', 'The language is broken'], answer: 1, hint: 'The literal friend.', explain: 'Computers follow instructions exactly. Debugging (module 9) is finding where what you wrote differs from what you meant.' },
      ],
    },
    {
      id: 'ipo',
      title: 'Input, processing, output',
      blocks: [
        { kind: 'analogy', text: "Almost every program is a little factory. Raw materials come in (input: what you type, a file, a click, a price from the internet), machines work on them (processing: calculations and decisions), and finished goods go out (output: text on screen, a saved file, a sent message)." },
        { kind: 'list', items: [
          '**A calculator app**: input = numbers you tap; processing = arithmetic; output = the answer on screen.',
          '**A music app**: input = which song you pick; processing = finding and decoding the file; output = sound.',
          '**A trading bot**: input = live prices; processing = deciding whether to buy; output = an order sent to the exchange.',
        ] },
        { kind: 'p', text: 'When you start a new program, describe it in these three parts before writing a single line. If you can\'t say what goes in and what should come out, no programming language will rescue you.' },
        { kind: 'check', q: 'In a program that converts pounds to dollars, what is the processing step?', options: ['Typing the amount in pounds', 'Multiplying by the exchange rate', 'Showing the amount in dollars', 'Opening the app'], answer: 1, hint: 'What does the work?', explain: 'Typing is input; showing the result is output.' },
      ],
    },
    {
      id: 'running',
      title: 'From source code to running program',
      blocks: [
        { kind: 'analogy', text: "A computer's processor only understands its own very basic language of numbers. Your code has to be translated first, in one of two ways. A *compiler* is like translating a whole book before anyone reads it: slower to prepare, fast to read afterwards (C++, Go). An *interpreter* is like a live interpreter at a meeting, translating as each sentence is spoken: you can start immediately, but it's slower overall (Python). Many languages mix both (Java, TypeScript running in a browser)." },
        { kind: 'list', items: [
          '**Compiled**: C++, Go, Rust. You run a build step, then run the result. Errors in the code are often caught before the program ever runs.',
          '**Interpreted**: Python, Ruby. You run the source directly. Quick to try things; some errors only appear when that line is reached.',
          '**Compiled to bytecode and run on a virtual machine**: Java, C#. A bit of both.',
          '**TypeScript** is checked and converted to JavaScript, which browsers and Node.js then run.',
        ] },
        { kind: 'check', q: 'Which statement about compiled languages is true?', options: ['They can\'t have bugs', 'Code is translated before running, so some mistakes are caught early', 'They run line by line as you type', 'They only work on one computer'], answer: 1, hint: 'Translating the whole book first.', explain: 'Compilation catches many mistakes early, but not logic errors.' },
      ],
    },
    {
      id: 'hello',
      title: 'Your first program',
      blocks: [
        { kind: 'analogy', text: "By tradition, the first program in any language just says hello. It proves the whole chain works: you wrote something, the computer translated and ran it, and output appeared. Notice how much the languages differ in ceremony, and how little they differ in the idea." },
        { kind: 'poly',
          pseudo: `display "Hello, world!"`,
          python: `print("Hello, world!")`,
          ts: `console.log("Hello, world!");`,
          go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, world!")
}`,
          java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}`,
          cpp: `#include <iostream>

int main() {
    std::cout << "Hello, world!\\n";
}`,
          caption: 'Switch languages with the buttons above the code. Go, Java and C++ need a `main` function as the starting point; Python and TypeScript just start at the top.' },
        { kind: 'p', text: 'From here on, Go, Java and C++ examples usually show only the interesting lines, which you would put inside `main` (module 7 explains functions properly). Text in quotes is called a **string**: the computer treats it as text to show, not as instructions.' },
        { kind: 'check', q: 'Why is "Hello, world!" written inside quotation marks?', options: ['For decoration', 'So the computer treats it as text, not as instructions or names', 'Because it\'s English', 'To make it bold'], answer: 1, hint: 'Data vs instructions.', explain: 'Without quotes, the computer would look for something named Hello.' },
      ],
    },
    {
      id: 'how',
      title: 'How to use this course',
      blocks: [
        { kind: 'analogy', text: "Learning to program is like learning to cook: reading recipes helps, but you learn by cooking, burning things and trying again. Each module explains an idea with an everyday comparison first, then shows it in code, then asks you a question to check it stuck." },
        { kind: 'list', items: [
          '**Pseudocode first**: it\'s structured English with no punctuation rules to trip over. Read it to understand the idea.',
          '**Then Python**: when you\'re ready for real code, switch the picker to Python. It\'s the gentlest real language and runs as-is.',
          '**Try it yourself**: install Python from python.org, or use an online playground, and type the examples out rather than copying. Change them and see what breaks.',
          '**Other languages**: glance at TypeScript, Go, Java and C++ to see that the same ideas appear everywhere with different spelling. That\'s what makes your next language much easier.',
          '**Quizzes**: pass each module\'s quiz with 70% to mark it complete. Hints are there for a reason.',
        ] },
        { kind: 'check', q: 'What\'s the most effective way to learn from the code examples?', options: ['Read them once', 'Type them out, run them, then change them to see what happens', 'Memorise them', 'Copy and paste without reading'], answer: 1, hint: 'Learning to cook.', explain: 'Breaking examples on purpose teaches you what each part does.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is a program?', options: ['A computer', 'A precise list of instructions for a computer', 'An app store', 'A website'], answer: 1, explain: 'Written in a programming language.' },
    { q: 'What is "source code"?', options: ['The computer\'s hardware', 'The human-written text of a program', 'Output on screen', 'A password'], answer: 1, explain: 'It gets translated to run.' },
    { q: 'A program that reads prices, decides whether to buy, and sends an order: the decision is…', options: ['Input', 'Processing', 'Output', 'Compilation'], answer: 1, explain: 'Input → processing → output.' },
    { q: 'An interpreter…', options: ['Translates the whole program before it runs', 'Translates and runs the code as it goes', 'Is a type of hardware', 'Only works for C++'], answer: 1, explain: 'Python is interpreted.' },
    { q: 'Which of these is compiled before running?', options: ['Python', 'C++', 'Pseudocode', 'HTML'], answer: 1, explain: 'Go is too.' },
    { q: 'What does `print("Hi")` do in Python?', options: ['Prints on paper', 'Displays Hi as output', 'Saves a file', 'Nothing'], answer: 1, explain: 'Output to the screen.' },
    { q: 'Why do Go, Java and C++ programs have a `main` function?', options: ['Style', 'It marks where the program starts', 'It\'s optional decoration', 'It makes them faster'], answer: 1, explain: 'The entry point.' },
    { q: 'What is a bug?', options: ['A virus', 'A mistake in the instructions', 'A slow computer', 'A feature'], answer: 1, explain: 'The program does what you wrote, not what you meant.' },
  ],
}
