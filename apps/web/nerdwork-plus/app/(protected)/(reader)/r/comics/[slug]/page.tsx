"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { use } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";
import { ArrowLeft, Check } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getReaderComicChapters,
  getSingleComicReader,
} from "@/actions/comic.actions";
import LoaderScreen from "@/components/loading-screen";
import { Chapter, Comic } from "@/lib/types";
import Link from "next/link";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { toast } from "sonner";
import { addToLibrary, removeFromLibrary } from "@/actions/library.actions";

const ComicInterface = ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = use(params);
  const [tab, setTab] = React.useState<string>("chapters");
  const [library, setLibrary] = React.useState(false);

  const {
    data: comicData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["comic"],
    queryFn: () => getSingleComicReader(slug),
    placeholderData: keepPreviousData,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const { data: chaptersData, isLoading: isChaptersLoading } = useQuery({
    queryKey: ["chapters"],
    queryFn: () => getReaderComicChapters(slug),
    placeholderData: keepPreviousData,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  if (isLoading || isChaptersLoading) return <LoaderScreen />;

  const comic: Comic = comicData?.data?.data?.comic;
  const creator = comicData?.data?.data?.creatorName ?? "";
  const isInLibrary = comicData?.data?.data?.inLibrary;

  const chapters: Chapter[] = chaptersData?.data?.data ?? [];

  const handleAddToLibrary = async () => {
    setLibrary(true);
    const comicId = comic.id;
    try {
      const response = await addToLibrary(comicId);

      if (!response?.success) {
        toast.error(
          response?.message ?? "An error occurred while submitting the form."
        );
        return;
      }

      toast.success("Comic added to library successfully");
      refetch();
    } catch (err) {
      console.log(err);
      toast.error("An error occurred!");
    } finally {
      setLibrary(false);
    }
  };

  const handleRemoveFromLibrary = async () => {
    setLibrary(true);
    const comicId = comic.id;
    try {
      const response = await removeFromLibrary(comicId);

      if (!response?.success) {
        toast.error(
          response?.message ?? "An error occurred while submitting the form."
        );
        return;
      }

      toast.success("Comic removed from library successfully");
      refetch();
    } catch (err) {
      console.log(err);
      toast.error("An error occurred!");
    } finally {
      setLibrary(false);
    }
  };

  return (
    <>
      <header className="relative min-h-[50vh] w-full pt-6">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#a0a0a0_0%,#151515_55.75%)] z-10" />
        <div className="relative z-20 text-white h-full max-w-[1000px] mx-auto">
          <section className="flex max-md:flex-col-reverse max-md:pt-20 justify-between min-h-[70vh] font-inter -mb-px max-md:gap-6 md:gap-8 items-center px-5">
            <section className="max-w-[445px] space-y-7">
              <div className="flex flex-col gap-6">
                <Link href={"/r/comics"}>
                  <button className="flex items-center cursor-pointer gap-2.5 text-sm font-medium">
                    <ArrowLeft size={16} /> back
                  </button>
                </Link>
                <h1 className="text-5xl font-bold">{comic?.title}</h1>
                <p className="font-semibold capitalize">
                  {comic?.ageRating} Rating, {comic?.noOfChapters} chapters,{" "}
                  {comic?.genre && comic?.genre[0]}
                </p>
              </div>

              <p>{comic?.description}</p>

              <div className="text-nerd-muted">
                Author: <span className="text-white">{creator ?? ""}</span>,
                Started:{" "}
                <span className="text-white">
                  {new Date(comic?.createdAt).toDateString()}
                </span>
                , Status: <span className="text-white capitalize">Ongoing</span>
                , Genre:{" "}
                {comic?.genre?.map((gen, index) => (
                  <span key={index} className="text-white capitalize">
                    {gen},{" "}
                  </span>
                ))}
              </div>

              <div className="space-x-4 flex items-stretch">
                <Link href={`/r/comics/${slug}/chapters/`}>
                  <Button variant={"primary"}>Start Reading</Button>
                </Link>
                {isInLibrary ? (
                  <LoadingButton
                    onClick={handleRemoveFromLibrary}
                    isLoading={library}
                    disabled={library}
                    loadingText="Removing..."
                    variant={"outline"}
                  >
                    <Check size={16} className={``} /> Added to library
                  </LoadingButton>
                ) : (
                  <LoadingButton
                    onClick={handleAddToLibrary}
                    isLoading={library}
                    disabled={library}
                    loadingText="Adding..."
                    variant={"outline"}
                  >
                    Add to Library
                  </LoadingButton>
                )}
              </div>
            </section>
            {comic?.image && (
              <Image
                src={comic?.image}
                width={323}
                height={500}
                alt={`${comic.title} cover`}
                className="h-[500px] w-[323px] max-md:h-[200px] max-md:w-auto object-cover"
              />
            )}
          </section>
        </div>
      </header>

      <main>
        <Tabs
          value={tab}
          onValueChange={setTab}
          defaultValue="chapters"
          className="bg-transparent mt-10 px-5"
        >
          <div className="flex flex-col items-start w-full max-w-[1000px] mx-auto">
            <TabsList className="bg-transparent text-white flex lg:gap-10 p-0">
              <TabsTrigger
                className="data-[state=active]:border-b !data-[state=active]:border-white pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
                value="chapters"
              >
                Chapters {comic?.noOfChapters}
              </TabsTrigger>
              <TabsTrigger
                className="data-[state=active]:border-b !data-[state=active]:border-white pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
                value="comments"
              >
                Comments
              </TabsTrigger>
              <TabsTrigger
                className="data-[state=active]:border-b !data-[state=active]:border-white pb-5 max-md:font-normal border-white !data-[state=active]:shadow-none text-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !data-[state=active]:shadow-none"
                value="store"
              >
                Store
              </TabsTrigger>
            </TabsList>
          </div>
          <hr className="!text-[#292A2E] h-0 border-t border-[#292A2E]" />
          <div className=" max-w-[1100px] mx-auto w-full mt-8">
            <TabsContent value="chapters">
              <DataTable columns={columns} data={chapters} />
            </TabsContent>
          </div>
          <hr className="!text-[#292A2E] h-0 mb-10 border-t border-[#292A2E]" />
        </Tabs>
      </main>
    </>
  );
};

export default ComicInterface;
