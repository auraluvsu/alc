import type { Module } from '../types'

export const p04: Module = {
  n: 4,
  title: 'Unicode Text vs Bytes',
  tour: '4 · Unicode Text Versus Bytes',
  summary: 'Characters vs code points vs bytes, encoding and decoding, handling encoding errors, reading files (now UTF-8 by default), normalising text for comparison, and sorting Unicode text.',
  topics: ['Characters & code points', 'bytes & bytearray', 'Encoders & decoders', 'Encoding errors', 'Text files', 'Normalisation & sorting'],
  cpp23: [
    'UTF-8 is the default encoding for `open()` and friends on every platform (3.15, PEP 686).',
    '`bytearray.take_bytes()` extracts bytes without copying (3.15).',
    '`encoding="locale"` keeps the old platform-dependent behaviour when you really need it.',
  ],
  lessons: [
    {
      id: 'chars',
      title: 'Characters, code points & bytes',
      blocks: [
        { kind: 'analogy', text: "A character is an idea (\"the letter é\"). Its **code point** is its number in the Unicode catalogue (U+00E9). Its **bytes** are how that number is written down for storage or the network, and different encodings write the same number differently, like the same price written in pounds or in pence. A Python `str` holds ideas; `bytes` hold the written-down form." },
        { kind: 'code', code: `s = "café"
len(s)                    # 4 characters (code points)
b = s.encode("utf-8")     # str → bytes: b'caf\\xc3\\xa9'
len(b)                    # 5 bytes: é takes 2 in UTF-8
b.decode("utf-8")         # bytes → str: 'café'

ord("é"), hex(ord("é"))   # (233, '0xe9')
chr(0x20AC)               # '€'
"\\N{EURO SIGN}"           # '€' by Unicode name
"€".encode("utf-8")       # b'\\xe2\\x82\\xac': 3 bytes
"€".encode("cp1252")      # b'\\x80': 1 byte in a legacy Windows encoding` },
        { kind: 'list', items: [
          '**Decode** at the edges of your program (bytes in), work with `str` inside, and **encode** on the way out. This is the "Unicode sandwich".',
          'A Python `str` is a sequence of code points; `len` counts code points, not bytes.',
          'UTF-8 is the de facto standard: ASCII-compatible, compact for Latin text, able to represent everything.',
        ] },
        { kind: 'compare',
          ts: `const s = "café"
s.length                              // 4 (UTF-16 code units!)
new TextEncoder().encode(s).length    // 5 bytes
"😀".length                            // 2: an emoji is a surrogate pair`,
          go: `s := "café"
len(s)                       // 5: Go strings ARE bytes
utf8.RuneCountInString(s)    // 4
[]byte(s)                    // the UTF-8 bytes`,
          java: `String s = "café";
s.length();                          // 4 (UTF-16 units)
s.getBytes(StandardCharsets.UTF_8).length;   // 5
"😀".length();                        // 2: surrogate pair`,
          cpp: `std::string s = "café";
s.size();          // 5: bytes, no Unicode awareness
// code points need a library (ICU) or manual decoding`,
          python: `s = "café"
len(s)                    # 4 code points, and "😀" has len 1
len(s.encode("utf-8"))    # 5 bytes`,
          note: 'Python is the only one of these where `len` counts code points: neither UTF-16 units (JS, Java) nor bytes (Go, C++).' },
        { kind: 'check', q: 'What is `len("😀")` in Python?', options: ['1', '2', '4', 'Depends on the platform'], answer: 0, hint: 'Python strings count code points.', explain: 'It is one code point (U+1F600). It takes 2 UTF-16 units in JS/Java and 4 UTF-8 bytes.' },
      ],
    },
    {
      id: 'bytes',
      title: 'bytes, bytearray & memoryview',
      blocks: [
        { kind: 'analogy', text: "`bytes` is a sealed envelope of numbers 0–255, `bytearray` is the same envelope you're allowed to edit, and `memoryview` is a window onto a part of either without copying a single byte, which is handy for chopping up big binary messages from a market data feed." },
        { kind: 'code', code: `b = b"XAU\\x01\\x02"
b[0]                      # 88: indexing gives an int
b[:3]                     # b'XAU': slicing gives bytes
bytes.fromhex("58 41 55") # b'XAU'
b.hex(" ")                # '58 41 55 01 02'

buf = bytearray(b"header:")
buf += b"payload"         # mutable
data = buf.take_bytes()   # 3.15: grab the contents as bytes and empty buf, no copy

import struct
packet = struct.pack("<3sdI", b"XAU", 2390.5, 10)   # little-endian: 3-byte str, double, uint32
sym, px, qty = struct.unpack("<3sdI", packet)

mv = memoryview(packet)
header = mv[:3]           # zero-copy slice
header.tobytes()          # b'XAU'` },
        { kind: 'pitfall', text: "`b'abc'[0]` is the **integer** 97, not `b'a'`. Use slicing (`b[0:1]`) when you want a one-byte `bytes` object." },
        { kind: 'check', q: 'What is `b"XAU"[1]`?', options: ["b'A'", "'A'", '65', 'IndexError'], answer: 2, hint: 'Indexing a bytes object returns…', explain: 'A single byte is returned as an int (0–255). Slicing returns bytes.' },
      ],
    },
    {
      id: 'errors',
      title: 'Encoding errors',
      blocks: [
        { kind: 'analogy', text: "Encoding errors are mistranslations at the border. Writing \"€\" in a codebook that has no € (ASCII) can't be done (UnicodeEncodeError). Reading bytes with the wrong codebook gives either an error (UnicodeDecodeError) or, worse, plausible-looking gibberish called **mojibake**: 'cafÃ©'." },
        { kind: 'code', code: `"€uro".encode("ascii")                          # UnicodeEncodeError
"€uro".encode("ascii", errors="replace")        # b'?uro'
"€uro".encode("ascii", errors="xmlcharrefreplace")   # b'&#8364;uro'

raw = "café".encode("utf-8")                    # b'caf\\xc3\\xa9'
raw.decode("latin-1")                           # 'cafÃ©': no error, just wrong (mojibake)
b"\\xff\\xfe".decode("utf-8")                     # UnicodeDecodeError
b"\\xff".decode("utf-8", errors="replace")        # '\\ufffd': U+FFFD, the Unicode replacement character

# Python source files are UTF-8 by default; identifiers may be Unicode
prix = 2390.5; año = 2026` },
        { kind: 'list', items: [
          'Don\'t guess encodings in production. Get them from the protocol (HTTP headers, file spec) or require UTF-8.',
          'If you truly must guess, the `charset-normalizer` package makes an educated guess. It is still a guess.',
          '`errors="surrogateescape"` round-trips undecodable bytes through `str` (used for odd filenames).',
        ] },
        { kind: 'check', q: 'Decoding UTF-8 bytes as latin-1 usually…', options: ['Raises UnicodeDecodeError', 'Succeeds silently but produces mojibake', 'Returns bytes', 'Is identical'], answer: 1, hint: 'Every byte value 0–255 is a valid latin-1 character.', explain: 'latin-1 can decode any bytes, which is why it hides errors as garbled text.' },
      ],
    },
    {
      id: 'files',
      title: 'Text files & the UTF-8 default',
      blocks: [
        { kind: 'analogy', text: "For decades, `open()` without an encoding used whatever language the operating system was set to, so the same script read files differently on a London Windows laptop and a Linux server. Python 3.15 finally settles it: the default is UTF-8 everywhere." },
        { kind: 'code', code: `# Text mode: decodes on read, encodes on write
with open("trades.csv", encoding="utf-8") as f:     # still best practice: be explicit
    for line in f:
        ...

with open("report.txt", "w", encoding="utf-8", newline="") as f:
    f.write("XAU,2390.50\\n")

# Binary mode: bytes in, bytes out, no decoding
with open("ticks.bin", "rb") as f:
    header = f.read(16)

from pathlib import Path
text = Path("notes.md").read_text(encoding="utf-8")
Path("out.bin").write_bytes(data)

import locale, sys
sys.flags.utf8_mode          # 1 by default in 3.15
locale.getpreferredencoding()` },
        { kind: 'new23', text: 'Since 3.15 (PEP 686), UTF-8 mode is on by default: `open()`, `Path.read_text()` and friends use UTF-8 when no encoding is given, on every OS. `encoding="locale"` explicitly asks for the old behaviour, and `PYTHONUTF8=0` turns the mode off. Writing `encoding="utf-8"` explicitly is still recommended for code that must also run on older Pythons.' },
        { kind: 'check', q: 'In Python 3.15, what encoding does `open("x.txt")` use by default?', options: ['The OS locale encoding', 'UTF-8', 'ASCII', 'latin-1'], answer: 1, hint: 'PEP 686.', explain: 'UTF-8 mode is the default from 3.15. Before that, the default depended on the platform.' },
      ],
    },
    {
      id: 'normalise',
      title: 'Normalising & sorting text',
      blocks: [
        { kind: 'analogy', text: "\"é\" can be stored as one code point, or as \"e\" plus a combining accent: the same letter typed two ways. They look identical but compare unequal, like the same price written as 2390.50 and 2390.5000. Normalisation rewrites both into one canonical form before you compare." },
        { kind: 'code', code: `import unicodedata
s1 = "café"                       # é as U+00E9
s2 = "cafe\\u0301"                 # e + COMBINING ACUTE ACCENT
s1 == s2                          # False!
len(s1), len(s2)                  # (4, 5)

def nfc(s): return unicodedata.normalize("NFC", s)
nfc(s1) == nfc(s2)                # True: compose to single code points

"Straße".lower()                  # 'straße'
"Straße".casefold()               # 'strasse': aggressive, for case-insensitive matching
nfc("Straße").casefold() == nfc("STRASSE").casefold()   # True

unicodedata.name("€")             # 'EURO SIGN'
unicodedata.category("A")         # 'Lu' (uppercase letter)

sorted(["éclair", "eclipse", "Zebra"])               # ['Zebra', 'eclipse', 'éclair']: by code point
sorted(["éclair", "eclipse", "Zebra"], key=str.casefold)` },
        { kind: 'list', items: [
          '**NFC** (composed) is the usual choice for storage and comparison. **NFKC** also folds compatibility forms (e.g. "①" → "1") and suits search and identifiers.',
          'For case-insensitive comparison, normalise, then `casefold()`. `lower()` isn\'t enough for every language.',
          'Correct locale-aware sorting needs the `locale` module or the `pyuca` / ICU libraries; default `sorted` orders by code point.',
        ] },
        { kind: 'check', q: 'Two strings look identical but `==` is False. Most likely cause?', options: ['A Python bug', 'Different Unicode normalisation forms', 'Hash collision', 'Encoding is UTF-16'], answer: 1, hint: 'There is more than one way to type é.', explain: 'Normalise both (usually NFC) before comparing user-supplied text.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does `str.encode()` produce?', options: ['A str', 'bytes', 'A code point list', 'A Unicode object'], answer: 1, explain: 'encode: str → bytes; decode: bytes → str.' },
    { q: 'What is the "Unicode sandwich"?', options: ['A file format', 'Decode input early, work with str, encode output late', 'Mixing UTF-8 and UTF-16', 'Using BOMs'], answer: 1, explain: 'It keeps encoding concerns at the edges.' },
    { q: 'What is `len("café".encode("utf-8"))`?', options: ['4', '5', '6', '8'], answer: 1, explain: 'é takes 2 bytes.' },
    { q: 'What does `b"abc"[0]` return?', options: ["b'a'", "'a'", '97', 'IndexError'], answer: 2, explain: 'Indexing bytes gives ints.' },
    { q: 'Which encoding never raises when decoding any bytes?', options: ['utf-8', 'ascii', 'latin-1', 'cp1252'], answer: 2, explain: 'Every byte maps to a latin-1 character, so errors become mojibake.' },
    { q: 'What changed about `open()` in Python 3.15?', options: ['It defaults to binary', 'UTF-8 is the default encoding everywhere', 'encoding= was removed', 'It returns bytes'], answer: 1, explain: 'PEP 686.' },
    { q: 'Which is best for case-insensitive matching?', options: ['`lower()`', 'Normalise, then `casefold()`', '`upper()`', '`title()`'], answer: 1, explain: 'casefold handles cases like ß → ss.' },
    { q: 'What does NFC normalisation do?', options: ['Removes accents', 'Composes characters into canonical single code points where possible', 'Converts to ASCII', 'Lowercases'], answer: 1, explain: 'It makes visually identical strings compare equal.' },
  ],
}
