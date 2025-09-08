import { Book, Plus } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";

const ChaptersEmptyState = ({ comicId }: { comicId: string }) => {
  return (
    <section className="max-w-[1300px] mx-auto font-inter border border-[#292A2E] max-md:rounded-[12.75px] rounded-[12px] flex flex-col gap-6 justify-center items-center max-md:py-4 py-16 md:mt-8 px-4">
      <div className="bg-[#1D1E21] rounded-full w-20 h-20 flex justify-center items-center">
        <Book />
      </div>
      <div className="text-center max-w-[420px]">
        <p className="font-semibold mb-1">No chapters yet</p>
        <p className="text-[#707073] text-sm">
          You currently have no comics. Start your creative journey by creating
          your first comic series!
        </p>
      </div>
      <div className="flex gap-3">
        <Link href={""} className="max-md:w-full max-lg:hidden">
          <Button
            variant={"outline"}
            className="bg-transparent hidden border-[#292A2E] hover:bg-[#292A2E] min-w-[262px] max-md:w-full"
          >
            <Plus />
            Bulk Upload
          </Button>
        </Link>
        <Link href={`/creator/comics/${comicId}/add`} className="max-md:w-full">
          <Button variant={"secondary"} className="min-w-[262px] max-md:w-full">
            <Plus />
            Add chapter
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default ChaptersEmptyState;
