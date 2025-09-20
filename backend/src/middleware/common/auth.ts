import jwt from "jsonwebtoken";
import { Request } from "express";

export interface AuthRequest extends Request {
  userId?: any; // or your User type
}

const JWT_SECRET = process.env.JWT_SECRET!;

export const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ message: "Missing authorization header" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
