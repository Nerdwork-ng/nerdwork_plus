"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
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
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Book,
  BookOpen,
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
import { usePathname } from "next/navigation";
import SearchResultsPanel from "./SearchResultsPanel";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserSession } from "@/lib/api/queries";
import { Profile } from "@/lib/types/user.types";

const ReaderNav = () => {
  const pathname = usePathname();

  const navItems = [
    { title: "Comics", path: "/r/comics" },
    { title: "Marketplace", path: "/r/marketplace" },
    { title: "Library", path: "/r/library" },
    // { title: "Create", path: "/onboarding" },
  ];

  const isActive = (path: string) => {
    if (pathname.startsWith(path) && pathname !== "/") return true;
    return false;
  };

  const handleSignOut = () => {
    toast.success("Logging out...");
    signOut({ callbackUrl: "/signin" });
  };

  const [searchQuery, setSearchQuery] = React.useState("");
  const [showResults, setShowResults] = React.useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const isReadingRoute = /^\/r\/comics\/[^/]+\/chapter\/[^/]+$/.test(pathname);
  const { data: session } = useSession();
  const user = session?.user;
  const { profile } = useUserSession();

  const readerProfile: Profile = profile;

  useEffect(() => {
    if (!isReadingRoute) {
      setShowNavbar(true);
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY, isReadingRoute]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowResults(query.length > 0);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowResults(false);
    }, 250);
  };

  const handleFocus = () => {
    if (searchQuery.length > 0) {
      setShowResults(true);
    }
  };

  return (
    <>
      <nav
        className={`max-md:hidden transition-transform duration-300 ${
          showNavbar ? "translate-y-0" : "-translate-y-full"
        } z-30 bg-[#151515] border-b border-nerd-default fixed right-0 left-0 w-full font-inter max-2xl:px-5`}
      >
        <section className="max-w-[1200px] mx-auto flex gap-2 justify-between items-center h-[76px]">
          <div className="flex justify-between items-center gap-10">
            <Link href={"/"}>
              <Image src={Logo} width={146} height={40} alt="Nerdwork logo" />
            </Link>
            <div className="relative flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search"
                  className="h-[40px] min-w-[240px] max-w-[400px] pl-5 border-none rounded-md bg-[#1E1E1E66]"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                />
              </div>
              {showResults && <SearchResultsPanel query={searchQuery} />}
            </div>
            <ul className="flex gap-4 text-sm text-nerd-muted max-lg:hidden">
              {navItems.map((item, index) => (
                <Link
                  href={item.path}
                  key={index}
                  className={`hover:text-neutral-400 transition-colors duration-300 cursor-pointer ${
                    isActive(item.path) ? "text-white" : ""
                  }`}
                >
                  {item.title}
                </Link>
              ))}
            </ul>
          </div>

          <div className="flex justify-between items-stretch gap-3 text-sm">
            <Link
              href={"/r/wallet"}
              className="bg-[#1D1E21] cursor-pointer px-3 py-1.5 rounded-md flex items-center gap-2"
            >
              <CreditCard size={16} /> {readerProfile?.walletBalance ?? ""}
              <Image src={NWT} width={16} height={16} alt="nwt" />
            </Link>
            <button
              type="button"
              className="bg-[#1D1E21] cursor-pointer px-3 py-1.5 rounded-md flex items-center gap-1"
            >
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
              {readerProfile?.walletId
                ? readerProfile?.walletId.slice(0, 3) +
                  "..." +
                  readerProfile?.walletId.slice(-3)
                : ""}
            </button>
            <Menubar className="bg-[#1D1E21] font-inter outline-none border-none ring-0 rounded-full">
              <MenubarMenu>
                <MenubarTrigger className="bg-[#1D1E21] data-[state=open]:bg-none h-8 w-8 flex justify-center items-center cursor-pointer rounded-full">
                  <Menu size={16} strokeWidth={2} absoluteStrokeWidth={true} />
                </MenubarTrigger>
                <MenubarContent className="bg-[#1D1E21] text-white border-0 absolute -right-[30px]">
                  <MenubarItem>
                    <Link
                      className="flex items-center gap-3"
                      href={"/r/comics"}
                    >
                      <Book className="text-white" />
                      Comics
                    </Link>
                  </MenubarItem>
                  <MenubarItem>
                    <Link
                      className="flex items-center gap-3"
                      href={"/r/library"}
                    >
                      <BookOpen className="text-white" />
                      Library
                    </Link>
                  </MenubarItem>
                  <MenubarItem>
                    <Link className="flex items-center gap-3" href={""}>
                      <User2 className="text-white" />
                      Profile
                    </Link>
                  </MenubarItem>
                  <MenubarItem>
                    <Link
                      className="flex items-center gap-3"
                      href={"/r/wallet"}
                    >
                      <Wallet2 className="text-white" /> Wallet
                    </Link>
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>
                    <Link
                      className="flex items-center gap-3"
                      href={"/onboarding"}
                    >
                      <Plus className="text-white" /> Become a Creator
                    </Link>
                  </MenubarItem>
                  <MenubarSeparator />
                  {/* <MenubarItem>
                    <Link className="flex items-center gap-3" href={""}>
                      <UserCog className="text-white" /> Account Settings
                    </Link>
                  </MenubarItem>
                  <MenubarItem>
                    <Link className="flex items-center gap-3" href={""}>
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
        </section>
      </nav>

      <nav
        className={`md:hidden transition-transform duration-300 ${
          showNavbar ? "translate-y-0" : "-translate-y-full"
        } z-30 fixed right-0 left-0 bg-[#151515] border-b border-nerd-default font-inter flex justify-between items-center h-[68px] px-5`}
      >
        <Link href={"/"}>
          <Image src={Logo} width={120} height={24} alt="Nerdwork logo" />
        </Link>

        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger>
              <Search size={16} />
            </PopoverTrigger>
            <PopoverContent className=" bg-[#151515] !z-40 text-white border border-[#FFFFFF0D] w-full">
              <div className="">
                <Input
                  id="searchQuery"
                  type="text"
                  placeholder="Search"
                  className="h-[40px] min-w-[300px] max-w-[400px] pl-5 border-none rounded-md bg-[#1E1E1E66]"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                />
                {showResults && <SearchResultsPanel query={searchQuery} />}
              </div>
            </PopoverContent>
          </Popover>

          <p className="bg-[#1D1E21] px-3 py-1.5 rounded-[20px] text-sm flex items-center gap-1">
            {readerProfile?.walletBalance ?? ""}
            <Image src={NWT} width={16} height={16} alt="nwt" />
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger className="bg-[#1D1E21] h-8 w-8 flex justify-center items-center cursor-pointer rounded-full outline-none border-none ring-0">
              <Menu size={16} strokeWidth={2} absoluteStrokeWidth={true} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1D1E21] text-white border-0 mx-5 w-[250px] mt-2">
              <DropdownMenuItem>
                <Link className="flex items-center gap-3" href={"/r/comics"}>
                  <LibraryBig className="text-white" /> Comics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  className="flex items-center gap-3"
                  href={"/r/marketplace"}
                >
                  <ShoppingBag className="text-white" /> Marketplace
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link className="flex items-center gap-3" href={"/r/library"}>
                  <Book className="text-white" /> Library
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link className="flex items-center gap-3" href={""}>
                  <User2 className="text-white" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link className="flex items-center gap-3" href={"/r/wallet"}>
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
                <Link className="flex items-center gap-3" href={"/onboarding"}>
                  <Plus className="text-white" /> Become a Creator
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
};

export default ReaderNav;
