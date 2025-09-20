import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/common/auth";

const router = Router();

router.get("/my-wallet", authenticate, (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  res.json({
    message: `Fetching wallet for user ${userId}`,
  });
});

export default router;
