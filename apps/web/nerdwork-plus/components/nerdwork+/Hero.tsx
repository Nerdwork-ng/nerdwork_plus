import React from "react";
import Navbar from "../homepage/Navbar";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Link from "next/link";

export default function ProductHero() {
  return (
    <header className="relative min-h-screen w-full">
      <div className="absolute inset-0 bg-[url('/nerdwork+/plus-hero.png')] bg-cover bg-center bg-no-repeat z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0D0D0D_0%,rgba(13,13,13,0)_30%,#0D0D0D_95%)] z-10" />
      <div className="relative z-20 text-white h-screen max-w-[1440px] mx-auto">
        <Navbar />
        <section
          data-testid="hero"
          className="flex flex-col max-w-[600px] w-full md:ml-24 font-inter -mb-px max-md:gap-6 md:gap-8 items-start justify-center max-md:justify-end h-screen pb-10 px-7"
        >
          <p className="bg-[#0856D3] text-sm max-md:text-[13px] rounded-[8px] px-5 py-1.5 font-medium">
            Coming Soon
          </p>
          <h1 className="font-obostar text-[52px] max-md:text-[32px]">
            African
            <br />
            Stories
            <br /> Redefined
          </h1>
          <p className="font-semibold max-md:text-sm">
            Discover comics rooted in Africa’s past, present, and future—all
            created by African storytellers.
          </p>
          <form className="max-w-[704px] w-full flex gap-3 justify-center items-stretch">
            <Input
              type="email"
              className="bg-[#17171A] outline-none border-none w-full rounded-[8px] py-2.5 pl-4 w-"
              placeholder="Email address"
            />
            <Link href={"/signin"}>
              <Button variant={"primary"} className="h-full font-inter">
                Join Waitlist
              </Button>
            </Link>
          </form>
        </section>
      </div>
    </header>
  );
}
