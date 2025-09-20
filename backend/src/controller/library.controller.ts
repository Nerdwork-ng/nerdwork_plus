import { and, eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { db } from "../config/db";
import { library } from "../model/library";
import { readerProfile } from "../model/profile";
import { comics } from "../model/comic";
import { generateFileUrl } from "./file.controller";

export const getUserJwtFromToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  const token = authHeader.split(" ")[1];
  const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
  return decoded.userId;
};

// Add a comic to library
export const addToLibrary = async (req, res) => {
  try {
    const userId = getUserJwtFromToken(req);
    const { comicId } = req.body;

    const [reader] = await db
      .select()
      .from(readerProfile)
      .where(eq(readerProfile.userId, userId));

    if (!reader) return res.status(404).json({ message: "reader not found" });

    await db.insert(library).values({
      readerId: reader.id,
      comicId,
    });

    return res.status(201).json({
      success: true,
      message: "Comic added to library",
    });
  } catch (err: any) {
    console.error("AddToLibrary Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Remove a comic from library
export const removeFromLibrary = async (req, res) => {
  try {
    const userId = getUserJwtFromToken(req);
    const { comicId } = req.params;

    const [reader] = await db
      .select()
      .from(readerProfile)
      .where(eq(readerProfile.userId, userId));

    const readerId = reader.id;

    await db
      .delete(library)
      .where(and(eq(library.readerId, readerId), eq(library.comicId, comicId)));

    return res.json({ success: true, message: "Comic removed from library" });
  } catch (err: any) {
    console.error("RemoveFromLibrary Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get all comics in user's library
export const getLibrary = async (req, res) => {
  try {
    const userId = getUserJwtFromToken(req);

    const [reader] = await db
      .select()
      .from(readerProfile)
      .where(eq(readerProfile.userId, userId));

    const readerId = reader.id;

    const results = await db
      .select({
        comicId: library.comicId,
        title: comics.title,
        slug: comics.slug,
        coverImage: comics.image,
        noOfChapters: comics.noOfChapters,
      })
      .from(library)
      .leftJoin(comics, eq(library.comicId, comics.id))
      .where(eq(library.readerId, readerId));

    const data = results.map((chapter) => ({
      id: chapter.comicId,
      title: chapter.title,
      noOfChapters: chapter.noOfChapters,
      image: generateFileUrl(chapter.coverImage),
      slug: chapter.slug,
    }));

    return res.json({ success: true, comics: data });
  } catch (err: any) {
    console.error("GetLibrary Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
