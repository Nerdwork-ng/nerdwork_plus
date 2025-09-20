import request from "supertest";
import { app } from "../src";
import { db } from "../src/config/db";
import { userWallets } from "../src/model/wallet";
import { eq } from "drizzle-orm";

describe("POST /wallet/debit", () => {
  let userId = "test-user";

  beforeAll(async () => {
    await db.insert(userWallets).values({
      userProfileId: userId,
      nwtBalance: 100,
      nwtLockedBalance: 0,
      kycStatus: "none",
      kycLevel: 0,
      primaryWalletAddress: null,
      spendingLimitDaily: null,
      spendingLimitMonthly: null,
    });
  });

  afterAll(async () => {
    await db.delete(userWallets).where(eq(userWallets.userProfileId, userId));
  });

  it("should debit successfully if funds are sufficient", async () => {
    const res = await request(app)
      .post("/wallet/debit")
      .send({ userId, amount: 50 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.balance).toBe(50);
  });

  it("should fail if insufficient funds", async () => {
    const res = await request(app)
      .post("/wallet/debit")
      .send({ userId, amount: 200 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Insufficient funds");
  });

  it("should fail if wallet not found", async () => {
    const res = await request(app)
      .post("/wallet/debit")
      .send({ userId: "nonexistent", amount: 10 });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Wallet not found");
  });
});
