"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Loader2, CheckCircle, AlertCircle, Minus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Helio from "@/assets/helio.svg";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { handlePayment } from "@/lib/api/payment";

const HelioCheckout = dynamic(() => import("@heliofi/checkout-react").then(mod => ({ default: mod.HelioCheckout })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-white" />
      <span className="ml-2 text-white">Loading payment form...</span>
    </div>
  )
});

interface HelioModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  paymentLink?: string;
  paylinkId?: string;
  amount: number;
  usdEquivalent: number;
  transactionFee: number;
  totalToPay: number;
  isMinimized?: boolean;
  onMinimize?: (minimized: boolean) => void;
}

const HelioModal: React.FC<HelioModalProps> = ({
  isOpen,
  onOpenChange,
  paymentLink,
  paylinkId,
  amount,
  usdEquivalent,
  transactionFee,
  totalToPay,
  isMinimized = false,
  onMinimize,
}) => {
  const [paymentStatus, setPaymentStatus] = React.useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handlePaymentSuccess =async (payment: any) => {
    console.log("Payment successful:", payment);

    const data = await handlePayment(payment)
    console.log(data)
    setPaymentStatus('success');
    toast.success("Payment completed successfully!");
    
    // Close modal after a brief delay
    setTimeout(() => {
      onOpenChange(false);
      onMinimize?.(false);
      setPaymentStatus('pending'); // Reset for next use
    }, 2000);
  };

  const handleMinimize = () => {
    onMinimize?.(true);
  };

  const handleRestore = () => {
    onMinimize?.(false);
  };

  const handlePaymentError = (error: any) => {
    console.error("Payment failed:", error);
    setPaymentStatus('failed');
    toast.error("Payment failed. Please try again.");
  };

  const renderPaymentStatus = () => {
    switch (paymentStatus) {
      case 'success':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Payment Successful!</h3>
              <p className="text-nerd-muted">Your NWT tokens will be credited to your wallet shortly.</p>
            </div>
          </div>
        );
      case 'failed':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Payment Failed</h3>
              <p className="text-nerd-muted">There was an issue processing your payment. Please try again.</p>
              <Button 
                variant="primary" 
                className="mt-4"
                onClick={() => setPaymentStatus('pending')}
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

  // Floating balloon button when minimized
  if (isMinimized && isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleRestore}
          className="bg-[#AE7A5B] hover:bg-[#9A6A4B] text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 animate-pulse"
          title="Continue Payment"
        >
          <CreditCard className="h-6 w-6" />
        </button>
        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          !
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen && !isMinimized} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#171719] text-white border-none max-w-2xl mx-auto my-auto fixed left-1/2 top-1/2 transform -translate-x-1/4 -translate-y-1/4">
        <DialogHeader className="relative">
          <button
            onClick={handleMinimize}
            className="absolute -top-2 -right-10 p-2 hover:bg-[#292A2E] rounded-full transition-colors"
            title="Minimize"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute -top-2 -right-2 p-2 hover:bg-[#292A2E] rounded-full transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <DialogTitle className="text-2xl flex items-center gap-2">
            Complete Payment
            <Image src={Helio} width={20} height={20} alt="helio" />
          </DialogTitle>
          <DialogDescription className="text-nerd-muted">
            Complete your NWT token purchase using Helio's secure payment system
          </DialogDescription>
        </DialogHeader>

        {/* Payment Summary */}
        <div className="bg-[#1D1E21] rounded-lg p-4 space-y-3 border border-[#292A2E]">
          <h3 className="text-lg font-semibold text-white mb-3">Payment Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-nerd-muted">
              <span>NWT Tokens</span>
              <span className="text-white font-medium">{amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-nerd-muted">
              <span>USD Equivalent</span>
              <span className="text-white">${usdEquivalent.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-nerd-muted">
              <span>Transaction Fee (1%)</span>
              <span className="text-white">${transactionFee.toFixed(2)}</span>
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
          {paymentStatus === 'success' || paymentStatus === 'failed' ? (
            renderPaymentStatus()
          ) : (
            <div className="space-y-4">
              {paylinkId ? (
                <div className="bg-[#1D1E21] rounded-lg p-4 border border-[#292A2E]">
                  <HelioCheckout
                    config={{
                      paylinkId: paylinkId,
                      primaryColor: "#AE7A5B",
                      neutralColor: "#5A6578",
                      display: "inline",
                      "network": "test",
                      
                      theme: {
                        themeMode: "dark",
                      },
                      onSuccess: handlePaymentSuccess,
                      onError: handlePaymentError,
                      onClose: () => {
                        console.log("Payment widget closed");
                      },
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
              <p className="text-sm text-white font-medium">Secure Payment</p>
              <p className="text-xs text-nerd-muted">
                Your payment is processed securely through Helio's encrypted payment system. 
                Your card details are never stored on our servers.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center pt-4 border-t border-[#292A2E]">
          <p className="text-xs text-nerd-muted flex items-center gap-2">
            Powered by Helio
            <Image src={Helio} width={14} height={14} alt="helio" />
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelioModal;