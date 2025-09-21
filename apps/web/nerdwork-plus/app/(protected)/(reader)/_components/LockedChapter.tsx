"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import { Chapter } from "@/lib/types";
import ComicPaymentFlow from "./ComicPaymentFlow";

const LockedChapter = ({
  chapter,
  slug,
}: {
  chapter: Chapter;
  slug: string;
}) => {
  return (
    <section className="max-w-xl mx-auto min-h-screen px-5 flex flex-col justify-center gap-4 items-center text-center font-inter text-white bg-[#151515]">
      <h2 className="text-2xl font-semibold">
        Locked Chapter of
        <br /> {chapter?.comicTitle} #{chapter?.serialNo}: {chapter?.title}
      </h2>
      <p className="text-sm text-nerd-muted">
        The chapter you&apos;re trying to access is locked please unlock chapter
        by paying the required NWT cost.
        <br /> Go back to Comic Page or unlock chapter.
      </p>
      <div className="flex justify-center gap-4">
        <Link href={`/r/comics/${slug}`}>
          <Button variant={"primary"}>Back to Comic</Button>
        </Link>
        <ComicPaymentFlow chapter={chapter} internal={true} />
      </div>
    </section>
  );
};

export default LockedChapter;
