"use client";
import { Button } from "@/components/ui/button";
import { PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Chapter } from "@/lib/types";
import { Popover } from "@radix-ui/react-popover";
import { Info } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const ComicInfo = ({ chapter, slug }: { chapter: Chapter; slug: string }) => {
  const pathname = usePathname();
  const route = pathname.includes("creator") ? "creator" : "r";
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className="max-w-1/2 flex items-center gap-1.5 hover:bg-nerd-default hover:text-white"
          >
            <p className="max-md:truncate">{chapter?.title}</p>
            <Info size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="border-nerd-default ml-5 flex flex-col text-sm gap-2 font-inter text-white bg-[#151515]">
          <p className="font-semibold text-base">
            {chapter?.comicTitle} #{chapter?.serialNo} : {chapter?.title}
          </p>
          <p className="ml-4">Views: {chapter?.viewsCount}</p>
          <p className="ml-4 mb-3">Likes: {chapter?.likesCount}</p>
          <Link href={`/${route}/comics/${slug}`}>
            <Button className="h-7">Go back</Button>
          </Link>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default ComicInfo;
