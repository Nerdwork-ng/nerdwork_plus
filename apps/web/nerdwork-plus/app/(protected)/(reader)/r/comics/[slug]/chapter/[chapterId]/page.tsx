"use client";
import Image from "next/image";
import React, { use, useEffect, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import ComicInfo from "@/app/(protected)/(reader)/_components/ComicInfo";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addViewCountAction,
  getChapterPages,
  getReaderComicChapters,
} from "@/actions/comic.actions";
import LoaderScreen from "@/components/loading-screen";
import { Chapter } from "@/lib/types";
import Link from "next/link";
import ComicPaymentFlow from "@/app/(protected)/(reader)/_components/ComicPaymentFlow";
import LikeChapter from "@/app/(protected)/(reader)/_components/LikeChapter";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import LockedChapter from "@/app/(protected)/(reader)/_components/LockedChapter";

const ComicReader = ({
  params,
}: {
  params: Promise<{ chapterId: string; slug: string }>;
}) => {
  const { chapterId, slug } = use(params);
  const [readingMode, setReadingMode] = useState("vertical");
  const [sizing, setSizing] = useState("auto");
  const [currentPage, setCurrentPage] = useState(0);
  const [showFooter, setShowFooter] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  const isReadingRoute = /^\/r\/comics\/[^/]+\/chapter\/[^/]+$/.test(pathname);
  const queryClient = useQueryClient();

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (!isReadingRoute) {
      setShowFooter(true);
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setShowFooter(false);
      } else {
        setShowFooter(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY, isReadingRoute]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      let activePageIndex = 0;
      if (readingMode === "vertical") {
        const scrollY = container.scrollTop + container.clientHeight / 2;
        pageRefs.current.forEach((pageRef, index) => {
          if (pageRef && pageRef.offsetTop <= scrollY) {
            activePageIndex = index;
          }
        });
      } else if (readingMode === "horizontal") {
        const scrollX = container.scrollLeft + container.clientWidth / 2;
        pageRefs.current.forEach((pageRef, index) => {
          if (pageRef && pageRef.offsetLeft <= scrollX) {
            activePageIndex = index;
          }
        });
      }
      setCurrentPage(activePageIndex);
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [readingMode]);

  const { data: pagesData, isLoading } = useQuery({
    queryKey: ["pages", chapterId],
    queryFn: () => getChapterPages(chapterId),
    placeholderData: keepPreviousData,
    refetchInterval: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled: !!chapterId,
  });

  const { data: chaptersData } = useQuery({
    queryKey: ["reader-chapters", slug],
    queryFn: () => getReaderComicChapters(slug),
    placeholderData: keepPreviousData,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled: !!slug,
  });

  const chapters: Chapter[] = chaptersData?.data?.data ?? [];

  const currentIndex = chapters.findIndex(
    (chapter) => chapter.uniqueCode === chapterId
  );

  const nextChapterCode =
    currentIndex !== -1 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1].uniqueCode
      : null;
  const previousChapterCode =
    currentIndex > 0 ? chapters[currentIndex - 1].uniqueCode : null;

  const isNextChapterPaid = chapters[currentIndex + 1]?.chapterType == "paid";
  const hasUnlocked = chapters[currentIndex + 1]?.hasPaid;

  const isPreviousChapterPaid =
    chapters[currentIndex - 1]?.chapterType == "paid";
  const previousUnlocked = chapters[currentIndex - 1]?.hasPaid;

  const chapter: Chapter = pagesData?.data?.data ?? [];
  const chapterPages: string[] = chapter?.pages;

  useEffect(() => {
    const addView = async () => {
      try {
        const response = await addViewCountAction(chapter.id);

        if (!(response.data.message == "Already viewed")) {
          await queryClient.invalidateQueries({
            queryKey: ["reader-chapters"],
          });
          await queryClient.invalidateQueries({
            queryKey: ["comic"],
          });
        }
      } catch (error) {
        console.error("Failed to add view count:", error);
      }
    };

    if (chapter.id) {
      addView();
    }
  }, [chapter.id]);

  if (isLoading) return <LoaderScreen />;

  if (!chapters[currentIndex]?.hasPaid)
    return <LockedChapter slug={slug} chapter={chapters[currentIndex]} />;

  const totalPages = chapterPages?.length;

  const handleNextPage = () => {
    if (currentPage + 2 < totalPages) {
      setCurrentPage((prev) => prev + 2);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 2);
    }
  };

  const getImageSizingClass = () => {
    switch (sizing) {
      case "fit-to-width":
        return "w-full h-auto max-h-screen";
      case "fit-to-height":
        return "h-full w-auto max-w-screen";
      case "auto":
      default:
        return ""; // This leaves the image to render at its original size
    }
  };

  const readingModes = [
    {
      value: "vertical",
      label: "Vertical",
      iconClasses: "h-10 w-6 border rounded",
    },
    {
      value: "horizontal",
      label: "Horizontal",
      iconClasses:
        "h-10 w-12 border rounded grid grid-cols-2 gap-[2px] p-[2px]",
    },
    {
      value: "2-page",
      label: "2 page",
      iconClasses:
        "h-10 w-12 border rounded grid grid-cols-2 gap-[2px] p-[2px]",
    },
  ];

  const sizingOptions = [
    { value: "auto", label: "Auto", iconClasses: "h-10 w-10 border rounded" },
    {
      value: "fit-to-height",
      label: "Fit to Height",
      iconClasses: "h-10 w-8 border rounded",
    },
    {
      value: "fit-to-width",
      label: "Fit to Width",
      iconClasses: "h-10 w-12 border rounded",
    },
  ];

  const FooterPanel = (
    <footer
      className={`border-t font-inter transition-transform duration-300 ${
        showFooter ? "translate-y-0" : "translate-y-full"
      } bg-[#151515] border-[#FFFFFF0D] md:max-h-[72px] fixed bottom-0 left-0 right-0 font-inter`}
    >
      <div className="max-w-[1200px] mx-auto flex gap-2 justify-between items-center px-10 py-5 text-sm">
        {chapter && <ComicInfo slug={slug} chapter={chapters[currentIndex]} />}

        {readingMode === "2-page" ? (
          <div className="max-md:hidden flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handlePreviousPage}
              disabled={currentPage <= 0}
            >
              <ChevronLeft size={16} /> Previous
            </Button>
            <span className="text-sm">
              Page {currentPage + 1} - {Math.min(currentPage + 2, totalPages)}{" "}
              of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={currentPage + 2 >= totalPages}
            >
              Next <ChevronRight size={16} />
            </Button>
          </div>
        ) : (
          <div className="max-md:hidden flex items-center gap-4">
            {readingMode == "horizontal" ? (
              <span className="text-sm">
                Page {currentPage + 1} of {totalPages}
              </span>
            ) : (
              <span className="text-sm">Total Pages: {totalPages}</span>
            )}
          </div>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant={"outline"} className="">
              Reading Settings
              <BookOpen size={16} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="bg-[#151515] w-80 border-[#FFFFFF0D] text-white">
            <div className="space-y-4">
              {/* Reading Mode Section */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Reading mode</h4>
                <div className="grid grid-cols-3 gap-2">
                  {readingModes.map((mode) => (
                    <Button
                      key={mode.value}
                      variant="ghost"
                      onClick={() => setReadingMode(mode.value)}
                      className={cn(
                        "flex flex-col items-center hover:bg-nerd-default hover:text-white h-auto py-2",
                        readingMode === mode.value && "border border-white",
                        mode.value == "2-page" ? "max-md:hidden" : ""
                      )}
                    >
                      <div className={cn(mode.iconClasses, "mb-1")}>
                        {mode.value === "vertical" && (
                          <div className="h-full w-full bg-secondary opacity-50"></div>
                        )}
                        {(mode.value === "horizontal" ||
                          mode.value === "2-page") && (
                          <>
                            <div className="h-full w-full bg-secondary opacity-50"></div>
                            <div className="h-full w-full bg-secondary opacity-50"></div>
                          </>
                        )}
                      </div>
                      <span className="text-xs">{mode.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <hr className="!text-[#292A2E] h-0 border-t border-[#292A2E]" />

              {/* Sizing Section */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Sizing</h4>
                <div className="grid grid-cols-3 gap-2">
                  {sizingOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant="ghost"
                      onClick={() => setSizing(option.value)}
                      className={cn(
                        "flex flex-col items-center hover:bg-nerd-default hover:text-white h-auto py-2",
                        sizing === option.value && "border border-white",
                        readingMode == "2-page" &&
                          option.value == "fit-to-height"
                          ? "hidden"
                          : ""
                      )}
                    >
                      <div
                        className={cn(
                          option.iconClasses,
                          "mb-1",
                          "bg-secondary opacity-50"
                        )}
                      ></div>
                      <span className="text-xs">{option.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </footer>
  );

  if (readingMode === "2-page") {
    const pagesToShow = chapterPages.slice(currentPage, currentPage + 2);
    return (
      <>
        <section className="flex flex-col justify-center items-center w-full min-h-screen px-5">
          <div className="flex justify-center max-w-[1200px] w-full gap-4">
            {pagesToShow.map((page, index) => (
              <figure
                key={currentPage + index}
                className="w-1/2 flex justify-center"
              >
                <Image
                  priority
                  unoptimized
                  src={page}
                  width={573}
                  height={880}
                  alt={`page ${currentPage + index + 1}`}
                  className={cn("object-contain", getImageSizingClass())}
                />
              </figure>
            ))}
          </div>
          <section className="flex justify-center gap-5">
            {isPreviousChapterPaid && !previousUnlocked ? (
              <div className="mt-5">
                <ComicPaymentFlow
                  internal={true}
                  chapter={chapters[currentIndex - 1]}
                />
              </div>
            ) : (
              <>
                {previousChapterCode ? (
                  <Link
                    className="text-center mt-5"
                    href={`/r/comics/${slug}/chapter/${previousChapterCode}`}
                  >
                    <Button variant={"outline"}>Previous Chapter</Button>
                  </Link>
                ) : (
                  <Link className="text-center mt-5" href={`/r/comics/${slug}`}>
                    <Button variant="outline">Go back Home</Button>
                  </Link>
                )}
              </>
            )}

            {isNextChapterPaid && !hasUnlocked ? (
              <div className="mt-5">
                <ComicPaymentFlow
                  internal={true}
                  chapter={chapters[currentIndex + 1]}
                />
              </div>
            ) : (
              <>
                {nextChapterCode ? (
                  <Link
                    className="text-center mt-5"
                    href={`/r/comics/${slug}/chapter/${nextChapterCode}`}
                  >
                    <Button>Next Chapter</Button>
                  </Link>
                ) : (
                  <Link className="text-center mt-5" href={`/r/comics/${slug}`}>
                    <Button variant="outline">Go back Home</Button>
                  </Link>
                )}
              </>
            )}
          </section>
          <div className="fixed bottom-20 right-3 bg-[#151515] rounded-full border border-nerd-gray w-10 h-10 flex justify-center items-center">
            <LikeChapter chapter={chapters[currentIndex]} />
          </div>
        </section>
        {FooterPanel}
      </>
    );
  }

  return (
    <>
      <main
        ref={containerRef}
        className={`w-full relative font-inter min-h-screen px-5 pb-5 flex ${
          readingMode === "vertical"
            ? "flex-col justify-center pt-20"
            : "flex-row flex-nowrap items-center pt-0 overflow-x-auto"
        } gap-2`}
      >
        {chapterPages?.map((page, index) => (
          <figure
            key={index}
            ref={(el) => {
              pageRefs.current[index] = el;
            }}
            className={`flex justify-center ${
              readingMode === "horizontal" ? "flex-none" : "w-auto h-full"
            }`}
          >
            <Image
              src={page}
              width={573}
              height={880}
              alt={`page ${index + 1}`}
              className={cn("object-contain", getImageSizingClass())}
            />
          </figure>
        ))}

        {/* Next Button */}
        <div
          className={`${
            showFooter ? "translate-x-0" : "-translate-x-full"
          } fixed top-1/2 left-3 transition-transform duration-300`}
        >
          {isPreviousChapterPaid && !previousUnlocked ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <ComicPaymentFlow
                  internal={true}
                  chapter={chapters[currentIndex - 1]}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Unlock Chapter</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              {previousChapterCode ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      className="text-center"
                      href={`/r/comics/${slug}/chapter/${previousChapterCode}`}
                    >
                      <Button variant={"outline"}>
                        <ArrowLeft />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Go to previous chapter</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link className="text-center" href={`/r/comics/${slug}`}>
                      <Button variant="outline">
                        <Home />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Go home</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>

        {/* Next Button */}
        <div
          className={`${
            showFooter ? "translate-x-0" : "translate-x-full"
          } fixed top-1/2 right-3 transition-transform duration-300`}
        >
          {isNextChapterPaid && !hasUnlocked ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <ComicPaymentFlow
                  internal={true}
                  chapter={chapters[currentIndex + 1]}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Unlock Chapter</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              {nextChapterCode ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      className="text-center"
                      href={`/r/comics/${slug}/chapter/${nextChapterCode}`}
                    >
                      <Button>
                        <ArrowRight />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Go to next Chapter</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild></TooltipTrigger>
                  <Link className="text-center" href={`/r/comics/${slug}`}>
                    <Button variant="outline">
                      <Home />
                    </Button>
                  </Link>
                  <TooltipContent>
                    <p>Go home</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>

        <div className="fixed bottom-5 right-3 bg-[#151515] rounded-full border border-nerd-gray w-10 h-10 flex justify-center items-center">
          <LikeChapter chapter={chapters[currentIndex]} />
        </div>
      </main>
      {FooterPanel}
    </>
  );
};

export default ComicReader;
