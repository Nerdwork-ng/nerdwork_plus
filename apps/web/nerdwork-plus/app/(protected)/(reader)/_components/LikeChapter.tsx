"use client";
import { likeChapterAction } from "@/actions/comic.actions";
import { Chapter } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import React from "react";
import { toast } from "sonner";

const SPARKLE_COUNT = 25;

interface CustomCSS extends React.CSSProperties {
  "--i"?: number;
  "--delay"?: string;
}

const LikeChapter = ({ chapter }: { chapter: Chapter }) => {
  const [isLiked, setIsLiked] = React.useState(chapter?.hasLiked);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const queryClient = useQueryClient();

  const handleLike = async () => {
    setIsAnimating(true);
    try {
      setIsLiked((prev) => !prev);

      const response = await likeChapterAction(chapter.id);

      if (!response?.success) {
        setIsLiked((prev) => !prev);
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
        queryKey: ["comic"],
      });
    } catch (err) {
      setIsLiked((prev) => !prev);
      toast.error("An unexpected error occurred.");
      console.error(err);
    }
  };

  return (
    <button onClick={handleLike} className={`cursor-pointer group relative`}>
      <Heart
        size={20}
        fill={isLiked ? "red" : "none"}
        className={`
          transition-all duration-300 hover:text-red-500
          ${isLiked ? "text-red-500" : "text-nerd-muted"}
          ${isAnimating && isLiked ? "animate-like-heart" : ""}
          ${isLiked ? "" : " hover:text-red-500"}
        `}
      />
      {isAnimating && isLiked && (
        <>
          {Array.from({ length: SPARKLE_COUNT }).map((_, i) => (
            <span
              key={i}
              className="absolute left-2 inset-0 w-full h-full flex items-center justify-center animate-sparkle"
              style={
                {
                  "--i": i,
                  "--delay": `${Math.random() * 0.5}s`,
                  "--x": `${(Math.random() - 0.5) * 60}px`,
                  "--y": `${(Math.random() - 0.5) * 60}px`,
                } as CustomCSS
              }
            />
          ))}
        </>
      )}
    </button>
  );
};

export default LikeChapter;
