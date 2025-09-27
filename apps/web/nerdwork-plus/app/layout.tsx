import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import LoadingProvider from "@/components/LoadingProvider";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/components/providers/QueryProvider";
import { SessionProvider } from "next-auth/react";
import { headers } from "next/headers";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const obostar = localFont({
  src: "../public/obostartest-regular.otf",
  variable: "--font-obostar",
});

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: "Nerdwork - Where Passion meets Community",
      template: "%s | Nerdwork",
    },
    description:
      "Nerdwork is a creative entertainment studio and thriving fan community, best known for its annual Nerdwork Comic-Con. Nerdwork is an intersection of storytelling, tech, culture and fandom. Nerdwork celebrates creativity in all forms. We are not just an event, we're the home for fans.",
    // keywords: [],
    authors: [{ name: "Nerdwork Team" }],
    creator: "Nerdwork",
    publisher: "Nerdwork",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: "en_NG",
      url: baseUrl,
      siteName: "Nerdwork",
      title: "Nerdwork - Where Passion meets Community",
      description:
        "Nerdwork is a creative entertainment studio and thriving fan community, best known for its annual Nerdwork Comic-Con. Nerdwork is an intersection of storytelling, tech, culture and fandom. Nerdwork celebrates creativity in all forms. We are not just an event, we're the home for fans.",
      images: [
        {
          url: "/opengraph-image.jpg",
          width: 1200,
          height: 630,
          alt: "Nerdwork",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Nerdwork - Where Passion meets Community",
      description:
        "Nerdwork is a creative entertainment studio and thriving fan community, best known for its annual Nerdwork Comic-Con. Nerdwork is an intersection of storytelling, tech, culture and fandom. Nerdwork celebrates creativity in all forms. We are not just an event, we're the home for fans.",
      creator: "Nerdwork",
      images: ["/twitter-image.jpg"],
    },
    icons: {
      icon: [{ url: "/favicon.ico" }],
    },
    applicationName: "Nerdwork",
    category: "Comic Community",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${obostar.variable} antialiased`}>
        <SessionProvider>
          <QueryProvider>
            <LoadingProvider logoSrc={"/nerdwork.svg"} logoAlt="Nerwork Logo">
              {children}
            </LoadingProvider>
          </QueryProvider>
        </SessionProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
