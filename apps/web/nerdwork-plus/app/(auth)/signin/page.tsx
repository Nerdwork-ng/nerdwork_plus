import { Suspense } from "react";
import SignUpClient from "../_components/signin-client";

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpClient />
    </Suspense>
  );
}
