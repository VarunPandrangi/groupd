function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function applyInlineFormatting(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\+\+([^+]+)\+\+/g, '<u>$1</u>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
}

export function normalizeRichTextHtml(value) {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return '';
  }

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(normalized);

  if (looksLikeHtml) {
    return sanitizedRichTextHtml(normalized);
  }

  const escaped = escapeHtml(normalized).replace(/\r\n/g, '\n');
  const withFormatting = applyInlineFormatting(escaped).replace(/\n/g, '<br>');
  return sanitizedRichTextHtml(withFormatting);
}

export function sanitizedRichTextHtml(value) {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return '';
  }

  if (typeof window === 'undefined') {
    return normalized;
  }

  const parser = new window.DOMParser();
  const documentNode = parser.parseFromString(`<div>${normalized}</div>`, 'text/html');
  const sourceRoot = documentNode.body.firstElementChild;
  const cleanRoot = documentNode.createElement('div');
  const allowedTags = new Set(['BR', 'DIV', 'P', 'STRONG', 'B', 'EM', 'I', 'U']);

  function appendSanitizedNode(node, parent) {
    if (node.nodeType === window.Node.TEXT_NODE) {
      parent.appendChild(documentNode.createTextNode(node.textContent || ''));
      return;
    }

    if (node.nodeType !== window.Node.ELEMENT_NODE) {
      return;
    }

    const tagName = node.tagName.toUpperCase();

    if (!allowedTags.has(tagName)) {
      Array.from(node.childNodes).forEach((childNode) => appendSanitizedNode(childNode, parent));
      return;
    }

    const cleanNode = documentNode.createElement(tagName.toLowerCase());
    Array.from(node.childNodes).forEach((childNode) => appendSanitizedNode(childNode, cleanNode));
    parent.appendChild(cleanNode);
  }

  Array.from(sourceRoot?.childNodes ?? []).forEach((childNode) =>
    appendSanitizedNode(childNode, cleanRoot)
  );

  const sanitizedHtml = cleanRoot.innerHTML
    .replace(/<(b|strong)>/gi, '<strong>')
    .replace(/<\/(b|strong)>/gi, '</strong>')
    .replace(/<(i|em)>/gi, '<em>')
    .replace(/<\/(i|em)>/gi, '</em>')
    .replace(/(<br>\s*){3,}/gi, '<br><br>');

  const plainText = cleanRoot.textContent?.replace(/\s+/g, ' ').trim() || '';
  return plainText ? sanitizedHtml : '';
}

export function getRichTextPlainText(value) {
  const normalized = normalizeRichTextHtml(value);

  if (!normalized) {
    return '';
  }

  if (typeof window === 'undefined') {
    return normalized.replace(/<[^>]+>/g, ' ');
  }

  const parser = new window.DOMParser();
  const documentNode = parser.parseFromString(`<div>${normalized}</div>`, 'text/html');
  return (documentNode.body.textContent || '').replace(/\s+/g, ' ').trim();
}
