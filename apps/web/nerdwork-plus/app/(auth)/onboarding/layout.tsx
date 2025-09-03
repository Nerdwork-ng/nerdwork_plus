import AuthNav from "../_components/AuthNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <main className="bg-[#171719] text-white min-h-screen py-16">
        <AuthNav />
        {children}
      </main>
    </ProtectedRoute>
  );
}
