"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import Logo from "@/assets/nerdwork.png";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const AuthNav = () => {
  const [selectedRole, setSelectedRole] = useState<"creator" | "reader" | null>(
    null
  );
  const router = useRouter();

  const handleContinue = () => {
    if (selectedRole == "creator") {
      router.push(`/creator/comics`);
    } else if (selectedRole == "reader") {
      router.push(`/r/comics`);
    } else {
      toast.info("Please choose a role to continue.");
    }
  };
  return (
    <>
      <main className="bg-[#171719] min-h-screen w-full font-inter text-white flex flex-col items-center justify-center gap-20 px-5">
        <div className="flex justify-center items-center">
          <Link href={"/"}>
            <Image src={Logo} width={146} height={40} alt="nerdwork logo" />
          </Link>
        </div>
        <section className="w-full max-w-[400px] text-center">
          <h4 className="text-2xl font-semibold">
            Choose Profile to continue in:
            <br /> Reader or Creator
          </h4>
          <p className="text-[#707073] text-sm mt-3">
            We&apos;ve noticed that you have both creator and reader profiles
            linked to this account
          </p>

          <div className="space-y-4 text-left mt-10">
            <div
              className={`px-5 py-2 cursor-pointer transition-all duration-200 rounded-[12px] border-[0.5px] border-[#292A2E] ${
                selectedRole === "creator"
                  ? "bg-white text-black"
                  : "bg-[#1D1E21] hover:bg-neutral-800"
              }`}
              onClick={() => setSelectedRole("creator")}
            >
              <p className="text-base font-semibold">Creator</p>
            </div>

            <div
              className={`px-5 py-2 cursor-pointer transition-all duration-200 rounded-[12px] border-[0.5px] border-[#292A2E] ${
                selectedRole === "reader"
                  ? "bg-white text-black"
                  : "bg-[#1D1E21] hover:bg-neutral-800"
              }`}
              onClick={() => setSelectedRole("reader")}
            >
              <p className="text-base font-semibold">Reader</p>
            </div>
          </div>

          <Button
            onClick={handleContinue}
            variant={"primary"}
            className="w-full mt-10"
          >
            Continue
          </Button>
        </section>
      </main>
    </>
  );
};

export default AuthNav;
