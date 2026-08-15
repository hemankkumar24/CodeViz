import type { SupportedLanguage } from "@/types/languages";

export type TokenKind =
  | "keyword"
  | "type"
  | "string"
  | "number"
  | "comment"
  | "fn"
  | "punct"
  | "plain";

export type Token = { kind: TokenKind; value: string };

const KEYWORDS_BY_LANG: Record<SupportedLanguage, Set<string>> = {
  python: new Set([
    "def", "class", "self", "return", "if", "elif", "else", "while", "for", "in",
    "range", "len", "import", "from", "as", "True", "False", "None", "and", "or",
    "not", "is", "pass", "break", "continue", "lambda", "yield", "try", "except",
    "finally", "raise", "with", "global", "nonlocal", "assert",
  ]),
  cpp: new Set([
    "class", "struct", "public", "private", "protected", "void", "int", "bool",
    "double", "float", "char", "auto", "const", "return", "for", "while", "if",
    "else", "break", "continue", "new", "delete", "nullptr", "true", "false",
    "namespace", "using", "include", "template", "typename", "static", "constexpr",
    "switch", "case", "default", "sizeof",
  ]),
  java: new Set([
    "class", "interface", "public", "private", "protected", "static", "final",
    "void", "int", "boolean", "double", "float", "char", "byte", "short", "long",
    "return", "for", "while", "if", "else", "break", "continue", "new", "null",
    "true", "false", "package", "import", "this", "super", "extends", "implements",
    "throws", "throw", "try", "catch", "finally", "switch", "case", "default",
  ]),
  javascript: new Set([
    "function", "var", "let", "const", "return", "for", "while", "if", "else",
    "break", "continue", "new", "class", "extends", "super", "this", "null",
    "undefined", "true", "false", "import", "export", "from", "default", "typeof",
    "instanceof", "switch", "case", "try", "catch", "finally", "yield", "async",
    "await", "of", "in", "do",
  ]),
  typescript: new Set([
    "function", "var", "let", "const", "return", "for", "while", "if", "else",
    "break", "continue", "new", "class", "extends", "super", "this", "null",
    "undefined", "true", "false", "import", "export", "from", "default", "typeof",
    "instanceof", "switch", "case", "try", "catch", "finally", "yield", "async",
    "await", "type", "interface", "enum", "as", "readonly", "number", "string",
    "boolean", "any", "unknown", "never", "void", "of", "in", "do",
  ]),
};

const TYPES_BY_LANG: Record<SupportedLanguage, Set<string>> = {
  python: new Set([
    "List", "Dict", "Set", "Tuple", "Optional", "Union", "Any", "int", "str", "float", "bool",
    "list", "dict", "set", "tuple", "print", "max", "min", "sum", "abs", "enumerate", "zip",
  ]),
  cpp: new Set([
    "vector", "string", "unordered_map", "unordered_set", "map", "set", "pair",
    "stack", "queue", "deque", "priority_queue", "size_t", "INT_MAX", "INT_MIN", "std",
  ]),
  java: new Set([
    "List", "ArrayList", "Map", "HashMap", "Set", "HashSet", "Queue", "LinkedList",
    "Stack", "Deque", "ArrayDeque", "PriorityQueue", "String", "Integer", "Character",
    "Boolean", "Double", "Math", "Arrays", "Collections", "System",
  ]),
  javascript: new Set(["Array", "Math", "Set", "Map", "Object", "Promise", "console"]),
  typescript: new Set(["Array", "Math", "Set", "Map", "Object", "Promise", "console", "Record"]),
};

export function tokenizeLine(line: string, language: SupportedLanguage = "javascript"): Token[] {
  const tokens: Token[] = [];
  const isPython = language === "python";
  
  // Python uses # comments, others use // or /* */
  const tokenRegex = isPython
    ? /(#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|"""[\s\S]*?"""|'''[\s\S]*?''')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][A-Za-z0-9_$]*)|([{}()[\].,;:+\-*/%<>=!&|?^~]+)|(\s+)/g
    : /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][A-Za-z0-9_$]*)|([{}()[\].,;:+\-*/%<>=!&|?^~]+)|(\s+)/g;

  const keywords = KEYWORDS_BY_LANG[language] ?? KEYWORDS_BY_LANG.javascript;
  const types = TYPES_BY_LANG[language] ?? TYPES_BY_LANG.javascript;

  let m: RegExpExecArray | null;
  tokenRegex.lastIndex = 0;
  let lastIndex = 0;

  while ((m = tokenRegex.exec(line)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ kind: "plain", value: line.slice(lastIndex, m.index) });
    }
    lastIndex = tokenRegex.lastIndex;

    if (m[1] !== undefined) {
      tokens.push({ kind: "comment", value: m[1] });
    } else if (m[2] !== undefined) {
      tokens.push({ kind: "string", value: m[2] });
    } else if (m[3] !== undefined) {
      tokens.push({ kind: "number", value: m[3] });
    } else if (m[4] !== undefined) {
      const word = m[4];
      if (keywords.has(word)) {
        tokens.push({ kind: "keyword", value: word });
      } else if (types.has(word)) {
        tokens.push({ kind: "type", value: word });
      } else {
        const rest = line.slice(tokenRegex.lastIndex);
        tokens.push({ kind: /^\s*\(/.test(rest) ? "fn" : "plain", value: word });
      }
    } else if (m[5] !== undefined) {
      tokens.push({ kind: "punct", value: m[5] });
    } else if (m[6] !== undefined) {
      tokens.push({ kind: "plain", value: m[6] });
    }
  }

  if (lastIndex < line.length) {
    tokens.push({ kind: "plain", value: line.slice(lastIndex) });
  }

  return tokens;
}

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function highlightLineToHtml(line: string, language: SupportedLanguage = "javascript"): string {
  const tokens = tokenizeLine(line, language);
  let html = "";
  for (const tok of tokens) {
    const esc = escapeHtml(tok.value);
    if (tok.kind === "comment") html += `<span class="tok-comment text-text-tertiary italic">${esc}</span>`;
    else if (tok.kind === "string") html += `<span class="tok-string text-[var(--viz-insert)]">${esc}</span>`;
    else if (tok.kind === "number") html += `<span class="tok-number text-[var(--viz-update)]">${esc}</span>`;
    else if (tok.kind === "keyword") html += `<span class="tok-keyword text-primary font-medium">${esc}</span>`;
    else if (tok.kind === "type") html += `<span class="tok-type text-[var(--viz-dep)] font-medium">${esc}</span>`;
    else if (tok.kind === "fn") html += `<span class="tok-fn text-[var(--viz-dep)]">${esc}</span>`;
    else if (tok.kind === "punct") html += `<span class="tok-punct text-text-tertiary">${esc}</span>`;
    else html += esc;
  }
  return html || "&nbsp;";
}

export const tokenClass: Record<TokenKind, string> = {
  keyword: "text-primary font-medium",
  type: "text-[var(--viz-dep)] font-medium",
  string: "text-viz-insert/90",
  number: "text-viz-update",
  comment: "text-tertiary italic",
  fn: "text-viz-dep",
  punct: "text-muted-foreground",
  plain: "text-foreground/90",
};
