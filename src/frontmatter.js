'use strict';

// 간단한 front matter 파서. 완전한 YAML 스펙을 지원하지 않고
// `key: value` 라인만 처리한다. tags는 쉼표로 구분된 문자열로 취급한다.
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: raw };
  }

  const [, block, content] = match;
  const data = {};

  for (const line of block.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (key === 'tags') {
      data.tags = value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    } else {
      data[key] = value;
    }
  }

  return { data, content: content.trim() };
}

module.exports = { parseFrontmatter };
