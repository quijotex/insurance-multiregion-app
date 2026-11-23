/** Rich text subset rendered by the app (Strapi `blocks`, ADR 0007). */
export type RichTextInline =
  | { type: 'text'; text: string; bold?: boolean; italic?: boolean; underline?: boolean }
  | { type: 'link'; url: string; children: RichTextInline[] };

export interface RichTextListItem {
  type: 'list-item';
  children: RichTextInline[];
}

export type RichTextBlock =
  | { type: 'paragraph' | 'quote'; children: RichTextInline[] }
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: RichTextInline[] }
  | { type: 'list'; format: 'ordered' | 'unordered'; children: RichTextListItem[] };
