import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import client from "@/src/lib/db";
import { ExtendedAdapterUser } from "@/src/types/ExtendedAdapterUser";
import { ObjectId } from "mongodb";
import { getTranslations } from "next-intl/server";
import { AdapterAccount } from "@auth/core/adapters";

const adapter = MongoDBAdapter(client, { databaseName: "auth" });

export async function POST(req: Request) {
  const t = await getTranslations("SignIn");
  try {
    const { firstName, lastName, email, password, username } =
      (await req.json()) as ExtendedAdapterUser;

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: t("alertPleaseFill") },
        { status: 400 },
      );
    }

    // Check if email exists
    let existingUserWithEmail = await adapter.getUserByEmail!(email);
    if (existingUserWithEmail) {
      return NextResponse.json(
        { error: t("alertEmailAlreadyRegistered") },
        { status: 400 },
      );
    }

    // Check if username exists
    let existingUserWithUsername = await client
      .db("auth")
      .collection("users")
      .findOne({ username });
    if (existingUserWithUsername) {
      return NextResponse.json(
        { error: t("alertUsernameAlreadyRegistered") },
        { status: 400 },
      );
    }

    // Hash password
    const hashed = await hash(password, 10);
    const newUser: ExtendedAdapterUser = {
      id: new ObjectId().toString(),
      emailVerified: null,
      firstName,
      lastName,
      username,
      email,
      password: hashed,
      createdAt: new Date(),
    };

    let createdUser = await adapter.createUser!(newUser);
    if (createdUser) {
      return NextResponse.json({
        success: true,
        user: createdUser,
      });
    }

    return NextResponse.json(
      { error: t("alertCannotCreateUser") },
      { status: 500 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
