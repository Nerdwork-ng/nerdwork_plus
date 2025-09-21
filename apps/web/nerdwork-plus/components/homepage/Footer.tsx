import Image from "next/image";
import React from "react";
import FooterImage from "@/assets/mask-footer.png";
import Logo from "@/assets/nerdwork.png";
import Facebook from "@/assets/socials/facebook.svg";
import Instagram from "@/assets/socials/instagram.svg";
import Twitter from "@/assets/socials/twitter.svg";
import { Button } from "../ui/button";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative w-full flex max-lg:flex-col lg:-mt-20 max-lg:gap-12 max-lg:items-start items-center max-w-[1130px] mx-auto text-white font-inter px-7 max-lg:pb-12">
      <section className="flex lg:w-[28%] flex-col gap-6">
        <Image src={Logo} width={175} height={48} alt="nerdwork logo" />
        <p>Join to stay up to date</p>
        <Link href={"/signin"}>
          <Button variant={"primary"} className="h-full w-40 font-inter">
            Sign Up
          </Button>
        </Link>
      </section>
      <Image
        src={FooterImage}
        width={500}
        height={581}
        alt="footer image"
        className="max-lg:hidden w-[36%]"
      />
      <section className="flex justify-between lg:w-[36%] text-sm max-md:gap-3 md:gap-10 lg::-ml-10 text-[#DEDEDE9E]">
        <ul className="flex flex-col gap-3">
          <li className="text-white text-nowrap">Quick Links</li>
          <Link href={"/"}>Home</Link>
          <Link href={"/signin"}>Nerdwork+</Link>
          <Link href={"/events"}>Events</Link>
          <li>Company</li>
        </ul>
        <ul className="flex flex-col gap-3">
          <li className="text-white text-nowrap">Company</li>
          <li>Careers</li>
          <li>Press</li>
          <li>Blog</li>
        </ul>
        <ul className="flex flex-col gap-3">
          <li className="text-white text-nowrap">Support</li>
          <li>Contact Us</li>
          <li>Cookie Policy</li>
          <li>Privacy Policy</li>
          <li>Terms of Service</li>
        </ul>
      </section>
      <section className="flex lg:hidden justify-between items-center w-full">
        <h4 className="text-[15px] text-[#DEDEDE]">NERDWORK</h4>
        <div className="flex gap-3">
          <button>
            <Image src={Facebook} width={24} height={24} alt="socials icons" />
          </button>
          <button>
            <Image src={Instagram} width={24} height={24} alt="socials icons" />
          </button>
          <button>
            <Image src={Twitter} width={24} height={24} alt="socials icons" />
          </button>
        </div>
      </section>
    </footer>
  );
}
