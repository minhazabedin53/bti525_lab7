import { Router } from "express";
import { authenticate } from "../auth/basic-auth.js";
import { convertFragment } from "../services/convert.js";

const router = Router();
router.use(authenticate());

router.get("/:id.:ext", async (req, res) => {
  try {
    const ownerId = req.user.ownerId;
    const { id, ext } = req.params;
    const { buffer, type } = await convertFragment(ownerId, id, ext);
    res.set("Content-Type", type);
    return res.status(200).send(buffer);
  } catch (err) {
    const status = err.status || 500;
    return res
      .status(status)
      .json({ status: "error", error: { code: status, message: err.message } });
  }
});

export default router;
