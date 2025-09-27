import { Button } from "../ui/button";
import Link from "next/link";

export default function Hero() {
  return (
    <header className="relative min-h-screen w-full">
      <div className="absolute inset-0 bg-[url('/hero-bg.png')] bg-cover bg-center bg-no-repeat z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,13,13,0)_0%,#0D0D0D_61.75%)] z-10" />
      <div className="relative z-20 text-white h-screen max-w-[1440px] mx-auto">
        <section
          data-testid="hero"
          className="flex flex-col font-inter text-center -mb-px max-md:gap-6 md:gap-8 items-center justify-end h-screen pb-10 md:pb-32 px-7"
        >
          <h1 className="font-obostar text-[52px] max-md:text-[32px]">
            Where passion
            <br />
            meets community
          </h1>
          <p className="font-semibold max-md:text-sm">
            From comics to conventions, find your people and immerse yourself in
            everything you love.
          </p>

          <Link href={"/signin"}>
            <Button variant={"primary"} className="h-full w-40 font-inter">
              Sign Up
            </Button>
          </Link>
          <p className="text-[#FFFFFFB2] max-md:text-[13px]">
            Step into the ultimate nerd verse:
            <br />
            Explore exclusive comics on the Nerdwork+ platform
            <br />
            Attend the most exciting comic conventions
            <br />
            Connect with one of the largest nerd community
          </p>
        </section>
      </div>
    </header>
  );
}
