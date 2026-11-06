import type { Module } from '../types'

export const j07: Module = {
  n: 7,
  title: 'Collections',
  tour: '7 · Collections',
  summary: 'The collections framework: lists, sets, maps, queues and sequenced collections, iterators, choosing the right structure, and views that look at the same data differently.',
  topics: ['The collections framework', 'Lists & iterators', 'Sets', 'Maps', 'Queues, deques & sequenced collections', 'Views & immutability'],
  cpp23: [
    'The book covers sequenced collections from Java 21: `getFirst`, `getLast`, `reversed` on lists and more.',
    'Stream gatherers offer another way to turn collections into windows and batches (Java 24; see module 8).',
    'Compact object headers (default in Java 27) reduce the memory cost of every boxed value and map entry.',
  ],
  lessons: [
    {
      id: 'overview',
      title: 'The framework at a glance',
      blocks: [
        { kind: 'analogy', text: "The collections framework is a kitchen. The interfaces (`List`, `Set`, `Map`) describe what you want: \"somewhere to keep things in order\". The classes (`ArrayList`, `HashSet`, `TreeMap`) are the actual cupboards. You write recipes against what you want, so you can replace the cupboard without changing the recipe." },
        { kind: 'code', code: `// Iterable -> Collection -> SequencedCollection -> List (ArrayList, LinkedList)
//                                                -> Deque (ArrayDeque, LinkedList)
//                                                -> SequencedSet -> SortedSet (TreeSet)
//                        -> Set (HashSet; LinkedHashSet is also a SequencedSet)
//                        -> Queue (PriorityQueue, ArrayDeque)
// Map (HashMap) -> SequencedMap (LinkedHashMap) -> SortedMap (TreeMap)

List<String> xs = new ArrayList<>();          // declare by interface
Collection<String> c = xs;                    // the most general form that still works
c.add("a");
c.contains("a");
c.remove("a");
c.size();
c.isEmpty();
c.addAll(List.of("x", "y"));
c.removeIf(s -> s.startsWith("x"));
String[] arr = c.toArray(String[]::new);` },
        { kind: 'h', text: 'Which one should I use?' },
        { kind: 'list', items: [
          '**Default list:** `ArrayList`. Fast random access, cache-friendly. Appending is amortised constant, and inserting in the middle is linear.',
          '**Default map:** `HashMap`. **Default set:** `HashSet`. Constant time on average, with no order guarantee.',
          '**Keep insertion order:** `LinkedHashMap`, `LinkedHashSet`.',
          '**Keep sorted, or need ranges:** `TreeMap`, `TreeSet`. Logarithmic time.',
          '**Stack or queue:** `ArrayDeque`. Not the old `Stack` class, and rarely `LinkedList`.',
          '**Priority order:** `PriorityQueue`.',
          '**Enum keys:** `EnumMap`, `EnumSet`.',
          '**Shared between threads:** `ConcurrentHashMap` and friends (module 10).',
        ] },
        { kind: 'pitfall', text: 'Despite what its name suggests, `LinkedList` is rarely worth using. It has poor cache behaviour and high memory overhead, and `ArrayDeque` or `ArrayList` beat it in practice for nearly every workload.' },
        { kind: 'check', q: 'You need a map whose keys come back in sorted order. Which do you choose?', options: ['`HashMap`', '`LinkedHashMap`', '`TreeMap`', '`ArrayList`'], answer: 2, hint: 'Which one is built on a sorted tree?', explain: '`TreeMap` keeps keys sorted. `LinkedHashMap` keeps insertion order, and `HashMap` guarantees no order.' },
      ],
    },
    {
      id: 'lists-iterators',
      title: 'Lists & iterators',
      blocks: [
        { kind: 'analogy', text: "An iterator is a bookmark moving through a collection. It's the one object allowed to tear out the page it's on. If someone else tears out a page while you're reading, the bookmark notices that the book has changed under it and refuses to continue, rather than give you the wrong page." },
        { kind: 'code', code: `List<Integer> xs = new ArrayList<>(List.of(5, 3, 8, 1));
xs.add(0, 9);                     // insert at index
xs.get(2);
xs.set(2, 7);
xs.indexOf(8);
xs.sort(Comparator.naturalOrder());
List<Integer> mid = xs.subList(1, 3);   // a live view, not a copy

// for-each works on any Iterable; it uses an iterator underneath
for (int x : xs) System.out.println(x);

// Removing while iterating: do it through the iterator...
Iterator<Integer> it = xs.iterator();
while (it.hasNext()) {
    if (it.next() % 2 == 0) it.remove();
}
// ...or more simply:
xs.removeIf(x -> x % 2 == 0);

// Make your own type work in for-each by implementing Iterable
record Range(int lo, int hi) implements Iterable<Integer> {
    @Override public Iterator<Integer> iterator() {
        return new Iterator<>() {
            int at = lo;
            @Override public boolean hasNext() { return at < hi; }
            @Override public Integer next() { return at++; }
        };
    }
}
for (int i : new Range(0, 3)) System.out.println(i);` },
        { kind: 'pitfall', text: 'Modifying a collection during for-each (other than through its iterator) throws `ConcurrentModificationException`, usually on the next step. The name is misleading: it has nothing to do with threads. A single thread does this all the time.' },
        { kind: 'code', code: `List<String> names = new ArrayList<>(List.of("a", "b", "c"));
for (String n : names) {
    if (n.equals("a")) names.remove(n);    // ConcurrentModificationException
}` },
        { kind: 'list', items: [
          '`Collections` holds helpers: `sort`, `reverse`, `shuffle`, `max`, `min`, `frequency`, `nCopies`.',
          '`Arrays.asList(arr)` returns a fixed-size view over an array. You can `set` but not `add`.',
          '`List.of` refuses nulls, and is unmodifiable. `Arrays.asList` allows nulls.',
        ] },
        { kind: 'check', q: 'What is the safest short way to remove matching items from a list?', options: ['A for-each with `list.remove`', '`list.removeIf(predicate)`', 'Remove them in a `finally`', 'Use `System.gc()`'], answer: 1, hint: 'Which one is designed for this?', explain: '`removeIf` handles the iteration for you and avoids `ConcurrentModificationException`.' },
      ],
    },
    {
      id: 'sets',
      title: 'Sets',
      blocks: [
        { kind: 'analogy', text: "A set is a guest list: each name appears once, and the question that matters is \"is this person on it?\" `HashSet` is a bouncer with a phenomenal memory and no sense of order. `LinkedHashSet` remembers who arrived first. `TreeSet` keeps everyone in alphabetical order, and can point out who comes just after a given name." },
        { kind: 'code', code: `Set<String> seen = new HashSet<>();
boolean isNew = seen.add("XAU");       // true if it wasn't already there
seen.add("XAU");                       // false: no change

var insertion = new LinkedHashSet<>(List.of("c", "a", "b"));   // [c, a, b]

var sorted = new TreeSet<>(List.of(5, 1, 9, 3));
sorted.first();                        // 1
sorted.ceiling(4);                     // 5: smallest >= 4
sorted.floor(4);                       // 3: largest <= 4
sorted.headSet(5);                     // [1, 3]: strictly below
sorted.descendingSet();                // [9, 5, 3, 1]

// Set algebra is done by mutating, so copy first
var a = new HashSet<>(Set.of(1, 2, 3));
var b = Set.of(2, 3, 4);
var union = new HashSet<>(a); union.addAll(b);        // [1, 2, 3, 4]
var inter = new HashSet<>(a); inter.retainAll(b);     // [2, 3]
var diff  = new HashSet<>(a); diff.removeAll(b);      // [1]` },
        { kind: 'list', items: [
          '`HashSet` needs correct `equals` and `hashCode` (module 4). `TreeSet` needs `compareTo` or a `Comparator`.',
          'Membership in a `HashSet` is constant on average, and `contains` on an `ArrayList` is linear. Use a set for lookups.',
          'Iteration order of a `HashSet` is unspecified, and of `Set.of` is deliberately varied between runs. Never depend on either.',
          'A `TreeSet` decides uniqueness with its comparator rather than with `equals`. If two elements compare as 0, the second is dropped.',
        ] },
        { kind: 'check', q: 'Which set gives the smallest element >= x directly?', options: ['`HashSet`', '`LinkedHashSet`', '`TreeSet`, with `ceiling(x)`', '`Set.of`'], answer: 2, hint: 'You need sorted structure.', explain: 'Navigation methods (`ceiling`, `floor`, `higher`, `lower`) exist on sorted sets.' },
      ],
    },
    {
      id: 'maps',
      title: 'Maps',
      blocks: [
        { kind: 'analogy', text: "A map is a coat check: hand over the ticket (key), get back the coat (value). `merge` and `computeIfAbsent` are the attendants who know what to do when a ticket is new, sparing you the \"is it there yet?\" dance." },
        { kind: 'code', code: `Map<String, Integer> qty = new HashMap<>();
qty.put("XAU", 10);
qty.get("XAU");                       // 10
qty.get("nope");                      // null: no exception
qty.getOrDefault("nope", 0);          // 0
qty.containsKey("XAU");
qty.remove("XAU");
qty.putIfAbsent("XAG", 5);

// Counting: the idiomatic one-liner
for (String w : List.of("a", "b", "a")) {
    qty.merge(w, 1, Integer::sum);    // inserts 1, or adds 1 to the old value
}

// Group-building: creates the list only when the key is new
Map<String, List<Integer>> bySym = new TreeMap<>();
bySym.computeIfAbsent("XAU", _ -> new ArrayList<>()).add(10);

// Iterating
for (Map.Entry<String, Integer> e : qty.entrySet()) {
    System.out.println(e.getKey() + " = " + e.getValue());
}
qty.forEach((k, v) -> System.out.println(k + " = " + v));

// Modify all values in place
qty.replaceAll((k, v) -> v * 2);

// Navigation on a TreeMap
var book = new TreeMap<Double, Integer>(Map.of(99.5, 100, 100.0, 50, 100.5, 75));
book.firstKey();                      // 99.5
book.floorKey(100.2);                 // 100.0
book.headMap(100.0);                  // {99.5=100}
book.descendingMap();                 // highest first` },
        { kind: 'list', items: [
          '`get` returning `null` can mean "missing" or "mapped to null". Use `containsKey` to distinguish them, or avoid null values altogether.',
          'A `HashMap` is an array of buckets. Heavily collided buckets turn into trees, so the worst case is logarithmic rather than linear.',
          'Keys must not be changed while they are in the map if the change affects `equals` or `hashCode`. Immutable types such as `String` and records make ideal keys.',
          '`Map.of` and `Map.entry` make small unmodifiable maps. `Map.of` accepts up to 10 pairs, and `Map.ofEntries` accepts any number.',
        ] },
        { kind: 'compare',
          python: `from collections import Counter, defaultdict

counts = Counter(words)
groups = defaultdict(list)
groups["XAU"].append(10)`,
          cpp: `std::unordered_map<std::string, int> counts;
for (const auto& w : words) ++counts[w];

std::map<std::string, std::vector<int>> groups;
groups["XAU"].push_back(10);`,
          go: `counts := map[string]int{}
for _, w := range words { counts[w]++ }

groups := map[string][]int{}
groups["XAU"] = append(groups["XAU"], 10)`,
          ts: `const counts = new Map<string, number>()
for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1)`,
          java: `Map<String, Integer> counts = new HashMap<>();
for (String w : words) counts.merge(w, 1, Integer::sum);

Map<String, List<Integer>> groups = new HashMap<>();
groups.computeIfAbsent("XAU", _ -> new ArrayList<>()).add(10);`,
          note: 'Java has no `[]` for maps and no auto-inserted default like C++ or Go. `merge` and `computeIfAbsent` fill that gap.' },
        { kind: 'check', q: 'What does `map.merge(k, 1, Integer::sum)` do when `k` is absent?', options: ['Throws an exception', 'Stores `1` under `k`', 'Stores `0`', 'Does nothing'], answer: 1, hint: 'What would you want when counting a new word?', explain: 'If absent, the given value is stored. If present, the function combines the old and new values.' },
      ],
    },
    {
      id: 'queues',
      title: 'Queues, deques & sequenced collections',
      blocks: [
        { kind: 'analogy', text: "A `Deque` is a corridor with a door at each end: use one door for stacking and unstacking (a stack), or come in one and leave by the other (a queue). A `PriorityQueue` is a hospital triage desk: arrival order doesn't matter, only who's most urgent." },
        { kind: 'code', code: `Deque<String> stack = new ArrayDeque<>();
stack.push("a");                   // addFirst
stack.push("b");
stack.pop();                       // "b"

Deque<String> queue = new ArrayDeque<>();
queue.offer("a");                  // addLast
queue.offer("b");
queue.poll();                      // "a"; null when empty (remove() would throw)
queue.peek();                      // "b", without removing

// Smallest first by default; pass a Comparator for anything else
var byPx = new PriorityQueue<Trade>(Comparator.comparingDouble(Trade::px));
byPx.add(new Trade("XAU", 2390.5, 10));
byPx.add(new Trade("EUR", 1.08, 500));
byPx.poll();                       // the EUR trade

// Sequenced collections (Java 21): one consistent API for both ends
List<Integer> xs = new ArrayList<>(List.of(1, 2, 3));
xs.getFirst();                     // 1
xs.getLast();                      // 3
xs.addFirst(0);
xs.removeLast();
List<Integer> back = xs.reversed();   // a live reversed view

var lhm = new LinkedHashMap<String, Integer>();
lhm.put("a", 1);
lhm.put("b", 2);
lhm.firstEntry();                  // a=1
lhm.pollLastEntry();               // removes and returns b=2` },
        { kind: 'list', items: [
          'Each queue operation comes in two forms: `add`, `remove`, `element` throw when they fail, and `offer`, `poll`, `peek` return a special value.',
          'A `PriorityQueue` is a binary heap: `add` and `poll` are logarithmic, `peek` is constant. Its iteration order is **not** sorted.',
          '`ArrayDeque` doesn\'t accept `null`, since `null` is how `poll` signals "empty".',
          'A `LinkedHashMap` with access order, plus an overridden `removeEldestEntry`, gives you a simple LRU cache.',
        ] },
        { kind: 'pitfall', text: 'The old `Stack` and `Vector` classes synchronise every method, and `Stack` exposes list operations that break the stack discipline. Use `ArrayDeque`.' },
        { kind: 'check', q: 'A `PriorityQueue<Integer>` holds 5, 1, 3. What does `poll()` return?', options: ['`5`, the first added', '`1`, the smallest', '`3`', '`null`'], answer: 1, hint: 'What is the default ordering?', explain: 'By default it is a min-heap using natural ordering. Pass `Comparator.reverseOrder()` for the largest first.' },
      ],
    },
    {
      id: 'views',
      title: 'Views & immutability',
      blocks: [
        { kind: 'analogy', text: "A view is a window, not a photograph. Looking through `subList` or `reversed` shows the same room with a different frame: if someone moves the furniture, you see it. `List.copyOf` is the photograph: it won't ever change, and neither will it reflect later changes." },
        { kind: 'code', code: `List<Integer> base = new ArrayList<>(List.of(1, 2, 3, 4));

List<Integer> head = base.subList(0, 2);           // a view
head.set(0, 99);
System.out.println(base);                          // [99, 2, 3, 4]
head.clear();                                      // removes the range from base

Map<String, Integer> m = new HashMap<>(Map.of("a", 1));
Set<String> keys = m.keySet();                     // a view: removing here removes there
Collection<Integer> vals = m.values();             // also a view

// Unmodifiable: a read-only VIEW of something still changeable
List<Integer> ro = Collections.unmodifiableList(base);
// ro.add(1);                                      // UnsupportedOperationException
base.add(7);                                       // ro shows this!

// Immutable copy: truly independent
List<Integer> snap = List.copyOf(base);
base.add(8);                                       // snap is unaffected

// The constructor of a well-behaved class
record Basket(List<String> items) {
    Basket { items = List.copyOf(items); }         // no one else holds a reference
}` },
        { kind: 'list', items: [
          '`List.of`, `Set.of`, `Map.of`: unmodifiable, null-rejecting, and space-efficient.',
          '`List.copyOf`: makes an unmodifiable copy, or returns the argument unchanged if it\'s already one.',
          '`Collections.unmodifiableList`: a read-only wrapper. Anyone who still has the original can change it.',
          'A method that returns a list of internal data should return a copy or an unmodifiable view.',
          '`Collections.synchronizedList` is a thread-safe wrapper, but prefer the purpose-built types in `java.util.concurrent`.',
        ] },
        { kind: 'pitfall', text: '`stream.toList()`, `List.of` and `List.copyOf` all throw `UnsupportedOperationException` on mutation, but this appears at runtime since they all have the static type `List`. A `List` return type doesn\'t tell you whether it\'s modifiable, so document it.' },
        { kind: 'check', q: 'After `var ro = Collections.unmodifiableList(base); base.add(1);`, does `ro` include the new element?', options: ['Yes, it is a view of `base`', 'No, it is a copy', 'The `add` throws', '`ro` becomes invalid'], answer: 0, hint: 'View or photograph?', explain: 'Unmodifiable views can\'t be changed through themselves, but they do reflect the underlying list. `List.copyOf` makes a true snapshot.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is the default choice for a list?', options: ['`LinkedList`', '`ArrayList`', '`Vector`', '`Stack`'], answer: 1, explain: 'It has fast indexing and good cache locality. `LinkedList` rarely wins in practice.' },
    { q: 'What do `HashSet` lookups depend on?', options: ['`toString`', '`hashCode` and `equals`', '`compareTo`', '`ordinal`'], answer: 1, explain: 'The hash picks the bucket, and `equals` confirms the match.' },
    { q: 'What does `map.get(missingKey)` return for a `HashMap`?', options: ['Throws an exception', '`null`', 'The default value of the type', 'An empty `Optional`'], answer: 1, explain: 'Use `getOrDefault` or `containsKey` if you need to distinguish.' },
    { q: 'What causes `ConcurrentModificationException` in single-threaded code?', options: ['Using `get`', 'Calling `list.remove` inside a for-each over the same list', 'Sorting a list', 'Using `TreeMap`'], answer: 1, explain: 'Remove through the iterator, or use `removeIf`.' },
    { q: 'What should you use for a stack?', options: ['`Stack`', '`ArrayDeque`', '`Vector`', '`TreeSet`'], answer: 1, explain: '`Stack` is a legacy class that synchronises each call. `ArrayDeque` is faster and cleaner.' },
    { q: 'In `List.of(1, 2).add(3)`, what happens?', options: ['Returns a new list', 'Throws `UnsupportedOperationException`', 'Adds in place', 'Fails to compile'], answer: 1, explain: 'It compiles, since it\'s a `List`, but mutation is refused at runtime.' },
    { q: 'Is `subList` a copy?', options: ['Yes', 'No: it is a live view of the original', 'Only for `ArrayList`', 'Only if the list is sorted'], answer: 1, explain: 'Changes go through to the original list. Wrap in `new ArrayList<>(...)` for a copy.' },
    { q: 'What was added by sequenced collections in Java 21?', options: ['Thread safety', 'A uniform API for first and last elements and reversed views', 'Primitive specialisations', 'Persistence'], answer: 1, explain: '`getFirst`, `getLast`, `addFirst`, `removeLast`, `reversed` and map equivalents.' },
  ],
}
