import { mediaTypeOf } from '../model/types.js';

/** Parse a Content-Type header into { mediaType, charset } */
export function parseContentType(ct = '') {
  const raw = String(ct).trim();
  const [typePart, ...params] = raw.split(';');
  const mediaType = typePart.trim().toLowerCase();
  const paramMap = new Map();
  for (const p of params) {
    const [k, v] = p.split('=');
    if (k && v) paramMap.set(k.trim().toLowerCase(), v.trim());
  }
  const charset = paramMap.get('charset');
  return { mediaType, charset, raw };
}

/** Normalize a Content-Type string (lowercase, trimmed). Keeps charset. */
export function normalizeContentType(ct = '') {
  const { mediaType, charset } = parseContentType(ct);
  return charset ? `${mediaType}; charset=${charset}` : mediaType;
}

/** Compare two Content-Types by media type only (ignore charset) */
export function sameMediaType(a, b) {
  return mediaTypeOf(a) === mediaTypeOf(b);
}