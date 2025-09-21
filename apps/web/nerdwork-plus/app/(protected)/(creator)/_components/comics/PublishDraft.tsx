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
import { Chapter } from "@/lib/types";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { publishDraft } from "@/actions/comic.actions";
import { useQueryClient } from "@tanstack/react-query";

const PublishDraft = ({ data }: { data: Chapter }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const handleDraftPublish = async () => {
    setIsLoading(true);

    try {
      const response = await publishDraft(data.uniqueCode, data.comicSlug);

      if (!response?.success) {
        toast.error(
          response?.message ??
            "An error occurred while processing your request."
        );
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: ["creator-chapters"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["comics"],
      });
      setIsDialogOpen(false);
      toast.success("Chapter published successfully!");
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
          <Button
            className="flex items-center bg-nerd-default hover:bg-nerd-gray/50 text-white cursor-pointer transition-colors duration-300 text-sm gap-2 px-2 py-1.5"
            type="button"
            variant={"secondary"}
          >
            <Send />
            Publish
          </Button>
        </DialogTrigger>
        <DialogContent className="flex flex-col items-center gap-7 font-inter border-nerd-default bg-[#151515] text-white">
          <DialogHeader className="mt-5">
            <DialogTitle className="text-center leading-normal text-lg">
              Are you sure you want to publish this chapter ({data?.title})?
            </DialogTitle>
            <DialogDescription className="text-nerd-muted text-center">
              By publishing this chapter, it will be come fully public an
              accessible to readers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <LoadingButton
              onClick={handleDraftPublish}
              isLoading={isLoading}
              disabled={isLoading}
              loadingText="Processing..."
              type="button"
              variant={"primary"}
            >
              Publish Draft
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PublishDraft;
