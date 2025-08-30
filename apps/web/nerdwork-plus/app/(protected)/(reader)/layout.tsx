import { Metadata } from "next";
import ReaderNav from "./_components/ReaderNav";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nerdworkng.com/"),
  title: "Home",
};

export default function CreatorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="bg-[#151515] font-inter text-white min-h-screen">
      <ReaderNav />
      {children}
    </main>
  );
}
