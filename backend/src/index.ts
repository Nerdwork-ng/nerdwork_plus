import { globalErrorHandler, globalNotFoundHandler } from "./middleware/common";
import type { Request, Response } from "express";
import { app } from "./server";
import authRoutes from "./routes/auth.routes";

app.use("/auth", authRoutes);

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

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.use(globalNotFoundHandler);
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

export { app };
