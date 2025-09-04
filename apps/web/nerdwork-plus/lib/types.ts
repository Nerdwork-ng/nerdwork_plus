export type Comic = {
  id: number;
  image: string;
  title: string;
  short_description: string;
  status: "upcoming" | "draft" | "scheduled" | "published";
  chapters: number;
  last_updated: string;
  genres?: Array<string>;
  rating?: string;
  isPaid?: boolean;
  isOngoing?: boolean;
};

export type Chapter = {
  id: number;
  image: string;
  title: string;
  description: string;
  pages: number;
  status: "published" | "scheduled" | "draft";
  date: string;
  views?: number;
  read?: boolean;
  unlocked?: boolean;
};

export type Transaction = {
  id: string;
  type: "earning" | "withdrawal" | "gift" | "purchase";
  amount: number;
  status: "pending" | "completed";
  description: string;
  date: string;
};

export type NFTCollectible = {
  id: number;
  name: string;
  description: string;
  image: string;
  status: "active" | "scheduled" | "sold out";
  total_copies: number;
  sold_copies: number;
  price: number;
  commission: number;
};
