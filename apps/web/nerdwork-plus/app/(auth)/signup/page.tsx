"use client";

import Image from "next/image";
import React, { useState } from "react";
import Logo from "@/assets/nerdwork.png";
import Google from "@/assets/socials/google.svg";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";

const SignUpPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  const handleGoogleAuth = () => {
    // For now, show modal with signup mode
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleSignIn = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  return (
    <>
      <main className="bg-[#171719] min-h-screen w-full font-inter text-white flex flex-col items-center justify-between py-20 px-5">
        <Link href={"/"}>
          <Image src={Logo} width={146} height={40} alt="nerdwork logo" />
        </Link>

        <section className="w-full max-w-[400px] text-center flex flex-col items-center">
          <h4 className="text-2xl font-semibold">Welcome to Nerdwork+</h4>
          <p className="text-[#707073] text-sm mt-3">New here or coming back?</p>
          
          <div className="w-full flex flex-col gap-4 mt-10">
            {/* Google Auth - Coming Soon */}
            <Button
              variant={"secondary"}
              className="max-w-[352px] w-full flex items-center mx-auto"
              onClick={handleGoogleAuth}
            >
              <Image src={Google} width={16} height={16} alt="Google logo" />
              Continue with Google
            </Button>

            {/* Email Auth Alternative */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#292A2E]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#171719] px-2 text-[#707073]">Or</span>
              </div>
            </div>

            <Button
              variant={"primary"}
              className="max-w-[352px] w-full mx-auto"
              onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
            >
              Continue with Email
            </Button>

            <p className="text-sm text-[#707073] mt-4">
              Already have an account?{' '}
              <button
                onClick={handleSignIn}
                className="text-[#3373D9] hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </section>

        <p className="text-xs text-[#707073]">
          By continuing, you acknowledge that you have read and agree to Nerdwork
          <Link
            href={""}
            className="underline hover:no-underline px-1 transition duration-300 hover:ease-in-out"
          >
            Terms and Conditions
          </Link>{" "}
          and{" "}
          <Link
            href={""}
            className="underline hover:no-underline px-1 transition duration-300 hover:ease-in-out"
          >
            Privacy Policy
          </Link>
        </p>
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
};

export default SignUpPage;
