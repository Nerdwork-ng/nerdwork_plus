import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chapter } from "@/lib/types";
import { Calendar, Edit2, Eye, Heart, ImageIcon, Send } from "lucide-react";
import Image from "next/image";
import React from "react";
import ChapterActions from "./ChapterActions";
import Link from "next/link";
import PublishDraft from "./PublishDraft";

const ChapterComics = ({ data, slug }: { data: Chapter[]; slug: string }) => {
  return (
    <main className="flex flex-col gap-10 pb-10">
      {data.map((chapter) => (
        <section
          key={chapter.id}
          className="flex max-md:flex-col md:justify-between gap-8 md:gap-16"
        >
          <div className="md:w-[80%] text-nerd-muted flex gap-8">
            <Image
              src={chapter.pages[0] ?? null}
              width={92}
              height={132}
              alt="Chapter cover"
              className="w-[92px] h-[132px] object-cover rounded-[6px] max-md:hidden"
            />
            <div className="space-y-2">
              <p className="text-white flex items-center gap-2">
                {chapter.title}{" "}
                <Badge
                  className={` ${
                    chapter.chapterStatus == "published"
                      ? "bg-[#1A9733]"
                      : chapter.chapterStatus == "scheduled"
                      ? "bg-[#064EC0]"
                      : "bg-[#25262A]"
                  }`}
                >
                  {chapter.chapterStatus}
                </Badge>
              </p>
              <p>{chapter.summary}</p>

              <div className="flex gap-5 text-sm">
                <span className="flex text-nowrap items-center gap-1">
                  <ImageIcon size={16} />
                  {chapter.pages.length} pages
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  {chapter.chapterStatus == "published"
                    ? "published"
                    : chapter.chapterStatus == "scheduled"
                    ? "scheduled for"
                    : "last edited"}{" "}
                  {new Date(chapter.updatedAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={16} />
                  {chapter?.viewsCount ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart size={16} />
                  {chapter?.likesCount ?? 0}
                </span>
                {chapter.chapterType == "paid" && (
                  <span className="flex items-center gap-1">
                    {chapter?.price} NWT
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="md:w-[20%] md:justify-end flex gap-2">
            <Link href={`/creator/comics/${slug}/view/${chapter?.uniqueCode}`}>
              <Button className="bg-nerd-default">
                <Eye />
                View
              </Button>
            </Link>
            {chapter.chapterStatus == "draft" ? (
              <PublishDraft data={chapter} />
            ) : (
              <Button className="bg-nerd-default">
                {chapter.chapterStatus == "published" ? <Edit2 /> : <Send />}

                {chapter.chapterStatus == "published" ? "Edit" : "Publish"}
              </Button>
            )}
            <ChapterActions chapter={chapter} />
          </div>
        </section>
      ))}
    </main>
  );
};

export default ChapterComics;
