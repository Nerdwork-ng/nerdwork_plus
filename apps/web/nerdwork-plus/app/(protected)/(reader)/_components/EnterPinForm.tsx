"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// Schema for a single PIN field
const pinSchema = z.object({
  pin: z.string().min(4, {
    message: "Your PIN must be 4 characters.",
  }),
});

export function EnterPinForm({
  onVerifyPin,
  onBack,
}: {
  onVerifyPin: (pin: string) => void;
  onBack: () => void;
}) {
  const form = useForm<z.infer<typeof pinSchema>>({
    resolver: zodResolver(pinSchema),
    defaultValues: {
      pin: "",
    },
  });

  function onSubmit(data: z.infer<typeof pinSchema>) {
    onVerifyPin(data.pin);
  }

  return (
    <div className="flex flex-col items-center justify-center text-white px-5">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-2">Enter your payment pin</h1>
        <p className="text-sm text-[#707073] mb-8">
          Enter your 4-digit pin to confirm your purchase
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">4-Digit PIN</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={4} {...field} datatype="password">
                      <InputOTPGroup className="mx-auto gap-3">
                        <InputOTPSlot
                          index={0}
                          className="bg-[#1D1E21] border border-[#292A2E] h-16 w-16 text-2xl password-font"
                        />
                        <InputOTPSlot
                          index={1}
                          className="bg-[#1D1E21] border border-[#292A2E] h-16 w-16 text-2xl password-font"
                        />
                        <InputOTPSlot
                          index={2}
                          className="bg-[#1D1E21] border border-[#292A2E] h-16 w-16 text-2xl password-font"
                        />
                        <InputOTPSlot
                          index={3}
                          className="bg-[#1D1E21] border border-[#292A2E] h-16 w-16 text-2xl password-font"
                        />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4">
              <Button
                type="button"
                onClick={onBack}
                className="flex-1"
                variant={"outline"}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 flex-1"
                disabled={!form.formState.isValid}
              >
                Continue
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
