import Image from "next/image";
import { useEffect, useState } from "react";

interface LoadingScreenProps {
  isLoading: boolean;
  logo?: React.ReactNode;
  logoSrc?: string;
  logoAlt?: string;
}

export default function LoadingScreen({
  isLoading,
  logo,
  logoSrc,
  logoAlt = "Logo",
}: LoadingScreenProps) {
  const [shouldShow, setShouldShow] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setShouldShow(true);
    } else {
      const timer = setTimeout(() => setShouldShow(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!shouldShow) return null;
  return (
    <div
      className={`fixed inset-0 z-[70] flex flex-col items-center justify-center bg-[#0d0d0d] transition-all duration-400 ${
        isLoading ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex items-center justify-center animate-bounce">
        {logo ? (
          logo
        ) : logoSrc ? (
          <Image
            width={40}
            height={40}
            src={logoSrc}
            alt={logoAlt}
            priority
            className="w-16 h-16 object-contain animate-p"
          />
        ) : (
          // Default logo if none provided
          <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">N</span>
          </div>
        )}
      </div>
      <div className="flex space-x-2 mt-5">
        <div className="dot-animation dot-1"></div>
        <div className="dot-animation dot-2"></div>
        <div className="dot-animation dot-3"></div>
      </div>
    </div>
  );
}
