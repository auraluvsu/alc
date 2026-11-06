import type { Module } from './types'

export const m09: Module = {
  n: 9,
  title: 'Library Overview',
  tour: '9 · Library Overview',
  summary: 'What the standard library gives you, how it is organised, how to bring it in, and what it deliberately leaves to other libraries.',
  topics: ['Standard library components', 'Headers vs import std', 'The std namespace', 'What is not included'],
  cpp23: [
    '`import std;` and `import std.compat;` replace the header list for new code.',
    'New headers: `<expected>`, `<print>`, `<flat_map>`, `<flat_set>`, `<mdspan>`, `<generator>`, `<stacktrace>`, `<spanstream>`, `<stdfloat>`.',
    'Feature-test macros (e.g. `__cpp_lib_expected`) tell you what your library actually supports.',
  ],
  lessons: [
    {
      id: 'components',
      title: "What's in the box",
      blocks: [
        { kind: 'analogy', text: "The standard library is a well-stocked workshop, not a furnished house. You get precision tools (containers, algorithms, text, time, threads, maths) that fit together perfectly. You don't get ready-made rooms such as a web server, a JSON parser or a GUI. Those come from other suppliers." },
        { kind: 'list', items: [
          '**Run-time language support**: memory allocation, exceptions, type information.',
          '**Text**: `std::string`, `std::string_view`, `std::format`, `std::print`, regular expressions (modules 10–11).',
          '**I/O**: streams, files, `std::filesystem` (module 11).',
          '**Containers**: `vector`, `map`, `unordered_map`, `flat_map`, … (module 12).',
          '**Algorithms & ranges**: sorting, searching, transforming, lazy views (modules 13–14).',
          '**Resource management**: smart pointers, `span`, `optional`, `variant`, `expected` (modules 4, 15).',
          '**Utilities**: time, function objects, type traits, bit operations (module 16).',
          '**Numerics**: maths functions, random numbers, complex numbers (module 17).',
          '**Concurrency**: threads, locks, atomics, futures, coroutine support (module 18).',
        ] },
        { kind: 'p', text: "Everything is designed around a few shared ideas you've already met: value semantics, RAII, templates and iterators/ranges. That is why a `std::vector` works with `std::ranges::sort`, which works with your own types once they provide `<`." },
        { kind: 'check', q: 'Which of these is part of the C++23 standard library?', options: ['A JSON parser', 'An HTTP client', '`std::expected`', 'A GUI toolkit'], answer: 2, hint: 'Think "tools", not "finished rooms".', explain: '`std::expected` is in `<expected>`. JSON, HTTP and GUI need third-party libraries.' },
      ],
    },
    {
      id: 'organisation',
      title: 'Headers, modules & namespaces',
      blocks: [
        { kind: 'analogy', text: "Headers are individual drawers you must open one by one (`#include <vector>`, `#include <map>`…). `import std;` is the whole workshop wall, opened at once and pre-sorted, so it is actually **faster** to open than a handful of drawers." },
        { kind: 'code', code: `// Header style: list what you use
#include <vector>
#include <string>
#include <algorithm>
#include <print>

// C++23 module style: everything in namespace std, compiled once
import std;

// std.compat: also puts C functions (printf, sqrt, size_t...) in the global namespace
import std.compat;` },
        { kind: 'list', items: [
          'Everything standard lives in namespace `std` (or nested ones: `std::ranges`, `std::views`, `std::chrono`, `std::filesystem`, `std::numbers`).',
          'C headers come in two forms: `<cmath>` (puts names in `std`) and the legacy `<math.h>` (global). Prefer the `<c...>` versions.',
          'Each header is self-contained: include what you use, rather than relying on another header pulling it in by accident.',
        ] },
        { kind: 'h', text: 'Checking what your library supports' },
        { kind: 'code', code: `#include <version>
#if __cpp_lib_expected >= 202202L
    // std::expected is available
#endif
#if __cpp_lib_print
    // std::print/println are available
#endif` },
        { kind: 'p', text: "Compilers implement new library features at different speeds. Feature-test macros let one codebase compile everywhere, falling back where needed. cppreference.com lists the macro for every feature." },
        { kind: 'check', q: 'You `#include <algorithm>` and happen to get `std::vector` working without including `<vector>`. Should you rely on that?', options: ['Yes, it is guaranteed', 'No: include what you use; transitive includes vary between libraries', 'Only on Linux', 'Only with `import std;`'], answer: 1, hint: 'Would it still compile on a different compiler?', explain: 'Transitive includes are an implementation detail. Code that relies on them breaks when you change compiler or upgrade.' },
      ],
    },
    {
      id: 'missing',
      title: 'Beyond the standard',
      blocks: [
        { kind: 'analogy', text: "The C++ standard moves like a national building code: slowly, by committee, and it must work on everything from a microcontroller to a supercomputer. So anything that changes fast or depends on the platform, such as networking or file formats, is left to libraries." },
        { kind: 'list', items: [
          '**JSON**: nlohmann/json (convenient), simdjson (very fast).',
          '**Networking**: Asio / Boost.Asio, libcurl, Beast for HTTP.',
          '**Formatting before C++20/23**: {fmt}, which `std::format` was based on.',
          '**Linear algebra**: Eigen. **Testing**: GoogleTest, Catch2. **Logging**: spdlog.',
          '**Boost**: a huge collection of peer-reviewed libraries, many of which later became standard (smart pointers, `optional`, `filesystem`).',
        ] },
        { kind: 'p', text: "C++ has no single official package manager. Common choices are **vcpkg** and **Conan**, usually with **CMake** as the build system. That build-and-dependency setup is a real part of the learning curve." },
        { kind: 'code', code: `# CMakeLists.txt: the minimum for a C++23 project using vcpkg-installed fmt
cmake_minimum_required(VERSION 3.28)
project(pricer CXX)
set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
find_package(fmt CONFIG REQUIRED)
add_executable(pricer main.cpp)
target_link_libraries(pricer PRIVATE fmt::fmt)` },
        { kind: 'check', q: 'Where does `std::filesystem` come from historically?', options: ['It was always in C++', 'Boost.Filesystem, standardised in C++17', 'POSIX', 'Java NIO'], answer: 1, hint: 'Many standard features had an earlier life in a well-known collection of libraries.', explain: 'Boost acts as a proving ground; `filesystem`, smart pointers, `optional` and more all started there.' },
      ],
    },
  ],
  quiz: [
    { q: 'Which namespace holds lazy range adaptors like `filter`?', options: ['`std::lazy`', '`std::views` (alias of `std::ranges::views`)', '`std::iter`', '`std::stream`'], answer: 1, explain: '`std::views::filter`, `std::views::transform`, etc.' },
    { q: 'What does `import std.compat;` add over `import std;`?', options: ['Boost', 'C library names in the global namespace too', 'Deprecated features', 'Nothing'], answer: 1, explain: 'Useful when porting C-style code that calls `printf` or `sqrt` unqualified.' },
    { q: 'Which header should you prefer for C maths functions?', options: ['`<math.h>`', '`<cmath>`', '`<stdmath>`', '`<numbers>`'], answer: 1, explain: '`<cmath>` declares them in namespace `std`. (`<numbers>` holds constants like pi.)' },
    { q: 'What are feature-test macros for?', options: ['Unit testing', 'Detecting which standard features your toolchain supports', 'Turning on optimisations', 'Debugging'], answer: 1, explain: 'e.g. `__cpp_lib_expected`, defined in `<version>`.' },
    { q: 'Which is NOT in the C++23 standard library?', options: ['`std::flat_map`', '`std::generator`', 'Networking sockets', '`std::mdspan`'], answer: 2, explain: 'Standard networking is still not in the language; use Asio or similar.' },
    { q: 'What is the most common C++ build system?', options: ['npm', 'CMake', 'Gradle', 'Cargo'], answer: 1, explain: 'CMake, usually with vcpkg or Conan for dependencies.' },
  ],
}
