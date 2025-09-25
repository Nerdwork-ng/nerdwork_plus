"use client";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import React from "react";
import Link from "next/link";
import { Comic } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";

const RComics = ({ data }: { data: Comic[] }) => {
  const router = useRouter();

  const isNew = (dateString: string) => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const comicCreationDate = new Date(dateString);

    return comicCreationDate > threeDaysAgo;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <p className="text-xl font-semibold">No comics found!</p>
        <p className="mt-2 text-sm">
          Try adjusting your filters or search terms.
        </p>
      </div>
    );
  }

  return (
    <section className="font-inter text-white mb-10 max-md:mt-5 max-2xl:mx-5">
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 ">
        {data.map((comic) => (
          <div
            key={comic.id}
            onClick={() => router.push(`/r/comics/${comic.slug}`)}
            className="relative group rounded flex flex-col p-2 hover:bg-[#FFFFFF05] cursor-pointer transition duration-300 hover:ease-in-out overflow-hidden"
          >
            <Image
              src={comic.image}
              width={173}
              height={267}
              alt={`${comic.title} cover`}
              className="h-[267px] w-full object-cover rounded"
            />
            {isNew(comic.createdAt) && (
              <div className="absolute left-5 right-5 flex justify-between top-3">
                <Badge className="capitalize h-6 bg-blue-600">New</Badge>
              </div>
            )}
            <div className="px-1 py-2">
              <Link
                href={`/r/comics/${comic.slug}`}
                className="hover:underline"
              >
                <p className="mb-2 font-semibold">{comic.title}</p>
              </Link>
              <p className="flex justify-between items-center text-sm text-nerd-muted gap-3">
                <span>{comic.noOfChapters + comic?.noOfDrafts} Chapters</span>
                <span className="flex items-center gap-1">
                  <Eye size={16} /> {comic?.viewsCount}
                </span>
              </p>
            </div>
          </div>
        ))}
      </section>
    </section>
  );
};

export default RComics;
