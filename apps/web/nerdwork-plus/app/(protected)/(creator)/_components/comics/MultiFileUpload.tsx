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

type Page = {
  id: string;
  previewUrl: string;
  size: number;
};

const MAX_TOTAL_SIZE_MB = 15;

const SortableFileItem = ({
  id,
  previewUrl,
  onRemove,
}: {
  id: string;
  previewUrl: string;
  onRemove: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

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
        src={previewUrl}
        width={187}
        height={281}
        alt="Comic page preview"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/30 lg:bg-black/50 flex flex-row-reverse justify-between p-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity space-y-2">
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

interface MultiFileUploadProps {
  field: ControllerRenderProps<z.infer<typeof chapterSchema>, "chapterPages">;
  setImageUploading: (value: boolean) => void;
}

export function MultiFileUpload({
  setImageUploading,
  field,
}: MultiFileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use a single state to manage the list of objects with both URLs
  const initialPages = (field.value as string[]) || [];
  const [pagesData, setPagesData] = useState<Page[]>(
    initialPages.map((url) => ({ id: url, previewUrl: url, size: 0 }))
  );

  const filesRef = useRef<File[]>([]);

  const {
    mutate,
    isPending,
    isSuccess,
    error,
    data: uploadResults,
    reset,
  } = useUploadMultiImages();

  // Populate the pagesData state with initial values
  useEffect(() => {
    if (initialPages.length > 0 && pagesData.length === 0) {
      setPagesData(
        initialPages.map((url) => ({ id: url, previewUrl: url, size: 0 }))
      );
    }
  }, [initialPages, pagesData]);

  useEffect(() => {
    setImageUploading(isPending);
  }, [isPending, setImageUploading]);

  useEffect(() => {
    if (isSuccess && uploadResults) {
      const newPagesData: Page[] = uploadResults
        .map((result, idx) => {
          if (result?.success && result.data) {
            const fullUrl = result.data as string;
            const cleanUrl = fullUrl.split("?")[0];
            const fileSize = filesRef.current[idx]?.size || 0;
            return {
              id: cleanUrl,
              previewUrl: fullUrl,
              size: fileSize,
            };
          }
          return null;
        })
        .filter((p): p is Page => p !== null);

      if (newPagesData.length > 0) {
        setPagesData((prev) => [...prev, ...newPagesData]);
        field.onChange([
          ...pagesData.map((p) => p.id),
          ...newPagesData.map((p) => p.id),
        ]);
      }

      const successfulUploads = newPagesData.length;
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
      filesRef.current = [];
      reset();
    }
  }, [isSuccess, uploadResults, error, field, initialPages, reset]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      filesRef.current = filesArray;

      // Calculate the total size of all pages (existing + new)
      const currentTotalSize = pagesData.reduce(
        (acc, page) => acc + page.size,
        0
      );
      const newFilesTotalSize = filesArray.reduce(
        (acc, file) => acc + file.size,
        0
      );
      const combinedTotalSize = currentTotalSize + newFilesTotalSize;

      // const MAX_TOTAL_SIZE_MB = 5;
      const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

      if (combinedTotalSize > MAX_TOTAL_SIZE_BYTES) {
        toast.error(
          `Total file size exceeds the ${MAX_TOTAL_SIZE_MB}MB limit.`
        );
        filesRef.current = []; // Clear the ref
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

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

      filesRef.current = filesArray; // Store files in the ref

      const currentTotalSize = pagesData.reduce(
        (acc, page) => acc + page.size,
        0
      );
      const newFilesTotalSize = filesArray.reduce(
        (acc, file) => acc + file.size,
        0
      );
      const combinedTotalSize = currentTotalSize + newFilesTotalSize;

      // const MAX_TOTAL_SIZE_MB = 5;
      const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

      if (combinedTotalSize > MAX_TOTAL_SIZE_BYTES) {
        toast.error(
          `Total file size exceeds the ${MAX_TOTAL_SIZE_MB}MB limit.`
        );
        filesRef.current = []; // Clear the ref
        return;
      }

      mutate(filesArray);
    }
  };

  const removePage = (idToRemove: string) => {
    const updatedPagesData = pagesData.filter((page) => page.id !== idToRemove);
    setPagesData(updatedPagesData);
    field.onChange(updatedPagesData.map((p) => p.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pagesData.findIndex((page) => page.id === active.id);
      const newIndex = pagesData.findIndex((page) => page.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(pagesData, oldIndex, newIndex);
        setPagesData(newOrder); // Update our local state
        field.onChange(newOrder.map((p) => p.id)); // Update the form state with clean URLs
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
            <p className="text-xs text-nerd-muted">
              Supports JPG, PNG, GIF. Multiple files allowed.
            </p>
            <p className="text-xs text-nerd-muted font-semibold py-0.5">
              {MAX_TOTAL_SIZE_MB}MB total upload limit.
            </p>
            <p className="text-xs text-nerd-muted">
              Pages will be sorted by order of upload, but you can reorder them
              below.
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

      {pagesData.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={pagesData.map((page) => page.id)}>
            <p className="font-semibold">Pages ({pagesData.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {pagesData.map((page) => (
                <SortableFileItem
                  key={page.id}
                  id={page.id}
                  previewUrl={page.previewUrl}
                  onRemove={() => removePage(page.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
