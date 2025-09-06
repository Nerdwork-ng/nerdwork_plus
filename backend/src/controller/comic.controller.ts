import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { comics } from "../model/comic";
import jwt from "jsonwebtoken";
import { creatorProfile } from "../model/profile";

export const createComic = async (req, res) => {
  try {
    const { title, language, ageRating, description, image, genre, tags } =
      req.body;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const userId = decoded.userId;

    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.userId, userId));

    if (!creator) {
      return res.status(404).json({ message: "User not found" });
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${
      creator.creatorName
    }`;

    const [comic] = await db
      .insert(comics)
      .values({
        title,
        language,
        ageRating,
        description,
        image,
        slug,
        genre,
        tags,
        comicStatus: "draft",
        creatorId: creator.id,
      })
      .returning();

    return res.status(200).json({ comic, slug });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to create comic" });
  }
};

export const fetchAllComicByJwt = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const userId = decoded.userId;

    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.userId, userId));
    if (!creator) {
      return res.status(404).json({ message: "Creator With Jwt not found" });
    }

    const userComics = await db
      .select()
      .from(comics)
      .where(eq(comics.creatorId, creator.id));

    return res.json({ comics: userComics });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to fetch comics" });
  }
};

export const fetchComicBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const [comic] = await db.select().from(comics).where(eq(comics.slug, slug));

    if (!comic) return res.status(404).json({ message: "Comic not found" });

    return res.json({ comic });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to fetch comic" });
  }
};

export const fetchComicBySlugForReaders = async (req, res) => {
  try {
    const { slug } = req.params;

    const [comic] = await db.select().from(comics).where(eq(comics.slug, slug));
    if (!comic) return res.status(404).json({ message: "Comic not found" });

    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.id, comic.creatorId));

    return res.json({
      data: {
        comic,
        creatorName: creator.creatorName,
        isInLibrary: false,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to fetch comic" });
  }
};

// ✅ Fetch all comics (reader endpoint)
export const fetchAllComics = async (req, res) => {
  try {
    const publishedComics = await db
      .select()
      .from(comics)
      .where(eq(comics.comicStatus, "published"));

    return res.json({ comics: publishedComics });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to fetch comics" });
  }
};

// ✅ Search comics by title
// export const searchComics = async (req, res) => {
//   try {
//     const { q } = req.query; // frontend sends /comics/search?q=title
//     if (!q) return res.status(400).json({ message: "Search query required" });

//     const results = await db
//       .select()
//       .from(comics)
//       .where(ilike(comics.title, `%${q}%`));

//     return res.json({ results });
//   } catch (err) {
//     console.error(err);
//     return res.status(400).json({ message: "Failed to search comics" });
//   }
// };
