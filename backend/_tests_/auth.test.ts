// __tests__/auth.test.ts
import request from "supertest";
import { app } from "../src";
import * as authController from "../src/controller/auth.controller";
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

// Mock google-auth-library (like before)
jest.mock("google-auth-library", () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => {
      return {
        verifyIdToken: jest.fn().mockResolvedValue({
          getPayload: () => ({
            email: "testuser@example.com",
            sub: "google-oauth-id-123",
            email_verified: true,
            picture: "https://test.com/avatar.png",
          }),
        }),
      };
    }),
  };
});

// Mock Drizzle DB
// jest.mock("../src/config/db", () => {
//   return {
//     db: {
//       insert: jest.fn().mockReturnThis(),
//       values: jest.fn().mockReturnThis(),
//       returning: jest.fn().mockResolvedValue([
//         {
//           id: "uuid-123",
//           email: "testuser@example.com",
//           username: "testuser",
//           passwordHash: "hashed",
//           emailVerified: true,
//           isActive: true,
//         },
//       ]),
//       select: jest.fn().mockReturnThis(),
//       from: jest.fn().mockReturnThis(),
//       where: jest.fn().mockReturnThis(),
//       limit: jest.fn().mockReturnThis(),
//       execute: jest.fn().mockResolvedValue([
//         {
//           id: "uuid-123",
//           email: "testuser@example.com",
//           username: "testuser",
//           passwordHash: "hashed",
//           emailVerified: true,
//           isActive: true,
//         },
//       ]),
//     },
//   };
// });

beforeEach(() => {
  jest.clearAllMocks();
});

jest.mock("../src/config/db", () => {
  const fakeUser = {
    id: "uuid-123",
    email: "testuser@example.com",
    username: "testuser",
    passwordHash: "hashed",
    emailVerified: true,
    isActive: true,
  };

  return {
    db: {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([fakeUser]),

      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn(), // <-- don’t resolve globally
      limit: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([]),
    },
  };
});
// mock google token verification
jest.spyOn(authController, "verifyGoogleToken").mockResolvedValue({
  email: "testuser@example.com",
  fullName: "Test User",
  picture: "",
  googleId: "mock-google-id",
});

describe("Auth Routes (Google)", () => {
  const googlePayload = { idToken: "fake-test-id-token" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should sign up a user with Google", async () => {
    // Signup: user does NOT exist yet
    (db.where as jest.Mock).mockResolvedValueOnce([]); // empty result

    const res = await request(app).post("/auth/signup").send(googlePayload);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("email", "testuser@example.com");
    expect(res.body).toHaveProperty("token");
  });

  it("should login a user with Google", async () => {
    // First signup (user doesn't exist)
    (db.where as jest.Mock).mockResolvedValueOnce([]);

    await request(app).post("/auth/signup").send(googlePayload);

    // Login: user DOES exist
    (db.where as jest.Mock).mockResolvedValueOnce([
      {
        id: "uuid-123",
        email: "testuser@example.com",
        username: "testuser",
        passwordHash: "hashed",
        emailVerified: true,
        isActive: true,
      },
    ]);

    const res = await request(app).post("/auth/login").send(googlePayload);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body).toHaveProperty("token");
  });
});
