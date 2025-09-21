"use client";
// import { comicData } from "@/components/data";
import { useSearchParams } from "next/navigation";
import React from "react";
import RComics from "../../_components/RComics";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import { LucideChevronDown } from "lucide-react";
import { Comic } from "@/lib/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getAllComicsForReader } from "@/actions/comic.actions";
import LoaderScreen from "@/components/loading-screen";

type Checked = DropdownMenuCheckboxItemProps["checked"];

const ComicSearch = () => {
  const searchParams = useSearchParams();
  const search = searchParams.get("q");

  const {
    data: comicData,
    isLoading,
    // error,
  } = useQuery({
    queryKey: ["comics"],
    queryFn: getAllComicsForReader,
    placeholderData: keepPreviousData,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const comics: Comic[] = comicData?.data?.comics ?? [];

  const data = comics.filter(
    (comic) =>
      search && comic.title.toLowerCase().includes(search.toLowerCase())
  );

  const [showFree, setShowFree] = React.useState<Checked>(false);
  const [showPaid, setShowPaid] = React.useState<Checked>(false);
  const [showOngoing, setShowOngoing] = React.useState<Checked>(false);
  const [showCompleted, setShowCompleted] = React.useState<Checked>(false);
  const [sortFilter, setSortFilter] = React.useState("");

  const filteredComics = React.useMemo(() => {
    let tempComics = [...data];

    if (showFree) {
      tempComics = tempComics.filter((comic) => !comic.isPaid);
    } else if (showPaid) {
      tempComics = tempComics.filter((comic) => comic.isPaid);
    }

    if (showOngoing) {
      tempComics = tempComics.filter((comic) => comic.isOngoing);
    } else if (showCompleted) {
      tempComics = tempComics.filter((comic) => !comic.isOngoing);
    }

    if (sortFilter) {
      tempComics.sort((a, b) => {
        if (sortFilter === "asc") {
          return a.title.localeCompare(b.title);
        }
        if (sortFilter === "dsc") {
          return b.title.localeCompare(a.title);
        }
        // Add other sort options here (e.g., 'newest', 'relevant')
        if (sortFilter === "newest") {
          return b.createdAt.localeCompare(a.createdAt);
        }
        if (sortFilter === "relevant") {
          return b.viewsCount - a.viewsCount;
        }
        return 0;
      });
    }

    return tempComics;
  }, [comics, showFree, showPaid, showOngoing, showCompleted, sortFilter]);

  if (isLoading) return <LoaderScreen />;

  return (
    <main className="pt-20">
      <section className=" border-b border-[#FFFFFF0D]">
        <section className="max-w-[1200px] mx-auto mt-6 px-5 pb-4 flex max-md:flex-col justify-between md:items-center">
          <h3 className="text-2xl font-semibold capitalize">{search}</h3>
          <div className="flex items-center gap-4 text-sm">
            <p className="mr-4">{data.length} Results</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex gap-1 text-sm items-center cursor-pointer"
                >
                  Filters <LucideChevronDown size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1D1E21] text-white border-0 mx-5  mt-2">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={showFree}
                  onCheckedChange={(checked) => {
                    setShowFree(checked);
                    if (checked) {
                      setShowPaid(false);
                    }
                  }}
                >
                  Free Comics
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showPaid}
                  onCheckedChange={(checked) => {
                    setShowPaid(checked);
                    if (checked) {
                      setShowFree(false);
                    }
                  }}
                >
                  Paid Comics
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showOngoing}
                  onCheckedChange={(checked) => {
                    setShowOngoing(checked);
                    if (checked) {
                      setShowCompleted(false);
                    }
                  }}
                >
                  Ongoing
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showCompleted}
                  onCheckedChange={(checked) => {
                    setShowCompleted(checked);
                    if (checked) {
                      setShowOngoing(false);
                    }
                  }}
                >
                  Completed
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Select onValueChange={setSortFilter} value={sortFilter}>
              <SelectTrigger className="outline-none border-none !text-white">
                <SelectValue placeholder="Sort:" />
              </SelectTrigger>
              <SelectContent className="bg-[#1D1E21] border-none text-white">
                <SelectGroup>
                  <SelectLabel>Sort by</SelectLabel>
                  <SelectItem value="asc">A - Z</SelectItem>
                  <SelectItem value="dsc">Z - A</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="relevant">Most Relevant</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </section>
      </section>

      <section className="max-w-[1200px] mt-6 px-5  mx-auto ">
        <RComics data={filteredComics} />
      </section>
    </main>
  );
};

export default ComicSearch;
