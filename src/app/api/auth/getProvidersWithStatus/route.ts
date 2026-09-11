import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import client from "@/src/lib/db";
import { authOptions } from "@/src/lib/auth";
import { getTranslations } from "next-intl/server";
import { routing } from "@/src/i18n/routing";

export async function GET(req: Request) {
  const locale = req.headers.get("accept-language") || routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Profile" });
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const db = client.db(process.env.MONGODB_AUTH_DB_NAME);

    const findUserByEmail = await db
      .collection("users")
      .findOne({ email: session.user.email });
    if (!findUserByEmail) {
      return NextResponse.json({ error: t("userNotFound") }, { status: 404 });
    }
    const userId = findUserByEmail._id;

    const oauthAccounts = await db
      .collection("accounts")
      .find({ userId })
      .project({ provider: 1, _id: 0 })
      .toArray();

    const providers = authOptions.providers
      .filter((provider) => provider.id !== "credentials")
      .map((provider) => ({
        id: provider.id,
        name: provider.name,
        isLinked:
          provider.id === "email"
            ? !!findUserByEmail.emailVerified
            : oauthAccounts.some((account) => account.provider === provider.id),
        emailVerified: findUserByEmail.emailVerified,
      }));

    return NextResponse.json({ providers });
  } catch (err) {
    console.error("GET /api/auth/getProvidersWithStatus error:", err);
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
