import Fragment from "../../src/model/fragment.js";
import { readFragment, readFragmentData } from "../../src/model/data/index.js";

const ownerId = "deadbeef";

describe("Fragment class", () => {
  test("constructor validates inputs and normalizes type", () => {
    expect(() => new Fragment({})).toThrow();
    expect(() => new Fragment({ ownerId })).toThrow();
    const f = new Fragment({
      ownerId,
      type: "text/plain; charset=utf-8",
      data: "abc",
    });
    expect(f.type).toBe("text/plain");
    expect(f.size).toBe(3);
    expect(f.ownerId).toBe(ownerId);
    expect(f.id).toBeDefined();
  });

  test("save() writes metadata and data; getData() reads it back", async () => {
    const f = new Fragment({ ownerId, type: "text/plain", data: "hello" });
    await f.save();

    // metadata exists in store
    const meta = await readFragment(ownerId, f.id);
    expect(meta).toBeTruthy();
    expect(meta.size).toBe(5);
    expect(meta.type).toBe("text/plain");

    // raw data exists in store
    const raw = await readFragmentData(ownerId, f.id);
    expect(raw.toString()).toBe("hello");

    // instance getData() reads same
    const data = await f.getData();
    expect(data.toString()).toBe("hello");
  });

  test("setData() updates size and updated timestamp, then save() persists", async () => {
    const f = new Fragment({ ownerId, type: "text/plain", data: "x" });
    const created = f.created;
    await f.save();

    const firstUpdated = f.updated;
    expect(firstUpdated >= created).toBe(true);

    // change data
    f.setData("changed");
    expect(f.size).toBe(7);
    const beforeSaveUpdated = f.updated;

    await f.save();
    const after = await readFragment(ownerId, f.id);
    expect(after.size).toBe(7);
    expect(after.updated >= beforeSaveUpdated).toBe(true);
  });

  test("list and byId helpers", async () => {
    const f1 = new Fragment({ ownerId, type: "text/plain", data: "a" });
    const f2 = new Fragment({ ownerId, type: "text/plain", data: "bb" });
    await f1.save();
    await f2.save();

    const ids = await Fragment.listIds(ownerId);
    expect(ids).toEqual(expect.arrayContaining([f1.id, f2.id]));

    const list = await Fragment.list(ownerId);
    const idsFromList = list.map((f) => f.id);
    expect(idsFromList).toEqual(expect.arrayContaining([f1.id, f2.id]));

    const again = await Fragment.byId(ownerId, f1.id);
    expect(again).toBeTruthy();
    expect(again.id).toBe(f1.id);
  });

  test("rejects unsupported type", () => {
    expect(
      () => new Fragment({ ownerId, type: "application/pdf", data: "x" }),
    ).toThrow();
  });
});
