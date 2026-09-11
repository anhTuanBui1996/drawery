import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/src/lib/auth";
import client from "@/src/lib/db";
import { routing } from "@/src/i18n/routing";
import { getTranslations } from "next-intl/server";

// Giới hạn độ dài để tránh spam/document quá lớn trong DB
const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 20;
const MAX_BIO_LENGTH = 300;

export async function GET(req: Request) {
  const locale = req.headers.get("accept-language") || routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Profile" });
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = client.db(process.env.MONGODB_AUTH_DB_NAME);
    const userId = new ObjectId(session.user.id);

    const user = await db.collection("users").findOne(
      { _id: userId },
      {
        projection: {
          firstName: 1,
          lastName: 1,
          name: 1,
          phone: 1,
          bio: 1,
          _id: 0,
        },
      },
    );

    if (!user) {
      return NextResponse.json({ error: t("userNotFound") }, { status: 404 });
    }

    return NextResponse.json({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      name: user.name || "",
      phone: user.phone || "",
      bio: user.bio || "",
    });
  } catch (err) {
    console.error("GET /api/auth/profileOfUser error:", err);
    return NextResponse.json(
      { error: t("internalServerError") },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const locale = req.headers.get("accept-language") || routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Profile" });
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const bio = typeof body.bio === "string" ? body.bio.trim() : "";

  if (!name) {
    return NextResponse.json({ error: t("nameRequired") }, { status: 400 });
  }
  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: t("displayNameTooLong") },
      { status: 400 },
    );
  }
  if (phone.length > MAX_PHONE_LENGTH) {
    return NextResponse.json({ error: t("invalidPhone") }, { status: 400 });
  }
  if (bio.length > MAX_BIO_LENGTH) {
    return NextResponse.json({ error: t("bioTooLong") }, { status: 400 });
  }

  try {
    const db = client.db(process.env.MONGODB_AUTH_DB_NAME);
    const userId = new ObjectId(session.user.id);

    await db
      .collection("users")
      .updateOne(
        { _id: userId },
        { $set: { name, phone, bio, updatedAt: new Date() } },
      );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/auth/profileOfUser error:", err);
    return NextResponse.json(
      { error: t("internalServerError") },
      { status: 500 },
    );
  }
}
