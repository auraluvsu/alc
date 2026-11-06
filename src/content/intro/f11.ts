import type { Module } from '../types'

export const f11: Module = {
  n: 11,
  title: 'Organising Programs',
  tour: 'Structure',
  summary: 'Keeping bigger programs manageable: grouping related data into records, a first look at objects and classes (data plus the functions that act on it), splitting code across files as modules, and using other people\'s code through imports.',
  topics: ['Grouping data into records', 'Objects & classes', 'Methods & encapsulation', 'Modules & files', 'Using libraries'],
  cpp23: ['Python, TypeScript, Java and C++ have classes; Go uses structs with methods attached, same idea, lighter syntax.'],
  lessons: [
    {
      id: 'records',
      title: 'Grouping data into records',
      blocks: [
        { kind: 'analogy', text: "Keeping a trade's symbol in one list, its quantity in another and its price in a third is like storing a person's name, address and phone number in three separate notebooks: one slip and they no longer line up. A **record** (struct, dataclass, object) keeps everything about one thing together, with named fields: `trade.symbol`, `trade.quantity`, `trade.price`." },
        { kind: 'poly',
          pseudo: `record Trade
    symbol
    quantity
    price
end record

set t to new Trade("XAU", 2, 2385.5)
display t.symbol                    # XAU
display t.quantity × t.price        # 4771`,
          python: `from dataclasses import dataclass

@dataclass
class Trade:
    symbol: str
    quantity: int
    price: float

t = Trade("XAU", 2, 2385.5)
print(t.symbol)                 # XAU
print(t.quantity * t.price)     # 4771.0
print(t)                        # Trade(symbol='XAU', quantity=2, price=2385.5)`,
          ts: `type Trade = {
    symbol: string;
    quantity: number;
    price: number;
};

const t: Trade = { symbol: "XAU", quantity: 2, price: 2385.5 };
console.log(t.symbol);                 // XAU
console.log(t.quantity * t.price);     // 4771`,
          go: `package main

import "fmt"

type Trade struct {
    Symbol   string
    Quantity int
    Price    float64
}

func main() {
    t := Trade{Symbol: "XAU", Quantity: 2, Price: 2385.5}
    fmt.Println(t.Symbol)                         // XAU
    fmt.Println(float64(t.Quantity) * t.Price)    // 4771
    fmt.Printf("%+v\\n", t)                        // {Symbol:XAU Quantity:2 Price:2385.5}
}`,
          java: `public class Main {
    record Trade(String symbol, int quantity, double price) {}

    public static void main(String[] args) {
        Trade t = new Trade("XAU", 2, 2385.5);
        System.out.println(t.symbol());                  // XAU
        System.out.println(t.quantity() * t.price());    // 4771.0
        System.out.println(t);                           // Trade[symbol=XAU, quantity=2, price=2385.5]
    }
}`,
          cpp: `#include <iostream>
#include <string>

struct Trade {
    std::string symbol;
    int quantity;
    double price;
};

int main() {
    Trade t{"XAU", 2, 2385.5};
    std::cout << t.symbol << '\\n';                  // XAU
    std::cout << t.quantity * t.price << '\\n';      // 4771
}` },
        { kind: 'check', q: 'Why group symbol, quantity and price into one Trade record?', options: ['It runs faster', 'Related data stays together and fields have clear names', 'Required by all languages', 'To use less memory'], answer: 1, hint: 'Three notebooks vs one.', explain: 'A list of Trades can\'t get out of step.' },
      ],
    },
    {
      id: 'objects',
      title: 'Objects & classes',
      blocks: [
        { kind: 'analogy', text: "A **class** is a blueprint; an **object** is a house built from it. The blueprint for `Account` says every account has an owner and a balance, and can deposit and withdraw. From that one blueprint you can build thousands of separate accounts, each with its own balance. This style is called object-oriented programming (OOP)." },
        { kind: 'poly',
          pseudo: `class Account
    owner
    balance

    when created with owner
        set this.owner to owner
        set this.balance to 0
    end

    method deposit(amount)
        add amount to this.balance
    end method
end class

set mine to new Account("Nas")
set yours to new Account("Ada")
mine.deposit(100)
display mine.balance       # 100
display yours.balance      # 0: separate object`,
          python: `class Account:
    def __init__(self, owner):       # runs when an object is created
        self.owner = owner           # self = "this particular account"
        self.balance = 0

    def deposit(self, amount):
        self.balance += amount

mine = Account("Nas")
yours = Account("Ada")
mine.deposit(100)
print(mine.balance)     # 100
print(yours.balance)    # 0`,
          ts: `class Account {
    balance = 0;
    constructor(public owner: string) {}

    deposit(amount: number): void {
        this.balance += amount;
    }
}

const mine = new Account("Nas");
const yours = new Account("Ada");
mine.deposit(100);
console.log(mine.balance);    // 100
console.log(yours.balance);   // 0`,
          go: `package main

import "fmt"

type Account struct {
    Owner   string
    Balance float64
}

// A method: a function attached to a type. *Account lets it change the original.
func (a *Account) Deposit(amount float64) {
    a.Balance += amount
}

func main() {
    mine := &Account{Owner: "Nas"}
    yours := &Account{Owner: "Ada"}
    mine.Deposit(100)
    fmt.Println(mine.Balance)    // 100
    fmt.Println(yours.Balance)   // 0
}`,
          java: `public class Main {
    static class Account {
        String owner;
        double balance = 0;

        Account(String owner) {          // constructor
            this.owner = owner;
        }

        void deposit(double amount) {
            this.balance += amount;
        }
    }

    public static void main(String[] args) {
        Account mine = new Account("Nas");
        Account yours = new Account("Ada");
        mine.deposit(100);
        System.out.println(mine.balance);    // 100.0
        System.out.println(yours.balance);   // 0.0
    }
}`,
          cpp: `#include <iostream>
#include <string>

class Account {
public:
    std::string owner;
    double balance = 0;

    explicit Account(std::string o) : owner(std::move(o)) {}   // constructor

    void deposit(double amount) { balance += amount; }
};

int main() {
    Account mine("Nas");
    Account yours("Ada");
    mine.deposit(100);
    std::cout << mine.balance << '\\n';    // 100
    std::cout << yours.balance << '\\n';   // 0
}`,
          caption: '`self` (Python) and `this` (the others) mean "the particular object this method was called on".' },
        { kind: 'check', q: 'What\'s the relationship between a class and an object?', options: ['They\'re the same', 'A class is the blueprint; objects are things built from it', 'An object is a type of loop', 'A class is a variable'], answer: 1, hint: 'Blueprint and house.', explain: 'Many objects, one class.' },
      ],
    },
    {
      id: 'encapsulation',
      title: 'Methods & encapsulation',
      blocks: [
        { kind: 'analogy', text: "At a bank you can't walk into the vault and change your balance; you go to the counter, and the counter enforces the rules (\"insufficient funds\"). **Encapsulation** means an object guards its own data: the outside world uses its methods, and the methods make sure the data always stays valid." },
        { kind: 'poly',
          pseudo: `class Account
    private balance            # only this class's own methods can touch it

    method withdraw(amount)
        if amount > balance then
            display "Insufficient funds"
            return false
        end if
        subtract amount from balance
        return true
    end method

    method get_balance()
        return balance
    end method
end class`,
          python: `class Account:
    def __init__(self, owner):
        self.owner = owner
        self._balance = 0          # leading _ means "private, please don't touch"

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("deposit must be positive")
        self._balance += amount

    def withdraw(self, amount):
        if amount > self._balance:
            print("Insufficient funds")
            return False
        self._balance -= amount
        return True

    @property
    def balance(self):             # read-only from outside
        return self._balance

acct = Account("Nas")
acct.deposit(50)
print(acct.withdraw(80), acct.balance)   # Insufficient funds / False 50
print(acct.withdraw(20), acct.balance)   # True 30`,
          ts: `class Account {
    #balance = 0;                    // # makes it truly private
    constructor(public owner: string) {}

    deposit(amount: number): void {
        if (amount <= 0) throw new Error("deposit must be positive");
        this.#balance += amount;
    }

    withdraw(amount: number): boolean {
        if (amount > this.#balance) {
            console.log("Insufficient funds");
            return false;
        }
        this.#balance -= amount;
        return true;
    }

    get balance(): number { return this.#balance; }
}

const acct = new Account("Nas");
acct.deposit(50);
console.log(acct.withdraw(80), acct.balance);   // Insufficient funds / false 50
console.log(acct.withdraw(20), acct.balance);   // true 30`,
          go: `package main

import "fmt"

type Account struct {
    Owner   string
    balance float64   // lowercase = private to this package
}

func (a *Account) Deposit(amount float64) { a.balance += amount }

func (a *Account) Withdraw(amount float64) bool {
    if amount > a.balance {
        fmt.Println("Insufficient funds")
        return false
    }
    a.balance -= amount
    return true
}

func (a *Account) Balance() float64 { return a.balance }

func main() {
    acct := &Account{Owner: "Nas"}
    acct.Deposit(50)
    fmt.Println(acct.Withdraw(80), acct.Balance())   // Insufficient funds / false 50
    fmt.Println(acct.Withdraw(20), acct.Balance())   // true 30
}`,
          java: `public class Main {
    static class Account {
        private double balance = 0;      // only Account's methods can touch it
        final String owner;

        Account(String owner) { this.owner = owner; }

        void deposit(double amount) {
            if (amount <= 0) throw new IllegalArgumentException("deposit must be positive");
            balance += amount;
        }

        boolean withdraw(double amount) {
            if (amount > balance) {
                System.out.println("Insufficient funds");
                return false;
            }
            balance -= amount;
            return true;
        }

        double getBalance() { return balance; }
    }

    public static void main(String[] args) {
        Account acct = new Account("Nas");
        acct.deposit(50);
        System.out.println(acct.withdraw(80) + " " + acct.getBalance());   // Insufficient funds / false 50.0
        System.out.println(acct.withdraw(20) + " " + acct.getBalance());   // true 30.0
    }
}`,
          cpp: `#include <iostream>
#include <stdexcept>
#include <string>

class Account {
    double balance_ = 0;              // private by default in a class
public:
    std::string owner;
    explicit Account(std::string o) : owner(std::move(o)) {}

    void deposit(double amount) {
        if (amount <= 0) throw std::invalid_argument("deposit must be positive");
        balance_ += amount;
    }

    bool withdraw(double amount) {
        if (amount > balance_) {
            std::cout << "Insufficient funds\\n";
            return false;
        }
        balance_ -= amount;
        return true;
    }

    double balance() const { return balance_; }
};

int main() {
    Account acct("Nas");
    acct.deposit(50);
    bool ok = acct.withdraw(80);
    std::cout << ok << ' ' << acct.balance() << '\\n';   // Insufficient funds / 0 50
    ok = acct.withdraw(20);
    std::cout << ok << ' ' << acct.balance() << '\\n';   // 1 30
}`,
          caption: 'Python relies on a naming convention (`_balance`); the others have the language enforce privacy.' },
        { kind: 'check', q: 'Why make `balance` private?', options: ['To hide it from the programmer', 'So it can only change through methods that enforce the rules', 'It runs faster', 'Required for printing'], answer: 1, hint: 'The bank counter, not the vault.', explain: 'Nobody can set a balance to -1,000,000 by accident.' },
      ],
    },
    {
      id: 'modules',
      title: 'Modules & files',
      blocks: [
        { kind: 'analogy', text: "A 5,000-line file is a book with no chapters. Real programs are split into files (modules, packages) by topic: one for trade records, one for pricing, one for reading files. Each file exposes the parts others should use and hides the rest, and the main program **imports** what it needs." },
        { kind: 'code', code: `# pricing.py
VAT = 0.2

def with_vat(price):
    return price * (1 + VAT)

# main.py
from pricing import with_vat       # or: import pricing → pricing.with_vat(...)

print(with_vat(100))               # 120.0`, lang: 'python', caption: 'Python: every .py file is a module.' },
        { kind: 'code', code: `// pricing.ts
export const VAT = 0.2;
export function withVat(price: number): number {
    return price * (1 + VAT);
}

// main.ts
import { withVat } from "./pricing";
console.log(withVat(100));         // 120`, lang: 'ts', caption: 'TypeScript: only `export`ed names can be imported.' },
        { kind: 'code', code: `// pricing/pricing.go
package pricing

const VAT = 0.2                     // Capitalised = exported

func WithVat(price float64) float64 { return price * (1 + VAT) }

// main.go
package main

import (
    "fmt"
    "example.com/shop/pricing"
)

func main() { fmt.Println(pricing.WithVat(100)) }   // 120`, lang: 'go', caption: 'Go: a folder is a package; Capitalised names are public.' },
        { kind: 'p', text: 'Java puts each public class in its own file inside packages (folders), and C++ splits each module into a header (`pricing.h`, what exists) and a source file (`pricing.cpp`, how it works), with C++20 also offering `import` modules. The idea is identical everywhere: group by topic, expose a small surface, import what you use.' },
        { kind: 'check', q: 'What does `import` do?', options: ['Downloads the internet', 'Makes code from another file or library available in this one', 'Runs a test', 'Copies a file'], answer: 1, hint: 'Borrowing a chapter.', explain: 'You can then call its functions.' },
      ],
    },
    {
      id: 'libraries',
      title: 'Using libraries',
      blocks: [
        { kind: 'analogy', text: "You don't build your own oven to bake a cake. Libraries are code other people wrote, tested and shared: the standard library that ships with the language (maths, dates, files, networking) and thousands of third-party packages. A large part of being productive is knowing what already exists and reading its documentation." },
        { kind: 'poly',
          pseudo: `use the language's date library
set today to the current date
display today formatted as "Day Month Year"

use the language's maths library
display square root of 2`,
          python: `import math
from datetime import date

print(math.sqrt(2))                    # 1.4142135623730951
print(date(2026, 11, 6).strftime("%A %d %B %Y"))   # Friday 06 November 2026`,
          ts: `console.log(Math.sqrt(2));             // 1.4142135623730951
const d = new Date(2026, 10, 6);       // months count from 0 in JavaScript!
console.log(d.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }));
// Friday, 06 November 2026`,
          go: `fmt.Println(math.Sqrt(2))                                       // 1.4142135623730951
d := time.Date(2026, time.November, 6, 0, 0, 0, 0, time.UTC)
fmt.Println(d.Format("Monday 02 January 2006"))                 // Friday 06 November 2026`,
          java: `System.out.println(Math.sqrt(2));      // 1.4142135623730951
java.time.LocalDate d = java.time.LocalDate.of(2026, 11, 6);
System.out.println(d.format(java.time.format.DateTimeFormatter.ofPattern("EEEE dd MMMM yyyy")));
// Friday 06 November 2026`,
          cpp: `std::cout << std::setprecision(17) << std::sqrt(2.0) << '\\n';   // 1.4142135623730951
std::chrono::year_month_day d{std::chrono::year{2026}, std::chrono::November, std::chrono::day{6}};
std::cout << std::chrono::weekday{std::chrono::sys_days{d}}.c_encoding() << '\\n';  // 5 (Friday; 0 = Sunday)`,
          caption: 'Go formats dates with an example date (Monday 2 January 2006) instead of codes like %A. Every language has its quirks.' },
        { kind: 'list', items: [
          '**Standard library first**: it\'s always available and well tested.',
          '**Package managers** install third-party code: `pip` (Python), `npm` (TypeScript), `go get` (Go), Maven/Gradle (Java), vcpkg/Conan (C++). Module 12 covers them.',
          '**Check before adding a dependency**: is it maintained, widely used, and worth the extra code you\'re now responsible for?',
        ] },
        { kind: 'check', q: 'What\'s the standard library?', options: ['A building', 'Code that ships with the language itself', 'A list of rules', 'A third-party package'], answer: 1, hint: 'Comes in the box.', explain: 'No installation required.' },
      ],
    },
  ],
  quiz: [
    { q: 'A record/struct groups…', options: ['Several loops', 'Related named fields about one thing', 'Files', 'Errors'], answer: 1, explain: 'trade.symbol, trade.price.' },
    { q: 'A class is to an object as…', options: ['A house is to a blueprint', 'A blueprint is to a house', 'A loop is to a list', 'A file is to a folder'], answer: 1, explain: 'Many objects from one class.' },
    { q: 'A method is…', options: ['A loop', 'A function that belongs to an object', 'A variable', 'A file'], answer: 1, explain: 'Called like acct.deposit(50).' },
    { q: '`self` / `this` refers to…', options: ['The class', 'The specific object the method was called on', 'The program', 'The last variable'], answer: 1, explain: 'This particular account.' },
    { q: 'Encapsulation means…', options: ['Putting code in capsules', 'An object protects its data and exposes methods that keep it valid', 'Using many files', 'Compiling'], answer: 1, explain: 'The bank counter.' },
    { q: 'In Go, a Capitalised name is…', options: ['A constant', 'Exported (usable from other packages)', 'An error', 'Private'], answer: 1, explain: 'lowercase is package-private.' },
    { q: 'Why split a program into modules?', options: ['It runs faster', 'Organisation: group by topic and hide internals', 'Required by law', 'To avoid functions'], answer: 1, explain: 'Chapters in a book.' },
    { q: 'Before adding a third-party library you should check…', options: ['Nothing', 'Whether it\'s maintained and worth depending on', 'Its file size only', 'Its logo'], answer: 1, explain: 'Every dependency is a commitment.' },
  ],
}
