"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RComics from "../../_components/RComics";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getAllComicsForReader } from "@/actions/comic.actions";
import { Comic } from "@/lib/types";
import LoaderScreen from "@/components/loading-screen";

const TABS = [
  "adventure",
  "fantasy",
  "mystery",
  "sci-fi",
  "romance",
  "thriller",
  "superhero",
  "historical",
];

const ReaderComics = () => {
  const [tab, setTab] = React.useState<string>("all");

  const {
    data: comicData,
    isLoading,
    // error,
  } = useQuery({
    queryKey: ["ReaderComics"],
    queryFn: getAllComicsForReader,
    placeholderData: keepPreviousData,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) return <LoaderScreen />;

  const comics: Comic[] = comicData?.data?.comics ?? [];

  const filteredComics = comics.filter((comic) =>
    tab === "all"
      ? true
      : comic.genre?.some((genre) => genre.toLowerCase() === tab.toLowerCase())
  );

  return (
    <div className="pt-20">
      <h2 className="max-w-[1200px] mx-auto px-6 text-2xl font-semibold pt-5 pb-2.5">
        Available Comics
      </h2>
      <section>
        <Tabs
          value={tab}
          onValueChange={setTab}
          defaultValue="all"
          className="bg-transparent mt-5"
        >
          <div className="flex flex-col items-start w-full max-w-[1200px] mx-auto">
            <ScrollArea className="max-md:w-[335px] max-md:mx-auto max-md:px-5">
              <TabsList className="bg-transparent text-white flex lg:gap-10 max-xl:px-5 p-0">
                <TabsTrigger
                  className="data-[state=active]:border-b !data-[state=active]:border-white pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
                  value="all"
                >
                  All
                </TabsTrigger>
                {TABS.map((genre, index) => (
                  <TabsTrigger
                    className="data-[state=active]:border-b !data-[state=active]:border-white capitalize pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
                    value={genre}
                    key={index}
                  >
                    {genre}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar
                orientation="horizontal"
                className="transition-all ease-in-out duration-300 md:hidden opacity-35"
              />
            </ScrollArea>
          </div>
          <hr className="!text-[#292A2E] h-0 border-t border-[#292A2E]" />
          <div className=" max-w-[1200px] mx-auto w-full mt-8">
            {comics.length == 0 ? (
              <>
                <div className="flex flex-col items-center justify-center p-10 text-center">
                  <p className="text-xl font-semibold">No comics found!</p>
                  <p className="mt-2 text-sm">
                    Try again later. Seems creators are on a holiday
                  </p>
                </div>
              </>
            ) : (
              <TabsContent value={tab}>
                <RComics data={filteredComics} />
              </TabsContent>
            )}
          </div>
          <hr className="!text-[#292A2E] h-0 mb-10 border-t border-[#292A2E]" />
        </Tabs>
      </section>
    </div>
  );
};

export default ReaderComics;
