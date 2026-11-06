import type { Module } from '../types'

export const j12: Module = {
  n: 12,
  title: 'The Java Platform Module System',
  tour: '12 · The Java Platform Module System',
  summary: 'Why modules exist, declaring and requiring them, exporting packages, reflective access, modular JARs and automatic modules, migration flags, service loading, and the tools that go with it.',
  topics: ['The module concept', 'requires & exports', 'opens & reflective access', 'Modular & automatic JARs', 'Service loading', 'jdeps, jlink & friends'],
  cpp23: [
    '`import module java.base;` imports all the packages a module exports, which is separate from declaring your own (Java 25).',
    'Ahead-of-time caches can speed up startup: `-XX:AOTCacheOutput` (Java 25), with object caching for any collector (Java 26).',
    'Deep reflection that mutates `final` fields now warns, tightening encapsulation further (Java 26).',
  ],
  lessons: [
    {
      id: 'concept',
      title: 'The module concept',
      blocks: [
        { kind: 'analogy', text: "Before modules, a big Java application was an open-plan office with a vague seating chart: anyone could use anyone's desk, and if two people brought the same stapler, the first one found won. A module is a walled department with a front desk. It lists who it needs and what it offers, and everything else stays behind the door." },
        { kind: 'list', items: [
          '**The problem:** the class path is a flat list. `public` meant public to everyone. Missing or duplicate JARs surfaced only at runtime (the "JAR hell").',
          '**Strong encapsulation:** a `public` class in a package that isn\'t exported cannot be used from outside the module, at compile time or at runtime.',
          '**Reliable configuration:** the JVM checks at startup that every required module is present. A missing one fails right away, not an hour later when a class is first touched.',
          '**A smaller runtime:** the JDK itself was split into modules, so `jlink` can build a trimmed image with only what your application uses.',
        ] },
        { kind: 'p', text: 'A **package** groups classes. A **module** groups packages and decides which are visible from outside. Modules are entirely optional for your code: an ordinary class-path application keeps working, and it lives in the "unnamed module".' },
        { kind: 'code', code: `// src/com.example.pricing/module-info.java
module com.example.pricing {
    requires java.net.http;                 // what it needs
    exports com.example.pricing.api;        // what it offers
}                                           // com.example.pricing.internal stays hidden` },
        { kind: 'list', items: [
          'Name modules with a reversed domain, usually the name of the main package, like `com.example.pricing`. Dots are allowed, hyphens are not.',
          'Module names are unrelated to folder paths in the JAR, but by convention the source directory has the same name.',
          'Every module implicitly requires `java.base`, which has `java.lang`, `java.util`, `java.io` and so on.',
        ] },
        { kind: 'compare',
          python: `# __all__ and leading underscores are conventions: anyone can still import.
__all__ = ["price"]`,
          cpp: `// C++20 modules
export module pricing;
export double price(int qty);
double internal();          // not exported`,
          go: `// The "internal" directory rule, plus go.mod for dependencies.
// example.com/pricing/internal/... can't be imported from outside.
module example.com/pricing`,
          ts: `// package.json "exports" limits which paths can be imported.
{ "exports": { ".": "./dist/index.js" } }`,
          java: `module com.example.pricing {
    requires java.net.http;
    exports com.example.pricing.api;
}`,
          note: 'Java\'s version is enforced by the compiler and the JVM. It has no notion of versions: tools like Maven still select the versions.' },
        { kind: 'check', q: 'Class `X` is `public`, in a package the module does not export. Can another module use it?', options: ['Yes, `public` means everyone', 'No: strong encapsulation hides unexported packages', 'Only by subclassing', 'Only at runtime'], answer: 1, hint: 'What does `exports` do?', explain: 'With modules, `public` means public to those who can read the package, and only exported packages can be read from outside.' },
      ],
    },
    {
      id: 'requires-exports',
      title: 'A modular program',
      blocks: [
        { kind: 'analogy', text: "`requires` is the department's list of who it depends on. `exports` is the public window. `requires transitive` means \"anyone who works with us also gets access to them\", as when a shared contract mentions another company by name." },
        { kind: 'code', code: `// Layout:
// src/com.example.app/module-info.java
// src/com.example.app/com/example/app/Main.java
// src/com.example.pricing/module-info.java
// src/com.example.pricing/com/example/pricing/api/Pricer.java

// com.example.pricing/module-info.java
module com.example.pricing {
    exports com.example.pricing.api;
}

// com.example.app/module-info.java
module com.example.app {
    requires com.example.pricing;
}

// Compile and run:
// javac -d out --module-source-path src $(find src -name "*.java")
// java --module-path out -m com.example.app/com.example.app.Main` },
        { kind: 'code', code: `module com.example.report {
    requires transitive com.example.pricing;   // your API exposes its types, so
                                               // users of this module read it too
    requires static com.example.annotations;   // needed to compile, optional at runtime
    exports com.example.report;
    exports com.example.report.spi to com.example.plugin;  // qualified: named friends only
}` },
        { kind: 'list', items: [
          '`requires` names a module. `exports` names a package.',
          'Use `requires transitive` when your public API mentions types from that module.',
          'Use `requires static` for optional dependencies, such as compile-only annotations.',
          'Cycles between modules aren\'t allowed.',
          'Run `java --list-modules` to list the modules in your JDK, and `java --describe-module java.sql` to see one.',
        ] },
        { kind: 'pitfall', text: 'A package may only be in one module on the module path (the **split package** rule). Two JARs that both contain `com.foo.util` will refuse to start when used as modules, though that often "worked" on the class path.' },
        { kind: 'check', q: 'When should you use `requires transitive`?', options: ['Always', 'When your exported API exposes types from that module', 'When you use it only in private methods', 'For optional dependencies'], answer: 1, hint: 'What would users of your API need to read?', explain: 'If your public method returns a `Pricer`, your callers need that module too. `transitive` passes along the dependency.' },
      ],
    },
    {
      id: 'opens',
      title: 'Modules & reflective access',
      blocks: [
        { kind: 'analogy', text: "`exports` is the public window: outsiders can use what's offered there. `opens` is giving a trusted inspector a pass to look in any drawer, including the private ones. Frameworks like JSON mappers are the inspectors, and they need that pass to fill private fields." },
        { kind: 'code', code: `module com.example.app {
    requires com.fasterxml.jackson.databind;

    exports com.example.app.api;                    // normal compile and runtime access
    opens com.example.app.dto;                      // deep reflection, for everyone
    opens com.example.app.model to com.fasterxml.jackson.databind;   // for one module
}

open module com.example.lenient {                   // every package is open
    requires java.sql;
}` },
        { kind: 'list', items: [
          '`exports` gives access to **public** members. It doesn\'t allow `setAccessible` on private ones.',
          '`opens` allows **deep reflection**, including private members, at runtime. It gives no compile-time access.',
          'Qualify with `to` whenever you can, so that only the framework gets the pass.',
          'If a framework fails with `InaccessibleObjectException`, this is the missing line.',
        ] },
        { kind: 'code', code: `// The error you will eventually meet:
// java.lang.reflect.InaccessibleObjectException: Unable to make field private
// java.lang.String com.example.app.dto.Order.sym accessible: module com.example.app
// does not "opens com.example.app.dto" to module com.fasterxml.jackson.databind

// A quick fix for an application you can't rebuild:
// java --add-opens com.example.app/com.example.app.dto=com.fasterxml.jackson.databind ...` },
        { kind: 'new23', text: "The direction of travel is toward stronger encapsulation. **Java 16 and 17** closed off JDK internals by default. **Java 24** warns about `sun.misc.Unsafe` memory methods and restricted JNI use. **Java 26** warns on reflective mutation of `final` fields. Libraries that relied on loopholes are gradually moving to supported APIs." },
        { kind: 'check', q: 'A JSON library must set private fields in your classes. What does your module need?', options: ['`exports` the package', '`opens` the package to that library', '`requires` the package', 'Nothing'], answer: 1, hint: 'Private fields need deep reflection.', explain: '`opens` grants deep reflection at runtime. `exports` alone only exposes public members.' },
      ],
    },
    {
      id: 'migration',
      title: 'Modular JARs & migration',
      blocks: [
        { kind: 'analogy', text: "You don't have to move everyone into walled departments on the same day. A **modular JAR** is a department with its own front desk. An **automatic module** is a contractor given a temporary badge based on their name. The **unnamed module** is the old open-plan floor, still fully operational." },
        { kind: 'code', code: `// A modular JAR: an ordinary JAR with module-info.class at its root
// jar --create --file libs/pricing.jar --main-class com.example.pricing.Main -C out/pricing .
// java -p libs -m com.example.pricing
// jar --describe-module --file libs/pricing.jar

// In module-info, a plain JAR on the module path is an automatic module
module com.example.app {
    requires commons.lang3;     // name derived from commons-lang3-3.14.jar
}

// A library can pick a stable name in its manifest instead:
// Automatic-Module-Name: org.apache.commons.lang3

// Escape hatches for migration:
// --add-exports java.base/sun.nio.ch=ALL-UNNAMED    compile or run against a hidden package
// --add-opens java.base/java.lang=ALL-UNNAMED       allow deep reflection into it
// --add-modules java.sql                            add a module to the graph
// --add-reads com.example.app=ALL-UNNAMED           let a module read the class path` },
        { kind: 'list', items: [
          '**Named module:** has a `module-info`, is on the module path. Reads only what it requires.',
          '**Automatic module:** a plain JAR on the module path. It exports and opens everything, and reads everything. It lets you migrate from the top down.',
          '**Unnamed module:** everything on the class path. It reads all modules, but named modules can\'t depend on it.',
          'The name of an automatic module comes from `Automatic-Module-Name` in the manifest, or the file name otherwise. The latter is fragile.',
          'Many applications stay on the class path for good, and that\'s fine. Libraries benefit most from a stable module name.',
        ] },
        { kind: 'check', q: 'Can a named module `requires` code on the class path?', options: ['Yes, by default', 'No: the unnamed module has no name to require', 'Only for JDK code', 'Only with `opens`'], answer: 1, hint: 'What would you write after `requires`?', explain: 'That\'s why automatic modules exist. Move the JAR to the module path, and it receives a name.' },
      ],
    },
    {
      id: 'services',
      title: 'Service loading',
      blocks: [
        { kind: 'analogy', text: "Services are a plug-in socket for modules. One module says \"I use a `PriceFeed`\", without knowing who supplies it. Another declares \"I provide one\". The JVM connects them at startup, and the consumer never names the implementation: no direct dependency, no factory, no configuration file." },
        { kind: 'code', code: `// The API module
package com.example.feed.api;
public interface PriceFeed { double latest(String sym); }

module com.example.feed.api {
    exports com.example.feed.api;
}

// A provider module: implementation in a package it does not export
module com.example.feed.fixed {
    requires com.example.feed.api;
    provides com.example.feed.api.PriceFeed
        with com.example.feed.fixed.FixedFeed;
}

// The consumer module
module com.example.app {
    requires com.example.feed.api;
    uses com.example.feed.api.PriceFeed;
}

// The consumer code
var feeds = ServiceLoader.load(PriceFeed.class);
PriceFeed feed = feeds.findFirst().orElseThrow();
for (PriceFeed f : feeds) { System.out.println(f.getClass()); }
feeds.stream()
     .filter(p -> p.type().getSimpleName().startsWith("Fixed"))
     .map(ServiceLoader.Provider::get)
     .findFirst();` },
        { kind: 'list', items: [
          'A provider needs a public no-argument constructor, or a public static `provider()` method.',
          'Providers load lazily while you iterate, and they\'re cached by that `ServiceLoader`.',
          'Without modules, you register a provider through a file at `META-INF/services/<interface name>`.',
          'JDBC drivers, for example, use this mechanism: add the driver JAR, and `DriverManager` finds it.',
        ] },
        { kind: 'check', q: 'Which directive declares that a module supplies an implementation?', options: ['`uses`', '`provides ... with`', '`exports ... to`', '`requires service`'], answer: 1, hint: 'The consumer writes the other one.', explain: 'A provider writes `provides Interface with Implementation`, and a consumer writes `uses Interface`.' },
      ],
    },
    {
      id: 'tools',
      title: 'Tools for working with modules',
      blocks: [
        { kind: 'analogy', text: "`jdeps` is the surveyor who maps who depends on whom. `jlink` is the moving company that packs only the rooms you actually use into a compact, self-contained home. `jpackage` wraps that home up as an installer." },
        { kind: 'code', code: `// What does this JAR depend on?
// jdeps --print-module-deps app.jar           java.base,java.net.http
// jdeps -s app.jar                            a summary
// jdeps --jdk-internals app.jar               uses of hidden JDK APIs

// Build a trimmed runtime with only the needed modules
// jlink --module-path libs --add-modules com.example.app \\
//       --launcher app=com.example.app/com.example.app.Main \\
//       --strip-debug --compress zip-6 --no-header-files --no-man-pages \\
//       --output build/app-image
// build/app-image/bin/app

// Make a native installer (deb, rpm, msi, dmg)
// jpackage --name app --input libs --main-jar app.jar --main-class com.example.app.Main

// Inspect
// java --list-modules
// java --describe-module java.net.http
// java --show-module-resolution -m com.example.app/com.example.app.Main` },
        { kind: 'list', items: [
          '`jlink` images are often tens of megabytes, compared to hundreds for a full JDK. That\'s useful for containers.',
          'A `jlink` image contains its own JVM. The target machine needs no Java installed, but the image is specific to one OS and CPU.',
          'A tool like `jdeps` is also useful on non-modular applications: it tells you which modules a `jlink` image would need.',
          'Maven and Gradle both support the module path, and normally run these steps for you.',
        ] },
        { kind: 'new23', text: "Startup is the JVM's classic weakness, and **Project Leyden** is addressing it in stages. Java 24 added ahead-of-time class loading and linking, and Java 25 added method profiling and a simpler `-XX:AOTCacheOutput=app.aot` option, which caches a training run for a much faster next start. Java 26 extended this cache to work with any garbage collector." },
        { kind: 'check', q: 'What does `jlink` produce?', options: ['A JAR file', 'A custom runtime image containing only the required modules', 'An IDE project', 'A dependency report'], answer: 1, hint: 'It bundles a JVM.', explain: 'It links your modules and the needed JDK modules into a self-contained directory. `jdeps` is the one that gives you a report.' },
      ],
    },
  ],
  quiz: [
    { q: 'What file declares a module?', options: ['`module.xml`', '`module-info.java`', '`pom.xml`', '`MANIFEST.MF`'], answer: 1, explain: 'It compiles to `module-info.class` at the root of the JAR.' },
    { q: 'What does `exports` name?', options: ['A module', 'A package', 'A class', 'A JAR'], answer: 1, explain: '`requires` names modules, and `exports` and `opens` name packages.' },
    { q: 'What is the difference between `exports` and `opens`?', options: ['None', '`exports` is for compile and runtime public access; `opens` allows deep reflection at runtime', '`opens` is stricter', '`exports` is deprecated'], answer: 1, explain: 'A package can be opened without being exported, and reflection-based frameworks often only need that.' },
    { q: 'Which module does every module implicitly require?', options: ['`java.se`', '`java.base`', '`java.lang`', '`jdk.compiler`'], answer: 1, explain: 'You never need to write `requires java.base`.' },
    { q: 'What is an automatic module?', options: ['A module generated by `jlink`', 'A plain JAR placed on the module path', 'Any module with no exports', 'A JDK module'], answer: 1, explain: 'It gets a name and exports everything, which lets you migrate gradually.' },
    { q: 'Where does class-path code live in the module system?', options: ['`java.base`', 'The unnamed module', 'An automatic module', 'Nowhere'], answer: 1, explain: 'The unnamed module reads every module, but named modules can\'t require it.' },
    { q: 'How does a consumer find implementations of a service?', options: ['`new`', '`ServiceLoader.load`', 'Reflection on the class path', '`Class.forName` on a known name'], answer: 1, explain: 'It declares `uses` in its module descriptor, and loads through `ServiceLoader`.' },
    { q: 'What is a split package?', options: ['A package with several classes', 'One package present in two modules, which is not allowed', 'A package exported to two modules', 'A package with subpackages'], answer: 1, explain: 'A package must belong to exactly one module, for the JVM to resolve classes unambiguously.' },
  ],
}
