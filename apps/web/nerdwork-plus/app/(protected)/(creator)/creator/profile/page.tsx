"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUserSession } from "@/lib/api/queries";
import { useSession } from "next-auth/react";
import Image from "next/image";
import NWT from "@/assets/nwt.svg";
import React from "react";

const CreatorProfilePage = () => {
  const { data: session } = useSession();
  const user = session?.user;
  const { profile } = useUserSession();
  const creatorProfile = profile?.creatorProfile;

  return (
    <main className="font-inter text-white">
      <section className="max-w-[1000px] mx-auto px-5 flex flex-col gap-4 py-8">
        <div>
          <h3 className="font-semibold text-[28px]">Profile</h3>
          <p className="text-sm text-nerd-muted">
            Welcome back, {creatorProfile?.creatorName}! Manage your profile
            information.
          </p>
        </div>

        <section className="rounded-xl max-w-2xl p-6 text-sm border border-nerd-default">
          <div className="flex gap-4 items-center mb-10">
            <Avatar className="h-16 w-16">
              {user?.profilePicture && (
                <AvatarImage
                  src={user?.profilePicture}
                  alt={`${user.email} profile image`}
                />
              )}
              {user?.email && (
                <AvatarFallback className="uppercase">
                  {user?.email[0]}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="">
              <p>{creatorProfile?.fullName} </p>
              <p className="text-nerd-muted">{user?.email} </p>
              <p className="my-2">{creatorProfile?.bio}</p>
              <Badge variant={"secondary"}>Creator</Badge>
            </div>
          </div>

          <section className="flex max-md:flex-col gap-10 justify-between">
            <div>
              <h3 className="text-base font-semibold mb-3">
                Wallet Information
              </h3>
              <p className="flex items-center gap-1.5">
                Balance: {creatorProfile?.walletBalance}{" "}
                <Image src={NWT} width={16} height={16} alt="nwt" />
              </p>
              <p>
                Solflare Address: {creatorProfile?.walletAddress?.slice(0, 5)}
                ...
                {creatorProfile?.walletAddress?.slice(-4)}
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold mb-3">User Information</h3>
              <p className="">
                Phone Number:{"  "}
                {creatorProfile?.phoneNumber}
              </p>
              <p>
                User since:{" "}
                {new Date(creatorProfile?.createdAt).toLocaleDateString()}
              </p>
            </div>
          </section>
        </section>
      </section>
    </main>
  );
};

export default CreatorProfilePage;
