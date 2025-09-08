import jwt from "jsonwebtoken";
import { db } from "../config/db";
import { authUsers, creatorProfile, readerProfile } from "../model/schema";
import { OAuth2Client } from "google-auth-library";
import { eq } from "drizzle-orm";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuthController = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "Google ID token required" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ message: "Client id is not defined" });
    }

    // ✅ Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload) throw new Error("Invalid Google token");

    const { email, sub: googleId, picture } = payload;

    // ✅ Check if user already exists
    const users = await db
      .select()
      .from(authUsers)
      .where(eq(authUsers.email, email));
    let user = users[0] ?? null;

    if (!user) {
      // ✅ Create new user if not found
      const [newUser] = await db
        .insert(authUsers)
        .values({
          email,
          username: email.split("@")[0],
          emailVerified: true,
          isActive: true,
          passwordHash: "",
        })
        .returning();

      user = newUser;
    }

    // 🔍 Check if profile exists (creator OR reader)
    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.userId, user.id));

    const [reader] = await db
      .select()
      .from(readerProfile)
      .where(eq(readerProfile.userId, user.id));

    const cProfile = !!creator;
    console.log("cProfile", cProfile);
    const rProfile = !!reader;
    console.log("rProfile", rProfile);

    // ✅ Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      token,
      user,
      cProfile,
      rProfile,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: err.message || "Internal Server Error" });
  }
};

export async function verifyGoogleToken(idToken: string) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error("Invalid Google token");

    return {
      email: payload.email!,
      fullName: payload.name || "",
      picture: payload.picture || "",
      googleId: payload.sub,
    };
  } catch (error) {
    throw new Error("Failed to verify Google token");
  }
}
