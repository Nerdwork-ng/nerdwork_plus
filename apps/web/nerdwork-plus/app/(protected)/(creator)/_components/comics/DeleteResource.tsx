import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { Chapter, Comic } from "@/lib/types";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Trash } from "lucide-react";
import {
  deleteChapterAction,
  deleteComicSeries,
} from "@/actions/comic.actions";

const DeleteResource = ({
  data,
  resource,
}: {
  data: Comic | Chapter;
  resource: string;
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const handleDeleteComic = async () => {
    setIsLoading(true);
    try {
      const response = await deleteComicSeries((data as Comic).slug);

      if (!response?.success) {
        toast.error(
          response?.message ??
            "An error occurred while processing your request."
        );
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: ["comics"],
      });
      setIsDialogOpen(false);
      toast.success("Comic deleted successfully!");
    } catch (err) {
      setIsLoading(false);
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChapter = async () => {
    setIsLoading(true);

    try {
      const response = await deleteChapterAction((data as Chapter).uniqueCode);

      if (!response?.success) {
        toast.error(
          response?.message ??
            "An error occurred while processing your request."
        );
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: ["reader-chapters"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["creator-chapters"],
      });
      setIsDialogOpen(false);
      toast.success("Chapter deleted successfully!");
    } catch (err) {
      setIsLoading(false);
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <button
            className="flex items-center hover:bg-nerd-gray/50 w-full cursor-pointer transition-colors duration-300 text-sm gap-2 px-2 py-1.5"
            type="button"
          >
            {resource == "comic" ? (
              <>
                <Trash size={16} className="text-nerd-muted" /> Delete Series
              </>
            ) : (
              <>
                <Trash size={16} className="text-nerd-muted" /> Delete Chapter
              </>
            )}
          </button>
        </DialogTrigger>
        <DialogContent className="flex flex-col items-center gap-7 font-inter border-nerd-default bg-[#151515] text-white">
          <DialogHeader className="mt-5">
            <DialogTitle className="text-center leading-normal text-lg">
              Are you sure you want to delete this{" "}
              {resource == "comic" ? "series" : "chapter"}
              <br />({(data as Comic)?.title || (data as Chapter)?.title})
            </DialogTitle>
            <DialogDescription className="text-nerd-muted text-center">
              By deleting this {resource == "comic" ? "series" : "chapter"}, you
              will no longer have access to it and will not be gaining from it
              anymore. Please proceed with caution.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            {resource == "comic" ? (
              <LoadingButton
                onClick={handleDeleteComic}
                isLoading={isLoading}
                disabled={isLoading}
                loadingText="Deleting..."
                type="button"
                variant={"destructive"}
              >
                Delete Series
              </LoadingButton>
            ) : (
              <LoadingButton
                onClick={handleDeleteChapter}
                isLoading={isLoading}
                disabled={isLoading}
                loadingText="Deleting..."
                type="button"
                variant={"destructive"}
              >
                Delete Chapter
              </LoadingButton>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeleteResource;
