"use client";
import { Button } from "@/components/ui/button";
import { PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Chapter } from "@/lib/types";
import { Popover } from "@radix-ui/react-popover";
import { Info } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import React from "react";

const ComicInfo = ({ chapter, slug }: { chapter: Chapter; slug: string }) => {
  const { data: session } = useSession();
  const userType = session?.cProfile;
  const route = userType ? "creator" : "r";
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"ghost"}
            className="max-w-1/2 flex items-center gap-1.5"
          >
            <p className="max-md:truncate">{chapter?.title}</p>
            <Info size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="border-nerd-default flex flex-col text-sm items-center gap-4 font-inter text-white bg-[#151515]">
          <p className="text-center">{chapter?.title}</p>
          <Link href={`/${route}/comics/${slug}`}>
            <Button>Go back</Button>
          </Link>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default ComicInfo;
