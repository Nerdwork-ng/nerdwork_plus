"use client";
import React from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import ComicCon1 from "@/assets/comic-con1.png";
import ComicCon2 from "@/assets/comic-con2.png";
import ComicCon3 from "@/assets/comic-con3.png";
import ComicCon4 from "@/assets/comic-con4.png";
import Carry1st from "@/assets/sponsors/carry1st.svg";
import Itel from "@/assets/sponsors/itel.svg";
import Filmhouse from "@/assets/sponsors/filmhouse.svg";
import Tribe from "@/assets/sponsors/tribe.svg";
import Monster from "@/assets/sponsors/monster.svg";
import Link from "next/link";

const stats = [
  {
    first: "5000",
    second: "Attendees",
    third: "in 3 years",
  },
  {
    first: "300",
    second: "Members",
    third: "Registered",
  },
  {
    first: "20+",
    second: "Stalls",
    third: "Booths and Activities",
  },
  {
    first: "4Y",
    second: "Running",
    third: "Registered Members",
  },
];

export default function ComicCon() {
  return (
    <section
      data-testid="comic-con"
      className="z-10 max-w-[1130px] w-full font-inter mx-auto text-white py-20 px-7 md:mt-32"
    >
      <h2 className="font-obostar text-[40px] max-md:text-2xl mb-4">
        EpiC Comic-Cons
        <br />
        <span className="text-xl max-md:text-base">&</span> IRL meetups
      </h2>
      <section className="flex max-md:flex-col w-full items-center">
        <aside className="md:w-1/2 flex flex-col gap-20">
          <div className="flex flex-col gap-6">
            <p className="max-md:text-sm">
              Meet your favorite creators, cosplay icons, and fellow fans
            </p>
            <div className="flex flex-col gap-4">
              <Link
                target="_blank"
                href={"https://www.straqa.events/nerdworkcomiccon"}
              ></Link>
              <Link href={"/events"}>
                <Button className="md:w-fit">
                  See last year&apos;s comic con
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile images */}
          <div className="md:hidden">
            <Image
              src={ComicCon2}
              width={366}
              height={282}
              alt="comic con images"
              className="rotate-3 z-0"
            />
            <Image
              src={ComicCon4}
              width={366}
              height={282}
              alt="comic con images"
              className="-mt-64 z-20 relative"
            />
          </div>
          <div className="md:flex flex-col max-md:grid grid-cols-2 gap-14">
            {stats.map((stat, index) => (
              <div key={index}>
                <h3 className="font-obostar text-[28px] max-md:text-lg mb-2">
                  {stat.first}
                  <br />
                  {stat.second}
                </h3>
                <p className="text-sm text-[#A9A9A9CC]">{stat.third}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* Desktop images */}
        <div className="md:w-1/2 max-md:hidden">
          <Image
            src={ComicCon1}
            width={589}
            height={445}
            alt="comic con images"
          />
          <Image
            src={ComicCon2}
            width={589}
            height={445}
            alt="comic con images"
            className="-mt-44 -ml-32"
          />
          <Image
            src={ComicCon3}
            width={556}
            height={386}
            alt="comic con images"
            className="-mt-20"
          />
        </div>
      </section>

      <section
        data-testid="sponsors"
        className="max-md:mt-16 mt-20 flex flex-col max-md:gap-16 gap-20 overflow-hidden"
      >
        <p className="text-sm font-medium">Sponsors of comic con 2024</p>
        <div className="flex justify-between gap-4 animate-marquee hover:pause">
          <Image src={Carry1st} width={49} height={48} alt="carry1st logo" />
          <Image src={Itel} width={75} height={48} alt="itel logo" />
          <Image src={Filmhouse} width={137} height={48} alt="filmhouse logo" />
          <Image src={Tribe} width={93} height={48} alt="tribe logo" />
          <Image src={Monster} width={55} height={48} alt="monster logo" />
        </div>
        <div className="flex max-md:hidden justify-between gap-4 animate-marquee-reverse hover:pause">
          <Image src={Itel} width={75} height={48} alt="itel logo" />
          <Image src={Carry1st} width={49} height={48} alt="carry1st logo" />
          <Image src={Tribe} width={93} height={48} alt="tribe logo" />
          <Image src={Filmhouse} width={137} height={48} alt="filmhouse logo" />
          <Image src={Monster} width={55} height={48} alt="monster logo" />
        </div>
      </section>
    </section>
  );
}
