import { Badge } from "@/components/ui/badge";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
} from "@/components/ui/menubar";
import { EllipsisVertical } from "lucide-react";
import Image from "next/image";
import React from "react";
import { NFTCollectible } from "@/lib/types";
import { ChartLine, Edit2Icon, Eye, Trash } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const AllNFTs = ({ data }: { data: NFTCollectible[] }) => {
  return (
    <section className="font-inter text-white mb-10 max-md:mt-5 max-2xl:mx-5">
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {data.map((comic) => (
          <div
            key={comic.id}
            className="relative group h-[586px] bg-[#171719] rounded-[8px] flex flex-col border border-[#262626] hover:border-[#9D9D9F] transition duration-300 hover:ease-in-out overflow-hidden"
          >
            <Image
              src={comic.image}
              width={316}
              height={468}
              alt={`${comic.name} cover`}
              className="h-[468px] w-full object-cover"
            />
            <div className="absolute left-5 right-5 flex justify-between top-3">
              <Badge variant={"secondary"} className="capitalize h-6 text-xs">
                {comic.status}
              </Badge>
              <Menubar className="bg-[#1D1E21] font-inter outline-none border-none ring-0 rounded-full transition duration-300 hover:ease-in-out  p-0">
                <MenubarMenu>
                  <MenubarTrigger className="bg-[#1D1E21] data-[state=open]:bg-none h-8 w-8 flex justify-center items-center transition duration-300 cursor-pointer rounded-full p-0">
                    <EllipsisVertical size={16} />
                  </MenubarTrigger>
                  <MenubarContent className="bg-[#1D1E21] text-white border-0 absolute -right-[30px]">
                    <MenubarItem>
                      <Eye />
                      View Details
                    </MenubarItem>
                    <MenubarItem>
                      <Edit2Icon /> Edit Details
                    </MenubarItem>
                    <MenubarItem>
                      <ChartLine /> View Stats
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem>
                      <Trash /> Take Down
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            </div>
            <div className="p-5 max-md:p-3 text-sm space-y-1">
              <p className="mb-1 font-semibold">{comic.name}</p>
              <p className="text-nerd-muted text-sm">{comic.description}</p>
              <div className="text-sm py-3 space-y-1">
                <p className="flex justify-between items-center text-nerd-muted">
                  <span>
                    {comic.status == "active"
                      ? "issued"
                      : comic.status == "sold out"
                      ? "Sold out"
                      : "not issued"}
                  </span>
                  <span>
                    {comic.sold_copies}/{comic.total_copies} copies
                  </span>
                </p>

                <Progress
                  value={(comic.sold_copies / comic.total_copies) * 100}
                />
              </div>
              <p className="flex justify-between items-center">
                <span>{comic.price} SOL</span>
                <span className="text-nerd-muted">
                  {comic.commission}% commission
                </span>
              </p>
            </div>
          </div>
        ))}
      </section>
    </section>
  );
};

export default AllNFTs;
