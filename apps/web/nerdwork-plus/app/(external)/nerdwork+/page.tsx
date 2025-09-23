import FAQ from "@/components/homepage/FAQ";
import Footer from "@/components/homepage/Footer";
import ProductHero from "@/components/nerdwork+/Hero";
import Stories from "@/components/nerdwork+/Stories";
import Waitlist from "@/components/nerdwork+/Waitlist";
import React from "react";

// Test deployment trigger - enhanced CI/CD pipeline
export default function Product() {
  return (
    <div className="bg-[#0D0D0D]">
      <ProductHero />
      <Stories />
      <FAQ />
      <Waitlist />
      <Footer />
    </div>
  );
}
