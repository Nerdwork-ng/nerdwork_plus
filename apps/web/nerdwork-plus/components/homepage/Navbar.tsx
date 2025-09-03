"use client";
import Image from "next/image";
import React from "react";
import Logo from "@/assets/nerdwork.png";
import { Button } from "@/components/ui/button";
import { MenuIcon, X, User, LogOut, Wallet } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useWallet } from "@/lib/wallet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  
  const { user, isAuthenticated, logout } = useAuth();
  const { nwtBalance } = useWallet();

  const handleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <nav className="bg-[#0D0D0D1A] z-30 text-white fixed right-0 left-0 w-full border-b border-[#FFFFFF1A] backdrop-blur-[2px]">
      <section className="max-w-[1600px] mx-auto">
        <section className="lg:flex hidden gap-4 font-inter font-semibold justify-between h-[93px] items-center px-6">
          <Link href={"/"}>
            <Image src={Logo} width={146} height={40} alt="nerdwork logo" />
          </Link>
          <ul className="flex gap-10 items-center">
            <Link href={"/communities"} className="hover:opacity-75">
              Communities
            </Link>
            <Link href={"/nerdwork+"} className="hover:opacity-75">
              Nerdwork+
            </Link>
            <Link
              href={"/events"}
              className="flex items-center gap-2 hover:opacity-75"
            >
              Comic Con 2025{" "}
              <span className="bg-[#1BDB6C] font-medium px-2 pb-0.5 text-black rounded-[6px]">
                Soon
              </span>
            </Link>
            <Link href={"/events"} className="hover:opacity-75">
              Events
            </Link>
            <li>Company</li>
          </ul>
          <div className="flex gap-4 items-center">
            {isAuthenticated ? (
              <>
                {/* Wallet Balance */}
                <div className="flex items-center gap-2 text-sm">
                  <Wallet className="h-4 w-4 text-[#1BDB6C]" />
                  <span>{parseFloat(nwtBalance).toFixed(2)} NWT</span>
                </div>
                
                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{user?.username || user?.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#1D1E21] border-[#292A2E]">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="text-white hover:bg-[#292A2E]">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wallet" className="text-white hover:bg-[#292A2E]">
                        <Wallet className="mr-2 h-4 w-4" />
                        Wallet
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#292A2E]" />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="text-white hover:bg-[#292A2E] cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button asChild>
                  <Link href="/signup">Log In</Link>
                </Button>
                <Button asChild variant={"primary"}>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </section>

        {/* Mobile navbar */}
        <section className="max-lg:flex relative lg:hidden border-b border-[#FFFFFF1A] font-inter font-semibold justify-between h-[88px] items-center px-6">
          <Link href={"/"}>
            <Image src={Logo} width={146} height={40} alt="nerdwork logo" />
          </Link>
          <button onClick={handleMenu}>
            <MenuIcon />
          </button>
          {isOpen && (
            <div className="absolute right-0 top-0 flex flex-col w-full gap-8 bg-[#0D0D0D] px-5 py-7">
              <div className="flex justify-between items-center">
                <Link href={"/"}>
                  <Image
                    src={Logo}
                    width={146}
                    height={40}
                    alt="nerdwork logo"
                  />
                </Link>
                <button onClick={handleMenu} className="">
                  <X />
                </button>
              </div>
              <ul className="flex flex-col gap-7">
                <Link href={"/communities"}>Communities</Link>
                <Link href={"/nerdwork+"} className="hover:opacity-75">
                  Nerdwork+
                </Link>
                <Link href={"/events"} className="flex items-center gap-2">
                  Comic Con 2025{" "}
                  <span className="bg-[#1BDB6C] font-medium px-2 pb-0.5 text-black rounded-[6px]">
                    Soon
                  </span>
                </Link>
                <Link href={"/events"} className="hover:opacity-75">
                  Events
                </Link>
                <li>Company</li>
              </ul>
              <div className="flex justify-between gap-4 w-full">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-[#1BDB6C]">
                      <Wallet className="h-4 w-4" />
                      <span>{parseFloat(nwtBalance).toFixed(2)} NWT</span>
                    </div>
                    <Button onClick={handleLogout} className="bg-red-600 w-1/2">
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild className="bg-[#343435] w-1/2">
                      <Link href="/signup">Log In</Link>
                    </Button>
                    <Button asChild className="bg-[#3373D9] w-1/2">
                      <Link href="/signup">Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      </section>
    </nav>
  );
}
