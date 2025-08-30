// import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import React from "react";
import Link from "next/link";
import { Comic } from "@/lib/types";

const RComics = ({ data }: { data: Comic[] }) => {
  return (
    <section className="font-inter text-white mb-10 max-md:mt-5 max-2xl:mx-5">
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 ">
        {data.map((comic) => (
          <div
            key={comic.id}
            className="relative group rounded flex flex-col border border-transparent hover:border-[#9D9D9F] hover:bg-[#FFFFFF05] transition duration-300 hover:ease-in-out overflow-hidden"
          >
            <Image
              src={comic.image}
              width={173}
              height={267}
              alt={`${comic.title} cover`}
              className="h-[267px] w-full object-cover rounded"
            />
            {/* <div className="absolute left-5 right-5 flex justify-between top-3">
              <Badge variant={"secondary"} className="capitalize h-8">
                {comic.last_updated}
              </Badge>
            </div> */}
            <div className="p-2">
              <Link href={`/r/comics/${comic.id}`} className="hover:underline">
                <p className="mb-2 font-semibold">{comic.title}</p>
              </Link>
              <p className="flex items-center text-sm text-nerd-muted gap-3">
                {comic.chapters} Chapters
              </p>
            </div>
          </div>
        ))}
      </section>
    </section>
  );
};

export default RComics;
