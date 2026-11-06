import type { ReactNode } from 'react'

// A small, dependency-free C++ (and TS/Go-ish) highlighter. Good enough for teaching snippets.
const KW = new Set(
  `alignas alignof and asm auto bool break case catch char char8_t char16_t char32_t class co_await co_return co_yield concept const consteval constexpr constinit const_cast continue decltype default delete do double dynamic_cast else enum explicit export extern false final float for friend goto if import inline int long module mutable namespace new noexcept not nullptr operator or override private protected public register reinterpret_cast requires return short signed sizeof static static_assert static_cast struct switch template this thread_local throw true try typedef typeid typename union unsigned using virtual void volatile wchar_t while
   let var function interface type func go chan defer range package map struct nil string number boolean any readonly extends implements of in as
   def elif except raise None True False self pass with from yield lambda match case record sealed permits final
   select fallthrough iota global nonlocal assert async await del is lazy`.split(/\s+/),
)
// Java gets its own exact list: words like `of`, `map`, `in` and `string` are ordinary identifiers there.
const KW_JAVA = new Set(
  `abstract assert boolean break byte case catch char class const continue default do double else enum extends false final finally float for goto if implements import instanceof int interface long native new null package private protected public return short static strictfp super switch synchronized this throw throws transient true try void volatile while`.split(/\s+/),
)
// Contextual keywords are ordinary names elsewhere, as in `StructuredTaskScope.open()` or `Request.to(url)`.
const KW_JAVA_CONTEXTUAL = new Set(
  `exports module non open opens permits provides record requires sealed to transitive uses var when with yield`.split(/\s+/),
)
const isJavaKeyword = (id: string, prev: string, next: string) =>
  KW_JAVA.has(id) || (KW_JAVA_CONTEXTUAL.has(id) && prev !== '.' && next !== '(')
const TY = /^(std|size_t|int\d+_t|uint\d+_t|string|string_view|vector|array|map|unordered_map|optional|expected|variant|unique_ptr|shared_ptr|weak_ptr|span|mdspan|print|println|format|cout|cin|cerr|endl|Error|Promise|ostream|istream|thread|jthread|mutex|future|generator|views|ranges)$/

const RE = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"(?:sv|s)?|'(?:\\.|[^'\\])*'|`[^`]*`)|(^[ \t]*#[^\n]*)|(\b0x[\da-fA-F']+\w*|\b\d[\d'.]*(?:e[+-]?\d+)?[a-zA-Z_]*)|([A-Za-z_]\w*)/gm

// Python uses # for comments; swap the preprocessor rule for a comment rule.
const RE_PY = /(#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\0)|(\b\d[\d_.]*(?:e[+-]?\d+)?)|([A-Za-z_]\w*)/gm

export function highlight(src: string, lang?: string): ReactNode[] {
  const re = lang === 'python' ? RE_PY : RE
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  re.lastIndex = 0
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index))
    const [t, com, str, pp, num, id] = m
    let cls = ''
    if (com) cls = 'tok-com'
    else if (str) cls = 'tok-str'
    else if (pp) cls = 'tok-pp'
    else if (num) cls = 'tok-num'
    else if (id) {
      if (lang === 'java' ? isJavaKeyword(id, src[m.index - 1], src[m.index + id.length]) : KW.has(id)) cls = 'tok-kw'
      else if ((lang !== 'java' && TY.test(id)) || /^[A-Z]/.test(id)) cls = 'tok-ty'
      else if (src[m.index + id.length] === '(') cls = 'tok-fn'
    }
    out.push(cls ? <span key={k++} className={cls}>{t}</span> : t)
    last = m.index + t.length
  }
  if (last < src.length) out.push(src.slice(last))
  return out
}

/** Inline formatting: `code` and **bold**. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('`') && p.endsWith('`') ? (
          <code key={i}>{p.slice(1, -1)}</code>
        ) : p.startsWith('**') && p.endsWith('**') ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          p
        ),
      )}
    </>
  )
}
