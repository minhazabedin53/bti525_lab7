import crypto from "crypto";
export function hash(email) {
  return crypto
    .createHash("sha256")
    .update(String(email).toLowerCase())
    .digest("hex");
}
