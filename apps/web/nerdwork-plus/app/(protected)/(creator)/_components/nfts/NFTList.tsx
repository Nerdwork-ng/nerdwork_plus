"use client";
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { nftData } from "@/components/data";
import AllNFTs from "./AllNFTs";

const NFTList = () => {
  const NFTs = nftData ?? [];
  const [tab, setTab] = useState<string>("all");

  const counts = {
    all: NFTs.length,
    active: NFTs.filter((b) => b.status === "active").length,
    scheduled: NFTs.filter((b) => b.status === "scheduled").length,
    soldOut: NFTs.filter((b) => b.status === "sold out").length,
  };

  const filteredNFTs = NFTs.filter((nft) =>
    tab === "all" ? true : nft.status === tab
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
          <TabsList className="bg-transparent text-white flex lg:gap-10 px-5">
            <TabsTrigger
              className="data-[state=active]:border-b !data-[state=active]:border-white pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
              value="all"
            >
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:border-b !data-[state=active]:border-white pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
              value="active"
            >
              Live ({counts.active})
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:border-b !data-[state=active]:border-white pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
              value="scheduled"
            >
              Scheduled ({counts.scheduled})
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:border-b !data-[state=active]:border-white pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
              value="sold out"
            >
              Sold Out ({counts.soldOut})
            </TabsTrigger>
          </TabsList>
        </div>
        <hr className="!text-[#292A2E] h-0 border-t border-[#292A2E]" />
        <div className=" max-w-[1300px] mx-auto w-full mt-8">
          <TabsContent value={tab}>
            <AllNFTs data={filteredNFTs} />
          </TabsContent>
        </div>
        <hr className="!text-[#292A2E] h-0 mb-10 border-t border-[#292A2E]" />
      </Tabs>
    </section>
  );
};

export default NFTList;
