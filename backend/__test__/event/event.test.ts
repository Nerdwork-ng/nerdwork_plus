import request from "supertest";
import express from "express";
import router from "../../src/routes/events.routes";

const app = express();
app.use(express.json());
app.use(router);

describe("GET /event", () => {
  it("should return a list of events", async () => {
    jest.setTimeout(20000);

    const res = await request(app).get("/event");
    console.log("Response:", res.statusCode, res.body); // See what's coming back

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
