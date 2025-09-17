import request from "supertest";
import express from "express";
import { authenticate } from "../../src/middleware/common/auth";
import { getCurrentUser } from "../../src/controller/auth";

process.env.JWT_SECRET = "testsecret";

const app = express();
app.use(express.json());
app.get("/me", authenticate, getCurrentUser);

describe("GET /me", () => {
  it("should return 401 if no token is provided", async () => {
    const res = await request(app).get("/me");
    expect(res.statusCode).toBe(401);
  });
});
