import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session tokens
  await supabase.auth.getSession();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // If user is authenticated, query profile to determine role
  let role = "admin";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role) {
      role = profile.role.toLowerCase();
    }
  }

  // If logged-in user visits /login, redirect based on their role
  if (user && pathname === "/login") {
    if (role === "client") {
      return NextResponse.redirect(new URL("/client-portal", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow public access to login and reset pages
  if (
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/"
  ) {
    return response;
  }

  // Protected routes
  const protectedRoutes = [
    "/dashboard",
    "/clients",
    "/documents",
    "/engagements",
    "/invoices",
    "/calendar",
    "/settings",
    "/client-portal",
  ];

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!user && isProtected) {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Role-based route authorization
  if (user) {
    if (role === "client") {
      // Clients can only access /client-portal
      if (!pathname.startsWith("/client-portal")) {
        return NextResponse.redirect(new URL("/client-portal", request.url));
      }
    } else if (role === "accountant") {
      // Accountants can access operational pages but not /settings
      if (pathname.startsWith("/settings")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/forgot-password",
    "/reset-password",
    "/dashboard/:path*",
    "/clients/:path*",
    "/documents/:path*",
    "/engagements/:path*",
    "/invoices/:path*",
    "/calendar/:path*",
    "/settings/:path*",
    "/client-portal/:path*",
  ],
};