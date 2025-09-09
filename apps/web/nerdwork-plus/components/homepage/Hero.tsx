import { Button } from "../ui/button";
import { Input } from "../ui/input";
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
          <Link
            target="_blank"
            href={"https://www.straqa.events/nerdworkcomiccon"}
          >
            <Button
              variant={"primary"}
              className="max-md:text-[13px] text-base rounded-[20px] px-5 py-1.5 font-medium"
            >
              Comic Con 2025 is here, Register now
            </Button>
          </Link>
          <h1 className="font-obostar text-[52px] max-md:text-[32px]">
            Where passion
            <br />
            meets community
          </h1>
          <p className="font-semibold max-md:text-sm">
            From comics to conventions, find your people and immerse yourself in
            everything you love.
          </p>
          <form className="max-w-[704px] w-full flex gap-3 justify-center items-stretch">
            <Input
              type="email"
              className="bg-[#17171A] outline-none border-none w-full rounded-[8px] py-2.5 pl-4 w-"
              placeholder="Email address"
            />
            <Link href={"/signin"}>
              <Button variant={"primary"} className="h-full font-inter">
                Sign Up
              </Button>
            </Link>
          </form>
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
