import type { Module } from '../types'

export const s07: Module = {
  n: 7,
  title: 'Linking & Loading',
  tour: '7 · Linking',
  summary: 'How separately compiled files become one program: translation units and object files, symbols and the one-definition rule, static vs shared libraries, how the dynamic loader resolves symbols at start-up, ELF files, and loading plugins at runtime.',
  topics: ['Translation units & object files', 'Symbols & the ODR', 'Static vs shared libraries', 'Dynamic linking & loading', 'Inspecting binaries'],
  cpp23: ['C++20 modules (`export module`, `import std;` in C++23) replace textual `#include` with compiled interfaces; build-system support is still maturing.'],
  lessons: [
    {
      id: 'tu',
      title: 'Translation units & object files',
      blocks: [
        { kind: 'analogy', text: "Each .cpp file is compiled on its own into an object file, like separate chapters of a book printed by different printers. Each chapter mentions things defined in other chapters (\"see the risk check in chapter 4\") without knowing their page numbers. The linker is the binder: it collects the chapters, fills in every cross-reference with a real address, and complains if a reference points nowhere or to two places." },
        { kind: 'code', code: `// risk.h — declarations: the promise
#pragma once
bool within_limit(long qty);

// risk.cpp — the definition
#include "risk.h"
bool within_limit(long qty) { return qty <= 1000; }

// main.cpp
#include <cstdio>
#include "risk.h"
int main() { std::printf("%d\\n", within_limit(500)); }

// $ g++ -c risk.cpp main.cpp          → risk.o, main.o   (compile only)
// $ g++ risk.o main.o -o app          → link
// $ g++ -c main.cpp && g++ main.o     → "undefined reference to within_limit(long)"` },
        { kind: 'check', q: '"undefined reference to X" comes from which stage?', options: ['Preprocessor', 'Compiler', 'Linker', 'Loader at runtime'], answer: 2, hint: 'A cross-reference pointing nowhere.', explain: 'The declaration compiled fine; no object file defined it.' },
      ],
    },
    {
      id: 'symbols',
      title: 'Symbols & the one-definition rule',
      blocks: [
        { kind: 'analogy', text: "Every function and global variable becomes a named symbol in the object file. C++ mangles names to encode parameter types (`within_limit(long)` becomes `_Z12within_limitl`), which is how overloads coexist. The one-definition rule says each non-inline thing may be defined exactly once in the whole program. Break it with *different* definitions in different files and you can get silent, undefined behaviour instead of an error." },
        { kind: 'code', code: `// $ nm -C risk.o
// 0000000000000000 T within_limit(long)     T = defined in text (code) section
// $ nm main.o
//                  U _Z12within_limitl        U = undefined here: needed from elsewhere
// $ c++filt _Z12within_limitl
// within_limit(long)

// Headers: put declarations, inline functions, templates and constexpr there.
inline int tick_size() { return 10; }       // inline: may be defined in many TUs, must be identical
static int helper() { return 1; }          // internal linkage: private to this .cpp
namespace { int also_private = 2; }        // anonymous namespace: same effect, preferred in C++

extern "C" int risk_check(long qty);       // C linkage: no mangling, callable from C, Python ctypes, Go cgo` },
        { kind: 'pitfall', text: 'Two .cpp files each defining a different `struct Config` (same name, different members) in the global namespace violate the ODR. The linker may not notice, and code compiled against one layout silently reads the other\'s memory. Put file-private types in an anonymous namespace.' },
        { kind: 'check', q: 'What does `extern "C"` do?', options: ['Makes a function faster', 'Gives it C linkage: an unmangled symbol name callable from C and FFIs', 'Exports it to Python automatically', 'Makes it static'], answer: 1, hint: 'Name mangling.', explain: 'Needed for ctypes, cgo and plugin entry points.' },
      ],
    },
    {
      id: 'libraries',
      title: 'Static vs shared libraries',
      blocks: [
        { kind: 'analogy', text: "A static library (.a) is a box of object files photocopied into your program at link time: self-contained, but every program carries its own copy. A shared library (.so) is a reference book on the library shelf that programs borrow at start-up: one copy on disk and in memory, upgradable without relinking, but the shelf must have the right edition when you run." },
        { kind: 'code', code: `// Static:
// $ g++ -c risk.cpp && ar rcs librisk.a risk.o
// $ g++ main.cpp -L. -lrisk -o app_static       (risk code copied into app_static)

// Shared:
// $ g++ -fPIC -shared risk.cpp -o librisk.so      (position-independent code)
// $ g++ main.cpp -L. -lrisk -Wl,-rpath,'$ORIGIN' -o app_shared
// $ ldd app_shared
//     librisk.so => ./librisk.so
//     libstdc++.so.6 => /lib/x86_64-linux-gnu/libstdc++.so.6
//     libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6

// Link order matters for static libraries: list a library AFTER the objects that use it.
// $ g++ -lrisk main.o        → may fail: the linker scanned librisk.a before it knew what was needed` },
        { kind: 'list', items: [
          '**Static**: simpler deployment, no version surprises, slightly faster calls; bigger binaries; security fixes need a rebuild.',
          '**Shared**: shared memory between processes, independent updates; "works on my machine" version problems (ABI mismatches).',
          'Low-latency systems often link statically (or with `-static-libstdc++`) for predictable deployment and to avoid the indirection of the PLT on hot calls.',
        ] },
        { kind: 'check', q: 'What does `-fPIC` produce?', options: ['Faster code', 'Position-independent code that can be loaded at any address, as shared libraries require', 'A static library', 'Debug info'], answer: 1, hint: 'The .so can land anywhere in memory.', explain: 'Executables use -fPIE for ASLR.' },
      ],
    },
    {
      id: 'dynamic',
      title: 'Dynamic linking & loading plugins',
      blocks: [
        { kind: 'analogy', text: "When a dynamically linked program starts, the loader (`ld-linux`) reads its list of needed libraries, maps them into memory and patches up the addresses. Calls into shared libraries go through a small trampoline table (the PLT/GOT), resolved on first use by default. `dlopen` lets your program borrow a book from the shelf whenever it chooses: the basis of plugin systems, like loading a different strategy library without restarting." },
        { kind: 'code', code: `// strategy.cpp → g++ -fPIC -shared strategy.cpp -o libmomentum.so
extern "C" double signal(const double* px, int n) {
    return px[n - 1] / px[0] - 1.0;
}

// host.cpp → g++ host.cpp -ldl -o host
#include <cstdio>
#include <dlfcn.h>

int main() {
    void* lib = dlopen("./libmomentum.so", RTLD_NOW);
    if (!lib) { std::printf("%s\\n", dlerror()); return 1; }
    using SignalFn = double (*)(const double*, int);
    auto fn = reinterpret_cast<SignalFn>(dlsym(lib, "signal"));
    double px[] = {100, 101, 103};
    std::printf("%.4f\\n", fn(px, 3));      // 0.0300
    dlclose(lib);
}

// LD_PRELOAD=./libmytrace.so ./app   → inject a library first (e.g. a faster malloc, or tracing)
// LD_BIND_NOW=1 / -Wl,-z,now          → resolve every symbol at start-up: no first-call surprise`, lang: 'cpp' },
        { kind: 'check', q: 'Why does the plugin export `signal` with `extern "C"`?', options: ['Speed', 'So dlsym can find it by its plain, unmangled name', 'C++ functions can\'t be in .so files', 'Required by -fPIC'], answer: 1, hint: 'What name would the C++ symbol have?', explain: 'Otherwise you\'d need the mangled name.' },
      ],
    },
    {
      id: 'inspect',
      title: 'Inspecting binaries',
      blocks: [
        { kind: 'analogy', text: "An ELF file is a filing cabinet with labelled drawers: `.text` (code), `.rodata` (constants), `.data` (initialised globals), `.bss` (zero-initialised globals, which take no space on disk), plus symbol and relocation tables. A handful of tools let you open the drawers when something won't link, crashes at start-up or is mysteriously large." },
        { kind: 'code', code: `// $ file app                  → ELF 64-bit LSB pie executable, x86-64, dynamically linked
// $ size app                  → text / data / bss sizes
// $ readelf -h app            → header: entry point, type
// $ readelf -S app            → sections (.text, .data, .bss, .plt, .got …)
// $ readelf -d app            → dynamic section: NEEDED libraries, RPATH
// $ nm -C --size-sort app     → symbols by size: what's making the binary big?
// $ objdump -d -M intel -C app | less    → disassembly (module 3)
// $ ldd app                   → which shared libraries would be loaded
// $ strace -e openat ./app    → which files the loader actually opens
// $ addr2line -e app 0x401136 -f -C      → turn a crash address into file:line (needs -g)`, lang: 'cpp', caption: 'Binary inspection tools on Linux.' },
        { kind: 'check', q: 'Why does a large zero-initialised global array not make the executable file bigger?', options: ['It\'s compressed', 'It lives in .bss, which records only a size and is zero-filled at load time', 'It\'s on the heap', 'The linker removes it'], answer: 1, hint: 'Which drawer?', explain: 'Non-zero initialised data goes in .data and does take space.' },
      ],
    },
  ],
  quiz: [
    { q: 'g++ -c produces…', options: ['An executable', 'An object file', 'Assembly', 'A library'], answer: 1, explain: 'Linking comes later.' },
    { q: 'Name mangling exists to…', options: ['Obfuscate code', 'Encode namespaces and parameter types so overloads have distinct symbols', 'Compress binaries', 'Speed linking'], answer: 1, explain: 'c++filt reverses it.' },
    { q: 'In nm output, U means…', options: ['Unused', 'Undefined: needed from another object or library', 'Unsigned', 'Unique'], answer: 1, explain: 'T is defined code.' },
    { q: 'Violating the ODR with different definitions…', options: ['Always errors', 'Can be silent undefined behaviour', 'Is allowed for structs', 'Only warns'], answer: 1, explain: 'Use anonymous namespaces.' },
    { q: 'A static library is…', options: ['Loaded at runtime', 'An archive of object files copied in at link time', 'A shared object', 'A header'], answer: 1, explain: '.a files.' },
    { q: 'ldd shows…', options: ['Symbols', 'Shared libraries a program depends on', 'Assembly', 'Sections'], answer: 1, explain: 'And where they resolve.' },
    { q: 'dlopen/dlsym are used for…', options: ['Debugging', 'Loading libraries and looking up symbols at runtime', 'Static linking', 'Compression'], answer: 1, explain: 'Plugins.' },
    { q: '.bss holds…', options: ['Code', 'Zero-initialised globals', 'Constants', 'Symbols'], answer: 1, explain: 'No space in the file.' },
  ],
}
