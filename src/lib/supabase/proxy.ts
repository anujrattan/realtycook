import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getSupabasePublicEnv,
  SESSION_ACTIVITY_COOKIE,
  SESSION_IDLE_MS,
} from "@/lib/supabase/env";

export type AuthGateResult = {
  response: NextResponse;
  userId: string | null;
  mustResetPassword: boolean;
  inactive: boolean;
};

/**
 * Refresh Supabase session cookies and enforce app-level 7-day inactivity
 * (Free plan substitute for Auth "inactivity timeout").
 */
export async function updateSession(request: NextRequest): Promise<AuthGateResult> {
  let supabaseResponse = NextResponse.next({ request });
  const { url, anonKey, configured } = getSupabasePublicEnv();

  if (!configured) {
    return {
      response: supabaseResponse,
      userId: null,
      mustResetPassword: false,
      inactive: false,
    };
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as
    | {
        sub?: string;
        app_metadata?: { must_reset_password?: boolean | string };
      }
    | undefined;

  const userId = claims?.sub ?? null;
  const mustResetRaw = claims?.app_metadata?.must_reset_password;
  const mustResetPassword =
    mustResetRaw === true || mustResetRaw === "true" || mustResetRaw === "1";

  let inactive = false;
  if (userId) {
    const lastRaw = request.cookies.get(SESSION_ACTIVITY_COOKIE)?.value;
    const lastMs = lastRaw ? Number(lastRaw) : NaN;
    const now = Date.now();
    if (Number.isFinite(lastMs) && now - lastMs > SESSION_IDLE_MS) {
      inactive = true;
      await supabase.auth.signOut();
      supabaseResponse.cookies.set(SESSION_ACTIVITY_COOKIE, "", {
        path: "/",
        maxAge: 0,
      });
      return {
        response: supabaseResponse,
        userId: null,
        mustResetPassword: false,
        inactive: true,
      };
    }

    // Sliding window: any authenticated request extends activity for 7 more days.
    supabaseResponse.cookies.set(SESSION_ACTIVITY_COOKIE, String(now), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: Math.floor(SESSION_IDLE_MS / 1000),
    });
  }

  return {
    response: supabaseResponse,
    userId,
    mustResetPassword,
    inactive,
  };
}
