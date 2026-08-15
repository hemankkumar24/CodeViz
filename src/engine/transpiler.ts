/**
 * Transpiler — Converts C++ and Java into standard JavaScript
 * for the step-by-step AST execution engine.
 */

import type { SupportedLanguage } from "@/types/languages";

/* ============================== Public API =============================== */

export function detectCodeLanguage(code: string): SupportedLanguage {
  const trimmed = code.trim();
  if (!trimmed) return "cpp";

  // C++ specific indicators
  if (
    trimmed.includes("#include") ||
    trimmed.includes("using namespace") ||
    trimmed.includes("vector<") ||
    trimmed.includes("pair<") ||
    trimmed.includes("cout <<") ||
    trimmed.includes("cin >>") ||
    trimmed.includes("std::") ||
    trimmed.includes("push_back") ||
    /class\s+\w+\s*\{\s*public\s*:/.test(trimmed)
  ) {
    return "cpp";
  }

  // Java specific indicators
  if (
    trimmed.includes("public static") ||
    trimmed.includes("public class") ||
    trimmed.includes("System.out") ||
    trimmed.includes("ArrayList<") ||
    trimmed.includes("HashSet<") ||
    trimmed.includes("HashMap<") ||
    trimmed.includes("Arrays.fill") ||
    trimmed.includes("Arrays.sort") ||
    trimmed.includes("Collections.") ||
    trimmed.includes("Integer.MIN_VALUE") ||
    trimmed.includes("Integer.MAX_VALUE") ||
    /public\s+(?:static\s+)?(?:int|void|boolean|String|double|long|List|Set|Map)\b/.test(trimmed) ||
    /import\s+java\./.test(trimmed)
  ) {
    return "java";
  }

  return "cpp";
}

export function transpileToJS(code: string, language: SupportedLanguage): string {
  // If language looks like Java/C++, use appropriate transpiler
  const detected = detectCodeLanguage(code);
  const effectiveLang = (detected === "java" && language !== "java") || (detected === "cpp" && language !== "cpp")
    ? detected
    : language;

  if (effectiveLang === "java") {
    return transpileJava(code);
  }
  return transpileCpp(code);
}

/* ============================== Java → JS ================================ */

function transpileJava(code: string): string {
  const lines = code.split("\n");
  const result: string[] = [];
  let inClass = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]!;
    const trimmed = line.trim();

    // 1. Imports and annotations
    if (
      trimmed.startsWith("import ") ||
      trimmed.startsWith("package ") ||
      trimmed.startsWith("@Override") ||
      trimmed.startsWith("@SuppressWarnings")
    ) {
      result.push("");
      continue;
    }

    // 2. Class definition
    if (/^\s*(?:public\s+|private\s+|protected\s+)?class\s+(\w+)/.test(line)) {
      inClass = true;
      result.push(line.replace(/(?:public\s+|private\s+|protected\s+)?class\s+(\w+)/, "class $1"));
      continue;
    }

    if (inClass && trimmed === "}") {
      inClass = false;
      result.push("}");
      continue;
    }

    // 3. Method definition (both inside class and standalone)
    // Matches: public static int knapsack(...), public int[] solve(...), static void dfs(...), int fib(...)
    const methodMatch = /^\s*(?:(?:public|private|protected)\s+)?(?:static\s+)?(?:final\s+)?(?:(?:int|long|double|float|boolean|char|byte|short|void|String|Integer|Long|Double|Boolean|Object|(?:List|ArrayList|Set|HashSet|Map|HashMap|Queue|Deque|Stack)\s*<[^>]*>|int\[\](?:\[\])*|long\[\](?:\[\])*|double\[\](?:\[\])*|boolean\[\](?:\[\])*|String\[\](?:\[\])*))\s+(\w+)\s*\((.*?)\)\s*(?:throws\s+[\w,\s]+)?\s*\{?/.exec(line);

    if (methodMatch && !["if", "while", "for", "switch", "catch", "return"].includes(methodMatch[1]!)) {
      const fnName = methodMatch[1]!;
      const params = methodMatch[2]!;
      const cleanedParams = cleanJavaParams(params);
      if (inClass) {
        result.push(`    ${fnName}(${cleanedParams}) {`);
      } else {
        result.push(`function ${fnName}(${cleanedParams}) {`);
      }
      continue;
    }

    // 4. Return new expressions
    line = line.replace(/return\s+new\s+(?:int|long|double|boolean|String)\[\]\s*\{([^}]+)\};/g, "return [$1];");
    line = line.replace(/return\s+new\s+(?:int|long|double|boolean|String)\[0\];/g, "return [];");
    line = line.replace(/return\s+new\s+ArrayList<[^>]*>\((\w+)\);/g, "return Array.from($1);");
    line = line.replace(/return\s+new\s+HashSet<[^>]*>\((\w+)\);/g, "return new Set($1);");

    // 5. 2D DP Array: int[][] dp = new int[n + 1][capacity + 1];
    if (/(?:int|long|double|boolean|String)\[\]\[\]\s+(\w+)\s*=\s*new\s+(?:int|long|double|boolean|String)\[(.+?)\]\[(.+?)\];/.test(line)) {
      line = line.replace(
        /(?:int|long|double|boolean|String)\[\]\[\]\s+(\w+)\s*=\s*new\s+(?:int|long|double|boolean|String)\[(.+?)\]\[(.+?)\];/,
        (_, name, rows, cols) => {
          const isBool = line.includes("boolean");
          const fill = isBool ? "false" : "0";
          return `let ${name} = Array.from({length: ${rows}}, () => new Array(${cols}).fill(${fill}));`;
        },
      );
      result.push(line);
      continue;
    }

    // 6. 1D DP Array: int[] dp = new int[n + 1];
    if (/(?:int|long|double|boolean|String)\[\]\s+(\w+)\s*=\s*new\s+(?:int|long|double|boolean|String)\[(.+?)\];/.test(line)) {
      line = line.replace(
        /(?:int|long|double|boolean|String)\[\]\s+(\w+)\s*=\s*new\s+(?:int|long|double|boolean|String)\[(.+?)\];/,
        (_, name, size) => {
          const isBool = line.includes("boolean");
          const fill = isBool ? "false" : "0";
          return `let ${name} = new Array(${size}).fill(${fill});`;
        },
      );
      result.push(line);
      continue;
    }

    // 7. Array literals: int[] nums = {1, 2, 3}; or new int[]{1, 2, 3};
    if (/(?:int|long|double|boolean|String)\[\](?:\[\])*\s+(\w+)\s*=\s*(?:new\s+[\w\[\]]+\s*)?\{([^}]+)\};/.test(line)) {
      line = line.replace(
        /(?:int|long|double|boolean|String)\[\](?:\[\])*\s+(\w+)\s*=\s*(?:new\s+[\w\[\]]+\s*)?\{([^}]+)\};/,
        "let $1 = [$2];",
      );
      result.push(line);
      continue;
    }

    // 8. Collections Instantiations
    // List / Queue / Deque
    if (/(?:List|ArrayList|LinkedList|Queue|Deque|ArrayDeque|Stack|PriorityQueue)<[^>]*>\s+(\w+)\s*=\s*new\s+[\w<>]*\(\);/.test(line)) {
      line = line.replace(
        /(?:List|ArrayList|LinkedList|Queue|Deque|ArrayDeque|Stack|PriorityQueue)<[^>]*>\s+(\w+)\s*=\s*new\s+[\w<>]*\(\);/,
        "let $1 = [];",
      );
      result.push(line);
      continue;
    }

    // Set / HashSet
    if (/(?:Set|HashSet|TreeSet)<[^>]*>\s+(\w+)\s*=\s*new\s+[\w<>]*\(\);/.test(line)) {
      line = line.replace(/(?:Set|HashSet|TreeSet)<[^>]*>\s+(\w+)\s*=\s*new\s+[\w<>]*\(\);/, "let $1 = new Set();");
      result.push(line);
      continue;
    }

    // Map / HashMap
    if (/(?:Map|HashMap|TreeMap)<[^>]*>\s+(\w+)\s*=\s*new\s+[\w<>]*\(\);/.test(line)) {
      line = line.replace(/(?:Map|HashMap|TreeMap)<[^>]*>\s+(\w+)\s*=\s*new\s+[\w<>]*\(\);/, "let $1 = new Map();");
      result.push(line);
      continue;
    }

    // 9. Enhanced for loop: for (int nxt : graph[node])
    if (/for\s*\(\s*(?:final\s+)?(?:int|long|double|boolean|String|Integer|Long|var)\s+(\w+)\s*:\s*(.+?)\)/.test(line)) {
      line = line.replace(
        /for\s*\(\s*(?:final\s+)?(?:int|long|double|boolean|String|Integer|Long|var)\s+(\w+)\s*:\s*(.+?)\)/,
        "for (const $1 of $2)",
      );
    }

    // 10. Standard for loop: for (int i = 0; ...)
    line = line.replace(/for\s*\(\s*(?:int|long|double|var)\s+/g, "for (let ");

    // 11. Variable declarations: int currentSum = nums[0], maxSum = nums[0];
    line = line.replace(
      /^\s*(?:final\s+)?(?:int|long|double|float|boolean|char|String|var|Integer|Long|Double|Boolean)\s+([^;]+);/,
      "let $1;",
    );

    // 12. Integer mid calculation: left + (right - left) / 2 -> Math.floor(...)
    line = line.replace(/=\s*\((\w+\s*[+\-]\s*\w+)\)\s*\/\s*2;/g, "= Math.floor(($1) / 2);");
    line = line.replace(/=\s*(\w+)\s*\+\s*\((\w+\s*-\s*\w+)\)\s*\/\s*2;/g, "= $1 + Math.floor(($2) / 2);");

    // 13. System.out replacements
    line = line.replace(/System\.out\.println\((.*?)\);/g, "console.log($1);");
    line = line.replace(/System\.out\.print\((.*?)\);/g, "console.log($1);");

    // 14. Arrays & Collections helper replacements
    line = line.replace(/Arrays\.fill\((\w+),\s*(.+?)\);/g, "$1.fill($2);");
    line = line.replace(/Arrays\.sort\((\w+)\);/g, "$1.sort((a, b) => a - b);");
    line = line.replace(/Collections\.sort\((\w+)\);/g, "$1.sort((a, b) => a - b);");
    line = line.replace(/Collections\.max\((\w+)\)/g, "Math.max(...$1)");
    line = line.replace(/Collections\.min\((\w+)\)/g, "Math.min(...$1)");
    line = line.replace(/Collections\.reverse\((\w+)\);/g, "$1.reverse();");

    // 15. Java Collection methods
    line = line.replace(/\.size\(\)/g, ".length");
    line = line.replace(/\.length\(\)/g, ".length");
    line = line.replace(/\.contains\(/g, ".has(");
    line = line.replace(/\.containsKey\(/g, ".has(");
    line = line.replace(/\.put\(/g, ".set(");
    line = line.replace(/\.poll\(\)/g, ".shift()");
    line = line.replace(/\.remove\(0\)/g, ".shift()");
    line = line.replace(/!\s*(\w+)\.isEmpty\(\)/g, "$1.length > 0");
    line = line.replace(/\.isEmpty\(\)/g, ".length === 0");

    result.push(line);
  }

  return result.join("\n");
}

function cleanJavaParams(params: string): string {
  if (!params.trim()) return "";
  return splitTopLevelCommas(params).map((p) => {
    const trimmed = p.trim().replace(/^final\s+/, "");
    const words = trimmed.split(/\s+/).filter(Boolean);
    return words[words.length - 1]!;
  }).join(", ");
}

/* ============================== C++ → JS ================================= */

function transpileCpp(code: string): string {
  const lines = code.split("\n");
  const result: string[] = [];
  let inClass = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]!;
    const trimmed = line.trim();

    // 1. Includes and namespaces
    if (
      trimmed.startsWith("#include") ||
      trimmed.startsWith("using namespace") ||
      trimmed.startsWith("using std::") ||
      trimmed.startsWith("#pragma")
    ) {
      result.push("");
      continue;
    }

    if (/^\s*(public|private|protected)\s*:\s*$/.test(line)) {
      continue;
    }

    // 2. Class / Struct definition
    if (/^\s*(?:class|struct)\s+\w+/.test(line)) {
      inClass = true;
      result.push(line.replace(/(?:class|struct)\s+(\w+)/, "class $1"));
      continue;
    }
    if (trimmed === "};" || (inClass && trimmed === "}")) {
      inClass = false;
      result.push("}");
      continue;
    }

    // 3. Return with curly initializer list: return {mid, steps}; or return {-1, steps}; return {};
    if (/return\s*\{([^}]*)\};/.test(line)) {
      line = line.replace(/return\s*\{([^}]*)\};/, "return [$1];");
      result.push(line);
      continue;
    }

    // 4. 2D DP vector: vector<vector<int>> dp(n + 1, vector<int>(capacity + 1, 0)); or without fill value
    if (/vector\s*<\s*vector\s*<[^>]+>\s*>\s+(\w+)\s*\((.+?),\s*vector\s*<[^>]+>\s*\((.+?)\)\);/.test(line)) {
      line = line.replace(
        /vector\s*<\s*vector\s*<[^>]+>\s*>\s+(\w+)\s*\((.+?),\s*vector\s*<[^>]+>\s*\((.+?)\)\);/,
        (_, name, rows, inner) => {
          const innerParts = splitTopLevelCommas(inner);
          const cols = innerParts[0]!;
          const fill = innerParts.length > 1 ? innerParts[1]! : "0";
          return `let ${name} = Array.from({length: ${rows}}, () => new Array(${cols}).fill(${fill}));`;
        },
      );
      result.push(line);
      continue;
    }

    // 5. 1D DP vector: vector<int> dp(n + 1); or vector<int> dp(n + 1, 0);
    if (/vector\s*<[^>]+>\s+(\w+)\s*\((.+?)\);/.test(line)) {
      line = line.replace(
        /vector\s*<[^>]+>\s+(\w+)\s*\((.+?)\);/,
        (_, name, args) => {
          const parts = splitTopLevelCommas(args);
          if (parts.length === 1) {
            return `let ${name} = new Array(${parts[0]}).fill(0);`;
          } else {
            return `let ${name} = new Array(${parts[0]}).fill(${parts[1]});`;
          }
        },
      );
      line = line.replace(/\.size\(\)/g, ".length");
      result.push(line);
      continue;
    }

    // 6. Initializer list vector / set: vector<int> queue = {start}; or unordered_set<int> seen = {start};
    if (/(?:vector<[^>]+>|unordered_set<[^>]+>|set<[^>]+>|unordered_map<[^>]+>|map<[^>]+>|pair<[^>]+>)\s+(\w+)\s*=\s*\{([^}]+)\};/.test(line)) {
      if (line.includes("unordered_set") || line.includes("set<")) {
        line = line.replace(/(?:unordered_set<[^>]+>|set<[^>]+>)\s+(\w+)\s*=\s*\{([^}]+)\};/, "let $1 = new Set([$2]);");
      } else if (line.includes("map")) {
        line = line.replace(/(?:unordered_map<[^>]+>|map<[^>]+>)\s+(\w+)\s*=\s*\{([^}]+)\};/, "let $1 = new Map([$2]);");
      } else {
        line = line.replace(/(?:vector<[^>]+>|pair<[^>]+>)\s+(\w+)\s*=\s*\{([^}]+)\};/, "let $1 = [$2];");
      }
      result.push(line);
      continue;
    }

    // 7. Empty containers: vector, queue, stack, deque, unordered_set, set, unordered_map, map
    if (/vector\s*<[^>]+>\s+(\w+);/.test(line)) {
      line = line.replace(/vector\s*<[^>]+>\s+(\w+);/, "let $1 = [];");
      result.push(line);
      continue;
    }
    if (/(?:queue|stack|deque|priority_queue)\s*<[^>]+>\s+(\w+);/.test(line)) {
      line = line.replace(/(?:queue|stack|deque|priority_queue)\s*<[^>]+>\s+(\w+);/, "let $1 = [];");
      result.push(line);
      continue;
    }
    if (/(?:unordered_set|set)\s*<[^>]+>\s+(\w+);/.test(line)) {
      line = line.replace(/(?:unordered_set|set)\s*<[^>]+>\s+(\w+);/, "let $1 = new Set();");
      result.push(line);
      continue;
    }
    if (/(?:unordered_map|map)\s*<[^>]+>\s+(\w+);/.test(line)) {
      line = line.replace(/(?:unordered_map|map)\s*<[^>]+>\s+(\w+);/, "let $1 = new Map();");
      result.push(line);
      continue;
    }

    // 8. C-style 1D / 2D arrays: int dp[n + 1]; or int dp[n + 1][m + 1];
    if (/^\s*(?:int|bool|double|float|long|long\s+long)\s+(\w+)\s*\[(.+?)\]\s*\[(.+?)\];/.test(line)) {
      line = line.replace(
        /^\s*(?:int|bool|double|float|long|long\s+long)\s+(\w+)\s*\[(.+?)\]\s*\[(.+?)\];/,
        "let $1 = Array.from({length: $2}, () => new Array($3).fill(0));",
      );
      result.push(line);
      continue;
    }
    if (/^\s*(?:int|bool|double|float|long|long\s+long)\s+(\w+)\s*\[(.+?)\];/.test(line)) {
      line = line.replace(
        /^\s*(?:int|bool|double|float|long|long\s+long)\s+(\w+)\s*\[(.+?)\];/,
        "let $1 = new Array($2).fill(0);",
      );
      result.push(line);
      continue;
    }

    // 9. Function or Method header: vector<int> insertionSort(...) { or pair<int, int> searchWithLimits(...) {
    const fnMatch = /^\s*(?:(?:virtual|inline|static|const)\s+)*(?:vector<[^>]+>|pair<[^>]+>|tuple<[^>]+>|unordered_set<[^>]+>|set<[^>]+>|unordered_map<[^>]+>|map<[^>]+>|queue<[^>]+>|stack<[^>]+>|int|long\s+long|long|void|bool|string|double|float|size_t|auto)\s+(\w+)\s*\((.*?)\)\s*\{?/.exec(line);

    if (fnMatch && !["if", "while", "for", "switch", "catch", "return"].includes(fnMatch[1]!)) {
      const fnName = fnMatch[1]!;
      const params = fnMatch[2]!;
      const cleanedParams = cleanCppParams(params);
      if (inClass) {
        result.push(`    ${fnName}(${cleanedParams}) {`);
      } else {
        result.push(`function ${fnName}(${cleanedParams}) {`);
      }
      continue;
    }

    // 10. Range-based for loop: for (int nxt : graph[node])
    if (/for\s*\(\s*(?:int|long\s+long|long|auto|const\s+auto&?)\s+(\w+)\s*:\s*(.+?)\)/.test(line)) {
      line = line.replace(
        /for\s*\(\s*(?:int|long\s+long|long|auto|const\s+auto&?)\s+(\w+)\s*:\s*(.+?)\)/,
        "for (const $1 of $2)",
      );
    }

    // 11. Variable declarations: int currentSum = nums[0], maxSum = nums[0];
    line = line.replace(
      /^\s*(?:int|long\s+long|long|double|float|bool|char|string|auto|size_t|pair<[^>]+>)\s+([^;]+);/,
      "let $1;",
    );

    // 12. For loops: for (int i = 1; i < nums.size(); i++)
    line = line.replace(/for\s*\(\s*(?:int|long\s+long|long|size_t|auto)\s+/g, "for (let ");

    // 13. Integer mid calculation: (left + right) / 2 -> Math.floor((left + right) / 2)
    line = line.replace(/=\s*\((\w+\s*[+\-]\s*\w+)\)\s*\/\s*2;/g, "= Math.floor(($1) / 2);");
    line = line.replace(/=\s*(\w+)\s*\+\s*\((\w+\s*-\s*\w+)\)\s*\/\s*2;/g, "= $1 + Math.floor(($2) / 2);");

    // 14. Return vector conversion: return vector<int>(seen.begin(), seen.end());
    line = line.replace(/return\s+vector<[^>]+>\((\w+)\.begin\(\),\s*\1\.end\(\)\);/g, "return Array.from($1);");

    // 15. Standard C++ STL method replacements
    line = line.replace(/\.size\(\)/g, ".length");
    line = line.replace(/\.length\(\)/g, ".length");
    line = line.replace(/\.push_back\(/g, ".push(");
    line = line.replace(/\.insert\(/g, ".add(");

    // seen.find(nxt) == seen.end()
    line = line.replace(/(\w+)\.find\((.+?)\)\s*==\s*\1\.end\(\)/g, "!$1.has($2)");
    line = line.replace(/(\w+)\.find\((.+?)\)\s*!=\s*\1\.end\(\)/g, "$1.has($2)");

    // *max_element(dp.begin(), dp.end()) -> Math.max(...dp)
    line = line.replace(/\*max_element\((\w+)\.begin\(\),\s*\1\.end\(\)\)/g, "Math.max(...$1)");
    line = line.replace(/\*min_element\((\w+)\.begin\(\),\s*\1\.end\(\)\)/g, "Math.min(...$1)");

    // cout << ... << endl;
    if (line.includes("cout <<")) {
      line = line.replace(/cout\s*<<\s*(.+?)\s*<<\s*endl;/g, "console.log($1);");
      line = line.replace(/cout\s*<<\s*(.+?);/g, "console.log($1);");
    }

    // swap(nums[i], nums[j]) or std::swap(...) or swap(a, b)
    if (/(?:std::)?swap\s*\((.+?),\s*(.+?)\);/.test(line)) {
      line = line.replace(/(?:std::)?swap\s*\((.+?),\s*(.+?)\);/, "[$1, $2] = [$2, $1];");
    }

    // max / min / abs
    line = line.replace(/(?<!Math\.)\bmax\(/g, "Math.max(");
    line = line.replace(/(?<!Math\.)\bmin\(/g, "Math.min(");
    line = line.replace(/(?<!Math\.)\babs\(/g, "Math.abs(");

    result.push(line);
  }

  return result.join("\n");
}

function cleanCppParams(params: string): string {
  if (!params.trim()) return "";
  return splitTopLevelCommas(params).map((p) => {
    const trimmed = p.trim();
    const words = trimmed.replace(/[&*]/g, "").trim().split(/\s+/);
    return words[words.length - 1]!;
  }).join(", ");
}

/* ============================== Helpers ================================== */

function splitTopLevelCommas(str: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let current = "";

  for (let i = 0; i < str.length; i++) {
    const ch = str[i]!;
    if (ch === "(" || ch === "[" || ch === "{" || ch === "<") {
      depth++;
      current += ch;
    } else if (ch === ")" || ch === "]" || ch === "}" || ch === ">") {
      depth--;
      current += ch;
    } else if (ch === "," && depth === 0) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }

  if (current.trim()) result.push(current.trim());
  return result;
}
