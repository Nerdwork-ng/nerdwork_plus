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
};

export type Transaction = {
  id: string;
  type: "earning" | "withdrawal" | "gift" | "purchase";
  amount: number;
  status: "pending" | "completed";
  description: string;
  date: string;
};
