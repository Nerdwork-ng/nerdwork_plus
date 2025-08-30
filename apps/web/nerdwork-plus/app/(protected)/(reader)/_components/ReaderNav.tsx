import Image from "next/image";
import Link from "next/link";
import React from "react";
import Logo from "@/assets/nerdwork.png";
import NWT from "@/assets/nwt.svg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Book,
  CreditCard,
  HelpCircle,
  LibraryBig,
  Menu,
  Plus,
  Search,
  ShoppingBag,
  User2,
  UserCog,
  Wallet2,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const ReaderNav = () => {
  return (
    <>
      <nav className="max-md:hidden z-30 bg-[#151515] border-b border-nerd-default fixed right-0 left-0 w-full font-inter max-2xl:px-5">
        <section className="max-w-[1600px] mx-auto flex gap-2 justify-between items-center h-[76px]">
          <div className="flex justify-between items-center gap-10">
            <Link href={"/"}>
              <Image src={Logo} width={146} height={40} alt="Nerdwork logo" />
            </Link>
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-gray-500" />
                <Input
                  placeholder="Search"
                  className="h-[40px] max-w-[400px] pl-5 border border-[#292A2E] rounded-md bg-[#1D1E21]"
                />
              </div>
            </div>
            <ul className="flex gap-4 text-sm text-nerd-muted">
              <Link href={"/r/comics"}>Comics</Link>
              <Link href={"/r/marketplace"}>Marketplace</Link>
              <Link href={"/r/library"}>Library</Link>
              <Link href={"/onboarding"}>Create</Link>
            </ul>
          </div>

          <div className="flex justify-between items-stretch gap-3 text-sm">
            <button className="bg-[#1D1E21] cursor-pointer px-3 py-1.5 rounded-md flex items-center gap-2">
              <CreditCard size={16} /> 100{" "}
              <Image src={NWT} width={16} height={16} alt="nwt" />
            </button>
            <button className="bg-[#1D1E21] cursor-pointer px-3 py-1.5 rounded-md flex items-center gap-1">
              <span className="h-7 w-7 rounded-full bg-blue-400"></span>{" "}
              0xDEAF...fB8B
            </button>
          </div>
        </section>
      </nav>

      <nav className="md:hidden font-inter flex justify-between items-center h-[68px] mx-5">
        <Link href={"/"}>
          <Image src={Logo} width={120} height={24} alt="Nerdwork logo" />
        </Link>

        <div className="flex items-center gap-3">
          <Search size={16} />
          <p className="bg-[#1D1E21] px-3 py-1.5 rounded-[20px] text-sm flex items-center gap-1">
            100 <Image src={NWT} width={16} height={16} alt="nwt" />
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger className="bg-[#1D1E21] h-8 w-8 flex justify-center items-center cursor-pointer rounded-full outline-none border-none ring-0">
              <Menu size={16} strokeWidth={2} absoluteStrokeWidth={true} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1D1E21] text-white border-0 mx-5 w-[250px] mt-2">
              <DropdownMenuItem>
                <Link className="flex items-center gap-3" href={""}>
                  <LibraryBig className="text-white" /> Comics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link className="flex items-center gap-3" href={""}>
                  <ShoppingBag className="text-white" /> Marketplace
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link className="flex items-center gap-3" href={""}>
                  <Book className="text-white" /> Library
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link className="flex items-center gap-3" href={""}>
                  <User2 className="text-white" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link className="flex items-center gap-3" href={""}>
                  <Wallet2 className="text-white" /> Wallet
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link className="flex items-center gap-3" href={""}>
                  <UserCog className="text-white" /> Account Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link className="flex items-center gap-3" href={""}>
                  <HelpCircle className="text-white" /> Help Centre
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link className="flex items-center gap-3" href={""}>
                  <Plus className="text-white" /> Become a Creator
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-[#707073]">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </>
  );
};

export default ReaderNav;
