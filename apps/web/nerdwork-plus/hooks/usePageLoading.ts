"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function usePageLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(true);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [pathname]);

  return isLoading;
}

export function useAdvancedPageLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(true);

    const checkPageReady = () => {
      const checks = [
        // DOM is ready
        () => document.readyState === "complete",
        // No pending images
        () => Array.from(document.images).every((img) => img.complete),
        // No active fetch requests (if you track them)
        () => !document.querySelector('[data-loading="true"]'),
      ];

      const isReady = checks.every((check) => check());

      if (isReady) {
        setIsLoading(false);
      } else {
        setTimeout(checkPageReady, 50);
      }
    };

    setTimeout(checkPageReady, 100);

    const fallbackTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);

    return () => clearTimeout(fallbackTimer);
  }, [pathname]);

  return isLoading;
}
