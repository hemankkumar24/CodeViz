import type { InputData, VisualizationType } from "@/types/execution";
import type { SupportedLanguage } from "@/types/languages";

export type ExampleCategory =
  | "Sorting"
  | "Searching"
  | "Arrays"
  | "Sliding Window"
  | "Two Pointers"
  | "Dynamic Programming"
  | "Recursion"
  | "Graphs"
  | "Trees";

export type Difficulty = "Easy" | "Medium" | "Hard";

export type Example = {
  slug: string;
  title: string;
  description: string;
  categories: ExampleCategory[];
  difficulty: Difficulty;
  visualizationType: VisualizationType;
  visualizationLabel: string;
  targetVariable: string | null;
  code: Record<SupportedLanguage, string>;
  input: InputData;
  /** Whether an authored trace exists for this example yet. */
  traced: boolean;
  previewKind: "array" | "grid" | "graph" | "tree" | "variables";
};

export const examples: Example[] = [
  {
    slug: "insertion-sort",
    title: "Insertion Sort",
    description: "Watch elements shift until each value reaches its correct position.",
    categories: ["Sorting", "Arrays"],
    difficulty: "Easy",
    visualizationType: "array",
    visualizationLabel: "Array",
    targetVariable: "nums",
    traced: true,
    previewKind: "array",
    code: {
      python: `class Solution:
    def insertionSort(self, nums: List[int]) -> List[int]:
        for i in range(1, len(nums)):
            key = nums[i]
            j = i - 1
            while j >= 0 and nums[j] > key:
                nums[j + 1] = nums[j]
                j -= 1
            nums[j + 1] = key
        return nums`,
      cpp: `class Solution {
public:
    vector<int> insertionSort(vector<int>& nums) {
        for (int i = 1; i < nums.size(); i++) {
            int key = nums[i];
            int j = i - 1;
            while (j >= 0 && nums[j] > key) {
                nums[j + 1] = nums[j];
                j--;
            }
            nums[j + 1] = key;
        }
        return nums;
    }
};`,
      java: `class Solution {
    public int[] insertionSort(int[] nums) {
        for (int i = 1; i < nums.length; i++) {
            int key = nums[i];
            int j = i - 1;
            while (j >= 0 && nums[j] > key) {
                nums[j + 1] = nums[j];
                j--;
            }
            nums[j + 1] = key;
        }
        return nums;
    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
var insertionSort = function(nums) {
    for (let i = 1; i < nums.length; i++) {
        const key = nums[i];
        let j = i - 1;
        while (j >= 0 && nums[j] > key) {
            nums[j + 1] = nums[j];
            j--;
        }
        nums[j + 1] = key;
    }
    return nums;
};`,
      typescript: `function insertionSort(nums: number[]): number[] {
    for (let i = 1; i < nums.length; i++) {
        const key = nums[i];
        let j = i - 1;
        while (j >= 0 && nums[j] > key) {
            nums[j + 1] = nums[j];
            j--;
        }
        nums[j + 1] = key;
    }
    return nums;
}`,
    },
    input: { kind: "variables", values: { nums: [5, 2, 4, 1] } },
  },
  {
    slug: "binary-search",
    title: "Binary Search",
    description: "Halve the search range until the target is cornered.",
    categories: ["Searching", "Arrays", "Two Pointers"],
    difficulty: "Easy",
    visualizationType: "array",
    visualizationLabel: "Array",
    targetVariable: "nums",
    traced: true,
    previewKind: "array",
    code: {
      python: `class Solution:
    def search(self, nums: List[int], target: int) -> int:
        low, high = 0, len(nums) - 1
        while low <= high:
            mid = (low + high) // 2
            if nums[mid] == target:
                return mid
            elif nums[mid] < target:
                low = mid + 1
            else:
                high = mid - 1
        return -1`,
      cpp: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        int low = 0, high = nums.size() - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (nums[mid] == target) {
                return mid;
            } else if (nums[mid] < target) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return -1;
    }
};`,
      java: `class Solution {
    public int search(int[] nums, int target) {
        int low = 0, high = nums.length - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (nums[mid] == target) {
                return mid;
            } else if (nums[mid] < target) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return -1;
    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var search = function(nums, target) {
    let low = 0, high = nums.length - 1;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (nums[mid] === target) {
            return mid;
        } else if (nums[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
};`,
      typescript: `function search(nums: number[], target: number): number {
    let low = 0, high = nums.length - 1;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (nums[mid] === target) {
            return mid;
        } else if (nums[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}`,
    },
    input: { kind: "variables", values: { nums: [1, 3, 5, 7, 9, 11, 13, 15], target: 11 } },
  },
  {
    slug: "sliding-window",
    title: "Sliding Window",
    description: "Move a fixed window across the array and track its running sum.",
    categories: ["Sliding Window", "Arrays"],
    difficulty: "Easy",
    visualizationType: "array",
    visualizationLabel: "Array",
    targetVariable: "nums",
    traced: true,
    previewKind: "array",
    code: {
      python: `class Solution:
    def maxWindowSum(self, nums: List[int], k: int) -> int:
        window_sum = sum(nums[:k])
        best = window_sum
        for right in range(k, len(nums)):
            window_sum += nums[right] - nums[right - k]
            if window_sum > best:
                best = window_sum
        return best`,
      cpp: `class Solution {
public:
    int maxWindowSum(vector<int>& nums, int k) {
        int windowSum = 0;
        for (int i = 0; i < k; i++) windowSum += nums[i];
        int best = windowSum;
        for (int right = k; right < nums.size(); right++) {
            windowSum += nums[right] - nums[right - k];
            if (windowSum > best) best = windowSum;
        }
        return best;
    }
};`,
      java: `class Solution {
    public int maxWindowSum(int[] nums, int k) {
        int windowSum = 0;
        for (int i = 0; i < k; i++) windowSum += nums[i];
        int best = windowSum;
        for (int right = k; right < nums.length; right++) {
            windowSum += nums[right] - nums[right - k];
            if (windowSum > best) best = windowSum;
        }
        return best;
    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
var maxWindowSum = function(nums, k) {
    let windowSum = 0;
    for (let i = 0; i < k; i++) windowSum += nums[i];
    let best = windowSum;
    for (let right = k; right < nums.length; right++) {
        windowSum += nums[right] - nums[right - k];
        if (windowSum > best) best = windowSum;
    }
    return best;
};`,
      typescript: `function maxWindowSum(nums: number[], k: number): number {
    let windowSum = 0;
    for (let i = 0; i < k; i++) windowSum += nums[i];
    let best = windowSum;
    for (let right = k; right < nums.length; right++) {
        windowSum += nums[right] - nums[right - k];
        if (windowSum > best) best = windowSum;
    }
    return best;
}`,
    },
    input: { kind: "variables", values: { nums: [2, 1, 5, 1, 3, 2, 8], k: 3 } },
  },
  {
    slug: "kadane",
    title: "Kadane's Algorithm",
    description: "Decide at every element whether to extend the run or start over.",
    categories: ["Arrays", "Dynamic Programming"],
    difficulty: "Medium",
    visualizationType: "array",
    visualizationLabel: "Array + Variables",
    targetVariable: "nums",
    traced: true,
    previewKind: "variables",
    code: {
      python: `class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        current_sum = max_sum = nums[0]
        for i in range(1, len(nums)):
            value = nums[i]
            current_sum = max(value, current_sum + value)
            max_sum = max(max_sum, current_sum)
        return max_sum`,
      cpp: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int currentSum = nums[0], maxSum = nums[0];
        for (int i = 1; i < nums.size(); i++) {
            int value = nums[i];
            currentSum = max(value, currentSum + value);
            maxSum = max(maxSum, currentSum);
        }
        return maxSum;
    }
};`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        int currentSum = nums[0], maxSum = nums[0];
        for (int i = 1; i < nums.length; i++) {
            int value = nums[i];
            currentSum = Math.max(value, currentSum + value);
            maxSum = Math.max(maxSum, currentSum);
        }
        return maxSum;
    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function(nums) {
    let currentSum = nums[0], maxSum = nums[0];
    for (let i = 1; i < nums.length; i++) {
        const value = nums[i];
        currentSum = Math.max(value, currentSum + value);
        maxSum = Math.max(maxSum, currentSum);
    }
    return maxSum;
};`,
      typescript: `function maxSubArray(nums: number[]): number {
    let currentSum = nums[0], maxSum = nums[0];
    for (let i = 1; i < nums.length; i++) {
        const value = nums[i];
        currentSum = Math.max(value, currentSum + value);
        maxSum = Math.max(maxSum, currentSum);
    }
    return maxSum;
}`,
    },
    input: { kind: "variables", values: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] } },
  },
  {
    slug: "fibonacci-dp",
    title: "Fibonacci DP",
    description: "Fill a table left to right, each cell built from the two behind it.",
    categories: ["Dynamic Programming"],
    difficulty: "Easy",
    visualizationType: "dp",
    visualizationLabel: "DP Table",
    targetVariable: "dp",
    traced: true,
    previewKind: "grid",
    code: {
      python: `class Solution:
    def fib(self, n: int) -> int:
        if n <= 1:
            return n
        dp = [0] * (n + 1)
        dp[1] = 1
        for i in range(2, n + 1):
            dp[i] = dp[i - 1] + dp[i - 2]
        return dp[n]`,
      cpp: `class Solution {
public:
    int fib(int n) {
        if (n <= 1) return n;
        vector<int> dp(n + 1, 0);
        dp[1] = 1;
        for (int i = 2; i <= n; i++) {
            dp[i] = dp[i - 1] + dp[i - 2];
        }
        return dp[n];
    }
};`,
      java: `class Solution {
    public int fib(int n) {
        if (n <= 1) return n;
        int[] dp = new int[n + 1];
        dp[1] = 1;
        for (int i = 2; i <= n; i++) {
            dp[i] = dp[i - 1] + dp[i - 2];
        }
        return dp[n];
    }
}`,
      javascript: `/**
 * @param {number} n
 * @return {number}
 */
var fib = function(n) {
    if (n <= 1) return n;
    const dp = new Array(n + 1).fill(0);
    dp[1] = 1;
    for (let i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
};`,
      typescript: `function fib(n: number): number {
    if (n <= 1) return n;
    const dp = new Array(n + 1).fill(0);
    dp[1] = 1;
    for (let i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}`,
    },
    input: { kind: "variables", values: { n: 9 } },
  },
  {
    slug: "knapsack",
    title: "0/1 Knapsack",
    description: "Every cell asks one question: take this item, or leave it?",
    categories: ["Dynamic Programming"],
    difficulty: "Hard",
    visualizationType: "dp",
    visualizationLabel: "DP Table (2D)",
    targetVariable: "dp",
    traced: true,
    previewKind: "grid",
    code: {
      python: `class Solution:
    def knapsack(self, weights: List[int], values: List[int], capacity: int) -> int:
        n = len(weights)
        dp = [[0] * (capacity + 1) for _ in range(n + 1)]
        for i in range(1, n + 1):
            for c in range(capacity + 1):
                if weights[i - 1] > c:
                    dp[i][c] = dp[i - 1][c]
                else:
                    dp[i][c] = max(dp[i - 1][c], dp[i - 1][c - weights[i - 1]] + values[i - 1])
        return dp[n][capacity]`,
      cpp: `class Solution {
public:
    int knapsack(vector<int>& weights, vector<int>& values, int capacity) {
        int n = weights.size();
        vector<vector<int>> dp(n + 1, vector<int>(capacity + 1, 0));
        for (int i = 1; i <= n; i++) {
            for (int c = 0; c <= capacity; c++) {
                if (weights[i - 1] > c) {
                    dp[i][c] = dp[i - 1][c];
                } else {
                    dp[i][c] = max(dp[i - 1][c], dp[i - 1][c - weights[i - 1]] + values[i - 1]);
                }
            }
        }
        return dp[n][capacity];
    }
};`,
      java: `class Solution {
    public int knapsack(int[] weights, int[] values, int capacity) {
        int n = weights.length;
        int[][] dp = new int[n + 1][capacity + 1];
        for (int i = 1; i <= n; i++) {
            for (int c = 0; c <= capacity; c++) {
                if (weights[i - 1] > c) {
                    dp[i][c] = dp[i - 1][c];
                } else {
                    dp[i][c] = Math.max(dp[i - 1][c], dp[i - 1][c - weights[i - 1]] + values[i - 1]);
                }
            }
        }
        return dp[n][capacity];
    }
}`,
      javascript: `/**
 * @param {number[]} weights
 * @param {number[]} values
 * @param {number} capacity
 * @return {number}
 */
var knapsack = function(weights, values, capacity) {
    const n = weights.length;
    const dp = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));
    for (let i = 1; i <= n; i++) {
        for (let c = 0; c <= capacity; c++) {
            if (weights[i - 1] > c) {
                dp[i][c] = dp[i - 1][c];
            } else {
                dp[i][c] = Math.max(dp[i - 1][c], dp[i - 1][c - weights[i - 1]] + values[i - 1]);
            }
        }
    }
    return dp[n][capacity];
};`,
      typescript: `function knapsack(weights: number[], values: number[], capacity: number): number {
    const n = weights.length;
    const dp = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));
    for (let i = 1; i <= n; i++) {
        for (let c = 0; c <= capacity; c++) {
            if (weights[i - 1] > c) {
                dp[i][c] = dp[i - 1][c];
            } else {
                dp[i][c] = Math.max(dp[i - 1][c], dp[i - 1][c - weights[i - 1]] + values[i - 1]);
            }
        }
    }
    return dp[n][capacity];
}`,
    },
    input: { kind: "variables", values: { weights: [1, 3, 4, 5], values: [1, 4, 5, 7], capacity: 5 } },
  },
  {
    slug: "lis",
    title: "Longest Increasing Subsequence",
    description: "Each dp cell reaches back for the best chain it can extend.",
    categories: ["Dynamic Programming", "Arrays"],
    difficulty: "Medium",
    visualizationType: "dp",
    visualizationLabel: "DP Table",
    targetVariable: "dp",
    traced: true,
    previewKind: "grid",
    code: {
      python: `class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        dp = [1] * len(nums)
        for i in range(1, len(nums)):
            for j in range(i):
                if nums[j] < nums[i]:
                    dp[i] = max(dp[i], dp[j] + 1)
        return max(dp)`,
      cpp: `class Solution {
public:
    int lengthOfLIS(vector<int>& nums) {
        vector<int> dp(nums.size(), 1);
        for (int i = 1; i < nums.size(); i++) {
            for (int j = 0; j < i; j++) {
                if (nums[j] < nums[i]) {
                    dp[i] = max(dp[i], dp[j] + 1);
                }
            }
        }
        return *max_element(dp.begin(), dp.end());
    }
};`,
      java: `class Solution {
    public int lengthOfLIS(int[] nums) {
        int[] dp = new int[nums.length];
        Arrays.fill(dp, 1);
        int max = 1;
        for (int i = 1; i < nums.length; i++) {
            for (int j = 0; j < i; j++) {
                if (nums[j] < nums[i]) {
                    dp[i] = Math.max(dp[i], dp[j] + 1);
                }
            }
            max = Math.max(max, dp[i]);
        }
        return max;
    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var lengthOfLIS = function(nums) {
    const dp = new Array(nums.length).fill(1);
    for (let i = 1; i < nums.length; i++) {
        for (let j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                dp[i] = Math.max(dp[i], dp[j] + 1);
            }
        }
    }
    return Math.max(...dp);
};`,
      typescript: `function lengthOfLIS(nums: number[]): number {
    const dp = new Array(nums.length).fill(1);
    for (let i = 1; i < nums.length; i++) {
        for (let j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                dp[i] = Math.max(dp[i], dp[j] + 1);
            }
        }
    }
    return Math.max(...dp);
}`,
    },
    input: { kind: "variables", values: { nums: [10, 9, 2, 5, 3, 7, 101] } },
  },
  {
    slug: "fib-recursion",
    title: "Recursive Fibonacci",
    description: "See the call tree expand, then collapse as values return.",
    categories: ["Recursion"],
    difficulty: "Medium",
    visualizationType: "recursion",
    visualizationLabel: "Call Stack",
    targetVariable: "fib",
    traced: true,
    previewKind: "tree",
    code: {
      python: `class Solution:
    def fib(self, n: int) -> int:
        if n <= 1:
            return n
        return self.fib(n - 1) + self.fib(n - 2)`,
      cpp: `class Solution {
public:
    int fib(int n) {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
    }
};`,
      java: `class Solution {
    public int fib(int n) {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
    }
}`,
      javascript: `/**
 * @param {number} n
 * @return {number}
 */
var fib = function(n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
};`,
      typescript: `function fib(n: number): number {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}`,
    },
    input: { kind: "variables", values: { n: 5 } },
  },
  {
    slug: "bfs",
    title: "Breadth-First Search",
    description: "Explore a graph level by level using a queue.",
    categories: ["Graphs", "Trees"],
    difficulty: "Medium",
    visualizationType: "array",
    visualizationLabel: "Queue + Order",
    targetVariable: "order",
    traced: true,
    previewKind: "graph",
    code: {
      python: `class Solution:
    def bfs(self, graph: List[List[int]], start: int) -> List[int]:
        queue = [start]
        seen = {start}
        order = []
        while queue:
            node = queue.pop(0)
            order.append(node)
            for nxt in graph[node]:
                if nxt not in seen:
                    seen.add(nxt)
                    queue.append(nxt)
        return order`,
      cpp: `class Solution {
public:
    vector<int> bfs(vector<vector<int>>& graph, int start) {
        vector<int> queue = {start};
        unordered_set<int> seen = {start};
        vector<int> order;
        int head = 0;
        while (head < queue.size()) {
            int node = queue[head++];
            order.push_back(node);
            for (int nxt : graph[node]) {
                if (seen.find(nxt) == seen.end()) {
                    seen.insert(nxt);
                    queue.push_back(nxt);
                }
            }
        }
        return order;
    }
};`,
      java: `class Solution {
    public List<Integer> bfs(int[][] graph, int start) {
        List<Integer> queue = new ArrayList<>();
        Set<Integer> seen = new HashSet<>();
        List<Integer> order = new ArrayList<>();
        queue.add(start);
        seen.add(start);
        while (!queue.isEmpty()) {
            int node = queue.remove(0);
            order.add(node);
            for (int nxt : graph[node]) {
                if (!seen.contains(nxt)) {
                    seen.add(nxt);
                    queue.add(nxt);
                }
            }
        }
        return order;
    }
}`,
      javascript: `/**
 * @param {number[][]} graph
 * @param {number} start
 * @return {number[]}
 */
var bfs = function(graph, start) {
    const queue = [start];
    const seen = new Set([start]);
    const order = [];
    while (queue.length) {
        const node = queue.shift();
        order.push(node);
        for (const nxt of graph[node]) {
            if (!seen.has(nxt)) {
                seen.add(nxt);
                queue.push(nxt);
            }
        }
    }
    return order;
};`,
      typescript: `function bfs(graph: number[][], start: number): number[] {
    const queue = [start];
    const seen = new Set([start]);
    const order: number[] = [];
    while (queue.length) {
        const node = queue.shift()!;
        order.push(node);
        for (const nxt of graph[node]) {
            if (!seen.has(nxt)) {
                seen.add(nxt);
                queue.push(nxt);
            }
        }
    }
    return order;
}`,
    },
    input: { kind: "variables", values: { graph: [[1, 2], [0, 3, 4], [0], [1], [1]], start: 0 } },
  },
  {
    slug: "dfs",
    title: "Depth-First Search",
    description: "Follow one path as deep as it goes before backtracking.",
    categories: ["Graphs", "Recursion", "Trees"],
    difficulty: "Medium",
    visualizationType: "recursion",
    visualizationLabel: "Call Stack + Visited",
    targetVariable: "visited",
    traced: true,
    previewKind: "graph",
    code: {
      python: `class Solution:
    def dfs(self, graph: List[List[int]], node: int, seen: Optional[Set[int]] = None) -> List[int]:
        if seen is None:
            seen = set()
        seen.add(node)
        for nxt in graph[node]:
            if nxt not in seen:
                self.dfs(graph, nxt, seen)
        return list(seen)`,
      cpp: `class Solution {
public:
    void dfsUtil(vector<vector<int>>& graph, int node, unordered_set<int>& seen) {
        seen.insert(node);
        for (int nxt : graph[node]) {
            if (seen.find(nxt) == seen.end()) {
                dfsUtil(graph, nxt, seen);
            }
        }
    }
    vector<int> dfs(vector<vector<int>>& graph, int node) {
        unordered_set<int> seen;
        dfsUtil(graph, node, seen);
        return vector<int>(seen.begin(), seen.end());
    }
};`,
      java: `class Solution {
    private void dfsUtil(int[][] graph, int node, Set<Integer> seen) {
        seen.add(node);
        for (int nxt : graph[node]) {
            if (!seen.contains(nxt)) {
                dfsUtil(graph, nxt, seen);
            }
        }
    }
    public List<Integer> dfs(int[][] graph, int node) {
        Set<Integer> seen = new HashSet<>();
        dfsUtil(graph, node, seen);
        return new ArrayList<>(seen);
    }
}`,
      javascript: `/**
 * @param {number[][]} graph
 * @param {number} node
 * @return {number[]}
 */
var dfs = function(graph, node, seen = new Set()) {
    seen.add(node);
    for (const nxt of graph[node]) {
        if (!seen.has(nxt)) dfs(graph, nxt, seen);
    }
    return Array.from(seen);
};`,
      typescript: `function dfs(graph: number[][], node: number, seen = new Set<number>()): number[] {
    seen.add(node);
    for (const nxt of graph[node]) {
        if (!seen.has(nxt)) dfs(graph, nxt, seen);
    }
    return Array.from(seen);
}`,
    },
    input: { kind: "variables", values: { graph: [[1, 2], [0, 3, 4], [0], [1], [1]], node: 0 } },
  },
];

export const allCategories: ExampleCategory[] = [
  "Sorting",
  "Searching",
  "Arrays",
  "Sliding Window",
  "Two Pointers",
  "Dynamic Programming",
  "Recursion",
  "Graphs",
  "Trees",
];

export function getExample(slug: string): Example | undefined {
  return examples.find((e) => e.slug === slug);
}

export function getExampleCode(example: Example, language: SupportedLanguage): string {
  return example.code[language] ?? example.code.python ?? "";
}

/**
 * Maps step line numbers from base JavaScript line numbers to target language line numbers.
 */
const LINE_MAPS: Record<string, Partial<Record<SupportedLanguage, Record<number, number>>>> = {
  "insertion-sort": {
    python: { 2: 3, 3: 4, 4: 5, 6: 6, 7: 7, 8: 8, 11: 9, 14: 10 },
    cpp: { 2: 4, 3: 5, 4: 6, 6: 7, 7: 8, 8: 9, 11: 11, 14: 13 },
    java: { 2: 3, 3: 4, 4: 5, 6: 6, 7: 7, 8: 8, 11: 10, 14: 12 },
    javascript: { 2: 6, 3: 7, 4: 8, 6: 9, 7: 10, 8: 11, 11: 13, 14: 15 },
    typescript: { 2: 2, 3: 3, 4: 4, 6: 5, 7: 6, 8: 7, 11: 9, 14: 11 },
  },
  "binary-search": {
    python: { 2: 3, 5: 5, 7: 6, 8: 7, 10: 9, 12: 11, 15: 12 },
    cpp: { 2: 4, 5: 6, 7: 7, 8: 8, 10: 10, 12: 12, 15: 15 },
    java: { 2: 3, 5: 5, 7: 6, 8: 7, 10: 9, 12: 11, 15: 14 },
    javascript: { 2: 7, 5: 9, 7: 10, 8: 11, 10: 13, 12: 15, 15: 18 },
    typescript: { 2: 2, 5: 4, 7: 5, 8: 6, 10: 8, 12: 10, 15: 13 },
  },
  "sliding-window": {
    python: { 4: 3, 6: 4, 9: 6, 10: 7, 13: 8 },
    cpp: { 4: 4, 6: 5, 9: 7, 10: 8, 13: 10 },
    java: { 4: 3, 6: 4, 9: 6, 10: 7, 13: 9 },
    javascript: { 4: 8, 6: 9, 9: 11, 10: 12, 13: 14 },
    typescript: { 4: 3, 6: 4, 9: 6, 10: 7, 13: 9 },
  },
  kadane: {
    python: { 2: 3, 5: 5, 6: 6, 7: 7, 10: 8 },
    cpp: { 2: 4, 5: 6, 6: 7, 7: 8, 10: 10 },
    java: { 2: 3, 5: 5, 6: 6, 7: 7, 10: 9 },
    javascript: { 2: 7, 5: 9, 6: 10, 7: 11, 10: 13 },
    typescript: { 2: 2, 5: 4, 6: 5, 7: 6, 10: 8 },
  },
  "fibonacci-dp": {
    python: { 3: 5, 4: 6, 6: 7, 7: 8, 10: 9 },
    cpp: { 3: 4, 4: 5, 6: 6, 7: 7, 10: 9 },
    java: { 3: 4, 4: 5, 6: 6, 7: 7, 10: 9 },
    javascript: { 3: 8, 4: 9, 6: 10, 7: 11, 10: 13 },
    typescript: { 3: 3, 4: 4, 6: 5, 7: 6, 10: 8 },
  },
  knapsack: {
    python: { 2: 3, 4: 5, 5: 6, 7: 7, 8: 9, 10: 10 },
    cpp: { 2: 4, 4: 6, 5: 7, 7: 8, 8: 10, 10: 13 },
    java: { 2: 3, 4: 5, 5: 6, 7: 7, 8: 9, 10: 12 },
    javascript: { 2: 9, 4: 11, 5: 12, 7: 13, 8: 15, 10: 18 },
    typescript: { 2: 3, 4: 5, 5: 6, 7: 7, 8: 9, 10: 12 },
  },
  lis: {
    python: { 2: 3, 4: 4, 5: 5, 6: 6, 8: 7 },
    cpp: { 2: 4, 4: 5, 5: 6, 6: 7, 8: 10 },
    java: { 2: 3, 4: 6, 5: 7, 6: 8, 8: 12 },
    javascript: { 2: 7, 4: 8, 5: 9, 6: 10, 8: 13 },
    typescript: { 2: 2, 4: 3, 5: 4, 6: 5, 8: 9 },
  },
  "fib-recursion": {
    python: { 2: 3, 3: 4, 4: 5 },
    cpp: { 2: 4, 3: 4, 4: 5 },
    java: { 2: 3, 3: 3, 4: 4 },
    javascript: { 2: 7, 3: 7, 4: 8 },
    typescript: { 2: 2, 3: 2, 4: 3 },
  },
  bfs: {
    python: { 2: 3, 6: 7, 9: 9, 12: 12, 13: 13 },
    cpp: { 2: 4, 6: 8, 9: 10, 12: 13, 13: 16 },
    java: { 2: 3, 6: 7, 9: 9, 12: 12, 13: 15 },
    javascript: { 2: 6, 6: 10, 9: 12, 12: 15, 13: 17 },
    typescript: { 2: 2, 6: 6, 9: 8, 12: 11, 13: 13 },
  },
  dfs: {
    python: { 2: 5, 4: 6, 7: 8, 8: 9 },
    cpp: { 2: 4, 4: 5, 7: 8, 8: 13 },
    java: { 2: 4, 4: 5, 7: 8, 8: 13 },
    javascript: { 2: 6, 4: 7, 7: 9, 8: 10 },
    typescript: { 2: 2, 4: 3, 7: 5, 8: 6 },
  },
};

export function getMappedLine(slug: string | null, language: SupportedLanguage, baseLine: number): number {
  if (!slug) return baseLine;
  const langMap = LINE_MAPS[slug]?.[language];
  if (langMap && baseLine in langMap) {
    return langMap[baseLine]!;
  }
  return baseLine;
}