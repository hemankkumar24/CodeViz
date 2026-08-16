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

    // 4. Any N-dimensional vector declaration (1D, 2D, 3D, 4D, etc. with or without constructor args)
    if (trimmed.startsWith("vector<") || /^\s*vector\s*</.test(line)) {
      const transpiledVec = transpileVectorDeclaration(line);
      if (transpiledVec) {
        let cleanVec = transpiledVec.replace(/\.size\(\)/g, ".length");
        result.push(cleanVec);
        continue;
      }
    }

    // 5. Initializer list vector / set: vector<int> queue = {start}; or unordered_set<int> seen = {start};
    if (/(?:vector\s*<[\s\S]*>|unordered_set\s*<[\s\S]*>|set\s*<[\s\S]*>|unordered_map\s*<[\s\S]*>|map\s*<[\s\S]*>|pair\s*<[\s\S]*>)\s+(\w+)\s*=\s*\{([^}]+)\};/.test(line)) {
      if (line.includes("unordered_set") || line.includes("set<")) {
        line = line.replace(/(?:unordered_set\s*<[\s\S]*>|set\s*<[\s\S]*>)\s+(\w+)\s*=\s*\{([^}]+)\};/, "let $1 = new Set([$2]);");
      } else if (line.includes("map")) {
        line = line.replace(/(?:unordered_map\s*<[\s\S]*>|map\s*<[\s\S]*>)\s+(\w+)\s*=\s*\{([^}]+)\};/, "let $1 = new Map([$2]);");
      } else {
        line = line.replace(/(?:vector\s*<[\s\S]*>|pair\s*<[\s\S]*>)\s+(\w+)\s*=\s*\{([^}]+)\};/, "let $1 = [$2];");
      }
      result.push(line);
      continue;
    }

    // 6. Empty containers: queue, stack, deque, unordered_set, set, unordered_map, map
    if (/(?:queue|stack|deque|priority_queue)\s*<[\s\S]*>\s+(\w+);/.test(line)) {
      line = line.replace(/(?:queue|stack|deque|priority_queue)\s*<[\s\S]*>\s+(\w+);/, "let $1 = [];");
      result.push(line);
      continue;
    }
    if (/(?:unordered_set|set)\s*<[\s\S]*>\s+(\w+);/.test(line)) {
      line = line.replace(/(?:unordered_set|set)\s*<[\s\S]*>\s+(\w+);/, "let $1 = new Set();");
      result.push(line);
      continue;
    }
    if (/(?:unordered_map|map)\s*<[\s\S]*>\s+(\w+);/.test(line)) {
      line = line.replace(/(?:unordered_map|map)\s*<[\s\S]*>\s+(\w+);/, "let $1 = new Map();");
      result.push(line);
      continue;
    }

    // 7. C-style 1D / 2D arrays: int dp[n + 1]; or int dp[n + 1][m + 1];
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

    // 8. Function or Method header (handles any return type including nested templates)
    const fnHeader = parseCppFunctionHeader(line);
    if (fnHeader) {
      const cleanedParams = cleanCppParams(fnHeader.params);
      if (inClass) {
        result.push(`    ${fnHeader.name}(${cleanedParams}) {`);
      } else {
        result.push(`function ${fnHeader.name}(${cleanedParams}) {`);
      }
      continue;
    }

    // 9. Range-based for loop: for (int nxt : graph[node])
    if (/for\s*\(\s*(?:int|long\s+long|long|auto|const\s+auto&?)\s+(\w+)\s*:\s*(.+?)\)/.test(line)) {
      line = line.replace(
        /for\s*\(\s*(?:int|long\s+long|long|auto|const\s+auto&?)\s+(\w+)\s*:\s*(.+?)\)/,
        "for (const $1 of $2)",
      );
    }

    // 10. Variable declarations: int currentSum = nums[0], maxSum = nums[0];
    line = line.replace(
      /^\s*(?:int|long\s+long|long|double|float|bool|char|string|auto|size_t|pair<[^>]+>)\s+([^;]+);/,
      "let $1;",
    );

    // 11. For loops: for (int i = 1; i < nums.size(); i++)
    line = line.replace(/for\s*\(\s*(?:int|long\s+long|long|size_t|auto)\s+/g, "for (let ");

    // 12. Integer mid calculation: (left + right) / 2 -> Math.floor((left + right) / 2)
    line = line.replace(/=\s*\((\w+\s*[+\-]\s*\w+)\)\s*\/\s*2;/g, "= Math.floor(($1) / 2);");
    line = line.replace(/=\s*\((\w+\s*-\s*\w+)\)\s*\/\s*2;/g, "= Math.floor(($1) / 2);");
    line = line.replace(/=\s*(\w+)\s*\+\s*\((\w+\s*-\s*\w+)\)\s*\/\s*2;/g, "= $1 + Math.floor(($2) / 2);");

    // 13. Return vector conversion: return vector<int>(seen.begin(), seen.end());
    line = line.replace(/return\s+vector<[\s\S]*>\((\w+)\.begin\(\),\s*\1\.end\(\)\);/g, "return Array.from($1);");

    // 14. Standard C++ STL method replacements
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

function parseVectorCall(str: string): { type: string; name?: string | undefined; args: string } | null {
  const trimmed = str.trim().replace(/;$/, "");
  if (!trimmed.startsWith("vector")) return null;

  let depth = 0;
  let angleEnd = -1;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i]!;
    if (ch === "<") {
      depth++;
    } else if (ch === ">") {
      depth--;
      if (depth === 0) {
        angleEnd = i;
        break;
      }
    }
  }
  if (angleEnd === -1) return null;

  const type = trimmed.slice(0, angleEnd + 1).trim();
  const rest = trimmed.slice(angleEnd + 1).trim();

  const openParen = rest.indexOf("(");
  if (openParen === -1) {
    return { type, name: rest.trim(), args: "" };
  }

  const name = rest.slice(0, openParen).trim();
  const closeParen = rest.lastIndexOf(")");
  if (closeParen === -1) return null;

  const args = rest.slice(openParen + 1, closeParen).trim();
  return { type, name: name || undefined, args };
}

function transpileVectorExpr(expr: string): string {
  const parsed = parseVectorCall(expr);
  if (!parsed) return expr;
  if (!parsed.args) return "[]";

  const parts = splitTopLevelCommas(parsed.args);
  if (parts.length === 0) return "[]";

  const dim = parts[0]!;
  if (parts.length === 1) return `new Array(${dim}).fill(0)`;

  const second = parts[1]!;
  if (second.startsWith("vector")) {
    const nested = transpileVectorExpr(second);
    return `Array.from({length: ${dim}}, () => ${nested})`;
  }

  return `new Array(${dim}).fill(${second})`;
}

function transpileVectorDeclaration(line: string): string | null {
  const parsed = parseVectorCall(line);
  if (!parsed || !parsed.name) return null;

  if (!parsed.args) {
    return `let ${parsed.name} = [];`;
  }

  const parts = splitTopLevelCommas(parsed.args);
  if (parts.length === 0) return `let ${parsed.name} = [];`;

  const dim = parts[0]!;
  if (parts.length === 1) return `let ${parsed.name} = new Array(${dim}).fill(0);`;

  const second = parts[1]!;
  if (second.startsWith("vector")) {
    const nested = transpileVectorExpr(second);
    return `let ${parsed.name} = Array.from({length: ${dim}}, () => ${nested});`;
  }

  return `let ${parsed.name} = new Array(${dim}).fill(${second});`;
}

function parseCppFunctionHeader(line: string): { name: string; params: string } | null {
  const trimmed = line.trim();
  if (/^(?:if|while|for|switch|catch|return)\b/.test(trimmed)) return null;

  const openParen = trimmed.indexOf("(");
  if (openParen === -1) return null;

  const prefix = trimmed.slice(0, openParen).trim();
  const rest = trimmed.slice(openParen);
  const closeParen = rest.lastIndexOf(")");
  if (closeParen === -1) return null;

  const params = rest.slice(1, closeParen);

  const nameMatch = /([A-Za-z_]\w*)$/.exec(prefix);
  if (!nameMatch) return null;

  const name = nameMatch[1]!;
  if (["if", "while", "for", "switch", "catch", "return", "class", "struct"].includes(name)) {
    return null;
  }

  const returnTypePart = prefix.slice(0, prefix.length - name.length).trim();
  if (!returnTypePart) return null;

  return { name, params };
}
