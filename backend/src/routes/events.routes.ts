import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/common/auth";

const router = Router();

router.get("/my-events", authenticate, (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  res.status(200).json({ userId });
});

export default router;
