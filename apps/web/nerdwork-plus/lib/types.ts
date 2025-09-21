export type Comic = {
  id: string;
  image: string;
  title: string;
  description: string;
  comicStatus: "upcoming" | "draft" | "scheduled" | "published";
  noOfChapters: number;
  noOfDrafts: number;
  slug: string;
  updatedAt: string;
  createdAt: string;
  creatorName?: string;
  genre?: string[];
  ageRating?: string;
  viewsCount: number;
  likesCount?: number;
  isPaid?: boolean;
  isOngoing?: boolean;
  isSubscribed?: boolean;
  subscribeCount?: number;
};

export type Chapter = {
  id: string;
  serialNo: number;
  image: string;
  title: string;
  summary: string;
  pages: string[];
  count?: number;
  chapterStatus: "published" | "scheduled" | "draft";
  date: string;
  read?: boolean;
  hasPaid?: boolean;
  uniqueCode: string;
  comicSlug: string;
  chapterPages: string[];
  chapterType?: "free" | "paid";
  price?: number;
  updatedAt: string;
  viewsCount?: number;
  likesCount?: number;
  hasLiked?: boolean;
  comicTitle?: string;
};

export type Transaction = {
  id: string;
  type: "earning" | "withdrawal" | "gift" | "purchase";
  amount: number;
  status: "pending" | "completed";
  description: string;
  date: string;
};

export type ReaderTransaction = {
  id: string;
  transactionType: string;
  status: string;
  description: string;
  nwtAmount: number;
  spendCategory: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatorTransaction = {
  id: string;
  transactionType: string;
  status: string;
  description: string;
  nwtAmount: number;
  earningSource: string;
  createdAt: string;
  updatedAt: string;
};

export type NFTCollectible = {
  id: string;
  name: string;
  description: string;
  image: string;
  status: "active" | "scheduled" | "sold out";
  total_copies: number;
  sold_copies: number;
  price: number;
  commission: number;
};

export interface User {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  username: string | null;
  email: string;
  profilePicture: string | null;
  cProfile?: boolean;
  rProfile?: boolean;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  lastLoginAt?: string | null;
  lockedUntil?: string | null;
  loginAttempts?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
