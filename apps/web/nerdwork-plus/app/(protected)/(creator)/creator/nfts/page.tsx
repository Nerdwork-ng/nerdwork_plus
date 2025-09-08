// import NFTsEmptyState from "@/app/(protected)/(creator)/_components/nfts/NFTsEmptyState";
// import { nftData } from "@/components/data";
// import { Button } from "@/components/ui/button";
// import { Plus } from "lucide-react";
// import Link from "next/link";
import React from "react";
// import NFTList from "../../_components/nfts/NFTList";

const NFTsPage = () => {
  // const NFTs = nftData ?? [];

  return (
    <main className="font-inter text-white">
      <section className="max-w-[1300px] mx-auto px-5 flex max-md:flex-col justify-between gap-4 md:items-center py-8">
        <div>
          <h3 className="font-semibold text-[28px]">My NFTs</h3>
          <p className="text-sm text-nerd-muted">
            Welcome back, Creatorba09! Manage your comic series
          </p>
        </div>
        {/* <Link href={"/creator/nfts/new"} className="max-md:w-full">
          <Button variant={"secondary"}>
            <Plus /> New Collectible
          </Button>
        </Link> */}

        <div className="flex justify-center items-center">
          <h3 className="text-2xl">Feature coming soon ...</h3>
        </div>
      </section>
      {/* {NFTs.length == 0 ? <NFTsEmptyState /> : <NFTList />} */}
    </main>
  );
};

export default NFTsPage;
