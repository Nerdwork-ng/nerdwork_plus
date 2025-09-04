"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import React from "react";
import { NFTFormData, nftFormSchema } from "@/lib/schema";
import { ImageUpload } from "../../../_components/comics/ImageUpload";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const NewNFTPage = () => {
  const [newTag, setNewTag] = useState("");

  const router = useRouter();

  const form = useForm<NFTFormData>({
    resolver: zodResolver(nftFormSchema),
    defaultValues: {
      name: "",
      description: "",
      supply: 1,
      price: 0,
      properties: [{ type: "", name: "" }],
      tags: [],
      coverImage: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "properties",
  });

  const tags = form.watch("tags");

  const handleAddTag = () => {
    if (newTag.trim() !== "" && !tags.includes(newTag.trim())) {
      const newTags = [...tags, newTag.trim()];
      form.setValue("tags", newTags, { shouldValidate: true });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    form.setValue("tags", newTags, { shouldValidate: true });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const onSubmit = (data: NFTFormData) => {
    console.log("Form submitted successfully:", data);
    toast.success("NFT created successfully!");

    setTimeout(() => {
      router.push("/creator/nfts");
    }, 3000);
  };
  return (
    <>
      <main className="max-w-[1000px] mx-auto px-5 font-inter py-5">
        <Link
          href={"/creator/nfts"}
          className="text-nerd-muted hover:text-white"
        >
          <button className="flex items-center cursor-pointer gap-2.5 text-sm font-medium">
            <ArrowLeft size={16} /> back
          </button>
        </Link>

        <h3 className="text-[28px] font-semibold my-6">Create New Item</h3>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex max-md:flex-col gap-8"
          >
            {/* Left column for form fields */}
            <div className="md:w-3/5 flex-initial space-y-8">
              {/* Item Description Section */}
              <div className="border border-[#292A2E] rounded-[12.75px]">
                <div className="border-b border-[#292A2E] space-y-1 p-6">
                  <h2 className="font-semibold">Item Description</h2>
                  <p className="text-sm text-nerd-muted">
                    Enter basic information about your item
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Item Name"
                            className="bg-[#1d1e21] border-[#292a2e] text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your series story, characters and setting"
                            className="bg-[#1d1e21] border-[#292a2e] text-white min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Supply Section */}
              <div className="border border-[#292A2E] rounded-[12.75px]">
                <div className="border-b border-[#292A2E] space-y-1 p-6">
                  <h2 className="text-lg font-semibold">Supply</h2>
                  <p className="text-sm text-nerd-muted">
                    Number of items you can sell
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="supply"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm ">Items</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1"
                            className="bg-[#1d1e21] border-[#292a2e] text-white"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm ">Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0 USD"
                            className="bg-[#1d1e21] border-[#292a2e] text-white"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Properties Section */}
              <div className="border border-[#292A2E] rounded-[12.75px]">
                <div className="border-b border-[#292A2E] space-y-1 p-6">
                  <h2 className="text-lg font-semibold">Properties</h2>
                  <p className="text-sm text-nerd-muted">
                    Enter properties about your item
                  </p>
                </div>
                <div className="space-y-2 p-6">
                  {fields.map((item, index) => (
                    <div key={item.id} className="flex gap-2 items-center">
                      <FormField
                        control={form.control}
                        name={`properties.${index}.type`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-sm">Type</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Character"
                                className="bg-[#1d1e21] border-[#292a2e] text-white"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`properties.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-sm">Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Elf"
                                className="bg-[#1d1e21] border-[#292a2e] text-white"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {fields.length > 1 && (
                        <Button
                          variant="outline"
                          onClick={() => remove(index)}
                          className="hover:bg-nerd-muted self-end"
                        >
                          <X />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => append({ type: "", name: "" })}
                    className=" border-[#292a2e] mt-2"
                  >
                    <Plus /> Add
                  </Button>
                </div>
              </div>

              {/* Tags Section */}
              <div className="border border-[#292A2E] rounded-[12.75px]">
                <div className="border-b border-[#292A2E] space-y-1 p-6">
                  <h2 className="text-lg font-semibold">Tags</h2>
                  <p className="text-sm text-nerd-muted">
                    Add tags to help readers discover your series
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="tags"
                  render={() => (
                    <FormItem className="p-6 space-y-4">
                      <FormControl>
                        <div>
                          <div className="flex gap-2">
                            <Input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder="Enter tag"
                              className="bg-[#1D1E21] border-[#292A2E] text-white placeholder-gray-400"
                            />
                            <Button
                              type="button"
                              onClick={handleAddTag}
                              variant="secondary"
                            >
                              Add
                            </Button>
                          </div>
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2.5 mt-5">
                              {tags.map((tag: string, index: number) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="bg-[#1D1E21] py-1 text-white"
                                >
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="ml-2 hover:text-red-400 cursor-pointer"
                                  >
                                    <X size={14} />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Mobile cover image */}
              <div className="md:hidden flex-initial">
                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">NFT Image</FormLabel>
                      <FormControl className="">
                        <ImageUpload field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Action buttons at the bottom */}
              <div className="flex justify-end gap-4 mt-8 w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="text-white border-[#292a2e] hover:bg-[#1d1e21]"
                >
                  Preview
                </Button>
                <Button type="submit" variant="primary">
                  Mint
                </Button>
              </div>
            </div>

            {/* Right column for media upload */}
            <div className="max-md:hidden md:w-2/5 flex-initial">
              <FormField
                control={form.control}
                name="coverImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">NFT Image</FormLabel>
                    <FormControl className="">
                      <ImageUpload field={field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </main>
    </>
  );
};

export default NewNFTPage;
