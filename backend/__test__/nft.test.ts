import request from "supertest";
import { app } from "../src/index";
import { db } from "../src/config/db";
import { userWallets } from "../src/model/wallet";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

// mock secret same as in your auth middleware
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

describe("GET /wallet/balance", () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    // Create mock user wallet in DB
    userId = "11111111-1111-1111-1111-111111111111";

    await db.insert(userWallets).values({
      id: "22222222-2222-2222-2222-222222222222",
      userProfileId: userId,
      nwtBalance: 500,
      nwtLockedBalance: 50,
      primaryWalletAddress: "0x123456789",
      kycStatus: "none",
      kycLevel: 0,
      spendingLimitDaily: 1000,
      spendingLimitMonthly: 5000,
    });

    // sign JWT
    token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
  });

  afterAll(async () => {
    // cleanup test wallet
    await db.delete(userWallets).where(eq(userWallets.userProfileId, userId));
  });

  it("should return wallet balance for authenticated user", async () => {
    const res = await request(app)
      .get("/wallet/balance")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("balance", 500);
  });

  it("should return 401 if no token is provided", async () => {
    const res = await request(app).get("/wallet/balance");
    expect(res.status).toBe(401);
  });

  it("should return 404 if wallet not found", async () => {
    const fakeToken = jwt.sign(
      { userId: "33333333-3333-3333-3333-333333333333" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/wallet/balance")
      .set("Authorization", `Bearer ${fakeToken}`);

    expect(res.status).toBe(404);
  });
});
