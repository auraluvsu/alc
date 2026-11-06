import type { Module } from '../types'

export const f10: Module = {
  n: 10,
  title: 'Thinking Like a Programmer',
  tour: 'Skills',
  summary: 'The part that isn\'t syntax: turning a vague problem into precise steps, planning in pseudocode before coding, two classic search algorithms, how sorting works, and an intuition for why some solutions are fast and others painfully slow.',
  topics: ['From problem to steps', 'Linear search', 'Binary search', 'Sorting', 'Fast vs slow'],
  cpp23: ['Every language ships a built-in sort; you write one here once to understand it, then use the library version forever.'],
  lessons: [
    {
      id: 'steps',
      title: 'From problem to steps',
      blocks: [
        { kind: 'analogy', text: "Computers are fast but have no common sense. \"Find the best-performing stock\" means nothing until you pin it down: best by what measure? Over what period? What if two tie? Programming is mostly this: asking questions until the problem is precise, then writing steps so plain that a very literal-minded assistant could follow them." },
        { kind: 'list', items: [
          '**Restate the problem** in your own words, with a concrete example: "given [3, 9, 4], the answer is 9".',
          '**Ask about edge cases**: empty input, one item, ties, negative numbers.',
          '**Solve it by hand** on the example and notice what you actually did.',
          '**Write those steps as pseudocode**, then check them against the example and the edge cases.',
          '**Only then translate** to a real language. The hard thinking is already done.',
        ] },
        { kind: 'poly',
          pseudo: `# Problem: find the largest number in a list
# By hand on [3, 9, 4]: "remember the biggest so far, compare each new one"
function largest(numbers)
    if numbers is empty then return nothing
    set best to the first number
    for each n in numbers
        if n > best then set best to n
    end for
    return best
end function

display largest([3, 9, 4])     # 9`,
          python: `def largest(numbers):
    if not numbers:
        return None
    best = numbers[0]
    for n in numbers:
        if n > best:
            best = n
    return best

print(largest([3, 9, 4]))   # 9
print(largest([]))          # None
# Built in: max([3, 9, 4])`,
          ts: `function largest(numbers: number[]): number | undefined {
    if (numbers.length === 0) return undefined;
    let best = numbers[0];
    for (const n of numbers) if (n > best) best = n;
    return best;
}

console.log(largest([3, 9, 4]));   // 9
console.log(largest([]));          // undefined
// Built in: Math.max(...numbers)`,
          go: `package main

import "fmt"

func largest(numbers []int) (int, bool) {
    if len(numbers) == 0 {
        return 0, false          // false = "there was no answer"
    }
    best := numbers[0]
    for _, n := range numbers {
        if n > best {
            best = n
        }
    }
    return best, true
}

func main() {
    fmt.Println(largest([]int{3, 9, 4}))   // 9 true
    fmt.Println(largest([]int{}))          // 0 false
}`,
          java: `public class Main {
    static Integer largest(int[] numbers) {
        if (numbers.length == 0) return null;
        int best = numbers[0];
        for (int n : numbers) if (n > best) best = n;
        return best;
    }

    public static void main(String[] args) {
        System.out.println(largest(new int[]{3, 9, 4}));   // 9
        System.out.println(largest(new int[]{}));          // null
    }
}`,
          cpp: `#include <iostream>
#include <optional>
#include <vector>

std::optional<int> largest(const std::vector<int>& numbers) {
    if (numbers.empty()) return std::nullopt;
    int best = numbers[0];
    for (int n : numbers) if (n > best) best = n;
    return best;
}

int main() {
    std::cout << largest({3, 9, 4}).value() << '\\n';                 // 9
    std::cout << largest({}).has_value() << '\\n';                     // 0 (false)
}`,
          caption: 'Each language has its own way to say "no answer": None, undefined, a second false value, null, std::optional.' },
        { kind: 'check', q: 'What should you do before writing real code?', options: ['Pick the fastest language', 'Make the problem precise, solve an example by hand, and write the steps in pseudocode', 'Copy code from the internet', 'Write tests only'], answer: 1, hint: 'This course\'s default code view.', explain: 'The thinking comes first; syntax is translation.' },
      ],
    },
    {
      id: 'linear',
      title: 'Linear search',
      blocks: [
        { kind: 'analogy', text: "Looking for your keys by checking every pocket, one after another, until you find them. That's linear search: simple, works on any list, and in the worst case you check everything. For 10 items it's instant; for 10 million it starts to hurt." },
        { kind: 'poly',
          pseudo: `function find(items, target)
    for i from 0 to length of items - 1
        if items[i] = target then return i
    end for
    return -1                    # "not found"
end function

display find(["XAU", "XAG", "XPT"], "XPT")    # 2
display find(["XAU", "XAG", "XPT"], "BTC")    # -1`,
          python: `def find(items, target):
    for i in range(len(items)):
        if items[i] == target:
            return i
    return -1

print(find(["XAU", "XAG", "XPT"], "XPT"))   # 2
print(find(["XAU", "XAG", "XPT"], "BTC"))   # -1
# Built in: "XPT" in items, items.index("XPT")`,
          ts: `function find(items: string[], target: string): number {
    for (let i = 0; i < items.length; i++) {
        if (items[i] === target) return i;
    }
    return -1;
}

console.log(find(["XAU", "XAG", "XPT"], "XPT"));   // 2
console.log(find(["XAU", "XAG", "XPT"], "BTC"));   // -1
// Built in: items.indexOf("XPT")`,
          go: `package main

import "fmt"

func find(items []string, target string) int {
    for i := 0; i < len(items); i++ {
        if items[i] == target {
            return i
        }
    }
    return -1
}

func main() {
    fmt.Println(find([]string{"XAU", "XAG", "XPT"}, "XPT"))   // 2
    fmt.Println(find([]string{"XAU", "XAG", "XPT"}, "BTC"))   // -1
}`,
          java: `public class Main {
    static int find(String[] items, String target) {
        for (int i = 0; i < items.length; i++) {
            if (items[i].equals(target)) return i;   // .equals for text, not ==
        }
        return -1;
    }

    public static void main(String[] args) {
        String[] items = {"XAU", "XAG", "XPT"};
        System.out.println(find(items, "XPT"));   // 2
        System.out.println(find(items, "BTC"));   // -1
    }
}`,
          cpp: `#include <iostream>
#include <string>
#include <vector>

int find(const std::vector<std::string>& items, const std::string& target) {
    for (int i = 0; i < (int)items.size(); i++) {
        if (items[i] == target) return i;
    }
    return -1;
}

int main() {
    std::vector<std::string> items = {"XAU", "XAG", "XPT"};
    std::cout << find(items, "XPT") << '\\n';   // 2
    std::cout << find(items, "BTC") << '\\n';   // -1
}` },
        { kind: 'pitfall', text: 'In Java, compare text with `.equals()`, not `==`. `==` asks "is this the very same object in memory?", which is sometimes true by luck and sometimes not, a classic beginner trap.' },
        { kind: 'check', q: 'Searching a list of 1,000 unsorted names for one that isn\'t there takes how many comparisons with linear search?', options: ['1', '10', '500', '1,000'], answer: 3, hint: 'You can only say "not here" after checking every pocket.', explain: 'Worst case: every item.' },
      ],
    },
    {
      id: 'binary',
      title: 'Binary search',
      blocks: [
        { kind: 'analogy', text: "Guess a number between 1 and 100, and I'll say higher or lower. Smart players always guess the middle: 50, then 75, then 62… each guess throws away half of what's left, so you never need more than 7 guesses. Binary search does exactly that on a **sorted** list. Half of 1,000,000 twenty times is 1, so a million items take about 20 checks instead of a million." },
        { kind: 'stepper', title: 'Step through: binary search for 23', code: [
          'set items to [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]',
          'set low to 0, high to 9',
          'while low <= high',
          '    set mid to (low + high) / 2, rounded down',
          '    if items[mid] = target then return mid',
          '    if items[mid] < target then set low to mid + 1',
          '    else set high to mid - 1',
          'end while',
        ], steps: [
          { line: 2, note: 'Search the whole sorted list: positions 0 to 9.', memory: [{ name: 'low', value: '0' }, { name: 'high', value: '9' }] },
          { line: 4, note: 'Middle is position 4, holding 16.', memory: [{ name: 'mid', value: '4' }, { name: 'items[mid]', value: '16' }] },
          { line: 6, note: '16 < 23, so the target must be to the right. Throw away the left half.', memory: [{ name: 'low', value: '5' }, { name: 'high', value: '9' }] },
          { line: 4, note: 'Middle of 5..9 is 7, holding 56.', memory: [{ name: 'mid', value: '7' }, { name: 'items[mid]', value: '56' }] },
          { line: 7, note: '56 > 23, so it\'s to the left. Throw away the right half.', memory: [{ name: 'low', value: '5' }, { name: 'high', value: '6' }] },
          { line: 4, note: 'Middle of 5..6 is 5, holding 23.', memory: [{ name: 'mid', value: '5' }, { name: 'items[mid]', value: '23' }] },
          { line: 5, note: 'Found at position 5 after 3 checks. Linear search would have needed 6.', memory: [{ name: 'result', value: '5' }] },
        ] },
        { kind: 'poly',
          pseudo: `function binary_search(items, target)
    set low to 0
    set high to length of items - 1
    while low <= high
        set mid to (low + high) / 2, rounded down
        if items[mid] = target then return mid
        else if items[mid] < target then set low to mid + 1
        else set high to mid - 1
    end while
    return -1
end function`,
          python: `def binary_search(items, target):
    low, high = 0, len(items) - 1
    while low <= high:
        mid = (low + high) // 2          # // divides and rounds down
        if items[mid] == target:
            return mid
        elif items[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

items = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
print(binary_search(items, 23), binary_search(items, 7))   # 5 -1`,
          ts: `function binarySearch(items: number[], target: number): number {
    let low = 0, high = items.length - 1;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (items[mid] === target) return mid;
        if (items[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

const items = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
console.log(binarySearch(items, 23), binarySearch(items, 7));   // 5 -1`,
          go: `package main

import "fmt"

func binarySearch(items []int, target int) int {
    low, high := 0, len(items)-1
    for low <= high {
        mid := (low + high) / 2           // int division rounds down
        if items[mid] == target {
            return mid
        } else if items[mid] < target {
            low = mid + 1
        } else {
            high = mid - 1
        }
    }
    return -1
}

func main() {
    items := []int{2, 5, 8, 12, 16, 23, 38, 56, 72, 91}
    fmt.Println(binarySearch(items, 23), binarySearch(items, 7))   // 5 -1
}`,
          java: `public class Main {
    static int binarySearch(int[] items, int target) {
        int low = 0, high = items.length - 1;
        while (low <= high) {
            int mid = (low + high) / 2;
            if (items[mid] == target) return mid;
            if (items[mid] < target) low = mid + 1;
            else high = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] items = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
        System.out.println(binarySearch(items, 23) + " " + binarySearch(items, 7));   // 5 -1
    }
}`,
          cpp: `#include <iostream>
#include <vector>

int binarySearch(const std::vector<int>& items, int target) {
    int low = 0, high = (int)items.size() - 1;
    while (low <= high) {
        int mid = (low + high) / 2;
        if (items[mid] == target) return mid;
        if (items[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

int main() {
    std::vector<int> items = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    std::cout << binarySearch(items, 23) << ' ' << binarySearch(items, 7) << '\\n';   // 5 -1
}` },
        { kind: 'check', q: 'What does binary search require?', options: ['A short list', 'A sorted list', 'Only numbers', 'A loop counter from 1'], answer: 1, hint: '"Higher or lower" only helps if the order means something.', explain: 'On an unsorted list, throwing away half could throw away the target.' },
      ],
    },
    {
      id: 'sorting',
      title: 'Sorting',
      blocks: [
        { kind: 'analogy', text: "Sorting a hand of playing cards: most people pick up cards one at a time and slide each into its right place among the ones already held. That's **insertion sort**, a real algorithm. It's easy to understand and fine for small lists; the built-in sorts in every language use cleverer methods that stay fast on millions of items." },
        { kind: 'poly',
          pseudo: `function insertion_sort(items)
    for i from 1 to length of items - 1
        set card to items[i]
        set j to i - 1
        # shift bigger cards one place right to make a gap
        while j >= 0 and items[j] > card
            set items[j + 1] to items[j]
            subtract 1 from j
        end while
        set items[j + 1] to card
    end for
end function`,
          python: `def insertion_sort(items):
    for i in range(1, len(items)):
        card = items[i]
        j = i - 1
        while j >= 0 and items[j] > card:
            items[j + 1] = items[j]
            j -= 1
        items[j + 1] = card

prices = [38, 5, 91, 12, 23]
insertion_sort(prices)
print(prices)                          # [5, 12, 23, 38, 91]
print(sorted([3, 1, 2], reverse=True)) # built in: [3, 2, 1]`,
          ts: `function insertionSort(items: number[]): void {
    for (let i = 1; i < items.length; i++) {
        const card = items[i];
        let j = i - 1;
        while (j >= 0 && items[j] > card) {
            items[j + 1] = items[j];
            j--;
        }
        items[j + 1] = card;
    }
}

const prices = [38, 5, 91, 12, 23];
insertionSort(prices);
console.log(prices);                          // [ 5, 12, 23, 38, 91 ]
console.log([10, 9, 1].sort((a, b) => a - b)); // built in: [ 1, 9, 10 ]`,
          go: `package main

import (
    "fmt"
    "slices"
)

func insertionSort(items []int) {
    for i := 1; i < len(items); i++ {
        card := items[i]
        j := i - 1
        for j >= 0 && items[j] > card {
            items[j+1] = items[j]
            j--
        }
        items[j+1] = card
    }
}

func main() {
    prices := []int{38, 5, 91, 12, 23}
    insertionSort(prices)
    fmt.Println(prices)        // [5 12 23 38 91]
    other := []int{10, 9, 1}
    slices.Sort(other)         // built in
    fmt.Println(other)         // [1 9 10]
}`,
          java: `import java.util.Arrays;

public class Main {
    static void insertionSort(int[] items) {
        for (int i = 1; i < items.length; i++) {
            int card = items[i];
            int j = i - 1;
            while (j >= 0 && items[j] > card) {
                items[j + 1] = items[j];
                j--;
            }
            items[j + 1] = card;
        }
    }

    public static void main(String[] args) {
        int[] prices = {38, 5, 91, 12, 23};
        insertionSort(prices);
        System.out.println(Arrays.toString(prices));   // [5, 12, 23, 38, 91]
        int[] other = {10, 9, 1};
        Arrays.sort(other);                            // built in
        System.out.println(Arrays.toString(other));    // [1, 9, 10]
    }
}`,
          cpp: `#include <algorithm>
#include <iostream>
#include <vector>

void insertionSort(std::vector<int>& items) {
    for (int i = 1; i < (int)items.size(); i++) {
        int card = items[i];
        int j = i - 1;
        while (j >= 0 && items[j] > card) {
            items[j + 1] = items[j];
            j--;
        }
        items[j + 1] = card;
    }
}

int main() {
    std::vector<int> prices = {38, 5, 91, 12, 23};
    insertionSort(prices);
    for (int p : prices) std::cout << p << ' ';   // 5 12 23 38 91
    std::cout << '\\n';
    std::vector<int> other = {10, 9, 1};
    std::ranges::sort(other);                     // built in
    for (int p : other) std::cout << p << ' ';    // 1 9 10
    std::cout << '\\n';
}`,
          caption: 'In real code, always use the built-in sort: it\'s faster and already tested.' },
        { kind: 'pitfall', text: 'JavaScript/TypeScript\'s `.sort()` with no argument sorts as **text**: `[10, 9, 1].sort()` gives `[1, 10, 9]` because "10" comes before "9" alphabetically. Always pass `(a, b) => a - b` for numbers.' },
        { kind: 'check', q: 'Why learn to write a sort if every language has one built in?', options: ['Built-ins are wrong', 'To understand how algorithms work and why some are faster', 'Interviews only', 'You must use your own in real projects'], answer: 1, hint: 'Understand once, use the library forever.', explain: 'Writing one builds intuition about cost.' },
      ],
    },
    {
      id: 'speed',
      title: 'Fast vs slow',
      blocks: [
        { kind: 'analogy', text: "The question isn't \"how many seconds does it take?\" (that depends on the computer), it's \"what happens to the work when the data gets 10 times bigger?\". Programmers describe this with **Big-O**: O(n) means work grows in step with the data; O(n²) means 10× the data is 100× the work; O(log n) means 10× the data adds only a few steps." },
        { kind: 'list', items: [
          '**O(1)**, constant: reading `items[5]` or looking up a map key. Same cost at any size.',
          '**O(log n)**, logarithmic: binary search. A million items ≈ 20 steps.',
          '**O(n)**, linear: linear search, summing a list. A million items ≈ a million steps.',
          '**O(n log n)**: good sorting algorithms (the built-in ones).',
          '**O(n²)**, quadratic: insertion sort, or comparing every item with every other. A million items ≈ a trillion steps: hours, not milliseconds.',
        ] },
        { kind: 'poly',
          pseudo: `# Does any trade appear twice? Two approaches.

# Slow: compare every pair: O(n²)
for i from 0 to n - 1
    for j from i + 1 to n - 1
        if ids[i] = ids[j] then display "duplicate"
    end for
end for

# Fast: remember what you've seen in a set: O(n)
set seen to an empty set
for each id in ids
    if id is in seen then display "duplicate"
    add id to seen
end for`,
          python: `import time

ids = list(range(10_000)) + [9_999]       # 10,001 ids, one duplicate at the very end

start = time.perf_counter()
found = any(ids[i] == ids[j] for i in range(len(ids)) for j in range(i + 1, len(ids)))
print("pairs:", found, f"{time.perf_counter() - start:.2f}s")

start = time.perf_counter()
seen, found = set(), False
for x in ids:
    if x in seen:
        found = True
    seen.add(x)
print("set:  ", found, f"{time.perf_counter() - start:.4f}s")
# pairs: True ~2s    set: True ~0.0005s  (exact times depend on your machine)`,
          ts: `const ids = [...Array(10_000).keys(), 9_999];

let t = performance.now();
let found = false;
for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++)
        if (ids[i] === ids[j]) found = true;
console.log("pairs:", found, (performance.now() - t).toFixed(1) + "ms");

t = performance.now();
const seen = new Set<number>();
found = false;
for (const x of ids) {
    if (seen.has(x)) found = true;
    seen.add(x);
}
console.log("set:  ", found, (performance.now() - t).toFixed(1) + "ms");`,
          go: `ids := make([]int, 0, 10001)
for i := 0; i < 10000; i++ {
    ids = append(ids, i)
}
ids = append(ids, 9999)

start := time.Now()
found := false
for i := 0; i < len(ids); i++ {
    for j := i + 1; j < len(ids); j++ {
        if ids[i] == ids[j] {
            found = true
        }
    }
}
fmt.Println("pairs:", found, time.Since(start))

start = time.Now()
seen := map[int]bool{}
found = false
for _, x := range ids {
    if seen[x] {
        found = true
    }
    seen[x] = true
}
fmt.Println("set:  ", found, time.Since(start))`,
          java: `List<Integer> ids = new ArrayList<>();
for (int i = 0; i < 10000; i++) ids.add(i);
ids.add(9999);

long t = System.nanoTime();
boolean found = false;
for (int i = 0; i < ids.size(); i++)
    for (int j = i + 1; j < ids.size(); j++)
        if (ids.get(i).equals(ids.get(j))) found = true;
System.out.printf("pairs: %b %.1fms%n", found, (System.nanoTime() - t) / 1e6);

t = System.nanoTime();
Set<Integer> seen = new HashSet<>();
found = false;
for (int x : ids) {
    if (seen.contains(x)) found = true;
    seen.add(x);
}
System.out.printf("set:   %b %.1fms%n", found, (System.nanoTime() - t) / 1e6);`,
          cpp: `std::vector<int> ids;
for (int i = 0; i < 10000; i++) ids.push_back(i);
ids.push_back(9999);

auto t = std::chrono::steady_clock::now();
bool found = false;
for (size_t i = 0; i < ids.size(); i++)
    for (size_t j = i + 1; j < ids.size(); j++)
        if (ids[i] == ids[j]) found = true;
auto ms = [&] { return std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - t).count(); };
std::cout << "pairs: " << found << ' ' << ms() << "ms\\n";

t = std::chrono::steady_clock::now();
std::unordered_set<int> seen;
found = false;
for (int x : ids) {
    if (seen.count(x)) found = true;
    seen.insert(x);
}
std::cout << "set:   " << found << ' ' << ms() << "ms\\n";`,
          caption: 'Run it and compare. In every language the set version wins by a huge margin, and the gap grows as the list gets longer.' },
        { kind: 'p', text: 'A better algorithm almost always beats a faster language. Python with a set will beat C++ comparing every pair once the data is big enough. Choosing the right approach is the skill; the language is the tool.' },
        { kind: 'check', q: 'An O(n²) program takes 1 second on 1,000 items. Roughly how long on 10,000?', options: ['2 seconds', '10 seconds', '100 seconds', '1,000 seconds'], answer: 2, hint: '10× the data, squared.', explain: '10² = 100 times the work.' },
      ],
    },
  ],
  quiz: [
    { q: 'An "edge case" is…', options: ['A bug', 'An unusual input such as an empty list or a tie', 'The last line', 'A sorted list'], answer: 1, explain: 'Think about them before coding.' },
    { q: 'Linear search on n items checks at most…', options: ['1', 'log n', 'n', 'n²'], answer: 2, explain: 'Every item.' },
    { q: 'Binary search only works on…', options: ['Numbers', 'Sorted data', 'Short lists', 'Strings'], answer: 1, explain: 'It relies on order.' },
    { q: 'Binary search on about a million sorted items needs roughly…', options: ['20 checks', '1,000 checks', '500,000 checks', '1,000,000 checks'], answer: 0, explain: 'Halving 20 times.' },
    { q: 'Insertion sort works like…', options: ['Shuffling cards', 'Sliding each new card into place in a sorted hand', 'Binary search', 'Splitting text'], answer: 1, explain: 'Simple, O(n²).' },
    { q: '`[10, 9, 1].sort()` in JavaScript gives…', options: ['[1, 9, 10]', '[1, 10, 9]', '[10, 9, 1]', 'An error'], answer: 1, explain: 'Text order by default.' },
    { q: 'O(n²) means doubling the data roughly…', options: ['Doubles the work', 'Quadruples the work', 'Adds one step', 'Has no effect'], answer: 1, explain: '2² = 4.' },
    { q: 'Checking for duplicates is fastest with…', options: ['Comparing every pair', 'A set of seen items', 'Sorting twice', 'Printing everything'], answer: 1, explain: 'Set lookups are O(1).' },
  ],
}
