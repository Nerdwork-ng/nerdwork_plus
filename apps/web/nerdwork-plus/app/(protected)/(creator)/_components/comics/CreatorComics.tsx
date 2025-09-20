import { Badge } from "@/components/ui/badge";
import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import { BookOpen, Calendar, EllipsisVertical } from "lucide-react";
import Image from "next/image";
import React from "react";
import ComicActions from "./DesktopComicActions";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import MobileComicActions from "./MobileComicActions";
import Link from "next/link";
import { Comic } from "@/lib/types";

const CreatorComics = ({ data }: { data: Comic[] }) => {
  return (
    <section className="font-inter text-white mb-10 max-md:mt-5 max-2xl:mx-5">
      <section className="grid grid-cols-3 lg:grid-cols-4 gap-3 max-md:hidden">
        {data.map((comic) => (
          <div
            key={comic.id}
            className="relative group h-[586px] bg-[#1D1E21] rounded-[8px] flex flex-col justify-between border border-transparent hover:border-[#9D9D9F] transition duration-300 hover:ease-in-out overflow-hidden"
          >
            {/* <div className={` h-[468px] z-10`}></div> */}
            <Image
              src={comic.image}
              width={316}
              height={468}
              alt={`${comic.title} cover`}
              className="h-[468px] object-cover"
            />
            <div className="absolute left-5 right-5 flex justify-between top-3">
              <Badge variant={"secondary"} className="capitalize h-8">
                {comic.comicStatus ?? "N"}
              </Badge>
              <Menubar className="bg-[#1D1E21] justify-self-end font-inter outline-none border-none ring-0 rounded-full transition duration-300 hover:ease-in-out  p-0">
                <MenubarMenu>
                  <MenubarTrigger className="bg-[#1D1E21] data-[state=open]:bg-none h-8 w-8 flex justify-center items-center transition duration-300 cursor-pointer rounded-full p-0">
                    <EllipsisVertical size={16} />
                  </MenubarTrigger>
                  <ComicActions comic={comic} details={false} />
                </MenubarMenu>
              </Menubar>
            </div>
            <div className="p-5">
              <Link
                href={`/creator/comics/${comic.slug}`}
                className="hover:underline transition duration-300"
              >
                <p className="mb-3 font-semibold">{comic.title}</p>
              </Link>
              <div className="text-sm text-[#707073] flex flex-col gap-1">
                <p className="flex items-center gap-3">
                  <BookOpen size={16} /> {comic.noOfChapters ?? 0} Chapters
                </p>
                <p className="flex items-center gap-3">
                  <Calendar size={16} /> Updated{" "}
                  {new Date(comic.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Mobile comic cards */}
      <section className="flex flex-col gap-5 md:hidden">
        {data.map((comic) => (
          <div key={comic.id} className="relative flex gap-5">
            <Image
              src={comic.image}
              width={100}
              height={148}
              alt={`${comic.title} cover`}
              className="h-[148px] object-cover rounded-[8px]"
            />

            <div className="">
              <Link
                href={`/creator/comics/${comic.slug}`}
                className="font-semibold active:underline hover:underline"
              >
                {comic.title}
              </Link>
              <div className="text-sm text-[#707073] mt-3 flex flex-col gap-1">
                <p className="flex items-center gap-3">
                  <BookOpen size={16} /> {comic.noOfChapters ?? 0} Chapters
                </p>
                <p className="flex items-center gap-3">
                  <Calendar size={16} /> Updated{" "}
                  {new Date(comic.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="absolute right-0 bg-transparent font-inter outline-none border-none ring-0 rounded-full transition duration-300 hover:ease-in-out p-0">
              <Sheet>
                <SheetTrigger className="data-[state=open]:bg-none h-8 w-8 flex justify-center items-center transition duration-300 hover:ease-in-out cursor-pointer rounded-full p-0">
                  <EllipsisVertical size={20} />
                </SheetTrigger>
                <MobileComicActions comic={comic} />
              </Sheet>
            </div>
          </div>
        ))}
      </section>
    </section>
  );
};

export default CreatorComics;
