import type { Module } from '../types'

export const f06: Module = {
  n: 6,
  title: 'Collections: Lists & Maps',
  tour: 'Data',
  summary: 'Holding many values at once: ordered lists (arrays), positions counted from zero, adding and removing items, key-value maps (dictionaries) for looking things up by name, and choosing the right collection.',
  topics: ['Lists', 'Indexes from zero', 'Adding, removing & searching', 'Maps / dictionaries', 'Choosing a collection'],
  cpp23: ['Names differ but ideas match: list / array / slice / ArrayList / vector, and dict / Map / map / HashMap / unordered_map.'],
  lessons: [
    {
      id: 'lists',
      title: 'Lists',
      blocks: [
        { kind: 'analogy', text: "A list is a row of numbered lockers, each holding one value, kept in order. Instead of `price1`, `price2`, `price3`… you have one variable, `prices`, and you can loop over it, count it, sort it, or grab locker number 2." },
        { kind: 'poly',
          pseudo: `set fruits to ["apple", "banana", "cherry"]
display fruits
display length of fruits      # 3`,
          python: `fruits = ["apple", "banana", "cherry"]
print(fruits)          # ['apple', 'banana', 'cherry']
print(len(fruits))     # 3`,
          ts: `const fruits = ["apple", "banana", "cherry"];
console.log(fruits);          // [ 'apple', 'banana', 'cherry' ]
console.log(fruits.length);   // 3`,
          go: `fruits := []string{"apple", "banana", "cherry"}   // a slice
fmt.Println(fruits)          // [apple banana cherry]
fmt.Println(len(fruits))     // 3`,
          java: `List<String> fruits = new ArrayList<>(List.of("apple", "banana", "cherry"));
System.out.println(fruits);          // [apple, banana, cherry]
System.out.println(fruits.size());   // 3`,
          cpp: `std::vector<std::string> fruits = {"apple", "banana", "cherry"};
for (const auto& f : fruits) std::cout << f << ' ';   // apple banana cherry
std::cout << '\\n' << fruits.size() << '\\n';           // 3`,
          caption: 'A list that can grow is called a list (Python), array (TypeScript), slice (Go), ArrayList (Java) or vector (C++).' },
        { kind: 'check', q: 'Why use a list instead of separate variables price1, price2, price3…?', options: ['Lists are faster to type', 'You can loop over, count, sort and grow them, however many items there are', 'Variables can\'t hold numbers', 'No reason'], answer: 1, hint: 'What if there were 10,000 prices?', explain: 'One name, any number of items.' },
      ],
    },
    {
      id: 'index',
      title: 'Indexes from zero',
      blocks: [
        { kind: 'analogy', text: "Each locker has a number, its index, and almost every language starts counting at **0**: the index is \"how many steps from the start\", and the first locker is zero steps away. So in a list of 3 items, the indexes are 0, 1 and 2, and asking for locker 3 is asking for something that doesn't exist." },
        { kind: 'poly',
          pseudo: `set fruits to ["apple", "banana", "cherry"]
display item 0 of fruits          # apple
display item 2 of fruits          # cherry
set item 1 of fruits to "blueberry"
display fruits                    # apple, blueberry, cherry`,
          python: `fruits = ["apple", "banana", "cherry"]
print(fruits[0])        # apple
print(fruits[2])        # cherry
print(fruits[-1])       # cherry: Python counts from the end with negatives
fruits[1] = "blueberry"
print(fruits)           # ['apple', 'blueberry', 'cherry']
# print(fruits[3])      # IndexError: list index out of range`,
          ts: `const fruits = ["apple", "banana", "cherry"];
console.log(fruits[0]);          // apple
console.log(fruits[2]);          // cherry
fruits[1] = "blueberry";
console.log(fruits);             // [ 'apple', 'blueberry', 'cherry' ]
console.log(fruits[3]);          // undefined: no error, just nothing`,
          go: `fruits := []string{"apple", "banana", "cherry"}
fmt.Println(fruits[0])     // apple
fmt.Println(fruits[2])     // cherry
fruits[1] = "blueberry"
fmt.Println(fruits)        // [apple blueberry cherry]
// fruits[3]               // panic: index out of range`,
          java: `List<String> fruits = new ArrayList<>(List.of("apple", "banana", "cherry"));
System.out.println(fruits.get(0));   // apple
System.out.println(fruits.get(2));   // cherry
fruits.set(1, "blueberry");
System.out.println(fruits);          // [apple, blueberry, cherry]`,
          cpp: `std::vector<std::string> fruits = {"apple", "banana", "cherry"};
std::cout << fruits[0] << '\\n';     // apple
std::cout << fruits[2] << '\\n';     // cherry
fruits[1] = "blueberry";
std::cout << fruits.at(1) << '\\n';  // blueberry (.at checks the index; [] does not)`,
          caption: 'Reading past the end is an error in Python, Go and Java, gives `undefined` in TypeScript, and is undefined behaviour in C++ unless you use `.at()`.' },
        { kind: 'check', q: 'In a list of 5 items, what is the index of the last item?', options: ['5', '4', '0', '6'], answer: 1, hint: 'Indexes start at 0.', explain: '0, 1, 2, 3, 4. The classic off-by-one error is asking for index 5.' },
      ],
    },
    {
      id: 'modify',
      title: 'Adding, removing & searching',
      blocks: [
        { kind: 'analogy', text: "Lists grow and shrink: add to the end of the queue, remove someone who's left, check whether a name is on the guest list, or sort everyone alphabetically. Each language has its own names for these operations, but every language has them." },
        { kind: 'poly',
          pseudo: `set queue to ["Ann", "Bo"]
add "Cy" to the end of queue      # Ann, Bo, Cy
remove "Ann" from queue           # Bo, Cy
display "Bo" is in queue          # true
sort queue`,
          python: `queue = ["Ann", "Bo"]
queue.append("Cy")       # ['Ann', 'Bo', 'Cy']
queue.remove("Ann")      # ['Bo', 'Cy']
print("Bo" in queue)     # True
queue.sort()
print(queue)             # ['Bo', 'Cy']
print(sorted([3, 1, 2])) # [1, 2, 3]: a new, sorted list`,
          ts: `const queue = ["Ann", "Bo"];
queue.push("Cy");                          // [ 'Ann', 'Bo', 'Cy' ]
queue.splice(queue.indexOf("Ann"), 1);     // remove "Ann"
console.log(queue.includes("Bo"));         // true
queue.sort();
console.log(queue);                        // [ 'Bo', 'Cy' ]`,
          go: `queue := []string{"Ann", "Bo"}
queue = append(queue, "Cy")                     // [Ann Bo Cy]
queue = slices.DeleteFunc(queue, func(s string) bool { return s == "Ann" })
fmt.Println(slices.Contains(queue, "Bo"))       // true
slices.Sort(queue)
fmt.Println(queue)                              // [Bo Cy]`,
          java: `List<String> queue = new ArrayList<>(List.of("Ann", "Bo"));
queue.add("Cy");                          // [Ann, Bo, Cy]
queue.remove("Ann");                      // [Bo, Cy]
System.out.println(queue.contains("Bo")); // true
Collections.sort(queue);
System.out.println(queue);                // [Bo, Cy]`,
          cpp: `std::vector<std::string> queue = {"Ann", "Bo"};
queue.push_back("Cy");                                     // Ann Bo Cy
std::erase(queue, "Ann");                                  // Bo Cy (C++20)
bool found = std::ranges::find(queue, "Bo") != queue.end();
std::cout << std::boolalpha << found << '\\n';              // true
std::ranges::sort(queue);
for (const auto& name : queue) std::cout << name << ' ';   // Bo Cy` },
        { kind: 'check', q: 'Which Python method adds an item to the end of a list?', options: ['add', 'push', 'append', 'insert_end'], answer: 2, hint: 'TypeScript calls it push.', explain: 'Go uses append too; Java add; C++ push_back.' },
      ],
    },
    {
      id: 'maps',
      title: 'Maps / dictionaries',
      blocks: [
        { kind: 'analogy', text: "A list finds things by position; a map (dictionary) finds things by **name**. It's a real dictionary: look up the word (the key) and get its definition (the value), without reading every page. Phone books, stock prices by ticker, settings by name: anything where you'd say \"what's the value for this?\"" },
        { kind: 'poly',
          pseudo: `set prices to map of
    "XAU" → 2385
    "XAG" → 28
display prices["XAU"]         # 2385
set prices["XPT"] to 981      # add a new entry
for each key, value in prices
    display key + ": " + value
end for`,
          python: `prices = {"XAU": 2385, "XAG": 28}
print(prices["XAU"])            # 2385
prices["XPT"] = 981             # add or update
print("XPD" in prices)          # False
print(prices.get("XPD", 0))     # 0: default instead of an error
for symbol, price in prices.items():
    print(symbol + ":", price)`,
          ts: `const prices = new Map<string, number>([["XAU", 2385], ["XAG", 28]]);
console.log(prices.get("XAU"));     // 2385
prices.set("XPT", 981);
console.log(prices.has("XPD"));     // false
for (const [symbol, price] of prices) {
    console.log(symbol + ":", price);
}`,
          go: `prices := map[string]int{"XAU": 2385, "XAG": 28}
fmt.Println(prices["XAU"])      // 2385
prices["XPT"] = 981
_, ok := prices["XPD"]
fmt.Println(ok)                 // false
for symbol, price := range prices {     // map order is random in Go!
    fmt.Println(symbol+":", price)
}`,
          java: `Map<String, Integer> prices = new HashMap<>(Map.of("XAU", 2385, "XAG", 28));
System.out.println(prices.get("XAU"));            // 2385
prices.put("XPT", 981);
System.out.println(prices.containsKey("XPD"));    // false
for (var e : prices.entrySet()) {
    System.out.println(e.getKey() + ": " + e.getValue());
}`,
          cpp: `std::map<std::string, int> prices = {{"XAU", 2385}, {"XAG", 28}};
std::cout << prices["XAU"] << '\\n';            // 2385
prices["XPT"] = 981;
std::cout << prices.contains("XPD") << '\\n';   // 0 (false)
for (const auto& [symbol, price] : prices) {
    std::cout << symbol << ": " << price << '\\n';   // std::map keeps keys sorted
}` },
        { kind: 'pitfall', text: 'Keys are unique: setting `prices["XAU"]` again replaces the old value rather than adding a second one. And don\'t rely on the order items come out of a map: Go deliberately shuffles it, Java\'s HashMap has no guaranteed order. Python and TypeScript keep insertion order; C++\'s `std::map` sorts by key.' },
        { kind: 'check', q: 'You need to look up a customer\'s balance by their email address. Best collection?', options: ['A list of balances', 'A map from email to balance', 'A string', 'A boolean'], answer: 1, hint: 'Look up by name, not position.', explain: 'Maps find by key without scanning every item.' },
      ],
    },
    {
      id: 'choose',
      title: 'Choosing a collection',
      blocks: [
        { kind: 'analogy', text: "Use a list when order matters or you'll go through everything (a queue, a playlist, daily prices). Use a map when you'll look things up by a name or ID (stock by ticker, user by email). Collections can also be nested: a map from ticker to a list of prices, or a list of maps describing trades." },
        { kind: 'poly',
          pseudo: `set history to map of
    "XAU" → [2380, 2385, 2391]
    "XAG" → [28.1, 28.4]
display last item of history["XAU"]       # 2391`,
          python: `history = {
    "XAU": [2380, 2385, 2391],
    "XAG": [28.1, 28.4],
}
print(history["XAU"][-1])     # 2391
history["XAU"].append(2394)
print(len(history["XAU"]))    # 4`,
          ts: `const history: Record<string, number[]> = {
    XAU: [2380, 2385, 2391],
    XAG: [28.1, 28.4],
};
console.log(history["XAU"].at(-1));   // 2391
history["XAU"].push(2394);
console.log(history["XAU"].length);   // 4`,
          go: `history := map[string][]float64{
    "XAU": {2380, 2385, 2391},
    "XAG": {28.1, 28.4},
}
xau := history["XAU"]
fmt.Println(xau[len(xau)-1])            // 2391
history["XAU"] = append(history["XAU"], 2394)
fmt.Println(len(history["XAU"]))        // 4`,
          java: `Map<String, List<Double>> history = new HashMap<>();
history.put("XAU", new ArrayList<>(List.of(2380.0, 2385.0, 2391.0)));
history.put("XAG", new ArrayList<>(List.of(28.1, 28.4)));
List<Double> xau = history.get("XAU");
System.out.println(xau.get(xau.size() - 1));   // 2391.0
xau.add(2394.0);
System.out.println(xau.size());                // 4`,
          cpp: `std::map<std::string, std::vector<double>> history = {
    {"XAU", {2380, 2385, 2391}},
    {"XAG", {28.1, 28.4}},
};
std::cout << history["XAU"].back() << '\\n';   // 2391
history["XAU"].push_back(2394);
std::cout << history["XAU"].size() << '\\n';   // 4` },
        { kind: 'check', q: 'A playlist where song order matters and you play them one after another. Best fit?', options: ['Map', 'List', 'Boolean', 'Constant'], answer: 1, hint: 'Order and going through everything.', explain: 'Maps are for lookup by key.' },
      ],
    },
  ],
  quiz: [
    { q: 'The first item of a list is at index…', options: ['1', '0', '-1', 'It depends on the item'], answer: 1, explain: 'Zero steps from the start.' },
    { q: 'A list has 10 items. Valid indexes are…', options: ['1 to 10', '0 to 9', '0 to 10', '1 to 9'], answer: 1, explain: 'Index 10 is off the end.' },
    { q: 'In Python, `fruits[-1]` gives…', options: ['An error', 'The last item', 'The first item', 'Nothing'], answer: 1, explain: 'Negative indexes count from the end.' },
    { q: 'How do you get the number of items in a Python list?', options: ['size(xs)', 'xs.length', 'len(xs)', 'count(xs)'], answer: 2, explain: 'TypeScript: .length; Java: .size().' },
    { q: 'A map stores…', options: ['Only numbers', 'Key → value pairs', 'Sorted lists', 'Booleans'], answer: 1, explain: 'Look up values by key.' },
    { q: 'Setting a key that already exists in a map…', options: ['Adds a duplicate', 'Replaces the old value', 'Raises an error always', 'Is ignored'], answer: 1, explain: 'Keys are unique.' },
    { q: 'Which collection keeps a guaranteed order in every language here?', options: ['Maps', 'Lists', 'Neither', 'Both'], answer: 1, explain: 'Map ordering varies by language.' },
    { q: 'Looking up a user by email in a huge collection is fastest with…', options: ['A list scanned item by item', 'A map keyed by email', 'A string', 'A loop counter'], answer: 1, explain: 'No need to check every item.' },
  ],
}
