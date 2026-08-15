import type { SupportedLanguage } from "@/types/languages";

export type TokenType =
  | "keyword"
  | "type"
  | "string"
  | "number"
  | "comment"
  | "punctuation"
  | "identifier"
  | "whitespace";

export type Token = { type: TokenType; value: string };

export const tokenClass: Record<TokenType, string> = {
  keyword: "cv-token-keyword",
  type: "cv-token-type",
  string: "cv-token-string",
  number: "cv-token-number",
  comment: "cv-token-comment",
  punctuation: "cv-token-punct",
  identifier: "cv-token-id",
  whitespace: "",
};

const KEYWORDS_BY_LANG: Record<SupportedLanguage, Set<string>> = {
  cpp: new Set([
    "auto", "break", "case", "class", "const", "continue", "default", "delete",
    "do", "else", "enum", "explicit", "export", "extern", "false", "for",
    "friend", "goto", "if", "inline", "mutable", "namespace", "new",
    "noexcept", "nullptr", "operator", "private", "protected", "public",
    "register", "reinterpret_cast", "return", "sizeof", "static",
    "static_assert", "static_cast", "struct", "switch", "template", "this",
    "throw", "true", "try", "typedef", "typeid", "typename", "union",
    "using", "virtual", "while",
  ]),
  java: new Set([
    "abstract", "assert", "break", "case", "catch", "class", "const",
    "continue", "default", "do", "else", "enum", "extends", "false", "final",
    "finally", "for", "goto", "if", "implements", "import", "instanceof",
    "interface", "native", "new", "null", "package", "private", "protected",
    "public", "return", "static", "strictfp", "super", "switch",
    "synchronized", "this", "throw", "throws", "transient", "true", "try",
    "void", "volatile", "while", "var",
  ]),
};

const TYPES_BY_LANG: Record<SupportedLanguage, Set<string>> = {
  cpp: new Set([
    "bool", "char", "char16_t", "char32_t", "double", "float", "int", "long",
    "short", "signed", "unsigned", "void", "wchar_t", "size_t", "string",
    "vector", "pair", "tuple", "map", "set", "unordered_map", "unordered_set",
    "queue", "stack", "deque", "priority_queue", "list",
  ]),
  java: new Set([
    "boolean", "byte", "char", "double", "float", "int", "long", "short", "void",
    "String", "Integer", "Long", "Double", "Float", "Boolean", "Character",
    "Object", "List", "ArrayList", "LinkedList", "Map", "HashMap", "TreeMap",
    "Set", "HashSet", "TreeSet", "Queue", "Deque", "ArrayDeque", "Stack",
    "PriorityQueue", "Arrays", "Collections", "Math", "System",
  ]),
};

export function tokenizeLine(line: string, language: SupportedLanguage = "cpp"): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const keywords = KEYWORDS_BY_LANG[language] ?? KEYWORDS_BY_LANG.cpp;
  const types = TYPES_BY_LANG[language] ?? TYPES_BY_LANG.cpp;

  while (i < line.length) {
    const ch = line[i]!;

    if (/\s/.test(ch)) {
      let ws = "";
      while (i < line.length && /\s/.test(line[i]!)) {
        ws += line[i];
        i++;
      }
      tokens.push({ type: "whitespace", value: ws });
      continue;
    }

    if (line.startsWith("//", i)) {
      tokens.push({ type: "comment", value: line.slice(i) });
      break;
    }

    if (line.startsWith("/*", i)) {
      const end = line.indexOf("*/", i + 2);
      const val = end === -1 ? line.slice(i) : line.slice(i, end + 2);
      tokens.push({ type: "comment", value: val });
      i += val.length;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      let s = quote;
      i++;
      while (i < line.length) {
        const c = line[i]!;
        s += c;
        if (c === "\\" && i + 1 < line.length) {
          i++;
          s += line[i];
        } else if (c === quote) {
          i++;
          break;
        }
        i++;
      }
      tokens.push({ type: "string", value: s });
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let num = "";
      while (i < line.length && /[0-9a-fA-FxXbBoOeE_.]/.test(line[i]!)) {
        num += line[i];
        i++;
      }
      tokens.push({ type: "number", value: num });
      continue;
    }

    if (/[a-zA-Z_$]/.test(ch)) {
      let id = "";
      while (i < line.length && /[a-zA-Z0-9_$]/.test(line[i]!)) {
        id += line[i];
        i++;
      }
      if (keywords.has(id)) {
        tokens.push({ type: "keyword", value: id });
      } else if (types.has(id)) {
        tokens.push({ type: "type", value: id });
      } else {
        tokens.push({ type: "identifier", value: id });
      }
      continue;
    }

    tokens.push({ type: "punctuation", value: ch });
    i++;
  }

  return tokens;
}

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPE_MAP[c] ?? c);
}

export function highlightLineToHtml(line: string, language: SupportedLanguage = "cpp"): string {
  const tokens = tokenizeLine(line, language);
  return tokens
    .map((t) => {
      const esc = escapeHtml(t.value);
      switch (t.type) {
        case "keyword":
          return `<span class="cv-token-keyword">${esc}</span>`;
        case "type":
          return `<span class="cv-token-type">${esc}</span>`;
        case "string":
          return `<span class="cv-token-string">${esc}</span>`;
        case "number":
          return `<span class="cv-token-number">${esc}</span>`;
        case "comment":
          return `<span class="cv-token-comment">${esc}</span>`;
        case "punctuation":
          return `<span class="cv-token-punct">${esc}</span>`;
        default:
          return esc;
      }
    })
    .join("");
}
