import request from "supertest";
import { app } from "../src/index";
import { describe, expect, it, beforeAll } from '@jest/globals';

// Mock user authentication middleware for tests
describe("Payment Endpoints", () => {
  let token: string;

  beforeAll(async () => {
    // Sign up and login to get a token
    await request(app).post("/auth/signup").send({
      email: "paytest@example.com",
      password: "password123",
      username: "paytester",
    });
    const res = await request(app).post("/auth/login").send({
      email: "paytest@example.com",
      password: "password123",
    });
    token = res.body.token;
  });

  it("should create a payment link", async () => {
    const res = await request(app)
      .post("/payment/helio/link")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 100,
        currency: "6617fa34af7c94b808564aac",
        name: "Test Payment"
      });
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("paymentLink");
    expect(res.body).toHaveProperty("paymentId");
  });

  it("should create a webhook for payment", async () => {
    // First, create a payment link to get a paymentId
    const linkRes = await request(app)
      .post("/payment/helio/link")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 100,
        currency: "6617fa34af7c94b808564aac",
        name: "Test Payment"
      });
    const paymentId = linkRes.body.paymentId;
    const res = await request(app)
      .post("/payment/helio/webhook/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ paymentId });
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("data");
  });
});


