// tests/helioWebhook.test.ts
import request from "supertest";
import { app } from "../src";

describe("Helio Webhook", () => {
  it("should credit wallet and issue ticket on confirmed payment", async () => {
    const res = await request(app).post("/api/webhooks/helio").send({
      userId: "mock-user",
      amount: 50,
      eventId: "mock-event",
      status: "confirmed",
      signature: process.env.HELIO_SECRET,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.ticket).toBeDefined();
  });
});
