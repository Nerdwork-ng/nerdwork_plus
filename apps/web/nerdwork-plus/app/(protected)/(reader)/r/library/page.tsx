"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RComics from "../../_components/RComics";
import { Input } from "@/components/ui/input";
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
import { getLibraryComics } from "@/actions/library.actions";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import LoaderScreen from "@/components/loading-screen";
import { Comic } from "@/lib/types";

type Checked = DropdownMenuCheckboxItemProps["checked"];

const LibraryPage = () => {
  const [tab, setTab] = React.useState<string>("all");
  const [showFree, setShowFree] = React.useState<Checked>(false);
  const [showPaid, setShowPaid] = React.useState<Checked>(false);
  const [showOngoing, setShowOngoing] = React.useState<Checked>(false);
  const [showCompleted, setShowCompleted] = React.useState<Checked>(false);
  const [sortFilter, setSortFilter] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: libraryData, isLoading } = useQuery({
    queryKey: ["comics"],
    queryFn: () => getLibraryComics(),
    placeholderData: keepPreviousData,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const comics: Comic[] = libraryData?.data?.comics;

  const filteredComics = React.useMemo(() => {
    let tempComics = [...comics];

    // Apply Search Filter
    if (searchQuery) {
      tempComics = tempComics.filter((comic) =>
        comic.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply Tabs Filter
    if (tab !== "all") {
      tempComics = tempComics.filter((comic) => comic.comicStatus === tab);
    }

    // Apply Dropdown Filters
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

    // Apply Sort
    if (sortFilter) {
      tempComics.sort((a, b) => {
        if (sortFilter === "asc") {
          return a.title.localeCompare(b.title);
        }
        if (sortFilter === "dsc") {
          return b.title.localeCompare(a.title);
        }
        // Add other sort options here (e.g., 'newest', 'relevant')
        return 0;
      });
    }

    return tempComics;
  }, [
    comics,
    tab,
    searchQuery,
    showFree,
    showPaid,
    showOngoing,
    showCompleted,
    sortFilter,
  ]);

  if (isLoading) return <LoaderScreen />;

  return (
    <main className="pt-20">
      <h4 className="max-w-[1200px] mx-auto text-2xl font-semibold mt-6 px-5">
        Library
      </h4>

      <Tabs
        value={tab}
        onValueChange={setTab}
        defaultValue="chapters"
        className="bg-transparent mt-10 px-5"
      >
        <div className="flex justify-between w-full max-w-[1160px] mx-auto">
          <TabsList className="bg-transparent text-white flex lg:gap-10 p-0">
            <TabsTrigger
              className="data-[state=active]:border-b !data-[state=active]:border-white pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
              value="all"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:border-b !data-[state=active]:border-white pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
              value="new"
            >
              New Releases
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:border-b !data-[state=active]:border-white pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
              value="completed"
            >
              Completed
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3 -mt-3">
            <Input
              placeholder="Search library"
              className="h- max-w-[400px]  border-[#292A2E] rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
        </div>
        <hr className="!text-[#292A2E] h-0 border-t border-[#292A2E]" />
        <div className=" max-w-[1160px] mx-auto w-full mt-8">
          <TabsContent value={tab}>
            <RComics data={filteredComics} />
          </TabsContent>
        </div>
        <hr className="!text-[#292A2E] h-0 mb-10 border-t border-[#292A2E]" />
      </Tabs>
    </main>
  );
};

export default LibraryPage;
