// Markdown helpers for the notes panel.
//
// A note is stored only as Markdown. To edit the rendered preview directly (highlight a
// selection, toggle a task, ...), remarkNoteSource gives every rendered element its source
// range (data-s / data-e = offsets into the Markdown string) and wraps text in
// <span data-t>, so a DOM selection can be mapped back to the source (utils/noteSelection.js).
//
// Highlights are written as <mark>…</mark> (or <mark class="green">…</mark>): plain HTML that
// other Markdown renderers (GitLab, VS Code, Obsidian) show as well. The preview renders no
// other raw HTML - it shows up as text.

export const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink'];

const MARK_OPEN = /^<mark(?:\s+class\s*=\s*"([a-z]+)")?\s*>$/i;
const MARK_CLOSE = /^<\/mark\s*>$/i;

/** Opening tag of a highlight; yellow is the default and needs no class. */
export const markOpenTag = color => (color && color !== 'yellow' ? `<mark class="${color}">` : '<mark>');
export const MARK_CLOSE_TAG = '</mark>';

/** Remark plugin: <mark> highlights and source positions for the preview (see above). */
export function remarkNoteSource() {
  return tree => {
    convertMarks(tree);
    tagSource(tree);
  };
}

/** Turns <mark>…</mark> HTML within the same parent (paragraph, heading, ...) into mark nodes. */
function convertMarks(node) {
  const { children } = node;
  if (!children) return;
  const open = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type !== 'html' || !child.position) continue;
    if (MARK_OPEN.test(child.value)) {
      open.push(i);
    } else if (MARK_CLOSE.test(child.value) && open.length) {
      const start = open.pop();
      const color = MARK_OPEN.exec(children[start].value)[1]?.toLowerCase();
      const mark = {
        type: 'mark',
        children: children.slice(start + 1, i),
        position: { start: children[start].position.start, end: child.position.end },
        data: {
          hName: 'mark',
          hProperties: HIGHLIGHT_COLORS.includes(color) && color !== 'yellow' ? { className: [color] } : {},
        },
      };
      children.splice(start, i - start + 1, mark);
      i = start;
    }
  }
  children.forEach(convertMarks);
}

function tagSource(node) {
  for (const child of node.children || []) {
    const start = child.position?.start.offset;
    const end = child.position?.end.offset;
    if (child.type !== 'html' && start !== undefined && end !== undefined) {
      child.data = child.data || {};
      const props = { dataS: start, dataE: end };
      if (child.type === 'text') child.data.hName = 'span';
      if (child.type === 'text' || child.type === 'inlineCode') props.dataT = '';
      child.data.hProperties = { ...child.data.hProperties, ...props };
    }
    tagSource(child);
  }
}

/** Applies non-overlapping edits [{from, to, insert}] (offsets into `source`). */
export function applyEdits(source, edits) {
  // Back to front, so earlier offsets stay valid. At the same offset the longer edit (a deletion)
  // goes first, so an insertion there is not deleted with it.
  const sorted = [...edits].sort((a, b) => b.from - a.from || b.to - a.to);
  let result = source;
  for (const { from, to, insert = '' } of sorted) {
    result = result.slice(0, from) + insert + result.slice(to);
  }
  return result;
}

/** Checks or unchecks the task list item starting at `itemStart`; null if it is no task. */
export function toggleTask(source, itemStart) {
  const match = /^[ \t]*(?:[-*+]|\d{1,9}[.)])[ \t]+\[([ xX])\]/.exec(source.slice(itemStart));
  if (!match) return null;
  const at = itemStart + match[0].length - 2;
  return source.slice(0, at) + (match[1] === ' ' ? 'x' : ' ') + source.slice(at + 1);
}

/** Title for the note list: the first line with text, without Markdown syntax. */
export function deriveTitle(content, maxLength = 120) {
  let inFence = false;
  for (const raw of content.split('\n')) {
    if (/^\s*(```|~~~)/.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || /^\s*([-*_=])(\s*\1){2,}\s*$/.test(raw) || /^[\s|:-]*$/.test(raw)) continue;
    const line = raw
      .replace(/<\/?mark[^>]*>/gi, '')
      .replace(/^\s*(?:>\s*)*/, '')
      .replace(/^(?:#{1,6}\s+|[-*+]\s+(?:\[[ xX]\]\s+)?|\d{1,9}[.)]\s+)/, '')
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*~`]+/g, '')
      .trim();
    if (line) return line.slice(0, maxLength);
  }
  return '';
}

// ── Formatting in the Markdown textarea ──
// Each helper takes the text and the selection and returns the replacement
// {from, to, insert} and the selection afterwards {selStart, selEnd}.

/** Length of the run of `char` ending before `pos` (dir -1) or starting at `pos` (dir 1). */
function runLength(text, pos, char, dir) {
  let n = 0;
  for (let i = dir < 0 ? pos - 1 : pos; i >= 0 && i < text.length && text[i] === char; i += dir) n++;
  return n;
}

/**
 * Bold (**), italic (*), strikethrough (~~) or code (`): removes the markers if the selection is
 * wrapped in them (inside or right outside of it), otherwise wraps the selection.
 */
export function toggleInline(text, start, end, marker, placeholder) {
  const selected = text.slice(start, end);
  const char = marker[0];
  // * is italic and ** bold: a run of 3 is both, a run of 2 is not italic
  const fits = n => n === marker.length || (char === '*' && n === 3);

  if (selected.length > 2 * marker.length
      && fits(runLength(selected, 0, char, 1)) && fits(runLength(selected, selected.length, char, -1))) {
    const inner = selected.slice(marker.length, selected.length - marker.length);
    return { from: start, to: end, insert: inner, selStart: start, selEnd: start + inner.length };
  }
  if (fits(runLength(text, start, char, -1)) && fits(runLength(text, end, char, 1))) {
    const from = start - marker.length;
    return { from, to: end + marker.length, insert: selected, selStart: from, selEnd: from + selected.length };
  }
  const inner = selected || placeholder;
  const selStart = start + marker.length;
  return { from: start, to: end, insert: marker + inner + marker, selStart, selEnd: selStart + inner.length };
}

/** Highlight (<mark>): same as toggleInline. */
export function toggleMark(text, start, end, placeholder) {
  const selected = text.slice(start, end);
  const inside = /^<mark[^>]*>([\s\S]*)<\/mark>$/i.exec(selected);
  if (inside) {
    return { from: start, to: end, insert: inside[1], selStart: start, selEnd: start + inside[1].length };
  }
  const before = /<mark[^>]*>$/i.exec(text.slice(Math.max(0, start - 40), start));
  if (before && text.startsWith(MARK_CLOSE_TAG, end)) {
    const from = start - before[0].length;
    return { from, to: end + MARK_CLOSE_TAG.length, insert: selected, selStart: from, selEnd: from + selected.length };
  }
  const inner = selected || placeholder;
  const open = markOpenTag();
  const selStart = start + open.length;
  return { from: start, to: end, insert: open + inner + MARK_CLOSE_TAG, selStart, selEnd: selStart + inner.length };
}

/** Whole lines touched by the selection: [from, to). A selection ending at a line start excludes that line. */
function lineRange(text, start, end) {
  const from = text.lastIndexOf('\n', start - 1) + 1;
  const last = end > start && text[end - 1] === '\n' ? end - 1 : end;
  const lineEnd = text.indexOf('\n', last);
  return [from, Math.max(lineEnd === -1 ? text.length : lineEnd, from)];
}

const LIST_PREFIX = /^([-*+][ \t]+\[[ xX]\][ \t]+|[-*+][ \t]+|\d{1,9}[.)][ \t]+)/;
const LINE_KINDS = {
  bullet: /^\s*[-*+][ \t]+(?!\[[ xX]\])/,
  number: /^\s*\d{1,9}[.)][ \t]+/,
  task: /^\s*[-*+][ \t]+\[[ xX]\][ \t]+/,
};

/** Heading (cycles # → ## → ### → none), bullet/numbered/task list or quote for the selected lines. */
export function toggleLines(text, start, end, kind) {
  const [from, to] = lineRange(text, start, end);
  const lines = text.slice(from, to).split('\n');
  let result;

  if (kind === 'heading') {
    const level = /^(#{1,6})\s/.exec(lines[0])?.[1].length ?? 0;
    const next = level >= 3 ? 0 : level + 1;
    result = lines.map(l => (next ? `${'#'.repeat(next)} ` : '') + l.replace(/^#{1,6}\s+/, ''));
  } else if (kind === 'quote') {
    const quoted = lines.every(l => /^>/.test(l));
    result = lines.map(l => (quoted ? l.replace(/^>\s?/, '') : `> ${l}`));
  } else {
    const filled = lines.filter(l => l.trim());
    const remove = filled.length > 0 && filled.every(l => LINE_KINDS[kind].test(l));
    let n = 0;
    result = lines.map(l => {
      const indent = /^\s*/.exec(l)[0];
      const body = l.slice(indent.length).replace(LIST_PREFIX, '');
      if (remove) return indent + body;
      if (!l.trim() && lines.length > 1) return l;
      const prefix = kind === 'bullet' ? '- ' : kind === 'task' ? '- [ ] ' : `${++n}. `;
      return indent + prefix + body;
    });
  }

  const insert = result.join('\n');
  if (start === end && lines.length === 1) {
    // Keep the caret on the same text
    const caret = Math.max(from, start + insert.length - (to - from));
    return { from, to, insert, selStart: caret, selEnd: caret };
  }
  return { from, to, insert, selStart: from, selEnd: from + insert.length };
}

/** Inline code, or a fenced code block if the selection spans several lines. */
export function toggleCode(text, start, end, placeholder) {
  if (!text.slice(start, end).includes('\n')) return toggleInline(text, start, end, '`', placeholder);
  const [from, to] = lineRange(text, start, end);
  const block = text.slice(from, to);
  const fenced = /^```[^\n]*\n([\s\S]*)\n```$/.exec(block);
  if (fenced) return { from, to, insert: fenced[1], selStart: from, selEnd: from + fenced[1].length };
  // Caret behind the opening fence, to type the language
  return { from, to, insert: `\`\`\`\n${block}\n\`\`\``, selStart: from + 3, selEnd: from + 3 };
}

/** Link around the selection; the URL part is selected so it can be typed right away. */
export function insertLink(text, start, end, placeholder) {
  const selected = text.slice(start, end);
  if (/^https?:\/\/\S+$/.test(selected)) {
    const insert = `[${placeholder}](${selected})`;
    return { from: start, to: end, insert, selStart: start + 1, selEnd: start + 1 + placeholder.length };
  }
  const label = selected || placeholder;
  const insert = `[${label}](https://)`;
  const urlStart = start + label.length + 3;
  return { from: start, to: end, insert, selStart: urlStart, selEnd: urlStart + 'https://'.length };
}

/**
 * Enter in a list item or quote: continues it on the next line, or ends the list if the item is
 * empty. Null if the line is no list item (normal Enter).
 */
export function continueList(text, pos) {
  const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
  const lineEnd = text.indexOf('\n', pos);
  const line = text.slice(lineStart, pos);
  const rest = text.slice(pos, lineEnd === -1 ? text.length : lineEnd);
  const m = /^(\s*)(?:([-*+])[ \t]+(\[[ xX]\][ \t]+)?|(\d{1,9})([.)])[ \t]+|(>)[ \t]?)/.exec(line);
  if (!m) return null;

  if (!line.slice(m[0].length).trim() && !rest.trim()) {
    // Empty item: end the list. With a blank line before the next text - otherwise Markdown
    // would continue the previous item with it (lazy continuation).
    const previousLine = text.slice(text.lastIndexOf('\n', lineStart - 2) + 1, Math.max(lineStart - 1, 0));
    const insert = lineStart > 0 && previousLine.trim() ? '\n' : '';
    const caret = lineStart + insert.length;
    return { from: lineStart, to: pos, insert, selStart: caret, selEnd: caret };
  }
  const [, indent, bullet, task, number, delimiter] = m;
  const prefix = bullet ? `${bullet} ${task ? '[ ] ' : ''}` : number ? `${Number(number) + 1}${delimiter} ` : '> ';
  const insert = `\n${indent}${prefix}`;
  return { from: pos, to: pos, insert, selStart: pos + insert.length, selEnd: pos + insert.length };
}
