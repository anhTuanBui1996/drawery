import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import client from "@/src/lib/db";
import { authOptions } from "@/src/lib/auth";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = client.db(process.env.MONGODB_AUTH_DB_NAME);

    // 0. Lấy user id từ email trong session
    //    Giả sử bạn lưu user id trong session, nếu không, bạn cần truy vấn từ DB bằng email
    const findUserByEmail = await db
      .collection("users")
      .findOne({ email: session.user.email });
    if (!findUserByEmail) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userId = findUserByEmail._id;

    // 1. Lấy các provider OAuth đã liên kết (google, github, facebook...)
    //    Đây là các provider mà adapter tự tạo record trong collection "accounts"
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
    console.error("GET /api/account/linked-providers error:", err);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra, vui lòng thử lại" },
      { status: 500 },
    );
  }
}
