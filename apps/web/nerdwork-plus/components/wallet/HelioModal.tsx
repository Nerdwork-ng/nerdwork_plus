"use client";
import React from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Helio from "@/assets/helio.svg";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { handlePayment } from "@/lib/api/payment";
import { useUserSession } from "@/lib/api/queries";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { ScrollArea } from "../ui/scroll-area";

const HelioCheckout = dynamic(
  () =>
    import("@heliofi/checkout-react").then((mod) => ({
      default: mod.HelioCheckout,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-white" />
        <span className="ml-2 text-white">Loading payment form...</span>
      </div>
    ),
  }
);

interface HelioModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  paymentLink?: string;
  paylinkId?: string;
  amount: number;
  usdEquivalent: number;
  transactionFee: number;
  totalToPay: number;
}

const HelioModal: React.FC<HelioModalProps> = ({
  isOpen,
  onOpenChange,
  paylinkId,
  amount,
  usdEquivalent,
  transactionFee,
  totalToPay,
}) => {
  const [paymentStatus, setPaymentStatus] = React.useState<
    "pending" | "processing" | "success" | "failed"
  >("pending");
  const [isClient, setIsClient] = React.useState(false);
  const { refetch } = useUserSession();

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // eslint-disable-next-line
  const handlePaymentSuccess = async (payment: any) => {
    try {
      const response = await handlePayment(payment);

      if (!response?.success) {
        toast.error(
          response?.message ?? "An error occurred while submitting the form."
        );
        return;
      }

      toast.success("Payment completed successfully!");
      setPaymentStatus("success");
      await refetch();

      setTimeout(() => {
        onOpenChange(false);
        setPaymentStatus("pending");
        window.location.reload();
      }, 5000);
    } catch (err) {
      toast.error("An unexpected error occurred.");
      console.error(err);
    }
  };

  // eslint-disable-next-line
  const handlePaymentError = (error: any) => {
    console.error("Payment failed:", error);
    setPaymentStatus("failed");
    toast.error("Payment failed. Please try again.");
  };

  const renderPaymentStatus = () => {
    switch (paymentStatus) {
      case "success":
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                Payment Successful!
              </h3>
              <p className="text-nerd-muted">
                Your NWT tokens will be credited to your wallet shortly.
              </p>
            </div>
          </div>
        );
      case "failed":
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                Payment Failed
              </h3>
              <p className="text-nerd-muted">
                There was an issue processing your payment. Please try again.
              </p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => setPaymentStatus("pending")}
              >
                Try Again
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-[#171719] text-white border-none flex flex-col h-[90vh]">
        <ScrollArea className="flex-1 overflow-y-auto px-10 max-md:px-5">
          <div className="space-y-4 py-4">
            <DrawerHeader className="">
              <DrawerTitle className="text-2xl text-white justify-center flex items-center gap-2">
                Complete Payment
                <Image src={Helio} width={20} height={20} alt="helio" />
              </DrawerTitle>
              <DrawerDescription className="text-nerd-muted">
                Complete your NWT token purchase using Helio&apos;s secure
                payment system
              </DrawerDescription>
            </DrawerHeader>
            {/* Payment Summary */}
            <div className="bg-[#1D1E21] rounded-lg p-4 space-y-3 border border-[#292A2E]">
              <h3 className="text-lg font-semibold text-white mb-3">
                Payment Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-nerd-muted">
                  <span>NWT Tokens</span>
                  <span className="text-white font-medium">
                    {amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-nerd-muted">
                  <span>USD Equivalent</span>
                  <span className="text-white">
                    ${usdEquivalent.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-nerd-muted">
                  <span>Transaction Fee (1%)</span>
                  <span className="text-white">
                    ${transactionFee.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-[#292A2E] pt-2 mt-2">
                  <div className="flex justify-between text-white font-semibold">
                    <span>Total to Pay</span>
                    <span>${totalToPay.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Payment Status or Helio Checkout */}
            <div className="min-h-[300px]">
              {paymentStatus === "success" || paymentStatus === "failed" ? (
                renderPaymentStatus()
              ) : (
                <div className="space-y-2 w-full helio-checkout-container">
                  {paylinkId ? (
                    <div className="bg-[#1D1E21] flex justify-center rounded-lg p-4 border border-[#292A2E]">
                      <HelioCheckout
                        config={{
                          paylinkId: paylinkId,
                          primaryColor: "#AE7A5B",
                          neutralColor: "#5A6578",
                          display: "inline",
                          network: "test",
                          theme: {
                            themeMode: "dark",
                          },
                          onSuccess: handlePaymentSuccess,
                          onError: handlePaymentError,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
                        <p className="text-nerd-muted">Setting up payment...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Security Notice */}
            <div className="bg-[#1D1E21] rounded-lg p-3 border border-[#292A2E]">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">
                    Secure Payment
                  </p>
                  <p className="text-xs text-nerd-muted">
                    Your payment is processed securely through Helio&apos;s
                    encrypted payment system. Your card details are never stored
                    on our servers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        {/* Footer */}
        <div className="flex items-center justify-center py-2 border-t border-[#292A2E]">
          <p className="text-xs text-nerd-muted flex items-center gap-2">
            Powered by Helio
            <Image src={Helio} width={14} height={14} alt="helio" />
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default HelioModal;
