import { Router } from "express";
import express from "express";
import contentType from "content-type";

import { authenticate } from "../auth/basic-auth.js";
import Fragment from "../model/fragment.js";
import { API_URL } from "../config.js";

const router = Router();

const rawBody = () =>
  express.raw({
    inflate: true,
    limit: "5mb",
    type: (req) => {
      try {
        const { type } = contentType.parse(req);
        return Fragment.isSupportedType(type);
      } catch {
        return false;
      }
    },
  });

router.use(authenticate());

/**
 * POST /v1/fragments
 * - Body is raw bytes (Buffer)
 * - Content-Type must be supported
 * - Returns 201 + Location + fragment metadata
 */
router.post("/", rawBody(), async (req, res) => {
  try {
    if (!Buffer.isBuffer(req.body)) {
      req.log?.warn("Unsupported or missing body");
      return res.status(415).json({
        status: "error",
        error: {
          code: 415,
          message: "unsupported Content-Type or empty body",
        },
      });
    }

    const { type } = contentType.parse(req);
    if (!Fragment.isSupportedType(type)) {
      req.log?.warn({ type }, "Unsupported Content-Type");
      return res.status(415).json({
        status: "error",
        error: { code: 415, message: `unsupported Content-Type: ${type}` },
      });
    }

    const fragment = new Fragment({
      ownerId: req.user.ownerId,
      type,
      data: req.body,
    });
    await fragment.save();

    const origin = API_URL || `${req.protocol}://${req.get("host")}`;
    const location = `${origin}/v1/fragments/${fragment.id}`;

    res.set("Location", location);
    req.log?.info(
      { id: fragment.id, type: fragment.type, size: fragment.size },
      "Fragment created",
    );
    return res.status(201).json({ status: "ok", fragment: fragment.toJSON() });
  } catch (err) {
    req.log?.error({ err }, "POST /fragments failed");
    return res.status(500).json({
      status: "error",
      error: { code: 500, message: "internal server error" },
    });
  }
});

/**
 * GET /v1/fragments (?expand=1)
 * - Without expand: returns array of IDs
 * - With expand=1: returns full metadata objects
 */
router.get("/", async (req, res) => {
  try {
    const expand = String(req.query.expand || "").toLowerCase();
    if (expand === "1" || expand === "true") {
      const list = await Fragment.list(req.user.ownerId);
      return res
        .status(200)
        .json({ status: "ok", fragments: list.map((f) => f.toJSON()) });
    }
    const ids = await Fragment.listIds(req.user.ownerId);
    return res.status(200).json({ status: "ok", fragments: ids });
  } catch (err) {
    req.log?.error({ err }, "GET /fragments failed");
    return res.status(500).json({
      status: "error",
      error: { code: 500, message: "internal server error" },
    });
  }
});

/**
 * GET /v1/fragments/:id
 * - Returns raw data (Buffer) with Content-Type of the fragment
 */
router.get("/:id", async (req, res) => {
  try {
    const frag = await Fragment.byId(req.user.ownerId, req.params.id);
    if (!frag) {
      return res.status(404).json({
        status: "error",
        error: { code: 404, message: "fragment not found" },
      });
    }
    const data = await frag.getData();
    if (!data) {
      return res.status(404).json({
        status: "error",
        error: { code: 404, message: "fragment data missing" },
      });
    }
    res.set("Content-Type", frag.type);
    return res.status(200).send(data);
  } catch (err) {
    req.log?.error({ err }, "GET /fragments/:id failed");
    return res.status(500).json({
      status: "error",
      error: { code: 500, message: "internal server error" },
    });
  }
});

/**
 * GET /v1/fragments/:id/info
 * - Returns metadata JSON for given fragment
 */
router.get("/:id/info", async (req, res) => {
  try {
    const frag = await Fragment.byId(req.user.ownerId, req.params.id);
    if (!frag) {
      return res.status(404).json({
        status: "error",
        error: { code: 404, message: "fragment not found" },
      });
    }
    return res.status(200).json({ status: "ok", fragment: frag.toJSON() });
  } catch (err) {
    req.log?.error({ err }, "GET /fragments/:id/info failed");
    return res.status(500).json({
      status: "error",
      error: { code: 500, message: "internal server error" },
    });
  }
});

/**
 * PUT /v1/fragments/:id
 * - Replaces the data; Content-Type must match existing media type (ignore charset)
 */
router.put("/:id", rawBody(), async (req, res) => {
  try {
    const frag = await Fragment.byId(req.user.ownerId, req.params.id);
    if (!frag) {
      return res.status(404).json({
        status: "error",
        error: { code: 404, message: "fragment not found" },
      });
    }
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "missing body" },
      });
    }

    const { type } = contentType.parse(req);
    const current = frag.type.split(";")[0].trim();
    const incoming = String(type).split(";")[0].trim();
    if (current !== incoming) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: `content type mismatch: existing=${current} new=${incoming}`,
        },
      });
    }

    frag.setData(req.body);
    await frag.save();
    req.log?.info({ id: frag.id, size: frag.size }, "Fragment updated");
    return res.status(200).json({ status: "ok", fragment: frag.toJSON() });
  } catch (err) {
    req.log?.error({ err }, "PUT /fragments/:id failed");
    return res.status(500).json({
      status: "error",
      error: { code: 500, message: "internal server error" },
    });
  }
});

/**
 * DELETE /v1/fragments/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const frag = await Fragment.byId(req.user.ownerId, req.params.id);
    if (!frag) {
      return res.status(404).json({
        status: "error",
        error: { code: 404, message: "fragment not found" },
      });
    }
    await frag.delete();
    req.log?.info({ id: frag.id }, "Fragment deleted");
    return res.status(200).json({ status: "ok" });
  } catch (err) {
    req.log?.error({ err }, "DELETE /fragments/:id failed");
    return res.status(500).json({
      status: "error",
      error: { code: 500, message: "internal server error" },
    });
  }
});

export default router;
