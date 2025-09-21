"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUserSession } from "@/lib/api/queries";
import { useSession } from "next-auth/react";
import Image from "next/image";
import NWT from "@/assets/nwt.svg";
import React from "react";

const ReaderProfilePage = () => {
  const { data: session } = useSession();
  const user = session?.user;
  const { profile } = useUserSession();
  const readerProfile = profile?.readerProfile;

  return (
    <main className="font-inter text-white pt-20">
      <section className="max-w-[1000px] mx-auto px-5 flex flex-col gap-4 py-8">
        <div>
          <h3 className="font-semibold text-[28px]">Profile</h3>
          <p className="text-sm text-nerd-muted">
            Welcome back, {readerProfile?.fullName}! Manage your profile
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
              <p>{readerProfile?.fullName} </p>
              <p className="mb-3 text-nerd-muted">{user?.email} </p>
              <Badge variant={"secondary"}>Reader</Badge>
            </div>
          </div>

          <section className="flex max-md:flex-col gap-10 justify-between">
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold mb-3">
                Wallet Information
              </h3>
              <p className="flex items-center gap-1.5">
                Balance: {readerProfile?.walletBalance}{" "}
                <Image src={NWT} width={16} height={16} alt="nwt" />
              </p>
              <p>Address: {readerProfile?.walletId}</p>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold mb-3">User Preferences</h3>
              <p className="">
                Genres:{"  "}
                {readerProfile?.genres.map((gen: string, index: number) => (
                  <Badge key={index} className="mr-1.5 bg-nerd-blue">
                    {gen}
                  </Badge>
                ))}
              </p>
              <p>
                User since:{" "}
                {new Date(readerProfile?.createdAt).toLocaleDateString()}
              </p>
            </div>
          </section>
        </section>
      </section>
    </main>
  );
};

export default ReaderProfilePage;
