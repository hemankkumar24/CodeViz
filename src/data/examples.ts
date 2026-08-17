import type { InputData, VisualizationType } from "@/types/execution";
import type { SupportedLanguage } from "@/types/languages";

export type Example = {
  slug: string;
  title: string;
  description: string;
  categories: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  visualizationType: VisualizationType;
  visualizationLabel: string;
  targetVariable?: string;
  traced: boolean;
  code: Record<SupportedLanguage, string>;
  input: InputData;
  previewKind: "array" | "grid" | "graph" | "tree" | "variables";
};

export const allCategories = [
  "Sorting",
  "Searching",
  "Two Pointers",
  "Dynamic Programming",
  "Recursion",
  "Graph",
  "BFS",
  "DFS",
  "Arrays",
];

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
      cpp: `#include <vector>
using namespace std;

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
}`,
      java: `import java.util.*;

public static int[] insertionSort(int[] nums) {
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
}`,
    },
    input: { kind: "variables", values: { nums: [5, 2, 4, 1] } },
  },
  {
    slug: "binary-search",
    title: "Binary Search",
    description: "Halve the search space on every step by comparing the middle element.",
    categories: ["Searching", "Arrays"],
    difficulty: "Easy",
    visualizationType: "array",
    visualizationLabel: "Search Space",
    targetVariable: "nums",
    traced: true,
    previewKind: "array",
    code: {
      cpp: `#include <vector>
using namespace std;

int search(vector<int>& nums, int target) {
    int left = 0;
    int right = nums.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}`,
      java: `import java.util.*;

public static int search(int[] nums, int target) {
    int left = 0;
    int right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
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
    description: "Slide a fixed-size window across the array, maintaining a running sum.",
    categories: ["Arrays", "Two Pointers"],
    difficulty: "Easy",
    visualizationType: "array",
    visualizationLabel: "Window",
    targetVariable: "nums",
    traced: true,
    previewKind: "array",
    code: {
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

int maxWindowSum(vector<int>& nums, int k) {
    int currentSum = 0;
    for (int i = 0; i < k; i++) {
        currentSum += nums[i];
    }
    int best = currentSum;
    for (int i = k; i < nums.size(); i++) {
        currentSum += nums[i] - nums[i - k];
        best = max(best, currentSum);
    }
    return best;
}`,
      java: `import java.util.*;

public static int maxWindowSum(int[] nums, int k) {
    int currentSum = 0;
    for (int i = 0; i < k; i++) {
        currentSum += nums[i];
    }
    int best = currentSum;
    for (int i = k; i < nums.length; i++) {
        currentSum += nums[i] - nums[i - k];
        best = Math.max(best, currentSum);
    }
    return best;
}`,
    },
    input: { kind: "variables", values: { nums: [2, 1, 5, 1, 3, 2, 8], k: 3 } },
  },
  {
    slug: "kadane",
    title: "Kadane's Algorithm",
    description: "Find the contiguous subarray with the maximum sum in O(n) time.",
    categories: ["Dynamic Programming", "Arrays"],
    difficulty: "Medium",
    visualizationType: "array",
    visualizationLabel: "Subarray Sums",
    targetVariable: "nums",
    traced: true,
    previewKind: "array",
    code: {
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

int maxSubArray(vector<int>& nums) {
    int currentSum = nums[0];
    int maxSum = nums[0];
    for (int i = 1; i < nums.size(); i++) {
        currentSum = max(nums[i], currentSum + nums[i]);
        maxSum = max(maxSum, currentSum);
    }
    return maxSum;
}`,
      java: `import java.util.*;

public static int maxSubArray(int[] nums) {
    int currentSum = nums[0];
    int maxSum = nums[0];
    for (int i = 1; i < nums.length; i++) {
        currentSum = Math.max(nums[i], currentSum + nums[i]);
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
    description: "Compute the nth Fibonacci number bottom-up, filling a 1D DP array.",
    categories: ["Dynamic Programming"],
    difficulty: "Easy",
    visualizationType: "dp",
    visualizationLabel: "DP Table",
    targetVariable: "dp",
    traced: true,
    previewKind: "grid",
    code: {
      cpp: `#include <vector>
using namespace std;

int fib(int n) {
    if (n <= 1) return n;
    vector<int> dp(n + 1, 0);
    dp[0] = 0;
    dp[1] = 1;
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}`,
      java: `import java.util.*;

public static int fib(int n) {
    if (n <= 1) return n;
    int[] dp = new int[n + 1];
    dp[0] = 0;
    dp[1] = 1;
    for (int i = 2; i <= n; i++) {
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
    description: "Fill a 2D table to find the maximum value subset that fits in capacity.",
    categories: ["Dynamic Programming"],
    difficulty: "Medium",
    visualizationType: "dp",
    visualizationLabel: "DP Table (items × capacity)",
    targetVariable: "dp",
    traced: true,
    previewKind: "grid",
    code: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int knapsack(vector<int>& weights, vector<int>& values, int capacity) {
    int n = weights.size();
    vector<vector<int>> dp(n + 1, vector<int>(capacity + 1, 0));

    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= capacity; w++) {
            if (weights[i - 1] <= w) {
                dp[i][w] = max(
                    dp[i - 1][w],
                    values[i - 1] + dp[i - 1][w - weights[i - 1]]
                );
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }

    return dp[n][capacity];
}`,
      java: `import java.util.*;

public static int knapsack(int[] weights, int[] values, int capacity) {
    int n = weights.length;
    int[][] dp = new int[n + 1][capacity + 1];

    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= capacity; w++) {
            if (weights[i - 1] <= w) {
                dp[i][w] = Math.max(
                    dp[i - 1][w],
                    values[i - 1] + dp[i - 1][w - weights[i - 1]]
                );
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }

    return dp[n][capacity];
}`,
    },
    input: { kind: "variables", values: { weights: [1, 3, 4, 5], values: [1, 4, 5, 7], capacity: 7 } },
  },
  {
    slug: "lis",
    title: "Longest Increasing Subsequence",
    description: "For every index, look back at all smaller elements to build the longest subsequence.",
    categories: ["Dynamic Programming", "Arrays"],
    difficulty: "Medium",
    visualizationType: "dp",
    visualizationLabel: "LIS Array",
    targetVariable: "dp",
    traced: true,
    previewKind: "array",
    code: {
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

int lengthOfLIS(vector<int>& nums) {
    int n = nums.size();
    if (n == 0) return 0;
    vector<int> dp(n, 1);
    for (int i = 1; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                dp[i] = max(dp[i], dp[j] + 1);
            }
        }
    }
    return *max_element(dp.begin(), dp.end());
}`,
      java: `import java.util.*;

public static int lengthOfLIS(int[] nums) {
    int n = nums.length;
    if (n == 0) return 0;
    int[] dp = new int[n];
    Arrays.fill(dp, 1);
    int ans = 1;
    for (int i = 1; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                dp[i] = Math.max(dp[i], dp[j] + 1);
            }
        }
        ans = Math.max(ans, dp[i]);
    }
    return ans;
}`,
    },
    input: { kind: "variables", values: { nums: [10, 9, 2, 5, 3, 7, 101] } },
  },
  {
    slug: "fib-recursion",
    title: "Recursive Fibonacci",
    description: "Watch the call tree branch and return values up the stack.",
    categories: ["Recursion"],
    difficulty: "Easy",
    visualizationType: "recursion",
    visualizationLabel: "Call Stack",
    traced: true,
    previewKind: "tree",
    code: {
      cpp: `#include <iostream>
using namespace std;

int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}`,
      java: `import java.util.*;

public static int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}`,
    },
    input: { kind: "variables", values: { n: 5 } },
  },
  {
    slug: "bfs",
    title: "Breadth-First Search",
    description: "Explore nodes layer by layer using a FIFO queue.",
    categories: ["Graph", "BFS"],
    difficulty: "Medium",
    visualizationType: "multiple",
    visualizationLabel: "BFS Traversal",
    traced: true,
    previewKind: "graph",
    code: {
      cpp: `#include <vector>
#include <queue>
#include <unordered_set>
using namespace std;

vector<int> bfs(vector<vector<int>>& graph, int start) {
    vector<int> order;
    queue<int> q;
    unordered_set<int> seen;

    q.push(start);
    seen.insert(start);

    while (!q.empty()) {
        int node = q.front();
        q.pop();
        order.push_back(node);

        for (int nxt : graph[node]) {
            if (seen.find(nxt) == seen.end()) {
                seen.insert(nxt);
                q.push(nxt);
            }
        }
    }
    return order;
}`,
      java: `import java.util.*;

public static List<Integer> bfs(int[][] graph, int start) {
    List<Integer> order = new ArrayList<>();
    Queue<Integer> q = new LinkedList<>();
    Set<Integer> seen = new HashSet<>();

    q.add(start);
    seen.add(start);

    while (!q.isEmpty()) {
        int node = q.poll();
        order.add(node);

        for (int nxt : graph[node]) {
            if (!seen.contains(nxt)) {
                seen.add(nxt);
                q.add(nxt);
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
    description: "Explore as deep as possible along each branch before backtracking.",
    categories: ["Graph", "DFS", "Recursion"],
    difficulty: "Medium",
    visualizationType: "multiple",
    visualizationLabel: "DFS Traversal",
    traced: true,
    previewKind: "graph",
    code: {
      cpp: `#include <vector>
#include <unordered_set>
using namespace std;

void dfsHelper(int node, vector<vector<int>>& graph, unordered_set<int>& seen, vector<int>& order) {
    seen.insert(node);
    order.push_back(node);
    for (int nxt : graph[node]) {
        if (seen.find(nxt) == seen.end()) {
            dfsHelper(nxt, graph, seen, order);
        }
    }
}

vector<int> dfs(vector<vector<int>>& graph, int start) {
    unordered_set<int> seen;
    vector<int> order;
    dfsHelper(start, graph, seen, order);
    return order;
}`,
      java: `import java.util.*;

public static void dfsHelper(int node, int[][] graph, Set<Integer> seen, List<Integer> order) {
    seen.add(node);
    order.add(node);
    for (int nxt : graph[node]) {
        if (!seen.contains(nxt)) {
            dfsHelper(nxt, graph, seen, order);
        }
    }
}

public static List<Integer> dfs(int[][] graph, int start) {
    Set<Integer> seen = new HashSet<>();
    List<Integer> order = new ArrayList<>();
    dfsHelper(start, graph, seen, order);
    return order;
}`,
    },
    input: { kind: "variables", values: { graph: [[1, 2], [0, 3, 4], [0], [1], [1]], start: 0 } },
  },
];

export function getExample(slug: string): Example | undefined {
  return examples.find((e) => e.slug === slug);
}

export function getExampleCode(example: Example, language: SupportedLanguage): string {
  return example.code[language] ?? example.code.cpp;
}