import Image from "next/image";
import React from "react";
import Logo from "@/assets/nerdwork.svg";

const LoaderScreen = () => {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d0d0d] transition-all duration-400 `}
    >
      <div className="flex items-center justify-center animate-bounce">
        <Image
          width={40}
          height={40}
          src={Logo}
          alt={"Nerdwork logo"}
          className="w-16 h-16 object-contain animate-p"
        />
      </div>
      <div className="flex space-x-2 mt-5">
        <div className="dot-animation dot-1"></div>
        <div className="dot-animation dot-2"></div>
        <div className="dot-animation dot-3"></div>
      </div>
    </div>
  );
};

export default LoaderScreen;
