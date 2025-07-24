import React from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import Card1 from "@/assets/costume.png";
import Card2 from "@/assets/mask.png";
import Card3 from "@/assets/arrow.png";
import Card4 from "@/assets/woman.png";
import ComicCon1 from "@/assets/comic-con1.png";
import Link from "next/link";

export default function Community() {
  const communities = [
    "Pop Culture",
    "Video Games",
    "Comics",
    "Theatre",
    "Anime",
    "Books",
    "Movies",
    "Music",
  ];
  return (
    <section
      data-testid="community"
      className="z-10 flex items-center max-w-[1130px] font-inter mx-auto text-white pt-12 pb-28 px-7"
    >
      <aside className="lg:w-2/5 max-lg::w-3/5 flex flex-col max-lg:gap-4 gap-6">
        <h2 className="font-obostar text-[40px] max-md:text-2xl">
          People
          <br />
          passion
          <br />
          community
        </h2>
        <p className="font-semibold max-md:text-sm">
          No matter your passion, there&apos;s a community for you.
        </p>
        {communities.map((community, index) => (
          <div key={index} className="group flex gap-4 items-center">
            <p className="text-2xl max-md:text-lg font-medium cursor-pointer text-[#9C9C9C] md:hover:text-[#EDEBEB]">
              {community}
            </p>
            <Link href={"/communities"}>
              <Button
                variant={"primary"}
                className="max-md:hidden font-inter rounded-[12px] opacity-0 group-hover:opacity-100 transition duration-200 ease-in"
              >
                Join Community
              </Button>
            </Link>
          </div>
        ))}
      </aside>

      {/* Desktop image gallery */}
      <section className="lg:w-3/5 hidden lg:flex flex-col gap-16">
        <div className="flex justify-center gap-20">
          <Image src={Card1} width={241} height={302} alt="comic con image" />
          <Image src={Card2} width={257} height={334} alt="comic con image" />
        </div>
        <div className="flex gap-7 -ml-20 max-xl:overflow-hidden">
          <Image src={Card3} width={450} height={324} alt="comic con image" />
          <Image
            src={Card4}
            width={303}
            height={370}
            alt="comic con image"
            className=""
          />
        </div>
      </section>

      {/* Mobile image gallery */}
      <section className="lg:hidden max-lg:2/5 overflow-hidden flex flex-col items-center gap-4">
        <Image src={Card2} width={181} height={227} alt="comic con image" />
        <Image src={ComicCon1} width={254} height={159} alt="comic con image" />
        <Image src={Card1} width={150} height={188} alt="comic con image" />
      </section>
    </section>
    
  );
}
