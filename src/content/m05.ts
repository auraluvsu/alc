import type { Module } from './types'

export const m05: Module = {
  n: 5,
  title: 'Classes & Hierarchies',
  tour: '5 · Classes',
  summary: 'Concrete types that behave like built-ins, abstract types that act as interfaces, and virtual functions for run-time polymorphism.',
  topics: ['Concrete types', 'Destructors & RAII', 'Abstract types', 'Virtual functions & vtables', 'Class hierarchies', 'dynamic_cast & ownership'],
  cpp23: [
    'Explicit object parameter (`this Self&& self`) enables CRTP-like patterns without templates on the class.',
    '`std::unique_ptr` is now `constexpr` (usable in compile-time code).',
  ],
  lessons: [
    {
      id: 'concrete',
      title: 'Concrete types & RAII',
      blocks: [
        { kind: 'analogy', text: 'A concrete type is a well-made appliance: you use it exactly like a built-in (put it on the stack, copy it, pass it around), and its representation is part of its definition, so the compiler knows its size. RAII means the appliance unplugs itself when you leave the room.' },
        { kind: 'code', code: `class complex {
    double re, im;   // representation: two doubles, no heap
public:
    constexpr complex(double r = 0, double i = 0) : re{r}, im{i} {}
    constexpr double real() const { return re; }
    constexpr double imag() const { return im; }
    complex& operator+=(complex z) { re += z.re; im += z.im; return *this; }
};
complex operator+(complex a, complex b) { return a += b; }` },
        { kind: 'h', text: 'Destructors' },
        { kind: 'p', text: 'A **destructor** (`~ClassName()`) runs automatically when an object\'s lifetime ends: going out of scope, being deleted, or being destroyed as part of a containing object. This is **RAII** (Resource Acquisition Is Initialisation): acquire in the constructor, release in the destructor.' },
        { kind: 'code', code: `class Vector {
public:
    explicit Vector(int s) : elem{new double[s]}, sz{s} {
        for (int i = 0; i != s; ++i) elem[i] = 0;
    }
    Vector(std::initializer_list<double> lst)          // Vector v {1, 2, 3};
        : elem{new double[lst.size()]}, sz{static_cast<int>(lst.size())} {
        std::copy(lst.begin(), lst.end(), elem);
    }
    ~Vector() { delete[] elem; }                       // destructor: release
    double& operator[](int i) { return elem[i]; }
    int size() const { return sz; }
private:
    double* elem;
    int sz;
};

void fct(int n) {
    Vector v(n);
    // ... use v ...
}   // v.~Vector() runs here, always, even if an exception is thrown` },
        { kind: 'p', text: 'The cleanup is attached to the **type**, not written at each call site, so it can\'t be forgotten. Files (`std::ofstream`), locks (`std::lock_guard`) and memory (`std::vector`, `std::unique_ptr`) all work this way. It is also deterministic: the destructor runs at the closing brace, not whenever a garbage collector gets round to it.' },
        { kind: 'pitfall', text: 'This `Vector` is still broken if copied: two copies would share `elem` and both `delete[]` it (a double free). Module 6 fixes that with the rule of five. In real code, use `std::vector` and get it all for free (the "rule of zero").' },
        { kind: 'check', q: 'When does `v`\'s destructor run?', code: `void f() {
    Vector v(10);
    if (bad()) throw std::runtime_error{"x"};
    g(v);
}`, options: ['Only if `f` returns normally', 'At the end of `f`, whether it returns or throws', 'When the garbage collector runs', 'Never, unless you call `delete`'], answer: 1, hint: 'Destructors are tied to scope, not to how you leave the scope.', explain: 'Automatic objects are destroyed when their scope ends, including during stack unwinding.' },
      ],
    },
    {
      id: 'abstract',
      title: 'Abstract types',
      blocks: [
        { kind: 'analogy', text: 'An abstract type is a job description: "must be able to do `[]` and `size()`". It doesn\'t say how. You can\'t hire the job description itself, only a person (a derived class) who fulfils it.' },
        { kind: 'compare', python: `from abc import ABC, abstractmethod

class Container(ABC):
    @abstractmethod
    def __getitem__(self, i: int) -> float: ...

    @abstractmethod
    def size(self) -> int: ...

# subclasses must implement both`, java: `interface Container {
    double get(int i);
    int size();
}

class VectorContainer implements Container {
    // must implement get() and size()
}`, go: `type Container interface {
    At(i int) float64
    Size() int
}
// any type with these methods
// satisfies it implicitly`, ts: `interface Container {
  at(i: number): number
  size(): number
}
// structural: anything shaped right fits`, cpp: `class Container {
public:
    virtual double& operator[](int) = 0;  // pure virtual
    virtual int size() const = 0;
    virtual ~Container() = default;       // virtual destructor!
};

class VectorContainer : public Container {
    Vector v;
public:
    VectorContainer(int s) : v(s) {}
    double& operator[](int i) override { return v[i]; }
    int size() const override { return v.size(); }
};`, note: 'C++ interfaces are **nominal**: a class must explicitly derive from `Container`. Concepts (module 8) give you structural "shaped right is enough" checks, at compile time.' },
        { kind: 'list', items: [
          '`= 0` makes a function **pure virtual**: no implementation here, and derived classes must provide one.',
          'A class with any pure virtual function is **abstract** and can\'t be instantiated.',
          '`override` asks the compiler to check you really are overriding something. Always write it: a typo in the signature otherwise silently creates a new function.',
          '`: public Container` is public inheritance ("is-a").',
        ] },
        { kind: 'code', code: `void use(Container& c) {               // works with ANY Container
    for (int i = 0; i != c.size(); ++i)
        std::println("{}", c[i]);
}

VectorContainer vc(10);
use(vc);
// Container c;   // error: abstract` },
        { kind: 'check', q: 'You write `int size() override { ... }` in a derived class but the base declares `int size() const`. What happens?', options: ['It overrides anyway', 'Compile error, thanks to `override`', 'Runtime error', 'The base version is hidden silently'], answer: 1, hint: 'The `const` is part of the signature. What is `override` for?', explain: 'Without `const` it is a different function. `override` turns that silent mistake into a compile error. Without `override`, you would just get a new, unrelated function.' },
      ],
    },
    {
      id: 'virtual',
      title: 'Virtual functions & vtables',
      blocks: [
        { kind: 'analogy', text: 'Every class with virtual functions has a **phone directory** (the vtable) listing which number to call for each function. Every object carries a pointer to its class\'s directory. Calling `c.size()` through a base reference means: open the object\'s directory, look up "size", dial that number.' },
        { kind: 'stepper', title: 'Step through: dynamic dispatch', code: [
          'VectorContainer vc(3);',
          'ListContainer   lc{1, 2};',
          'Container& a = vc;',
          'Container& b = lc;',
          'a.size();   // which size()?',
          'b.size();',
        ], steps: [
          { line: 1, note: 'Each object stores a hidden **vptr** pointing at its class\'s vtable.', memory: [{ name: 'vc', value: 'vptr → VectorContainer::vtbl | v (3 doubles)' }, { name: 'VectorContainer::vtbl', value: '[0] operator[] → VectorContainer::operator[]\n[1] size → VectorContainer::size', kind: 'heap', note: 'one per class, in static memory' }] },
          { line: 2, note: 'A different class has a different vtable.', memory: [{ name: 'vc', value: 'vptr → VectorContainer::vtbl' }, { name: 'lc', value: 'vptr → ListContainer::vtbl | list (2 doubles)' }, { name: 'ListContainer::vtbl', value: '[0] operator[] → ListContainer::operator[]\n[1] size → ListContainer::size', kind: 'heap' }] },
          { line: 3, note: 'References to the base type. The static type is `Container&`.', memory: [{ name: 'a', value: 'alias of vc', kind: 'ref' }, { name: 'vc', value: 'vptr → VectorContainer::vtbl' }] },
          { line: 4, note: 'Same for `lc`. The compiler only knows "some Container" at both call sites below.', memory: [{ name: 'a', value: 'alias of vc', kind: 'ref' }, { name: 'b', value: 'alias of lc', kind: 'ref' }] },
          { line: 5, note: 'Follow `a`\'s vptr → `VectorContainer::vtbl[1]` → `VectorContainer::size()`. It returns 3.', memory: [{ name: 'a.vptr[1]', value: 'VectorContainer::size → 3', kind: 'ptr' }] },
          { line: 6, note: 'Same code, different directory: `ListContainer::size()` returns 2. That is **run-time polymorphism**.', memory: [{ name: 'b.vptr[1]', value: 'ListContainer::size → 2', kind: 'ptr' }] },
        ] },
        { kind: 'p', text: 'Cost: one pointer per object, one table per class, and an indirect call that the compiler usually can\'t inline. Tiny, but in a tight loop processing millions of ticks it matters. That is why performance-critical C++ often prefers templates and concepts (static polymorphism, module 8).' },
        { kind: 'pitfall', text: 'A base class used polymorphically **must** have a virtual destructor. Otherwise `delete base_ptr;` runs only the base destructor and leaks the derived part. That is UB.' },
        { kind: 'check', q: 'Why might a hot loop over `Shape&` calling `area()` be slower than a loop over `Circle` objects?', options: ['Virtual calls are interpreted', 'Virtual calls go through the vtable and usually can\'t be inlined', 'Base references copy the object', 'It isn\'t slower'], answer: 1, hint: 'Think about what the compiler knows at the call site in each case.', explain: 'With the concrete type the compiler knows exactly which function runs, so it can inline and vectorise. Through a base reference it must look it up at runtime.' },
      ],
    },
    {
      id: 'hierarchies',
      title: 'Class hierarchies & ownership',
      blocks: [
        { kind: 'analogy', text: 'A hierarchy is a family tree of job descriptions: `Shape` → `Circle`, `Smiley`. Each level adds detail. The danger is the classic family-business problem: nobody is clear on who owns what. `unique_ptr` is a deed of ownership.' },
        { kind: 'code', code: `class Shape {
public:
    virtual Point center() const = 0;
    virtual void move(Point to) = 0;
    virtual void draw() const = 0;
    virtual ~Shape() = default;
};

class Circle : public Shape {
public:
    Circle(Point p, int rad) : x{p}, r{rad} {}
    Point center() const override { return x; }
    void move(Point to) override { x = to; }
    void draw() const override;
private:
    Point x;
    int r;
};

std::vector<std::unique_ptr<Shape>> shapes;
shapes.push_back(std::make_unique<Circle>(Point{0, 0}, 10));
for (const auto& s : shapes) s->draw();   // polymorphic
// no delete anywhere: unique_ptr frees each Shape` },
        { kind: 'list', items: [
          '**Interface inheritance**: a derived object can be used wherever the base is expected.',
          '**Implementation inheritance**: the base provides code the derived class reuses. Use sparingly, since deep hierarchies get brittle.',
          'Polymorphic objects are usually accessed via pointer or reference, and usually live on the heap via `std::unique_ptr`.',
        ] },
        { kind: 'h', text: 'Asking "what are you really?": dynamic_cast' },
        { kind: 'code', code: `void maybe_wink(Shape* s) {
    if (auto* sm = dynamic_cast<Smiley*>(s))   // nullptr if s isn't a Smiley
        sm->wink(1);
}
Smiley& sr = dynamic_cast<Smiley&>(*s);       // throws std::bad_cast if wrong` },
        { kind: 'p', text: 'Frequent `dynamic_cast` is a design smell: it usually means a virtual function is missing from the base. If you have a **closed** set of types, `std::variant` (module 2) is often simpler and faster than a hierarchy.' },
        { kind: 'pitfall', text: '**Slicing**: copying a `Circle` into a `Shape` by value (impossible here, since `Shape` is abstract, but common with concrete bases) cuts off the derived part. Polymorphism only works through pointers and references.' },
        { kind: 'check', q: 'What happens at the closing brace?', code: `{
    std::unique_ptr<Shape> p = std::make_unique<Circle>(Point{}, 5);
}`, options: ['Memory leak', '`~Circle` then `~Shape` run, and memory is freed', 'Only `~Shape` runs', 'Compile error: can\'t convert'], answer: 1, hint: 'Shape has a virtual destructor.', explain: '`unique_ptr` deletes through `Shape*`. Because `~Shape` is virtual, the full `Circle` destructor chain runs.' },
      ],
    },
  ],
  quiz: [
    { q: 'What makes a class abstract?', options: ['The `abstract` keyword', 'At least one pure virtual function (`= 0`)', 'Having no data members', 'Being a base class'], answer: 1, explain: 'C++ has no `abstract` keyword. A pure virtual function makes the class non-instantiable.' },
    { q: 'Why give a polymorphic base class a virtual destructor?', options: ['Performance', 'So deleting via a base pointer runs the derived destructor', 'Required for `override`', 'So it can be copied'], answer: 1, explain: 'Otherwise only the base part is destroyed, which is UB and typically a leak.' },
    { q: 'What does `override` do?', options: ['Makes a function virtual', 'Makes the compiler verify the function overrides a base virtual', 'Hides the base function', 'Prevents further overriding'], answer: 1, explain: '`final` prevents further overriding. `override` catches signature mismatches.' },
    { q: 'A vtable is…', options: ['one per object', 'one per class with virtual functions', 'one per program', 'allocated on each call'], answer: 1, explain: 'Each object holds a pointer (vptr) to its class\'s single shared table.' },
    { q: '`dynamic_cast<Derived*>(base_ptr)` returns what on failure?', options: ['Throws', '`nullptr`', 'The base pointer unchanged', 'UB'], answer: 1, explain: 'The pointer form returns `nullptr`. The reference form throws `std::bad_cast`.' },
    { q: 'Some languages satisfy interfaces implicitly, by matching methods. How are C++ abstract classes satisfied?', options: ['Implicitly by matching methods', 'Explicitly by inheriting from them', 'Via an `implements` keyword', 'At link time'], answer: 1, explain: 'Nominal subtyping. For structural, compile-time constraints use concepts.' },
    { q: 'RAII stands for…', options: ['Runtime Allocation Is Immediate', 'Resource Acquisition Is Initialisation', 'Reference And Iterator Interface', 'Read After Init Invariant'], answer: 1, explain: 'Tie a resource\'s lifetime to an object\'s: acquire in the constructor, release in the destructor.' },
    { q: 'Why do performance-sensitive codebases often avoid virtual calls in hot loops?', options: ['They are not thread-safe', 'Indirect calls block inlining and add a memory lookup', 'They allocate memory', 'They throw'], answer: 1, explain: 'Templates and concepts give compile-time polymorphism with no indirection.' },
  ],
}
