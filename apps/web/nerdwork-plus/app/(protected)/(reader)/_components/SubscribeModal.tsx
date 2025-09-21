"use client";
import { LoadingButton } from "@/components/ui/LoadingButton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Comic } from "@/lib/types";
import { Bell, BellOff } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { subscribeToComicAction } from "@/actions/comic.actions";
import { useQueryClient } from "@tanstack/react-query";

const SubscribeModal = ({ comic }: { comic: Comic }) => {
  const [isSubscribed, setIsSubscribed] = React.useState(comic?.isSubscribed);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      setIsSubscribed((prev) => !prev);
      const response = await subscribeToComicAction(comic.id);

      if (!response?.success) {
        setIsSubscribed((prev) => !prev);
        toast.error(
          response?.message ??
            "An error occurred while processing your request."
        );
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["comic"],
      });
      setIsDialogOpen(false);
      toast.success("Action successful!");
    } catch (err) {
      setIsLoading(false);
      setIsSubscribed((prev) => !prev);
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <Tooltip>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsDialogOpen(true)}
                type="button"
                variant={"outline"}
              >
                {isSubscribed ? <BellOff /> : <Bell />}
              </Button>
            </TooltipTrigger>
          </DialogTrigger>
          <TooltipContent className="border border-nerd-default">
            <p>{isSubscribed ? "Unsubscribe" : "Subscribe to Comic"}</p>
          </TooltipContent>

          <DialogContent className="flex flex-col items-center gap-7 font-inter border-nerd-default bg-[#151515] text-white">
            <DialogHeader className="mt-5">
              <DialogTitle className="text-center leading-normal text-lg">
                Are you sure you want to{" "}
                {isSubscribed ? "unsubscribe from" : "subscribe to"} this comic?{" "}
                <br />({comic.title})
              </DialogTitle>
              <DialogDescription className="text-nerd-muted text-center">
                By {isSubscribed ? "unsubscribing from" : "subscribing to"} this
                comic, {isSubscribed ? "you will no longer" : "you agree to"}{" "}
                receive email notifications relating to this comic.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              {isSubscribed ? (
                <LoadingButton
                  onClick={handleSubscribe}
                  isLoading={isLoading}
                  disabled={isLoading}
                  loadingText="Processing..."
                  type="button"
                  variant={"destructive"}
                >
                  Unsubscribe
                </LoadingButton>
              ) : (
                <LoadingButton
                  onClick={handleSubscribe}
                  isLoading={isLoading}
                  disabled={isLoading}
                  loadingText="Processing..."
                  type="button"
                  variant={"primary"}
                >
                  Subscribe
                </LoadingButton>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Tooltip>
    </>
  );
};

export default SubscribeModal;
