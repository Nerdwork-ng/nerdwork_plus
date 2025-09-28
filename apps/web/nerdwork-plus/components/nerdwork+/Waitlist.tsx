import React from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import ComicGallery from "@/assets/nerdwork+/comis.png";
import Link from "next/link";

export default function Waitlist() {
  return (
    <section className="text-white font-inter md:text-center max-w-[1600px] max-lg:py-10 mx-auto flex flex-col gap-5 md:items-center">
      <h2 className="font-obostar text-[40px] max-md:text-2xl px-7">
        Join Today
      </h2>
      <p className="px-7">Free to join, pay as you go</p>

      <Link href={"/signin"} className="w-full px-7">
        <Button
          variant={"primary"}
          className="h-full font-inter max-w-[200px] w-full"
        >
          Sign Up
        </Button>
      </Link>

      <figure className="relative">
        <Image
          src={ComicGallery}
          width={2867}
          height={911}
          alt="comic images"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#0D0D0D_0%,rgba(13,13,13,0)_70%)] z-10" />
      </figure>
    </section>
  );
}
