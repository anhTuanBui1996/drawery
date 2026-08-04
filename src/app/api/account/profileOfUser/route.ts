import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/src/lib/auth";
import client from "@/src/lib/db";

// Giới hạn độ dài để tránh spam/document quá lớn trong DB
const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 20;
const MAX_BIO_LENGTH = 300;

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = client.db(process.env.MONGODB_AUTH_DB_NAME);
    const userId = new ObjectId(session.user.id);

    const user = await db
      .collection("users")
      .findOne(
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
      return NextResponse.json({ error: "User's not found" }, { status: 404 });
    }

    return NextResponse.json({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      name: user.name || "",
      phone: user.phone || "",
      bio: user.bio || "",
    });
  } catch (err) {
    console.error("GET /api/account/profile error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const bio = typeof body.bio === "string" ? body.bio.trim() : "";

  if (!name) {
    return NextResponse.json(
      { error: "Display name can't be empty" },
      { status: 400 },
    );
  }
  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: "Display name is too long" },
      { status: 400 },
    );
  }
  if (phone.length > MAX_PHONE_LENGTH) {
    return NextResponse.json(
      { error: "Phone number is invalid" },
      { status: 400 },
    );
  }
  if (bio.length > MAX_BIO_LENGTH) {
    return NextResponse.json({ error: "Bio is too long" }, { status: 400 });
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
    console.error("PATCH /api/account/getProfileOfUser error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
