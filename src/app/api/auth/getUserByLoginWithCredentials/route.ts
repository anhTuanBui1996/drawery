import { NextResponse } from "next/server";
import { compare } from "bcrypt";
import client from "@/src/lib/db";
import { ExtendedAdapterUser } from "@/src/types/model/ExtendedAdapterUser";
import adapter from "@/src/lib/adapter";

export async function POST(req: Request) {
  try {
    const { username, password }: { username: string; password: string } =
      await req.json();

    if (!username || !password) {
      return NextResponse.json({ status: 400 });
    }

    let existingUser: ExtendedAdapterUser | any = null;
    if (username.includes("@")) {
      // Check if email exists
      existingUser = await adapter.getUserByEmail!(username);
    } else {
      // Check if username exists
      existingUser = await client
        .db("auth")
        .collection("users")
        .findOne({ username });
    }
    if (!existingUser) {
      return NextResponse.json({ status: 500 });
    }

    // Hash password
    if (await compare(password, existingUser.password)) {
      return NextResponse.json({ success: true, user: existingUser });
    } else {
      return NextResponse.json({ status: 401 });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: 500 });
  }
}
