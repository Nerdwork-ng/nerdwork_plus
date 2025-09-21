// middleware.ts
import { NextResponse } from "next/server";
import { auth } from "./auth";

const PROTECTED_PAGES = ["/r", "/creator"];
const ONBOARDING_PREFIX = "/onboarding";

export default auth((req) => {
  const { pathname, origin, search } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  const isCreator = req.auth?.user?.cProfile;
  const isReader = req.auth?.user?.rProfile;
  const isAuthPage = pathname === "/signin";
  const isOnboardingPage = pathname.startsWith(ONBOARDING_PREFIX);
  const isSelectRolePage = pathname === "/role";
  const hasCompletedOnboarding = isCreator || isReader;
  const isDualUser = isCreator && isReader;

  // 1. Unauthenticated users → protect onboarding & role-based pages
  if (!isAuthenticated) {
    if (
      PROTECTED_PAGES.some((p) => pathname.startsWith(p)) ||
      isOnboardingPage
    ) {
      const redirectUrl = new URL("/signin", origin);
      redirectUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  // 2. Authenticated but no profile → force onboarding
  if (!hasCompletedOnboarding && !isOnboardingPage) {
    return NextResponse.redirect(new URL(ONBOARDING_PREFIX, origin));
  }

  // 3. Prevent accessing signin when already authenticated
  if (isAuthPage) {
    if (isDualUser) {
      return NextResponse.redirect(new URL("/role", origin));
    }
    if (isCreator) {
      return NextResponse.redirect(new URL("/creator/comics", origin));
    }
    if (isReader) {
      return NextResponse.redirect(new URL("/r/comics", origin));
    }
  }

  // 4. Onboarding handling
  if (isOnboardingPage) {
    if (isDualUser) {
      return NextResponse.redirect(new URL("/role", origin));
    }

    if (isCreator && pathname.startsWith(`${ONBOARDING_PREFIX}/creator`)) {
      return NextResponse.redirect(new URL("/creator/comics", origin));
    }

    if (isReader && pathname.startsWith(`${ONBOARDING_PREFIX}/reader`)) {
      return NextResponse.redirect(new URL("/r/comics", origin));
    }
  }

  // 5. Role selection page → skip if only one role
  if (isSelectRolePage && !isDualUser) {
    if (isCreator) {
      return NextResponse.redirect(new URL("/creator/comics", origin));
    }
    if (isReader) {
      return NextResponse.redirect(new URL("/r/comics", origin));
    }
  }

  // 6. Role protection (safe because onboarding handled earlier)
  if (pathname.startsWith("/creator") && !isCreator) {
    return NextResponse.redirect(new URL("/r/comics", origin));
  }

  if (pathname.startsWith("/r") && !isReader) {
    return NextResponse.redirect(new URL("/creator/comics", origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|assets|images|fonts|css|public|logo\\.svg).*)",
  ],
};
