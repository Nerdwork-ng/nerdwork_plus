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
import { Eye } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { useState } from "react";

const creatorProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters." }),
  creatorName: z
    .string()
    .min(2, { message: "Creator name must be at least 2 characters." }),
  phoneNumber: z
    .string()
    .min(10, { message: "Please enter a valid phone number." }),
  bio: z.string().min(10, { message: "Bio must be at least 10 characters." }),
});

export function CreatorProfileForm({ onNext }: { onNext: () => void }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<z.infer<typeof creatorProfileSchema>>({
    resolver: zodResolver(creatorProfileSchema),
    defaultValues: {
      fullName: user?.username || "",
      creatorName: "",
      phoneNumber: "",
      bio: "",
    },
  });

  async function onSubmit(data: z.infer<typeof creatorProfileSchema>) {
    try {
      setIsLoading(true);
      setError("");
    alert("Creating profile...");
      // First create user profile
      const profileResponse = await apiClient.createUserProfile({
        displayName: data.fullName,
        firstName: data.fullName.split(' ')[0],
        lastName: data.fullName.split(' ').slice(1).join(' ') || undefined,
        bio: data.bio,
        preferences: { role: 'creator', phoneNumber: data.phoneNumber },
        language: 'en',
      });

      if (!profileResponse.success) {
        throw new Error(profileResponse.error || "Failed to create profile");
      }

      // Then make user a creator
      const creatorResponse = await apiClient.becomeCreator({
        creatorName: data.creatorName,
        creatorBio: data.bio,
      });

      if (creatorResponse.success) {
        console.log("Creator profile created:", creatorResponse.data);
        onNext();
      } else {
        throw new Error(creatorResponse.error || "Failed to become creator");
      }
    } catch (error: any) {
      console.error("Creator profile creation error:", error);
      setError(error.message || "Failed to create creator profile");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-white min-h-[75vh]">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center">
          Setup your Creator profile
        </h1>
        <p className="text-sm text-[#707073] text-center mt-3 mb-8">
          Tell us more about yourself
        </p>

        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-[#1D1E21] border-2 border-[#292A2E]">
            <Eye className="w-6 h-6 text-gray-400" />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Name"
                      {...field}
                      className="bg-[#1D1E21] border-[#292A2E] text-white placeholder:text-[#707073]"
                    />
                  </FormControl>
                  <FormDescription>
                    This is your first and last Name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="creatorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Creator Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Name"
                      {...field}
                      className="bg-[#1D1E21] border-[#292A2E] text-white placeholder:text-[#707073]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Number"
                      {...field}
                      className="bg-[#1D1E21] border-[#292A2E] text-white placeholder:text-[#707073]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your series story, characters and setting"
                      className="resize-none bg-[#1D1E21] border-[#292A2E] text-white placeholder:text-[#707073] h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              variant={"primary"} 
              className="w-full mt-4"
              disabled={isLoading}
            >
              {isLoading ? "Creating Profile..." : "Continue"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
