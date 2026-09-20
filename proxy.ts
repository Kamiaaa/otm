import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

const ADMIN_ONLY_PREFIXES = [
  "/dashboard/cars",
  "/dashboard/drivers",
  "/dashboard/employees",
  "/dashboard/assign",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifySessionToken(token) : null;

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isLoginRoute = pathname === "/login";
  const isRegisterRoute = pathname === "/register";

  if (isDashboardRoute && !user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged-in users don't need the login or bootstrap-registration pages.
  // (Whether /register is still open at all — i.e. no admin exists yet —
  // is checked in the page/API route itself, since that needs a DB read.)
  if ((isLoginRoute || isRegisterRoute) && user) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (
    user &&
    user.role !== "admin" &&
    ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
