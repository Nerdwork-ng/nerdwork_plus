"use client";
import { Book, Plus } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";

const NFTsEmptyState = () => {
  return (
    <section className="max-w-[1300px] mx-auto font-inter border border-[#292A2E] max-md:rounded-[12.75px] rounded-[12px] flex flex-col gap-6 justify-center items-center max-md:py-4 py-16 px-4">
      <div className="bg-[#1D1E21] rounded-full w-20 h-20 flex justify-center items-center">
        <Book />
      </div>
      <div className="text-center max-w-[420px]">
        <p className="font-semibold mb-1">No NFTs yet</p>
        <p className="text-[#707073] text-sm">
          You currently have no NFTs. Begin your exciting journey by creating
          your very first NFT!
        </p>
      </div>
      <Link href={"/creator/nfts/new"} className="max-md:w-full">
        <Button variant={"secondary"} className="min-w-[262px] max-md:w-full">
          <Plus />
          Create NFT
        </Button>
      </Link>
    </section>
  );
};

export default NFTsEmptyState;
