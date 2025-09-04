import Image from "next/image";
import React from "react";
import Logo from "@/assets/nerdwork.png";
import Link from "next/link";
import {
  Book,
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
import NWT from "@/assets/nwt.svg";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CreatorNav() {
  return (
    <>
      <nav className="max-md:hidden max-w-[1300px] mx-auto font-inter flex gap-2 justify-between items-center h-[76px] max-2xl:px-5">
        <div className="flex justify-between items-center gap-10">
          <Link href={"/"}>
            <Image src={Logo} width={146} height={40} alt="Nerdwork logo" />
          </Link>
          <ul className="flex gap-4 text-sm">
            <Link href={""}>Comics</Link>
            <Link href={""}>Marketplace</Link>
          </ul>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-gray-500" />
            <Input
              placeholder="Search"
              className="h-[40px] max-w-[400px] pl-5 border border-[#292A2E] rounded-[20px] bg-[#1D1E21]"
            />
          </div>
        </div>
        <div className="flex justify-between items-center gap-3">
          <p className="bg-[#1D1E21] px-3 py-1.5 rounded-[20px] flex items-center gap-1">
            100 <Image src={NWT} width={16} height={16} alt="nwt" />
          </p>
          <button className="bg-[#545558] cursor-pointer rounded-full h-8 w-8 flex items-center justify-center">
            C
          </button>
          <Menubar className="bg-[#1D1E21] font-inter outline-none border-none ring-0 rounded-full">
            <MenubarMenu>
              <MenubarTrigger className="bg-[#1D1E21] data-[state=open]:bg-none h-8 w-8 flex justify-center items-center cursor-pointer rounded-full">
                <Menu size={16} strokeWidth={2} absoluteStrokeWidth={true} />
              </MenubarTrigger>
              <MenubarContent className="bg-[#1D1E21] text-white border-0 absolute -right-[30px]">
                <MenubarItem>
                  <Link className="flex items-center gap-3" href={""}>
                    <User2 className="text-white" />
                    Profile
                  </Link>
                </MenubarItem>
                <MenubarItem>
                  <Link
                    className="flex items-center gap-3"
                    href={"/creator/wallet"}
                  >
                    <Wallet2 className="text-white" /> Wallet
                  </Link>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  <Link className="flex items-center gap-3" href={""}>
                    <UserCog className="text-white" /> Account Settings
                  </Link>
                </MenubarItem>
                <MenubarItem>
                  <Link className="flex items-center gap-3" href={""}>
                    <HelpCircle className="text-white" /> Help Centre
                  </Link>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem className="text-[#707073]">Logout</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </nav>

      {/* Mobile creator navbar */}
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
}
