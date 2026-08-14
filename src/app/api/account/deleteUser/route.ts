import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcrypt";
import client from "@/src/lib/db";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import adapter from "@/src/lib/adapter";
import { authOptions } from "@/src/lib/auth";

export async function DELETE(req: NextRequest) {
  const t = getTranslations("/Profile");
  const session = await getServerSession(authOptions);
  const { email, password, emailConfirmedDeletionCode } = await req.json();

  if (session?.user.email !== email) {
    return NextResponse.json(
      { error: "Server email is not same with session!" },
      { status: 400 },
    );
  }

  const foundUser = await client
    .db(process.env.MONGODB_AUTH_DB_NAME)
    .collection("users")
    .findOne({ email });

  if (!foundUser) {
    return NextResponse.json({ error: "User's not found" }, { status: 404 });
  } else {
    const listProvider = await client
      .db(process.env.MONGODB_AUTH_DB_NAME)
      .collection("accounts")
      .find({ userId: foundUser._id })
      .project({ provider: 1 })
      .toArray();
    if (!(await compare(password, foundUser.password))) {
      return NextResponse.json(
        { error: "Incorrect password!" },
        { status: 400 },
      );
    } else {
      if (foundUser.emailConfirmedDeletionCode !== emailConfirmedDeletionCode) {
        return NextResponse.json(
          { error: "Confirmation code's incorrect" },
          { status: 400 },
        );
      } else {
        let deletedAccountCount = 0;
        listProvider.forEach(async (provider) => {
          let res = await fetch("/api/account/unlinkProvider", {
            method: "POST",
            body: JSON.stringify({ provider }),
          });
          let { success } = await res.json();
          if (success) {
            deletedAccountCount++;
          }
        });
        if (deletedAccountCount === listProvider.length) {
          const deletedUser = await adapter.deleteUser!(
            foundUser._id.toString(),
          );
          if (deletedUser) {
            return NextResponse.json({ success: true });
          } else {
            return NextResponse.json(
              {
                error: "Can't delete this user",
              },
              { status: 500 },
            );
          }
        } else {
          return NextResponse.json(
            {
              error: "Can't delete accounts for this user",
            },
            { status: 500 },
          );
        }
        //TODO: Xóa toàn bộ thông tin của user
      }
    }
  }
}
