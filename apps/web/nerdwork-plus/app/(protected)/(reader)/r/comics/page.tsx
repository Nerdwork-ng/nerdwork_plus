"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { comicData } from "@/components/data";
import RComics from "../../_components/RComics";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
  const [tab, setTab] = React.useState<string>("adventure");

  const comics = comicData ?? [];

  const filteredComics = comics.filter((comic) => comic.genres?.includes(tab));

  return (
    <div className="pt-20">
      <section className="border-t border-[#292A2E]">
        <Tabs
          value={tab}
          onValueChange={setTab}
          defaultValue="adventure"
          className="bg-transparent mt-5"
        >
          <div className="flex flex-col items-start w-full max-w-[1200px] mx-auto">
            <ScrollArea className="max-md:w-[335px] max-md:mx-auto max-md:px-5">
              <TabsList className="bg-transparent text-white flex lg:gap-10 p-0">
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
            <TabsContent value={tab}>
              <RComics data={filteredComics} />
            </TabsContent>
          </div>
          <hr className="!text-[#292A2E] h-0 mb-10 border-t border-[#292A2E]" />
        </Tabs>
      </section>
    </div>
  );
};

export default ReaderComics;
