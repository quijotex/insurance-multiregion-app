import type { RichTextBlock, RichTextInline, RichTextListItem } from './rich-text.model';

const ALLOWED_LINK_PROTOCOLS: readonly string[] = ['https:', 'http:', 'mailto:'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSafeUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  try {
    return ALLOWED_LINK_PROTOCOLS.includes(new URL(url.trim()).protocol);
  } catch {
    return false;
  }
}

/** Inside a link, `allowLinks` is false: a nested link becomes its text (R-10, no link inside a link). */
function mapInlines(raw: unknown, allowLinks = true): RichTextInline[] {
  if (!Array.isArray(raw)) return [];
  const result: RichTextInline[] = [];
  for (const node of raw) {
    if (!isRecord(node)) continue;
    if (node['type'] === 'text' && typeof node['text'] === 'string') {
      const text: RichTextInline = { type: 'text', text: node['text'] };
      if (node['bold'] === true) text.bold = true;
      if (node['italic'] === true) text.italic = true;
      if (node['underline'] === true) text.underline = true;
      result.push(text);
    } else if (node['type'] === 'link') {
      const children = mapInlines(node['children'], false);
      if (allowLinks && isSafeUrl(node['url'])) {
        result.push({ type: 'link', url: node['url'].trim(), children });
      } else {
        result.push(...children);
      }
    }
  }
  return result;
}

function mapBlock(node: Record<string, unknown>): RichTextBlock | null {
  switch (node['type']) {
    case 'paragraph':
    case 'quote':
      return { type: node['type'], children: mapInlines(node['children']) };
    case 'heading': {
      const level = node['level'];
      const safe = typeof level === 'number' && level >= 1 && level <= 6 ? Math.trunc(level) : 2;
      return {
        type: 'heading',
        level: safe as 1 | 2 | 3 | 4 | 5 | 6,
        children: mapInlines(node['children']),
      };
    }
    case 'list': {
      const items: RichTextListItem[] = [];
      if (Array.isArray(node['children'])) {
        for (const item of node['children']) {
          if (isRecord(item) && item['type'] === 'list-item') {
            items.push({ type: 'list-item', children: mapInlines(item['children']) });
          }
        }
      }
      return {
        type: 'list',
        format: node['format'] === 'ordered' ? 'ordered' : 'unordered',
        children: items,
      };
    }
    default:
      return null;
  }
}

function inlinesHaveText(inlines: RichTextInline[]): boolean {
  return inlines.some((inline) =>
    inline.type === 'text' ? inline.text.trim() !== '' : inlinesHaveText(inline.children),
  );
}

/** True when some text (also inside links and list items) is non-blank after trimming. */
export function hasVisibleText(blocks: RichTextBlock[]): boolean {
  return blocks.some((block) =>
    block.type === 'list'
      ? block.children.some((item) => inlinesHaveText(item.children))
      : inlinesHaveText(block.children),
  );
}

/** Keeps the supported blocks, drops images, code and unknown types; missing input gives []. */
export function mapRichText(raw: unknown): RichTextBlock[] {
  if (!Array.isArray(raw)) return [];
  const blocks: RichTextBlock[] = [];
  for (const node of raw) {
    if (!isRecord(node)) continue;
    const block = mapBlock(node);
    if (block) blocks.push(block);
  }
  return blocks;
}
