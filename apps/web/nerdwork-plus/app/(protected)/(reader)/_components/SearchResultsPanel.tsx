"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import SpinLoader from "@/components/loader";
import { Comic } from "@/lib/types";
// import { comicData } from "@/components/data";
import Link from "next/link";
import Image from "next/image";
import { getAllComicsForReader } from "@/actions/comic.actions";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

interface SearchResultsPanelProps {
  query: string;
}

const SearchResultsPanel = ({ query }: SearchResultsPanelProps) => {
  const [results, setResults] = useState<Comic[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    data: comicData,
    isLoading: isComicLoading,
    // error,
  } = useQuery({
    queryKey: ["comics"],
    queryFn: getAllComicsForReader,
    placeholderData: keepPreviousData,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const comics: Comic[] = comicData?.data?.comics ?? [];

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        // Replace with your actual API endpoint
        // const response = await fetch(`/api/search?q=${query}`);
        // const data = await response.json();
        const data = comics.filter((comic) =>
          comic.title.toLowerCase().includes(query.toLowerCase())
        );

        setResults(data);
      } catch (error) {
        console.error("Failed to fetch search results:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce to avoid excessive API calls
    const debounceFetch = setTimeout(fetchResults, 300);

    return () => clearTimeout(debounceFetch);
  }, [query]);

  return (
    <div className="absolute text-sm top-full left-0 w-full md:w-[496px] mt-2 bg-[#151515] border border-[#FFFFFF0D] rounded-[12px] shadow-lg z-50">
      {isLoading ||
        (isComicLoading && (
          <div className="flex items-center justify-center p-4">
            <SpinLoader />
          </div>
        ))}
      {!isLoading && results.length === 0 && query.length > 0 && (
        <div className="p-4 text-nerd-muted">No results found.</div>
      )}
      {!isLoading && results.length > 0 && (
        <>
          <div className="p-4 border-b border-[#FFFFFF0D]">
            <Link
              href={`/r/search?q=${encodeURIComponent(query)}`}
              className="hover:underline"
            >
              See all results
            </Link>
          </div>

          <div className="p2">
            {results.map((comic) => (
              <Card
                key={comic.id}
                className="mb-2 bg-inherit flex flex-row items-center gap-3 rounded-md hover:bg-[#FFFFFF05] border-[#FFFFFF0D] p-3 border-none"
              >
                <Image
                  src={comic.image}
                  width={41}
                  height={64}
                  alt={`${comic.title} cover`}
                  className="h-16 object-cover"
                />
                <Link href={`/r/comics/${comic.slug}`} className="block">
                  <h4 className="text-white text-base">{comic.title}</h4>
                  <p className="text-sm text-nerd-muted">{comic.description}</p>
                </Link>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchResultsPanel;
