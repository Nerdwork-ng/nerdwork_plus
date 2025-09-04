"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CalendarIcon, Eye, Save, Send } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { chapterSchema } from "@/lib/schema";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { use } from "react";
import { MultiFileUpload } from "@/app/(protected)/(creator)/_components/comics/MultiFileUpload";

const NewChapterPage = ({
  params,
}: {
  params: Promise<{ comicId: string }>;
}) => {
  const router = useRouter();
  const { comicId } = use(params);

  const form = useForm<z.infer<typeof chapterSchema>>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      chapterTitle: "",
      chapterNumber: 1,
      summary: "",
      chapterPages: [],
    },
  });

  const onSubmit = (data: z.infer<typeof chapterSchema>) => {
    console.log("New Chapter data:", data);
    // Here you would send the data to your API, likely with FormData for the files
    const formData = new FormData();
    formData.append("chapterTitle", data.chapterTitle);
    formData.append("chapterNumber", data.chapterNumber.toString());
    formData.append("summary", data.summary || "");
    data.chapterPages.forEach((file, index) => {
      formData.append(`chapterPages[${index}]`, file);
    });
    // Append the date if it's set
    if (data.scheduledDate) {
      formData.append("scheduledDate", data.scheduledDate.toISOString());
    }

    toast.success("Chapter created successfully");
    setTimeout(() => {
      router.push(`/creator/comics/${comicId}`);
    }, 3000);
  };
  return (
    <main className="max-w-[1100px] mx-auto px-5 font-inter text-white py-10">
      {/* <div className="flex flex-col text-white"> */}
      <Link href={`/creator/comics/${comicId}`}>
        <button className="flex items-center cursor-pointer gap-2.5 text-sm font-medium">
          <ArrowLeft size={16} /> back to Dashboard
        </button>
      </Link>
      <h3 className="text-[28px] font-semibold my-4">New Chapter</h3>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          {/* Chapter Information */}
          <div className="space-y-5 border border-[#292A2E] rounded-[12.75px] p-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Chapter Information</h2>
              <FormDescription className="text-sm text-nerd-muted">
                Essential details about your comic series
              </FormDescription>
            </div>

            <div className="flex max-md:flex-col space-x-4 max-md:space-y-4">
              <FormField
                control={form.control}
                name="chapterTitle"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Chapter Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter Series Title"
                        {...field}
                        className="bg-[#1D1E21] border-[#292A2E] text-white placeholder:text-nerd-muted"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chapterNumber"
                render={({ field }) => (
                  <FormItem className="md:w-2/4">
                    <FormLabel>Chapter Number</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value}
                        className="bg-[#1D1E21] border-[#292A2E] text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your series story, characters and setting"
                      className="resize-none bg-[#1D1E21] border-[#292A2E] text-white placeholder:text-nerd-muted h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Chapter Pages (Placeholder for custom component) */}
          <div className="space-y-5 border border-[#292A2E] rounded-[12.75px] p-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Chapter Pages</h2>
              <FormDescription className="text-sm text-nerd-muted">
                Modify existing pages or add new ones. You can reorder pages by
                dragging them.
              </FormDescription>
            </div>

            <FormField
              control={form.control}
              name="chapterPages"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <MultiFileUpload field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Schedule and Publish */}
          <div className="flex flex-wrap justify-end gap-4 items-center mt-8">
            <Button variant="outline">
              <Eye />
              Preview Chapter
            </Button>
            <Button variant="outline">
              <Save />
              Save as Draft
            </Button>
            {/* <div className="p-4 rounded-lg bg-[#1D1E21] border border-[#292A2E]"> */}
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="sr-only">Scheduled Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-white"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Schedule Release</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 " />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 border-[#292A2E] overflow-hidden"
                      align="start"
                    >
                      <Calendar
                        className="!bg-[#1D1E21] border !border-[#292A2E] text-white"
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() || date > new Date("2030-01-01")
                        }
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* </div> */}
            {form.watch("scheduledDate") ? (
              <Button type="submit" variant={"primary"} className="">
                <Send />
                Schedule and Close
              </Button>
            ) : (
              <Button type="submit" variant={"primary"} className="">
                <Send />
                Publish Now
              </Button>
            )}
          </div>
        </form>
      </Form>
      {/* </div> */}
    </main>
  );
};

export default NewChapterPage;
