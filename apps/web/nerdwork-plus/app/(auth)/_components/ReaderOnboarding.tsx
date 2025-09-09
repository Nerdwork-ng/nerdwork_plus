"use client";

import { useState } from "react";
import { ReaderGenres } from "./ReaderGenres";
import { ReaderForm } from "./ReaderForm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createReaderProfile } from "@/actions/profile.actions";
import { useSession } from "next-auth/react";

export default function ReaderOnboardingFlow() {
  const { update } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
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

  const handleSelectGenres = async (genres: string[]) => {
    setFormData((prev) => ({ ...prev, genres }));
    setLoading(true);

    try {
      const response = await createReaderProfile({ ...formData, genres });

      if (!response?.success) {
        toast.error(
          response?.message ?? "An error occurred while submitting the form."
        );
        return;
      }

      await update({ rProfile: true });

      toast.success("Profile Updated Successfully!");
      router.push("/r/comics");
    } catch (err) {
      toast.error("An unexpected error occurred.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <ReaderForm onNext={handleFinishProfile} />;
      case 2:
        return (
          <ReaderGenres
            isLoading={loading}
            onSelectGenres={handleSelectGenres}
          />
        );
      default:
        return null;
    }
  };

  return <div className="relative min-h-[75vh] font-inter">{renderStep()}</div>;
}
