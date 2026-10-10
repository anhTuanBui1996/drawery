import { authOptions } from "@/src/lib/nextauth";
import {
  REALTIME_TOKEN_TTL_SECONDS,
  signRealtimeToken,
} from "@/src/lib/supabase/realtimeToken";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        success: true,
        token: signRealtimeToken(session.user.id),
        expiresIn: REALTIME_TOKEN_TTL_SECONDS,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("GET /api/realtime/token error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
