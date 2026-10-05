import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/env";

// Runs only for /admin. Refreshes the Supabase session cookie and sends
// signed-out visitors to the login page. This is an optimistic check: every
// admin page and action verifies staff membership again on the server.
export async function proxy(request: NextRequest) {
  const isLogin = request.nextUrl.pathname === "/admin/login";
  if (!supabaseConfigured()) {
    return isLogin ? NextResponse.next() : NextResponse.redirect(new URL("/admin/login", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  if (!signedIn && !isLogin) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  if (signedIn && isLogin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
