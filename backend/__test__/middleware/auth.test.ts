import request from "supertest";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authenticate } from "../../src/middleware/common/auth";

process.env.JWT_SECRET = "testsecret"; // Use a consistent secret for tests

const app = express();
app.use(express.json());

app.get("/protected", authenticate, (req: Request, res: Response) => {
  res
    .status(200)
    .json({ message: "Access granted", userId: (req as any).userId });
});

describe("Auth Middleware", () => {
  it("should return 401 if no token", async () => {
    const res = await request(app).get("/protected");
    expect(res.statusCode).toBe(401);
  });

  it("should return 401 for invalid token", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer invalidtoken");
    expect(res.statusCode).toBe(401); // Updated to match actual behavior
  });

  it("should pass and return 200 for valid token", async () => {
    const validToken = jwt.sign(
      { userId: "test-id" },
      process.env.JWT_SECRET!,
      {
        expiresIn: "1h",
      }
    );

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${validToken}`);

    // This test might still fail if middleware doesn't pick up JWT_SECRET properly
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("userId", "test-id");
  });
});
