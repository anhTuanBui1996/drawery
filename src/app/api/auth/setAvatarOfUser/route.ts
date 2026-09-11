import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { put, del } from "@vercel/blob";
import { authOptions } from "@/src/lib/auth";
import client from "@/src/lib/db";
import { getTranslations } from "next-intl/server";
import { routing } from "@/src/i18n/routing";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  const locale = req.headers.get("accept-language") || routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Profile" });
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: t("fileNotFound") }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: t("invalidFileType") },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: t("fileExceed50BM") }, { status: 400 });
    }

    const db = client.db(process.env.MONGODB_AUTH_DB_NAME);
    const userId = new ObjectId(session.user.id);

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
    const fileName = `avatars/${session.user.id}-${Date.now()}.${ext}`;

    // Upload lên Vercel Blob, addRandomSuffix: false vì tên đã có timestamp đảm bảo unique
    const blob = await put(fileName, file, {
      access: "public",
      addRandomSuffix: false,
    });

    // Xóa ảnh cũ trên Blob (nếu có và là ảnh do hệ thống tự lưu, không phải ảnh từ Google/Facebook...)
    const user = await db
      .collection("users")
      .findOne({ _id: userId }, { projection: { image: 1 } });

    if (
      user?.image &&
      user.image.includes(".public.blob.vercel-storage.com/")
    ) {
      await del(user.image).catch(() => {
        // Bỏ qua nếu file cũ không tồn tại hoặc đã bị xóa trước đó
        return NextResponse.json(
          { error: t("cantDeleteOldAvatar") },
          { status: 500 },
        );
      });
    }

    await db
      .collection("users")
      .updateOne(
        { _id: userId },
        { $set: { image: blob.url, updatedAt: new Date() } },
      );

    return NextResponse.json({ imageUrl: blob.url });
  } catch (err) {
    console.error("POST /api/auth/setAvatarOfUser error:", err);
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
