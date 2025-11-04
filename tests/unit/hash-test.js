import crypto from "crypto";

function sha256(email) {
  return crypto
    .createHash("sha256")
    .update(String(email).toLowerCase())
    .digest("hex");
}

describe("hash utility (inline test for A1)", () => {
  test("produces 64-hex digest, case-insensitive", () => {
    const a = sha256("User@Example.com");
    const b = sha256("user@example.com");
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(a).toBe(b);
  });
});
