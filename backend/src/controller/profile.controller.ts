import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { creatorProfile, readerProfile } from "../model/profile";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const addCreatorProfile = async (req, res) => {
  try {
    const { userId, fullName, creatorName, phoneNumber, bio, genres } =
      req.body;

    const [profile] = await db
      .insert(creatorProfile)
      .values({
        userId,
        fullName,
        creatorName,
        phoneNumber,
        bio,
        genres,
      })
      .returning();

    return res.json({ profile });
  } catch (err) {
    console.error(err);
    return res
      .status(400)
      .json({ message: "Failed to create creator profile" });
  }
};

export const addReaderProfile = async (req, res) => {
  try {
    const { userId, genres } = req.body;

    // Generate walletId (12 chars)
    const walletId = crypto.randomBytes(6).toString("hex");

    // Hash pin
    // const pinHash = crypto.createHash("sha256").update(pin).digest("hex");

    const [profile] = await db
      .insert(readerProfile)
      .values({
        userId,
        genres,
        walletId,
      })
      .returning();

    return res.json({ profile });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to create reader profile" });
  }
};

export const getCreatorProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const userId = decoded.userId;

    // Try fetching creator profile
    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.userId, userId));

    if (creator) {
      return res.json({ role: "creator", profile: creator });
    }

    return res.status(404).json({ message: "Profile not found" });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const getReaderProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const userId = decoded.userId;

    const [reader] = await db
      .select()
      .from(readerProfile)
      .where(eq(readerProfile.userId, userId));

    if (reader) {
      return res.json({ role: "reader", profile: reader });
    }

    return res.status(404).json({ message: "Profile not found" });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const updateReaderProfilePin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin || pin.length < 4) {
      return res.status(400).json({ message: "PIN must be at least 4 digits" });
    }

    // ✅ Auth check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const userId = decoded.userId;

    // ✅ Get reader profile
    const [reader] = await db
      .select()
      .from(readerProfile)
      .where(eq(readerProfile.userId, userId));

    if (!reader) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // ✅ Hash the PIN before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    // ✅ Update profile with hashed pin
    await db
      .update(readerProfile)
      .set({ pinHash: hashedPin })
      .where(eq(readerProfile.id, reader.id));

    return res.json({
      success: true,
      message: "PIN updated successfully",
    });
  } catch (err) {
    console.error("Update Profile PIN Error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const updateCreatorProfilePin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin || pin.length < 4) {
      return res.status(400).json({ message: "PIN must be at least 4 digits" });
    }

    // ✅ Auth check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const userId = decoded.userId;

    // ✅ Get creator profile
    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.userId, userId));

    if (!creator) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // ✅ Hash the PIN before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    // ✅ Update profile with hashed pin
    await db
      .update(creatorProfile)
      .set({ pinHash: hashedPin })
      .where(eq(creatorProfile.id, creator.id));

    return res.json({
      success: true,
      message: "PIN updated successfully",
    });
  } catch (err) {
    console.error("Update Profile PIN Error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
