import type { Module } from '../types'

export const s03: Module = {
  n: 3,
  title: 'Machine-Level Programming: x86-64 Basics',
  tour: '3.1–3.6 · Machine-Level Representation of Programs',
  summary: 'Reading the assembly your compiler produces: registers, the mov family and addressing modes, arithmetic and lea, condition codes, branches vs conditional moves, and how loops and switch statements are compiled. Enough to understand Compiler Explorer output and spot when the optimiser did (or didn\'t) do its job.',
  topics: ['From source to machine code', 'Registers & mov', 'Arithmetic & lea', 'Condition codes & branches', 'Loops & switch'],
  cpp23: ['Not a language feature, but essential tooling: Compiler Explorer (godbolt.org), `objdump -d -M intel`, and `-O2 -S -masm=intel`.'],
  lessons: [
    {
      id: 'pipeline',
      title: 'From source to machine code',
      blocks: [
        { kind: 'analogy', text: "Your C++ is a recipe in English; the CPU only understands a very terse kitchen code: \"move this to that bench, add these, jump back to step 4\". The compiler is the translator. Reading its translation tells you what your code really asks the machine to do, which is often surprisingly different from what you wrote, especially with optimisation on." },
        { kind: 'code', code: `// sum.cpp
long sum(const long* xs, long n) {
    long s = 0;
    for (long i = 0; i < n; ++i) s += xs[i];
    return s;
}

// $ g++ -O1 -S -masm=intel sum.cpp -o -        (or paste into godbolt.org)
// GCC 13, -O1 (assembler directives removed):
// sum(long const*, long):
//         endbr64                      ; control-flow-integrity marker
//         test    rsi, rsi             ; n <= 0 ?
//         jle     .L4
//         mov     rax, rdi             ; p = xs
//         lea     rcx, [rdi+rsi*8]     ; end = xs + n
//         mov     edx, 0               ; s = 0
// .L3:    add     rdx, QWORD PTR [rax] ; s += *p
//         add     rax, 8               ; ++p   (8 bytes per long)
//         cmp     rax, rcx
//         jne     .L3                  ; loop until p == end
// .L1:    mov     rax, rdx             ; the return value goes in rax
//         ret
// .L4:    mov     edx, 0               ; empty input: s = 0
//         jmp     .L1` },
        { kind: 'list', items: [
          'The pipeline is **preprocess → compile → assemble → link** (`g++ -E`, `-S`, `-c`, then the linker). Module 7 covers linking.',
          'Turn on optimisation (`-O2`) before reading assembly: `-O0` output is deliberately literal and slow.',
          'Intel syntax (`op dest, src`) is easier to read than the default AT&T syntax (`op src, dest`, with `%` and `$`).',
        ] },
        { kind: 'check', q: 'Which flag makes g++ emit assembly instead of an object file?', options: ['-c', '-S', '-E', '-o'], answer: 1, hint: 'S for assembly Source.', explain: '-E preprocesses only; -c stops before linking.' },
      ],
    },
    {
      id: 'registers',
      title: 'Registers & mov',
      blocks: [
        { kind: 'analogy', text: "Registers are the chef's hands: 16 general-purpose slots, 64 bits each, that the CPU can work on instantly. Memory is the pantry: huge but further away. Almost every instruction moves something between hands and pantry or combines what's in two hands. The calling convention decides which hands carry arguments in and the result out." },
        { kind: 'code', code: `; System V AMD64 calling convention (Linux, macOS):
;   integer/pointer args: rdi, rsi, rdx, rcx, r8, r9   (then the stack)
;   floating-point args:  xmm0–xmm7
;   return value:         rax (and rdx for 128-bit), xmm0 for floats
;   callee-saved:         rbx, rbp, r12–r15  (a function must restore them)
;
; Sub-registers: rax (64) ⊃ eax (32) ⊃ ax (16) ⊃ al (8)
;   writing eax zeroes the upper 32 bits of rax; writing ax or al does not

mov  rax, rdi                    ; register ← register
mov  rax, QWORD PTR [rdi]        ; register ← memory at address rdi      (load)
mov  QWORD PTR [rdi+8], rax      ; memory ← register                     (store)
mov  eax, DWORD PTR [rdi+rsi*4]  ; base + index×scale: xs[i] for 4-byte ints
movzx eax, BYTE PTR [rdi]        ; load a byte, zero-extend
movsx rax, DWORD PTR [rdi]       ; load 32 bits, sign-extend (movsxd)`, lang: 'cpp', caption: 'x86-64 registers and addressing modes (Intel syntax).' },
        { kind: 'check', q: 'On Linux x86-64, which register holds a function\'s first integer argument?', options: ['rax', 'rdi', 'rsp', 'rbx'], answer: 1, hint: 'rdi, rsi, rdx, rcx, r8, r9.', explain: 'Windows uses rcx, rdx, r8, r9 instead.' },
      ],
    },
    {
      id: 'arith',
      title: 'Arithmetic & lea',
      blocks: [
        { kind: 'analogy', text: "`lea` (load effective address) was designed to compute addresses, but compilers love it as a free calculator: it can compute `a + b*4 + 12` in one instruction without touching memory or the flags. Multiplications by small constants often become `lea` and shifts, which are cheaper than a real multiply." },
        { kind: 'code', code: `long scale(long x)      { return x * 5; }        // lea rax, [rdi+rdi*4]
long addr(long a, long b) { return a + b * 8 + 3; } // lea rax, [rdi+3+rsi*8]
long div8(long x)       { return x / 8; }        // shifts plus a fix-up for negatives (not a slow idiv)
unsigned long udiv8(unsigned long x) { return x / 8; }   // shr rax, 3: one instruction
long mod10(long x)      { return x % 10; }        // multiply by a "magic" reciprocal, no idiv

// add, sub, imul, and, or, xor, shl/sal, sar (arithmetic shift), shr (logical shift), neg, not
// xor eax, eax   is the idiomatic way to zero a register (shorter than mov eax, 0)` },
        { kind: 'p', text: 'Division is one of the slowest integer instructions (tens of cycles). When the divisor is a constant, compilers replace it with multiplication and shifts. When it isn\'t, consider whether you can restructure: e.g. a power-of-two ring buffer uses `i & (n - 1)` instead of `i % n`.' },
        { kind: 'check', q: 'Why is `x / 8` faster for unsigned x than for signed x?', options: ['It isn\'t', 'Unsigned division by 8 is a single right shift; signed needs a correction for negative values', 'Signed uses idiv always', 'Unsigned uses floats'], answer: 1, hint: 'Rounding towards zero for negatives.', explain: 'Signed division truncates towards zero; a plain shift rounds down.' },
      ],
    },
    {
      id: 'branches',
      title: 'Condition codes, branches & cmov',
      blocks: [
        { kind: 'analogy', text: "After arithmetic or a `cmp`, the CPU sets status flags (zero, sign, carry, overflow), like warning lights on a dashboard. A conditional jump looks at the lights and decides where to go next. A conditional move (`cmov`) instead computes both outcomes and picks one, avoiding a guess about which way the jump will go: useful when the condition is unpredictable." },
        { kind: 'code', code: `long max(long a, long b) { return a > b ? a : b; }
// cmp  rdi, rsi
// mov  rax, rsi
// cmovge rax, rdi     ; branch-free: no misprediction possible
// ret

long clamp_count(const long* xs, long n, long hi) {
    long c = 0;
    for (long i = 0; i < n; ++i)
        if (xs[i] > hi) ++c;        // often compiled to setg/adc or cmov: no branch per element
    return c;
}

// Jumps: jmp (always), je/jne (==, !=), jl/jle/jg/jge (signed <, <=, >, >=),
//        jb/jbe/ja/jae (unsigned "below"/"above").  Seeing jb vs jl tells you the type's signedness.` },
        { kind: 'check', q: 'When does a conditional move (cmov) beat a branch?', options: ['Always', 'When the condition is unpredictable, so a branch would mispredict often', 'When the condition is always true', 'Never'], answer: 1, hint: 'Guessing which way the jump goes.', explain: 'Predictable branches are nearly free (module 5).' },
      ],
    },
    {
      id: 'loops',
      title: 'Loops & switch',
      blocks: [
        { kind: 'analogy', text: "Every loop becomes the same three ingredients: a test, a body and a jump back. A dense `switch` becomes a jump table: an array of code addresses indexed by the case value, so finding the right case is a single lookup rather than a chain of comparisons." },
        { kind: 'code', code: `int fee_bps(int venue) {
    switch (venue) {               // dense cases 0..4 → jump table (or a lookup table of constants)
        case 0: return 10;
        case 1: return 12;
        case 2: return 8;
        case 3: return 15;
        case 4: return 9;
        default: return 20;
    }
}
// GCC 13, -O2:
// mov  eax, 20                          ; assume the default
// cmp  edi, 4
// ja   .L19                             ; unsigned compare: also catches negatives
// mov  edi, edi                         ; zero-extend the index
// lea  rax, CSWTCH.12[rip]              ; GCC turned the switch into a table of return values
// mov  eax, DWORD PTR [rax+rdi*4]
// .L19: ret

// At -O2/-O3, loops may also be unrolled (several iterations per jump) and
// vectorised (SIMD: 4–8 elements per instruction). Module 5 measures both.` },
        { kind: 'check', q: 'Why does `ja` (an unsigned comparison) appear in a switch on a signed int?', options: ['A bug', 'Treating the value as unsigned makes negative values huge, so one check covers both < 0 and > 4', 'Speed only', 'Jump tables need unsigned'], answer: 1, hint: '−1 as unsigned is very large.', explain: 'A classic compiler trick.' },
      ],
    },
  ],
  quiz: [
    { q: 'Which step turns assembly into an object file?', options: ['Preprocessing', 'Assembling', 'Linking', 'Loading'], answer: 1, explain: 'as / g++ -c.' },
    { q: 'How many general-purpose registers does x86-64 have?', options: ['8', '16', '32', '64'], answer: 1, explain: 'rax…r15.' },
    { q: 'The return value of an integer function is in…', options: ['rdi', 'rax', 'rsp', 'rbp'], answer: 1, explain: 'xmm0 for floats.' },
    { q: 'Writing to eax…', options: ['Leaves the top of rax unchanged', 'Zeroes the upper 32 bits of rax', 'Is illegal', 'Writes to memory'], answer: 1, explain: 'Unlike ax/al.' },
    { q: 'lea is often used for…', options: ['Loading memory', 'Cheap address-style arithmetic without touching memory', 'Jumps', 'System calls'], answer: 1, explain: 'e.g. x*5.' },
    { q: 'Integer division by a constant is usually compiled to…', options: ['idiv', 'Multiplication and shifts', 'A loop', 'A function call'], answer: 1, explain: 'Magic-number reciprocals.' },
    { q: 'jb vs jl indicates…', options: ['Byte vs long', 'Unsigned vs signed comparison', 'Loop vs branch', 'Nothing'], answer: 1, explain: 'Below/above are unsigned.' },
    { q: 'A dense switch is often compiled to…', options: ['A chain of ifs always', 'A jump table or lookup table', 'A hash map', 'Recursion'], answer: 1, explain: 'One indexed lookup.' },
  ],
}
