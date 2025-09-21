"use client";

import { useRef, useEffect, useState } from "react";
import { ControllerRenderProps } from "react-hook-form";
import { Image as ImageIcon, Trash, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { chapterSchema } from "@/lib/schema";
import z from "zod";
import Image from "next/image";
import { toast } from "sonner";
import { useUploadMultiImages } from "@/lib/api/mutations";

// The individual sortable file item remains unchanged
const SortableFileItem = ({
  url,
  onRemove,
}: {
  url: string;
  onRemove: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="relative w-full aspect-[2/3] group overflow-hidden border-gray-700"
    >
      <Image
        priority
        unoptimized
        src={url}
        width={187}
        height={281}
        alt="Comic page preview"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/50 flex flex-row-reverse justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity space-y-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 cursor-grab"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="w-6 h-6" />
        </Button>
        <Button
          type="button"
          size="icon"
          className="rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </Card>
  );
};

// Props for the component to integrate with React Hook Form
interface MultiFileUploadProps {
  field: ControllerRenderProps<z.infer<typeof chapterSchema>, "chapterPages">;
}

export function MultiFileUpload({ field }: MultiFileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const pages = (field.value as string[]) || [];

  const {
    mutate,
    isPending,
    isSuccess,
    error,
    data: uploadResults,
    reset,
  } = useUploadMultiImages();

  useEffect(() => {
    if (isSuccess && uploadResults) {
      const newFullUrls = uploadResults
        .filter((result) => result?.success && result.data)
        .map((result) => result.data);

      const newCleanUrls = newFullUrls.map((url) => url.split("?")[0]);

      setPreviewUrls((prev) => [...prev, ...newFullUrls]);
      field.onChange([...pages, ...newCleanUrls]);

      const successfulUploads = newCleanUrls.length;
      const failedUploads = uploadResults.length - successfulUploads;

      if (successfulUploads > 0) {
        toast.success(`${successfulUploads} page(s) uploaded successfully!`);
      }
      if (failedUploads > 0) {
        toast.error(`${failedUploads} page(s) failed to upload.`);
      }

      reset();
    }
    if (error) {
      toast.error("An unexpected error occurred during upload.");
      reset();
    }
  }, [isSuccess, uploadResults, error, field, pages, reset]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      mutate(filesArray);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      mutate(filesArray);
    }
  };

  const removePage = (index: number) => {
    const updatedPages = pages.filter((_, i) => i !== index);
    field.onChange(updatedPages);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex((url) => url === active.id);
      const newIndex = pages.findIndex((url) => url === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(pages, oldIndex, newIndex);
        field.onChange(newOrder);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isPending && fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center p-6 border border-dashed border-[#292A2E] hover:opacity-75 hover:border-neutral-500 rounded-lg cursor-pointer transition-colors ${
          isDragOver || isPending ? "border-neutral-500" : ""
        }`}
      >
        {isPending ? (
          <p className="text-sm font-semibold">Uploading pages...</p>
        ) : (
          <>
            <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
            <p className="text-sm font-semibold">
              {isDragOver ? "Drop files here" : "Add more pages"}
            </p>
            <p className="text-xs text-gray-500">
              Supports JPG, PNG, GIF. Multiple files allowed.
            </p>
            <p className="text-xs text-gray-500">
              Pages will be automatically sorted by filename, but you can
              reorder them below.
            </p>
          </>
        )}
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={isPending}
        />
      </div>

      {pages.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={pages}>
            <p className="font-semibold">Pages ({pages.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {previewUrls.map((url, index) => (
                <SortableFileItem
                  key={url}
                  url={url}
                  onRemove={() => removePage(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
