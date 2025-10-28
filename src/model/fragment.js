import crypto from 'crypto';
import {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  listFragmentIds,
  listFragments,
  deleteFragment,
} from './data/index.js';

import { mediaTypeOf, isSupportedType } from './types.js';

/**
 * Represents a single data fragment (metadata + data).
 */
export default class Fragment {
  constructor({ id, ownerId, type, size = 0, created, updated, data } = {}) {
    if (!ownerId) throw new Error('ownerId is required');
    if (!type) throw new Error('type is required');
    if (!isSupportedType(type)) throw new Error(`unsupported type: ${type}`);

    this.id = id || crypto.randomUUID();
    this.ownerId = ownerId;
    this.type = mediaTypeOf(type);
    this.size = size;
    const now = new Date().toISOString();
    this.created = created || now;
    this.updated = updated || now;

    if (data) {
      this.setData(data);
    }
  }

  /** Sets or replaces fragment data */
  setData(data) {
    if (!Buffer.isBuffer(data)) {
      data = Buffer.from(String(data));
    }
    this._data = data;
    this.size = data.length;
    this.updated = new Date().toISOString();
  }

  /** Saves metadata and data into the DB */
  async save() {
    await writeFragment(this.ownerId, this.toJSON());
    if (this._data) {
      await writeFragmentData(this.ownerId, this.id, this._data);
    }
  }

  /** Reads the raw data (Buffer) from DB */
  async getData() {
    const data = await readFragmentData(this.ownerId, this.id);
    return data || null;
  }

  /** Deletes the fragment (metadata + data) */
  async delete() {
    return deleteFragment(this.ownerId, this.id);
  }

  /** Convert object for JSON responses */
  toJSON() {
    return {
      id: this.id,
      ownerId: this.ownerId,
      created: this.created,
      updated: this.updated,
      type: this.type,
      size: this.size,
    };
  }

  /** ---------------- Static Helpers ---------------- */

  /** Returns true if type is supported */
  static isSupportedType(type) {
    return isSupportedType(type);
  }

  /** Returns metadata + data for a single fragment */
  static async byId(ownerId, id) {
    const meta = await readFragment(ownerId, id);
    if (!meta) return null;
    return new Fragment(meta);
  }

  /** Returns all fragment IDs for an owner */
  static async listIds(ownerId) {
    return listFragmentIds(ownerId);
  }

  /** Returns all fragment objects for an owner */
  static async list(ownerId) {
    const metas = await listFragments(ownerId);
    return metas.map((m) => new Fragment(m));
  }
}
