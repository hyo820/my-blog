'use strict';

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const KEYWORDS = {
  javascript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'do', 'switch', 'case', 'break', 'continue', 'new', 'class', 'extends',
    'import', 'export', 'default', 'from', 'async', 'await', 'try', 'catch',
    'finally', 'throw', 'typeof', 'instanceof', 'this', 'super', 'null',
    'undefined', 'true', 'false', 'in', 'of', 'yield', 'static', 'get', 'set',
  ],
  python: [
    'def', 'return', 'if', 'elif', 'else', 'for', 'while', 'import', 'from',
    'as', 'class', 'try', 'except', 'finally', 'raise', 'with', 'pass',
    'break', 'continue', 'lambda', 'yield', 'in', 'is', 'not', 'and', 'or',
    'None', 'True', 'False', 'self', 'async', 'await',
  ],
  bash: [
    'if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case',
    'esac', 'function', 'return', 'exit', 'echo', 'export', 'local',
  ],
  json: [],
  html: [],
  css: [],
};

const ALIASES = {
  js: 'javascript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml',
};

// 언어별 토큰 규칙: 주석 → 문자열 → 숫자 → 키워드 순으로 매칭을 시도한다.
// 겹치지 않는 구간을 순서대로 스캔하면서 <span> 으로 감싼다.
function tokenize(code, lang) {
  const keywords = new Set(KEYWORDS[lang] || []);
  const commentPatterns = {
    javascript: /\/\/.*$|\/\*[\s\S]*?\*\//m,
    python: /#.*$/m,
    bash: /#.*$/m,
    json: null,
    html: /<!--[\s\S]*?-->/,
    css: /\/\*[\s\S]*?\*\//,
  };

  const commentRe = commentPatterns[lang];
  const stringRe = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/;
  const numberRe = /\b\d+(?:\.\d+)?\b/;
  const identifierRe = /[A-Za-z_$][A-Za-z0-9_$]*/;

  let out = '';
  let i = 0;

  while (i < code.length) {
    const rest = code.slice(i);

    const commentMatch = commentRe && rest.match(commentRe);
    const stringMatch = rest.match(stringRe);
    const numberMatch = rest.match(numberRe);
    const identMatch = rest.match(identifierRe);

    const candidates = [
      commentMatch && { type: 'comment', match: commentMatch },
      stringMatch && { type: 'string', match: stringMatch },
      numberMatch && { type: 'number', match: numberMatch },
      identMatch && { type: 'identifier', match: identMatch },
    ].filter(Boolean);

    const earliest = candidates.reduce((best, cur) => {
      if (cur.match.index !== 0) return best;
      if (!best) return cur;
      return cur.match[0].length > best.match[0].length ? cur : best;
    }, null);

    if (earliest) {
      const token = earliest.match[0];
      if (earliest.type === 'comment') {
        out += `<span class="hl-comment">${escapeHtml(token)}</span>`;
      } else if (earliest.type === 'string') {
        out += `<span class="hl-string">${escapeHtml(token)}</span>`;
      } else if (earliest.type === 'number') {
        out += `<span class="hl-number">${escapeHtml(token)}</span>`;
      } else if (keywords.has(token)) {
        out += `<span class="hl-keyword">${escapeHtml(token)}</span>`;
      } else {
        out += escapeHtml(token);
      }
      i += token.length;
      continue;
    }

    out += escapeHtml(code[i]);
    i += 1;
  }

  return out;
}

function highlight(code, lang) {
  const normalized = ALIASES[lang] || lang;
  if (!normalized || !(normalized in KEYWORDS)) {
    return escapeHtml(code);
  }
  return tokenize(code, normalized);
}

module.exports = { highlight, escapeHtml };
