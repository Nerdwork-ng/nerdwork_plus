"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCreatorProfile = exports.updateReaderProfilePin = exports.getReaderProfile = exports.getCreatorProfile = exports.addReaderProfile = exports.addCreatorProfile = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const profile_1 = require("../model/profile");
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const addCreatorProfile = async (req, res) => {
    try {
        const { userId, fullName, creatorName, phoneNumber, bio, genres } = req.body;
        const [profile] = await db_1.db
            .insert(profile_1.creatorProfile)
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
    }
    catch (err) {
        console.error(err);
        return res
            .status(400)
            .json({ message: "Failed to create creator profile" });
    }
};
exports.addCreatorProfile = addCreatorProfile;
const addReaderProfile = async (req, res) => {
    try {
        const { userId, genres, fullName } = req.body;
        // Generate walletId (12 chars)
        const walletId = crypto_1.default.randomBytes(6).toString("hex");
        // Hash pin
        // const pinHash = crypto.createHash("sha256").update(pin).digest("hex");
        const [profile] = await db_1.db
            .insert(profile_1.readerProfile)
            .values({
            userId,
            genres,
            fullName,
            walletId,
        })
            .returning();
        return res.json({ profile });
    }
    catch (err) {
        console.error(err);
        return res.status(400).json({ message: "Failed to create reader profile" });
    }
};
exports.addReaderProfile = addReaderProfile;
const getCreatorProfile = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        // Try fetching creator profile
        const [creator] = await db_1.db
            .select()
            .from(profile_1.creatorProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.creatorProfile.userId, userId));
        if (creator) {
            return res.json({ role: "creator", profile: creator });
        }
        return res.status(404).json({ message: "Profile not found" });
    }
    catch (err) {
        console.error(err);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
exports.getCreatorProfile = getCreatorProfile;
const getReaderProfile = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        const [reader] = await db_1.db
            .select()
            .from(profile_1.readerProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.readerProfile.userId, userId));
        if (reader) {
            return res.json({ role: "reader", profile: reader });
        }
        return res.status(404).json({ message: "Profile not found" });
    }
    catch (err) {
        console.error(err);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
exports.getReaderProfile = getReaderProfile;
const updateReaderProfilePin = async (req, res) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        // ✅ Get reader profile
        const [reader] = await db_1.db
            .select()
            .from(profile_1.readerProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.readerProfile.userId, userId));
        if (!reader) {
            return res.status(404).json({ message: "Profile not found" });
        }
        // ✅ Hash the PIN before saving
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPin = await bcryptjs_1.default.hash(pin, salt);
        // ✅ Update profile with hashed pin
        await db_1.db
            .update(profile_1.readerProfile)
            .set({ pinHash: hashedPin })
            .where((0, drizzle_orm_1.eq)(profile_1.readerProfile.id, reader.id));
        return res.json({
            success: true,
            message: "PIN updated successfully",
        });
    }
    catch (err) {
        console.error("Update Profile PIN Error:", err);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
exports.updateReaderProfilePin = updateReaderProfilePin;
const updateCreatorProfile = async (req, res) => {
    try {
        const { address, walletType } = req.body;
        // ✅ Auth check
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        const [creator] = await db_1.db
            .select()
            .from(profile_1.creatorProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.creatorProfile.userId, userId));
        if (!creator) {
            return res.status(404).json({ message: "Profile not found" });
        }
        await db_1.db
            .update(profile_1.creatorProfile)
            .set({ walletAddress: address, walletType: walletType })
            .where((0, drizzle_orm_1.eq)(profile_1.creatorProfile.id, creator.id));
        return res.json({
            success: true,
            message: "Profile updated successfully",
        });
    }
    catch (err) {
        console.error("Update Profile  Error:", err);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
exports.updateCreatorProfile = updateCreatorProfile;
