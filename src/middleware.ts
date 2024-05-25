import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type Role = keyof typeof roleBasedPrivateRoutes;

const AuthRoutes = ["/login", "/register"];
const commonPrivateRoutes = [
  "/dashboard",
  "/dashboard/change-password",
  "/pets/[petId]",
];
const roleBasedPrivateRoutes = {
  USER: [/^\/dashboard\/user/],
  ADMIN: [/^\/dashboard\/admin/],
  SUPER_ADMIN: [/^\/dashboard\/super-admin/],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log({ pathname });
  const accessToken = cookies().get("accessToken")?.value;

  if (!accessToken) {
    if (AuthRoutes.includes(pathname)) {
      return NextResponse.next();
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  console.log({ pathname });

  if (
    accessToken &&
    (commonPrivateRoutes.includes(pathname) ||
      commonPrivateRoutes.some((route) => pathname.startsWith(route)))
  ) {
    return NextResponse.next();
  }

  let decodedData = null;

  if (accessToken) {
    decodedData = jwtDecode(accessToken) as any;
  }

  const role = decodedData?.role;

  if (role && roleBasedPrivateRoutes[role as Role]) {
    const routes = roleBasedPrivateRoutes[role as Role];
    if (routes.some((route) => pathname.match(route))) {
      return NextResponse.next();
    }
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/login", "/register", "/dashboard/:page*", "/pets/[petId]"],
};
