// Tests the re-exported "strategy switcher" layer at src/model/data/index.js

import {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  listFragmentIds,
  listFragments,
  deleteFragment,
} from '../../src/model/data/index.js';

const owner = 'memuser';

describe('memory strategy (data/index.js)', () => {
  test('write/read path works end-to-end', async () => {
    const id = 'z1';
    const now = new Date().toISOString();
    await writeFragment(owner, {
      id,
      ownerId: owner,
      type: 'text/plain',
      size: 0,
      created: now,
      updated: now,
    });
    await writeFragmentData(owner, id, 'ok');

    const meta = await readFragment(owner, id);
    expect(meta).toBeTruthy();
    expect(meta.id).toBe(id);

    const data = await readFragmentData(owner, id);
    expect(data.toString()).toBe('ok');

    const ids = await listFragmentIds(owner);
    expect(ids).toContain(id);

    const list = await listFragments(owner);
    expect(list.map((m) => m.id)).toContain(id);

    const del = await deleteFragment(owner, id);
    expect(del).toBe(true);
  });
});
