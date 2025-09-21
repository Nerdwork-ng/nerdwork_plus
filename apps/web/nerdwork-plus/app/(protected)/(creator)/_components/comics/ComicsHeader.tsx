"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useUserSession } from "@/lib/api/queries";

const ComicsHeader = () => {
  const { profile } = useUserSession();
  const creatorProfile = profile?.creatorProfile;

  return (
    <section className="!mx-auto max-w-[1300px] font-inter flex max-md:flex-col max-md:gap-6 justify-between md:items-center mt-10 mb-6 max-2xl:px-5">
      <div className="flex flex-col max-md:gap-1 gap-2">
        <h3 className="font-semibold max-md:text-base text-[28px]">
          My Comics
        </h3>
        <p className="font-medium text-sm text-[#707073]">
          Welcome back, {creatorProfile?.creatorName}! Manage your comic series
        </p>
      </div>
      <Link href={"/creator/comics/new"} className="max-md:w-full">
        <Button variant={"secondary"} className="max-md:w-full">
          <Plus />
          New Project
        </Button>
      </Link>
    </section>
  );
};

export default ComicsHeader;
