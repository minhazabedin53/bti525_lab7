import {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  listFragmentIds,
  listFragments,
  deleteFragment,
  reset,
} from "../../src/model/data/memory/memory-db.js";

const owner = "abc123";

describe("memory-db (low-level)", () => {
  beforeEach(async () => {
    await reset();
  });

  test("write/read fragment metadata", async () => {
    const meta = {
      id: "id1",
      ownerId: owner,
      type: "text/plain",
      size: 5,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };
    await writeFragment(owner, meta);
    const got = await readFragment(owner, "id1");
    expect(got).toMatchObject(meta);
  });

  test("write/read fragment data", async () => {
    await writeFragment(owner, {
      id: "id2",
      ownerId: owner,
      type: "text/plain",
      size: 0,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    });
    const bytes = await writeFragmentData(owner, "id2", "hello");
    expect(bytes).toBe(5);
    const data = await readFragmentData(owner, "id2");
    expect(Buffer.isBuffer(data)).toBe(true);
    expect(data.toString()).toBe("hello");
  });

  test("list ids and fragments", async () => {
    await writeFragment(owner, {
      id: "a",
      ownerId: owner,
      type: "text/plain",
      size: 1,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    });
    await writeFragment(owner, {
      id: "b",
      ownerId: owner,
      type: "text/plain",
      size: 2,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    });

    expect(await listFragmentIds(owner)).toEqual(
      expect.arrayContaining(["a", "b"]),
    );
    const list = await listFragments(owner);
    expect(list.map((m) => m.id)).toEqual(expect.arrayContaining(["a", "b"]));
  });

  test("delete fragment removes metadata and data", async () => {
    await writeFragment(owner, {
      id: "c",
      ownerId: owner,
      type: "text/plain",
      size: 0,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    });
    await writeFragmentData(owner, "c", "x");
    const ok = await deleteFragment(owner, "c");
    expect(ok).toBe(true);
    expect(await readFragment(owner, "c")).toBeNull();
    expect(await readFragmentData(owner, "c")).toBeNull();
  });
});
