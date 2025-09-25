"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuthController = void 0;
exports.verifyGoogleToken = verifyGoogleToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const schema_1 = require("../model/schema");
const google_auth_library_1 = require("google-auth-library");
const drizzle_orm_1 = require("drizzle-orm");
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const googleAuthController = async (req, res) => {
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
        if (!payload)
            throw new Error("Invalid Google token");
        const { email, sub: googleId, picture } = payload;
        // ✅ Check if user already exists
        const users = await db_1.db
            .select()
            .from(schema_1.authUsers)
            .where((0, drizzle_orm_1.eq)(schema_1.authUsers.email, email));
        let user = users[0] ?? null;
        if (!user) {
            // ✅ Create new user if not found
            const [newUser] = await db_1.db
                .insert(schema_1.authUsers)
                .values({
                email,
                username: email.split("@")[0],
                emailVerified: false,
                isActive: true,
            })
                .returning();
            user = newUser;
        }
        // 🔍 Check if profile exists (creator OR reader)
        const [creator] = await db_1.db
            .select()
            .from(schema_1.creatorProfile)
            .where((0, drizzle_orm_1.eq)(schema_1.creatorProfile.userId, user.id));
        const [reader] = await db_1.db
            .select()
            .from(schema_1.readerProfile)
            .where((0, drizzle_orm_1.eq)(schema_1.readerProfile.userId, user.id));
        const cProfile = !!creator;
        const rProfile = !!reader;
        // ✅ Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });
        return res.status(200).json({
            token,
            user,
            cProfile,
            rProfile,
        });
    }
    catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({ message: err.message || "Internal Server Error" });
    }
};
exports.googleAuthController = googleAuthController;
console.log(jsonwebtoken_1.default?.sign);
// export const googleLoginController = async (req: any, res: any) => {
//   try {
//     const { idToken } = req.body;
//     if (!idToken) {
//       return res.status(400).json({ error: "Google ID token required" });
//     }
//     // ✅ verify token with Google
//     const googleUser = await verifyGoogleToken(idToken);
//     // proceed with login
//     const { token, user } = await loginWithGoogle(googleUser);
//     return res.status(200).json({ token, user });
//   } catch (err: any) {
//     return res.status(400).json({ message: err.message });
//   }
// };
async function verifyGoogleToken(idToken) {
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload)
            throw new Error("Invalid Google token");
        return {
            email: payload.email,
            fullName: payload.name || "",
            picture: payload.picture || "",
            googleId: payload.sub,
        };
    }
    catch (error) {
        throw new Error("Failed to verify Google token");
    }
}
