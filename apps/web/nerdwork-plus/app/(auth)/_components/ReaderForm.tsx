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
import { Eye } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { useState } from "react";

const finishProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters." }),
});

interface ReaderFormProps {
  onNext: (data: { fullName: string }) => void;
}

export function ReaderForm({ onNext }: ReaderFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const form = useForm<z.infer<typeof finishProfileSchema>>({
    resolver: zodResolver(finishProfileSchema),
    defaultValues: {
      fullName: user?.username || "",
    },
  });

  const onSubmit = async (data: z.infer<typeof finishProfileSchema>) => {
    try {
      setIsLoading(true);
      setError("");

      // Create user profile
      const response = await apiClient.createUserProfile({
        displayName: data.fullName,
        firstName: data.fullName.split(' ')[0],
        lastName: data.fullName.split(' ').slice(1).join(' ') || undefined,
        preferences: { role: 'reader' },
        language: 'en',
      });

      if (response.success) {
        console.log("Reader profile created:", response.data);
        onNext(data);
      } else {
        setError(response.error || "Failed to create profile");
      }
    } catch (error) {
      console.error("Profile creation error:", error);
      setError("Failed to create profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-white px-5">
      <div className="w-full max-w-sm text-center">
        <h4 className="text-2xl font-bold mb-2">
          Finish setting up your account
        </h4>
        <p className="text-sm text-[#707073] mb-8">Add your name and avatar</p>

        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-[#292A2E] border-2 border-[#292A2E]">
            <Eye className="w-6 h-6 text-gray-400" />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      disabled={isLoading}
                      className="bg-[#292A2E] border-[#292A2E] text-white placeholder:text-[#707073]"
                    />
                  </FormControl>
                  <FormDescription className="text-left">
                    This is your first and last Name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              variant={"primary"} 
              className="w-full mt-2"
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
