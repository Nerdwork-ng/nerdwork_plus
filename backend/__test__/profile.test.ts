// __tests__/profile.test.ts
import request from "supertest";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { app } from "../src";
import { db as realDb } from "../src/config/db";

const db = realDb as unknown as {
  insert: jest.Mock;
  values: jest.Mock;
  returning: jest.Mock;
  select: jest.Mock;
  from: jest.Mock;
  where: jest.Mock;
  limit: jest.Mock;
  execute: jest.Mock;
};

jest.mock("crypto");

jest.mock("../src/config/db", () => {
  const mockDb = {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([]),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([]),
  };
  return { db: mockDb };
});

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

describe("Profile endpoints", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /profile/creator", () => {
    it("should create a creator profile", async () => {
      const fakeProfile = {
        id: 1,
        userId: "user123",
        fullName: "John Doe",
        creatorName: "JD Comics",
        phoneNumber: "1234567890",
        bio: "I make comics",
        genres: ["fantasy", "action"],
      };

      (db.returning as jest.Mock).mockResolvedValueOnce([fakeProfile]);

      const res = await request(app)
        .post("/profile/creator")
        .send({
          userId: "user123",
          fullName: "John Doe",
          creatorName: "JD Comics",
          phoneNumber: "1234567890",
          bio: "I make comics",
          genres: ["fantasy", "action"],
        });

      expect(res.status).toBe(200);
      expect(res.body.profile).toEqual(fakeProfile);
    });

    it("should return 400 if db insert fails", async () => {
      (db.returning as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

      const res = await request(app)
        .post("/profile/creator")
        .send({
          userId: "user123",
          fullName: "John Doe",
          creatorName: "JD Comics",
          phoneNumber: "1234567890",
          bio: "I make comics",
          genres: ["fantasy", "action"],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Failed to create creator profile");
    });
  });

  describe("POST /profile/reader", () => {
    it("should create a reader profile with walletId + hashed pin", async () => {
      const fakeProfile = {
        id: 2,
        userId: "user456",
        genres: ["romance"],
        walletId: "wallet123",
        pinHash: "hashed-pin",
      };

      // Mock crypto
      jest.spyOn(crypto, "randomBytes").mockImplementation(() => {
        return Buffer.from("wallet123wallet123"); // 16 bytes
      });
      jest.spyOn(crypto, "createHash").mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue("hashed-pin"),
      } as any);

      (db.returning as jest.Mock).mockResolvedValueOnce([fakeProfile]);

      const res = await request(app)
        .post("/profile/reader")
        .send({
          userId: "user456",
          genres: ["romance"],
          pin: "1234",
        });

      expect(res.status).toBe(200);
      expect(res.body.profile).toEqual(fakeProfile);
    });

    it("should return 400 if db insert fails", async () => {
      (db.returning as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

      const res = await request(app)
        .post("/profile/reader")
        .send({
          userId: "user456",
          genres: ["romance"],
          pin: "1234",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Failed to create reader profile");
    });
  });

  describe("GET /profile", () => {
    it("should return creator profile when exists", async () => {
      const fakeCreator = { id: 1, userId: "u1", creatorName: "JD" };
      (jwt.verify as jest.Mock).mockReturnValue({ userId: "u1" });
      (db.where as jest.Mock).mockResolvedValueOnce([fakeCreator]); // first query returns creator

      const res = await request(app)
        .get("/profile")
        .set("Authorization", "Bearer validtoken");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ role: "creator", profile: fakeCreator });
    });

    it("should return reader profile when creator not found", async () => {
      const fakeReader = { id: 2, userId: "u2", genres: ["sci-fi"] };
      (jwt.verify as jest.Mock).mockReturnValue({ userId: "u2" });
      (db.where as jest.Mock)
        .mockResolvedValueOnce([]) // no creator
        .mockResolvedValueOnce([fakeReader]); // reader found

      const res = await request(app)
        .get("/profile")
        .set("Authorization", "Bearer validtoken");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ role: "reader", profile: fakeReader });
    });

    it("should return 404 if no profile found", async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: "u3" });
      (db.where as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const res = await request(app)
        .get("/profile")
        .set("Authorization", "Bearer validtoken");

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Profile not found");
    });

    it("should return 401 if no token provided", async () => {
      const res = await request(app).get("/profile");
      expect(res.status).toBe(401);
    });

    it("should return 401 if token is invalid", async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("invalid");
      });

      const res = await request(app)
        .get("/profile")
        .set("Authorization", "Bearer badtoken");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid or expired token");
    });
  });
});
