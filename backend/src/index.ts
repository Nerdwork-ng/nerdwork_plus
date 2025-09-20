import { globalErrorHandler, globalNotFoundHandler } from "./middleware/common";
import type { Request, Response } from "express";
import { app } from "./server";
import authRoutes from "./routes/auth.routes";
import paymentRoutes from "./routes/payment.routes";
import { authenticate } from "./middleware/common/auth";
import nftRoutes from "./routes/nft.routes";
import walletRoutes from "./routes/wallet.routes";
import profileRoutes from "./routes/profile.routes";
import comicRoutes from "./routes/comic.routes";
import chapterRoutes from "./routes/chapter.routes";
import fileRoutes from "./routes/files.routes";
import libraryRoutes from "./routes/library.routes";
import transactionRoutes from "./routes/transaction.routes";

app.use("/auth", authRoutes);
app.use("/payment", paymentRoutes);
app.use("/nft", authenticate, nftRoutes);
app.use("/wallet", authenticate, walletRoutes);
app.use("/profile", profileRoutes);
app.use("/comics", comicRoutes);
app.use("/chapters", chapterRoutes);
app.use("/file-upload", fileRoutes);
app.use("/library", libraryRoutes);
app.use("/transactions", transactionRoutes);

const PORT = 5000;
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of users
 *     responses:
 *       200:
 *         description: Successfully retrieved list
 */
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ data: `Hello, world! - ${PORT}` });
});

app.use(globalNotFoundHandler);
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

export { app };
