export const GENRES = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Romance",
  "Thriller",
  "Horror",
  "Adventure",
  "Historical Fiction",
  "Comedy",
  "Drama",
  "Superhero",
  "Dystopian",
  "Musical",
  "Western",
  "Biographical",
  "Cyberpunk",
] as const;

export const LANGUAGES = [
  { value: "en", label: "English" },
  // { value: "es", label: "Spanish" },
  // { value: "fr", label: "French" },
] as const;

export const CONTENT_RATINGS = [
  { value: "all-ages", label: "All Ages" },
  { value: "teens-13+", label: "Teens - Age 13+" },
  { value: "mature-17+", label: "Mature - Age 17+" },
  { value: "adults-18+", label: "Adults - Age 18+" },
] as const;
