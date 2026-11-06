import type { Module } from '../types'

export const f12: Module = {
  n: 12,
  title: 'Tools of the Trade',
  tour: 'Next steps',
  summary: 'The working environment every programmer uses: the terminal, a code editor, version control with git, package managers, reading documentation, asking good questions, and choosing which course on this site to take next.',
  topics: ['The terminal', 'Editors & running code', 'Version control with git', 'Packages & docs', 'Where to go next'],
  cpp23: ['Nothing here is language-specific; these tools are the same whichever language you pick.'],
  lessons: [
    {
      id: 'terminal',
      title: 'The terminal',
      blocks: [
        { kind: 'analogy', text: "The terminal is talking to your computer in short typed sentences instead of clicking. It looks intimidating, but day to day you need about ten commands: where am I, what's here, go there, make a folder, run this program. It's also how almost every programming tool is run, which is why it's worth getting comfortable with early." },
        { kind: 'code', code: `pwd                    # print working directory: where am I?
ls                     # list files here (Windows PowerShell also accepts ls; cmd uses dir)
cd projects            # change directory: go into "projects"
cd ..                  # go up one level
mkdir shop             # make a new folder
cd shop

python3 main.py        # run a Python program
node main.js           # run JavaScript
go run main.go         # run Go
javac Main.java && java Main          # compile and run Java
g++ -std=c++23 main.cpp -o main && ./main   # compile and run C++`, caption: 'Press Tab to auto-complete names and the up arrow to repeat earlier commands.' },
        { kind: 'pitfall', text: '"command not found" usually means the tool isn\'t installed or isn\'t on your PATH (the list of places the terminal looks for programs). It\'s rarely your code\'s fault. Search the exact message plus your operating system.' },
        { kind: 'check', q: 'What does `cd ..` do?', options: ['Deletes a folder', 'Moves up one folder', 'Lists files', 'Runs a program'], answer: 1, hint: 'Two dots mean "parent".', explain: 'One dot means "here".' },
      ],
    },
    {
      id: 'editor',
      title: 'Editors & running code',
      blocks: [
        { kind: 'analogy', text: "You can write code in Notepad, the same way you can cut a lawn with scissors. A code editor colours the syntax, underlines mistakes as you type, auto-completes names, and runs and debugs your program in one place. **VS Code** is free and works for every language in this course; JetBrains IDEs (PyCharm, IntelliJ, GoLand, CLion) are heavier but very capable." },
        { kind: 'list', items: [
          '**Install the language extension** for whatever you\'re writing (Python, Go, C/C++, Java). That turns on error underlining and auto-complete.',
          '**Use the built-in terminal** (View → Terminal) so editor and commands sit side by side.',
          '**Learn three shortcuts**: go to definition, rename symbol, and format document. They save hours.',
          '**Try the debugger** from module 9: click in the margin to set a breakpoint, press F5, step through.',
          '**AI assistants** are useful for explaining errors and boilerplate, but if you don\'t understand the code they give you, you can\'t fix it when it breaks. Use them as a tutor, not a crutch, while learning.',
        ] },
        { kind: 'check', q: 'What\'s the main advantage of a code editor over a plain text editor?', options: ['Prettier fonts', 'It understands the language: highlighting, error checking, auto-complete, debugging', 'It writes code for you', 'It\'s required to run programs'], answer: 1, hint: 'Scissors vs a lawnmower.', explain: 'Programs still run from the terminal either way.' },
      ],
    },
    {
      id: 'git',
      title: 'Version control with git',
      blocks: [
        { kind: 'analogy', text: "Git is unlimited, labelled save points for your whole project. Each **commit** is a snapshot with a note: \"add checkout function\". Break something? Go back. Want to try an idea? Make a **branch** (a parallel timeline) and merge it back only if it works. **GitHub** stores your repository online so it's backed up, shareable, and acts as a portfolio." },
        { kind: 'code', code: `git init                       # start tracking this folder
git status                     # what's changed?
git add main.py                # stage a file for the next snapshot (git add . = everything)
git commit -m "Add checkout"   # take the snapshot with a message
git log --oneline              # history of snapshots

git switch -c try-discounts    # new branch for an experiment
# ...edit, add, commit...
git switch main                # back to the main timeline
git merge try-discounts        # bring the experiment in

git push                       # upload commits to GitHub
git pull                       # download others' commits`, caption: 'The daily loop is just: edit → git add → git commit → git push.' },
        { kind: 'list', items: [
          '**Commit small and often**, with messages that say what and why.',
          '**Never commit secrets**: passwords, API keys. List files to ignore in `.gitignore`.',
          '**Your GitHub profile is your CV** as a self-taught developer: small, finished, well-explained projects beat many abandoned ones.',
        ] },
        { kind: 'check', q: 'What is a git commit?', options: ['Uploading to the internet', 'A saved snapshot of the project with a message', 'Deleting a file', 'A branch'], answer: 1, hint: 'A labelled save point.', explain: 'Push is what uploads.' },
      ],
    },
    {
      id: 'packages',
      title: 'Packages, docs & asking for help',
      blocks: [
        { kind: 'analogy', text: "A package manager is an app store for code: one command downloads a library and records it in a file, so anyone else can install exactly the same versions. Documentation is the instruction manual. And when you're stuck, a well-asked question is half-solved before anyone answers." },
        { kind: 'code', code: `pip install requests           # Python    → records in requirements.txt / pyproject.toml
npm install zod                # TypeScript → package.json
go get github.com/google/uuid  # Go        → go.mod
# Java: add the library to pom.xml (Maven) or build.gradle
# C++:  vcpkg install fmt / Conan / CMake FetchContent`, caption: 'Python projects usually use a virtual environment (`python3 -m venv .venv`) so each project has its own packages.' },
        { kind: 'list', items: [
          '**Read the official docs first**: docs.python.org, developer.mozilla.org (JavaScript/TypeScript), go.dev/doc, docs.oracle.com/javase, cppreference.com. This site\'s Dictionary links to them too.',
          '**Asking a good question**: say what you\'re trying to do, show the smallest code that reproduces the problem, paste the full error message, and say what you\'ve already tried.',
          '**Search the exact error text** in quotes. Stack Overflow and GitHub issues have usually seen it.',
          '**Build things.** Tutorials teach syntax; projects teach programming. Pick something small you actually want: a budget tracker, a price alert, a quiz.',
        ] },
        { kind: 'check', q: 'Which of these makes a question easiest to answer?', options: ['"My code doesn\'t work, help"', 'A short example that reproduces the problem, plus the full error and what you tried', 'A screenshot of the whole screen', 'Your entire project zipped'], answer: 1, hint: 'Make it easy for a stranger to reproduce.', explain: 'Often, writing that example reveals the bug yourself.' },
      ],
    },
    {
      id: 'next',
      title: 'Where to go next',
      blocks: [
        { kind: 'analogy', text: "You now know what every language has in common: values, decisions, loops, collections, functions, errors, objects. Learning a specific language from here is mostly learning new spellings for ideas you already have, plus each language's particular strengths. The order of the courses on this site is a suggestion, not a rule." },
        { kind: 'list', items: [
          '**Systems Programming**: how computers actually run your code: memory, the CPU, processes, why some code is fast. Language-agnostic concepts, C++ examples. Makes everything after it clearer.',
          '**Python**: the friendliest first "real" language. Scripting, automation, and the doorway to data and machine learning.',
          '**Go**: simple, fast, great for servers, command-line tools and working with files. A small language you can learn completely.',
          '**C++**: maximum control and performance: games, trading systems, engines. Steepest climb, biggest view.',
          '**ML & Data**: data analysis, machine learning and deep learning, built on Python. Take Python first.',
        ] },
        { kind: 'p', text: 'Not sure? Pick Python. Switch the code view in this course to Python, reread a few modules, and you\'ll find you can already read most of it. That\'s the point of learning the ideas first.' },
        { kind: 'check', q: 'What transfers when you move to a new programming language?', options: ['Nothing: start over each time', 'The core ideas: variables, decisions, loops, functions, data structures', 'Only the syntax', 'Only the editor'], answer: 1, hint: 'Look at the six code tabs on every example in this course.', explain: 'New spelling, same thinking.' },
      ],
    },
  ],
  quiz: [
    { q: '`pwd` shows…', options: ['Your password', 'The folder you are currently in', 'All programs', 'Git history'], answer: 1, explain: 'Print working directory.' },
    { q: '"command not found" most often means…', options: ['Your code has a bug', 'The tool isn\'t installed or isn\'t on your PATH', 'The file is empty', 'Git failed'], answer: 1, explain: 'Install it or fix PATH.' },
    { q: 'A breakpoint is set in…', options: ['The terminal', 'The editor\'s debugger', 'GitHub', 'A package manager'], answer: 1, explain: 'Click in the margin.' },
    { q: 'Which git command records a snapshot?', options: ['git push', 'git commit', 'git status', 'git init'], answer: 1, explain: 'push uploads commits.' },
    { q: 'A git branch is…', options: ['A backup drive', 'A parallel line of work you can merge back later', 'A file', 'An error'], answer: 1, explain: 'Safe experimentation.' },
    { q: 'What should never be committed?', options: ['Code', 'Passwords and API keys', 'README files', 'Tests'], answer: 1, explain: 'Use .gitignore and environment variables.' },
    { q: '`npm install` and `pip install`…', options: ['Compile code', 'Download libraries and record them for the project', 'Delete packages', 'Run tests'], answer: 1, explain: 'Package managers.' },
    { q: 'What matters most once you know the basics?', options: ['Memorising syntax', 'Building small real projects', 'Reading every tutorial', 'Buying a faster laptop'], answer: 1, explain: 'Projects teach programming.' },
  ],
}
