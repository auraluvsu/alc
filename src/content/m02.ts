import type { Module } from './types'

export const m02: Module = {
  n: 2,
  title: 'User-Defined Types',
  tour: '2 · User-Defined Types',
  summary: 'Build your own types with struct and class, give names to choices with enum class, and replace unsafe unions with std::variant.',
  topics: ['struct & aggregates', 'class & access control', 'Member functions', 'enum class', 'union vs std::variant'],
  cpp23: [
    '`std::to_underlying(e)` converts a scoped enum to its integer cleanly.',
    'Explicit object parameters ("deducing `this`"): `void f(this Self&& self)`.',
    '`std::visit` member form on `std::variant` is C++26, so the free `std::visit` is still the C++23 way.',
  ],
  lessons: [
    {
      id: 'struct',
      title: 'Structs',
      blocks: [
        { kind: 'analogy', text: 'A struct is a labelled tray with fixed compartments. The compartments sit side by side in memory, in the order you declare them. There\'s no hidden table of field names being looked up at runtime.' },
        { kind: 'compare', python: `from dataclasses import dataclass

@dataclass
class Trade:
    symbol: str
    qty: int = 0
    price: float = 0.0

t = Trade(symbol="XAUUSD", qty=2, price=2390.5)`, ts: `interface Trade {
  symbol: string
  qty: number
  price: number
}
const t: Trade = { symbol: "XAUUSD", qty: 2, price: 2390.5 }`, java: `record Trade(String symbol, int qty, double price) {}

var t = new Trade("XAUUSD", 2, 2390.5);`, go: `type Trade struct {
    Symbol string
    Qty    int
    Price  float64
}
t := Trade{Symbol: "XAUUSD", Qty: 2, Price: 2390.5}`, cpp: `struct Trade {
    std::string symbol;
    int qty = 0;          // default member initialiser
    double price = 0.0;
};
Trade t {.symbol = "XAUUSD", .qty = 2, .price = 2390.5};`, note: 'Designated initialisers (`.name =`) must follow declaration order.' },
        { kind: 'p', text: 'Functions can take structs by reference and read members with `.`, or with `->` through a pointer.' },
        { kind: 'code', code: `double notional(const Trade& t) { return t.qty * t.price; }

Trade* tp = &t;
tp->qty += 1;          // same as (*tp).qty += 1` },
        { kind: 'p', text: 'C++ types are **nominal**: a `Trade` and another struct with identical fields are different, incompatible types.' },
        { kind: 'check', q: 'Which initialisation compiles?', code: `struct P { int x; int y; };`, options: ['`P a {.y = 1, .x = 2};`', '`P a {.x = 2, .y = 1};`', '`P a {x: 2, y: 1};`', '`P a = {"x": 2};`'], answer: 1, hint: 'C++ cares about the order the fields were declared in.', explain: 'Designated initialisers must appear in declaration order. Option A is out of order, C is JS syntax, D is nonsense.' },
      ],
    },
    {
      id: 'class',
      title: 'Classes & invariants',
      blocks: [
        { kind: 'analogy', text: 'A struct is an open toolbox. A class is a vending machine. You can only use the buttons on the front (the public interface). The inner workings (private data) are behind glass, so nobody can put the machine into a broken state.' },
        { kind: 'p', text: 'The only technical difference between `struct` and `class` is the default access: `struct` is public by default, `class` is private. By convention, use `struct` for plain data and `class` when there is an **invariant** to protect.' },
        { kind: 'code', code: `class Vector {
public:
    explicit Vector(int s) : elem{new double[s]}, sz{s} {}  // constructor
    double& operator[](int i) { return elem[i]; }             // element access
    int size() const { return sz; }                            // const: doesn't modify
private:
    double* elem;   // invariant: elem points to sz doubles
    int sz;
};

Vector v(6);
v[0] = 1.5;
// v.sz = 99;   // error: sz is private` },
        { kind: 'list', items: [
          '**Constructor**: a function with the class\'s name that establishes the invariant. The `: elem{...}, sz{...}` part is the **member initialiser list**, which builds members before the body runs.',
          '`explicit` stops a single-argument constructor acting as a silent conversion (`Vector v = 6;` would otherwise compile).',
          'A trailing `const` on a member function promises it doesn\'t change the object. You can only call `const` functions on a `const Vector&`.',
        ] },
        { kind: 'p', text: 'Access control is per **class**, not per file or package: `private` members are hidden even from other code in the same file.' },
        { kind: 'pitfall', text: 'This `Vector` leaks memory: nothing calls `delete[]`. That is fixed with a destructor in module 5, and properly with the rule of five in module 6.' },
        { kind: 'new23', text: 'C++23 adds **explicit object parameters**: `int size(this const Vector& self) { return self.sz; }`. It is mostly useful for writing one function that handles `const`/non-`const`/rvalue cases at once (`this auto&& self`). You will see it again in module 6.' },
        { kind: 'check', q: 'You have `const Vector& v`. Which call compiles?', options: ['`v.size()` where `size() const`', '`v.push(1)` where `push(int)` is non-const', 'Both', 'Neither'], answer: 0, hint: 'A `const` reference only lets you press buttons that promise not to change anything.', explain: 'Only `const`-qualified member functions can be called through a `const` reference.' },
      ],
    },
    {
      id: 'enums',
      title: 'Enumerations',
      blocks: [
        { kind: 'analogy', text: 'An `enum class` is a sealed set of named options, like the positions on a light switch. A plain `enum` is the same switch, but its labels spill out into the surrounding room and secretly behave like integers.' },
        { kind: 'compare', python: `from enum import Enum

class Side(Enum):
    BUY = 0
    SELL = 1

s = Side.BUY
n = s.value  # must ask explicitly`, java: `enum Side { BUY, SELL }

Side s = Side.BUY;
int n = s.ordinal();  // must ask explicitly`, ts: `enum Side { Buy, Sell }
const s = Side.Buy
const n: number = s  // allowed`, go: `type Side int
const (
    Buy Side = iota
    Sell
)`, cpp: `enum class Side { Buy, Sell };
Side s = Side::Buy;
// int n = s;                     // error: no implicit conversion
auto n = std::to_underlying(s);  // C++23: 0` },
        { kind: 'code', code: `enum class Color : std::uint8_t { Red, Green, Blue };  // choose the underlying type

std::string_view name(Color c) {
    switch (c) {
        using enum Color;          // C++20: no need to write Color:: below
        case Red:   return "red";
        case Green: return "green";
        case Blue:  return "blue";
    }
    std::unreachable();           // C++23: tells the compiler this can't happen
}` },
        { kind: 'new23', text: '`std::to_underlying` replaces the clunky `static_cast<std::underlying_type_t<E>>(e)`. `std::unreachable()` marks impossible paths so the optimiser can drop them. Reaching it is UB, so only use it when it is truly impossible.' },
        { kind: 'p', text: 'Prefer `enum class` always. Plain `enum` exists for C compatibility: its names leak into the enclosing scope (`Red` clashes with anything else called `Red`) and it converts to `int` silently.' },
        { kind: 'check', q: 'What does `int x = Side::Sell;` do with `enum class Side { Buy, Sell };`?', options: ['x = 1', 'x = 0', 'Compile error', 'x = "Sell"'], answer: 2, hint: 'What does "class" add compared to a plain enum?', explain: 'Scoped enums don\'t convert implicitly to integers. Use `std::to_underlying(Side::Sell)` (C++23) to get 1.' },
      ],
    },
    {
      id: 'variants',
      title: 'Unions & std::variant',
      blocks: [
        { kind: 'analogy', text: 'A `union` is one parking space that can hold a car or a motorbike, but it doesn\'t remember which one is parked. A `std::variant` is the same space with a sign saying what\'s there. Ask for the wrong vehicle and you get a clear error, not a crash later.' },
        { kind: 'code', code: `union Raw { int i; double d; };   // members share storage
Raw r;
r.i = 5;
double oops = r.d;                // UB: reading the inactive member` },
        { kind: 'p', text: '`std::variant<A, B, C>` is a **type-safe tagged union**, a closed sum type. It is the tagged union (or sum type) found in many modern languages, with the tag built in.' },
        { kind: 'compare', python: `from dataclasses import dataclass
import math

@dataclass
class Circle:
    r: float

@dataclass
class Rect:
    w: float
    h: float

Shape = Circle | Rect

def area(s: Shape) -> float:
    match s:
        case Circle(r): return math.pi * r ** 2
        case Rect(w, h): return w * h`, go: `type Shape interface{ isShape() }
type Circle struct{ R float64 }
type Rect struct{ W, H float64 }
func (Circle) isShape() {}
func (Rect) isShape()   {}

func area(s Shape) float64 {
    switch v := s.(type) {
    case Circle:
        return math.Pi * v.R * v.R
    case Rect:
        return v.W * v.H
    }
    panic("unreachable")
}`, java: `sealed interface Shape permits Circle, Rect {}
record Circle(double r) implements Shape {}
record Rect(double w, double h) implements Shape {}

double area(Shape s) {
    return switch (s) {
        case Circle c -> Math.PI * c.r() * c.r();
        case Rect r   -> r.w() * r.h();
    };
}`, ts: `type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'rect'; w: number; h: number }

function area(s: Shape) {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r ** 2
    case 'rect': return s.w * s.h
  }
}`, cpp: `struct Circle { double r; };
struct Rect   { double w, h; };
using Shape = std::variant<Circle, Rect>;

double area(const Shape& s) {
    return std::visit([](const auto& v) -> double {
        using T = std::decay_t<decltype(v)>;
        if constexpr (std::is_same_v<T, Circle>)
            return std::numbers::pi * v.r * v.r;
        else
            return v.w * v.h;
    }, s);
}` },
        { kind: 'h', text: 'The overloaded pattern' },
        { kind: 'p', text: 'The idiomatic and more readable way to visit a variant is to bundle one lambda per alternative:' },
        { kind: 'code', code: `template<class... Fs> struct overloaded : Fs... { using Fs::operator()...; };

double area(const Shape& s) {
    return std::visit(overloaded{
        [](const Circle& c) { return std::numbers::pi * c.r * c.r; },
        [](const Rect& r)   { return r.w * r.h; },
    }, s);
}

Shape s = Rect{2, 3};
if (auto* r = std::get_if<Rect>(&s)) std::println("w={}", r->w);   // checked access
std::get<Circle>(s);   // throws std::bad_variant_access` },
        { kind: 'p', text: 'Don\'t worry about the `template<class... Fs>` line yet. That is a variadic template (module 8). Just treat `overloaded` as a recipe for now. If you forget an alternative, the code fails to **compile**, so the compiler checks every case is handled.' },
        { kind: 'check', q: '`Shape s = Circle{1};` then `std::get<Rect>(s);` What happens?', options: ['Returns a default Rect', 'Undefined behaviour', 'Throws `std::bad_variant_access`', 'Compile error'], answer: 2, hint: 'The variant knows what it holds and enforces it at runtime.', explain: '`std::get<T>` checks the active alternative and throws on mismatch. `std::get_if` returns `nullptr` instead.' },
      ],
    },
  ],
  quiz: [
    { q: 'The only language-level difference between `struct` and `class` is…', options: ['structs can\'t have member functions', 'default access: public for struct, private for class', 'classes live on the heap', 'structs can\'t have constructors'], answer: 1, explain: 'Everything else is identical. The choice is a convention that signals intent.' },
    { q: 'What does `explicit` on a constructor prevent?', options: ['Inheritance', 'Implicit conversions such as `Vector v = 6;`', 'Copying', 'Calling it from outside the class'], answer: 1, explain: 'Without `explicit`, a one-argument constructor doubles as an implicit conversion from that argument type.' },
    { q: 'Why prefer `enum class` over plain `enum`?', options: ['It is faster', 'Scoped names and no implicit int conversion', 'It supports strings as values', 'It can be extended later'], answer: 1, explain: 'Scoped enumerators don\'t leak into the surrounding scope or silently become integers.' },
    { q: 'Reading a union member other than the last one written is…', options: ['Fine; you get a converted value', 'Undefined behaviour', 'A compile error', 'Throws an exception'], answer: 1, explain: 'Unions don\'t track the active member. That is why `std::variant` exists.' },
    { q: 'Which C++23 function gets the integer behind a scoped enum?', options: ['`std::to_int`', '`std::underlying_cast`', '`std::to_underlying`', '`static_cast<int>` only'], answer: 2, explain: '`std::to_underlying(e)` (in `<utility>`) returns `e`\'s value as its underlying integer type. `static_cast` still works but is noisier.' },
    { q: 'A member function `int size() const` means…', options: ['It returns a const int', 'It cannot modify the object\'s members', 'It is computed at compile time', 'It is static'], answer: 1, explain: 'The trailing `const` qualifies `this`, which makes it callable on const objects.' },
    { q: 'Which idea is `std::variant<A, B>` closest to?', options: ['An interface', 'A tagged union: a value that is exactly one of `A` or `B`', 'A dynamically typed value', 'A generic container'], answer: 1, explain: 'A closed set of alternatives that holds exactly one at a time, with checked access.' },
    { q: 'What does the member initialiser list `: sz{s}` do?', options: ['Assigns `sz` after the constructor body runs', 'Constructs `sz` before the constructor body runs', 'Declares a new local variable', 'Calls the base class'], answer: 1, explain: 'Members are initialised in the list, in declaration order, before the body. Prefer it to assignment in the body.' },
  ],
}
