"use client";
import { Button } from "@/components/ui/button";
import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, EllipsisVertical, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { use, useState } from "react";
import ComicActions from "../../../_components/comics/DesktopComicActions";
import MobileComicActions from "../../../_components/comics/MobileComicActions";
import ChaptersEmptyState from "../../../_components/comics/ChaptersEmptyState";
import ChapterComics from "../../../_components/comics/ChapterComics";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getComicChaptersBySlug,
  getSingleComic,
} from "@/actions/comic.actions";
import LoaderScreen from "@/components/loading-screen";
import { Chapter, Comic } from "@/lib/types";
import { toast } from "sonner";
import { useUserSession } from "@/lib/api/queries";

const ComicDetailsPage = ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = use(params);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tab, setTab] = useState<string>("all");
  const { profile } = useUserSession();

  const {
    data: comicData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["comic"],
    queryFn: () => getSingleComic(slug),
    placeholderData: keepPreviousData,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const {
    data: chaptersData,
    isLoading: isChaptersLoading,
    error: chapterError,
  } = useQuery({
    queryKey: ["chapters"],
    queryFn: () => getComicChaptersBySlug(slug),
    placeholderData: keepPreviousData,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  if (isLoading || isChaptersLoading) return <LoaderScreen />;

  if (error || chapterError)
    toast.error(
      error?.message || chapterError?.message || "Error getting chapter details"
    );

  const comic: Comic = comicData?.data?.comic;
  const chapters: Chapter[] = chaptersData?.data?.data ?? [];

  const truncatedText = comic?.description.substring(0, 200);

  const counts = {
    all: chapters.length,
    draft: chapters.filter((b) => b.chapterStatus === "draft").length,
    published: chapters.filter((b) => b.chapterStatus === "published").length,
    scheduled: chapters.filter((b) => b.chapterStatus === "scheduled").length,
  };

  const filteredChapters = chapters.filter((chapter) =>
    tab === "all" ? true : chapter.chapterStatus === tab
  );

  return (
    <main className="max-w-[1300px] mx-auto px-5 font-inter py-5">
      <Link href={"/creator/comics"}>
        <button className="flex items-center cursor-pointer gap-2.5 text-sm font-medium">
          <ArrowLeft size={16} /> back to Dashboard
        </button>
      </Link>

      <section className="flex justify-between gap-20 py-6">
        <div className=" max-w-[861px] w-full">
          <div className="flex items-center gap-6">
            {comic?.image && (
              <Image
                src={comic?.image}
                width={54}
                height={80}
                alt=""
                className="w-[54px] h-[80px] rounded-[8px] object-cover md:hidden"
              />
            )}
            <h3 className="font-semibold text-[28px] max-md:text-2xl">
              {comic?.title}
            </h3>
          </div>
          <div className="flex gap-2 my-8 max-md:w-full max-md:justify-between">
            <Button asChild variant={"secondary"} className="max-md:w-4/5">
              <Link href={`/creator/comics/${slug}/add`}>
                <Plus /> Add Chapter
              </Link>
            </Button>
            {
              <Button className="hidden">
                <Plus /> Bulk Upload
              </Button>
            }
            {comic && (
              <Menubar className="bg-[#1D1E21] max-md:hidden font-inter outline-none border-none ring-0 transition duration-300 hover:ease-in-out">
                <MenubarMenu>
                  <MenubarTrigger className="bg-[#1D1E21] data-[state=open]:bg-none h-8 w-8 flex justify-center items-center transition duration-300 cursor-pointer rounded">
                    <EllipsisVertical size={16} />
                  </MenubarTrigger>
                  <ComicActions comic={comic} details={true} />
                </MenubarMenu>
              </Menubar>
            )}
            {comic && (
              <Sheet>
                <SheetTrigger className="data-[state=open]:bg-none bg-[#1D1E21] md:hidden h-8 w-8 flex justify-center items-center transition duration-300 hover:ease-in-out cursor-pointer rounded">
                  <EllipsisVertical size={16} />
                </SheetTrigger>
                <MobileComicActions comic={comic} />
              </Sheet>
            )}
          </div>
          <div className="flex text-[15px] max-md:flex-col gap-6 md:gap-12 max-md:text-sm">
            <p className="md:hidden max-w-[505px] w-full">
              {isExpanded ? comic?.description : `${truncatedText}...`}
            </p>
            <p className="max-md:hidden max-w-[505px] w-full">
              {comic?.description}
            </p>
            <ul className={`space-y-2 ${isExpanded ? "" : "max-md:hidden"}`}>
              <li>
                {comic?.genre?.map((gen, index) => (
                  <span key={index} className="text-white capitalize">
                    {gen},{" "}
                  </span>
                ))}
              </li>
              {/* <li>10 SOL</li> */}
              <li>
                Released{" "}
                <span className="text-white">
                  {new Date(comic?.createdAt).toDateString()}
                </span>
              </li>
              <li className="capitalize">{comic?.noOfChapters} chapters</li>
              <li className="capitalize">{comic?.ageRating} Rating</li>
              <li>Creator: {profile?.creatorName ?? ""}</li>
            </ul>
            <button
              className="md:hidden cursor-pointer text-left text-[#707073] font-normal"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "See Less" : "See More"}
            </button>
          </div>
        </div>

        {comic?.image && (
          <Image
            priority
            unoptimized
            src={comic?.image}
            width={322}
            height={477}
            alt={`${comic.title} cover image`}
            className="w-[322px] h-[477px] !rounded-[8px] object-contain max-md:hidden"
          />
        )}
      </section>
      <hr className="!text-[#292A2E] max-md:hidden h-0 border-t border-[#292A2E]" />
      {comic && chapters.length == 0 ? (
        <ChaptersEmptyState comicId={comic?.slug ?? ""} />
      ) : (
        <section className="py-8">
          <h3 className="font-semibold text-2xl">
            Chapters ({chapters.length})
          </h3>
          <Tabs
            value={tab}
            onValueChange={setTab}
            defaultValue="all"
            className="bg-transparent mt-10"
          >
            <div className="flex flex-col items-start w-full max-w-[1300px] mx-auto">
              <TabsList className="bg-transparent text-white flex lg:gap-10 p-0">
                <TabsTrigger
                  className="data-[state=active]:border-b !data-[state=active]:border-white pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
                  value="all"
                >
                  All ({counts.all})
                </TabsTrigger>
                <TabsTrigger
                  className="data-[state=active]:border-b !data-[state=active]:border-white pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
                  value="published"
                >
                  Published ({counts.published})
                </TabsTrigger>
                <TabsTrigger
                  className="data-[state=active]:border-b !data-[state=active]:border-white pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
                  value="scheduled"
                >
                  Scheduled ({counts.scheduled})
                </TabsTrigger>
                <TabsTrigger
                  className="data-[state=active]:border-b !data-[state=active]:border-white pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
                  value="draft"
                >
                  Drafts ({counts.draft})
                </TabsTrigger>
              </TabsList>
            </div>
            <hr className="!text-[#292A2E] h-0 border-t border-[#292A2E]" />
            <div className=" max-w-[1300px] mx-auto w-full mt-8">
              <TabsContent value={tab}>
                <ChapterComics slug={slug} data={filteredChapters} />
              </TabsContent>
            </div>
            <hr className="!text-[#292A2E] h-0 mb-10 border-t border-[#292A2E]" />
          </Tabs>
        </section>
      )}
    </main>
  );
};

export default ComicDetailsPage;
