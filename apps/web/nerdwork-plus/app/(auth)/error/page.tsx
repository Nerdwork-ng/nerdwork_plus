"use client";
import React from "react";
import Logo from "@/assets/nerdwork.png";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const AuthErrorPage = () => {
  const router = useRouter();
  return (
    <section className="min-h-screen font-inter w-full bg-[#151515] text-white flex flex-col gap-6 justify-center items-center">
      <div className="flex flex-col items-center gap-6 rounded-lg border border-nerd-muted p-8 text-center shadow">
        <Image src={Logo} width={150} height={50} alt="Nerdwork logo" />
        <div className="text-center">
          <h2 className="text-2xl text-center font-semibold">
            Oops! Something went wrong
          </h2>
          <p>Please try again</p>
          <Button
            className="mt-6"
            variant={"primary"}
            onClick={() => router.push("/signin")}
          >
            Try Again
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AuthErrorPage;
