import request from "supertest";
import express from "express";
import { authenticate } from "../../src/middleware/common/auth";
import { purchaseTicket } from "../../src/controller/ticket";

const app = express();
app.use(express.json());
app.post("/tickets", authenticate, purchaseTicket);

describe("POST /tickets", () => {
  it("should return 401 if not authenticated", async () => {
    const res = await request(app).post("/tickets").send({});
    expect(res.statusCode).toBe(401);
  });

  // Add a test for success with a mocked auth + event
});
