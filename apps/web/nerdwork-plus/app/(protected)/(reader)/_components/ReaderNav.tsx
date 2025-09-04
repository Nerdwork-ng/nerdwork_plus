"use client";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { usePathname } from "next/navigation";
import SearchResultsPanel from "./SearchResultsPanel";

const ReaderNav = () => {
  const pathname = usePathname();

  const navItems = [
    { title: "Comics", path: "/r/comics" },
    { title: "Marketplace", path: "/r/marketplace" },
    { title: "Library", path: "/r/library" },
    { title: "Create", path: "/onboarding" },
  ];

  const isActive = (path: string) => {
    if (pathname.startsWith(path) && pathname !== "/") return true;
    return false;
  };

  const [searchQuery, setSearchQuery] = React.useState("");
  const [showResults, setShowResults] = React.useState(false);

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
      <nav className="max-md:hidden z-30 bg-[#151515] border-b border-nerd-default fixed right-0 left-0 w-full font-inter max-2xl:px-5">
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
            <ul className="flex gap-4 text-sm text-nerd-muted">
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
              <CreditCard size={16} /> 100{" "}
              <Image src={NWT} width={16} height={16} alt="nwt" />
            </Link>
            <button className="bg-[#1D1E21] cursor-pointer px-3 py-1.5 rounded-md flex items-center gap-1">
              <span className="h-7 w-7 rounded-full bg-blue-400"></span>{" "}
              0xDEAF...fB8B
            </button>
          </div>
        </section>
      </nav>

      <nav className="md:hidden z-30 fixed right-0 left-0 bg-[#151515] border-b border-nerd-default font-inter flex justify-between items-center h-[68px] px-5">
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
            100 <Image src={NWT} width={16} height={16} alt="nwt" />
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
