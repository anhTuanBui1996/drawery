import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import client from "@/src/lib/db";

const OAUTH_PROVIDERS = ["google", "github", "facebook"];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider } = await req.json();

  if (!provider || typeof provider !== "string") {
    return NextResponse.json(
      { error: "Missing provider info" },
      { status: 400 },
    );
  }

  try {
    const db = client.db(process.env.MONGODB_AUTH_DB_NAME);

    if (OAUTH_PROVIDERS.includes(provider)) {
      const result = await db
        .collection("accounts")
        .deleteOne({ userId: session.user.id, provider });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { error: "No linked account found to unlink" },
          { status: 404 },
        );
      }
    } else {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/account/unlink error:", err);
    return NextResponse.json(
      { error: "An error occurred, please try again" },
      { status: 500 },
    );
  }
}
