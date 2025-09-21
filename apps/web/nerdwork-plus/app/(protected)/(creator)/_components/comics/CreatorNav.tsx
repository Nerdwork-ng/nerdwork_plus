"use client";
import Image from "next/image";
import React from "react";
import Logo from "@/assets/nerdwork.png";
import Link from "next/link";
import {
  BookMarkedIcon,
  LibraryBig,
  Menu,
  // HelpCircle,
  // UserCog,
  // Plus,
  Search,
  ShoppingBag,
  User2,
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
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserSession } from "@/lib/api/queries";

export default function CreatorNav() {
  const { data: session } = useSession();
  const user = session?.user;
  const { profile } = useUserSession();
  const creatorProfile = profile?.creatorProfile;

  const handleSignOut = () => {
    toast.success("Logging out...");
    signOut({ callbackUrl: "/signin" });
  };
  return (
    <>
      <nav className="max-md:hidden max-w-[1300px] mx-auto font-inter flex gap-2 justify-between items-center h-[76px] max-2xl:px-5">
        <div className="flex justify-between items-center gap-10">
          <Link href={"/"}>
            <Image src={Logo} width={146} height={40} alt="Nerdwork logo" />
          </Link>
          <ul className="flex gap-4 text-sm">
            <Link href={"/r/comics"}>Comics</Link>
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
          <Link
            href={"/creator/wallet"}
            className="bg-[#1D1E21] px-3 py-1.5 rounded-[20px] flex items-center gap-1"
          >
            {creatorProfile?.walletBalance ?? ""}
            <Image src={NWT} width={16} height={16} alt="nwt" />
          </Link>
          <Avatar>
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
          <Menubar className="bg-[#1D1E21] font-inter outline-none border-none ring-0 rounded-full">
            <MenubarMenu>
              <MenubarTrigger className="bg-[#1D1E21] data-[state=open]:bg-none h-8 w-8 flex justify-center items-center cursor-pointer rounded-full">
                <Menu size={16} strokeWidth={2} absoluteStrokeWidth={true} />
              </MenubarTrigger>
              <MenubarContent className="bg-[#1D1E21] text-white border-0 absolute -right-[30px]">
                <div className="text-sm p-2">
                  <p>{creatorProfile?.creatorName}</p>
                  <p className="text-nerd-muted">{user?.email}</p>
                </div>
                <MenubarSeparator />
                <MenubarItem asChild>
                  <Link
                    className="cursor-pointer hover:bg-nerd-default flex items-center gap-3 w-full"
                    href={"/creator/profile"}
                  >
                    <User2 className="text-white" />
                    Profile
                  </Link>
                </MenubarItem>
                <MenubarItem asChild>
                  <Link
                    className="cursor-pointer flex items-center gap-3 w-full"
                    href={"/creator/wallet"}
                  >
                    <Wallet2 className="text-white" /> Wallet
                  </Link>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem asChild>
                  <Link
                    className="cursor-pointer flex items-center gap-3 w-full"
                    href={"/r/comics"}
                  >
                    Switch to Reader Mode
                  </Link>
                </MenubarItem>
                <MenubarSeparator />
                {/* <MenubarItem asChild>
                  <Link className="cursor-pointer flex items-center gap-3 w-full" href={""}>
                    <UserCog className="text-white" /> Account Settings
                  </Link>
                </MenubarItem>
                <MenubarItem asChild>
                  <Link className="cursor-pointer flex items-center gap-3 w-full" href={""}>
                    <HelpCircle className="text-white" /> Help Centre
                  </Link>
                </MenubarItem>
                <MenubarSeparator /> */}
                <MenubarItem
                  onClick={handleSignOut}
                  className="text-[#707073] cursor-pointer"
                >
                  Logout
                </MenubarItem>
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
          <Link
            href={"/creator/wallet"}
            className="bg-[#1D1E21] px-3 py-1.5 rounded-[20px] text-sm flex items-center gap-1"
          >
            {creatorProfile?.walletBalance ?? ""}
            <Image src={NWT} width={16} height={16} alt="nwt" />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="bg-[#1D1E21] h-8 w-8 flex justify-center items-center cursor-pointer rounded-full outline-none border-none ring-0">
              <Menu size={16} strokeWidth={2} absoluteStrokeWidth={true} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1D1E21] text-white border-0 mx-5 w-[250px] mt-2">
              <div className="text-sm p-2">
                <p>{creatorProfile?.creatorName}</p>
                <p className="text-nerd-muted">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  className="cursor-pointer flex items-center gap-3"
                  href={"/r/comics"}
                >
                  <LibraryBig className="text-white" /> Comics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  className="cursor-pointer flex items-center gap-3"
                  href={""}
                >
                  <ShoppingBag className="text-white" /> Marketplace
                </Link>
              </DropdownMenuItem>
              {/* <DropdownMenuItem asChild>
                <Link className="cursor-pointer flex items-center gap-3" href={""}>
                  <Book className="text-white" /> Library
                </Link>
              </DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  className="flex items-center gap-3"
                  href={"/creator/comics"}
                >
                  <BookMarkedIcon className="text-white" />
                  My Comics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  className="flex items-center gap-3"
                  href={"/creator/profile"}
                >
                  <User2 className="text-white" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  className="flex items-center gap-3 w-full"
                  href={"/creator/wallet"}
                >
                  <Wallet2 className="text-white" /> Wallet
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* <DropdownMenuItem asChild>
                <Link className="cursor-pointer flex items-center gap-3" href={""}>
                  <UserCog className="text-white" /> Account Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link className="cursor-pointer flex items-center gap-3" href={""}>
                  <HelpCircle className="text-white" /> Help Centre
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator /> */}
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-[#707073] cursor-pointer"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </>
  );
}
