import { ChartLine, Edit2Icon } from "lucide-react";
import React from "react";
import {
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Comic } from "@/lib/types";
import DeleteResource from "./DeleteResource";

const MobileComicActions = ({ comic }: { comic: Comic }) => {
  return (
    <>
      <SheetContent
        side="bottom"
        className="bg-[#1D1E21] p-2 text-white text-sm border-none flex flex-col gap-1"
      >
        <SheetTitle className="sr-only">
          Comic Options for {comic.title}
        </SheetTitle>
        <SheetDescription className="sr-only">
          These are the list of actions that can be taken on the comic
        </SheetDescription>
        <button className="flex items-center gap-2 cursor-pointer hover:bg-[#25262A] p-4 rounded-[8px]">
          <Edit2Icon size={16} /> Edit Series
        </button>
        <button className="flex items-center gap-2 cursor-pointer hover:bg-[#25262A] p-4 rounded-[8px]">
          <ChartLine size={16} /> View Stats
        </button>
        <DeleteResource resource="comic" data={comic} />
      </SheetContent>
    </>
  );
};

export default MobileComicActions;
