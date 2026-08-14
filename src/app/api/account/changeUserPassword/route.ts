import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import adapter from "@/src/lib/adapter";
import { ExtendedAdapterUser } from "@/src/types/auth/ExtendedAdapterUser";
import { compare, hash } from "bcrypt";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/src/lib/auth";
import ChangePasswordDTO from "@/src/types/account/ChangePasswordDTO";

export async function POST(req: NextRequest) {
  const t = await getTranslations("/Profile");
  try {
    const session = await getServerSession(authOptions);
    const { oldPassword, newPassword } =
      (await req.json()) as ChangePasswordDTO;
    const email = session?.user.email;
    if (!email) {
      return NextResponse.json({ error: "Email is invalid!" }, { status: 400 });
    }
    if (!process.env.APP_URL) {
      return NextResponse.json(
        { error: "App url is invalid!" },
        { status: 400 },
      );
    }

    const foundUser = (await adapter.getUserByEmail!(
      email,
    )) as ExtendedAdapterUser;

    if (!foundUser) {
      return NextResponse.json({ error: "User's not found!" }, { status: 400 });
    } else {
      if (!foundUser.password) {
        return NextResponse.json(
          { error: "User's not found!" },
          { status: 400 },
        );
      } else {
        if (!(await compare(oldPassword, foundUser.password))) {
          return NextResponse.json(
            { error: t("passwordIsIncorrect") },
            { status: 400 },
          );
        } else {
          const hashed = await hash(
            newPassword,
            process.env.PASSWORD_SALT_ROUND || 10,
          );
          foundUser.password = hashed;
          const updatedUser = (await adapter.updateUser!(
            foundUser,
          )) as ExtendedAdapterUser;
          if (!updatedUser || updatedUser.password !== hashed) {
            return NextResponse.json(
              { error: "Can't update password!" },
              { status: 400 },
            );
          }
        }
      }
    }

    return NextResponse.json({ success: true, newPassword });
  } catch (err) {
    console.error("POST /api/account/changeUserPassword error:", err);
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
