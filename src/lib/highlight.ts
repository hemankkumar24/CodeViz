// Tiny, dependency-free JS/TS tokenizer for the code viewer. Produces typed
// tokens per line so the editor can color them with the restrained palette.

export type TokenKind =
  | 'keyword'
  | 'string'
  | 'number'
  | 'comment'
  | 'fn'
  | 'punct'
  | 'plain'

export type Token = { kind: TokenKind; value: string }

const KEYWORDS = new Set([
  'function',
  'return',
  'let',
  'const',
  'var',
  'for',
  'while',
  'if',
  'else',
  'new',
  'of',
  'in',
  'do',
  'break',
  'continue',
  'true',
  'false',
  'null',
  'undefined',
  'Infinity',
])

const TOKEN_RE =
  /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][A-Za-z0-9_$]*)|([{}()[\].,;:+\-*/%<>=!&|?]+)|(\s+)/g

export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = []
  let m: RegExpExecArray | null
  TOKEN_RE.lastIndex = 0
  let lastIndex = 0
  while ((m = TOKEN_RE.exec(line)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ kind: 'plain', value: line.slice(lastIndex, m.index) })
    }
    lastIndex = TOKEN_RE.lastIndex
    if (m[1] !== undefined) tokens.push({ kind: 'comment', value: m[1] })
    else if (m[2] !== undefined) tokens.push({ kind: 'string', value: m[2] })
    else if (m[3] !== undefined) tokens.push({ kind: 'number', value: m[3] })
    else if (m[4] !== undefined) {
      const word = m[4]
      if (KEYWORDS.has(word)) tokens.push({ kind: 'keyword', value: word })
      else {
        // function-call heuristic: name followed by "("
        const rest = line.slice(TOKEN_RE.lastIndex)
        tokens.push({ kind: /^\s*\(/.test(rest) ? 'fn' : 'plain', value: word })
      }
    } else if (m[5] !== undefined) tokens.push({ kind: 'punct', value: m[5] })
    else if (m[6] !== undefined) tokens.push({ kind: 'plain', value: m[6] })
  }
  if (lastIndex < line.length) {
    tokens.push({ kind: 'plain', value: line.slice(lastIndex) })
  }
  return tokens
}

export const tokenClass: Record<TokenKind, string> = {
  keyword: 'text-accent',
  string: 'text-viz-insert/90',
  number: 'text-viz-update',
  comment: 'text-tertiary italic',
  fn: 'text-viz-dep',
  punct: 'text-muted-foreground',
  plain: 'text-foreground/90',
}
