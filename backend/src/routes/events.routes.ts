import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/common/auth";
import { getEvent } from "../controller/event";

const router = Router();

router.get("/my-events", authenticate, (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  res.status(200).json({ userId });
});

router.get("/event", getEvent);

export default router;
