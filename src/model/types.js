// Supported content types for Assignment 2
// (text/plain, text/markdown, application/json, text/html)

export function mediaTypeOf(contentType = '') {
  const [type] = String(contentType).split(';');
  const base = type.trim().toLowerCase();

  if (base === 'text/x-markdown') return 'text/markdown';

  return base;
}

export function isSupportedType(contentType = '') {
  const supported = new Set([
    'text/plain',
    'text/markdown',
    'application/json',
    'text/html',
  ]);
  return supported.has(mediaTypeOf(contentType));
}
