/**
 * Transpiler v2 — Token-based type stripping + runtime polyfill approach
 *
 * Design philosophy: The transpiler does the MINIMUM to make C++/Java
 * parseable as JavaScript. ALL stdlib method behavior (.size(), .begin(),
 * .push_back(), reverse(), sort(), etc.) is handled at RUNTIME by polyfills
 * in scope.ts.
 *
 * Three phases:
 *  1. Preprocess — strip directives, normalize syntax
 *  2. Process — token-aware type stripping (functions, params, vars, loops)
 *  3. Postprocess — swap, initializer lists, type casts, residual cleanup
 */

import type { SupportedLanguage } from "@/types/languages";

/* ======================== Language Detection ======================== */

export function detectCodeLanguage(code: string): SupportedLanguage {
  const trimmed = code.trim();
  if (!trimmed) return "cpp";

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

/* ======================== Constants ======================== */

const TYPE_KEYWORDS = new Set([
  // C++ primitive types
  "void", "int", "long", "short", "char", "bool", "double", "float",
  "string", "auto", "size_t", "unsigned", "signed",
  // C++ containers
  "vector", "pair", "tuple", "array",
  "set", "unordered_set", "multiset",
  "map", "unordered_map", "multimap",
  "queue", "deque", "stack", "priority_queue",
  "list", "forward_list",
  // Java types
  "boolean", "byte", "String", "Integer", "Long", "Double", "Float",
  "Boolean", "Character", "Byte", "Short", "Object", "var",
  // Java containers
  "List", "ArrayList", "LinkedList",
  "Set", "HashSet", "TreeSet", "LinkedHashSet",
  "Map", "HashMap", "TreeMap", "LinkedHashMap",
  "Queue", "Deque", "ArrayDeque", "Stack",
  "PriorityQueue", "StringBuilder", "StringBuffer",
  // Common data structures
  "TreeNode", "ListNode", "Node",
]);

const CONTAINER_TYPES = new Set([
  "vector", "pair", "tuple", "array",
  "set", "unordered_set", "multiset",
  "map", "unordered_map", "multimap",
  "queue", "deque", "stack", "priority_queue",
  "list", "forward_list",
  "List", "ArrayList", "LinkedList",
  "Set", "HashSet", "TreeSet", "LinkedHashSet",
  "Map", "HashMap", "TreeMap", "LinkedHashMap",
  "Queue", "Deque", "ArrayDeque", "Stack",
  "PriorityQueue", "StringBuilder", "StringBuffer",
]);

const QUALIFIERS = [
  "const", "static", "final", "public", "private", "protected",
  "virtual", "inline", "explicit", "friend", "mutable", "volatile",
  "abstract", "synchronized", "native", "strictfp", "transient",
];

const JS_KEYWORDS = new Set([
  "return", "new", "class", "if", "while", "for", "switch", "case",
  "break", "continue", "throw", "try", "catch", "finally", "do",
  "else", "var", "let", "const", "function", "typeof", "instanceof",
  "in", "of", "delete", "void", "yield", "async", "await", "import",
  "export", "default", "extends", "super", "this", "true", "false",
  "null", "undefined", "struct", "sizeof", "new", "interface",
]);

/* ======================== Utility Functions ======================== */

function skipWS(s: string, i: number): number {
  while (i < s.length && /\s/.test(s[i]!)) i++;
  return i;
}

function findWordEnd(s: string, i: number): number {
  while (i < s.length && /\w/.test(s[i]!)) i++;
  return i;
}

/** Skip balanced brackets. `i` must point at the opening bracket. Returns position AFTER the closing bracket. */
function skipBalanced(s: string, i: number, open: string, close: string): number {
  if (i >= s.length || s[i] !== open) return i;
  let depth = 1;
  i++;
  while (i < s.length && depth > 0) {
    if (s[i] === open) depth++;
    else if (s[i] === close) depth--;
    i++;
  }
  return i;
}

/** Find the position of `ch` at the top level (not inside (), [], {}, <>) */
function findTopLevelChar(s: string, ch: string, start = 0): number {
  let parenD = 0, bracketD = 0, braceD = 0, angleD = 0;
  let inStr = false, strCh = "";
  for (let i = start; i < s.length; i++) {
    const c = s[i]!;
    if (inStr) {
      if (c === strCh && s[i - 1] !== "\\") inStr = false;
      continue;
    }
    if (c === '"' || c === "'") { inStr = true; strCh = c; continue; }
    if (c === "(") parenD++;
    if (c === ")") parenD--;
    if (c === "[") bracketD++;
    if (c === "]") bracketD--;
    if (c === "{") braceD++;
    if (c === "}") braceD--;
    if (c === "<") angleD++;
    if (c === ">") angleD--;
    if (c === ch && parenD === 0 && bracketD === 0 && braceD === 0 && angleD <= 0) {
      return i;
    }
  }
  return -1;
}

/** Find matching close bracket. `i` points at opening bracket. Returns position of closing bracket, or -1. */
function findMatchingClose(s: string, openPos: number): number {
  const open = s[openPos]!;
  const close = open === "(" ? ")" : open === "[" ? "]" : open === "{" ? "}" : ">";
  let depth = 1;
  let inStr = false, strCh = "";
  for (let i = openPos + 1; i < s.length; i++) {
    const c = s[i]!;
    if (inStr) {
      if (c === strCh && s[i - 1] !== "\\") inStr = false;
      continue;
    }
    if (c === '"' || c === "'") { inStr = true; strCh = c; continue; }
    if (c === open) depth++;
    if (c === close) { depth--; if (depth === 0) return i; }
  }
  return -1;
}

/** Split string by commas at the top level (respecting nesting) */
function splitTopLevelCommas(s: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  let inStr = false, strCh = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (inStr) {
      current += c;
      if (c === strCh && s[i - 1] !== "\\") inStr = false;
      continue;
    }
    if (c === '"' || c === "'") { inStr = true; strCh = c; current += c; continue; }
    if ("(<[{".includes(c)) depth++;
    if (")>]}".includes(c)) depth--;
    if (c === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

/* ======================== Type Matching ======================== */

interface TypeMatch {
  end: number;      // position after the entire type expression (exclusive)
  baseType: string;  // base type name: 'vector', 'int', 'TreeNode', etc.
}

/**
 * Try to match a type expression starting at position `pos`.
 * Handles qualifiers, template brackets, pointer/reference, array suffixes.
 * Returns null if no type expression found.
 */
function matchType(code: string, pos: number): TypeMatch | null {
  let i = skipWS(code, pos);
  const startAfterWS = i;

  // Skip qualifiers (const, static, final, public, etc.)
  let changed = true;
  while (changed) {
    changed = false;
    i = skipWS(code, i);
    for (const q of QUALIFIERS) {
      if (code.startsWith(q, i) && (i + q.length >= code.length || !/\w/.test(code[i + q.length]!))) {
        i += q.length;
        changed = true;
        break;
      }
    }
  }

  i = skipWS(code, i);

  // Handle 'unsigned'/'signed' prefix
  for (const prefix of ["unsigned", "signed"]) {
    if (code.startsWith(prefix, i) && (i + prefix.length >= code.length || !/\w/.test(code[i + prefix.length]!))) {
      i = skipWS(code, i + prefix.length);
    }
  }

  // Match a type keyword
  const wordEnd = findWordEnd(code, i);
  if (wordEnd === i) return null;
  const word = code.slice(i, wordEnd);
  if (!TYPE_KEYWORDS.has(word)) return null;

  let baseType = word;
  i = wordEnd;

  // Handle 'long long'
  if (word === "long") {
    const j = skipWS(code, i);
    const nextEnd = findWordEnd(code, j);
    if (code.slice(j, nextEnd) === "long") {
      baseType = "long long";
      i = nextEnd;
    }
  }

  // Handle template brackets: vector<int>, map<int, vector<int>>, etc.
  let j = skipWS(code, i);
  if (j < code.length && code[j] === "<") {
    const bracketEnd = skipBalanced(code, j, "<", ">");
    if (bracketEnd > j + 1) {
      i = bracketEnd;
    }
  }

  // Handle pointer/reference: *, &
  j = skipWS(code, i);
  while (j < code.length && (code[j] === "*" || code[j] === "&")) {
    j++;
    i = j;
    j = skipWS(code, i);
  }

  // Handle array brackets: [], [][]
  j = skipWS(code, i);
  while (j + 1 < code.length && code[j] === "[" && code[j + 1] === "]") {
    j += 2;
    i = j;
    j = skipWS(code, i);
  }

  // Must have consumed something beyond the initial whitespace
  if (i <= startAfterWS) return null;

  return { end: i, baseType };
}

/* ======================== Parameter Cleaning ======================== */

/** Strip type annotations from function parameters */
function cleanParams(paramStr: string): string {
  if (!paramStr.trim()) return "";

  const params = splitTopLevelCommas(paramStr);
  const cleaned: string[] = [];

  for (const param of params) {
    const p = param.trim();
    if (!p) continue;

    const typeMatch = matchType(p, 0);
    if (typeMatch) {
      let rest = p.slice(typeMatch.end).trim();
      // Handle default values: remove the type, keep name and default
      if (rest) {
        cleaned.push(rest);
      } else {
        // Type without a name (shouldn't happen, but safety)
        cleaned.push(p);
      }
    } else {
      // No type found — already clean or varargs
      // Handle Java varargs: int... nums → ...nums
      const varargsMatch = /^(\w+)\.\.\.\s*(\w+)$/.exec(p);
      if (varargsMatch) {
        cleaned.push(`...${varargsMatch[2]}`);
      } else {
        cleaned.push(p);
      }
    }
  }

  return cleaned.join(", ");
}

/* ======================== Constructor Args Processing ======================== */

/** In constructor arguments, replace CONTAINER<...>( with new CONTAINER( */
function processConstructorArgs(args: string): string {
  let result = "";
  let i = 0;

  while (i < args.length) {
    // Check for a word
    if (/[A-Za-z_]/.test(args[i]!)) {
      const wordStart = i;
      while (i < args.length && /\w/.test(args[i]!)) i++;
      const word = args.slice(wordStart, i);

      if (CONTAINER_TYPES.has(word)) {
        let j = skipWS(args, i);
        if (j < args.length && args[j] === "<") {
          const bracketEnd = skipBalanced(args, j, "<", ">");
          j = skipWS(args, bracketEnd);
          if (j < args.length && args[j] === "(") {
            result += `new ${word}(`;
            i = j + 1;
            continue;
          }
          // Has <...> but not followed by ( — still strip the template
          i = bracketEnd;
          result += word;
          continue;
        }
      }

      result += word;
      continue;
    }

    result += args[i]!;
    i++;
  }

  return result;
}

/* ======================== Container Default Value ======================== */

function getEmptyContainer(baseType: string): string {
  if (["vector", "deque", "list", "forward_list", "ArrayList", "LinkedList", "List", "ArrayDeque"].includes(baseType)) return "[]";
  if (["set", "unordered_set", "multiset"].includes(baseType)) return "new Set()";
  if (["HashSet", "TreeSet", "LinkedHashSet", "Set"].includes(baseType)) return "new Set()";
  if (["map", "unordered_map", "multimap"].includes(baseType)) return "new UnorderedMap()";
  if (["HashMap", "TreeMap", "LinkedHashMap", "Map"].includes(baseType)) return "new Map()";
  if (["queue", "Queue"].includes(baseType)) return "new queue()";
  if (["stack", "Stack"].includes(baseType)) return "new stack()";
  if (["priority_queue", "PriorityQueue"].includes(baseType)) return "new PriorityQueue()";
  if (["pair", "tuple"].includes(baseType)) return "[]";
  if (["StringBuilder", "StringBuffer"].includes(baseType)) return 'new StringBuilder()';
  return "[]";
}

function getContainerConstructor(baseType: string): string {
  if (["vector", "deque", "list", "forward_list", "ArrayList", "LinkedList", "List", "ArrayDeque", "array"].includes(baseType)) return "vector";
  if (["set", "unordered_set", "multiset", "HashSet", "TreeSet", "LinkedHashSet", "Set"].includes(baseType)) return "Set";
  if (["map", "unordered_map", "multimap"].includes(baseType)) return "UnorderedMap";
  if (["HashMap", "TreeMap", "LinkedHashMap", "Map"].includes(baseType)) return "Map";
  if (["queue", "Queue"].includes(baseType)) return "queue";
  if (["stack", "Stack", "Deque"].includes(baseType)) return "stack";
  if (["priority_queue", "PriorityQueue"].includes(baseType)) return "PriorityQueue";
  if (["StringBuilder", "StringBuffer"].includes(baseType)) return "StringBuilder";
  return baseType;
}

/* ======================== Line Processors ======================== */

function processForLoop(line: string): string | null {
  const indent = line.match(/^\s*/)?.[0] || "";
  const trimmed = line.trim();

  const forMatch = /^for\s*\(/.exec(trimmed);
  if (!forMatch) return null;

  const parenStart = trimmed.indexOf("(");
  const parenEnd = findMatchingClose(trimmed, parenStart);
  if (parenEnd === -1) return null;

  const inside = trimmed.slice(parenStart + 1, parenEnd);
  const after = trimmed.slice(parenEnd + 1);

  // Range-based for: check for ':' at top level
  const colonIdx = findTopLevelChar(inside, ":");
  if (colonIdx !== -1) {
    const beforeColon = inside.slice(0, colonIdx).trim();
    const afterColon = inside.slice(colonIdx + 1).trim();

    const typeMatch = matchType(beforeColon, 0);
    let varPart: string;
    if (typeMatch) {
      varPart = beforeColon.slice(typeMatch.end).trim();
    } else {
      varPart = beforeColon;
    }

    return `${indent}for (const ${varPart} of ${afterColon})${after}`;
  }

  // Standard for loop: strip type from init clause
  const firstSemi = findTopLevelChar(inside, ";");
  if (firstSemi === -1) return null;

  const initClause = inside.slice(0, firstSemi);
  const restOfFor = inside.slice(firstSemi);

  const typeMatch = matchType(initClause, 0);
  if (typeMatch) {
    const afterType = initClause.slice(typeMatch.end).trim();
    return `${indent}for (let ${afterType}${restOfFor})${after}`;
  }

  return null;
}

function processFunctionDef(line: string, inClass: boolean): string | null {
  const indent = line.match(/^\s*/)?.[0] || "";
  const trimmed = line.trim();

  // Quick reject: must contain both '(' and '{'
  if (!trimmed.includes("(") || !trimmed.includes("{")) return null;

  // Try to match type at the beginning
  const typeMatch = matchType(trimmed, 0);
  if (!typeMatch) return null;

  // After the type, expect a function name (identifier)
  let pos = skipWS(trimmed, typeMatch.end);
  const nameStart = pos;
  pos = findWordEnd(trimmed, pos);
  const name = trimmed.slice(nameStart, pos);

  if (!name || JS_KEYWORDS.has(name)) return null;

  // After the name, expect '('
  pos = skipWS(trimmed, pos);
  if (pos >= trimmed.length || trimmed[pos] !== "(") return null;

  const parenEnd = findMatchingClose(trimmed, pos);
  if (parenEnd === -1) return null;

  const paramsStr = trimmed.slice(pos + 1, parenEnd);

  // After ')', look for '{' — possibly with const, override, throws, etc.
  let afterParen = trimmed.slice(parenEnd + 1);
  // Strip trailing qualifiers before the brace
  afterParen = afterParen.replace(/^\s*(?:const|override|final|noexcept|explicit)(?:\s+(?:const|override|final|noexcept|explicit))*/g, "");
  // Strip Java throws clause
  afterParen = afterParen.replace(/^\s*throws\s+[\w,\s]+/g, "");

  const braceIdx = afterParen.indexOf("{");
  if (braceIdx === -1) return null;

  // It's a function definition!
  const cleanedParams = cleanParams(paramsStr);
  const bodyPart = afterParen.slice(braceIdx);

  if (inClass) {
    return `${indent}${name}(${cleanedParams}) ${bodyPart}`;
  }
  return `${indent}function ${name}(${cleanedParams}) ${bodyPart}`;
}

function processContainerDecl(line: string): string | null {
  const indent = line.match(/^\s*/)?.[0] || "";
  const trimmed = line.trim();

  // Match a type at the start
  const typeMatch = matchType(trimmed, 0);
  if (!typeMatch || !CONTAINER_TYPES.has(typeMatch.baseType)) return null;

  // After type, expect an identifier
  let pos = skipWS(trimmed, typeMatch.end);
  const nameStart = pos;
  pos = findWordEnd(trimmed, pos);
  const name = trimmed.slice(nameStart, pos);

  if (!name || JS_KEYWORDS.has(name)) return null;

  pos = skipWS(trimmed, pos);
  const rest = trimmed.slice(pos);

  // Constructor call: vector<int> dp(n, 0);
  if (rest.startsWith("(")) {
    const closeIdx = findMatchingClose(rest, 0);
    if (closeIdx !== -1) {
      const args = rest.slice(1, closeIdx);
      const cleanedArgs = processConstructorArgs(args);
      const constructor = getContainerConstructor(typeMatch.baseType);
      return `${indent}let ${name} = new ${constructor}(${cleanedArgs});`;
    }
  }

  // Assignment with curly init: vector<int> v = {1, 2, 3};
  if (rest.startsWith("=")) {
    const initPart = rest.slice(1).trim();
    if (initPart.startsWith("{")) {
      const closeIdx = initPart.indexOf("}");
      if (closeIdx !== -1) {
        let body = initPart.slice(1, closeIdx).trim();
        // Replace nested curly braces with array brackets
        body = body.replace(/\{/g, "[").replace(/\}/g, "]");
        if (["set", "unordered_set", "multiset", "HashSet", "TreeSet", "Set"].includes(typeMatch.baseType)) {
          return `${indent}let ${name} = new Set([${body}]);`;
        }
        return `${indent}let ${name} = [${body}];`;
      }
    }
    // Other assignment: strip type, keep rest
    return `${indent}let ${name} = ${initPart.replace(/;$/, "")};`;
  }

  // Empty declaration: vector<int> v; or set<int> s;
  if (rest === ";" || rest === "") {
    return `${indent}let ${name} = ${getEmptyContainer(typeMatch.baseType)};`;
  }

  return null;
}

function processJavaArrayDecl(line: string): string | null {
  const indent = line.match(/^\s*/)?.[0] || "";
  let trimmed = line.trim();

  // Pattern: TYPE[] NAME = new TYPE[SIZE]; or TYPE[][] NAME = new TYPE[R][C];
  // Also: TYPE[] NAME = {1, 2, 3};

  // 3D: int[][][] dp = new int[a][b][c];
  const match3d = /^(?:\w+)\[\]\[\]\[\]\s+(\w+)\s*=\s*new\s+\w+\[(.+?)\]\[(.+?)\]\[(.+?)\]\s*;/.exec(trimmed);
  if (match3d) {
    const [, name, d1, d2, d3] = match3d;
    const fill = trimmed.includes("boolean") ? "false" : "0";
    return `${indent}let ${name} = Array.from({length: ${d1}}, () => Array.from({length: ${d2}}, () => new Array(${d3}).fill(${fill})));`;
  }

  // 2D: int[][] dp = new int[n][m];
  const match2d = /^(?:\w+)\[\]\[\]\s+(\w+)\s*=\s*new\s+\w+\[(.+?)\]\[(.+?)\]\s*;/.exec(trimmed);
  if (match2d) {
    const [, name, rows, cols] = match2d;
    const fill = trimmed.includes("boolean") ? "false" : "0";
    return `${indent}let ${name} = Array.from({length: ${rows}}, () => new Array(${cols}).fill(${fill})));`;
  }

  // 1D with initializer: int[] arr = {1, 2, 3}; or int[] arr = new int[]{1, 2, 3};
  const matchInit = /^(?:\w+)\[\](?:\[\])?\s+(\w+)\s*=\s*(?:new\s+\w+\[\]\s*)?\{([^}]+)\}\s*;/.exec(trimmed);
  if (matchInit) {
    const [, name, body] = matchInit;
    return `${indent}let ${name} = [${body}];`;
  }

  // 1D: int[] dp = new int[n];
  const match1d = /^(?:\w+)\[\]\s+(\w+)\s*=\s*new\s+\w+\[(.+?)\]\s*;/.exec(trimmed);
  if (match1d) {
    const [, name, size] = match1d;
    const fill = trimmed.includes("boolean") ? "false" : "0";
    return `${indent}let ${name} = new Array(${size}).fill(${fill});`;
  }

  return null;
}

function processVarDecl(line: string): string | null {
  const indent = line.match(/^\s*/)?.[0] || "";
  const trimmed = line.trim();

  // Quick reject: if line starts with a JS keyword, skip
  const firstWord = trimmed.match(/^(\w+)/)?.[1];
  if (firstWord && JS_KEYWORDS.has(firstWord)) return null;
  // Reject if line starts with control flow or structural syntax
  if (/^(?:if|else|while|do|switch|case|try|catch|finally|throw|return)\b/.test(trimmed)) return null;

  // Try to match a type at the start
  const typeMatch = matchType(trimmed, 0);
  if (!typeMatch) return null;

  // After the type, expect an identifier
  let pos = skipWS(trimmed, typeMatch.end);
  const nameStart = pos;
  pos = findWordEnd(trimmed, pos);
  const name = trimmed.slice(nameStart, pos);

  if (!name || JS_KEYWORDS.has(name)) return null;

  // Check what follows: =, ;, , (indicating variable declaration)
  pos = skipWS(trimmed, pos);
  const nextChar = trimmed[pos];

  if (nextChar === "=" || nextChar === ";" || nextChar === ",") {
    // It's a variable declaration!
    const rest = trimmed.slice(pos);
    return `${indent}let ${name} ${rest}`;
  }

  // Also handle: TYPE NAME[SIZE] (C array declaration)
  if (nextChar === "[") {
    const closeBracket = trimmed.indexOf("]", pos);
    if (closeBracket !== -1) {
      const size = trimmed.slice(pos + 1, closeBracket);
      const afterBracket = trimmed.slice(closeBracket + 1).trim();
      // int dp[n]; → let dp = new Array(n).fill(0);
      if (afterBracket === ";" || afterBracket === "") {
        const fill = typeMatch.baseType === "bool" || typeMatch.baseType === "boolean" ? "false" : "0";
        return `${indent}let ${name} = new Array(${size}).fill(${fill});`;
      }
      // int dp[n] = {0}; or int dp[n] = {...};
      if (afterBracket.startsWith("=")) {
        const initPart = afterBracket.slice(1).trim().replace(/;$/, "");
        if (initPart.startsWith("{")) {
          const body = initPart.slice(1, initPart.lastIndexOf("}")).trim();
          if (body === "0" || body === "") {
            return `${indent}let ${name} = new Array(${size}).fill(0);`;
          }
          return `${indent}let ${name} = [${body}];`;
        }
      }
    }
  }

  // Could be: TYPE NAME(args) — but args end with ; means function CALL not def
  // Don't treat as variable
  if (nextChar === "(") {
    // Check if this ends with ';' — it's a function call or construction
    // If it ends with '{' — it was already handled by processFunctionDef
    return null;
  }

  return null;
}

/* ======================== Main Processing Pipeline ======================== */

function preprocess(code: string, lang: "cpp" | "java"): string {
  const lines = code.split("\n");
  const result: string[] = [];

  for (const rawLine of lines) {
    let line = rawLine;
    const trimmed = line.trim();

    // Strip preprocessor directives
    if (trimmed.startsWith("#include") || trimmed.startsWith("#pragma") || trimmed.startsWith("#ifndef") ||
        trimmed.startsWith("#define") || trimmed.startsWith("#endif") || trimmed.startsWith("#ifdef") ||
        trimmed.startsWith("#undef") || trimmed.startsWith("#if ")) {
      result.push("");
      continue;
    }

    // Strip typedef
    if (trimmed.startsWith("typedef ")) {
      result.push("");
      continue;
    }

    // Strip using namespace
    if (/^\s*using\s+namespace\s+/.test(line)) {
      result.push("");
      continue;
    }

    // Strip using declarations (using std::xxx)
    if (/^\s*using\s+\w+::/.test(line)) {
      result.push("");
      continue;
    }

    // Strip Java imports, packages, annotations
    if (lang === "java") {
      if (trimmed.startsWith("import ") || trimmed.startsWith("package ")) {
        result.push("");
        continue;
      }
      if (/^@\w+/.test(trimmed)) {
        result.push("");
        continue;
      }
    }

    result.push(line);
  }

  let processed = result.join("\n");

  // Normalize unicode operators
  processed = processed
    .replace(/[⩾≥]/g, ">=")
    .replace(/[⩽≤]/g, "<=")
    .replace(/[≠]/g, "!=")
    .replace(/[×]/g, "*")
    .replace(/[÷]/g, "/")
    .replace(/[−–—]/g, "-")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, " ");

  // C++ pointer access: -> to .
  processed = processed.replace(/(\w)->/g, "$1.");

  // nullptr, NULL → null
  processed = processed.replace(/\bnullptr\b/g, "null");
  processed = processed.replace(/\bNULL\b/g, "null");

  // Namespace access: std:: → remove, other:: → .
  processed = processed.replace(/\bstd::/g, "");
  processed = processed.replace(/(\w+)::/g, "$1.");

  // cout/cin → console.log
  processed = processed.replace(/cout\s*<<\s*(.*?)(?:\s*<<\s*endl)?\s*;/g, (_, content) => {
    const parts = content.split(/\s*<<\s*/).filter((p: string) => p.trim() && p.trim() !== "endl" && p.trim() !== '"\\n"');
    return `console.log(${parts.join(", ")});`;
  });

  // System.out.println/print → console.log
  processed = processed.replace(/System\.out\.println\((.*?)\);/g, "console.log($1);");
  processed = processed.replace(/System\.out\.print\((.*?)\);/g, "console.log($1);");

  // Strip empty diamond operator: new ArrayList<>() → new ArrayList()
  processed = processed.replace(/new\s+(\w+)\s*<\s*>/g, "new $1");

  // Java new TYPE<...>() → strip template params: new HashMap<String, Integer>() → new HashMap()
  // Need balanced bracket handling
  processed = stripNewTemplateParams(processed);

  // Java new array creation: new int[n], new int[n][m], new int[]{1,2,3}
  processed = processed.replace(/new\s+(?:int|long|double|float|boolean|char|byte|short|String)\s*\[\s*\]\s*\{([^}]+)\}/g, "[$1]");
  processed = processed.replace(
    /new\s+(?:int|long|double|float|boolean|char|byte|short|String)\s*\[([^\]]+)\]\s*\[([^\]]+)\]\s*\[([^\]]+)\]/g,
    "Array.from({length: $1}, () => Array.from({length: $2}, () => new Array($3).fill(0)))",
  );
  processed = processed.replace(
    /new\s+(?:int|long|double|float|boolean|char|byte|short|String)\s*\[([^\]]+)\]\s*\[([^\]]+)\]/g,
    "Array.from({length: $1}, () => new Array($2).fill(0))",
  );
  processed = processed.replace(
    /new\s+(?:int|long|double|float|boolean|char|byte|short|String)\s*\[([^\]]+)\]/g,
    "new Array($1).fill(0)",
  );

  return processed;
}

/** Strip template parameters from `new TYPE<...>(` expressions */
function stripNewTemplateParams(code: string): string {
  let result = "";
  let i = 0;
  while (i < code.length) {
    // Look for 'new' keyword
    if (code.startsWith("new ", i) || code.startsWith("new\t", i)) {
      result += "new ";
      i += 4;

      // Skip whitespace
      while (i < code.length && /\s/.test(code[i]!)) {
        result += code[i]!;
        i++;
      }

      // Read the type name
      const nameStart = i;
      while (i < code.length && /\w/.test(code[i]!)) i++;
      const name = code.slice(nameStart, i);
      result += name;

      // Skip whitespace
      const wsAfterName = skipWS(code, i);

      // Check for <...>
      if (wsAfterName < code.length && code[wsAfterName] === "<") {
        const bracketEnd = skipBalanced(code, wsAfterName, "<", ">");
        // Skip the template brackets and any whitespace after
        i = bracketEnd;
      }

      continue;
    }

    result += code[i]!;
    i++;
  }
  return result;
}

function processCode(preprocessed: string, lang: "cpp" | "java"): string {
  const lines = preprocessed.split("\n");
  const result: string[] = [];
  let inClass = false;
  let classDepth = 0;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]!;
    const trimmed = line.trim();

    // Empty lines, comments
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      result.push(line);
      continue;
    }

    // Access modifier lines: public:, private:, protected:
    if (/^\s*(public|private|protected)\s*:\s*$/.test(line)) {
      continue;
    }

    // Class/struct definition
    const classMatch = /^\s*(?:public\s+|private\s+|protected\s+)?(?:class|struct)\s+(\w+)/.exec(line);
    if (classMatch) {
      inClass = true;
      classDepth = 0;
      // Count braces on this line
      for (const ch of line) {
        if (ch === "{") classDepth++;
        if (ch === "}") classDepth--;
      }
      result.push(line.replace(/(?:public\s+|private\s+|protected\s+)?(?:class|struct)\s+(\w+)[^{]*\{/, "class $1 {"));
      continue;
    }

    // Track brace depth for class
    if (inClass) {
      for (const ch of trimmed) {
        if (ch === "{") classDepth++;
        if (ch === "}") classDepth--;
      }
      if (classDepth <= 0 && (trimmed === "}" || trimmed === "};")) {
        inClass = false;
        result.push("}");
        continue;
      }
    }

    // For loop
    const forResult = processForLoop(line);
    if (forResult !== null) {
      result.push(forResult);
      continue;
    }

    // Function definition (check BEFORE container declaration because both start with TYPE NAME)
    const fnResult = processFunctionDef(line, inClass);
    if (fnResult !== null) {
      result.push(fnResult);
      continue;
    }

    // Container declaration (C++ and Java)
    const containerResult = processContainerDecl(line);
    if (containerResult !== null) {
      result.push(containerResult);
      continue;
    }

    // Java array declaration
    if (lang === "java") {
      const arrayResult = processJavaArrayDecl(line);
      if (arrayResult !== null) {
        result.push(arrayResult);
        continue;
      }
    }

    // Variable declaration(s) — handle multiple per line
    const varResult = processVarDeclarations(line);
    if (varResult !== null) {
      result.push(varResult);
      continue;
    }

    // Pass-through
    result.push(line);
  }

  return result.join("\n");
}

/**
 * Process variable declarations, handling multiple declarations separated by ';' on the same line.
 * E.g.: "int i = 0; int j = n - 1;" → "let i = 0; let j = n - 1;"
 */
function processVarDeclarations(line: string): string | null {
  const indent = line.match(/^\s*/)?.[0] || "";
  const trimmed = line.trim();

  // Quick rejection: if starts with known non-declaration keyword
  if (/^(?:if|else|while|do|switch|case|try|catch|finally|throw|return|break|continue|for|let|var|const|function|class)\b/.test(trimmed)) {
    return null;
  }

  // Split by ';' at top level
  const segments: string[] = [];
  let current = "";
  let depth = 0;
  let inStr = false, strCh = "";
  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed[i]!;
    if (inStr) {
      current += c;
      if (c === strCh && trimmed[i - 1] !== "\\") inStr = false;
      continue;
    }
    if (c === '"' || c === "'") { inStr = true; strCh = c; current += c; continue; }
    if ("([{".includes(c)) depth++;
    if (")]}".includes(c)) depth--;
    if (c === ";" && depth === 0) {
      segments.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  // Don't add the last segment if it's empty (trailing ;)
  if (current.trim()) segments.push(current.trim());

  let anyMatched = false;
  const processed: string[] = [];

  for (const seg of segments) {
    const result = processVarDecl(`${indent}${seg};`);
    if (result !== null) {
      anyMatched = true;
      processed.push(result.trim().replace(/;$/, ""));
    } else {
      processed.push(seg);
    }
  }

  if (!anyMatched) return null;
  return `${indent}${processed.join("; ")};`;
}

function postprocess(code: string, lang: "cpp" | "java"): string {
  let result = code;

  // Global Range-based for loop: for (int x : vec) -> for (const x of vec)
  // Handles: for (int x : a), for (const auto& x : a), for (auto [k, v] : mp), for (int[] row : matrix)
  result = result.replace(
    /for\s*\(\s*(?:const\s+|final\s+|auto\s*&?|int\b|long\s+long\b|long\b|double\b|float\b|bool\b|boolean\b|char\b|string\b|String\b|var\b|[\w<>]+)\s*(\&?\s*(?:\[[^\]]+\]|[A-Za-z_]\w*))\s*:\s*([^)]+)\)/g,
    (_, varName, container) => {
      const cleanVar = varName.replace(/^&/, "").trim();
      return `for (const ${cleanVar} of ${container.trim()})`;
    },
  );

  // Handle sort(s.begin(), s.end()) and reverse(s.begin(), s.end()) on variables
  result = result.replace(
    /\bsort\s*\(\s*([A-Za-z_]\w*(?:\[[^\]]+\])?)\.begin\(\)\s*,\s*\1\.end\(\)\s*(?:,\s*([^)]+))?\)\s*;/g,
    (_, varExpr, cmp) => {
      const cmpArg = cmp ? `, ${cmp}` : "";
      return `${varExpr} = typeof ${varExpr} === "string" ? ${varExpr}.split("").sort(${cmp || ""}).join("") : sort(${varExpr}.begin(), ${varExpr}.end()${cmpArg});`;
    },
  );

  result = result.replace(
    /\breverse\s*\(\s*([A-Za-z_]\w*(?:\[[^\]]+\])?)\.begin\(\)\s*,\s*\1\.end\(\)\s*\)\s*;/g,
    (_, varExpr) => {
      return `${varExpr} = typeof ${varExpr} === "string" ? ${varExpr}.split("").reverse().join("") : reverse(${varExpr}.begin(), ${varExpr}.end());`;
    },
  );

  // swap(a, b); → ;[a, b] = [b, a]; — must handle nested brackets in args
  result = result.replace(/(?:std\.)?swap\s*\((.+?),\s*(.+?)\)\s*;/g, ";[$1, $2] = [$2, $1];");

  // Return initializer lists: return {a, b}; → return [a, b];
  result = result.replace(/return\s*\{([^}]*)\}\s*;/g, "return [$1];");

  // Type casts: (int)expr → Math.trunc(expr)
  result = result.replace(/\(int\)\s*\(([^)]+)\)/g, "Math.trunc($1)");
  result = result.replace(/\(int\)\s*(\w[\w.[\]]*)/g, "Math.trunc($1)");
  result = result.replace(/\(long\s+long\)\s*(\w[\w.[\]]*)/g, "Math.trunc($1)");
  result = result.replace(/\(long\)\s*(\w[\w.[\]]*)/g, "Math.trunc($1)");
  result = result.replace(/\(double\)\s*(\w[\w.[\]]*)/g, "Number($1)");
  result = result.replace(/\(float\)\s*(\w[\w.[\]]*)/g, "Number($1)");
  result = result.replace(/\(char\)\s*(\w[\w.[\]]*)/g, "String.fromCharCode($1)");

  // Java lambda: (args) -> expr → (args) => expr
  if (lang === "java") {
    result = result.replace(/(\([^)]*\))\s*->\s*/g, "$1 => ");
  }

  // .length() → .length (can't polyfill this on String/Array)
  result = result.replace(/\.length\(\)/g, ".length");

  // Integer division: (a + b) / 2 → Math.floor(...)
  result = result.replace(/=\s*\((\w+\s*[+-]\s*\w+)\)\s*\/\s*2\s*;/g, "= Math.floor(($1) / 2);");
  result = result.replace(/=\s*(\w+)\s*\+\s*\((\w+\s*-\s*\w+)\)\s*\/\s*2\s*;/g, "= $1 + Math.floor(($2) / 2);");

  // Catch remaining type annotations the line processor missed (multi-statement lines, inline bodies)
  result = result.replace(
    /(^|[;{}(,\s])\b(?:const\s+|final\s+)?(?:int|long\s+long|long|double|float|bool|boolean|char|string|String|auto|size_t|byte|short|var|Integer|Long|Double|Boolean|Float|Character|TreeNode\*?\s*|ListNode\*?\s*|StringBuilder)\s+([A-Za-z_]\w*)/gm,
    (match, prefix, varName) => {
      if (prefix === "(" || prefix === ",") return match;
      if (JS_KEYWORDS.has(varName)) return match;
      return `${prefix}let ${varName}`;
    },
  );

  return result;
}

/* ======================== Public API ======================== */

export function transpileToJS(code: string, language: SupportedLanguage): string {
  const detected = detectCodeLanguage(code);
  const effectiveLang = (detected === "java" && language !== "java") || (detected === "cpp" && language !== "cpp")
    ? detected
    : language;

  const lang = effectiveLang === "java" ? "java" : "cpp";

  let result = code;
  result = preprocess(result, lang);
  result = processCode(result, lang);
  result = postprocess(result, lang);

  return result;
}

/**
 * Emergency sanitizer — used by the interpreter's parseAstWithRecovery
 * when the primary transpile fails to produce parseable JS.
 * More aggressive than postprocess: strips any remaining type patterns.
 */
export function sanitizeCodeForParsing(code: string): string {
  let result = code;

  // Normalize unicode
  result = result
    .replace(/[⩾≥]/g, ">=")
    .replace(/[⩽≤]/g, "<=")
    .replace(/[≠]/g, "!=")
    .replace(/[×]/g, "*")
    .replace(/[÷]/g, "/")
    .replace(/[−–—]/g, "-")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, " ");

  // Aggressively strip type annotations from any context
  result = result.replace(
    /(^|[;{}(,\s])\b(?:const\s+|final\s+|static\s+)?(?:int|long\s+long|long|double|float|bool|boolean|char|string|String|auto|size_t|unsigned\s+int|unsigned\s+long|byte|short|var|void|Integer|Long|Double|Boolean|Float|Character|TreeNode\*?\s*|ListNode\*?\s*|StringBuilder|pair<[^>]+>|vector<[^>]+>|set<[^>]+>|map<[^>]+>|unordered_map<[^>]+>|unordered_set<[^>]+>|queue<[^>]+>|stack<[^>]+>|deque<[^>]+>|priority_queue<[^>]+>|List<[^>]+>|ArrayList<[^>]+>|HashMap<[^>]+>|HashSet<[^>]+>|Map<[^>]+>|Set<[^>]+>)\s+([A-Za-z_]\w*)/gm,
    (match, prefix, varName) => {
      if (prefix === "(" || prefix === ",") return match;
      if (JS_KEYWORDS.has(varName)) return match;
      return `${prefix}let ${varName}`;
    },
  );

  // Pointer access
  result = result.replace(/(\w)->/g, "$1.");

  // Type casts
  result = result.replace(/\(int\)\s*(\w+)/g, "Math.trunc($1)");
  result = result.replace(/\(double\)\s*(\w+)/g, "Number($1)");
  result = result.replace(/\(float\)\s*(\w+)/g, "Number($1)");
  result = result.replace(/\(long\s+long\)\s*(\w+)/g, "Math.trunc($1)");
  result = result.replace(/\(long\)\s*(\w+)/g, "Math.trunc($1)");
  result = result.replace(/\(char\)\s*(\w+)/g, "String.fromCharCode($1)");

  return result;
}
