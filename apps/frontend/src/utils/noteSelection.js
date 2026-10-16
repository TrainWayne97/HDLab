// Maps a selection in the rendered note back to the Markdown source and builds the source
// edits for formatting it right in the preview. Relies on the data-s / data-e / data-t
// attributes from remarkNoteSource (utils/noteMarkdown.js).

import { markOpenTag, MARK_CLOSE_TAG } from './noteMarkdown';

// Elements a highlight or bold text cannot span: each gets its own pair of markers
const BLOCK_SELECTOR = 'p,h1,h2,h3,h4,h5,h6,li,td,th';
const FORMATS = {
  bold: { tag: 'STRONG', marker: '**' },
  italic: { tag: 'EM', marker: '*' },
  strike: { tag: 'DEL', marker: '~~' },
};

const startOf = el => Number(el.dataset.s);
const endOf = el => Number(el.dataset.e);

/**
 * Source range of each character of `text`, the rendered form of `src` (without escapes,
 * entities, quote/list prefixes of continued lines, ...): starts[i] / ends[i] are offsets in src.
 */
export function alignText(text, src) {
  const starts = new Array(text.length);
  const ends = new Array(text.length);
  let j = 0;
  for (let i = 0; i < text.length; i++) {
    const k = src.indexOf(text[i], j);
    if (k === -1 || k - j > 40) {
      // Not in the source: an entity like &copy; (or something unexpected) - consume one token
      const semi = src[j] === '&' ? src.indexOf(';', j) : -1;
      starts[i] = Math.min(j, src.length);
      j = Math.min(semi !== -1 && semi - j < 32 ? semi + 1 : j + 1, src.length);
      ends[i] = j;
      continue;
    }
    // A backslash escape belongs to the character: \* is one rendered *
    starts[i] = k > j && src[k - 1] === '\\' ? k - 1 : k;
    ends[i] = k + 1;
    j = k + 1;
  }
  return { starts, ends };
}

/** Source offset of a boundary at `offset` in the text of a [data-t] element. */
function sourceOffset(el, offset, side, source) {
  const s = startOf(el);
  const text = el.textContent;
  if (!text.length) return s;
  const { starts, ends } = alignText(text, source.slice(s, endOf(el)));
  if (side === 'start') return s + (offset < text.length ? starts[offset] : ends[text.length - 1]);
  return s + (offset > 0 ? ends[offset - 1] : starts[0]);
}

/** Selected part [from, to) of the text of a [data-t] element, null if none. */
function selectedPart(el, range) {
  const node = el.firstChild;
  if (!node || node.nodeType !== Node.TEXT_NODE) return null;
  let from = 0;
  let to = node.length;
  if (range.comparePoint(node, 0) < 0) from = range.startContainer === node ? range.startOffset : node.length;
  if (range.comparePoint(node, node.length) > 0) to = range.endContainer === node ? range.endOffset : 0;
  return to > from ? [from, to] : null;
}

/**
 * The current selection in `container` (the rendered `source`), or null.
 * groups: the selected text per block (paragraph, list item, ...) -
 *   { block, first, last, spans, from, to } with [from, to) in the source.
 */
export function readSelection(container, source) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return null;

  const groups = [];
  for (const el of container.querySelectorAll('[data-t]')) {
    if (!range.intersectsNode(el)) continue;
    const part = selectedPart(el, range);
    const block = part && el.closest(BLOCK_SELECTOR);
    if (!block || !container.contains(block)) continue;
    const group = groups[groups.length - 1];
    if (group?.block === block) {
      Object.assign(group, { last: el, lastTo: part[1] });
      group.spans.push(el);
    } else {
      groups.push({ block, first: el, firstFrom: part[0], last: el, lastTo: part[1], spans: [el] });
    }
  }
  for (const group of groups) {
    group.from = sourceOffset(group.first, group.firstFrom, 'start', source);
    group.to = sourceOffset(group.last, group.lastTo, 'end', source);
  }
  return { range, groups };
}

/** Source range [from, to) of the whole selection (also outside of text, e.g. in code blocks). */
export function selectionSourceRange(container, selection) {
  const { groups, range } = selection;
  if (groups.length) return [groups[0].from, groups[groups.length - 1].to];
  const elementOf = node => (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement);
  const first = elementOf(range.startContainer)?.closest('[data-s]');
  const last = elementOf(range.endContainer)?.closest('[data-s]');
  if (!first || !last || !container.contains(first) || !container.contains(last)) return null;
  return [startOf(first), Math.max(startOf(first), endOf(last))];
}

/**
 * Source range of a group, widened so it does not cut through inline elements (bold text,
 * links, highlights, inline code), without whitespace at its ends.
 */
function balancedRange(group, source) {
  const { block, first, last } = group;
  let { from, to } = group;
  for (let n = first; n && n !== block; n = n.parentElement) {
    const cut = n === first ? n.tagName === 'CODE' : !n.contains(last);
    if (cut && n.dataset.s !== undefined) from = Math.min(from, startOf(n));
  }
  for (let n = last; n && n !== block; n = n.parentElement) {
    const cut = n === last ? n.tagName === 'CODE' : !n.contains(first);
    if (cut && n.dataset.e !== undefined) to = Math.max(to, endOf(n));
  }
  while (from < to && /\s/.test(source[from])) from++;
  while (to > from && /\s/.test(source[to - 1])) to--;
  return [from, to];
}

/** Innermost element with `tagName` that contains the whole group (within its block). */
function enclosing(group, tagName) {
  for (let n = group.first.parentElement; n && n !== group.block; n = n.parentElement) {
    if (n.tagName === tagName && n.contains(group.last)) return n;
  }
  return null;
}

/** Elements matching `selector` in the block that lie completely in [from, to). */
function elementsInside(block, selector, from, to) {
  return [...block.querySelectorAll(selector)].filter(el => startOf(el) >= from && endOf(el) <= to);
}

/** Length of the opening and closing syntax of an inline element, e.g. [2, 2] for **bold**. */
function syntaxLengths(el, source) {
  const src = source.slice(startOf(el), endOf(el));
  switch (el.tagName) {
    case 'MARK':
      return [/^<mark[^>]*>/i.exec(src)?.[0].length ?? 0, /<\/mark\s*>$/i.exec(src)?.[0].length ?? 0];
    case 'STRONG':
      return [2, 2];
    case 'EM':
      return [1, 1];
    case 'DEL': {
      const n = /^~+/.exec(src)?.[0].length ?? 0;
      return [n, n];
    }
    default:
      return [0, 0];
  }
}

/** Edits that remove the formatting of an inline element but keep its content. */
function unwrapEdits(el, source) {
  const [open, close] = syntaxLengths(el, source);
  return [
    { from: startOf(el), to: startOf(el) + open },
    { from: endOf(el) - close, to: endOf(el) },
  ];
}

/** Edits that wrap each selected block part in `open`/`close`, replacing `selector` elements in it. */
function wrapEdits(groups, source, selector, open, close) {
  const edits = [];
  for (const group of groups) {
    const [from, to] = balancedRange(group, source);
    if (from >= to) continue;
    for (const el of elementsInside(group.block, selector, from, to)) edits.push(...unwrapEdits(el, source));
    edits.push({ from, to: from, insert: open }, { from: to, to, insert: close });
  }
  return edits;
}

/** Highlights the selection; text that is completely highlighted already gets the new colour. */
export function highlightEdits(selection, source, color) {
  const recolor = [];
  const wrap = [];
  for (const group of selection.groups) {
    const mark = enclosing(group, 'MARK');
    if (mark) recolor.push(mark);
    else wrap.push(group);
  }
  const edits = [...new Set(recolor)].map(mark => ({
    from: startOf(mark),
    to: startOf(mark) + syntaxLengths(mark, source)[0],
    insert: markOpenTag(color),
  }));
  return edits.concat(wrapEdits(wrap, source, 'mark', markOpenTag(color), MARK_CLOSE_TAG));
}

/** Highlights that touch the selection. */
function touchedMarks(selection) {
  const marks = new Set();
  for (const group of selection.groups) {
    for (const span of group.spans) {
      for (let n = span.parentElement; n && n !== group.block; n = n.parentElement) {
        if (n.tagName === 'MARK') marks.add(n);
      }
    }
  }
  return marks;
}

export const hasHighlight = selection => touchedMarks(selection).size > 0;

/** Removes every highlight that touches the selection. */
export function removeHighlightEdits(selection, source) {
  return [...touchedMarks(selection)].flatMap(mark => unwrapEdits(mark, source));
}

/** Bold / italic / strikethrough: removed if the whole selection has it, otherwise added. */
export function formatEdits(selection, source, kind) {
  const { tag, marker } = FORMATS[kind];
  const formatted = selection.groups.map(group => enclosing(group, tag));
  if (formatted.length && formatted.every(Boolean)) {
    return [...new Set(formatted)].flatMap(el => unwrapEdits(el, source));
  }
  const groups = selection.groups.filter((_, i) => !formatted[i]);
  return wrapEdits(groups, source, tag.toLowerCase(), marker, marker);
}
