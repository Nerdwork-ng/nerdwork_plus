"use client";
import Image from "next/image";
import React, { useEffect } from "react";
import Logo from "@/assets/nerdwork.png";
import Google from "@/assets/socials/google.svg";
import Link from "next/link";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const SignUpClient = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/onboarding";
  const router = useRouter();

  const { status, data: session } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/onboarding");
    }
  }, [status, session, router]);

  return (
    <main className="bg-[#171719] min-h-screen w-full font-inter text-white flex flex-col items-center justify-between py-20 px-5">
           {" "}
      <Link href={"/"}>
                <Image src={Logo} width={146} height={40} alt="nerdwork logo" />
             {" "}
      </Link>
           {" "}
      <section className="w-full max-w-[400px] text-center flex flex-col items-center">
                <h4 className="text-2xl font-semibold">Welcome to Nerdwork+</h4>
               {" "}
        <p className="text-[#707073] text-sm mt-3">New here or coming back?</p> 
             {" "}
        <LoadingButton
          type="button"
          variant={"secondary"}
          className="mt-10 max-w-[352px] w-full flex items-center"
          isLoading={isLoading}
          loadingText="Redirecting to Google..."
          spinnerClassName="mr-3 size-4"
          onClick={async () => {
            try {
              setIsLoading(true);
              await signIn("google", {
                callbackUrl: callbackUrl ?? "/onboarding",
              });
            } finally {
              setIsLoading(false);
            }
          }}
        >
                   {" "}
          <Image src={Google} width={18} height={18} alt="Google logo" />       
            Continue with Google        {" "}
        </LoadingButton>
             {" "}
      </section>
           {" "}
      <p className="text-xs text-[#707073]">
                By continuing, you acknowledge that you have read and agree to
        Nerdwork        {" "}
        <Link
          href={""}
          className="underline hover:no-underline px-1 transition duration-300 hover:ease-in-out"
        >
                    Terms and Conditions        {" "}
        </Link>{" "}
                and        {" "}
        <Link
          href={""}
          className="underline hover:no-underline px-1 transition duration-300 hover:ease-in-out"
        >
                    Privacy Policy        {" "}
        </Link>
             {" "}
      </p>
         {" "}
    </main>
  );
};

export default SignUpClient;
