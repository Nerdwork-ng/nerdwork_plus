"use client";

import { useState } from "react";
import { ReaderGenres } from "./ReaderGenres";
import { ReaderForm } from "./ReaderForm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ReaderOnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<{
    fullName: string;
    genres: string[];
  }>({
    fullName: "",
    genres: [],
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

    console.log("Final Reader Data:", { ...formData, genres });
    toast.success("Account setup complete!");

    setTimeout(() => {
      router.push("/r/comics");
    }, 3000);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <ReaderForm onNext={handleFinishProfile} />;
      case 2:
        return <ReaderGenres onSelectGenres={handleSelectGenres} />;
      default:
        return null;
    }
  };

  return <div className="min-h-[75vh] font-inter">{renderStep()}</div>;
}
