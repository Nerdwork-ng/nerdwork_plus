import {
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
} from "@/components/ui/menubar";
import { ChartLine, Edit2Icon, Eye } from "lucide-react";
import React from "react";
import Link from "next/link";
import { Comic } from "@/lib/types";
import DeleteResource from "./DeleteResource";

const ComicActions = ({
  comic,
  details,
}: {
  comic: Comic;
  details: boolean;
}) => {
  return (
    <>
      <MenubarContent className="max-md:hidden bg-[#1D1E21] text-white border-0 absolute -right-[30px]">
        {!details && (
          <Link href={`/creator/comics/${comic.slug}`}>
            <MenubarItem>
              <Eye />
              View Details
            </MenubarItem>
          </Link>
        )}
        <MenubarItem>
          <Edit2Icon /> Edit Series
        </MenubarItem>
        <MenubarItem>
          <ChartLine /> View Stats
        </MenubarItem>
        <MenubarSeparator />
        <MenubarItem asChild>
          <DeleteResource data={comic} resource={"comic"} />
        </MenubarItem>
      </MenubarContent>
    </>
  );
};

export default ComicActions;
