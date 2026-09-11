import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import client from "@/src/lib/db";
import { routing } from "@/src/i18n/routing";
import { getTranslations } from "next-intl/server";

const OAUTH_PROVIDERS = authOptions.providers.map((p) => p.id);

export async function POST(req: Request) {
  const locale = req.headers.get("accept-language") || routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Profile" });
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  const { provider } = await req.json();

  if (!provider || typeof provider !== "string") {
    return NextResponse.json({ error: t("noProviderInfo") }, { status: 400 });
  }

  try {
    const db = client.db(process.env.MONGODB_AUTH_DB_NAME);

    if (OAUTH_PROVIDERS.includes(provider)) {
      const result = await db
        .collection("accounts")
        .deleteOne({ userId: session.user.id, provider });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { error: t("noLinkAccount") },
          { status: 404 },
        );
      }
    } else {
      return NextResponse.json(
        { error: t("invalidProvider") },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/auth/unlinkProvider error:", err);
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
