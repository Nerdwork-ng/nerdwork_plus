import path from "path";
import bodyParser from "body-parser";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swaggerConfig";
import { globalErrorHandler, globalNotFoundHandler } from "./middleware/common";
import type { Request, Response } from "express";
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

const app = express();
console.log("server.ts: created express app");

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
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

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ data: "Nerdwork API - Lambda Function" });
});

// Error handlers
app.use(globalNotFoundHandler);
app.use(globalErrorHandler);

export default app;
