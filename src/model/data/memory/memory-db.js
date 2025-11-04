// Simple in-memory key-value stores for fragment metadata and data.
// Key format: `${ownerId}:${id}`

const metaStore = new Map(); // stores metadata objects
const dataStore = new Map(); // stores Buffers

const key = (ownerId, id) => `${ownerId}:${id}`;

/**
 * Write/replace a fragment's metadata.
 * @param {string} ownerId
 * @param {object} fragment  { id, ownerId, type, size, created, updated, ... }
 * @returns {Promise<object>} stored fragment metadata
 */
export async function writeFragment(ownerId, fragment) {
  if (!ownerId || !fragment?.id)
    throw new Error("writeFragment requires ownerId and fragment.id");
  const k = key(ownerId, fragment.id);
  metaStore.set(k, { ...fragment });
  return metaStore.get(k);
}

/**
 * Read a fragment's metadata.
 * @param {string} ownerId
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function readFragment(ownerId, id) {
  const k = key(ownerId, id);
  return metaStore.get(k) ?? null;
}

/**
 * Write/replace a fragment's binary data (Buffer).
 * @param {string} ownerId
 * @param {string} id
 * @param {Buffer|Uint8Array|string} buffer
 * @returns {Promise<number>} number of bytes written
 */
export async function writeFragmentData(ownerId, id, buffer) {
  const k = key(ownerId, id);
  const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || "");
  dataStore.set(k, data);
  return data.byteLength;
}

/**
 * Read a fragment's raw data (Buffer).
 * @param {string} ownerId
 * @param {string} id
 * @returns {Promise<Buffer|null>}
 */
export async function readFragmentData(ownerId, id) {
  const k = key(ownerId, id);
  return dataStore.get(k) ?? null;
}

/**
 * List fragment IDs for an owner.
 * @param {string} ownerId
 * @returns {Promise<string[]>}
 */
export async function listFragmentIds(ownerId) {
  const prefix = `${ownerId}:`;
  const ids = [];
  for (const k of metaStore.keys()) {
    if (k.startsWith(prefix)) {
      ids.push(k.slice(prefix.length));
    }
  }
  return ids;
}

/**
 * List fragment metadata objects for an owner.
 * @param {string} ownerId
 * @returns {Promise<object[]>}
 */
export async function listFragments(ownerId) {
  const prefix = `${ownerId}:`;
  const out = [];
  for (const [k, v] of metaStore.entries()) {
    if (k.startsWith(prefix)) out.push(v);
  }
  return out;
}

/**
 * Delete a fragment (metadata + data). Returns true if anything was deleted.
 * @param {string} ownerId
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteFragment(ownerId, id) {
  const k = key(ownerId, id);
  const m = metaStore.delete(k);
  const d = dataStore.delete(k);
  return m || d;
}

/** Reset both stores (handy for unit tests) */
export async function reset() {
  metaStore.clear();
  dataStore.clear();
}
