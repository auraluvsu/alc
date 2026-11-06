import type { Module } from '../types'

export const g10: Module = {
  n: 10,
  title: 'Packages & the Go Tool',
  tour: '10 · Packages and the Go Tool',
  summary: 'Designing packages, import paths, modules and versioning, workspaces, internal packages, embedding files, build constraints, and the go command\'s everyday subcommands.',
  topics: ['Packages & import paths', 'Modules & versions', 'Project layout & internal', 'Workspaces & tools', 'Embedding & build tags', 'Documenting packages'],
  cpp23: [
    'Modules replaced GOPATH (Go 1.11, default since 1.16); the book describes GOPATH only.',
    '`//go:embed` bundles files into the binary (Go 1.16).',
    '`go work` workspaces for multi-module development (Go 1.18).',
    '`tool` directives in go.mod and `go tool <name>` (Go 1.24).',
  ],
  lessons: [
    {
      id: 'packages',
      title: 'Packages & import paths',
      blocks: [
        { kind: 'analogy', text: "A package is a shop with a front counter (exported names) and a back room (everything lowercase). Its import path is the street address, which is globally unique because it starts with a domain you control: `github.com/nas/quant/pricing`. Customers only ever see the counter." },
        { kind: 'code', code: `// file: pricing/blackscholes.go
// Package pricing implements option pricing models.
package pricing

// Call returns the Black–Scholes price of a European call.
func Call(s, k, t, r, sigma float64) float64 { ... }

func d1(s, k, t, r, sigma float64) float64 { ... }   // back room

// file: cmd/pricer/main.go
package main

import (
    "fmt"
    "github.com/nas/quant/pricing"        // last path element = package name, by convention
)

func main() { fmt.Println(pricing.Call(100, 105, 0.5, 0.04, 0.2)) }` },
        { kind: 'list', items: [
          'Package names are short, lowercase, single words: `http`, `json`, `pricing`. Avoid `util`, `common` and `helpers`; they say nothing.',
          'Names are read **qualified**, so avoid stutter: `pricing.Call`, not `pricing.PricingCall`; `bytes.Buffer`, not `bytes.ByteBuffer`.',
          'Import cycles are a compile error. If A and B need each other, extract the shared part into C.',
          'A blank import `import _ "image/png"` runs a package\'s `init` for its side effects (e.g. registering a decoder).',
        ] },
        { kind: 'check', q: 'Which exported name follows Go naming style for package `order`?', options: ['`order.OrderBook`', '`order.Book`', '`order.ORDER_BOOK`', '`order.orderBook`'], answer: 1, hint: 'Callers always see the package name in front.', explain: '`order.Book` reads naturally; `order.OrderBook` stutters, and lowercase wouldn\'t be exported.' },
      ],
    },
    {
      id: 'modules',
      title: 'Modules & versions',
      blocks: [
        { kind: 'analogy', text: "`go.mod` is a recipe card listing exact ingredient versions, and `go.sum` is the tamper seal on each jar (cryptographic hashes). Anyone cooking your recipe gets byte-for-byte identical ingredients, or the build refuses to run." },
        { kind: 'code', code: `// go.mod
module github.com/nas/quant

go 1.27

require (
    github.com/shopspring/decimal v1.4.0
    golang.org/x/sync v0.10.0
)

tool golang.org/x/tools/cmd/stringer       // Go 1.24: pinned dev tools

// Shell
// go get github.com/shopspring/decimal@v1.4.0   add or upgrade
// go get -u ./...                                upgrade all (minor/patch)
// go mod tidy                                    add missing, drop unused
// go list -m all                                 every module in the build
// go tool stringer -type=Side                    run a pinned tool` },
        { kind: 'list', items: [
          '**Semantic import versioning**: v2+ of a module has a different import path (`example.com/lib/v2`), so v1 and v2 can coexist in one build.',
          '**Minimal version selection**: Go picks the *minimum* version that satisfies every requirement, not the newest. Builds are reproducible without a separate lock file.',
          'Downloads go through the public module proxy and are verified against the checksum database by default.',
          'The `go` line sets the language version for the module. Features like per-iteration loop variables follow it.',
        ] },
        { kind: 'compare',
          python: `# pyproject.toml + a lock file (uv/poetry)
[project]
dependencies = ["requests>=2.31"]
# uv add requests`,
          ts: `// package.json + package-lock.json
{ "dependencies": { "zod": "^3.23.0" } }
// npm install zod`,
          java: `<!-- pom.xml -->
<dependency>
  <groupId>com.google.guava</groupId>
  <artifactId>guava</artifactId>
  <version>33.0.0-jre</version>
</dependency>`,
          cpp: `# vcpkg.json + CMakeLists.txt
{ "dependencies": ["fmt"] }
find_package(fmt CONFIG REQUIRED)
target_link_libraries(app PRIVATE fmt::fmt)`,
          go: `// go.mod (+ go.sum hashes)
require github.com/shopspring/decimal v1.4.0
// go get github.com/shopspring/decimal`,
          note: 'Go needs no separate build tool or lock-file manager: the go command does both.' },
        { kind: 'check', q: 'How do you import version 2 of `github.com/x/lib`?', options: ['`github.com/x/lib@v2`', '`github.com/x/lib/v2`', 'Change go.mod only', '`github.com/x/lib-v2`'], answer: 1, hint: 'Major versions change the import path.', explain: 'Semantic import versioning puts `/v2` in the path, so v1 and v2 are different packages.' },
      ],
    },
    {
      id: 'layout',
      title: 'Project layout, internal & workspaces',
      blocks: [
        { kind: 'analogy', text: "`internal/` is a staff-only corridor: anything inside can be used by code under the same parent directory, and the compiler bars everyone else at the door. It lets you split a big codebase into packages without accidentally publishing them as an API." },
        { kind: 'code', code: `quant/
├── go.mod                   module github.com/nas/quant
├── cmd/
│   ├── backtest/main.go     one folder per binary
│   └── pricer/main.go
├── internal/
│   ├── feed/                importable only from within quant/...
│   └── risk/
├── pricing/                 public package: github.com/nas/quant/pricing
└── testdata/                ignored by the go tool; fixtures for tests

# Working on two modules at once (e.g. quant + a local fork of a library)
go work init ./quant ./decimal-fork
go work use ./another-module` },
        { kind: 'list', items: [
          'Start flat: a small project can be one `main` package. Add `cmd/` and `internal/` as it grows. There is no mandatory layout.',
          '`go.work` makes several local modules build together without editing go.mod `replace` lines. Usually don\'t commit it.',
          '`go mod vendor` copies dependencies into `vendor/` for fully offline or audited builds.',
        ] },
        { kind: 'check', q: 'Can another module import `github.com/nas/quant/internal/risk`?', options: ['Yes', 'No: internal packages are only importable from within the parent tree', 'Only with a replace directive', 'Only in tests'], answer: 1, hint: 'Staff-only corridor.', explain: 'The compiler enforces internal visibility based on the directory tree.' },
      ],
    },
    {
      id: 'embed',
      title: 'Embedding files & build constraints',
      blocks: [
        { kind: 'analogy', text: "`//go:embed` packs files into the binary like documents stapled inside a passport: one file to ship, and the templates, SQL and static assets always travel with it. Build constraints are \"this page only applies in Linux\" stamps that tell the compiler which files to include." },
        { kind: 'code', code: `import "embed"

//go:embed schema.sql
var schema string                       // a single file as a string (or []byte)

//go:embed static templates/*.html
var assets embed.FS                     // a whole tree as a read-only file system

http.Handle("/static/", http.FileServerFS(assets))

// file: affinity_linux.go
//go:build linux

package feed

func pinToCPU(n int) error { /* Linux-only syscall */ }

// file: affinity_other.go
//go:build !linux

package feed

func pinToCPU(n int) error { return nil }    // no-op elsewhere` },
        { kind: 'list', items: [
          'Filename suffixes also act as constraints: `_linux.go`, `_windows.go`, `_arm64.go`, `_test.go`.',
          'Custom tags: `//go:build integration`, enabled with `go test -tags=integration`.',
          '`//go:generate stringer -type=Side` records code-generation commands, which `go generate ./...` runs.',
        ] },
        { kind: 'check', q: 'What does `//go:embed static` with `var assets embed.FS` give you?', options: ['A path to the folder at runtime', 'The folder\'s files compiled into the binary as a read-only FS', 'A symlink', 'A download URL'], answer: 1, hint: 'Stapled inside the passport.', explain: 'Single-binary deployments can then serve assets with no files on disk.' },
      ],
    },
    {
      id: 'docs',
      title: 'Documenting & the go command',
      blocks: [
        { kind: 'analogy', text: "Go documentation is just comments placed directly above declarations, read by `go doc` and pkg.go.dev. There's no separate doc syntax to learn: write a sentence that starts with the name, and it shows up everywhere the API is browsed." },
        { kind: 'code', code: `// Package risk computes portfolio risk measures.
//
// All functions take returns as fractions (0.01 == 1%).
package risk

// VaR returns the historical value-at-risk at the given confidence level,
// e.g. VaR(returns, 0.99). It returns an error if returns is empty.
func VaR(returns []float64, confidence float64) (float64, error) { ... }

// Shell:
// go doc risk.VaR            documentation in the terminal
// go vet ./...               suspicious constructs
// go build -race ./...       build with the race detector
// go list -deps ./cmd/pricer every package in the build
// go env GOPATH GOOS         toolchain settings
// go clean -testcache        forget cached test results` },
        { kind: 'list', items: [
          'A doc comment starts with the declared name and is a complete sentence.',
          '`Example` functions in tests double as runnable, verified documentation (module 11).',
          'Run `gofmt`, `go vet` and `staticcheck` in CI; they are the community baseline.',
        ] },
        { kind: 'check', q: 'Where does Go documentation for a function come from?', options: ['A separate .md file', 'The comment immediately preceding its declaration', 'Annotations like @param', 'The README'], answer: 1, hint: 'No special syntax needed.', explain: '`go doc` and pkg.go.dev read ordinary comments attached to declarations.' },
      ],
    },
  ],
  quiz: [
    { q: 'What makes an import path unique worldwide?', options: ['A registry', 'It starts with a domain/repo path the author controls', 'A UUID', 'The package name'], answer: 1, explain: 'e.g. `github.com/nas/quant/pricing`.' },
    { q: 'What does `go.sum` contain?', options: ['Dependency licences', 'Cryptographic hashes of module contents', 'Build cache', 'Test results'], answer: 1, explain: 'It protects against tampered downloads.' },
    { q: 'Which version does Go\'s minimal version selection pick?', options: ['The newest available', 'The minimum version satisfying all requirements', 'A random compatible one', 'The one in vendor/'], answer: 1, explain: 'That makes builds reproducible by default.' },
    { q: 'What does `go mod tidy` do?', options: ['Formats code', 'Adds missing and removes unused module requirements', 'Clears the cache', 'Upgrades everything'], answer: 1, explain: 'Run it after changing imports.' },
    { q: 'What does `//go:build linux` at the top of a file do?', options: ['Runs only on Linux CI', 'Includes the file only when building for Linux', 'Marks it deprecated', 'Nothing'], answer: 1, explain: 'A `_linux.go` suffix does the same.' },
    { q: 'What is `go.work` for?', options: ['Scheduling builds', 'Developing several local modules together', 'Replacing go.mod', 'CI configuration'], answer: 1, explain: 'It is usually not committed.' },
    { q: 'What does an import cycle between two packages cause?', options: ['A runtime panic', 'A compile error', 'A vet warning', 'Slower builds'], answer: 1, explain: 'Extract shared code into a third package.' },
    { q: 'What does the `tool` directive in go.mod (Go 1.24) do?', options: ['Declares the compiler version', 'Pins developer tools so `go tool <name>` runs a reproducible version', 'Enables CGO', 'Lists binaries to build'], answer: 1, explain: 'It replaces the old tools.go blank-import trick.' },
  ],
}
