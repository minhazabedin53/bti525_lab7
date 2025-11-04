import MarkdownIt from "markdown-it";
import Fragment from "../model/fragment.js";

const md = new MarkdownIt();

/**
 * Convert a fragment to a requested extension.
 * Step 21: support only Markdown -> HTML.
 *
 * @param {string} ownerId - authenticated user's ownerId
 * @param {string} id - fragment id
 * @param {string} ext - requested target extension (e.g., 'html')
 * @returns {Promise<{buffer: Buffer, type: string}>}
 */
export async function convertFragment(ownerId, id, ext) {
  const frag = await Fragment.byId(ownerId, id);
  if (!frag) {
    const err = new Error("fragment not found");
    err.status = 404;
    throw err;
  }

  const sourceType = String(frag.type || "").toLowerCase();
  const targetExt = String(ext || "").toLowerCase();

  const isMarkdown =
    sourceType === "text/markdown" || sourceType === "text/x-markdown";
  if (!isMarkdown) {
    const err = new Error(
      "only Markdown fragments are convertible at this time",
    );
    err.status = 415;
    throw err;
  }

  if (targetExt !== "html") {
    const err = new Error("only .html output is supported at this time");
    err.status = 415;
    throw err;
  }

  const raw = await frag.getData();
  const markdown = raw?.toString("utf8") ?? "";
  const html = md.render(markdown);

  return {
    buffer: Buffer.from(html, "utf8"),
    type: "text/html; charset=utf-8",
  };
}
