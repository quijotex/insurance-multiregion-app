import { TestBed } from '@angular/core/testing';
import { RichTextComponent } from './rich-text.component';
import { mapRichText } from './rich-text.mapper';

const text = (value: string, extra: Record<string, boolean> = {}) => ({
  type: 'text',
  text: value,
  ...extra,
});

function render(raw: unknown): HTMLElement {
  const fixture = TestBed.createComponent(RichTextComponent);
  fixture.componentRef.setInput('blocks', mapRichText(raw));
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('US-03 · FR-005 rich text mapper', () => {
  it('keeps the supported blocks and drops images, code and unknown types', () => {
    const blocks = mapRichText([
      { type: 'paragraph', children: [text('Hola')] },
      { type: 'image', image: { url: '/x.png' } },
      { type: 'code', children: [text('x')] },
      { type: 'mystery', children: [] },
      'not an object',
    ]);
    expect(blocks.map((b) => b.type)).toEqual(['paragraph']);
  });

  it('turns a link with an unsafe protocol into its plain text', () => {
    const [block] = mapRichText([
      {
        type: 'paragraph',
        children: [
          { type: 'link', url: 'javascript:alert(1)', children: [text('pícame')] },
          { type: 'link', url: 'https://example.com/t', children: [text('ok')] },
        ],
      },
    ]);
    expect(block.type === 'paragraph' && block.children).toEqual([
      { type: 'text', text: 'pícame' },
      { type: 'link', url: 'https://example.com/t', children: [{ type: 'text', text: 'ok' }] },
    ]);
  });

  it('R-10 · a link nested in a link becomes its text', () => {
    const [block] = mapRichText([
      {
        type: 'paragraph',
        children: [
          {
            type: 'link',
            url: 'https://example.com/a',
            children: [text('ver '), { type: 'link', url: 'https://example.com/b', children: [text('más')] }],
          },
        ],
      },
    ]);
    expect(block.type === 'paragraph' && block.children).toEqual([
      {
        type: 'link',
        url: 'https://example.com/a',
        children: [
          { type: 'text', text: 'ver ' },
          { type: 'text', text: 'más' },
        ],
      },
    ]);
  });

  it('returns [] for missing or malformed input', () => {
    expect(mapRichText(undefined)).toEqual([]);
    expect(mapRichText({})).toEqual([]);
  });
});

describe('US-03 · FR-005 rich text component', () => {
  it('renders headings (shifted to h3-h4), paragraphs, lists, quotes and inline styles', () => {
    const el = render([
      { type: 'heading', level: 1, children: [text('Título')] },
      { type: 'heading', level: 3, children: [text('Subtítulo')] },
      {
        type: 'paragraph',
        children: [
          text('a', { bold: true }),
          text('b', { italic: true }),
          text('c', { underline: true }),
        ],
      },
      { type: 'list', format: 'ordered', children: [{ type: 'list-item', children: [text('uno')] }] },
      { type: 'list', format: 'unordered', children: [{ type: 'list-item', children: [text('dos')] }] },
      { type: 'quote', children: [text('cita')] },
    ]);
    expect(el.querySelector('h3')?.textContent).toContain('Título');
    expect(el.querySelector('h4')?.textContent).toContain('Subtítulo');
    expect(el.querySelector('h1, h2')).toBeNull();
    expect(el.querySelector('.rich-text__bold')?.textContent).toBe('a');
    expect(el.querySelector('.rich-text__italic')?.textContent).toBe('b');
    expect(el.querySelector('.rich-text__underline')?.textContent).toBe('c');
    expect(el.querySelector('ol li')?.textContent).toContain('uno');
    expect(el.querySelector('ul li')?.textContent).toContain('dos');
    expect(el.querySelector('blockquote')?.textContent).toContain('cita');
  });

  it('opens safe links in a new tab and shows an unsafe link as text', () => {
    const el = render([
      {
        type: 'paragraph',
        children: [
          { type: 'link', url: 'https://example.com', children: [text('seguro')] },
          { type: 'link', url: 'javascript:alert(1)', children: [text('peligroso')] },
        ],
      },
    ]);
    const links = el.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('https://example.com');
    expect(links[0].getAttribute('target')).toBe('_blank');
    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer');
    expect(el.textContent).toContain('peligroso');
  });

  it('escapes markup in the text and renders no image', () => {
    const el = render([
      { type: 'paragraph', children: [text('<script>alert(1)</script><img src=x>')] },
      { type: 'image', image: { url: '/x.png' } },
    ]);
    expect(el.querySelector('script')).toBeNull();
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent).toContain('<script>alert(1)</script>');
  });
});
