"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReaderGenres } from "./ReaderGenres";
import { ReaderForm } from "./ReaderForm";
import { SetPinForm } from "./SetPinForm";
import { SolanaWalletConnect } from "@/components/wallet/SolanaWalletConnect";

export default function ReaderOnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<{
    fullName: string;
    genres: string[];
    pin: string;
    walletConnected?: boolean;
  }>({
    fullName: "",
    genres: [],
    pin: "",
    walletConnected: false,
  });

  const handleNextStep = () => {
    setStep((prev) => prev + 1);
  };

  const handleFinishProfile = (data: { fullName: string }) => {
    setFormData((prev) => ({ ...prev, fullName: data.fullName }));
    handleNextStep();
  };

  const handleSelectGenres = (genres: string[]) => {
    setFormData((prev) => ({ ...prev, genres }));
    handleNextStep();
  };

  const handleSetPin = (pin: string) => {
    setFormData((prev) => ({ ...prev, pin }));
    handleNextStep();
  };

  const handleWalletConnect = (walletAddress: string, walletType: string) => {
    setFormData((prev) => ({ ...prev, walletConnected: true }));
    console.log("Final Reader Data:", { ...formData, walletConnected: true });
    // Redirect to dashboard or main app
    router.push('/dashboard');
  };

  const handleSkipWallet = () => {
    console.log("Final Reader Data:", formData);
    // Redirect to dashboard or main app
    router.push('/dashboard');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <ReaderForm onNext={handleFinishProfile} />;
      case 2:
        return <ReaderGenres onSelectGenres={handleSelectGenres} />;
      case 3:
        return <SetPinForm onNext={handleSetPin} />;
      case 4:
        return (
          <div className="flex flex-col items-center justify-center min-h-[75vh] px-5">
            <SolanaWalletConnect 
              onConnect={handleWalletConnect}
              onSkip={handleSkipWallet}
              showSkip={true}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return <div className="min-h-[75vh] font-inter">{renderStep()}</div>;
}
