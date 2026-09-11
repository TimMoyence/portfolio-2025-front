const TOKEN_PREFIX = 'MBTOKEN';
const TOKEN_SUFFIX = 'X';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderInlineMarkdown(source: string): string {
  const tokens: string[] = [];
  const token = (html: string): string => {
    const index = tokens.push(html) - 1;
    return `${TOKEN_PREFIX}${index}${TOKEN_SUFFIX}`;
  };

  let text = source.replace(/`([^`\n]+)`/g, (_match, code: string) => {
    return token(`<code>${escapeHtml(code)}</code>`);
  });

  text = text.replace(
    /\[([^\]\n]{1,200})\]\(((?:https?:\/\/|mailto:)[^\s)]{1,500})\)/g,
    (_match, label: string, href: string) =>
      token(`<a href="${escapeHtml(href)}" rel="noopener noreferrer">${escapeHtml(label)}</a>`),
  );

  const html = escapeHtml(text)
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>')
    .replace(/ {2}\n/g, '<br />');

  return html.replace(/MBTOKEN(\d+)X/g, (_match, index: string) => tokens[Number(index)] ?? '');
}

function isHorizontalRule(line: string): boolean {
  const compact = line.trim().replace(/[ \t]/g, '');
  if (compact.length < 3 || !/^[-*_]/.test(compact)) return false;
  return compact.split('').every((character) => character === compact[0]);
}

function parseHeading(line: string): { level: number; title: string } | null {
  const trimmed = line.trim();
  let level = 0;
  while (trimmed[level] === '#') level += 1;
  if (level === 0 || level > 6 || trimmed[level] !== ' ') return null;

  let title = trimmed.slice(level).trim();
  while (title.endsWith('#')) title = title.slice(0, -1).trimEnd();
  return { level: Math.min(level + 1, 6), title };
}

function parseListItem(line: string): { kind: 'ul' | 'ol'; text: string } | null {
  const content = line.trimStart();
  const marker = content[0];
  if (marker === '-' || marker === '*' || marker === '+') {
    return content[1] === ' ' ? { kind: 'ul', text: content.slice(2) } : null;
  }

  let digits = 0;
  while (digits < content.length && content[digits] >= '0' && content[digits] <= '9') digits += 1;
  const punctuation = content[digits];
  if (digits === 0 || (punctuation !== '.' && punctuation !== ')') || content[digits + 1] !== ' ') {
    return null;
  }
  return { kind: 'ol', text: content.slice(digits + 2) };
}

// eslint-disable-next-line sonarjs/cognitive-complexity -- the parser deliberately handles each supported Markdown block in one deterministic pass
export function renderArticleMarkdown(markdown: string): string {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n');
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let quote: string[] = [];
  let listKind: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];
  let codeLines: string[] | null = null;

  const flushParagraph = (): void => {
    if (paragraph.length === 0) return;
    blocks.push(`<p>${renderInlineMarkdown(paragraph.join('\n').trim())}</p>`);
    paragraph = [];
  };

  const flushQuote = (): void => {
    if (quote.length === 0) return;
    blocks.push(`<blockquote><p>${renderInlineMarkdown(quote.join('\n'))}</p></blockquote>`);
    quote = [];
  };

  const flushList = (): void => {
    if (!listKind || listItems.length === 0) return;
    const renderedItems = listItems
      .map((item) => `<li>${renderInlineMarkdown(item)}</li>`)
      .join('');
    blocks.push(`<${listKind}>${renderedItems}</${listKind}>`);
    listKind = null;
    listItems = [];
  };

  const flushCode = (): void => {
    if (codeLines === null) return;
    blocks.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    codeLines = null;
  };

  const flushTextBlocks = (): void => {
    flushParagraph();
    flushQuote();
    flushList();
  };

  for (const line of lines) {
    if (codeLines !== null) {
      if (/^[ \t]*```/.test(line)) flushCode();
      else codeLines.push(line);
      continue;
    }

    if (/^[ \t]*```/.test(line)) {
      flushTextBlocks();
      codeLines = [];
      continue;
    }

    if (line.trim() === '') {
      flushTextBlocks();
      continue;
    }

    const heading = parseHeading(line);
    if (heading) {
      flushTextBlocks();
      blocks.push(`<h${heading.level}>${renderInlineMarkdown(heading.title)}</h${heading.level}>`);
      continue;
    }

    if (isHorizontalRule(line)) {
      flushTextBlocks();
      blocks.push('<hr />');
      continue;
    }

    const listItem = parseListItem(line);
    if (listItem) {
      flushParagraph();
      flushQuote();
      if (listKind !== listItem.kind) {
        flushList();
        listKind = listItem.kind;
      }
      listItems.push(listItem.text);
      continue;
    }

    const quoteLine = /^[ \t]*>[ \t]?([^\n]*)$/.exec(line);
    if (quoteLine) {
      flushParagraph();
      flushList();
      quote.push(quoteLine[1]);
      continue;
    }

    flushQuote();
    flushList();
    paragraph.push(line);
  }

  flushCode();
  flushTextBlocks();
  return blocks.join('\n');
}
