import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Chapter } from "@/lib/types";
import { Calendar, EllipsisVertical, Send, Trash } from "lucide-react";
import React from "react";

const ChapterActions = ({ chapter }: { chapter: Chapter }) => {
  return (
    <>
      <Menubar className="max-md:hidden bg-[#1D1E21] font-inter outline-none border-none ring-0 rounded-full transition duration-300 hover:ease-in-out  p-0">
        <MenubarMenu>
          <MenubarTrigger className="bg-[#1D1E21] data-[state=open]:bg-none h-9 w-9 rounded-md flex justify-center items-center transition duration-300 cursor-pointer ">
            <EllipsisVertical size={16} />
          </MenubarTrigger>
          <MenubarContent className="max-md:hidden bg-[#1D1E21] text-white border-0 absolute -right-[30px]">
            {chapter.chapterStatus != "published" && (
              <>
                <MenubarItem>
                  <Calendar />
                  Schedule Chapter
                </MenubarItem>
                <MenubarItem>
                  <Send /> Publish Chapter
                </MenubarItem>
              </>
            )}
            <MenubarItem>
              <Trash /> Delete Chapter
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <Sheet>
        <SheetTrigger className="md:hidden bg-nerd-default rounded-md data-[state=open]:bg-none h-9 w-9 flex justify-center items-center transition duration-300 hover:ease-in-out cursor-pointer">
          <EllipsisVertical size={20} />
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="bg-[#1D1E21] p-2 text-white text-sm border-none flex flex-col gap-1"
        >
          <SheetTitle className="sr-only">Chapter Options</SheetTitle>
          <SheetDescription className="sr-only">
            These are the list of actions that can be taken on the chapter
          </SheetDescription>
          {chapter.chapterStatus != "published" && (
            <div>
              <button className="flex items-center gap-2 cursor-pointer hover:bg-[#25262A] p-4 rounded-[8px]">
                <Calendar size={16} /> Schedule Chapter
              </button>
              <button className="flex items-center gap-2 cursor-pointer hover:bg-[#25262A] p-4 rounded-[8px]">
                <Send size={16} /> Publish Chapter
              </button>
            </div>
          )}
          <button className="flex items-center gap-2 cursor-pointer hover:bg-[#25262A] p-4 rounded-[8px]">
            <Trash size={16} /> Delete Chapter
          </button>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ChapterActions;
