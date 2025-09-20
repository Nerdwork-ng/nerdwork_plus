import { and, eq, sql } from "drizzle-orm";
import { db } from "../config/db";
import { comics, comicSubscribers } from "../model/comic";
import { creatorProfile, readerProfile } from "../model/profile";
import { library } from "../model/library";
import { generateFileUrl } from "./file.controller";
import { chapterLikes, chapters, chapterViews } from "../model/chapter";
import { getUserJwtFromToken } from "./library.controller";

async function getComicViews(comicId: string) {
  const [{ totalViews }] = await db
    .select({
      totalViews: sql`COUNT(${chapterViews.id})`,
    })
    .from(chapterViews)
    .innerJoin(chapters, eq(chapterViews.chapterId, chapters.id))
    .where(eq(chapters.comicId, comicId));

  return Number(totalViews) || 0;
}

export async function getComicSubscribers(comicId, readerId?) {
  // Count likes
  const [{ subscribeCount }] = await db
    .select({ subscribeCount: sql`COUNT(${comicSubscribers.id})` })
    .from(comicSubscribers)
    .where(eq(comicSubscribers.comicId, comicId));

  let hasSubscribed = false;
  if (readerId) {
    const [existingSubscriber] = await db
      .select()
      .from(comicSubscribers)
      .where(
        and(
          eq(comicSubscribers.comicId, comicId),
          eq(comicSubscribers.readerId, readerId)
        )
      );

    hasSubscribed = !!existingSubscriber;
  }

  return {
    subscribeCount: Number(subscribeCount) || 0,
    hasSubscribed,
  };
}

async function getComicLikes(comicId: string) {
  const [{ totalLikes }] = await db
    .select({
      totalLikes: sql`COUNT(${chapterLikes.id})`,
    })
    .from(chapterLikes)
    .innerJoin(chapters, eq(chapterLikes.chapterId, chapters.id))
    .where(eq(chapters.comicId, comicId));

  return Number(totalLikes) || 0;
}

export const createComic = async (req, res) => {
  try {
    const { title, language, ageRating, description, image, genre, tags } =
      req.body;

    const userId = getUserJwtFromToken(req);

    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.userId, userId));

    if (!creator) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔥 Extract only the file path (if frontend sends full CloudFront URL)
    let imagePath = image;
    if (image && image.startsWith("http")) {
      try {
        const url = new URL(image);
        imagePath = url.pathname.startsWith("/")
          ? url.pathname.substring(1) // remove leading "/"
          : url.pathname;
      } catch (err) {
        console.warn("Invalid image URL provided, storing raw value:", image);
      }
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
        image: imagePath,
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
    const userId = getUserJwtFromToken(req);
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

    const data = await Promise.all(
      userComics.map(async (comic) => {
        const { subscribeCount } = await getComicSubscribers(comic.id);
        return {
          id: comic.id,
          title: comic.title,
          language: comic.language,
          ageRating: comic.ageRating,
          noOfChapters: comic.noOfChapters,
          noOfDrafts: comic.noOfDrafts,
          description: comic.description,
          image: generateFileUrl(comic.image),
          comicStatus: comic.comicStatus,
          genre: comic.genre,
          tags: comic.tags,
          slug: comic.slug,
          creatorName: creator.creatorName,
          createdAt: comic.createdAt,
          updatedAt: comic.updatedAt,
          viewsCount: await getComicViews(comic.id),
          likesCount: await getComicLikes(comic.id),
          subscribeCount,
        };
      })
    );
    return res.json({ comics: data });
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

    const { subscribeCount } = await getComicSubscribers(comic.id);
    const data = {
      id: comic.id,
      title: comic.title,
      language: comic.language,
      ageRating: comic.ageRating,
      noOfChapters: comic.noOfChapters,
      noOfDrafts: comic.noOfDrafts,
      description: comic.description,
      image: generateFileUrl(comic.image),
      comicStatus: comic.comicStatus,
      genre: comic.genre,
      tags: comic.tags,
      slug: comic.slug,
      createdAt: comic.createdAt,
      updatedAt: comic.updatedAt,
      viewsCount: await getComicViews(comic.id),
      likesCount: await getComicLikes(comic.id),
      subscribeCount,
    };

    return res.json({ data });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to fetch comic" });
  }
};

export const fetchComicBySlugForReaders = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = getUserJwtFromToken(req);

    const [reader] = await db
      .select()
      .from(readerProfile)
      .where(eq(readerProfile.userId, userId));

    const [comic] = await db.select().from(comics).where(eq(comics.slug, slug));
    if (!comic) return res.status(404).json({ message: "Comic not found" });

    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.id, comic.creatorId));

    const [libraries] = await db
      .select()
      .from(library)
      .where(
        and(eq(library.comicId, comic.id), eq(library.readerId, reader.id))
      );

    const inLibrary = !!libraries;

    const { subscribeCount, hasSubscribed } = await getComicSubscribers(
      comic.id,
      reader.id
    );

    const data = {
      id: comic.id,
      title: comic.title,
      language: comic.language,
      ageRating: comic.ageRating,
      noOfChapters: comic.noOfChapters,
      noOfDrafts: comic.noOfDrafts,
      description: comic.description,
      image: generateFileUrl(comic.image),
      comicStatus: comic.comicStatus,
      genre: comic.genre,
      tags: comic.tags,
      slug: comic.slug,
      createdAt: comic.createdAt,
      updatedAt: comic.updatedAt,
      creatorName: creator.creatorName,
      inLibrary,
      viewsCount: await getComicViews(comic.id),
      likesCount: await getComicLikes(comic.id),
      subscribeCount,
      hasSubscribed,
    };

    return res.json({
      data,
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to fetch comic" });
  }
};

export const fetchAllComics = async (req, res) => {
  try {
    const userId = getUserJwtFromToken(req);

    const [reader] = await db
      .select()
      .from(readerProfile)
      .where(eq(readerProfile.userId, userId));

    if (!reader) {
      return res.status(404).json({ message: "Reader not found" });
    }

    const publishedComics = await db
      .select()
      .from(comics)
      .where(eq(comics.comicStatus, "published"));

    const data = await Promise.all(
      publishedComics.map(async (chapter) => {
        const [creator] = await db
          .select()
          .from(creatorProfile)
          .where(eq(creatorProfile.id, chapter.creatorId));

        const { subscribeCount, hasSubscribed } = await getComicSubscribers(
          chapter.id,
          reader.id
        );

        return {
          ...chapter,
          image: generateFileUrl(chapter.image),
          creatorName: creator?.creatorName || "Unknown",
          viewsCount: await getComicViews(chapter.id),
          likesCount: await getComicLikes(chapter.id),
          subscribeCount,
          hasSubscribed,
        };
      })
    );

    return res.json({ comics: data });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to fetch comics" });
  }
};

export const deleteComicBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const [comic] = await db.select().from(comics).where(eq(comics.slug, slug));

    if (!comic) return res.status(404).json({ message: "Comic not found" });

    await db.delete(comics).where(eq(comics.slug, slug));

    return res.json({ message: "Comic deleted Successfully" });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to fetch comic" });
  }
};

export const subscribeForcomic = async (req, res) => {
  try {
    const userId = getUserJwtFromToken(req);
    const { comicId } = req.params;

    const [reader] = await db
      .select()
      .from(readerProfile)
      .where(eq(readerProfile.userId, userId));
    if (!reader) {
      return res
        .status(404)
        .json({ success: false, message: "Reader not found" });
    }

    // check if already liked
    const [existingSubscriber] = await db
      .select()
      .from(comicSubscribers)
      .where(
        and(
          eq(comicSubscribers.comicId, comicId),
          eq(comicSubscribers.readerId, reader.id)
        )
      );

    if (existingSubscriber) {
      // Unlike (delete row)
      await db
        .delete(comicSubscribers)
        .where(eq(comicSubscribers.id, existingSubscriber.id));

      const [{ subscribeCount }] = await db
        .select({ subscribeCount: sql`COUNT(${comicSubscribers.id})` })
        .from(comicSubscribers)
        .where(eq(comicSubscribers.comicId, comicId));

      return res.status(200).json({
        success: true,
        message: "Comic Unsubscribed",
        data: {
          comicId: comicId,
          liked: false,
          subscribeCount: Number(subscribeCount) || 0,
        },
      });
    } else {
      // Like (insert row)
      await db.insert(comicSubscribers).values({
        comicId: comicId,
        readerId: reader.id,
      });

      const [{ subscribeCount }] = await db
        .select({ subscribeCount: sql`COUNT(${comicSubscribers.id})` })
        .from(comicSubscribers)
        .where(eq(comicSubscribers.comicId, comicId));

      return res.status(200).json({
        success: true,
        message: "Comic Subscribed",
        data: {
          comicId,
          Subscribed: true,
          subscribeCount: Number(subscribeCount) || 0,
        },
      });
    }
  } catch (err: any) {
    console.error("Toggle Subscription Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Search comics by title
// export const searchComics = async (req, res) => {
//   try {
//     const { q } = req.query;
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
