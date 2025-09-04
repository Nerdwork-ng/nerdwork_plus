"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ImageIcon, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { ControllerRenderProps } from "react-hook-form";
import { ComicSeriesFormData, NFTFormData } from "@/lib/schema";

interface ImageUploadProps {
  field:
    | ControllerRenderProps<ComicSeriesFormData, "coverImage">
    | ControllerRenderProps<NFTFormData, "coverImage">;
}

export const ImageUpload = ({ field }: ImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // Clean up the URL when the component unmounts or the file changes
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (file: File | null) => {
    if (file) {
      // Update form state with the File object
      field.onChange(file);
      // Create and set the URL for the local preview
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      // Clear the form state and preview
      field.onChange(null);
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    handleFileChange(selectedFile);
  };

  return (
    <div className="">
      {!previewUrl ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="mx-auto flex flex-col border-dashed items-center justify-center group max-md:w-[335px] max-md:h-[496] md:w-[352px] md:h-[521px] border rounded-lg cursor-pointer bg-transparent border-[#9D9D9F] hover:border-[#646464]"
        >
          <label
            htmlFor="file"
            className="cursor-pointer h-full flex flex-col justify-center text-center w-full"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <ImageIcon />
              <p className="mb-2 text-sm font-semibold text-center group-hover:opacity-75">
                Drag and drop
                <br />
                <span className="font-normal text-xs text-[#707073]">
                  or Click to upload
                </span>
              </p>
            </div>
          </label>
          <input
            id="file"
            type="file"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <div className="relative flex flex-col items-center">
          <Image
            src={previewUrl}
            width={335}
            height={496}
            alt="Cover Preview"
            className="rounded-md max-md:w-[335px] max-md:h-[496] md:w-[352px] md:h-[521px] object-cover"
          />
          <Button
            onClick={() => handleFileChange(null)}
            className="absolute right-0 left-0 top-1/2 w-fit mx-auto px-7 flex items-center"
          >
            <Trash />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
};
