import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../config/db";
import { authUsers } from "../model/schema";

const JWT_SECRET = process.env.JWT_SECRET!;

// export const signup = async (req: any, res: any) => {
//   try {
//     const { email, password, username } = req.body;

//     // Check if user exists
//     const existingUser = await db
//       .select()
//       .from(authUsers)
//       .where(eq(authUsers.email, email));

//     if (existingUser.length > 0)
//       return res.status(400).json({ message: "User already exists" });

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const [newUser] = await db
//       .insert(authUsers)
//       .values({
//         email,
//         username,
//         passwordHash: hashedPassword,
//       })
//       .returning();

//     const token = jwt.sign(
//       { id: newUser.id, email: newUser.email },
//       JWT_SECRET,
//       {
//         expiresIn: "7d",
//       }
//     );

//     return res.status(201).json({ token, user: newUser });
//   } catch (error: any) {
//     console.error("Signup error:", error); // <-- Add this
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

// export const login = async (req: any, res: any) => {
//   const { email, password } = req.body;

//   const [user] = await db
//     .select()
//     .from(authUsers)
//     .where(eq(authUsers.email, email));

//   if (!user) return res.status(404).json({ message: "User not found" });

//   const isMatch = await bcrypt.compare(password, user.passwordHash);
//   if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

//   const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
//     expiresIn: "7d",
//   });

//   return res.status(200).json({ token, user });
// };
