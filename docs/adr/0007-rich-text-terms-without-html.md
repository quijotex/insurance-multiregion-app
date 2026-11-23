# 0007 — Terms and conditions as Strapi blocks, rendered without HTML

- **Status:** Accepted (Gate 2, US-03 — 2026-11-22)
- **Date:** 2026-11-22
- **Related:** US-03, ADR 0001 (`termsAndConditions` on Country), `specs/004-us-03-summary-payment/research.md` (R5)

## Context and problem

Each country's terms and conditions are written by the business team in Strapi as rich text with basic formatting: headings, paragraphs, bold, lists and links (clarify Q4, FR-005). Angular must show them on the summary. Rendering editor content as HTML is the classic XSS path, and the project avoids new dependencies.

## Decision drivers

- Editors format text without knowing HTML or Markdown.
- No raw HTML in the page: no `innerHTML`, no `bypassSecurityTrust*`.
- No new dependency (constitution §3.2).
- Readable on mobile, keyboard-reachable.

## Considered options

1. **Strapi `blocks` field + our own Angular renderer** using templates.
2. **Strapi `richtext` (Markdown) + a Markdown library** that outputs HTML, then sanitised.
3. **Plain long text**, split into paragraphs.

## Decision

Chosen option: **1**.
- Country gains `termsAndConditions` (`blocks`).
- A `RichTextComponent` (shared UI) walks the JSON with `@switch` / `@for`: paragraph, heading (shifted to `h3`–`h4`), ordered and unordered list, quote; inline text with bold, italic, underline; links.
- Links render only for `https:`, `http:` and `mailto:`, open in a new tab with `rel="noopener noreferrer"`; any other scheme (e.g. `javascript:`) renders as plain text.
- Images, code and unknown types are dropped by the mapper.
- All text goes through Angular interpolation, so it is always escaped.

## Consequences

- **Positive:** safe by construction; no dependency; editors get Strapi's visual editor; the renderer is small and tested.
- **Negative / trade-offs:**
  - Only the supported block types render; an editor's image or code block silently does not appear (the field description says so).
  - If Strapi changes the blocks format, the renderer must follow (it is versioned with the app).
- **Follow-ups:** other CMS-managed long texts (e.g. plan details) can reuse the component.

## Pros and cons of the options

### 1. Blocks + own renderer
- Good: no HTML, no dependency, structured data.
- Bad: we maintain ~60 lines of templates.

### 2. Markdown + library
- Good: well-known format, any formatting.
- Bad: a new dependency, HTML output that must be sanitised, and editors must learn Markdown.

### 3. Plain text
- Good: the simplest and safe.
- Bad: no headings or lists, which clarify Q4 rejected.
