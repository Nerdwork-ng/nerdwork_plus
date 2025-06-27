import { Request, Response } from "express";
import { db } from "../config/db";
import { events } from "../model/schema";

export const getEvent = async (_req: Request, res: Response) => {
  try {
    const result = await db.select().from(events);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch events", error: err });
  }
};
