"use client";

import { useState } from "react";
import { LoadingButton } from "@/components/ui/LoadingButton";

const allGenres = [
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
];

export function ReaderGenres({
  onSelectGenres,
  isLoading,
}: {
  onSelectGenres: (genres: string[]) => void;
  isLoading: boolean;
}) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const handleGenreClick = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleContinue = () => {
    onSelectGenres(selectedGenres);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-white px-5">
      <div className="w-full max-w-sm text-center">
        <h4 className="text-2xl font-bold mb-2">
          Choose your favourite genres
        </h4>
        <p className="text-sm text-[#707073] mb-8">Select all that apply</p>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {allGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => handleGenreClick(genre)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                selectedGenres.includes(genre)
                  ? "border-[#292A2E] bg-white text-black"
                  : "border-[#292A2E] text-white hover:bg-gray-800"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
        <LoadingButton
          onClick={handleContinue}
          isLoading={isLoading}
          loadingText="Loading..."
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Continue
        </LoadingButton>
      </div>
    </div>
  );
}
