"use client";
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreatorComics from "./CreatorComics";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getCreatorComics } from "@/actions/comic.actions";
import { Comic } from "@/lib/types";
import MyComicsEmptyState from "./MyComicsEmptyState";

const Comics = () => {
  const [tab, setTab] = useState<string>("all");

  const {
    data: comicData,
    isLoading,
    // error,
  } = useQuery({
    queryKey: ["comics"],
    queryFn: getCreatorComics,
    placeholderData: keepPreviousData,
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const comics: Comic[] = comicData?.data.comics ?? [];

  if (!comics || isLoading) return <MyComicsEmptyState />;

  const counts = {
    all: comics.length,
    draft: comics.filter((b) => b.comicStatus === "draft").length,
    published: comics.filter((b) => b.comicStatus === "published").length,
    scheduled: comics.filter((b) => b.comicStatus === "scheduled").length,
    upcoming: comics.filter((b) => b.comicStatus === "upcoming").length,
  };

  const filteredComics = comics.filter((comic) =>
    tab === "all" ? true : comic.comicStatus === tab
  );

  return (
    <section className=" text-white font-inter">
      <Tabs
        value={tab}
        onValueChange={setTab}
        defaultValue="all"
        className="bg-transparent mt-10"
      >
        <div className="flex flex-col items-start w-full max-w-[1300px] mx-auto">
          <ScrollArea className="max-md:w-[335px] max-md:mx-auto max-md:px-5">
            <TabsList className="bg-transparent text-white flex lg:gap-10 px-5">
              <TabsTrigger
                className="data-[state=active]:border-b !data-[state=active]:border-white pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
                value="all"
              >
                All ({counts.all})
              </TabsTrigger>
              <TabsTrigger
                className="data-[state=active]:border-b !data-[state=active]:border-white pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
                value="upcoming"
              >
                Upcoming ({counts.upcoming})
              </TabsTrigger>
              <TabsTrigger
                className="data-[state=active]:border-b !data-[state=active]:border-white pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
                value="published"
              >
                Live ({counts.published})
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
            <ScrollBar
              orientation="horizontal"
              className="transition-all ease-in-out duration-300 md:hidden opacity-35"
            />
          </ScrollArea>
        </div>
        <hr className="!text-[#292A2E] h-0 border-t border-[#292A2E]" />
        <div className=" max-w-[1300px] mx-auto w-full mt-8">
          <TabsContent value={tab}>
            <CreatorComics data={filteredComics} />
          </TabsContent>
        </div>
        <hr className="!text-[#292A2E] h-0 mb-10 border-t border-[#292A2E]" />
      </Tabs>
    </section>
  );
};

export default Comics;
