/**
 * Transpiler — converts Python, C++, Java, and TypeScript into standard JavaScript
 * for the step-by-step AST interpreter.
 */

import type { SupportedLanguage } from "@/types/languages";

/* ============================== Public API =============================== */

export function detectCodeLanguage(code: string): SupportedLanguage | null {
  const trimmed = code.trim();
  if (!trimmed) return null;

  // Python indicators (prioritize over C++ to avoid false positives on `-> Type:` annotations)
  if (
    trimmed.includes("def ") ||
    trimmed.includes("elif ") ||
    trimmed.includes("self.") ||
    trimmed.includes("class Solution:") ||
    trimmed.includes("in range(") ||
    trimmed.includes("import sys")
  ) {
    return "python";
  }

  // C++ indicators
  if (
    trimmed.includes("#include") ||
    trimmed.includes("using namespace") ||
    trimmed.includes("vector<") ||
    trimmed.includes("pair<") ||
    trimmed.includes("std::") ||
    trimmed.includes("unordered_set<") ||
    trimmed.includes("unordered_map<") ||
    trimmed.includes("cout <<") ||
    /class\s+\w+\s*\{\s*public\s*:/.test(trimmed)
  ) {
    return "cpp";
  }

  // Java indicators
  if (
    trimmed.includes("public class") ||
    trimmed.includes("System.out.print") ||
    trimmed.includes("ArrayList<") ||
    trimmed.includes("HashSet<") ||
    trimmed.includes("Arrays.fill") ||
    /public\s+(?:static\s+)?(?:int|void|boolean|String|double)/.test(trimmed)
  ) {
    return "java";
  }

  // TypeScript indicators
  if (
    trimmed.includes(": number[]") ||
    trimmed.includes(": number") ||
    trimmed.includes(": string") ||
    trimmed.includes(": boolean") ||
    trimmed.includes(": void") ||
    trimmed.includes("interface ") ||
    trimmed.includes("type ")
  ) {
    return "typescript";
  }

  return null;
}

export function transpileToJS(code: string, language: SupportedLanguage): string {
  // If the code clearly belongs to a different language than the selected one,
  // auto-detect and transpile properly to avoid syntax errors.
  const autoDetected = detectCodeLanguage(code);
  const effectiveLang = autoDetected && autoDetected !== language ? autoDetected : language;

  switch (effectiveLang) {
    case "python":
      return transpilePython(code);
    case "cpp":
      return transpileCpp(code);
    case "java":
      return transpileJava(code);
    case "typescript":
      return stripTypeScript(code);
    case "javascript":
    default:
      return code;
  }
}

/* ============================= Python → JS =============================== */

function transpilePython(code: string): string {
  const lines = code.split("\n");
  const result: string[] = [];
  const indentStack: number[] = [0];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]!;
    const stripped = rawLine.trimStart();
    const indent = rawLine.length - stripped.length;

    if (!stripped) {
      result.push("");
      continue;
    }

    if (stripped.startsWith("#")) {
      result.push(" ".repeat(indent) + "// " + stripped.slice(1));
      continue;
    }

    // Dedent
    while (indentStack.length > 1 && indent < indentStack[indentStack.length - 1]!) {
      indentStack.pop();
      result.push(" ".repeat(indentStack[indentStack.length - 1]!) + "}");
    }

    let jsLine = stripped;

    // 1. Class definition: class Solution:
    if (/^class\s+\w+/.test(jsLine)) {
      jsLine = jsLine.replace(/^class\s+(\w+)\s*(?:\(.*\))?\s*:\s*$/, "class $1 {");
      indentStack.push(indent + 4);
      result.push(" ".repeat(indent) + jsLine);
      continue;
    }

    // 2. Method definition: def func(self, ...):
    if (/^def\s+\w+\s*\(self/.test(jsLine)) {
      jsLine = jsLine.replace(/^def\s+(\w+)\s*\(self(?:,\s*)?/, "$1(");
      jsLine = jsLine.replace(/\)\s*(?:->\s*[^:]+)?\s*:\s*$/, ") {");
      jsLine = stripPythonTypeHintsInParams(jsLine);
      indentStack.push(indent + 4);
      result.push(" ".repeat(indent) + jsLine);
      continue;
    }

    // 3. Standalone function definition: def func(...):
    if (/^def\s+\w+/.test(jsLine)) {
      jsLine = jsLine.replace(/^def\s+(\w+)\s*\(/, "function $1(");
      jsLine = jsLine.replace(/\)\s*(?:->\s*[^:]+)?\s*:\s*$/, ") {");
      jsLine = stripPythonTypeHintsInParams(jsLine);
      indentStack.push(indent + 4);
      result.push(" ".repeat(indent) + jsLine);
      continue;
    }

    // 4. if / elif / else
    if (/^if\s+/.test(jsLine)) {
      const cond = jsLine.replace(/^if\s+/, "").replace(/:\s*$/, "");
      jsLine = `if (${transformPythonExpr(cond)}) {`;
      indentStack.push(indent + 4);
    } else if (/^elif\s+/.test(jsLine)) {
      const cond = jsLine.replace(/^elif\s+/, "").replace(/:\s*$/, "");
      jsLine = `else if (${transformPythonExpr(cond)}) {`;
      indentStack.push(indent + 4);
    } else if (/^else\s*:/.test(jsLine)) {
      jsLine = "else {";
      indentStack.push(indent + 4);
    }

    // 5. for loop with range: for i in range(...)
    else if (/^for\s+\w+\s+in\s+range\(/.test(jsLine)) {
      const match = /^for\s+(\w+)\s+in\s+range\((.+)\)\s*:\s*$/.exec(jsLine);
      if (match) {
        const varName = match[1]!;
        const args = splitTopLevelCommas(match[2]!).map((s) => s.trim());
        let start = "0", end = args[0]!, step = "1";
        if (args.length === 2) {
          start = args[0]!;
          end = args[1]!;
        } else if (args.length >= 3) {
          start = args[0]!;
          end = args[1]!;
          step = args[2]!;
        }
        const startTr = transformPythonExpr(start);
        const endTr = transformPythonExpr(end);
        const stepNum = Number(step);
        const cmp = stepNum < 0 ? ">" : "<";
        const update = step === "1" ? `${varName}++` : step === "-1" ? `${varName}--` : `${varName} += ${step}`;
        jsLine = `for (let ${varName} = ${startTr}; ${varName} ${cmp} ${endTr}; ${update}) {`;
        indentStack.push(indent + 4);
      }
    }

    // 6. for item in iterable:
    else if (/^for\s+.+?\s+in\s+.+?:\s*$/.test(jsLine)) {
      const match = /^for\s+(.+?)\s+in\s+(.+?)\s*:\s*$/.exec(jsLine);
      if (match) {
        const target = match[1]!.trim();
        const iter = transformPythonExpr(match[2]!.trim());
        jsLine = `for (const ${target} of ${iter}) {`;
        indentStack.push(indent + 4);
      }
    }

    // 7. while loop: while cond:
    else if (/^while\s+/.test(jsLine)) {
      let cond = jsLine.replace(/^while\s+/, "").replace(/:\s*$/, "").trim();
      if (/^[A-Za-z_]\w*$/.test(cond)) {
        cond = `${cond}.length`;
      } else {
        cond = transformPythonExpr(cond);
      }
      jsLine = `while (${cond}) {`;
      indentStack.push(indent + 4);
    }

    // 8. General statements
    else {
      jsLine = transformPythonStatement(jsLine);
    }

    result.push(" ".repeat(indent) + jsLine);
  }

  while (indentStack.length > 1) {
    indentStack.pop();
    result.push(" ".repeat(indentStack[indentStack.length - 1]!) + "}");
  }

  return result.join("\n");
}

function stripPythonTypeHintsInParams(line: string): string {
  return line.replace(/\(([^)]*)\)/, (_, params: string) => {
    if (!params.trim()) return "()";
    const cleaned = splitTopLevelCommas(params).map((p) => {
      let param = p.trim();
      if (param.includes(":")) {
        const colonIdx = param.indexOf(":");
        const name = param.slice(0, colonIdx).trim();
        const rest = param.slice(colonIdx + 1);
        if (rest.includes("=")) {
          const eqIdx = rest.indexOf("=");
          const defaultVal = rest.slice(eqIdx + 1).trim();
          param = `${name} = ${transformPythonExpr(defaultVal)}`;
        } else {
          param = name;
        }
      }
      return param;
    });
    return `(${cleaned.join(", ")})`;
  });
}

function transformPythonStatement(stmt: string): string {
  let s = stmt.trim();

  if (s.startsWith("return ")) {
    return `return ${transformPythonExpr(s.slice(7))};`;
  }
  if (s === "return") return "return;";

  if (/^(\w+)\s*=\s*(\w+)\s*=\s*(.+)$/.test(s)) {
    const m = /^(\w+)\s*=\s*(\w+)\s*=\s*(.+)$/.exec(s)!;
    const v1 = m[1]!, v2 = m[2]!, expr = transformPythonExpr(m[3]!);
    return `let ${v1} = ${expr}; let ${v2} = ${v1};`;
  }

  if (/^([\w,\s]+)=\s*(.+)$/.test(s) && s.includes(",")) {
    const parts = s.split("=");
    const lhs = parts[0]!.trim();
    const rhs = parts.slice(1).join("=").trim();
    if (lhs.includes(",")) {
      const vars = lhs.split(",").map((v) => v.trim());
      const vals = splitTopLevelCommas(rhs).map((v) => transformPythonExpr(v.trim()));
      if (vars.length === vals.length) {
        return vars.map((v, i) => `let ${v} = ${vals[i]};`).join(" ");
      }
    }
  }

  const dp2dMatch = /^(\w+)\s*=\s*\[\[(.+?)\]\s*\*\s*\((.+?)\)\s*for\s+_\s+in\s+range\((.+?)\)\]/.exec(s);
  if (dp2dMatch) {
    const varName = dp2dMatch[1]!;
    const fillVal = transformPythonExpr(dp2dMatch[2]!);
    const cols = transformPythonExpr(dp2dMatch[3]!);
    const rows = transformPythonExpr(dp2dMatch[4]!);
    return `let ${varName} = Array.from({length: ${rows}}, () => new Array(${cols}).fill(${fillVal}));`;
  }

  const dp1dMatch = /^(\w+)\s*=\s*\[(.+?)\]\s*\*\s*(.+)$/.exec(s);
  if (dp1dMatch) {
    const varName = dp1dMatch[1]!;
    const fillVal = transformPythonExpr(dp1dMatch[2]!);
    const lenExpr = transformPythonExpr(dp1dMatch[3]!);
    return `let ${varName} = new Array(${lenExpr}).fill(${fillVal});`;
  }

  if (/^(\w+(?:\[.*?\])*)\s*([+\-*/%]?=)\s*(.+)$/.test(s)) {
    const m = /^(\w+(?:\[.*?\])*)\s*([+\-*/%]?=)\s*(.+)$/.exec(s)!;
    const target = m[1]!;
    const op = m[2]!;
    const expr = transformPythonExpr(m[3]!);
    return `${target} ${op} ${expr};`;
  }

  return transformPythonExpr(s) + ";";
}

function transformPythonExpr(expr: string): string {
  let s = expr.trim();

  while (s.includes("//")) {
    s = s.replace(/(\([^)]+\)|[\w.[\]]+)\s*\/\/\s*(\([^)]+\)|[\w.[\]]+)/, (_, a, b) => `Math.floor(${a} / ${b})`);
    if (s.includes("//")) {
      s = s.replace("//", "/");
      break;
    }
  }

  s = s.replace(/\bTrue\b/g, "true");
  s = s.replace(/\bFalse\b/g, "false");
  s = s.replace(/\bNone\b/g, "null");
  s = s.replace(/\bself\./g, "this.");
  s = s.replace(/\bis\s+not\s+None\b/g, "!= null");
  s = s.replace(/\bis\s+None\b/g, "== null");
  s = s.replace(/\bis\s+null\b/g, "== null");
  s = s.replace(/\blen\((\w+(?:\[.*?\])*)\)/g, "$1.length");

  s = s.replace(/(\w+)\[:([^\]]+)\]/g, "$1.slice(0, $2)");
  s = s.replace(/(\w+)\[([^\]:]+):\]/g, "$1.slice($2)");
  s = s.replace(/(\w+)\[([^\]:]+):([^\]:]+)\]/g, "$1.slice($2, $3)");

  s = s.replace(/\bsum\((.+?)\)/g, "($1).reduce((a, b) => a + b, 0)");
  s = s.replace(/\bset\(\)/g, "new Set()");
  s = s.replace(/\{(\w+)\}/g, "new Set([$1])");
  s = s.replace(/\blist\((\w+)\)/g, "Array.from($1)");
  s = s.replace(/\.append\(/g, ".push(");
  s = s.replace(/\.pop\(0\)/g, ".shift()");
  s = s.replace(/(\w+(?:\[.*?\])?)\s+not\s+in\s+(\w+)/g, "!$2.has($1)");
  s = s.replace(/(\w+(?:\[.*?\])?)\s+in\s+(\w+)/g, "$2.has($1)");

  s = s.replace(/(?<!Math\.)\bmax\(/g, "Math.max(");
  s = s.replace(/(?<!Math\.)\bmin\(/g, "Math.min(");
  s = s.replace(/(?<!Math\.)\babs\(/g, "Math.abs(");

  s = s.replace(/\band\b/g, "&&");
  s = s.replace(/\bor\b/g, "||");
  s = s.replace(/\bnot\s+/g, "!");

  return s;
}

/* ========================= TypeScript → JS =============================== */

function stripTypeScript(code: string): string {
  let result = code;

  // Remove interfaces / types
  result = result.replace(/^\s*(?:export\s+)?(?:interface|type)\s+\w+[\s\S]*?;\s*$/gm, "");

  // Remove `as Type` assertions
  result = result.replace(/\bas\s+[A-Za-z0-9_\[\]]+(?:<.*?>)?/g, "");

  // Remove non-null assertions like `shift()!` or `x!`
  result = result.replace(/([A-Za-z0-9_)\]])!/g, "$1");

  // Remove generic type parameters on new expressions: `new Set<number>()` -> `new Set()`
  result = result.replace(/new\s+(\w+)<[A-Za-z0-9_,\s\[\]]+>\(/g, "new $1(");

  // Remove variable type annotations: `const order: number[] = [];` -> `let order = [];`
  result = result.replace(/(?:const|let|var)\s+(\w+)\s*:\s*[A-Za-z0-9_\[\]<>|&,\s]+\s*=/g, "let $1 =");

  // Remove return type annotations: `): number[] {` -> `) {`
  result = result.replace(/\)\s*:\s*[A-Za-z0-9_\[\]<>|&,\s]+\s*(?=[{=])/g, ") ");

  // Clean parameter lists in function declarations
  result = result.replace(/function\s+(\w+)\s*\(([^)]*)\)/g, (_, name, params: string) => {
    return `function ${name}(${cleanParamTypes(params)})`;
  });
  result = result.replace(/var\s+(\w+)\s*=\s*function\s*\(([^)]*)\)/g, (_, name, params: string) => {
    return `var ${name} = function(${cleanParamTypes(params)})`;
  });
  result = result.replace(/(\w+)\s*\(([^)]*)\)\s*\{/g, (_, name, params: string) => {
    if (name === "if" || name === "while" || name === "for" || name === "switch" || name === "catch") {
      return `${name} (${params}) {`;
    }
    return `${name}(${cleanParamTypes(params)}) {`;
  });

  return result;
}

function cleanParamTypes(params: string): string {
  if (!params.trim()) return "";
  return splitTopLevelCommas(params).map((p) => {
    const piece = p.trim();
    if (piece.includes(":")) {
      const colonIdx = piece.indexOf(":");
      const name = piece.slice(0, colonIdx).trim();
      const rest = piece.slice(colonIdx + 1);
      if (rest.includes("=")) {
        const eqIdx = rest.indexOf("=");
        const defVal = rest.slice(eqIdx + 1).trim();
        return `${name} = ${defVal}`;
      }
      return name;
    }
    return piece;
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

    if (trimmed.startsWith("#include") || trimmed.startsWith("using namespace")) {
      result.push("");
      continue;
    }

    if (/^\s*(public|private|protected)\s*:\s*$/.test(line)) {
      continue;
    }

    if (/^\s*class\s+\w+\s*\{/.test(line)) {
      inClass = true;
      result.push(line.replace(/class\s+(\w+)/, "class $1"));
      continue;
    }
    if (trimmed === "};") {
      inClass = false;
      result.push("}");
      continue;
    }

    // Return with curly initializer list: return {mid, steps}; or return {-1, steps};
    if (/return\s*\{([^}]+)\};/.test(line)) {
      line = line.replace(/return\s*\{([^}]+)\};/, "return [$1];");
      result.push(line);
      continue;
    }

    // 2D DP vector: vector<vector<int>> dp(n + 1, vector<int>(capacity + 1, 0)); or without fill value
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

    // 1D DP vector: vector<int> dp(n + 1); or vector<int> dp(n + 1, 0);
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

    // Initializer list vector / set: vector<int> queue = {start}; or unordered_set<int> seen = {start};
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

    // Empty containers: vector, queue, stack, deque, unordered_set, set, unordered_map, map
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

    // C-style 1D / 2D arrays: int dp[n + 1]; or int dp[n + 1][m + 1];
    if (/^\s*(?:int|bool|double|float|long)\s+(\w+)\s*\[(.+?)\]\s*\[(.+?)\];/.test(line)) {
      line = line.replace(
        /^\s*(?:int|bool|double|float|long)\s+(\w+)\s*\[(.+?)\]\s*\[(.+?)\];/,
        "let $1 = Array.from({length: $2}, () => new Array($3).fill(0));",
      );
      result.push(line);
      continue;
    }
    if (/^\s*(?:int|bool|double|float|long)\s+(\w+)\s*\[(.+?)\];/.test(line)) {
      line = line.replace(
        /^\s*(?:int|bool|double|float|long)\s+(\w+)\s*\[(.+?)\];/,
        "let $1 = new Array($2).fill(0);",
      );
      result.push(line);
      continue;
    }

    // Function or Method header: vector<int> insertionSort(...) { or pair<int, int> searchWithLimits(...) {
    if (/^\s*(?:vector<[^>]+>|pair<[^>]+>|int|void|bool|string|double|float|long|auto|unordered_set<[^>]+>)\s+(\w+)\s*\((.*?)\)\s*\{/.test(line)) {
      const match = /^\s*(?:vector<[^>]+>|pair<[^>]+>|int|void|bool|string|double|float|long|auto|unordered_set<[^>]+>)\s+(\w+)\s*\((.*?)\)\s*\{/.exec(line)!;
      const fnName = match[1]!;
      const params = match[2]!;
      const cleanedParams = cleanCppParams(params);
      if (inClass) {
        result.push(`    ${fnName}(${cleanedParams}) {`);
      } else {
        result.push(`function ${fnName}(${cleanedParams}) {`);
      }
      continue;
    }

    // Range-based for loop: for (int nxt : graph[node])
    if (/for\s*\(\s*(?:int|auto|const\s+auto&?)\s+(\w+)\s*:\s*(.+?)\)/.test(line)) {
      line = line.replace(
        /for\s*\(\s*(?:int|auto|const\s+auto&?)\s+(\w+)\s*:\s*(.+?)\)/,
        "for (const $1 of $2)",
      );
    }

    // Variable declarations: int currentSum = nums[0], maxSum = nums[0];
    line = line.replace(
      /^\s*(?:int|double|float|long|bool|char|string|auto|pair<[^>]+>)\s+([^;]+);/,
      "let $1;",
    );

    // For loops: for (int i = 1; i < nums.size(); i++)
    line = line.replace(/for\s*\(\s*int\s+/g, "for (let ");

    // Integer mid calculation: (left + right) / 2 -> Math.floor((left + right) / 2)
    line = line.replace(/=\s*\((\w+\s*[+\-]\s*\w+)\)\s*\/\s*2;/g, "= Math.floor(($1) / 2);");
    line = line.replace(/=\s*(\w+)\s*\+\s*\((\w+\s*-\s*\w+)\)\s*\/\s*2;/g, "= $1 + Math.floor(($2) / 2);");

    // Return vector conversion: return vector<int>(seen.begin(), seen.end());
    line = line.replace(/return\s+vector<[^>]+>\((\w+)\.begin\(\),\s*\1\.end\(\)\);/g, "return Array.from($1);");

    // Common C++ methods
    line = line.replace(/\.size\(\)/g, ".length");
    line = line.replace(/\.push_back\(/g, ".push(");
    line = line.replace(/\.insert\(/g, ".add(");

    // seen.find(nxt) == seen.end()
    line = line.replace(/(\w+)\.find\((.+?)\)\s*==\s*\1\.end\(\)/g, "!$1.has($2)");
    line = line.replace(/(\w+)\.find\((.+?)\)\s*!=\s*\1\.end\(\)/g, "$1.has($2)");

    // *max_element(dp.begin(), dp.end()) -> Math.max(...dp)
    line = line.replace(/\*max_element\((\w+)\.begin\(\),\s*\1\.end\(\)\)/g, "Math.max(...$1)");
    line = line.replace(/\*min_element\((\w+)\.begin\(\),\s*\1\.end\(\)\)/g, "Math.min(...$1)");

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

/* ============================== Java → JS ================================ */

function transpileJava(code: string): string {
  const lines = code.split("\n");
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]!;
    const trimmed = line.trim();

    if (trimmed.startsWith("import ") || trimmed.startsWith("package ")) {
      result.push("");
      continue;
    }

    if (/^\s*(?:public\s+)?class\s+(\w+)\s*\{/.test(line)) {
      result.push(line.replace(/(?:public\s+)?class\s+(\w+)/, "class $1"));
      continue;
    }

    // Method: public int[] insertionSort(int[] nums) {
    if (/^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:int(?:\[\])*|void|boolean(?:\[\])*|String|double|List<[^>]+>|Set<[^>]+>)\s+(\w+)\s*\((.*?)\)\s*\{/.test(line)) {
      const match = /^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:int(?:\[\])*|void|boolean(?:\[\])*|String|double|List<[^>]+>|Set<[^>]+>)\s+(\w+)\s*\((.*?)\)\s*\{/.exec(line)!;
      const fnName = match[1]!;
      const params = match[2]!;
      const cleanedParams = cleanCppParams(params);
      result.push(`    ${fnName}(${cleanedParams}) {`);
      continue;
    }

    // 2D DP array: int[][] dp = new int[n + 1][capacity + 1];
    if (/int\[\]\[\]\s+(\w+)\s*=\s*new\s+int\[(.+?)\]\[(.+?)\];/.test(line)) {
      line = line.replace(
        /int\[\]\[\]\s+(\w+)\s*=\s*new\s+int\[(.+?)\]\[(.+?)\];/,
        "let $1 = Array.from({length: $2}, () => new Array($3).fill(0));",
      );
      result.push(line);
      continue;
    }

    // 1D DP array: int[] dp = new int[n + 1];
    if (/int\[\]\s+(\w+)\s*=\s*new\s+int\[(.+?)\];/.test(line)) {
      line = line.replace(
        /int\[\]\s+(\w+)\s*=\s*new\s+int\[(.+?)\];/,
        "let $1 = new Array($2).fill(0);",
      );
      result.push(line);
      continue;
    }

    // Collections
    if (/(?:List|Queue|Deque)<[^>]+>\s+(\w+)\s*=\s*new\s+ArrayList<[^>]*>\(\);/.test(line)) {
      line = line.replace(/(?:List|Queue|Deque)<[^>]+>\s+(\w+)\s*=\s*new\s+ArrayList<[^>]*>\(\);/, "let $1 = [];");
      result.push(line);
      continue;
    }
    if (/Set<[^>]+>\s+(\w+)\s*=\s*new\s+HashSet<[^>]*>\(\);/.test(line)) {
      line = line.replace(/Set<[^>]+>\s+(\w+)\s*=\s*new\s+HashSet<[^>]*>\(\);/, "let $1 = new Set();");
      result.push(line);
      continue;
    }

    // Enhanced for loop: for (int nxt : graph[node])
    if (/for\s*\(\s*(?:int|Integer)\s+(\w+)\s*:\s*(.+?)\)/.test(line)) {
      line = line.replace(/for\s*\(\s*(?:int|Integer)\s+(\w+)\s*:\s*(.+?)\)/, "for (const $1 of $2)");
    }

    // Variable declarations: int currentSum = nums[0], maxSum = nums[0];
    line = line.replace(
      /^\s*(?:int|double|float|long|boolean|char|String|var|final)\s+([^;]+);/,
      "let $1;",
    );

    // For loop: for (int i = 1; i < nums.length; i++)
    line = line.replace(/for\s*\(\s*int\s+/g, "for (let ");

    // Integer mid calculation: (left + right) / 2 -> Math.floor((left + right) / 2)
    line = line.replace(/=\s*\((\w+\s*[+\-]\s*\w+)\)\s*\/\s*2;/g, "= Math.floor(($1) / 2);");
    line = line.replace(/=\s*(\w+)\s*\+\s*\((\w+\s*-\s*\w+)\)\s*\/\s*2;/g, "= $1 + Math.floor(($2) / 2);");

    // Return new ArrayList<>(seen): return new ArrayList<>(seen);
    line = line.replace(/return\s+new\s+ArrayList<[^>]*>\((\w+)\);/g, "return Array.from($1);");

    // Java stdlib replacements
    line = line.replace(/Arrays\.fill\((\w+),\s*(.+?)\);/g, "$1.fill($2);");
    line = line.replace(/\.size\(\)/g, ".length");
    line = line.replace(/\.contains\(/g, ".has(");
    line = line.replace(/\.remove\(0\)/g, ".shift()");
    line = line.replace(/!\s*(\w+)\.isEmpty\(\)/g, "$1.length > 0");
    line = line.replace(/\.isEmpty\(\)/g, ".length === 0");

    result.push(line);
  }

  return result.join("\n");
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
